import { Router } from "express";
import { getHeroImages } from "../services/pixabayService.js";

const router = Router();

let cachedImages: string[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

router.get("/", async (_req, res) => {
  try {
    const now = Date.now();
    if (cachedImages && now - cacheTimestamp < CACHE_TTL) {
      res.json({ images: cachedImages });
      return;
    }

    const images = await getHeroImages();
    if (images.length > 0) {
      cachedImages = images;
      cacheTimestamp = now;
    }

    res.json({ images });
  } catch (err: any) {
    console.error("[hero-images] Error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch hero images" });
  }
});

export default router;
