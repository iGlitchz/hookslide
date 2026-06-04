import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { generateSlide } from "../services/imageGenerator.js";
import { verifyAuth } from "../middleware/auth.js";
import {
  searchPixabayImage,
  extractKeywords,
} from "../services/pixabayService.js";
import type {
  RegenerateRequest,
  RegenerateResponse,
  Slide,
} from "../types/index.js";

const router = Router();

router.post("/", verifyAuth as any, async (req, res) => {
  try {
    const { imagePrompt, slideIndex, hook, blurb, productImageUrl } =
      req.body as RegenerateRequest;

    if (!imagePrompt) {
      res.status(400).json({ error: "imagePrompt is required" });
      return;
    }

    console.log(
      "[regenerate] Regenerating slide",
      slideIndex,
      "with prompt:",
      imagePrompt.slice(0, 80)
    );

    let slide: Slide;

    if (slideIndex === 0) {
      // Slide 1: fetch a different Pixabay image
      const keywords = extractKeywords(imagePrompt);
      console.log("[regenerate] Pixabay search for slide 1:", keywords);
      try {
        const imageUrl = await searchPixabayImage(keywords);
        slide = {
          id: uuidv4(),
          imageUrl,
          imagePrompt,
          textOverlays: [],
        };
      } catch (err) {
        console.warn("[regenerate] Pixabay failed, falling back to AI:", err);
        slide = await generateSlide(imagePrompt, []);
      }
    } else {
      // Slide 2: AI-generated via Runware, with the original product photo as
      // a reference so the subject stays consistent across regenerations.
      slide = await generateSlide(imagePrompt, [], productImageUrl);
    }

    console.log("[regenerate] Done");

    const response: RegenerateResponse = { slide };
    res.json(response);
  } catch (err: any) {
    console.error("[regenerate] Error:", err);
    res.status(500).json({ error: err.message || "Regeneration failed" });
  }
});

export default router;
