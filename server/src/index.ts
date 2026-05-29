import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import express from "express";
import cors from "cors";
import generateRouter from "./routes/generate.js";
import regenerateRouter from "./routes/regenerate.js";
import heroImagesRouter from "./routes/heroImages.js";
import stripeWebhookRouter from "./routes/stripeWebhook.js";
import createCheckoutSessionRouter from "./routes/createCheckoutSession.js";

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  "http://localhost:5173",
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
];
app.use(cors({ origin: allowedOrigins }));

// Stripe webhook MUST receive the raw body for signature verification.
// Register this route BEFORE express.json() is applied.
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhookRouter);

app.use(express.json({ limit: "15mb" }));

app.use("/api/generate", generateRouter);
app.use("/api/regenerate", regenerateRouter);
app.use("/api/hero-images", heroImagesRouter);
app.use("/api/create-checkout-session", createCheckoutSessionRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
