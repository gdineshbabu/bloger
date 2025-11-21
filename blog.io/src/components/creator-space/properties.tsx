import { AlertCircle, CheckCircle2, ChevronDown, Columns, Loader2, LucideProps, X } from "lucide-react";
import { createContext, useState } from "react";
import { Element, ElementType, PageContent, PageStyles } from "./editor";
import { StyleInput } from "./inputs";
import { FaPlus, FaTrashAlt } from "react-icons/fa";
import { createNewElement, useEditorContext } from "./page";
import { generateContentWithGemini, lucideIconOptions } from "./common";
import { AIContentGenerator } from "./components";

interface DraggableItemProps {
    type?: string;
    icon: React.ComponentType<LucideProps>;
    label: string;
}

interface EditorElement {
  id: string;
  type: string;
  name?: string;
  children?: EditorElement[];
}

interface VideoContent {
    url: string | undefined;
    controls: boolean;
    autoplay: boolean;
    loop: boolean;
    muted: boolean;
}

interface VideoPropertiesProps {
    content: VideoContent;
    onContentChange: (c: VideoContent) => void;
}

interface HeroSlideContent {
    backgroundType: 'image' | 'video';
    backgroundImageUrl?: string;
    backgroundVideoUrl?: string;
}

interface HeroSlidePropertiesProps {
    element: Element;
    content: HeroSlideContent;
    onContentChange: (c: HeroSlideContent) => void;
}

interface SplitSectionContent {
  imageSrc?: string;
  video?: VideoContent;
  videoUrl?: string; // fallback for older data
}

interface SplitSectionPropertiesProps {
  element: Element;
  content: SplitSectionContent;
  onContentChange: (c: SplitSectionContent) => void;
}

interface FormField {
  name: string;
  id: string;
  label: string;
  type: string;
  fieldId: string;
}

interface ContactFormContent {
  fields: FormField[];
  buttonText: string;
}

interface ContactFormPropertiesProps {
  content: ContactFormContent;
  onContentChange: (c: ContactFormContent) => void;
}

interface TestimonialContent {
  avatar: string;
  quote: string;
  name: string;
  title: string;
}

interface TestimonialPropertiesProps {
  content: TestimonialContent;
  onContentChange: (c: TestimonialContent) => void;
}

interface FeatureGridContent {
  columnCount?: number;
}

interface FeatureGridPropertiesProps {
  element: Element;
  content: FeatureGridContent;
  onContentChange: (c: FeatureGridContent) => void;
}

interface FeatureBlockContent {
  icon: string;
  title: string;
  text: string;
}

interface FeatureBlockPropertiesProps {
  content: FeatureBlockContent;
  onContentChange: (updated: FeatureBlockContent) => void;
}

interface StepBlockPropertiesProps {
  element: Element;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  questionColor: string;
  answerColor: string;
}

interface FaqContent {
  items: FaqItem[];
}

interface FaqPropertiesProps {
  content: FaqContent;
  onContentChange: (updated: FaqContent) => void;
}

interface SliderDelayContent {
  delay: number;
}

interface SliderDelayPropertiesProps {
  content: SliderDelayContent;
  onContentChange: (updated: SliderDelayContent) => void;
}

interface EditorElement {
  id: string;
  type: string;
  name?: string;
  content?: string;
  children?: EditorElement[];
}

interface AutoScrollContent {
  delay: number;
}

interface AutoScrollPropertiesProps {
  content: AutoScrollContent;
  onContentChange: (content: AutoScrollContent) => void;
}

interface SingleAutoScrollContent {
  delay: number;
  transition: string;
}

interface SingleAutoScrollPropertiesProps {
  element: Element;
  content: SingleAutoScrollContent;
  onContentChange: (content: SingleAutoScrollContent) => void;
}

interface AccordionContent {
  title: string;
}

interface AccordionPropertiesProps {
  content: AccordionContent;
  onContentChange: (content: AccordionContent) => void;
}

interface HeroContent {
  backgroundType: "image" | "video";
  backgroundImageUrl?: string;
  backgroundVideoUrl?: string;
  contentPosition: "center-middle" | "center-top" | "bottom-left" | "bottom-right";
}

