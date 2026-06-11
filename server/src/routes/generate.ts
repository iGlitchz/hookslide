import { Router } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { generateHooks } from "../services/hookGenerator.js";
import { generateSlide } from "../services/imageGenerator.js";
import {
  searchPixabayImage,
  extractKeywords,
} from "../services/pixabayService.js";
import { verifyAuth } from "../middleware/auth.js";
import type {
  Slideshow,
  Slide,
  TextOverlay,
  GenerateResponse,
  PostFormat,
} from "../types/index.js";

const router = Router();
const upload = multer({ limits: { fileSize: 15 * 1024 * 1024, files: 12 } });

function clampSlideCount(rawCount: unknown): number {
  const parsed = Number(rawCount);
  if (!Number.isFinite(parsed)) return 6;
  return Math.max(1, Math.min(6, Math.floor(parsed)));
}

async function buildPixabaySlide(
  pixabayQuery: string,
  imagePrompt: string,
  overlays: TextOverlay[]
): Promise<Slide> {
  try {
    const imageUrl = await searchPixabayImage(pixabayQuery);
    return {
      id: uuidv4(),
      imageUrl,
      imagePrompt,
      textOverlays: overlays,
      generationSource: "pixabay",
    };
  } catch (err) {
    console.warn("[generate] Pixabay failed, falling back to AI:", err);
    const aiSlide = await generateSlide(imagePrompt, overlays);
    return { ...aiSlide, generationSource: "ai" };
  }
}

router.post("/", verifyAuth as any, upload.array("attachments", 12), async (req, res) => {
  try {
    const blurb = req.body.blurb;
    const postFormat = (req.body.postFormat || "carousel") as PostFormat;
    const slideCount = postFormat === "carousel" ? clampSlideCount(req.body.slideCount) : 1;

    if (!blurb || typeof blurb !== "string") {
      res.status(400).json({ error: "blurb is required" });
      return;
    }

    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length === 0) {
      res.status(400).json({ error: "at least one attachment is required" });
      return;
    }

    const imageFiles = files.filter((file) => file.mimetype.startsWith("image/"));
    const primaryImage = imageFiles[0];
    if ((postFormat === "carousel" || postFormat === "poster") && !primaryImage) {
      res.status(400).json({ error: "carousel/poster require at least one image attachment" });
      return;
    }

    const imageBase64 = primaryImage
      ? `data:${primaryImage.mimetype};base64,${primaryImage.buffer.toString("base64")}`
      : "";

    console.log("[generate] Generating hooks", { postFormat, slideCount, attachments: files.length });
    const { hooks } = await generateHooks(blurb, postFormat);
    console.log("[generate] Got", hooks.length, "hooks, generating images...");

    const slideshows: Slideshow[] = await Promise.all(
      hooks.map(async (hookData) => {
        const hookOverlay: TextOverlay[] = [
          {
            id: uuidv4(),
            text: hookData.hook.text,
            x: 50,
            y: 50,
            fontSize: 32,
            visible: true,
          },
        ];

        const revealOverlay: TextOverlay[] = hookData.slide2NeedsText
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

        const slides: Slide[] = [];

        if (postFormat === "carousel") {
          const aiIndex = Math.max(0, slideCount - 1);

          for (let index = 0; index < slideCount; index++) {
            if (index === 0) {
              slides.push(
                await buildPixabaySlide(
                  hookData.slide1PixabayQuery,
                  hookData.slide1Prompt,
                  hookOverlay
                )
              );
              continue;
            }

            if (index === aiIndex) {
              const aiSlide = await generateSlide(
                hookData.slide2Prompt,
                revealOverlay,
                imageBase64 || undefined
              );
              slides.push({ ...aiSlide, generationSource: "ai" });
              continue;
            }

            const query = extractKeywords(`${hookData.slide1PixabayQuery} ${blurb}`);
            slides.push(
              await buildPixabaySlide(query, hookData.slide1Prompt, [])
            );
          }
        } else {
          const prompt = postFormat === "infographic" ? `${hookData.slide2Prompt}. infographic-style composition, clean visual hierarchy, icons and data blocks` : hookData.slide2Prompt;
          const singleSlide = await generateSlide(prompt, revealOverlay, postFormat === "poster" ? imageBase64 || undefined : undefined);
          slides.push({ ...singleSlide, generationSource: "ai" });
        }

        return {
          id: uuidv4(),
          hook: hookData.hook,
          slides,
        };
      })
    );

    console.log("[generate] Done — returning", slideshows.length, "slideshows");

    const response: GenerateResponse = {
      slideshows,
      productImageUrl: imageBase64 || slideshows[0]?.slides[0]?.imageUrl || "",
    };

    res.json(response);
  } catch (err: any) {
    console.error("[generate] Error:", err);
    res.status(500).json({ error: err.message || "Generation failed" });
  }
});

export default router;
