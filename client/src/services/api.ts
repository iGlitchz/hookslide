import type { Slideshow, Slide, GenerationOptions, PostFormat, PublishPlatform } from "../types";
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
  options: GenerationOptions
): Promise<{ slideshows: Slideshow[]; productImageUrl: string }> {
  const formData = new FormData();
  formData.append("blurb", options.blurb);
  formData.append("postFormat", options.postFormat);
  formData.append("slideCount", String(options.slideCount));

  options.attachments.forEach((file) => {
    formData.append("attachments", file);
  });

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
  blurb: string,
  postFormat: PostFormat,
  productImageUrl?: string
): Promise<{ slide: Slide }> {
  const res = await fetch(`${API_BASE}/api/regenerate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ imagePrompt, slideIndex, blurb, postFormat, productImageUrl }),
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

export interface TikTokStatus {
  connected: boolean;
  available: boolean;
  reason?: string;
}

export async function getTikTokStatus(): Promise<TikTokStatus> {
  const res = await fetch(`${API_BASE}/api/tiktok/status`, {
    headers: await authHeaders(),
  });
  if (!res.ok) {
    return { connected: false, available: false, reason: "Status unavailable" };
  }
  return res.json();
}

export async function startTikTokConnect(): Promise<{ url: string }> {
  const res = await fetch(`${API_BASE}/api/tiktok/connect/start`, {
    headers: await authHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "TikTok connect unavailable");
  return data;
}

export async function postToTikTok(payload: {
  caption: string;
  slides: Array<{ imageUrl: string }>;
  platform?: PublishPlatform;
  firstComment?: string;
  scheduleAt?: string;
}): Promise<{ queued: boolean; message?: string }> {
  const res = await fetch(`${API_BASE}/api/tiktok/post`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "TikTok post failed");
  return data;
}
