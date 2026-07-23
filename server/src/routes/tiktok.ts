import { Router } from "express";
import { verifyAuth, type AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

function getConfig() {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI;
  return {
    configured: Boolean(clientKey && clientSecret && redirectUri),
    clientKey,
    redirectUri,
  };
}

router.get("/status", verifyAuth as any, async (_req, res) => {
  const config = getConfig();
  if (!config.configured) {
    res.json({
      connected: false,
      available: false,
      reason: "TikTok app approval is pending. Add approved credentials to enable posting.",
    });
    return;
  }

  // Token persistence and connection checks will be added next.
  res.json({ connected: false, available: true });
});

router.get("/connect/start", verifyAuth as any, async (req, res) => {
  const authedReq = req as AuthenticatedRequest;
  const config = getConfig();

  if (!config.configured || !config.clientKey || !config.redirectUri) {
    res.status(503).json({ error: "TikTok app approval is pending." });
    return;
  }

  const statePayload = Buffer.from(
    JSON.stringify({ userId: authedReq.userId, ts: Date.now() })
  ).toString("base64url");

  const url =
    "https://www.tiktok.com/v2/auth/authorize/" +
    `?client_key=${encodeURIComponent(config.clientKey)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent("user.info.basic,video.publish")}` +
    `&redirect_uri=${encodeURIComponent(config.redirectUri)}` +
    `&state=${encodeURIComponent(statePayload)}`;

  res.json({ url });
});

router.post("/post", verifyAuth as any, async (req, res) => {
  const config = getConfig();

  if (!config.configured) {
    res.status(503).json({
      error: "TikTok posting unavailable until app approval and credentials are complete.",
    });
    return;
  }

  const { caption, slides } = req.body as {
    caption?: string;
    slides?: Array<{ imageUrl: string }>;
  };

  if (!slides || slides.length === 0) {
    res.status(400).json({ error: "slides are required" });
    return;
  }

  // Construct TikTok Content Posting API v2 init payload with auto_add_music enabled
  const publishInitPayload = {
    post_info: {
      title: caption || "",
      privacy_level: "PUBLIC_TO_EVERYONE",
      auto_add_music: true,
    },
    source_info: {
      source: "PULL_FROM_URL",
      photo_cover_index: 1,
      photo_images: slides.map((s) => s.imageUrl),
    },
  };

  // Full media upload + publish flow is gated by OAuth token verification
  res.status(501).json({
    error: "TikTok account is not connected yet. Complete OAuth callback + token storage next.",
    details: {
      queued: false,
      caption: caption ?? "",
      slideCount: slides.length,
      publishInitPayload,
    },
  });
});

export default router;
