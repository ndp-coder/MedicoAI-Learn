import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  suffix?: string;
  color?: string;
  bgColor?: string;
}

const StatsCard = ({ icon: Icon, label, value, suffix = "", color = "text-secondary", bgColor = "bg-secondary/10" }: StatsCardProps) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (value === 0) { setDisplayValue(0); return; }
    const duration = 600;
    const steps = 20;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.round(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-3 flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl ${bgColor} flex items-center justify-center shrink-0`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground font-medium truncate">{label}</p>
          <p className="text-lg font-bold leading-tight">
            {displayValue}{suffix}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
