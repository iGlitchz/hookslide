const PIXABAY_BASE = "https://pixabay.com/api/";

function getKey(): string {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) throw new Error("PIXABAY_API_KEY is not set");
  return key;
}

export async function searchPixabayImage(
  query: string,
  orientation: "vertical" | "horizontal" = "vertical"
): Promise<string> {
  // Random page offset (1-3) for more variety across calls
  const page = Math.floor(Math.random() * 3) + 1;
  const params = new URLSearchParams({
    key: getKey(),
    q: query,
    image_type: "photo",
    orientation,
    per_page: "20",
    page: String(page),
    safesearch: "true",
  });

  const res = await fetch(`${PIXABAY_BASE}?${params}`);
  if (!res.ok) throw new Error(`Pixabay API error: ${res.status}`);

  const data = await res.json();
  if (!data.hits || data.hits.length === 0) {
    throw new Error(`No Pixabay results for: ${query}`);
  }

  // Pick a random result from the pool for variety
  const idx = Math.floor(Math.random() * data.hits.length);
  const hit = data.hits[idx];
  const picked = hit.webformatURL || hit.largeImageURL || hit.previewURL;
  if (!picked) {
    throw new Error(`Pixabay hit missing image URLs for: ${query}`);
  }
  return picked.replace(/^http:\/\//i, "https://");
}

const HERO_QUERIES = [
  "person walking city street night",
  "people coffee shop window",
  "woman looking at sunset beach",
  "man working laptop cafe",
  "friends rooftop city view",
  "person exploring market street",
  "couple walking rain umbrella",
  "photographer taking photo urban",
];

export async function getHeroImages(): Promise<string[]> {
  const results = await Promise.allSettled(
    HERO_QUERIES.map((q) => searchPixabayImage(q, "horizontal"))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
    .map((r) => r.value);
}

/**
 * Extract 2-3 meaningful keywords from an image prompt for Pixabay search.
 * Strips common filler words used in AI image prompts.
 */
export function extractKeywords(prompt: string): string {
  const stopWords = new Set([
    "a", "an", "the", "in", "on", "at", "of", "for", "with", "and", "or",
    "is", "are", "that", "this", "to", "from", "by", "as", "it", "its",
    "no", "not", "very", "highly", "extremely", "ultra", "super",
    "detailed", "photorealistic", "cinematic", "professional", "stunning",
    "beautiful", "realistic", "high-quality", "high", "quality", "resolution",
    "8k", "4k", "hdr", "dramatic", "lighting", "scene", "image", "photo",
    "style", "render", "shot", "composition", "frame", "angle", "view",
    "showing", "featuring", "depicts", "depicting", "shows",
  ]);

  const words = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  // Shuffle and pick 2-3 words for a different combo each time
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }
  const count = words.length >= 3 ? (Math.random() < 0.5 ? 2 : 3) : Math.min(words.length, 2);
  return words.slice(0, count).join(" ");
}
