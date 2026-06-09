import { useState } from "react";
import { UpgradeModal } from "./UpgradeModal";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface UpgradeOverlayProps {
  featureName: string;
  requiredPlan: string;
}

export function UpgradeOverlay({ featureName, requiredPlan }: UpgradeOverlayProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg p-4 text-center">
      <div className="max-w-md space-y-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-2xl font-bold text-foreground">Unlock {featureName}</h3>
        <p className="text-muted-foreground text-sm">
          Get the {requiredPlan} plan to access this feature and supercharge your medical studies.
        </p>
        <Button size="lg" className="w-full mt-4 text-md py-6 shadow-xl" onClick={() => setShowModal(true)}>
          <Lock className="w-5 h-5 mr-2" /> Upgrade to {requiredPlan}
        </Button>
      </div>

      <UpgradeModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        featureName={featureName} 
        requiredPlan={requiredPlan} 
      />
    </div>
  );
}
