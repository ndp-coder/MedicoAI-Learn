import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Pencil, Eraser, Undo2, Redo2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DrawCanvasHandle {
  getDataUrl: () => string | null;
  isEmpty: () => boolean;
  clear: () => void;
}

const COLORS = ["#0f172a", "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#ffffff"];

export const DrawCanvas = forwardRef<DrawCanvasHandle, { height?: number }>(
  ({ height = 420 }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const drawing = useRef(false);
    const lastPoint = useRef<{ x: number; y: number } | null>(null);

    const [tool, setTool] = useState<"pen" | "eraser">("pen");
    const [color, setColor] = useState("#0f172a");
    const [size, setSize] = useState(3);
    const [history, setHistory] = useState<ImageData[]>([]);
    const [redoStack, setRedoStack] = useState<ImageData[]>([]);
    const [hasDrawn, setHasDrawn] = useState(false);

    const fillWhite = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
    };

    // Size canvas to container width with devicePixelRatio
    useEffect(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const resize = () => {
        const dpr = window.devicePixelRatio || 1;
        const cssW = container.clientWidth;
        const cssH = height;
        // Preserve existing drawing
        const prev = document.createElement("canvas");
        prev.width = canvas.width;
        prev.height = canvas.height;
        const pctx = prev.getContext("2d");
        if (pctx && canvas.width > 0) pctx.drawImage(canvas, 0, 0);

        canvas.width = cssW * dpr;
        canvas.height = cssH * dpr;
        canvas.style.width = `${cssW}px`;
        canvas.style.height = `${cssH}px`;
        const ctx = canvas.getContext("2d")!;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        fillWhite(ctx, cssW, cssH);
        if (prev.width > 0) ctx.drawImage(prev, 0, 0, cssW, cssH);
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(container);
      return () => ro.disconnect();
    }, [height]);

    const snapshot = () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory((h) => [...h.slice(-30), snap]);
      setRedoStack([]);
    };

    const restore = (data: ImageData) => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      ctx.putImageData(data, 0, 0);
    };

    const pointFromEvent = (e: React.PointerEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onDown = (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      snapshot();
      drawing.current = true;
      lastPoint.current = pointFromEvent(e);
      setHasDrawn(true);
    };

    const onMove = (e: React.PointerEvent) => {
      if (!drawing.current) return;
      const ctx = canvasRef.current!.getContext("2d")!;
      const p = pointFromEvent(e);
      const lp = lastPoint.current!;
      ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
      ctx.lineWidth = tool === "eraser" ? size * 4 : size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(lp.x, lp.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      lastPoint.current = p;
    };

    const onUp = () => {
      drawing.current = false;
      lastPoint.current = null;
    };

    const undo = () => {
      setHistory((h) => {
        if (h.length === 0) return h;
        const last = h[h.length - 1];
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;
        const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setRedoStack((r) => [...r, current]);
        restore(last);
        return h.slice(0, -1);
      });
    };

    const redo = () => {
      setRedoStack((r) => {
        if (r.length === 0) return r;
        const last = r[r.length - 1];
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;
        const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory((h) => [...h, current]);
        restore(last);
        return r.slice(0, -1);
      });
    };

    const clear = () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      snapshot();
      fillWhite(ctx, canvas.width, canvas.height);
      setHasDrawn(false);
    };

    useImperativeHandle(ref, () => ({
      getDataUrl: () => canvasRef.current?.toDataURL("image/png") ?? null,
      isEmpty: () => !hasDrawn,
      clear,
    }));

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-muted/50 border">
          <Button
            type="button"
            size="sm"
            variant={tool === "pen" ? "default" : "outline"}
            onClick={() => setTool("pen")}
          >
            <Pencil className="w-4 h-4 mr-1" /> Pen
          </Button>
          <Button
            type="button"
            size="sm"
            variant={tool === "eraser" ? "default" : "outline"}
            onClick={() => setTool("eraser")}
          >
            <Eraser className="w-4 h-4 mr-1" /> Eraser
          </Button>

          <div className="flex items-center gap-1 ml-1">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setColor(c);
                  setTool("pen");
                }}
                className={cn(
                  "w-6 h-6 rounded-full border-2 transition",
                  color === c && tool === "pen"
                    ? "border-foreground scale-110"
                    : "border-border",
                )}
                style={{ background: c }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 min-w-[140px] ml-auto">
            <span className="text-xs text-muted-foreground">Size</span>
            <Slider
              value={[size]}
              min={1}
              max={20}
              step={1}
              onValueChange={(v) => setSize(v[0])}
              className="w-24"
            />
            <span className="text-xs w-5 text-right">{size}</span>
          </div>

          <div className="flex items-center gap-1">
            <Button type="button" size="icon" variant="outline" onClick={undo} title="Undo">
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button type="button" size="icon" variant="outline" onClick={redo} title="Redo">
              <Redo2 className="w-4 h-4" />
            </Button>
            <Button type="button" size="icon" variant="outline" onClick={clear} title="Clear">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div
          ref={containerRef}
          className="rounded-lg overflow-hidden border bg-white"
          style={{ height }}
        >
          <canvas
            ref={canvasRef}
            className="touch-none cursor-crosshair block"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerLeave={onUp}
          />
        </div>
      </div>
    );
  },
);

DrawCanvas.displayName = "DrawCanvas";
