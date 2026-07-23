import { supabaseAdmin } from "./supabaseAdmin.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Downloads an image from a URL and uploads it to Supabase Storage.
 * Returns the permanent public URL.
 */
let bucketVerified = false;

async function ensureBucketExists() {
  if (bucketVerified) return;
  const start = Date.now();
  console.log("[storage] Verifying bucket 'slideshow-images' exists...");
  try {
    const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
    if (error) {
      console.error("[storage] Failed to list buckets:", error.message || error);
      return;
    }
    const hasBucket = buckets?.some((b) => b.name === "slideshow-images");
    if (!hasBucket) {
      console.log("[storage] Bucket 'slideshow-images' not found. Creating it...");
      const { error: createError } = await supabaseAdmin.storage.createBucket("slideshow-images", {
        public: true,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
      });
      if (createError) {
        console.error("[storage] Failed to create bucket:", createError.message || createError);
      } else {
        bucketVerified = true;
        console.log(`[storage] Created bucket 'slideshow-images' successfully in ${Date.now() - start}ms`);
      }
    } else {
      bucketVerified = true;
      console.log(`[storage] Verified bucket 'slideshow-images' exists in ${Date.now() - start}ms`);
    }
  } catch (err: any) {
    console.error("[storage] Exception in ensureBucketExists:", err.message || err);
  }
}

export async function uploadImageToSupabase(imageUrl: string): Promise<string> {
  if (!imageUrl) return imageUrl;

  // Don't process if it's already a Supabase storage URL
  if (imageUrl.includes(".supabase.co/storage/v1/object/public/")) {
    return imageUrl;
  }

  // Don't process base64 data URLs
  if (imageUrl.startsWith("data:")) {
    return imageUrl;
  }

  const overallStart = Date.now();
  console.log(`[storage] Starting Supabase storage transfer for: ${imageUrl.slice(0, 100)}...`);

  try {
    // Check/create bucket once per server lifecycle
    await ensureBucketExists();

    // Fetch with an 8-second timeout to prevent request hanging
    const fetchStart = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(imageUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Upstream image request failed: HTTP ${response.status} ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    console.log(`[storage] Downloaded image (${buffer.length} bytes) in ${Date.now() - fetchStart}ms`);

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const extension = contentType.split("/")[1] || "jpg";
    const filename = `${uuidv4()}.${extension}`;

    // Upload
    const uploadStart = Date.now();
    const { error: uploadError } = await supabaseAdmin.storage
      .from("slideshow-images")
      .upload(filename, buffer, {
        contentType,
        cacheControl: "31536000",
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    console.log(`[storage] Uploaded to Supabase Storage as ${filename} in ${Date.now() - uploadStart}ms`);

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("slideshow-images")
      .getPublicUrl(filename);

    console.log(`[storage] Total Supabase transfer finished successfully in ${Date.now() - overallStart}ms -> ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error: any) {
    console.error(`[storage] Failed transfer to Supabase Storage:`, error.message || error);
    console.log(`[storage] Falling back to original URL: ${imageUrl}`);
    // Fallback to the original URL if upload fails
    return imageUrl;
  }
}
