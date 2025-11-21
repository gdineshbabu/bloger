/* eslint-disable @typescript-eslint/no-explicit-any */
import { ArrowLeftCircle, ArrowRightCircle, ChevronDown, Loader2, Menu, Sparkles, Star, X } from "lucide-react";
import { HTMLAttributes, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useEditorContext } from "./page";
import { RenderElement } from "./page";
import * as lucideIcons from 'lucide-react';
import Image from "next/image";
import clsx from "clsx";

type HeroSlideElement = {
  id: string;
  content?: string; // JSON string
  children?: HeroSlideElement[];
};

type HeroSlideComponentProps = {
  element: HeroSlideElement;
  props?: React.HTMLAttributes<HTMLDivElement>;
  dropProps?: React.HTMLAttributes<HTMLDivElement>;
  renderChildren: (children: HeroSlideElement[], parentId: string) => React.ReactNode;
};

type AccordionContent = {
  title?: string;
};

type AccordionElement = {
  id: string;
  content?: string; // Stored as JSON string
  children?: AccordionElement[];
};

type AccordionComponentProps = {
  element: AccordionElement;
  props?: React.HTMLAttributes<HTMLDivElement>;
  dropProps?: React.HTMLAttributes<HTMLDivElement>;
  renderChildren: (children: AccordionElement[], parentId: string) => React.ReactNode;
};


type HeroContent = {
  backgroundType?: "image" | "video";
  backgroundImageUrl?: string;
  backgroundVideoUrl?: string;
  contentPosition?: "center-middle" | "center-top" | "bottom-left" | "bottom-right";
};

type HeroElement = {
  id: string;
  content?: string; // JSON string
  children?: HeroElement[];
};

type HeroComponentProps = {
  element: HeroElement;
  props?: React.HTMLAttributes<HTMLElement>;
  dropProps?: React.HTMLAttributes<HTMLDivElement>;
  renderChildren: (children: HeroElement[], parentId: string) => React.ReactNode;
};

type SectionContent = {
  imageSrc?: string;
  videoUrl?: string;
  [key: string]: unknown;
};

// Reusable element type (avoids global Element)
type SectionElement = {
  id: string;
  content?: string;
  children?: SectionElement[];
};

// Reusable render function type
type RenderChildrenFn = (
  children: SectionElement[],
  parentId: string
) => React.ReactNode;

// Shared props for droppable sections
type DroppableSectionProps = {
  element: SectionElement;
  dropProps?: React.HTMLAttributes<HTMLDivElement>;
  renderChildren: RenderChildrenFn;
};

type HeroSliderComponentProps = {
  element: HeroSlideElement;
  props?: React.HTMLAttributes<HTMLDivElement>;
  dropProps?: React.HTMLAttributes<HTMLDivElement>;
  selectedElementId: string | null;
};

type DropIndicatorType = {
  parentId: string;
  index: number;
} | null;

type CustomDragOverHandler = (e: React.DragEvent<HTMLDivElement>, parentId: string) => void;
type CustomDropHandler = (e: React.DragEvent<HTMLDivElement>, parentId: string, index: number) => void;

type AutoScrollComponentProps = {
  element: BuilderElement;
  props?: React.HTMLAttributes<HTMLDivElement>;
  dropProps?: React.HTMLAttributes<HTMLDivElement>;
  screenSize: "desktop" | "tablet" | "mobile";
  handleDragOver: CustomDragOverHandler;
  handleDrop: CustomDropHandler;
  dropIndicator: DropIndicatorType;
  selectedElementId: string | null;
};


type BuilderElement = {
  id: string;
  content?: string;
  children?: BuilderElement[];
};

type DropProps = {
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragEnter?: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
};

type HorizontalScrollComponentProps = {
  element: BuilderElement;
  props?: React.HTMLAttributes<HTMLDivElement>;
  renderChildren: (children: BuilderElement[], parentId: string) => React.ReactNode;
  dropProps: DropProps;
};

type SingleAutoScrollProps = {
  element: BuilderElement;
  props?: React.HTMLAttributes<HTMLDivElement>;
  dropProps?: React.HTMLAttributes<HTMLDivElement>;
  selectedElementId: string | null;
};

