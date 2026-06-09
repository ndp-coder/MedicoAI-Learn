import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type PlanType = "free" | "go" | "pro" | "max" | "ultra";

export function useSubscription() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<PlanType>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setPlan("free"); setLoading(false); return; }
    supabase
      .from("profiles")
      .select("plan_type")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setPlan((data?.plan_type as PlanType) || "free");
        setLoading(false);
      });
  }, [user]);

  const canAccess = (requiredPlan: PlanType) => {
    const order = ["free", "go", "pro", "max", "ultra"];
    return order.indexOf(plan) >= order.indexOf(requiredPlan);
  };

  return { plan, loading, canAccess };
}