interface HeroPropertiesProps {
  element: Element;
  content: HeroContent;
  onContentChange: (content: HeroContent) => void;
}

export type EditorAction =
  | { type: 'SET_INITIAL_STATE'; payload: { content: PageContent, pageStyles: PageStyles } }
  | { type: 'ADD_ELEMENT'; payload: { elements: Element[]; parentId: string; index: number } }
  | { type: 'UPDATE_ELEMENT_STYLES'; payload: { elementId: string; styles: object; breakpoint: 'desktop' | 'tablet' | 'mobile'; state: 'default' | 'hover' } }
  | { type: 'UPDATE_ELEMENT_ATTRIBUTE'; payload: { elementId: string; attribute: 'htmlId' | 'className'; value: string } }
  | { type: 'UPDATE_ELEMENT_CONTENT'; payload: { elementId: string; content: string } }
  | { type: 'DELETE_ELEMENT'; payload: { elementId: string } }
  | { type: 'DUPLICATE_ELEMENT'; payload: { elementId: string } }
  | { type: 'MOVE_ELEMENT'; payload: { draggedId: string; targetParentId: string; targetIndex: number } }
  | { type: 'SET_SELECTED_ELEMENT'; payload: string | null }
  | { type: 'SET_PAGE_STYLES'; payload: object }
  | { type: 'ADD_HISTORY' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'REVERT_TO_VERSION'; payload: { content: PageContent, pageStyles: PageStyles } }
  | { type: 'WRAP_IN_COLUMNS'; payload: { elementId: string } }
  | { type: 'SET_PAGE_CONTENT'; payload: PageContent };;

export interface EditorState {
  pageContent: PageContent;
  selectedElementId: string | null;
  pageStyles: PageStyles;
  history: { content: PageContent; timestamp: number }[];
  historyIndex: number;
}

export const initialState: EditorState = {
  pageContent: [],
  selectedElementId: null,
  pageStyles: {
    fontFamily: "'Inter', sans-serif",
    backgroundColor: '#f0f2f5',
    color: '#111827',
    globalCss: '.custom-class {\n  background-color: orange;\n}\n\n.no-scrollbar::-webkit-scrollbar {\n  display: none;\n}\n\n.no-scrollbar {\n  -ms-overflow-style: none;\n  scrollbar-width: none;\n}',
    globalColors: [
      { name: 'Primary', value: '#4f46e5' },
      { name: 'Secondary', value: '#10b981' },
      { name: 'Accent', value: '#f59e0b' },
      { name: 'Text', value: '#111827' },
      { name: 'Background', value: '#ffffff' },
    ],
    globalFonts: [
      { name: 'Heading', value: "'Inter', sans-serif" },
      { name: 'Body', value: "'Inter', sans-serif" },
    ]
  },
  history: [],
  historyIndex: -1,
};

export const getUniqueId = (type: ElementType) => `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;


export const CollapsibleGroup = ({ title, children, open = false }: { title: string, children: React.ReactNode, open?: boolean }) => {
  const [isOpen, setIsOpen] = useState(open);
  return (
    <div className="rounded-md bg-gray-800 mb-2">
      <button onClick={() => setIsOpen(!isOpen)} className="flex justify-between items-center w-full px-3 py-2 text-left text-white font-medium">
        <span>{title}</span>
        <ChevronDown size={20} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[2000px]' : 'max-h-0'}`}>
        <div className="p-3 border-t border-gray-700">{children}</div>
      </div>
    </div>
  );
};
CollapsibleGroup.displayName = 'CollapsibleGroup';

