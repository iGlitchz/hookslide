import { Router } from "express";
import Stripe from "stripe";
import { supabaseAdmin } from "../services/supabaseAdmin.js";

const router = Router();

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-05-27.dahlia" });
  return _stripe;
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Must use express.raw body — registered in index.ts before express.json()
router.post("/", async (req, res) => {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    res.status(400).json({ error: "Missing stripe-signature header" });
    return;
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signature verification failed";
    console.error("Stripe webhook signature error:", message);
    res.status(400).json({ error: `Webhook Error: ${message}` });
    return;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const supabaseUserId = session.client_reference_id;
        const stripeCustomerId = session.customer as string;

        if (!supabaseUserId) {
          console.error("checkout.session.completed missing client_reference_id");
          break;
        }

        await supabaseAdmin
          .from("profiles")
          .update({
            subscription_status: "active",
            subscription_tier: "pro",
            stripe_customer_id: stripeCustomerId,
          })
          .eq("id", supabaseUserId);

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await supabaseAdmin
          .from("profiles")
          .update({ subscription_status: "canceled", subscription_tier: "free" })
          .eq("stripe_customer_id", customerId);

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await supabaseAdmin
          .from("profiles")
          .update({ subscription_status: "past_due" })
          .eq("stripe_customer_id", customerId);

        break;
      }

      default:
        // Ignore unhandled events
        break;
    }
  } catch (err) {
    console.error("Error handling Stripe event:", event.type, err);
    res.status(500).json({ error: "Internal error processing webhook" });
    return;
  }

  res.json({ received: true });
});

export default router;
