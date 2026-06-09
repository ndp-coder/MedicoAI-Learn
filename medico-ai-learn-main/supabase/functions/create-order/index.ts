import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const PLAN_PRICES: Record<string, number> = {
  go: 150,
  pro: 300,
  max: 500,
  ultra: 1000,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { planId } = await req.json();

    if (!planId || !PLAN_PRICES[planId]) {
      throw new Error("Invalid plan");
    }

    const amount = PLAN_PRICES[planId] * 100; // Amount in paise
    const currency = "INR";

    const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay credentials not configured");
    }

    const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount,
        currency,
        receipt: `receipt_${Date.now()}`,
      }),
    });

    const order = await response.json();

    if (!response.ok) {
      throw new Error(`Razorpay API error: ${JSON.stringify(order)}`);
    }

    return new Response(JSON.stringify(order), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Create order error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
