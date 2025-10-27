'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Head from 'next/head';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import {
  FaMobileAlt, FaTabletAlt, FaDesktop, FaArrowLeft,
} from 'react-icons/fa';
import {
  Menu, X, ChevronDown, Star, Loader2, CheckCircle2, AlertCircle, ArrowLeftCircle, ArrowRightCircle,
} from 'lucide-react';
import * as lucideIcons from 'lucide-react';

// --- TYPE DEFINITIONS ---
// Assuming these types are exported from a shared file.
// Adjust the import path as needed based on your project structure.
import {
  PageContent, Element, ElementType, SiteData, PageStyles,
} from '../creator-space/editor'; // Adjust this path

// --- API CLIENT (Read-Only) ---

const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem("blogToken");
};

const apiClient = {
  fetchSite: async (siteId: string): Promise<SiteData> => {
    if (typeof window === 'undefined') {
        return Promise.reject(new Error('Cannot fetch on server'));
    }
    const token = getAuthToken();
    if (!token) throw new Error('Authentication token not found');
    const response = await fetch(`/api/sites/${siteId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
        throw new Error('Failed to fetch site data');
    }
    return response.json();
  },
};

// --- RESPONSIVE HELPERS (Copied from editor) ---

const getScreenSizeClass = (screenSize: 'desktop' | 'tablet' | 'mobile') => {
  switch (screenSize) {
    case 'tablet': return 'w-[768px]';
    case 'mobile': return 'w-[420px]';
    default: return 'w-full';
  }
};

// --- STYLING COMPONENTS (Copied from editor) ---

const DynamicStyleSheet = ({ pageStyles }: { pageStyles: PageStyles }) => {
  const cssVars = pageStyles.globalColors?.map(c => `  --${c.name.toLowerCase()}: ${c.value};`).join('\n');
  const fontVars = pageStyles.globalFonts?.map(f => `  --font-${f.name.toLowerCase()}: ${f.value};`).join('\n');

  const css = `
      :root {
          ${cssVars || ''}
          ${fontVars || ''}
      }
      body {
          font-family: ${pageStyles.fontFamily || "'Inter', sans-serif"};
          background-color: ${pageStyles.backgroundColor || '#f0f2f5'};
          color: ${pageStyles.color || '#111827'};
      }
      ${pageStyles.globalCss || ''}
  `;
  return <style>{css}</style>;
};
DynamicStyleSheet.displayName = 'DynamicStyleSheet';

const DynamicElementStyles = ({ element }: { element: Element }) => {
  const elementId = element.id.replace(/-/g, '_'); // Sanitize for CSS class
  const className = `dynamic_element_${elementId}`;

  const generateBreakpointCss = (breakpoint: 'desktop' | 'tablet' | 'mobile', styles: any) => {
      if (!styles || Object.keys(styles).length === 0) return '';
      const cssString = Object.entries(styles).map(([key, value]) => {
          const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
          return `  ${kebabKey}: ${value};`;
      }).join('\n');
      
      if (breakpoint === 'desktop') return `.${className}:hover {\n${cssString}\n}`;
      if (breakpoint === 'tablet') return `@media (max-width: 1024px) { .${className}:hover {\n${cssString}\n} }`;
      if (breakpoint === 'mobile') return `@media (max-width: 768px) { .${className}:hover {\n${cssString}\n} }`;
      return '';
  };

  const desktopHover = generateBreakpointCss('desktop', element.styles?.desktop?.hover);
  const tabletHover = generateBreakpointCss('tablet', element.styles?.tablet?.hover);
  const mobileHover = generateBreakpointCss('mobile', element.styles?.mobile?.hover);

  return <style>{`${desktopHover}\n${tabletHover}\n${mobileHover}`}</style>;
};
DynamicElementStyles.displayName = 'DynamicElementStyles';


// --- INDIVIDUAL ELEMENT RENDERERS (Copied from editor) ---
// These are the read-only display components.

// Helper for Hero/Video components
const getYouTubeVideoId = (url: string) => {
  if (!url) return null
  const regExp =
    /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  const match = url.match(regExp)
  return match ? match[1] : null
}

const NavbarComponent = ({ element, screenSize, ...props }: { element: Element; screenSize: 'desktop' | 'tablet' | 'mobile'; [key: string]: any }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navContent = JSON.parse(element.content);
  const styles = navContent.styles || {};
  const ctaStyles = navContent.cta?.styles || {};

  const isMobileView = screenSize === 'mobile';

  const getHoverClass = (animation: string) => {
      switch(animation) {
          case 'grow': return 'hover:scale-110';
          case 'shrink': return 'hover:scale-90';
          case 'underline': return 'hover:underline';
          default: return '';
      }
  };
  
  const linkStyle = {
      fontSize: styles.fontSize || '16px',
      color: styles.color || '#111827',
  };

  const ctaStyle = {
      backgroundColor: ctaStyles.backgroundColor || '#4f46e5',
      color: ctaStyles.color || '#ffffff',
      borderRadius: ctaStyles.borderRadius || '8px'
  };
  
  return (
      <nav {...props} className="relative">
          <style>{`
              .nav-link:hover { color: ${styles.hoverColor || '#4f46e5'} !important; }
          `}</style>
          <div className="flex justify-between items-center w-full">
              {navContent.logo.type === 'image' ? (
                  <img src={navContent.logo.src} alt={navContent.logo.alt || 'Logo'} className="h-10"/>
              ) : (
                  <span style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>{navContent.logo.text}</span>
              )}

              {!isMobileView && (
                  <div className="flex items-center gap-6">
                      {navContent.links.map((link: { id: string, label: string, href: string }) => 
                          <a 
                              key={link.id} 
                              href={link.href} 
                              className={`nav-link transition-all duration-200 ${getHoverClass(styles.hoverAnimation)}`}
                              style={linkStyle}
                          >
                              {link.label}
                          </a>
                      )}
                      {navContent.cta.enabled && 
                          <a 
                              href={navContent.cta.href} 
                              className="px-4 py-2 transition-opacity hover:opacity-90"
                              style={ctaStyle}
                          >
                              {navContent.cta.label}
                          </a>
                      }
                  </div>
              )}
              {isMobileView && (
                  <div>
                      <button onClick={(e) => { e.stopPropagation(); setIsMobileMenuOpen(!isMobileMenuOpen) }}>
                          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                      </button>
                  </div>
              )}
          </div>
          {isMobileView && isMobileMenuOpen && (
              <div className="absolute top-full left-0 w-full bg-white text-black mt-2 rounded-md shadow-lg p-4 z-[9999]">
                  <div className="flex flex-col gap-4">
                      {navContent.links.map((link: { id: string, label: string, href: string }) => 
                          <a 
                              key={link.id} 
                              href={link.href} 
                              className="nav-link"
                              style={linkStyle}
                          >
                              {link.label}
                          </a>
                      )}
                      {navContent.cta.enabled && 
                          <a 
                              href={navContent.cta.href} 
                              className="text-center px-4 py-2"
                              style={ctaStyle}
                          >
                              {navContent.cta.label}
                          </a>
                      }
                  </div>
              </div>
          )}
      </nav>
  )
}
NavbarComponent.displayName = 'NavbarComponent';

const HeroComponent = ({
  element,
  props,
  renderChildren,
}: {
  element: Element
  props: any
  renderChildren: any
}) => {
  const content = JSON.parse(element.content || '{}')

  const positionClasses = {
    'center-middle': 'justify-center items-center text-center',
    'center-top': 'justify-center items-start text-center',
    'bottom-left': 'justify-end items-start text-left',
    'bottom-right': 'justify-end items-end text-right',
  }[content.contentPosition || 'center-middle']

  const isYouTube = (url: string) =>
    /youtube\.com|youtu\.be/.test(url ?? '')

  const videoId = isYouTube(content.backgroundVideoUrl)
    ? getYouTubeVideoId(content.backgroundVideoUrl)
    : null

  const youTubeSrc = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0`
    : ''

  return (
    <section
      {...props}
      className={`${props.className || ''} relative overflow-hidden h-screen`}
    >
      {content.backgroundType === 'image' && content.backgroundImageUrl && (
        <img
          src={content.backgroundImageUrl}
          alt="background"
          className="absolute top-0 left-0 w-full h-full object-cover z-0"
        />
      )}

      {content.backgroundType === 'video' && content.backgroundVideoUrl && (
        isYouTube(content.backgroundVideoUrl) && youTubeSrc ? (
          <iframe
            src={youTubeSrc}
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
            title="Background Video"
            className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2 z-0"
          ></iframe>
        ) : (
          <video
            src={content.backgroundVideoUrl}
            autoPlay
            muted
            loop
            playsInline
            className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2 object-cover z-0"
          />
        )
      )}

      <div
        className={`relative z-10 w-full h-full flex flex-col p-8 ${positionClasses}`}
      >
        {renderChildren(element.children || [], element.id)}
      </div>
    </section>
  )
}
HeroComponent.displayName = 'HeroComponent';

const HorizontalScrollComponent = ({ element, props, renderChildren }: { element: Element; props: any, renderChildren: any }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };
  
  return (
    <div {...props}>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto p-4 scroll-smooth no-scrollbar">
        {renderChildren(element.children || [], element.id)}
      </div>
      <button onClick={() => scroll('left')} className="absolute top-1/2 left-2 -translate-y-1/2 bg-white/80 rounded-full p-2 shadow-md hover:bg-white z-10"><ArrowLeftCircle /></button>
      <button onClick={() => scroll('right')} className="absolute top-1/2 right-2 -translate-y-1/2 bg-white/80 rounded-full p-2 shadow-md hover:bg-white z-10"><ArrowRightCircle /></button>
    </div>
  );
};
HorizontalScrollComponent.displayName = 'HorizontalScrollComponent';

const AutoScrollComponent = ({ element, props, screenSize }: { element: Element; props: any, screenSize: 'desktop' | 'tablet' | 'mobile' }) => {
  const content = JSON.parse(element.content || '{}');
  const delay = content.delay || 3000;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const totalChildren = element.children?.length || 0;
  
  const isPaused = isHovering;

  useEffect(() => {
      if (isPaused || !scrollRef.current || totalChildren <= 1) return;

      const interval = setInterval(() => {
          if (scrollRef.current) {
              const { scrollWidth, scrollLeft, clientWidth } = scrollRef.current;
              const nextIndex = (currentIndex + 1) % totalChildren;
              
              if (scrollLeft + clientWidth >= scrollWidth - 1) {
                  scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                    setCurrentIndex(0);
              } else {
                  const childNode = scrollRef.current.children[nextIndex] as HTMLElement;
                  if (childNode) {
                    scrollRef.current.scrollTo({ left: childNode.offsetLeft, behavior: 'smooth' });
                    setCurrentIndex(nextIndex);
                  }
              }
          }
      }, delay);
      return () => clearInterval(interval);
  }, [currentIndex, totalChildren, delay, isPaused]);

  return (
      <div {...props} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
          <div ref={scrollRef} className="flex gap-4 overflow-x-auto p-4 scroll-smooth no-scrollbar">
              {(element.children || []).map((child) => (
                   <div key={child.id}>
                       <RenderElement
                           element={child}
                           screenSize={screenSize}
                       />
                   </div>
              ))}
          </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
              <span>{currentIndex + 1} / {totalChildren}</span>
          </div>
      </div>
  );
}
AutoScrollComponent.displayName = 'AutoScrollComponent';

const SingleAutoScrollComponent = ({ element, props, screenSize }: { element: Element; props: any, screenSize: 'desktop' | 'tablet' | 'mobile' }) => {
  const content = JSON.parse(element.content || '{}');
  const delay = content.delay || 3000;
  const transition = content.transition || 'fade';
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalChildren = element.children?.length || 0;
  const [isHovering, setIsHovering] = useState(false);

  const isPaused = isHovering;

  useEffect(() => {
      if (isPaused || totalChildren <= 1) return;
      const interval = setInterval(() => {
          setCurrentIndex(prevIndex => (prevIndex + 1) % totalChildren);
      }, delay);
      return () => clearInterval(interval);
  }, [totalChildren, delay, isPaused]);

  const getTransitionClasses = (index: number) => {
      const isActive = index === currentIndex;
      let base = 'transition-all duration-700 ease-in-out absolute w-full h-full flex justify-center items-center';
      
      if (transition === 'fade') {
          return `${base} ${isActive ? 'opacity-100' : 'opacity-0'}`;
      }
      if (transition.startsWith('slide-')) {
          let transformClass = '';
          if (isActive) {
              transformClass = 'transform translate-x-0 translate-y-0';
          } else {
              switch(transition) {
                  case 'slide-top': transformClass = 'transform -translate-y-full'; break;
                  case 'slide-bottom': transformClass = 'transform translate-y-full'; break;
                  case 'slide-left': transformClass = 'transform -translate-x-full'; break;
                  case 'slide-right': transformClass = 'transform translate-x-full'; break;
              }
          }
          return `${base} ${transformClass} ${isActive ? 'opacity-100' : 'opacity-0'}`;
      }
      return base;
  }
  
  return (
      <div {...props} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
            {element.children.map((child, index) => (
                 <div key={child.id} className={getTransitionClasses(index)}>
                     <RenderElement element={child} screenSize={screenSize} />
                 </div>
            ))}
            {element.children.length === 0 && <div className="min-h-[60px] flex items-center justify-center text-xs text-gray-400">No slides</div>}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
              <span>{currentIndex + 1} / {totalChildren}</span>
          </div>
      </div>
  );
};
SingleAutoScrollComponent.displayName = 'SingleAutoScrollComponent';

const ImageCarouselComponent = ({ element, props, screenSize }: { element: Element; props: any, screenSize: 'desktop' | 'tablet' | 'mobile' }) => {
  const content = JSON.parse(element.content || '{}');
  const delay = content.delay || 3000;
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalChildren = element.children?.length || 0;
  const [isHovering, setIsHovering] = useState(false);

  const isPaused = isHovering;

  useEffect(() => {
      if (isPaused || totalChildren <= 1) return;

      const interval = setInterval(() => {
          setCurrentIndex(prevIndex => (prevIndex + 1) % totalChildren);
      }, delay);

      return () => clearInterval(interval);
  }, [totalChildren, delay, isPaused]);

  return (
      <div {...props} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
          {element.children.map((child, index) => (
              <div key={child.id} className={`absolute w-full h-full transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}>
                  <RenderElement element={child} screenSize={screenSize} />
              </div>
          ))}
          {element.children.length === 0 && <div className="min-h-[60px] flex items-center justify-center text-xs text-gray-400">No slides</div>}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {element.children.map((_, index) => (
                  <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${currentIndex === index ? 'bg-white' : 'bg-white/50'}`}
                  ></button>
              ))}
          </div>
      </div>
  );
};
ImageCarouselComponent.displayName = 'ImageCarouselComponent';

const HeroSliderComponent = ({ element, props, screenSize }: { element: Element; props: any, screenSize: 'desktop' | 'tablet' | 'mobile' }) => {
  const content = JSON.parse(element.content || '{}');
  const delay = content.delay || 4000;
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalChildren = element.children?.length || 0;
  const [isHovering, setIsHovering] = useState(false);

  const isPaused = isHovering;

  useEffect(() => {
      if (isPaused || totalChildren <= 1) return;
      const interval = setInterval(() => {
          setCurrentIndex(prevIndex => (prevIndex + 1) % totalChildren);
      }, delay);
      return () => clearInterval(interval);
  }, [totalChildren, delay, isPaused]);

  return (
      <div {...props} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
          {element.children.map((child, index) => (
              <div key={child.id} className={`absolute w-full h-full transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}>
                  <RenderElement element={child} screenSize={screenSize} />
              </div>
          ))}
            {element.children.length === 0 && <div className="min-h-[60px] flex items-center justify-center text-xs text-gray-400">No slides</div>}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {element.children.map((_, index) => (
                  <button 
                      key={index} 
                      onClick={() => setCurrentIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${currentIndex === index ? 'bg-white' : 'bg-white/50'}`}
                  ></button>
              ))}
          </div>
      </div>
  );
};
HeroSliderComponent.displayName = 'HeroSliderComponent';

const AccordionComponent = ({ element, props, renderChildren }: { element: Element; props: any, renderChildren: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const content = JSON.parse(element.content || '{}');
  
  return(
      <div {...props}>
          <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-4 bg-gray-100 text-gray-800 hover:bg-gray-200">
              <span>{content.title || 'Accordion Title'}</span>
              <ChevronDown className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
          {isOpen && (
              <div className="p-4 bg-white">
                  {renderChildren(element.children || [], element.id)}
              </div>
          )}
      </div>
  )
};
AccordionComponent.displayName = 'AccordionComponent';

const HeroSlideComponent = ({
  element,
  props,
  renderChildren,
}: {
  element: Element;
  props: any;
  renderChildren: any;
}) => {
  const content = JSON.parse(element.content || '{}');

  const isYouTube = (url: string) => /youtube\.com|youtu\.be/.test(url ?? '');
  const videoId = isYouTube(content.backgroundVideoUrl) ? getYouTubeVideoId(content.backgroundVideoUrl) : null;
  const youTubeSrc = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0` : '';

  return (
    <div {...props} className="relative w-full h-full overflow-hidden">
      {content.backgroundType === 'image' && content.backgroundImageUrl && (
        <img
          src={content.backgroundImageUrl}
          alt="background"
          className="absolute top-0 left-0 w-full h-full object-cover z-0"
        />
      )}
      {content.backgroundType === 'video' && content.backgroundVideoUrl && (
        isYouTube(content.backgroundVideoUrl) && youTubeSrc ? (
          <iframe
            src={youTubeSrc}
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
            title="Background Video"
            className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2 z-0"
          ></iframe>
        ) : (
          <video
            src={content.backgroundVideoUrl}
            autoPlay
            muted
            loop
            playsInline
            className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2 object-cover z-0"
          />
        )
      )}
      <div
        className="relative z-10 w-full h-full flex flex-col"
      >
        {renderChildren(element.children || [], element.id)}
      </div>
    </div>
  );
};
HeroSlideComponent.displayName = 'HeroSlideComponent';

const TestimonialComponent = ({ element, props }: { element: Element; props: any }) => {
  const content = JSON.parse(element.content);
  return (
      <div {...props}>
          <img src={content.avatar} alt={content.name} className="w-20 h-20 rounded-full mx-auto mb-4" />
          <p className="text-lg italic mb-4">"{content.quote}"</p>
          <h4 className="font-bold">{content.name}</h4>
          <p className="text-sm text-gray-500">{content.title}</p>
      </div>
  );
};
TestimonialComponent.displayName = 'TestimonialComponent';

const FaqComponent = ({ element, props }: { element: Element; props: any }) => {
  const content = JSON.parse(element.content);
  const [openItem, setOpenItem] = useState<string | null>(content.items[0]?.id || null);

  return (
      <div {...props}>
          {content.items.map((item: {id: string; question: string; answer: string, questionColor: string, answerColor: string}) => (
              <div key={item.id} className="border-b border-gray-200 py-4">
                  <button className="w-full flex justify-between items-center text-left" onClick={() => setOpenItem(openItem === item.id ? null : item.id)}>
                      <h4 className="font-semibold" style={{color: item.questionColor}}>{item.question}</h4>
                      <ChevronDown className={`transform transition-transform duration-300 ${openItem === item.id ? 'rotate-180' : ''}`} />
                  </button>
                  {openItem === item.id && (
                      <p className="mt-2" style={{color: item.answerColor}}>{item.answer}</p>
                  )}
              </div>
          ))}
      </div>
  );
};
FaqComponent.displayName = 'FaqComponent';

const FeatureBlockComponent = ({ element, props }: { element: Element; props: any }) => {
  const content = JSON.parse(element.content);
  const Icon = (lucideIcons as any)[content.icon] || Star;
  return (
      <div {...props}>
          <Icon className="text-indigo-500 w-10 h-10 mb-4" />
          <h3 className="text-xl font-bold mb-2">{content.title}</h3>
          <p className="text-gray-500">{content.text}</p>
      </div>
  );
};
FeatureBlockComponent.displayName = 'FeatureBlockComponent';

const StepBlockComponent = ({ element, props, renderChildren }: { element: Element; props: any, renderChildren: any }) => {
  return (
      <div {...props}>
          {renderChildren(element.children || [], element.id)}
      </div>
  );
};
StepBlockComponent.displayName = 'StepBlockComponent';

const StepsComponent = ({ element, props, renderChildren }: { element: Element; props: any, renderChildren: any }) => {
  return (
    <section {...props}>
      {renderChildren(element.children || [], element.id)}
    </section>
  );
};
StepsComponent.displayName = 'StepsComponent';


// --- CORE RENDERER (Read-Only) ---

const ElementWrapper = ({ children, element }: { children: React.ReactNode, element: Element }) => {
  // Generate the unique class name for hover styles
  const dynamicClassName = `dynamic_element_${element.id.replace(/-/g, '_')}`;

  return (
      // Add the dynamicClassName to the list of classes
      // This wrapper is read-only, so no blue borders or popups.
      <div id={element.htmlId || undefined} className={`${element.className || ''} ${dynamicClassName}`}>
          {children}
      </div>
  );
};
ElementWrapper.displayName = 'ElementWrapper';

/**
 * This is the read-only version of RenderElement.
 * It's been pruned of all editor-specific logic (context, dispatch, drag/drop, etc.).
 * It reuses the display components (NavbarComponent, HeroComponent, etc.)
 * and the styling logic (DynamicElementStyles, getResponsiveStyles).
 */
const RenderElement = React.memo(({ element, screenSize }: { element: Element; screenSize: 'desktop' | 'tablet' | 'mobile'; }) => {
  
  // This function is the core of the editor's responsive simulation
  const getResponsiveStyles = (element: Element, screenSize: 'desktop' | 'tablet' | 'mobile') => {
      const desktopStyles = element.styles?.desktop?.default || {};
      const tabletStyles = element.styles?.tablet?.default || {};
      const mobileStyles = element.styles?.mobile?.default || {};
      let styles = { ...desktopStyles };
      if (screenSize === 'tablet' || screenSize === 'mobile') {
          styles = { ...styles, ...tabletStyles };
      }
      if (screenSize === 'mobile') {
          styles = { ...styles, ...mobileStyles };
      }
      return styles;
  };
  
  const combinedStyles = getResponsiveStyles(element, screenSize);
  
  if (combinedStyles.display === 'none') {
      return null;
  }
  
  const props = { style: combinedStyles, id: element.htmlId, className: element.className };
  
  const renderChildren = (children: Element[], parentId: string) => (
      <>
          {children.map((child) => (
              <div key={child.id}>
                  <RenderElement element={child} screenSize={screenSize} />
              </div>
          ))}
          {children.length === 0 && (element.type === 'box' || element.type === 'section') && (
            <div className="min-h-[60px]"></div> // Placeholder for empty containers
          )}
      </>
  );
  
  const renderTextContent = () => (
      <div
          dangerouslySetInnerHTML={{ __html: element.content }}
      />
  );
  
  const renderComponent = () => {
      switch (element.type) {
          case 'section':
          case 'box':
              if (element.name === 'Hero Slide') {
                  return <HeroSlideComponent element={element} props={props} renderChildren={renderChildren} />;
              }
          case 'card':
          case 'preview-card':
          case 'detail-card':
          case 'feature-grid':
              return <section {...props}>{renderChildren(element.children || [], element.id)}</section>;
          case 'hero': return <HeroComponent element={element} props={props} renderChildren={renderChildren} />;
          case 'horizontal-scroll': return <HorizontalScrollComponent element={element} props={props} renderChildren={renderChildren} />;
          case 'auto-scroll': return <AutoScrollComponent element={element} props={props} screenSize={screenSize} />;
          case 'single-auto-scroll': return <SingleAutoScrollComponent element={element} props={props} screenSize={screenSize} />;
          case 'image-carousel': return <ImageCarouselComponent element={element} props={props} screenSize={screenSize} />;
          case 'hero-slider': return <HeroSliderComponent element={element} props={props} screenSize={screenSize} />;
          case 'accordion': return <AccordionComponent element={element} props={props} renderChildren={renderChildren} />;
          case 'feature-block': return <FeatureBlockComponent element={element} props={props}/>;
          case 'steps': return <StepsComponent element={element} props={props} renderChildren={renderChildren} />;
          case 'step-block': return <StepBlockComponent element={element} props={props} renderChildren={renderChildren} />;
          case 'step-connector': return <div {...props} />;
          case 'testimonial': return <TestimonialComponent element={element} props={props}/>;
          case 'faq': return <FaqComponent element={element} props={props} />;
          case 'profile-card': {
              return (
                  <div {...props}>
                      {renderChildren(element.children || [], element.id)}
                  </div>
              );
          };
          case 'video-right-section': {
              const content = JSON.parse(element.content || '{}');
              const videoSettings = content.video || { url: content.videoUrl, autoplay: false, controls: true, loop: false, muted: false };

              const videoElement: Element = {
                  type: 'video',
                  id: `${element.id}-vid`,
                  content: JSON.stringify(videoSettings),
                  children: [],
                  styles: {
                      desktop: { default: { width: '100%', borderRadius: '8px', aspectRatio: '16 / 9' }, hover: {} },
                      tablet: { default: {}, hover: {} }, mobile: { default: {}, hover: {} }
                  }
              };
              return (
                  <section {...props}>
                      <div className="flex-1 min-h-[100px]">
                          {renderChildren(element.children || [], element.id)}
                      </div>
                      <div className="flex-1 min-h-[250px]">
                          <RenderElement element={videoElement} screenSize={screenSize} />
                      </div>
                  </section>
              );
          }
          case 'video-left-section': {
            const content = JSON.parse(element.content || '{}');
            const videoSettings = content.video || { url: content.videoUrl, autoplay: false, controls: true, loop: false, muted: false };

            const videoElement: Element = {
                type: 'video',
                id: `${element.id}-vid`,
                content: JSON.stringify(videoSettings),
                children: [],
                styles: {
                    desktop: { default: { width: '100%', borderRadius: '8px', aspectRatio: '16 / 9' }, hover: {} },
                    tablet: { default: {}, hover: {} }, mobile: { default: {}, hover: {} }
                }
            };
              return (
                  <section {...props}>
                      <div className="flex-1 min-h-[250px]">
                          <RenderElement element={videoElement} screenSize={screenSize} />
                      </div>
                      <div className="flex-1 min-h-[100px]">
                          {renderChildren(element.children || [], element.id)}
                      </div>
                  </section>
              );
          }
          case 'right-image-section': {
              const content = JSON.parse(element.content || '{}');
              const imageElement: Element = {
                  type: 'image', id: `${element.id}-img`, content: content.imageSrc, children: [],
                  styles: {
                      desktop: { default: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }, hover: {} },
                      tablet: { default: {}, hover: {} }, mobile: { default: {}, hover: {} }
                  }
              };
              return (
                  <section {...props}>
                      <div className="flex-1 min-h-[100px]">
                          {renderChildren(element.children || [], element.id)}
                      </div>
                      <div className="flex-1 flex min-h-[250px]">
                          <RenderElement element={imageElement} screenSize={screenSize} />
                      </div>
                  </section>
              )
          }
          case 'left-image-section': {
            const content = JSON.parse(element.content || '{}');
            const imageElement: Element = {
                type: 'image', id: `${element.id}-img`, content: content.imageSrc, children: [],
                styles: {
                    desktop: { default: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }, hover: {} },
                    tablet: { default: {}, hover: {} }, mobile: { default: {}, hover: {} }
                }
            };
              return (
                  <section {...props}>
                      <div className="flex-1 flex min-h-[250px]">
                          <RenderElement element={imageElement} screenSize={screenSize} />
                      </div>
                      <div className="flex-1 min-h-[100px]">
                          {renderChildren(element.children || [], element.id)}
                      </div>
                  </section>
              )
          }
          case 'columns': {
              const content = JSON.parse(element.content);
              return (
                  <div {...props}>
                      {content.columns.map((col: { id: string; children: Element[] }) => (
                          <div key={col.id} className="flex-1" style={{ minHeight: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                              {renderChildren(col.children, col.id)}
                          </div>
                      ))}
                  </div>
              );
          }
          case 'heading': case 'paragraph': case 'ordered-list': case 'unordered-list': return <div {...props}>{renderTextContent()}</div>;
          case 'gallery': {
              const galleryContent = JSON.parse(element.content);
              const gridStyle = {
                  ...combinedStyles,
                  gridTemplateColumns: `repeat(${galleryContent.columns || 3}, 1fr)`
              };
              return <div {...props} style={gridStyle}>{galleryContent.images.map((src: string, i: number) => <img key={i} src={src} alt={`Gallery image ${i+1}`} style={{width: '100%', height: 'auto', borderRadius: '8px'}} />)}</div>;
          }
          case 'footer': {
              return <footer {...props}>{renderChildren(element.children || [], element.id)}</footer>;
          }
          case 'navbar': return <NavbarComponent element={element} screenSize={screenSize} {...props} />;
          case 'video': {
              let videoContent;
              try {
                  videoContent = JSON.parse(element.content);
              } catch (e) {
                  videoContent = { url: element.content, autoplay: false, controls: true, loop: false, muted: false };
              }

              const { url, autoplay, controls, loop, muted } = videoContent;
              const videoId = getYouTubeVideoId(url);
              const params = new URLSearchParams();
              if (autoplay) params.set('autoplay', '1');
              if (!controls) params.set('controls', '0');
              if (loop && videoId) {
                  params.set('loop', '1');
                  params.set('playlist', videoId);
              }
              if (muted) params.set('mute', '1');
              if (autoplay) params.set('playsinline', '1');

              const finalUrl = `${url.split('?')[0]}?${params.toString()}`;

              return <iframe {...props} src={finalUrl} title="Embedded Video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>;
          }
          case 'divider': return <div {...props} />;
          case 'contact-form': {
          const formContent = JSON.parse(element.content);
          
          const renderField = (field: { id: string; label: string; type: string }) => {
              const commonProps = {
              className: "p-2 border border-gray-300 rounded bg-white text-black",
              placeholder: `Enter ${field.label}...`
              };

              switch (field.type) {
              case 'textarea':
                  return <textarea {...commonProps} rows={4}></textarea>;
              default:
                  return <input type={field.type} {...commonProps} />;
              }
          };

          return (
              <form {...props} onSubmit={e => e.preventDefault()}>
              {formContent.fields.map((field: { id: string, label: string, type: string }) => (
                  <div key={field.id} className="flex flex-col mb-4">
                  <label className="mb-1 text-sm text-gray-700">{field.label}</label>
                  {renderField(field)}
                  </div>
              ))}
              <button type="submit" style={{ backgroundColor: '#4f46e5', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                  {formContent.buttonText}
              </button>
              </form>
          );
          }
          case 'image': return <img {...props} src={element.content} alt="" />;
          case 'button': return <button {...props}>{element.content}</button>;
          default: return <div {...props} className="p-4 bg-gray-200 text-gray-800 rounded">Invalid Element: {element.type}</div>;
      }
  };
  
  return (
      <>
          <DynamicElementStyles element={element} />
          {/* We use the pruned ElementWrapper for applying the dynamic class name */}
          <ElementWrapper element={element}>
              {renderComponent()}
          </ElementWrapper>
      </>
  );
});
RenderElement.displayName = 'RenderElement';


// --- MAIN PREVIEW PAGE COMPONENT ---

export default function LivePreviewPage() {
  const router = useRouter();
  const params = useParams();
  const siteId = params.siteId as string;
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const token = isClient ? getAuthToken() : null;

  const { data: currentSite, error: apiError, isLoading } = useSWR(
    siteId && token ? [`/api/sites/${siteId}`, token] : null,
    () => apiClient.fetchSite(siteId)
  );

  const [screenSize, setScreenSize] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  if (!isClient || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <Loader2 className="animate-spin mr-2" /> Loading Preview...
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
        <AlertCircle className="text-red-400 mb-2" size={48} />
        <h1 className="text-xl font-bold mb-2">Failed to load site data.</h1>
        <p className="text-gray-400">{apiError.message}</p>
      </div>
    );
  }

  if (!currentSite) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
        <AlertCircle className="text-yellow-400 mb-2" size={48} />
        <h1 className="text-xl font-bold">Site not found.</h1>
        <p className="text-gray-400">The site you are trying to preview does not exist or you do not have permission.</p>
      </div>
    );
  }

  const { draftContent, draftPageStyles } = currentSite;
  const pageStyles = draftPageStyles || {} as PageStyles;
  const pageContent = draftContent || [];

  return (
    <div className="flex flex-col h-screen font-sans antialiased">
      <Head>
        <title>{currentSite?.title || 'Live Preview'}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <DynamicStyleSheet pageStyles={pageStyles}/>

      {/* Header for responsive toggles */}
      <header className="flex-shrink-0 w-full z-50 flex h-14 items-center justify-between px-4 bg-gray-900/80 backdrop-blur-md border-b border-gray-700 text-white">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-md hover:bg-gray-700 transition-colors" title="Back to Editor">
            <FaArrowLeft />
          </button>
          <h1 className="text-lg font-semibold">{currentSite?.title} - Live Preview</h1>
        </div>
        <div className="flex items-center gap-1 bg-gray-800 p-1 rounded-lg">
          {['desktop', 'tablet', 'mobile'].map((size) => (
            <button key={size} onClick={() => setScreenSize(size as any)} className={`p-2 rounded-md transition-colors ${screenSize === size ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700'}`} title={`${size.charAt(0).toUpperCase() + size.slice(1)} View`}>
              {size === 'desktop' && <FaDesktop />}
              {size === 'tablet' && <FaTabletAlt />}
              {size === 'mobile' && <FaMobileAlt />}
            </button>
          ))}
        </div>
      </header>

      {/* Main Canvas Area */}
      <main className="flex-1 overflow-auto p-0" style={{ backgroundColor: pageStyles.backgroundColor }}>
        <div
          className={`mx-auto bg-white shadow-2xl transition-all duration-300 relative ${getScreenSizeClass(screenSize)}`}
          style={{ ...pageStyles, minHeight: '100%', color: pageStyles.color, fontFamily: pageStyles.fontFamily }}
        >
          {pageContent.map((element) => (
            <RenderElement key={element.id} element={element} screenSize={screenSize} />
          ))}
        </div>
      </main>
    </div>
  );
}