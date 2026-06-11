export interface Hook {
  text: string;
  type: string;
  brief: string;
}

export interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  visible: boolean;
}

export interface Slide {
  id: string;
  imageUrl: string;
  imagePrompt: string;
  textOverlays: TextOverlay[];
  generationSource?: "pixabay" | "ai";
}

export interface Slideshow {
  id: string;
  hook: Hook;
  slides: Slide[];
}

export type PostFormat = "carousel" | "infographic" | "poster";

export interface GenerateRequest {
  blurb: string;
  postFormat?: PostFormat;
  slideCount?: number;
}

export interface RegenerateRequest {
  hook: Hook;
  slideIndex: number;
  blurb: string;
  imagePrompt: string;
  postFormat?: PostFormat;
  generationSource?: "pixabay" | "ai";
  /** Base64 data URI of the original product photo, used for slide 2 regeneration. */
  productImageUrl?: string;
}

export interface GenerateResponse {
  slideshows: Slideshow[];
  productImageUrl: string;
}

export interface RegenerateResponse {
  slide: Slide;
}
