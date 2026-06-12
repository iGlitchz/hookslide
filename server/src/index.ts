import "./loadEnv.js"; // Must be first — loads .env before any other local module reads process.env

// Catch any unhandled error so Railway logs show the cause instead of a silent crash
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
  process.exit(1);
});

import express from "express";
import cors from "cors";
import generateRouter from "./routes/generate.js";
import regenerateRouter from "./routes/regenerate.js";
import heroImagesRouter from "./routes/heroImages.js";
import stripeWebhookRouter from "./routes/stripeWebhook.js";
import createCheckoutSessionRouter from "./routes/createCheckoutSession.js";
import tiktokRouter from "./routes/tiktok.js";
import imageProxyRouter from "./routes/imageProxy.js";

const app = express();
const PORT = Number(process.env.PORT || 3001);
const HOST = "0.0.0.0";

// Log which env vars are present so we can spot missing keys in Railway
const requiredEnvVars = [
  "SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "STRIPE_PRICE_ID",
  "RUNWARE_API_KEY", "OPENROUTER_API_KEY", "CLIENT_URL",
];
for (const key of requiredEnvVars) {
  console.log(`[env] ${key}: ${process.env[key] ? "SET" : "MISSING"}`);
}

// Log every incoming request so we can confirm requests reach Express
app.use((req, _res, next) => {
  console.log(`[req] ${req.method} ${req.path}`);
  next();
});

app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      origin === "http://localhost:5173" ||
      origin.endsWith(".vercel.app") ||
      (process.env.CLIENT_URL && origin === process.env.CLIENT_URL.replace(/\/$/, ""))
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
}));

// Stripe webhook MUST receive the raw body for signature verification.
// Register this route BEFORE express.json() is applied.
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhookRouter);

app.use(express.json({ limit: "15mb" }));

app.use("/api/generate", generateRouter);
app.use("/api/regenerate", regenerateRouter);
app.use("/api/hero-images", heroImagesRouter);
app.use("/api/create-checkout-session", createCheckoutSessionRouter);
app.use("/api/tiktok", tiktokRouter);
app.use("/api/image-proxy", imageProxyRouter);

app.get("/", (_req, res) => {
  res.status(200).send("ok");
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
