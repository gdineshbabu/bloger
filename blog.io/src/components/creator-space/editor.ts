// types/editor.ts

export type ElementType =
  | 'section'
  | 'navbar'
  | 'heading'
  | 'paragraph'
  | 'image'
  | 'video'
  | 'text-field'
  | 'blocks'
  | 'steps'
  | 'step-block'
  | 'step-connector'
  | 'feature-grid'
  | 'feature-block'
  | 'gallery'
  | 'gallery-image'
  | 'testimonial'
  | 'testimonial-quote'
  | 'testimonial-author'
  | 'contact-form'
  | 'form-field'
  | 'footer'
  | 'button'
  | 'link'
  | 'hero'
  | 'right-image-section'
  | 'left-image-section'
  | 'box'
  | 'card'
  | 'video-right-section'
  | 'video-left-section'
  | 'horizontal-scroll'
  | 'auto-scroll'
  | 'single-auto-scroll'
  | 'multi-auto-scroll'
  | 'image-carousel'
  | 'hero-slider'
  | 'ordered-list'
  | 'unordered-list'
  | 'detail-card'
  | 'columns'
  | 'preview-card'
  | 'faq'
  | 'profile-card'
  | 'divider'
  | 'accordion'

;

export interface Element {
  id: string;
  type: ElementType;
  content?: string;
  styles?: { [key: string]: string };
  children?: Element[];
}

export type PageContent = Element[];

export interface GlobalItem {
  name: string;
  value: string;
}

export interface PageStyles {
  fontFamily?: string;
  backgroundColor?: string;
  color?: string;
  globalCss?: string;
  globalColors?: GlobalItem[];
  globalFonts?: GlobalItem[];
  [key: string]: string | GlobalItem[] | undefined; // now allows those arrays
}

export interface SiteData {
  id: string;
  ownerId: string;
  title: string;
  subdomain: string;
  content: PageContent;
  pageStyles: PageStyles;
  createdAt?: object;
  stats?: { views: number; posts: number };
  status?: string;
}