type ImageCarouselProps = {
  element: BuilderElement;
  props?: React.HTMLAttributes<HTMLDivElement>;
  dropProps?: React.HTMLAttributes<HTMLDivElement>;
};

type CommonProps = {
  element: BuilderElement;
  props?: React.HTMLAttributes<HTMLDivElement>;
};

interface Element {
  id: string;
  children?: Element[];
  [key: string]: any;
}

interface CommonComponentProps extends HTMLAttributes<HTMLElement> {
  element: Element;
  dropProps?: React.HTMLAttributes<HTMLElement>;
  renderChildren: (children: Element[], parentId: string) => ReactNode;
  props?: React.HTMLAttributes<HTMLElement>;
}

export const HeroSlideComponent: React.FC<HeroSlideComponentProps> = ({
  element,
  props = {},
  dropProps = {},
  renderChildren,
}) => {
  const content = JSON.parse(element.content || "{}");

  const getYouTubeVideoId = (url: string) => {
    if (!url) return null;
    const regExp =
      /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const isYouTube = (url: string) => /youtube\.com|youtu\.be/.test(url ?? "");
  const videoId = isYouTube(content.backgroundVideoUrl)
    ? getYouTubeVideoId(content.backgroundVideoUrl)
    : null;
  const youTubeSrc = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0`
    : "";

  return (
    <div {...props} className={`relative w-full h-full overflow-hidden ${props.className ?? ""}`}>
      {content.backgroundType === "image" && content.backgroundImageUrl && (
        <Image
          src={content.backgroundImageUrl}
          alt="background"
          className="absolute top-0 left-0 w-full h-full object-cover z-0"
          width={1000}
          height={1000}
        />
      )}

      {content.backgroundType === "video" && content.backgroundVideoUrl && (
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

      <div className="relative z-10 w-full h-full flex flex-col" {...dropProps}>
        {renderChildren(element.children || [], element.id)}
      </div>
    </div>
  );
};

HeroSlideComponent.displayName = "HeroSlideComponent";


export const AIContentGenerator = ({ onGenerate, promptPlaceholder }: { onGenerate: (prompt: string) => Promise<void>, promptPlaceholder: string }) => {
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        if (!aiPrompt) return;
        setIsGenerating(true);
        await onGenerate(aiPrompt);
        setIsGenerating(false);
        setAiPrompt('');
    };

    return (
        <div className="p-2 border border-dashed border-gray-600 rounded-md mt-4">
            <h5 className="text-xs font-bold text-indigo-400 mb-2">Generate with AI</h5>
            <textarea
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder={promptPlaceholder}
                className="w-full bg-gray-700 rounded-md p-2 text-sm h-20 mb-2"
            />
            <button
                onClick={handleGenerate}
                disabled={isGenerating || !aiPrompt}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 py-2 rounded-md hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-sm"
            >
                {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {isGenerating ? 'Generating...' : 'Generate'}
            </button>
        </div>
    );
};
AIContentGenerator.displayName = 'AIContentGenerator';

export const AccordionComponent: React.FC<AccordionComponentProps> = ({
  element,
  props = {},
  dropProps = {},
  renderChildren,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const content: AccordionContent = (() => {
    try {
      return element.content ? JSON.parse(element.content) : {};
    } catch {
      return {};
    }
  })();

  return (
    <div {...props}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex justify-between items-center p-4 bg-gray-100 text-gray-800 hover:bg-gray-200"
      >
        <span>{content.title || "Accordion Title"}</span>
        <ChevronDown
          className={`transform transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="p-4 bg-white" {...dropProps}>
          {renderChildren(element.children ?? [], element.id)}
        </div>
      )}
    </div>
  );
};

AccordionComponent.displayName = "AccordionComponent";

