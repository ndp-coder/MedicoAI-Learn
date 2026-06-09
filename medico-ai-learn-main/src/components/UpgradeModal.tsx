import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
  requiredPlan?: string;
}

export function UpgradeModal({ isOpen, onClose, featureName, requiredPlan = "Premium" }: UpgradeModalProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
            <Zap className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl">Upgrade to Unlock</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground pt-2">
            {featureName ? (
              <>You need the <span className="font-semibold text-foreground">{requiredPlan}</span> plan to access <span className="font-semibold text-foreground">{featureName}</span>.</>
            ) : (
              <>You need to upgrade your plan to access this feature.</>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-col gap-2 mt-4">
          <Button 
            className="w-full text-lg py-6" 
            onClick={() => {
              onClose();
              navigate("/pricing");
            }}
          >
            View Pricing Plans
          </Button>
          <Button variant="ghost" className="w-full" onClick={onClose}>
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
