import JSZip from "jszip";
import type { Slideshow } from "../types";
import { bakeSlideImage } from "./imageBaker";

export async function exportSlideshowToZip(slideshow: Slideshow): Promise<void> {
  const zip = new JSZip();

  for (let i = 0; i < slideshow.slides.length; i++) {
    const slide = slideshow.slides[i];
    const dataUrl = await bakeSlideImage(slide);
    
    // Extract base64 content from the data URL
    const base64Content = dataUrl.split(",")[1];
    zip.file(`slide-${i + 1}.jpg`, base64Content, { base64: true });
  }

  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = `slideshow-${slideshow.id}.zip`;
  a.click();
  
  URL.revokeObjectURL(url);
}
