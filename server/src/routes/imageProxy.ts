import { Router } from "express";

const router = Router();

function isAllowedSource(url: URL): boolean {
  return (
    url.hostname.includes("pixabay.com") ||
    url.hostname.includes("cdn.pixabay.com")
  );
}

router.get("/", async (req, res) => {
  const raw = req.query.url;
  if (typeof raw !== "string" || !raw) {
    res.status(400).json({ error: "url query parameter is required" });
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    res.status(400).json({ error: "invalid url" });
    return;
  }

  if (!isAllowedSource(parsed)) {
    res.status(403).json({ error: "source not allowed" });
    return;
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      headers: {
        "User-Agent": "HookSlide/1.0",
      },
    });

    if (!upstream.ok) {
      res.status(502).json({ error: `upstream image fetch failed (${upstream.status})` });
      return;
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    const data = Buffer.from(await upstream.arrayBuffer());

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
    res.send(data);
  } catch (err: any) {
    console.error("[image-proxy] Error:", err);
    res.status(500).json({ error: err.message || "image proxy failed" });
  }
});

export default router;
