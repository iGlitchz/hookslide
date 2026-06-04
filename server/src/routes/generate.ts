import { Router } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { generateHooks } from "../services/hookGenerator.js";
import { generateSlide } from "../services/imageGenerator.js";
import {
  searchPixabayImage,
} from "../services/pixabayService.js";
import { verifyAuth } from "../middleware/auth.js";
import type {
  Slideshow,
  Slide,
  TextOverlay,
  GenerateResponse,
} from "../types/index.js";

const router = Router();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

router.post("/", verifyAuth as any, upload.single("image"), async (req, res) => {
  try {
    const blurb = req.body.blurb;
    if (!blurb || typeof blurb !== "string") {
      res.status(400).json({ error: "blurb is required" });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "image file is required" });
      return;
    }

    const imageBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    console.log("[generate] Generating hooks for blurb:", blurb.slice(0, 80));
    const { hooks } = await generateHooks(blurb);
    console.log("[generate] Got", hooks.length, "hooks, generating images...");

    const slideshows: Slideshow[] = await Promise.all(
      hooks.map(async (hookData) => {
        const slide1Overlays: TextOverlay[] = [
          {
            id: uuidv4(),
            text: hookData.hook.text,
            x: 50,
            y: 50,
            fontSize: 32,
            visible: true,
          },
        ];

        const slide2Overlays: TextOverlay[] = hookData.slide2NeedsText
          ? [
              {
                id: uuidv4(),
                text: hookData.slide2Text,
                x: 50,
                y: 80,
                fontSize: 24,
                visible: true,
              },
            ]
          : [];

        const [slide1, slide2] = await Promise.all([
          // Slide 1: Use Pixabay (free) instead of AI generation
          (async (): Promise<Slide> => {
            try {
              const keywords = hookData.slide1PixabayQuery;
              console.log("[generate] Pixabay search for slide 1:", keywords);
              const imageUrl = await searchPixabayImage(keywords);
              return {
                id: uuidv4(),
                imageUrl,
                imagePrompt: hookData.slide1Prompt,
                textOverlays: slide1Overlays,
              };
            } catch (err) {
              console.warn("[generate] Pixabay failed, falling back to AI:", err);
              return generateSlide(hookData.slide1Prompt, slide1Overlays);
            }
          })(),
          // Slide 2: AI-generated via Runware, using the uploaded product photo
          // as a reference so the subject is recognisable in the new scene.
          generateSlide(hookData.slide2Prompt, slide2Overlays, imageBase64),
        ]);

        return {
          id: uuidv4(),
          hook: hookData.hook,
          slides: [slide1, slide2] as [typeof slide1, typeof slide2],
        };
      })
    );

    console.log("[generate] Done — returning", slideshows.length, "slideshows");

    const response: GenerateResponse = {
      slideshows,
      productImageUrl: imageBase64,
    };

    res.json(response);
  } catch (err: any) {
    console.error("[generate] Error:", err);
    res.status(500).json({ error: err.message || "Generation failed" });
  }
});

export default router;
