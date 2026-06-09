import { ReactNode } from "react";
import { useSubscription, PlanType } from "@/hooks/useSubscription";
import { UpgradeOverlay } from "./UpgradeOverlay";

interface GatedRouteProps {
  children: ReactNode;
  requiredPlan: "Go" | "Pro" | "Max" | "Ultra";
  featureName: string;
}

export function GatedRoute({ children, requiredPlan, featureName }: GatedRouteProps) {
  const { canAccess, loading } = useSubscription();

  const isAllowed = (() => {
    switch (requiredPlan) {
      case "Go": return canAccess("go");
      case "Pro": return canAccess("pro");
      case "Max": return canAccess("max");
      case "Ultra": return canAccess("ultra");
      default: return true;
    }
  })();

  return (
    <div className="relative min-h-[60vh] h-full">
      {!loading && !isAllowed && (
        <UpgradeOverlay featureName={featureName} requiredPlan={requiredPlan} />
      )}
      {children}
    </div>
  );
}
