import { jsPDF } from "jspdf";

export function downloadMarkdown(filename: string, markdown: string, meta?: { title?: string; subject?: string }) {
  const header = meta?.title
    ? `# ${meta.title}\n${meta.subject ? `_Subject: ${meta.subject}_\n` : ""}_Generated: ${new Date().toLocaleString()}_\n\n---\n\n`
    : "";
  const blob = new Blob([header + markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".md") ? filename : `${filename}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Render markdown (lightweight) to a clean PDF study sheet.
 * Supports headings (#, ##, ###), bullets (-, *), numbered lists, **bold**, and paragraphs.
 */
export function downloadPDF(filename: string, markdown: string, meta?: { title?: string; subject?: string }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxW = pageW - margin * 2;
  let y = margin;

  const ensureSpace = (h: number) => {
    if (y + h > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const writeLine = (text: string, opts: { size: number; bold?: boolean; indent?: number; color?: [number, number, number] }) => {
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(opts.size);
    doc.setTextColor(...(opts.color ?? [20, 20, 20]));
    const x = margin + (opts.indent ?? 0);
    const wrapped = doc.splitTextToSize(text, maxW - (opts.indent ?? 0));
    const lh = opts.size * 1.35;
    for (const line of wrapped) {
      ensureSpace(lh);
      doc.text(line, x, y);
      y += lh;
    }
  };

  // Header
  if (meta?.title) {
    writeLine(meta.title, { size: 20, bold: true });
    y += 4;
    if (meta.subject) writeLine(`Subject: ${meta.subject}`, { size: 10, color: [110, 110, 110] });
    writeLine(`Generated ${new Date().toLocaleString()}`, { size: 9, color: [140, 140, 140] });
    y += 6;
    doc.setDrawColor(220);
    doc.line(margin, y, pageW - margin, y);
    y += 14;
  }

  // Strip bold markers for plain rendering (keep text)
  const cleanInline = (s: string) =>
    s
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/__(.+?)__/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/!\[.*?\]\(.*?\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  const lines = markdown.split(/\r?\n/);
  let inFence = false;

  for (const raw of lines) {
    const line = raw.replace(/\t/g, "  ");

    if (/^```/.test(line)) {
      inFence = !inFence;
      y += 4;
      continue;
    }
    if (inFence) {
      writeLine(line, { size: 9, color: [60, 60, 60], indent: 8 });
      continue;
    }
    if (!line.trim()) {
      y += 6;
      continue;
    }

    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      y += level === 1 ? 8 : 6;
      writeLine(cleanInline(h[2]), {
        size: level === 1 ? 16 : level === 2 ? 13 : 11,
        bold: true,
      });
      y += 2;
      continue;
    }

    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    if (bullet) {
      writeLine(`• ${cleanInline(bullet[1])}`, { size: 10.5, indent: 12 });
      continue;
    }

    const num = line.match(/^\s*(\d+)\.\s+(.*)$/);
    if (num) {
      writeLine(`${num[1]}. ${cleanInline(num[2])}`, { size: 10.5, indent: 12 });
      continue;
    }

    writeLine(cleanInline(line), { size: 10.5 });
  }

  const name = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  doc.save(name);
}

export function safeFilename(base: string) {
  return base.replace(/[^\w\d-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "study-sheet";
}
