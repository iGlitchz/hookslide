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

export interface GenerationOptions {
  blurb: string;
  postFormat: PostFormat;
  slideCount: number;
  attachments: File[];
}

export interface Submission {
  id: string;
  productImageUrl: string;
  brandBlurb: string;
  postFormat?: PostFormat;
  slideshows: Slideshow[];
  createdAt: number;
}
