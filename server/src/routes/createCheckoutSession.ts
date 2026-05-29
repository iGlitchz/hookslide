import { Router } from "express";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../services/supabaseAdmin.js";

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

// Lightweight JWT-only check — does NOT gate on subscription status
// so that free/canceled users can reach this to upgrade.
async function getAuthenticatedUserId(
  authHeader: string | undefined
): Promise<{ userId: string; email: string } | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return { userId: user.id, email: user.email ?? "" };
}

router.post("/", async (req, res) => {
  const identity = await getAuthenticatedUserId(req.headers.authorization);
  if (!identity) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { userId, email } = identity;
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const priceId = process.env.STRIPE_PRICE_ID;

  if (!priceId) {
    res.status(500).json({ error: "STRIPE_PRICE_ID not configured" });
    return;
  }

  // Re-use existing Stripe customer or create a new one
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  let customerId: string | undefined = profile?.stripe_customer_id ?? undefined;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email,
      metadata: { supabase_user_id: userId },
    });
    customerId = customer.id;

    await supabaseAdmin
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", userId);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    client_reference_id: userId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${clientUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${clientUrl}?upgrade_canceled=true`,
    metadata: { supabase_user_id: userId },
  });

  res.json({ url: session.url });
});

export default router;
