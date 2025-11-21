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

export interface GlobalItem {
  name: string;
  value: string;
}

export type StyleState = {
  default: Record<string, unknown>;
  hover?: Record<string, unknown>;
};

export type BreakpointStyles = {
  [breakpoint: string]: StyleState;
};

export interface EditorElement {
  id: string;
  type: string;
  children?: EditorElement[];
  content?: string;
}

export interface UIElements {
  id: string;
  type?: ElementType;
  content?: string;
  styles?: BreakpointStyles;
  children?: Element[];
  name?: string;
}

export interface Element {
  id: string;
  type?: ElementType;
  content?: string;
  styles?: BreakpointStyles;
  children?: Element[];
  name?: string;
  htmlId?: string; 
  className?: string;
}

export interface AddElementAction {
  type: 'ADD_ELEMENT';
  payload: {
    elements: Element[];
    parentId: string;
    index: number;
  };
}

export type PageContent = Element[];

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
  draftContent?: Element[];
  draftPageStyles?: PageStyles;
}

export interface EditorElement {
  id: string;
  type: string;
  children?: EditorElement[];
  content?: string;
  styles?: BreakpointStyles;
}

export interface Links {
    href: string;
    text: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

export interface Cta {
    text: string;
    styles?: Record<string, string>;
}

export interface MyComponentContent {
    links: Links[];
    styles?: Record<string, string>;
    cta: Cta;
}