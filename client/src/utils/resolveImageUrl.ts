const API_BASE = ((import.meta.env.VITE_API_URL as string) || "").replace(/\/$/, "");

function isPixabayUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.includes("pixabay.com") ||
      parsed.hostname.includes("cdn.pixabay.com")
    );
  } catch {
    return false;
  }
}

export function resolveImageUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("data:")) return url;
  if (!isPixabayUrl(url)) return url;

  const proxyPath = `/api/image-proxy?url=${encodeURIComponent(url)}`;
  return API_BASE ? `${API_BASE}${proxyPath}` : proxyPath;
}
