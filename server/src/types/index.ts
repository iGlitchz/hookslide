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
}

export interface Slideshow {
  id: string;
  hook: Hook;
  slides: [Slide, Slide];
}

export interface GenerateRequest {
  blurb: string;
  imageBase64: string;
}

export interface RegenerateRequest {
  hook: Hook;
  slideIndex: number;
  blurb: string;
  imagePrompt: string;
}

export interface GenerateResponse {
  slideshows: Slideshow[];
  productImageUrl: string;
}

export interface RegenerateResponse {
  slide: Slide;
}
