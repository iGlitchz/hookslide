import type { Slide } from "../types";
import { resolveImageUrl } from "./resolveImageUrl";

function drawTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  preset?: string,
  color?: string
) {
  const words = text.split(" ");
  let line = "";
  const lines: string[] = [];

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      lines.push(line);
      line = words[n] + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  // Extract font size from ctx.font (e.g. "600 32px Montserrat...")
  const match = ctx.font.match(/(\d+)px/);
  const fontSize = match ? parseInt(match[1], 10) : 32;
  const lineHeight = fontSize * 1.2;

  const startY = y - ((lines.length - 1) * lineHeight) / 2;

  // Render solid badge background
  if (preset === "badge") {
    ctx.save();
    ctx.fillStyle = color || "#8b5cf6";
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    let maxLineWidth = 0;
    for (const l of lines) {
      const w = ctx.measureText(l.trim()).width;
      if (w > maxLineWidth) maxLineWidth = w;
    }

    const boxW = maxLineWidth + 24;
    const boxH = lines.length * lineHeight + 12;
    const boxX = x - boxW / 2;
    const boxY = startY - fontSize / 2 - 8;

    ctx.beginPath();
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(boxX, boxY, boxW, boxH, 8);
    } else {
      ctx.rect(boxX, boxY, boxW, boxH);
    }
    ctx.fill();
    ctx.restore();
  }

  for (let i = 0; i < lines.length; i++) {
    const txt = lines[i].trim();
    const posY = startY + i * lineHeight;
    
    // Draw outline stroke unless preset disables it
    if (preset !== "badge" && preset !== "neon" && preset !== "clean") {
      ctx.strokeText(txt, x, posY);
    }
    ctx.fillText(txt, x, posY);
  }
}

export async function bakeSlideImage(slide: Slide): Promise<string> {
  const width = 576;
  const height = 1024;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2d context");

  // Load image
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = resolveImageUrl(slide.imageUrl);

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image for baking: ${img.src}`));
  });

  // Draw image (cover style)
  const imgRatio = img.width / img.height;
  const canvasRatio = width / height;
  let drawW = width,
    drawH = height,
    drawX = 0,
    drawY = 0;

  if (imgRatio > canvasRatio) {
    drawH = height;
    drawW = img.width * (height / img.height);
    drawX = (width - drawW) / 2;
  } else {
    drawW = width;
    drawH = img.height * (width / img.width);
    drawY = (height - drawH) / 2;
  }

  ctx.drawImage(img, drawX, drawY, drawW, drawH);

  // Draw text overlays
  for (const overlay of slide.textOverlays) {
    if (!overlay.visible) continue;

    ctx.save();

    // Set font family
    const font = overlay.fontFamily || '"Montserrat", "Proxima Nova", system-ui, sans-serif';
    ctx.font = `600 ${overlay.fontSize}px ${font}`;
    
    // Set colors & stroke defaults
    ctx.fillStyle = overlay.color || "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";

    // Set shadow defaults
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 2;

    // Apply preset overrides
    if (overlay.stylePreset === "neon") {
      ctx.lineWidth = 0;
      ctx.strokeStyle = "transparent";
      ctx.shadowColor = overlay.color || "#ffffff";
      ctx.shadowBlur = 15;
      ctx.shadowOffsetY = 0;
    } else if (overlay.stylePreset === "badge") {
      ctx.lineWidth = 0;
      ctx.strokeStyle = "transparent";
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = "white"; // white text inside colored badge
    } else if (overlay.stylePreset === "clean") {
      ctx.lineWidth = 0;
      ctx.strokeStyle = "transparent";
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    }

    const x = (overlay.x / 100) * width;
    const y = (overlay.y / 100) * height;

    drawTextLines(ctx, overlay.text, x, y, width * 0.9, overlay.stylePreset, overlay.color);

    ctx.restore();
  }

  return canvas.toDataURL("image/jpeg", 0.95);
}
