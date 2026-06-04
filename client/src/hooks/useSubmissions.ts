import { useState, useCallback } from "react";
import { v4 } from "../utils/uid";
import type { Submission, Slideshow, Slide, TextOverlay } from "../types";
import { useLocalStorage } from "./useLocalStorage";
import { generateSlideshows, regenerateSlide } from "../services/api";

const MAX_SUBMISSIONS = 10;

export function useSubmissions() {
  const [submissions, setSubmissions] = useLocalStorage<Submission[]>(
    "slideshow-submissions",
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (imageFile: File, blurb: string) => {
      setLoading(true);
      setError(null);
      try {
        const { slideshows, productImageUrl } = await generateSlideshows(
          imageFile,
          blurb
        );

        const submission: Submission = {
          id: v4(),
          productImageUrl,
          brandBlurb: blurb,
          slideshows,
          createdAt: Date.now(),
        };

        setSubmissions((prev) => [submission, ...prev].slice(0, MAX_SUBMISSIONS));
        return submission;
      } catch (err: any) {
        setError(err.message || "Generation failed");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setSubmissions]
  );

  const regenerate = useCallback(
    async (
      submissionId: string,
      slideshowId: string,
      slideIndex: 0 | 1,
      imagePrompt: string,
      blurb: string,
      productImageUrl?: string
    ) => {
      const { slide } = await regenerateSlide(
        imagePrompt,
        slideIndex,
        blurb,
        productImageUrl
      );

      setSubmissions((prev) =>
        prev.map((sub) => {
          if (sub.id !== submissionId) return sub;
          return {
            ...sub,
            slideshows: sub.slideshows.map((sw) => {
              if (sw.id !== slideshowId) return sw;
              const slides = [...sw.slides] as [Slide, Slide];
              slides[slideIndex] = {
                ...slide,
                textOverlays: sw.slides[slideIndex].textOverlays,
              };
              return { ...sw, slides };
            }),
          };
        })
      );
    },
    [setSubmissions]
  );

  const updateOverlays = useCallback(
    (
      submissionId: string,
      slideshowId: string,
      slideIndex: 0 | 1,
      overlays: TextOverlay[]
    ) => {
      setSubmissions((prev) =>
        prev.map((sub) => {
          if (sub.id !== submissionId) return sub;
          return {
            ...sub,
            slideshows: sub.slideshows.map((sw) => {
              if (sw.id !== slideshowId) return sw;
              const slides = [...sw.slides] as [Slide, Slide];
              slides[slideIndex] = { ...slides[slideIndex], textOverlays: overlays };
              return { ...sw, slides };
            }),
          };
        })
      );
    },
    [setSubmissions]
  );

  const deleteSlideshow = useCallback(
    (submissionId: string, slideshowId: string) => {
      setSubmissions((prev) =>
        prev
          .map((sub) => {
            if (sub.id !== submissionId) return sub;
            return {
              ...sub,
              slideshows: sub.slideshows.filter((sw) => sw.id !== slideshowId),
            };
          })
          .filter((sub) => sub.slideshows.length > 0)
      );
    },
    [setSubmissions]
  );

  return { submissions, loading, error, submit, regenerate, updateOverlays, deleteSlideshow };
}