export const HeroComponent: React.FC<HeroComponentProps> = ({
  element,
  props = {},
  dropProps = {},
  renderChildren,
}) => {
  // Parse content safely and with proper typing
  const content: HeroContent = (() => {
    try {
      return element.content ? JSON.parse(element.content) : {};
    } catch {
      return {};
    }
  })();

  const positionClassMap: Record<
    NonNullable<HeroContent["contentPosition"]>,
    string
  > = {
    "center-middle": "justify-center items-center text-center",
    "center-top": "justify-center items-start text-center",
    "bottom-left": "justify-end items-start text-left",
    "bottom-right": "justify-end items-end text-right",
  };

  const positionClasses =
    positionClassMap[content.contentPosition ?? "center-middle"];

  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    const regExp =
      /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const isYouTube = (url: string): boolean =>
    /youtube\.com|youtu\.be/.test(url ?? "");

  const videoId = isYouTube(content.backgroundVideoUrl ?? "")
    ? getYouTubeVideoId(content.backgroundVideoUrl ?? "")
    : null;

  const youTubeSrc = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0`
    : "";

  return (
    <section
      {...props}
      className={`relative overflow-hidden h-screen ${props.className ?? ""}`}
    >
      {content.backgroundType === "image" && content.backgroundImageUrl && (
        <Image
          src={content.backgroundImageUrl}
          alt="background"
          className="absolute top-0 left-0 w-full h-full object-cover z-0"
          width={1000}
          height={1000}
        />
      )}

      {content.backgroundType === "video" && content.backgroundVideoUrl && (
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
        {...dropProps}
      >
        {renderChildren(element.children ?? [], element.id)}
      </div>
    </section>
  );
};

HeroComponent.displayName = "HeroComponent";


// Add these new components to your file

export const RightImageSection: React.FC<DroppableSectionProps> = ({
  element,
  dropProps = {},
  renderChildren,
}) => {

  return (
    <div
      className="w-1/2 min-h-[100px] flex flex-col justify-center"
      {...dropProps}
    >
      {renderChildren(element.children ?? [], element.id)}
    </div>
  );
};
RightImageSection.displayName = "RightImageSection";

// 🔹 Left Image Section
export const LeftImageSection: React.FC<{ element: SectionElement }> = ({
  element,
}) => {
  const content: SectionContent = (() => {
    try {
      return element.content ? JSON.parse(element.content) : {};
    } catch {
      return {};
    }
  })();

  return (
    <div className="w-1/2">
      {content.imageSrc ? (
        <Image
          src={content.imageSrc}
          alt=""
          className="w-full h-auto object-cover rounded-lg"
          width={1000}
          height={1000}
        />
      ) : (
        <div className="w-full h-full bg-gray-200 rounded-lg" />
      )}
    </div>
  );
};
LeftImageSection.displayName = "LeftImageSection";

// 🔹 Right Video Section
export const RightVideoSection: React.FC<{ element: SectionElement }> = ({
  element,
}) => {
  const content: SectionContent = (() => {
    try {
      return element.content ? JSON.parse(element.content) : {};
    } catch {
      return {};
    }
  })();

  return (
    <div className="w-1/2">
      {content.videoUrl ? (
        <iframe
          className="w-full aspect-video rounded-lg"
          src={String(content.videoUrl)}
          title="Embedded Video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      ) : (
        <div className="w-full aspect-video bg-gray-200 rounded-lg" />
      )}
    </div>
  );
};
RightVideoSection.displayName = "RightVideoSection";

// 🔹 Left Video Section
export const LeftVideoSection: React.FC<DroppableSectionProps> = ({
  element,
  dropProps = {},
  renderChildren,
}) => {
  return (
    <div className="w-1/2 min-h-[100px]" {...dropProps}>
      {renderChildren(element.children ?? [], element.id)}
    </div>
  );
};
LeftVideoSection.displayName = "LeftVideoSection";

export const HeroSliderComponent: React.FC<HeroSliderComponentProps> = ({
  element,
  props = {},
  dropProps = {},
  selectedElementId,
}) => {
  const { state } = useEditorContext();

  const content: { delay?: number } = (() => {
    try {
      return element.content ? JSON.parse(element.content) : {};
    } catch {
      return {};
    }
  })();

  const delay = content.delay ?? 4000;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const totalChildren = element.children?.length ?? 0;

  const childIds = useMemo(() => {
    const getAllIds = (els: HeroSlideElement[]): string[] =>
      els.flatMap((el) => [el.id, ...(el.children ? getAllIds(el.children) : [])]);

    return element.children ? getAllIds(element.children) : [];
  }, [element.children]);

  const isChildSelected =
    selectedElementId !== null && childIds.includes(selectedElementId);

  const isPaused =
    isHovering || isChildSelected || state.selectedElementId === element.id;

  useEffect(() => {
    if (isPaused || totalChildren <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalChildren);
    }, delay);
    return () => clearInterval(interval);
  }, [delay, isPaused, totalChildren]);

  return (
    <div
      {...props}
      {...dropProps}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={clsx("relative w-full h-full overflow-hidden", props.className)}
    >
      {element.children && element.children.length > 0 ? (
        element.children.map((child, index) => (
          <div
            key={child.id}
            className={clsx(
              "absolute w-full h-full transition-opacity duration-1000 ease-in-out",
              index === currentIndex ? "opacity-100" : "opacity-0"
            )}
          >
            <RenderElement
              element={child}
              screenSize="desktop"
              handleDragOver={() => {}}
              handleDrop={() => {}}
              dropIndicator={null}
            />
          </div>
        ))
      ) : (
        <div className="min-h-[60px] flex items-center justify-center text-xs text-gray-400 border-2 border-dashed border-gray-300 rounded-md">
          Drag slides here
        </div>
      )}

      {totalChildren > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {element.children?.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={clsx(
                "w-2 h-2 rounded-full transition-colors",
                currentIndex === index ? "bg-white" : "bg-white/50"
              )}
            ></button>
          ))}
        </div>
      )}
    </div>
  );
};

HeroSliderComponent.displayName = "HeroSliderComponent";

export const HorizontalScrollComponent: React.FC<HorizontalScrollComponentProps> = ({
  element,
  props = {},
  renderChildren,
  dropProps,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    const container = scrollRef.current;
    if (!container) return;
    const scrollAmount = direction === "left" ? -300 : 300;
    container.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  return (
    <div {...props} className={`relative ${props.className ?? ""}`}>
      <div
        ref={scrollRef}
        {...dropProps}
        className="flex gap-4 overflow-x-auto p-4 scroll-smooth no-scrollbar"
      >
        {renderChildren(element.children ?? [], element.id)}
      </div>

      {/* Scroll Buttons */}
      <button
        onClick={() => scroll("left")}
        className="absolute top-1/2 left-2 -translate-y-1/2 bg-white/80 rounded-full p-2 shadow-md hover:bg-white z-10"
        aria-label="Scroll Left"
      >
        <ArrowLeftCircle />
      </button>

      <button
        onClick={() => scroll("right")}
        className="absolute top-1/2 right-2 -translate-y-1/2 bg-white/80 rounded-full p-2 shadow-md hover:bg-white z-10"
        aria-label="Scroll Right"
      >
        <ArrowRightCircle />
      </button>
    </div>
  );
};

HorizontalScrollComponent.displayName = "HorizontalScrollComponent";

export const DropIndicator = () => <div className="w-full h-1 my-1 bg-indigo-500 rounded-full" />;
DropIndicator.displayName = 'DropIndicator';

export const AutoScrollComponent: React.FC<AutoScrollComponentProps> = ({
  element,
  props = {},
  dropProps = {},
  screenSize,
  handleDragOver,
  handleDrop,
  dropIndicator,
  selectedElementId,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const content: { delay?: number } = (() => {
    try {
      return element.content ? JSON.parse(element.content) : {};
    } catch {
      return {};
    }
  })();

  const delay = content.delay ?? 3000;
  const totalChildren = element.children?.length ?? 0;

  // Recursively collect all child IDs
  const childIds = useMemo(() => {
    const getAllIds = (els: BuilderElement[]): string[] =>
      els.flatMap((el) => [el.id, ...(el.children ? getAllIds(el.children) : [])]);

    return element.children ? getAllIds(element.children) : [];
  }, [element.children]);

  const isChildSelected =
    selectedElementId !== null && childIds.includes(selectedElementId);
  const isPaused = isHovering || isChildSelected;

  useEffect(() => {
    if (isPaused || !scrollRef.current || totalChildren <= 1) return;

    const interval = setInterval(() => {
      const container = scrollRef.current;
      if (!container) return;

      const { scrollWidth, scrollLeft, clientWidth } = container;
      const nextIndex = (currentIndex + 1) % totalChildren;

      if (scrollLeft + clientWidth >= scrollWidth - 1) {
        container.scrollTo({ left: 0, behavior: "smooth" });
        setCurrentIndex(0);
      } else {
        const childNode = container.children[nextIndex] as HTMLElement | undefined;
        if (childNode) {
          container.scrollTo({
            left: childNode.offsetLeft,
            behavior: "smooth",
          });
          setCurrentIndex(nextIndex);
        }
      }
    }, delay);

    return () => clearInterval(interval);
  }, [currentIndex, delay, isPaused, totalChildren]);

  return (
    <div
      {...props}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`relative ${props.className ?? ""}`}
    >
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto p-4 scroll-smooth no-scrollbar"
        {...dropProps}
        onDragOver={(e) => handleDragOver(e, element.id)}
        onDrop={(e) => handleDrop(e, element.id, element.children?.length ?? 0)}
      >
        {(element.children ?? []).map((child, i) => (
          <div key={child.id} data-draggable="true">
            {dropIndicator?.parentId === element.id &&
              dropIndicator.index === i && <DropIndicator />}
            <RenderElement
              element={child}
              screenSize={screenSize}
              handleDragOver={() => handleDragOver}
              handleDrop={() => handleDrop}
              dropIndicator={dropIndicator}
            />
          </div>
        ))}
        {dropIndicator?.parentId === element.id &&
          dropIndicator.index === totalChildren && <DropIndicator />}
      </div>

      {totalChildren > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
          <span>
            {currentIndex + 1} / {totalChildren}
          </span>
        </div>
      )}
    </div>
  );
};

AutoScrollComponent.displayName = "AutoScrollComponent";

export const SingleAutoScrollComponent: React.FC<SingleAutoScrollProps> = ({
  element,
  props = {},
  dropProps = {},
  selectedElementId,
}) => {
  const content: { delay?: number; transition?: string } = (() => {
    try {
      return element.content ? JSON.parse(element.content) : {};
    } catch {
      return {};
    }
  })();

  const delay = content.delay ?? 3000;
  const transition = content.transition ?? "fade";
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalChildren = element.children?.length ?? 0;
  const [isHovering, setIsHovering] = useState(false);

  const childIds = useMemo(() => {
    const getAllIds = (els: BuilderElement[]): string[] =>
      els.flatMap((el) => [el.id, ...(el.children ? getAllIds(el.children) : [])]);
    return element.children ? getAllIds(element.children) : [];
  }, [element.children]);

  const isChildSelected =
    selectedElementId !== null && childIds.includes(selectedElementId);
  const isPaused = isHovering || isChildSelected;

  useEffect(() => {
    if (isPaused || totalChildren <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalChildren);
    }, delay);
    return () => clearInterval(interval);
  }, [totalChildren, delay, isPaused]);

  const getTransitionClasses = (index: number): string => {
    const isActive = index === currentIndex;
    const base =
      "transition-all duration-700 ease-in-out absolute w-full h-full flex justify-center items-center";

    if (transition === "fade") {
      return `${base} ${isActive ? "opacity-100" : "opacity-0"}`;
    }

    if (transition.startsWith("slide-")) {
      let transformClass = "";
      if (isActive) {
        transformClass = "transform translate-x-0 translate-y-0";
      } else {
        switch (transition) {
          case "slide-top":
            transformClass = "transform -translate-y-full";
            break;
          case "slide-bottom":
            transformClass = "transform translate-y-full";
            break;
          case "slide-left":
            transformClass = "transform -translate-x-full";
            break;
          case "slide-right":
            transformClass = "transform translate-x-full";
            break;
        }
      }
      return `${base} ${transformClass} ${
        isActive ? "opacity-100" : "opacity-0"
      }`;
    }

    return base;
  };

  return (
    <div
      {...props}
      {...dropProps}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`relative overflow-hidden ${props.className ?? ""}`}
    >
      {(element.children ?? []).map((child, index) => (
        <div key={child.id} className={getTransitionClasses(index)}>
          <RenderElement
            element={child}
            screenSize="desktop"
            handleDragOver={() => {}}
            handleDrop={() => {}}
            dropIndicator={null}
          />
        </div>
      ))}

      {totalChildren === 0 && (
        <div className="min-h-[60px] flex items-center justify-center text-xs text-gray-400 border-2 border-dashed border-gray-300 rounded-md">
          Drag elements here
        </div>
      )}

      {totalChildren > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
          <span>
            {currentIndex + 1} / {totalChildren}
          </span>
        </div>
      )}
    </div>
  );
};

SingleAutoScrollComponent.displayName = "SingleAutoScrollComponent";

export const ImageCarouselComponent: React.FC<ImageCarouselProps> = ({
  element,
  props = {},
  dropProps = {},
}) => {
  const { state } = useEditorContext();
  const content: { delay?: number } = (() => {
    try {
      return element.content ? JSON.parse(element.content) : {};
    } catch {
      return {};
    }
  })();

  const delay = content.delay ?? 3000;
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalChildren = element.children?.length ?? 0;
  const [isHovering, setIsHovering] = useState(false);

  const childIds = useMemo(() => {
    const getAllIds = (els: BuilderElement[]): string[] =>
      els.flatMap((el) => [el.id, ...(el.children ? getAllIds(el.children) : [])]);
    return element.children ? getAllIds(element.children) : [];
  }, [element.children]);

  const isChildSelected =
    state.selectedElementId && childIds.includes(state.selectedElementId);
  const isPaused =
    isHovering || !!isChildSelected || state.selectedElementId === element.id;

  useEffect(() => {
    if (isPaused || totalChildren <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalChildren);
    }, delay);
    return () => clearInterval(interval);
  }, [totalChildren, delay, isPaused]);

  return (
    <div
      {...props}
      {...dropProps}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`relative overflow-hidden ${props.className ?? ""}`}
    >
      {(element.children ?? []).map((child, index) => (
        <div
          key={child.id}
          className={`absolute w-full h-full transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <RenderElement
            element={child}
            screenSize="desktop"
            handleDragOver={() => {}}
            handleDrop={() => {}}
            dropIndicator={null}
          />
        </div>
      ))}

      {totalChildren === 0 && (
        <div className="min-h-[60px] flex items-center justify-center text-xs text-gray-400 border-2 border-dashed border-gray-300 rounded-md">
          Drag images here
        </div>
      )}

      {totalChildren > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {Array.from({ length: totalChildren }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                currentIndex === index ? "bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

ImageCarouselComponent.displayName = "ImageCarouselComponent";

export const TestimonialComponent: React.FC<CommonProps> = ({ element, props = {} }) => {
  const content: {
    avatar?: string;
    name?: string;
    title?: string;
    quote?: string;
  } = (() => {
    try {
      return element.content ? JSON.parse(element.content) : {};
    } catch {
      return {};
    }
  })();

  return (
    <div {...props} className={`text-center ${props.className ?? ""}`}>
      {content.avatar && (
        <Image
          src={content.avatar}
          alt={content.name ?? ""}
          className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
          width={1000}
          height={1000}
        />
      )}
      {content.quote && <p className="text-lg italic mb-4">&quot;{content.quote}&quot;</p>}
      {content.name && <h4 className="font-bold">{content.name}</h4>}
      {content.title && <p className="text-sm text-gray-500">{content.title}</p>}
    </div>
  );
};
TestimonialComponent.displayName = "TestimonialComponent";

// ✅ FAQ Component
export const FaqComponent: React.FC<CommonProps> = ({ element, props = {} }) => {
  const content: {
    items: { id: string; question: string; answer: string; questionColor?: string; answerColor?: string }[];
  } = (() => {
    try {
      return element.content ? JSON.parse(element.content) : { items: [] };
    } catch {
      return { items: [] };
    }
  })();

  const [openItem, setOpenItem] = useState<string | null>(
    content.items?.[0]?.id || null
  );

  return (
    <div {...props} className={props.className}>
      {content.items.map((item) => (
        <div key={item.id} className="border-b border-gray-200 py-4">
          <button
            className="w-full flex justify-between items-center text-left"
            onClick={() => setOpenItem(openItem === item.id ? null : item.id)}
          >
            <h4
              className="font-semibold"
              style={{ color: item.questionColor }}
            >
              {item.question}
            </h4>
            <ChevronDown
              className={`transform transition-transform duration-300 ${
                openItem === item.id ? "rotate-180" : ""
              }`}
            />
          </button>
          {openItem === item.id && (
            <p className="mt-2" style={{ color: item.answerColor }}>
              {item.answer}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};
FaqComponent.displayName = "FaqComponent";

// ✅ Feature Block Component
export const FeatureBlockComponent: React.FC<CommonProps> = ({ element, props = {} }) => {
  const content: { icon?: string; title?: string; text?: string } = (() => {
    try {
      return element.content ? JSON.parse(element.content) : {};
    } catch {
      return {};
    }
  })();

  // Fix: lucide icons are ForwardRefExoticComponent, not React.FC
  const icons = lucideIcons as unknown as Record<string, React.ComponentType<any>>;

  const Icon = (content.icon && icons[content.icon]) || Star;

  return (
    <div {...props} className={`text-center ${props.className ?? ""}`}>
      <Icon className="text-indigo-500 w-10 h-10 mb-4 mx-auto" />
      {content.title && <h3 className="text-xl font-bold mb-2">{content.title}</h3>}
      {content.text && <p className="text-gray-500">{content.text}</p>}
    </div>
  );
};

FeatureBlockComponent.displayName = "FeatureBlockComponent";


export const StepBlockComponent: React.FC<CommonComponentProps> = ({
  element,
  dropProps,
  renderChildren,
  ...props
}) => {
  return (
    <div {...props} {...dropProps}>
      {renderChildren(element.children || [], element.id)}
    </div>
  );
};
StepBlockComponent.displayName = "StepBlockComponent";

export const StepsComponent: React.FC<CommonComponentProps> = ({
  element,
  dropProps,
  renderChildren,
  ...props
}) => {
  return (
    <section {...props} {...dropProps}>
      {renderChildren(element.children || [], element.id)}
    </section>
  );
};
StepsComponent.displayName = "StepsComponent";

export const NavbarComponent = ({ element, screenSize, ...props }: { element: Element; [key: string]: any }) => {
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

    const navStyles = {
        position: navContent.position || 'static',
        top: navContent.top || '0px',
        zIndex: navContent.position === 'fixed' || navContent.position === 'sticky' ? 50 : undefined, // Ensure it stays on top
        left: navContent.position === 'fixed' || navContent.position === 'sticky' ? 0 : undefined,
        right: navContent.position === 'fixed' || navContent.position === 'sticky' ? 0 : undefined,
        ...(props.style || {}) // Merge with existing styles from RenderElement
    };
    
    return (
        <nav {...props} style={navStyles} className={`${props.className || ''} relative`}>
            <style>{`
                .nav-link:hover { color: ${styles.hoverColor || '#4f46e5'} !important; }
            `}</style>
            <div className="flex justify-between items-center w-full">
                {navContent.logo.type === 'image' ? (
                    <Image src={navContent.logo.src} alt={navContent.logo.alt || 'Logo'} className="h-10" width={1000} height={1000}/>
                ) : (
                    <span style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>{navContent.logo.text}</span>
                )}

                {!isMobileView && (
                    <div className="flex items-center gap-6">
                        {navContent.links.map((link: { id: string, label: string, href: string }) => 
                            <a 
                                key={link.id} 
                                href={link.href} 
                                onClick={e => e.preventDefault()} 
                                className={`nav-link transition-all duration-200 ${getHoverClass(styles.hoverAnimation)}`}
                                style={linkStyle}
                            >
                                {link.label}
                            </a>
                        )}
                        {navContent.cta.enabled && 
                            <a 
                                href={navContent.cta.href} 
                                onClick={e => e.preventDefault()} 
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
                                onClick={e => e.preventDefault()}
                                className="nav-link"
                                style={linkStyle}
                            >
                                {link.label}
                            </a>
                        )}
                        {navContent.cta.enabled && 
                            <a 
                                href={navContent.cta.href} 
                                onClick={e => e.preventDefault()} 
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
