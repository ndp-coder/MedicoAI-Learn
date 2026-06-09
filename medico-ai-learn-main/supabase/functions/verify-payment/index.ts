import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.0";
import { corsHeaders } from "../_shared/cors.ts";

const PLAN_PRICES: Record<string, number> = {
  go: 150,
  pro: 300,
  max: 500,
  ultra: 1000,
};

async function verifySignature(orderId: string, paymentId: string, signature: string, secret: string) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureData = await crypto.subtle.sign(
    "HMAC",
    keyMaterial,
    enc.encode(`${orderId}|${paymentId}`)
  );

  const hashArray = Array.from(new Uint8Array(signatureData));
  const generatedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return generatedSignature === signature;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, planId } = await req.json();

    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay credentials not configured");
    }

    const isValid = await verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, RAZORPAY_KEY_SECRET);

    if (!isValid) {
      throw new Error("Invalid payment signature");
    }

    // Initialize Supabase admin client to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user from the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Update the user's plan
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ plan_type: planId })
      .eq("id", user.id);

    if (updateError) {
      throw updateError;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Verify payment error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
