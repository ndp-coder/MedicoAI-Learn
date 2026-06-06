import { useState, useEffect } from "react";
import { Lightbulb, Bookmark, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DENTAL_TIPS = [
  "💡 Mnemonic: 'Some Lovers Try Positions That They Can't Handle' — Bones of the skull: Sphenoid, Lacrimal, Temporal, Parietal, Zygomatic (Temporal process), Ethmoid, Occipital, Maxilla, Frontal, Nasal",
  "🦷 The enamel of teeth is the hardest substance in the human body, composed of ~96% hydroxyapatite crystals.",
  "💡 Remember: Ameloblasts form enamel, Odontoblasts form dentin. 'A' comes before 'O' just like enamel is outer to dentin.",
  "🦷 The mandible is the only movable bone of the skull and the largest and strongest facial bone.",
  "💡 Mnemonic for TMJ muscles of mastication: 'My Tired Muscles Lack Power' — Masseter, Temporalis, Medial pterygoid, Lateral pterygoid",
  "🦷 Primary teeth begin to form during the 6th week of intrauterine life (bud stage).",
  "💡 Forensic tip: Dental records are one of the most reliable methods of human identification.",
  "🦷 Saliva contains IgA antibodies, lysozyme, and lactoferrin — making it a first line of defense.",
  "💡 The pulp chamber of a tooth decreases in size with age due to secondary dentin deposition.",
  "🦷 Cementum is the only dental tissue that can undergo repair and is similar to bone in composition.",
];

export function DailyTip() {
  const [tip, setTip] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const cached = localStorage.getItem("dentai-daily-tip");
    const cachedDate = localStorage.getItem("dentai-daily-tip-date");

    if (cached && cachedDate === today) {
      setTip(cached);
    } else {
      // Use a deterministic tip based on date
      const dayIndex = new Date().getDate() % DENTAL_TIPS.length;
      const fallbackTip = DENTAL_TIPS[dayIndex];
      setTip(fallbackTip);
      localStorage.setItem("dentai-daily-tip", fallbackTip);
      localStorage.setItem("dentai-daily-tip-date", today);
    }
  }, []);

  const fetchAITip = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          messages: [
            { role: "user", content: "Give me one interesting dental study tip, mnemonic, or fun fact. Keep it to 2-3 sentences max. Make it useful for a BDS student. Don't include any source tags." }
          ]
        }
      });

      if (error) throw error;

      // Non-streaming response fallback
      if (typeof data === "string") {
        setTip(data);
      } else if (data?.choices?.[0]?.message?.content) {
        setTip(data.choices[0].message.content);
      }

      const today = new Date().toISOString().split("T")[0];
      localStorage.setItem("dentai-daily-tip", tip);
      localStorage.setItem("dentai-daily-tip-date", today);
    } catch {
      toast.error("Couldn't fetch a new tip. Using a saved one.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    const tips = JSON.parse(localStorage.getItem("dentai-saved-tips") || "[]");
    if (!tips.includes(tip)) {
      tips.push(tip);
      localStorage.setItem("dentai-saved-tips", JSON.stringify(tips));
      setSaved(true);
      toast.success("Tip saved! 📌");
    } else {
      toast.info("Already saved!");
    }
  };

  if (!tip) return null;

  return (
    <Card className="border-none shadow-sm bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
      <CardContent className="p-3">
        <div className="flex items-start gap-2.5">
          <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 mb-1">Tip of the Day</p>
            <p className="text-xs leading-relaxed">{tip}</p>
            <div className="flex gap-1.5 mt-2">
              <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={handleSave} disabled={saved}>
                <Bookmark className={`w-3 h-3 mr-0.5 ${saved ? "fill-current" : ""}`} /> {saved ? "Saved" : "Save"}
              </Button>
              <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={fetchAITip} disabled={loading}>
                {loading ? <Loader2 className="w-3 h-3 mr-0.5 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-0.5" />}
                New Tip
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
