import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useSubscription, PlanType } from "@/hooks/useSubscription";

const PLANS = [
  {
    name: "Free",
    id: "free",
    price: "₹0",
    period: "forever",
    description: "Browse the app without using features.",
    features: ["View UI and Navigation", "Read about features"],
    notIncluded: ["Daily Quiz & Flashcards", "Ask a Doubt & Recap", "Mock Exams & Clinical Cases", "Advanced AI Features"],
  },
  {
    name: "Go",
    id: "go",
    price: "₹150",
    period: "per month",
    description: "Basic features for everyday studying.",
    features: ["Daily Quiz", "Flashcards", "Ask a Doubt", "Topic Recap"],
    notIncluded: ["Mock Exams & Clinical Cases", "Advanced AI Features"],
  },
  {
    name: "Pro",
    id: "pro",
    price: "₹300",
    period: "per month",
    description: "Complete study package for serious students.",
    features: ["Daily Quiz", "Flashcards", "Ask a Doubt", "Topic Recap", "Mock Exam", "Viva Practice", "Clinical Cases", "OSCE", "PYQ"],
    notIncluded: ["Advanced AI Priority Responses"],
    popular: true,
  },
  {
    name: "Max",
    id: "max",
    price: "₹500",
    period: "per month",
    description: "Access to all features.",
    features: ["All Pro features", "Notes Summarizer", "Lecture Recorder", "Mistake Journal", "Pomodoro Timer", "Analytics"],
    notIncluded: ["Advanced AI Priority Responses"],
  },
  {
    name: "Ultra",
    id: "ultra",
    price: "₹1000",
    period: "per month",
    description: "All features + Priority AI.",
    features: ["All Max features", "Priority AI Responses (Faster)", "Early access to new features", "VIP Support"],
    notIncluded: [],
  },
];

// Load razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function Pricing() {
  const { plan: currentPlan, loading: isSubscriptionLoading } = useSubscription();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubscribe = async (planId: string) => {
    if (planId === "free") return; // Should not happen
    setLoadingPlan(planId);

    try {
      const res = await loadRazorpayScript();
      if (!res) {
        toast({ title: "Failed to load Razorpay SDK", variant: "destructive" });
        setLoadingPlan(null);
        return;
      }

      // Call supabase edge function to create order
      const { data, error } = await supabase.functions.invoke("create-order", {
        body: { planId },
      });

      if (error) throw error;

      const { id: order_id, amount, currency } = data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_Szph0qLRCzg1bU", // Use test key
        amount,
        currency,
        name: "MedicoAI Learn",
        description: `Upgrade to ${planId.toUpperCase()} Plan`,
        order_id,
        handler: async function (response: any) {
          try {
            // Verify payment on the backend
            const { error: verifyError } = await supabase.functions.invoke("verify-payment", {
              body: {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                planId,
              },
            });

            if (verifyError) throw verifyError;

            toast({ title: "Payment successful!", description: "Your plan has been upgraded." });
            window.location.reload(); // Reload to update subscription state
          } catch (err: any) {
            console.error("Payment verification failed", err);
            toast({ title: "Payment verification failed", variant: "destructive" });
          }
        },
        prefill: {
          name: "User", // Can be filled from auth
          email: "user@example.com",
        },
        theme: {
          color: "#3b82f6", // Primary color
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();

    } catch (err: any) {
      console.error("Checkout error", err);
      toast({ title: "Something went wrong", description: err.message, variant: "destructive" });
    } finally {
      setLoadingPlan(null);
    }
  };

  if (isSubscriptionLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-10 px-4 md:px-6 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4 text-foreground">Pricing Plans</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Choose the plan that fits your study needs. Upgrade anytime to unlock more features.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {PLANS.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative flex flex-col ${plan.popular ? 'border-primary shadow-lg scale-105 z-10' : 'border-border'} ${currentPlan === plan.id ? 'ring-2 ring-primary ring-offset-2' : ''}`}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 uppercase tracking-wider text-xs">
                Most Popular
              </Badge>
            )}
            {currentPlan === plan.id && (
              <Badge variant="secondary" className="absolute -top-3 right-4 px-3 py-1 uppercase tracking-wider text-xs">
                Current Plan
              </Badge>
            )}
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription className="pt-2 min-h-[60px]">{plan.description}</CardDescription>
              <div className="mt-4 flex items-baseline justify-center gap-x-2">
                <span className="text-4xl font-bold tracking-tight text-foreground">{plan.price}</span>
                <span className="text-sm font-semibold leading-6 text-muted-foreground">/{plan.period}</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <Check className="h-5 w-5 flex-none text-primary" aria-hidden="true" />
                    <span className="text-foreground/80">{feature}</span>
                  </li>
                ))}
                {plan.notIncluded.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <X className="h-5 w-5 flex-none text-muted-foreground/50" aria-hidden="true" />
                    <span className="text-muted-foreground/50">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                variant={plan.popular ? "default" : "outline"} 
                className="w-full"
                disabled={currentPlan === plan.id || plan.id === "free" || loadingPlan === plan.id}
                onClick={() => handleSubscribe(plan.id)}
              >
                {loadingPlan === plan.id ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {currentPlan === plan.id ? "Current Plan" : (plan.id === "free" ? "Free Tier" : "Upgrade")}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