export const ChildElementSelector = ({ element }: { element: Element }) => {
  const { state, dispatch } = useEditorContext();

  return (
    <>
      <h4 className="text-sm font-bold mt-4 mb-2">Child Elements</h4>
      <div className="space-y-1 max-h-40 overflow-y-auto border border-gray-700 rounded-md p-1">
        {element.children?.map((child) => (
          <button
            key={child.id}
            onClick={(e) => {
              e.stopPropagation();
              dispatch({ type: 'SET_SELECTED_ELEMENT', payload: child.id });
            }}
            className={`w-full text-left p-2 rounded-md text-xs ${
              state.selectedElementId === child.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {child.name || child.type}
          </button>
        ))}
        {(!element.children || element.children.length === 0) && (
          <p className="text-xs text-gray-500 p-2">
            This element has no children.
          </p>
        )}
      </div>
    </>
  );
};

ChildElementSelector.displayName = 'ChildElementSelector';


export const WrapInColumnsProperties = ({ elementId }: { elementId: string }) => {
    const { dispatch } = useEditorContext();

    const handleWrapClick = () => {
        dispatch({ type: 'WRAP_IN_COLUMNS', payload: { elementId } });
    };

    return (
        <button
            onClick={handleWrapClick}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 py-2 rounded-md hover:bg-indigo-500 text-sm"
        >
            <Columns size={14} /> Add Element Beside
        </button>
    );
};
WrapInColumnsProperties.displayName = 'WrapInColumnsProperties';

export const VideoProperties = ({ content, onContentChange }: VideoPropertiesProps) => {
    const handleCheckboxChange = (key: keyof VideoContent, checked: boolean) => {
        onContentChange({ ...content, [key]: checked });
    };

    return (
        <>
            <StyleInput
                label="Video URL"
                value={content.url as string}
                onChange={val => onContentChange({ ...content, url: val })}
            />
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
                {(['controls', 'autoplay', 'loop', 'muted'] as (keyof VideoContent)[]).map(key => (
                    <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                            type="checkbox"
                            checked={Boolean(content[key])}
                            onChange={e => handleCheckboxChange(key, e.target.checked)}
                        />
                        <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                    </label>
                ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">
                Note: Most modern browsers require a video to be <strong>muted</strong> for autoplay to work.
            </p>
        </>
    );
};

VideoProperties.displayName = 'VideoProperties';

export const HeroSlideProperties = ({
    element,
    content,
    onContentChange,
}: HeroSlidePropertiesProps) => {
    return (
        <>
            <StyleInput
                label="Background Type"
                type="select"
                value={content.backgroundType}
                onChange={val =>
                    onContentChange({
                        ...content,
                        backgroundType: val as 'image' | 'video',
                    })
                }
                options={[
                    { label: 'Image', value: 'image' },
                    { label: 'Video', value: 'video' },
                ]}
            />

            {content.backgroundType === 'image' ? (
                <StyleInput
                    label="Background Image URL"
                    value={content.backgroundImageUrl || ''}
                    onChange={val =>
                        onContentChange({ ...content, backgroundImageUrl: val })
                    }
                />
            ) : (
                <StyleInput
                    label="Background Video URL"
                    value={content.backgroundVideoUrl || ''}
                    onChange={val =>
                        onContentChange({ ...content, backgroundVideoUrl: val })
                    }
                />
            )}

            <ChildElementSelector element={element} />
        </>
    );
};

HeroSlideProperties.displayName = 'HeroSlideProperties';

export const SplitSectionProperties = ({
  element,
  content,
  onContentChange,
}: SplitSectionPropertiesProps) => {
  const { dispatch } = useEditorContext();
  const isVideo = element.type!.includes("video");

  const handleVideoChange = (videoSettings: VideoContent) => {
    onContentChange({ ...content, video: videoSettings });
  };

  const handleAddElement = () => {
    const newElement = createNewElement("heading") as Element;
    dispatch({
      type: "ADD_ELEMENT",
      payload: {
        elements: [newElement],
        parentId: element.id,
        index: element.children?.length || 0,
      },
    });
  };

  return (
    <>
      {isVideo ? (
        <CollapsibleGroup title="Video Settings" open>
          <VideoProperties
            content={
                content.video || {
                url: content.videoUrl || "",
                controls: true,
                autoplay: false,
                loop: false,
                muted: false,
                }
            }
            onContentChange={handleVideoChange}
          />

        </CollapsibleGroup>
      ) : (
        <StyleInput
          label="Image URL"
          value={content.imageSrc || ""}
          onChange={(val) => onContentChange({ ...content, imageSrc: val })}
        />
      )}

      <div className="my-4 border-t border-gray-700"></div>

      <h4 className="text-sm font-bold mb-2">Content Area</h4>
      <p className="text-xs text-gray-400 mb-2">
        Add elements to the content area using the button below.
      </p>

      <button
        onClick={handleAddElement}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 py-2 rounded-md hover:bg-indigo-500 text-sm"
      >
        <FaPlus size={12} /> Add Element
      </button>

      <ChildElementSelector element={element} />
    </>
  );
};

SplitSectionProperties.displayName = "SplitSectionProperties";

export const ContactFormProperties = ({
  content,
  onContentChange,
}: ContactFormPropertiesProps) => {
  const handleFieldChange = (
    index: number,
    field: keyof FormField,
    value: string
  ) => {
    const newFields = content.fields.map((f, i) =>
      i === index ? { ...f, [field]: value } : f
    )
    onContentChange({ ...content, fields: newFields })
  }

  const handleAddField = () => {
    const uid = getUniqueId("form-field")

    const newField: FormField = {
      id: uid,
      label: "New Field",
      type: "text",
      name: uid,
      fieldId: uid,
    }

    onContentChange({ ...content, fields: [...content.fields, newField] })
  }

  const handleRemoveField = (index: number) => {
    const newFields = content.fields.filter((_, i) => i !== index)
    onContentChange({ ...content, fields: newFields })
  }

  return (
    <>
      <h4 className="text-sm font-bold mt-4 mb-2">Form Fields</h4>

      {content.fields.map((field, index) => (
        <div
          key={field.id}
          className="flex flex-col gap-2 mb-4 p-3 bg-gray-700 rounded-md"
        >
          <input
            type="text"
            placeholder="Label"
            value={field.label}
            onChange={(e) => handleFieldChange(index, "label", e.target.value)}
            className="bg-gray-600 rounded px-2 py-1 text-sm"
          />

          <select
            value={field.type}
            onChange={(e) => handleFieldChange(index, "type", e.target.value)}
            className="bg-gray-600 rounded px-2 py-1 text-sm"
          >
            <option value="text">Text</option>
            <option value="textarea">Text Area</option>
            <option value="email">Email</option>
            <option value="password">Password</option>
            <option value="tel">Telephone</option>
            <option value="url">URL</option>
            <option value="search">Search</option>
            <option value="number">Number</option>
            <option value="range">Range Slider</option>
            <option value="date">Date</option>
            <option value="datetime-local">Date & Time</option>
            <option value="month">Month</option>
            <option value="week">Week</option>
            <option value="time">Time</option>
            <option value="checkbox">Checkbox</option>
            <option value="radio">Radio Button</option>
            <option value="file">File Upload</option>
            <option value="color">Color Picker</option>
            <option value="hidden">Hidden</option>
          </select>

          <input
            type="text"
            placeholder="Field Name"
            value={field.name ?? ""}
            onChange={(e) => handleFieldChange(index, "name", e.target.value)}
            className="bg-gray-600 rounded px-2 py-1 text-sm"
          />

          <input
            type="text"
            placeholder="Field ID"
            value={field.fieldId ?? ""}
            onChange={(e) => handleFieldChange(index, "fieldId", e.target.value)}
            className="bg-gray-600 rounded px-2 py-1 text-sm"
          />

          <button
            onClick={() => handleRemoveField(index)}
            className="cursor-pointer p-1 bg-red-500 hover:bg-red-600 rounded text-white text-sm w-fit"
          >
            <FaTrashAlt size={12} />
          </button>
        </div>
      ))}

      <button
        onClick={handleAddField}
        className="cursor-pointer text-indigo-400 text-sm mt-2 flex items-center gap-1"
      >
        <FaPlus size={10} /> Add Field
      </button>

      <h4 className="text-sm font-bold mt-4 mb-2">Button</h4>
      <StyleInput
        label="Button Text"
        value={content.buttonText}
        onChange={(val) =>
          onContentChange({
            ...content,
            buttonText: val,
          })
        }
      />
    </>
  )
}

ContactFormProperties.displayName = "ContactFormProperties"


export const TestimonialProperties = ({
  content,
  onContentChange,
}: TestimonialPropertiesProps) => (
  <>
    <StyleInput
      label="Avatar URL"
      value={content.avatar}
      onChange={(val) => onContentChange({ ...content, avatar: val })}
    />
    <StyleInput
      label="Quote"
      value={content.quote}
      onChange={(val) => onContentChange({ ...content, quote: val })}
    />
    <StyleInput
      label="Name"
      value={content.name}
      onChange={(val) => onContentChange({ ...content, name: val })}
    />
    <StyleInput
      label="Title"
      value={content.title}
      onChange={(val) => onContentChange({ ...content, title: val })}
    />
  </>
);

TestimonialProperties.displayName = "TestimonialProperties";

export const FeatureGridProperties = ({
  element,
  content = {},
  onContentChange,
}: FeatureGridPropertiesProps) => {
  const { dispatch } = useEditorContext();
  const gridContainer = element.children?.[1];

  const handleAddFeatureBlock = () => {
    if (!gridContainer) {
      console.error("Feature grid container not found!");
      return;
    }

    const newElement = createNewElement("feature-block");
    const featureBlock = Array.isArray(newElement)
      ? newElement[0]
      : newElement;

    if (!featureBlock) return;

    dispatch({
      type: "ADD_ELEMENT",
      payload: {
        elements: [featureBlock],
        parentId: gridContainer.id,
        index: gridContainer.children?.length || 0,
      },
    });
  };

  const handleColumnCountChange = (count: number) => {
    if (!gridContainer) return;

    onContentChange({ ...content, columnCount: count });

    dispatch({
      type: "UPDATE_ELEMENT_STYLES",
      payload: {
        elementId: gridContainer.id,
        styles: { gridTemplateColumns: `repeat(${count}, 1fr)` },
        breakpoint: "desktop",
        state: "default",
      },
    });
  };

  return (
    <div>
      <StyleInput
        label="Columns"
        type="select"
        value={content.columnCount || 3}
        onChange={(val) => handleColumnCountChange(Number(val))}
        options={[1, 2, 3, 4, 5, 6].map((v) => ({
          label: `${v} Column${v > 1 ? "s" : ""}`,
          value: v,
        }))}
      />

      <div className="my-4 border-t border-gray-700"></div>

      <button
        onClick={handleAddFeatureBlock}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 py-2 rounded-md hover:bg-indigo-500 text-sm"
      >
        <FaPlus size={12} /> Add Feature Block
      </button>

      <p className="text-xs text-gray-400 mt-2">
        Select an individual feature block in the canvas to edit its content.
      </p>
    </div>
  );
};

FeatureGridProperties.displayName = "FeatureGridProperties";

export const FeatureBlockProperties = ({
  content,
  onContentChange,
}: FeatureBlockPropertiesProps) => {
  const handleAIGenerate = async (prompt: string) => {
    const fullPrompt = `Generate a short title and a one-sentence description for a website feature block about "${prompt}". Return ONLY a clean JSON object with "title" and "text" keys. Example: {"title": "AI-Powered Insights", "text": "Unlock powerful analytics with our intelligent dashboard."}`;

    try {
      const result = await generateContentWithGemini(fullPrompt);
      const cleaned = result.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      if (parsed.title && parsed.text) {
        onContentChange({
          ...content,
          title: parsed.title,
          text: parsed.text,
        });
      } else {
        alert("AI response was not in the expected format. Please try again.");
      }
    } catch (error) {
      console.error("AI Generation Error:", error);
      alert("Failed to generate or parse AI content.");
    }
  };

  return (
    <>
      <StyleInput
        label="Icon"
        type="select"
        value={content.icon}
        onChange={(val) => onContentChange({ ...content, icon: val })}
        options={lucideIconOptions}
      />

      <StyleInput
        label="Title"
        value={content.title}
        onChange={(val) => onContentChange({ ...content, title: val })}
      />

      <StyleInput
        label="Text"
        value={content.text}
        onChange={(val) => onContentChange({ ...content, text: val })}
      />

      <AIContentGenerator
        onGenerate={handleAIGenerate}
        promptPlaceholder="e.g., 'real-time collaboration'"
      />
    </>
  );
};

FeatureBlockProperties.displayName = "FeatureBlockProperties";

export const StepBlockProperties = ({ element }: StepBlockPropertiesProps) => {
  const { dispatch } = useEditorContext();

  const handleAIGenerate = async (prompt: string) => {
    const fullPrompt = `Generate a short title and a one-sentence description for a step in a process about "${prompt}". Return ONLY a clean JSON object with "title" and "text" keys. Example: {"title": "Create Your Account", "text": "Sign up in seconds with your email address."}`;

    try {
      const result = await generateContentWithGemini(fullPrompt);
      const cleanedResult = result.replace(/```json/g, "").replace(/```/g, "").trim();
      const newContent = JSON.parse(cleanedResult);

      if (
        newContent.title &&
        newContent.text &&
        element.children &&
        element.children.length >= 3
      ) {
        const titleElementId = element.children[1].id;
        const textElementId = element.children[2].id;

        dispatch({
          type: "UPDATE_ELEMENT_CONTENT",
          payload: { elementId: titleElementId, content: `<h3>${newContent.title}</h3>` },
        });

        dispatch({
          type: "UPDATE_ELEMENT_CONTENT",
          payload: { elementId: textElementId, content: `<p>${newContent.text}</p>` },
        });

        dispatch({ type: "ADD_HISTORY" });
      } else {
        alert("AI response was not in the expected format or element children are missing.");
      }
    } catch (error) {
      console.error("AI Generation Error:", error);
      alert("Failed to generate or parse AI content.");
    }
  };

  return (
    <>
      <p className="text-xs text-gray-400 mb-2">
        Use AI to generate content for this step, or click the individual elements on the canvas to edit them.
      </p>

      <AIContentGenerator
        onGenerate={handleAIGenerate}
        promptPlaceholder="e.g., 'signing up for a newsletter'"
      />

      <ChildElementSelector element={element} />
    </>
  );
};

StepBlockProperties.displayName = "StepBlockProperties";

export const FaqProperties = ({
  content,
  onContentChange,
}: FaqPropertiesProps) => {
  const handleItemChange = (
    index: number,
    field: keyof FaqItem,
    value: string
  ) => {
    const newItems = [...content.items];
    newItems[index] = { ...newItems[index], [field]: value };
    onContentChange({ ...content, items: newItems });
  };

  const handleAddItem = () => {
    const newItem: FaqItem = {
      id: `faq-${Date.now()}`,
      question: "New Question",
      answer: "New answer.",
      questionColor: "#111827",
      answerColor: "#4B5563",
    };

    onContentChange({
      ...content,
      items: [...content.items, newItem],
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = content.items.filter((_, i) => i !== index);
    onContentChange({ ...content, items: newItems });
  };

  return (
    <>
      <h4 className="text-sm font-bold mt-4 mb-2">FAQ Items</h4>

      {content.items.map((item, index) => (
        <div key={item.id} className="mb-2 p-2 bg-gray-700 rounded-md">
          <StyleInput
            label="Question"
            value={item.question}
            onChange={(val) => handleItemChange(index, "question", val)}
          />

          <StyleInput
            label="Question Color"
            type="color"
            value={item.questionColor}
            onChange={(val) => handleItemChange(index, "questionColor", val)}
          />

          <StyleInput
            label="Answer"
            value={item.answer}
            onChange={(val) => handleItemChange(index, "answer", val)}
          />

          <StyleInput
            label="Answer Color"
            type="color"
            value={item.answerColor}
            onChange={(val) => handleItemChange(index, "answerColor", val)}
          />

          <button
            onClick={() => handleRemoveItem(index)}
            className="text-xs text-red-400 hover:underline mt-2"
          >
            Remove Item
          </button>
        </div>
      ))}

      <button
        onClick={handleAddItem}
        className="text-indigo-400 text-sm mt-2 flex items-center gap-1"
      >
        <FaPlus size={10} /> Add FAQ Item
      </button>
    </>
  );
};

FaqProperties.displayName = "FaqProperties";

export const SliderDelayProperties = ({
  content,
  onContentChange,
}: SliderDelayPropertiesProps) => (
  <StyleInput
    label="Slide Delay (ms)"
    type="number"
    value={content.delay}
    onChange={(val) => onContentChange({ ...content, delay: Number(val) })}
  />
);

SliderDelayProperties.displayName = "SliderDelayProperties";

export const StepsProperties = ({ element }: { element: Element }) => {
  const { dispatch } = useEditorContext();
  const content = element.content ? JSON.parse(element.content) : {};
  const stepsContainer = element.children?.find(
    (child) => child.name === "Steps Container"
  );

  if (!stepsContainer) {
    return <p className="text-xs text-red-400">Error: Steps container not found.</p>;
  }

  const handleAddStep = () => {
    const stepBlocks =
      stepsContainer.children?.filter((c) => c.type === "step-block") || [];
    const newStepNumber = stepBlocks.length + 1;
    const newStep = createNewElement("step-block");
    if (Array.isArray(newStep)) return;
    if (newStep.children?.[0]) {
      newStep.children[0].content = `<p>${String(newStepNumber).padStart(2, "0")}</p>`;
    }
    const stepConnector = createNewElement("step-connector");
    if (Array.isArray(stepConnector)) return;
    const elementsToAdd = [stepConnector, newStep];
    dispatch({
      type: "ADD_ELEMENT",
      payload: {
        elements: elementsToAdd,
        parentId: stepsContainer.id,
        index: stepsContainer.children?.length || 0,
      },
    });
  };

  const handleConnectorChange = (type: string) => {
    dispatch({
      type: "UPDATE_ELEMENT_CONTENT",
      payload: {
        elementId: element.id,
        content: JSON.stringify({ connectorType: type }, null, 2),
      },
    });

    const stylesToApply: Record<string, string> = {
      marginTop: "23px",
      height: "2px",
      backgroundColor: "transparent",
      borderTop: "none",
    };

    if (type === "solid") {
      stylesToApply.backgroundColor = "#e5e7eb";
    } else if (type === "dashed" || type === "dotted") {
      stylesToApply.borderTop = `2px ${type} #e5e7eb`;
    } else if (type === "none") {
      stylesToApply.height = "0px";
      stylesToApply.marginTop = "0px";
    }

    stepsContainer.children?.forEach((child) => {
      if (child.type === "step-connector") {
        dispatch({
          type: "UPDATE_ELEMENT_STYLES",
          payload: {
            elementId: child.id,
            styles: stylesToApply,
            breakpoint: "desktop",
            state: "default",
          },
        });
      }
    });
  };

  return (
    <>
      <StyleInput
        label="Connector Style"
        type="select"
        value={content.connectorType || "solid"}
        onChange={handleConnectorChange}
        options={[
          { label: "Solid Line", value: "solid" },
          { label: "Dashed Line", value: "dashed" },
          { label: "Dotted Line", value: "dotted" },
          { label: "None", value: "none" },
        ]}
      />
      <div className="my-4 border-t border-gray-700"></div>
      <button
        onClick={handleAddStep}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 py-2 rounded-md hover:bg-indigo-500 text-sm"
      >
        <FaPlus size={12} /> Add New Step
      </button>
      <p className="text-xs text-gray-400 mt-2">
        To edit, reorder, or delete an individual step, select it on the canvas.
      </p>
    </>
  );
};

StepsProperties.displayName = "StepsProperties";

export const SaveStatusIndicator = ({ status }: { status: 'saved' | 'unsaved' | 'saving' | 'error' }) => {
    const statusMap = {
        saved: { text: 'All changes saved', icon: <CheckCircle2 size={14} className="text-green-400"/>, color: 'text-gray-400' },
        unsaved: { text: 'Unsaved changes', icon: <AlertCircle size={14} className="text-yellow-400"/>, color: 'text-yellow-400' },
        saving: { text: 'Saving...', icon: <Loader2 size={14} className="animate-spin"/>, color: 'text-gray-400' },
        error: { text: 'Save failed', icon: <X size={14} className="text-red-400"/>, color: 'text-red-400' },
    };
    const currentStatus = statusMap[status];
    return (
        <div className={`flex items-center gap-2 text-sm pr-2 ${currentStatus.color}`}>
            {currentStatus.icon}
            <span>{currentStatus.text}</span>
        </div>
    );
};
SaveStatusIndicator.displayName = 'SaveStatusIndicator';

export const DynamicStyleSheet = ({ pageStyles }: { pageStyles: PageStyles }) => {
    const cssVars = pageStyles.globalColors?.map(c => `  --${c.name.toLowerCase()}: ${c.value};`).join('\n');
    const fontVars = pageStyles.globalFonts?.map(f => `  --font-${f.name.toLowerCase()}: ${f.value};`).join('\n');

    const css = `
        :root {
            ${cssVars || ''}
            ${fontVars || ''}
        }
        ${pageStyles.globalCss || ''}
    `;
    return <style>{css}</style>;
};
DynamicStyleSheet.displayName = 'DynamicStyleSheet';

export const AutoScrollProperties = ({ content, onContentChange }: AutoScrollPropertiesProps) => {
  return (
    <StyleInput
      label="Scroll Delay (ms)"
      type="number"
      value={content.delay}
      onChange={(val) => onContentChange({ ...content, delay: Number(val) })}
    />
  );
};

AutoScrollProperties.displayName = "AutoScrollProperties";

export const SingleAutoScrollProperties = ({
  element,
  content,
  onContentChange,
}: SingleAutoScrollPropertiesProps) => (
  <>
    <StyleInput
      label="Scroll Delay (ms)"
      type="number"
      value={content.delay}
      onChange={(val) => onContentChange({ ...content, delay: Number(val) })}
    />
    <StyleInput
      label="Transition"
      type="select"
      value={content.transition}
      onChange={(val) => onContentChange({ ...content, transition: val })}
      options={[
        { label: "Fade", value: "fade" },
        { label: "Slide from Top", value: "slide-top" },
        { label: "Slide from Bottom", value: "slide-bottom" },
        { label: "Slide from Left", value: "slide-left" },
        { label: "Slide from Right", value: "slide-right" },
      ]}
    />
    <ChildElementSelector element={element} />
  </>
);

SingleAutoScrollProperties.displayName = "SingleAutoScrollProperties";

export const AccordionProperties = ({ content, onContentChange }: AccordionPropertiesProps) => (
  <StyleInput
    label="Title"
    value={content.title}
    onChange={(val) => onContentChange({ ...content, title: val })}
  />
);

AccordionProperties.displayName = "AccordionProperties";

export const HeroProperties = ({ element, content, onContentChange }: HeroPropertiesProps) => (
  <>
    <StyleInput
      label="Background Type"
      type="select"
      value={content.backgroundType}
      onChange={(val) => onContentChange({ ...content, backgroundType: val as "image" | "video" })}
      options={[
        { label: "Image", value: "image" },
        { label: "Video", value: "video" },
      ]}
    />
    {content.backgroundType === "image" ? (
      <StyleInput
        label="Background Image URL"
        value={content.backgroundImageUrl || ""}
        onChange={(val) => onContentChange({ ...content, backgroundImageUrl: val })}
      />
    ) : (
      <StyleInput
        label="Background Video URL"
        value={content.backgroundVideoUrl || ""}
        onChange={(val) => onContentChange({ ...content, backgroundVideoUrl: val })}
      />
    )}
    <StyleInput
      label="Content Position"
      type="select"
      value={content.contentPosition}
      onChange={(val) =>
        onContentChange({ ...content, contentPosition: val as HeroContent["contentPosition"] })
      }
      options={[
        { label: "Center Middle", value: "center-middle" },
        { label: "Center Top", value: "center-top" },
        { label: "Bottom Left", value: "bottom-left" },
        { label: "Bottom Right", value: "bottom-right" },
      ]}
    />
    <ChildElementSelector element={element} />
  </>
);

HeroProperties.displayName = "HeroProperties";

export const DraggableItem = ({ type, icon: Icon, label }: DraggableItemProps) => {
  const handleDragStart = (e: React.DragEvent) => e.dataTransfer.setData('elementType', type||'');
  return (
    <div draggable onDragStart={handleDragStart} className="flex flex-col items-center gap-2 p-2 rounded-lg bg-gray-800 border border-gray-700 cursor-grab transition-all hover:bg-gray-700 hover:border-indigo-500">
      <Icon className="text-indigo-400" size={24} />
      <span className="text-xs text-center">{label}</span>
    </div>
  );
};
DraggableItem.displayName = 'DraggableItem';
