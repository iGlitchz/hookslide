import type { Slideshow, Slide } from "../types";
import { supabase } from "./supabaseClient";

export const SUBSCRIPTION_REQUIRED = "subscription_required";

// In dev: empty string → Vite proxy handles /api/* → localhost:3001
// In production: set VITE_API_URL to your Railway server URL in Vercel's env vars
const API_BASE = ((import.meta.env.VITE_API_URL as string) || "").replace(/\/$/, "");

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

export async function generateSlideshows(
  imageFile: File,
  blurb: string
): Promise<{ slideshows: Slideshow[]; productImageUrl: string }> {
  const formData = new FormData();
  formData.append("image", imageFile);
  formData.append("blurb", blurb);

  const res = await fetch(`${API_BASE}/api/generate`, {
    method: "POST",
    headers: await authHeaders(),
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function regenerateSlide(
  imagePrompt: string,
  slideIndex: number,
  blurb: string
): Promise<{ slide: Slide }> {
  const res = await fetch(`${API_BASE}/api/regenerate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ imagePrompt, slideIndex, blurb }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function fetchHeroImages(): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/api/hero-images`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.images || [];
  } catch {
    return [];
  }
}
