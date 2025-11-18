'use client';

import React, { useState, useReducer, useEffect, useRef, createContext, useContext } from 'react';
import Head from 'next/head';
import { useParams, useRouter } from 'next/navigation';
import { produce } from 'immer';
import useSWR, { mutate } from 'swr';
import {
  FaMobileAlt, FaTabletAlt, FaDesktop, FaArrowLeft, FaUndo, FaRedo, FaTrashAlt,
  FaBold, FaItalic, FaUnderline, FaLink, FaPlus,
  FaLayerGroup,
  FaSlidersH,
  FaBars,
  FaTimes
} from 'react-icons/fa';
import { Element, ElementType, PageStyles,
} from './editor';
import {
  Menu, X, Rows, Columns, Image as ImageIcon, Type, List as ListIcon, Video, Link as LinkIcon, Minus, Square, LayoutTemplate, UploadCloud,
  Star, Sparkles, Settings, History, RectangleHorizontal, LayoutPanelLeft, UserSquare, FileText, BookImage, Layers, MessageSquare, PanelRight, Loader2, Clock, Check, Quote, GitBranch, MessageCircleQuestion, Footprints, Captions, ListOrdered, GalleryHorizontal, GalleryThumbnails, Copy, SlidersHorizontal, Replace, ChevronsUpDown, GalleryVerticalEnd, Presentation,
  Undo2,
  Eye
} from 'lucide-react';
import * as lucideIcons from 'lucide-react';
import { AccordionProperties, AutoScrollProperties, ChildElementSelector, CollapsibleGroup, ContactFormProperties, DraggableItem, DynamicStyleSheet, EditorAction, EditorState, FaqProperties, FeatureBlockProperties, FeatureGridProperties, getUniqueId, HeroProperties, HeroSlideProperties, initialState, SaveStatusIndicator, SingleAutoScrollProperties, SliderDelayProperties, SplitSectionProperties, StepBlockProperties, StepsProperties, TestimonialProperties, VideoProperties, WrapInColumnsProperties } from './properties';
import { apiClient, generateContentWithGemini, getAuthToken, getScreenSizeClass } from './common';
import { AccordionComponent, AutoScrollComponent, DropIndicator, FaqComponent, FeatureBlockComponent, HeroComponent, HeroSlideComponent, HeroSliderComponent, HorizontalScrollComponent, ImageCarouselComponent, NavbarComponent, SingleAutoScrollComponent, StepBlockComponent, StepsComponent, TestimonialComponent } from './components';
import { StyleInput } from './inputs';
import { ConfirmationModal, SaveVersionModal } from './modals';
import Image from 'next/image';
import toast from 'react-hot-toast';

export type DraggableItemProps = {
  type: string;
  icon: any;
  label: string;
};

export const GlobalCssPanel = () => {
    const { state, dispatch } = useEditorContext();
    const { pageStyles } = state;

    const handleCssChange = (css: string) => {
        dispatch({ type: 'SET_PAGE_STYLES', payload: { globalCss: css } });
    };

    return (
        <div>
            <h3 className="text-lg font-bold mb-2">Global Stylesheet</h3>
            <p className="text-xs text-gray-400 mb-4">Add custom CSS classes here. They will be available to all elements on the page.</p>
            <textarea
                className="w-full h-40 bg-gray-800 text-white font-mono text-xs p-2 rounded-md border border-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={pageStyles.globalCss || ''}
                onChange={(e) => handleCssChange(e.target.value)}
            />
        </div>
    )
}
GlobalCssPanel.displayName = 'GlobalCssPanel';

const editorReducer = produce((draft: EditorState, action: EditorAction) => {
  const addHistoryEntry = () => {
    const currentStateString = JSON.stringify(draft.history[draft.historyIndex]?.content || {});
    const newStateString = JSON.stringify(draft.pageContent);
    if (currentStateString === newStateString) return;

    const newHistory = draft.history.slice(0, draft.historyIndex + 1);
    newHistory.push({ content: JSON.parse(JSON.stringify(draft.pageContent)), timestamp: Date.now() });
    draft.history = newHistory;
    draft.historyIndex = newHistory.length - 1;
  };

  const findAndTraverse = (elements: Element[], callback: (element: Element, parent?: Element) => boolean | void, parentElement?: Element): boolean => {
    for (const element of elements) {
      if (callback(element, parentElement)) return true;
      if (element.children?.length) {
        if (findAndTraverse(element.children, callback, element)) return true;
      }
      if (element.type === 'columns') {
        try {
          const content = JSON.parse(element?.content || '');
          for (const col of content.columns) {
            if (findAndTraverse(col.children, callback, element)) {
              element.content = JSON.stringify(content, null, 2);
              return true;
            }
          }
        } catch (e) {}
      }
    }
    return false;
  };

  switch (action.type) {
    case 'SET_PAGE_CONTENT': {
      draft.pageContent = action.payload;
      draft.selectedElementId = null;
      addHistoryEntry();
      break;
    }
    case 'SET_INITIAL_STATE': {
      draft.pageContent = action.payload.content;
      draft.pageStyles = action.payload.pageStyles;
      break;
    }
    case 'REVERT_TO_VERSION': {
      draft.pageContent = action.payload.content;
      draft.pageStyles = action.payload.pageStyles;
      addHistoryEntry();
      break;
    }
    case 'ADD_ELEMENT': {
      const { elements: elementsToAdd, parentId, index } = action.payload;
      if (parentId === 'canvas') {
        draft.pageContent.splice(index, 0, ...elementsToAdd);
      } else {
        findAndTraverse(draft.pageContent, (parent) => {
          if (parent.id === parentId) {
             if (parent.children == null) parent.children = [];
             parent.children.splice(index, 0, ...elementsToAdd);
             return true;
          }
          if (parent.type === 'columns') {
            const content = JSON.parse(parent?.content || '');
            const col = content.columns.find((c: {id: string}) => c.id === parentId);
            if (col) {
              if (col.children == null) col.children = [];
              col.children.splice(index, 0, ...elementsToAdd);
              parent.content = JSON.stringify(content, null, 2);
              return true;
            }
          }
          return false;
        });
      }
      draft.selectedElementId = elementsToAdd[elementsToAdd.length - 1].id;
      addHistoryEntry();
      break;
    }
    case 'WRAP_IN_COLUMNS': {
      const { elementId } = action.payload;

      const findAndWrap = (elements: Element[]): boolean => {
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          if (element.id === elementId) {
            const newColumnsElement = createNewElement('columns') as Element;
            const content = JSON.parse(newColumnsElement?.content || '');
            content.columns[0].children.push(element); 
            newColumnsElement.content = JSON.stringify(content, null, 2);
            
            elements[i] = newColumnsElement;
            draft.selectedElementId = newColumnsElement.id;
            return true;
          }

          if (element.children && findAndWrap(element.children)) {
            return true;
          }

          if (element.type === 'columns') {
            try {
              const content = JSON.parse(element?.content || '');
              for (const col of content.columns) {
                if (findAndWrap(col.children)) {
                  element.content = JSON.stringify(content, null, 2);
                  return true;
                }
              }
            } catch (e) {}
          }
        }
        return false;
      };

      findAndWrap(draft.pageContent);
      addHistoryEntry();
      break;
    }
    case 'MOVE_ELEMENT': {
      const { draggedId, targetParentId, targetIndex } = action.payload;
      let draggedElement: Element | null = null;

      const findAndRemoveMutative = (elements: Element[], elementId: string): boolean => {
          const index = elements.findIndex(el => el.id === elementId);
          if (index !== -1) {
              draggedElement = { ...elements[index] };
              elements.splice(index, 1);
              return true;
          }
          for (const el of elements) {
              if (el.children && findAndRemoveMutative(el.children, elementId)) return true;
              if (el.type === 'columns') {
                  try {
                      const content = JSON.parse(el?.content || '');
                      let found = false;
                      for (const col of content.columns) {
                          if (findAndRemoveMutative(col.children, elementId)) {
                              found = true;
                              break;
                          }
                      }
                      if (found) {
                          el.content = JSON.stringify(content, null, 2);
                          return true;
                      }
                  } catch (e) {}
              }
          }
          return false;
      };

      findAndRemoveMutative(draft.pageContent, draggedId);

      if (draggedElement) {
        if (targetParentId === 'canvas') {
          draft.pageContent.splice(targetIndex, 0, draggedElement);
        } else {
          findAndTraverse(draft.pageContent, (parent) => {
            if (parent.id === targetParentId) {
                if (parent.children == null) parent.children = [];
                parent.children.splice(targetIndex, 0, draggedElement!);
                return true;
            }
            if (parent.type === 'columns') {
              const content = JSON.parse(parent?.content || '');
              const col = content.columns.find((c: { id: string }) => c.id === targetParentId);
              if (col) {
                if (col.children == null) col.children = [];
                col.children.splice(targetIndex, 0, draggedElement!);
                parent.content = JSON.stringify(content, null, 2);
                return true;
              }
            }
            return false;
          });
        }
      }
      addHistoryEntry();
      break;
    }
    case 'UPDATE_ELEMENT_STYLES': {
      const { elementId, styles, breakpoint, state } = action.payload;
      findAndTraverse(draft.pageContent, (el) => {
        if(el.id === elementId) {
          if (!el.styles[breakpoint]) el.styles[breakpoint] = { default: {}, hover: {} };
          if (!el.styles[breakpoint][state]) el.styles[breakpoint][state] = {};
          el.styles[breakpoint][state] = { ...el.styles[breakpoint][state], ...styles };
          return true;
        }
      });
      addHistoryEntry();
      break;
    }
    case 'UPDATE_ELEMENT_CONTENT': {
      findAndTraverse(draft.pageContent, (el) => {
        if(el.id === action.payload.elementId) {
          el.content = action.payload.content;
          return true;
        }
      });
      addHistoryEntry();
      break;
    }
    case 'UPDATE_ELEMENT_ATTRIBUTE': {
      const { elementId, attribute, value } = action.payload;
      findAndTraverse(draft.pageContent, (el) => {
        if(el.id === elementId) {
          (el as any)[attribute] = value;
          return true;
        }
      });
      addHistoryEntry();
      break;
    }
    case 'DELETE_ELEMENT': {
      const findAndDelete = (elements: Element[], elementId: string): boolean => {
        const index = elements.findIndex(el => el.id === elementId);
        if (index !== -1) {
          elements.splice(index, 1);
          return true;
        }
        for (const el of elements) {
          if (el.children && findAndDelete(el.children, elementId)) return true;
          if (el.type === 'columns') {
            try {
              const content = JSON.parse(el?.content || '');
              let found = false;
              for (const col of content.columns) {
                if (findAndDelete(col.children, elementId)) {
                  found = true;
                  break;
                }
              }
              if (found) {
                el.content = JSON.stringify(content, null, 2);
                return true;
              }
            } catch (e) {}
          }
        }
        return false;
      };

      findAndDelete(draft.pageContent, action.payload.elementId);

      if (draft.selectedElementId === action.payload.elementId) {
        draft.selectedElementId = null;
      }
      addHistoryEntry();
      break;
    }
    case 'DUPLICATE_ELEMENT': {
        const { elementId } = action.payload;
        let newElementId: string | null = null;

        const deepCopyAndAssignNewIds = (element: Element): Element => {
            const newElement = JSON.parse(JSON.stringify(element));
            newElement.id = getUniqueId(newElement.type as ElementType);
            if (newElement.children && newElement.children.length > 0) {
                newElement.children = newElement.children.map((child: Element) => deepCopyAndAssignNewIds(child));
            }
            if (newElement.type === 'columns') {
                const content = JSON.parse(newElement.content);
                content.columns.forEach((col: { id: string, children: Element[] }) => {
                    col.id = getUniqueId('column_internal');
                    col.children = col.children.map((child: Element) => deepCopyAndAssignNewIds(child));
                });
                newElement.content = JSON.stringify(content, null, 2);
            }
            if (newElement.type === 'contact-form') {
                const content = JSON.parse(newElement.content);
                content.fields.forEach((field: { id: string }) => {
                    field.id = getUniqueId('form-field');
                });
                newElement.content = JSON.stringify(content, null, 2);
            }
            if (newElement.type === 'navbar') {
                const content = JSON.parse(newElement.content);
                content.links.forEach((link: { id: string }) => {
                    link.id = getUniqueId('link');
                });
                newElement.content = JSON.stringify(content, null, 2);
            }
            if (newElement.type === 'faq') {
                const content = JSON.parse(newElement.content);
                content.items.forEach((item: { id: string }) => {
                    item.id = getUniqueId('faq-item');
                });
                newElement.content = JSON.stringify(content, null, 2);
            }
            return newElement;
        };

        const findAndDuplicate = (elements: Element[]): boolean => {
            for (let i = 0; i < elements.length; i++) {
                const element = elements[i];
                if (element.id === elementId) {
                    const newElement = deepCopyAndAssignNewIds(element);
                    elements.splice(i + 1, 0, newElement);
                    newElementId = newElement.id;
                    return true;
                }
                if (element.children && findAndDuplicate(element.children)) {
                    return true;
                }
                if (element.type === 'columns') {
                    try {
                        const content = JSON.parse(element?.content || '');
                        for (const col of content.columns) {
                            if (findAndDuplicate(col.children)) {
                                element.content = JSON.stringify(content, null, 2);
                                return true;
                            }
                        }
                    } catch (e) {}
                }
            }
            return false;
        };

        findAndDuplicate(draft.pageContent);
        if (newElementId) {
            draft.selectedElementId = newElementId;
        }
        addHistoryEntry();
        break;
    }
    case 'SET_SELECTED_ELEMENT': {
      draft.selectedElementId = action.payload;
      break;
    }
    case 'SET_PAGE_STYLES': {
      draft.pageStyles = { ...draft.pageStyles, ...action.payload };
      break;
    }
    case 'ADD_HISTORY': {
      addHistoryEntry();
      break;
    }
    case 'UNDO': {
      if (draft.historyIndex > 0) {
        draft.historyIndex--;
        draft.pageContent = JSON.parse(JSON.stringify(draft.history[draft.historyIndex].content));
        draft.selectedElementId = null;
      }
      break;
    }
    case 'REDO': {
      if (draft.historyIndex < draft.history.length - 1) {
        draft.historyIndex++;
        draft.pageContent = JSON.parse(JSON.stringify(draft.history[draft.historyIndex].content));
        draft.selectedElementId = null;
      }
      break;
    }
  }
});

export const createNewElement = (type: ElementType): Element | Element[] => {
    const id = getUniqueId(type);
    const defaultStyles = { desktop: { default: {}, hover: {} }, tablet: { default: {}, hover: {} }, mobile: { default: {}, hover: {} } };
    const baseElement: Omit<Element, 'id'> & { type: ElementType } = { type, styles: JSON.parse(JSON.stringify(defaultStyles)), children: [] };
    
    switch(type) {
        case 'section': baseElement.styles.desktop.default = { minHeight: '100px', width: '100%', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }; break;
        case 'box': baseElement.styles.desktop.default = { minHeight: '100px', width: '100%', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }; break;
        case 'card': baseElement.styles.desktop.default = { width: '100%', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '16px', backgroundColor: '#ffffff', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', borderRadius: '12px' }; break;
        case 'video-right-section':
            baseElement.name = "Video Right Section";
            baseElement.content = JSON.stringify({
                video: {
                    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                    autoplay: false,
                    controls: true,
                    loop: false,
                    muted: false,
                }
            }, null, 2);
            baseElement.styles.desktop.default = { width: '100%', padding: '20px', display: 'flex', gap: '20px', alignItems: 'stretch' };
            baseElement.styles.mobile = { default: { flexDirection: 'column' } };
            break;
        case 'video-left-section':
            baseElement.name = "Video Left Section";
            baseElement.content = JSON.stringify({
                video: {
                    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                    autoplay: false,
                    controls: true,
                    loop: false,
                    muted: false,
                }
            }, null, 2);
            baseElement.styles.desktop.default = { width: '100%', padding: '20px', display: 'flex', gap: '20px', alignItems: 'stretch' };
            baseElement.styles.mobile = { default: { flexDirection: 'column' } };
            break;
        case 'right-image-section':
            baseElement.name = 'Image Right Section';
            baseElement.content = JSON.stringify({ imageSrc: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop' });
            baseElement.styles.desktop.default = { width: '100%', padding: '20px', display: 'flex', gap: '20px', alignItems: 'stretch' };
            break;
        case 'left-image-section':
            baseElement.name = 'Image Left Section';
            baseElement.content = JSON.stringify({ imageSrc: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=800&auto=format&fit=crop' });
            baseElement.styles.desktop.default = { width: '100%', padding: '20px', display: 'flex', gap: '20px', alignItems: 'stretch' };
            break;
        case 'horizontal-scroll':
            baseElement.name = 'Horizontal Scroll';
            baseElement.styles.desktop.default = { width: '100%', maxWidth: '100%', display: 'grid', gridAutoFlow: 'column', padding: '20px 0', position: 'relative' };
            baseElement.children = [
                createNewElement('preview-card') as Element,
                createNewElement('preview-card') as Element,
            ];
            break;
        case 'auto-scroll':
            baseElement.name = 'Auto Scroll';
            baseElement.styles.desktop.default = { width: '100%', maxWidth: '100%', position: 'relative', overflow: 'hidden', display: 'grid' };
            baseElement.content = JSON.stringify({ delay: 3000 });
            baseElement.children = [
                createNewElement('preview-card') as Element,
                createNewElement('preview-card') as Element,
                createNewElement('preview-card') as Element,
                createNewElement('preview-card') as Element,
            ];
            break;
        case 'single-auto-scroll':
            baseElement.name = 'Single Auto Scroll';
            baseElement.styles.desktop.default = { width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', minHeight: '400px' };
            baseElement.content = JSON.stringify({ delay: 3000, transition: 'fade' });
            baseElement.children = [
                createNewElement('detail-card') as Element,
                createNewElement('detail-card') as Element,
                createNewElement('profile-card') as Element,
            ];
            break;
        case 'image-carousel':
            baseElement.name = 'Image Carousel';
            baseElement.styles.desktop.default = { width: '100%', height: '500px', position: 'relative', overflow: 'hidden'};
            baseElement.content = JSON.stringify({ delay: 3000 });
            baseElement.children = [
                { ...(createNewElement('image') as Element), styles: { desktop: { default: { width: '100%', height: '100%', objectFit: 'cover' }}}},
                { ...(createNewElement('image') as Element), content: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=800&auto=format&fit=crop', styles: { desktop: { default: { width: '100%', height: '100%', objectFit: 'cover' }}}},
            ];
            break;
        case 'accordion':
            baseElement.name = 'Accordion';
            baseElement.content = JSON.stringify({ title: 'Click to Expand' });
            baseElement.styles.desktop.default = { width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111827' };
            break;
        case 'feature-grid':
            baseElement.name = "Feature Grid Section";
            baseElement.styles.desktop.default = { width: '100%', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' };
            baseElement.content = JSON.stringify({ columnCount: 3 });

            const gridContainer = createNewElement('box') as Element;
            gridContainer.name = "Features Container";
            gridContainer.styles.desktop.default = {
                width: '100%',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '20px'
            };
            gridContainer.children = [
                createNewElement('feature-block') as Element,
                createNewElement('feature-block') as Element,
                createNewElement('feature-block') as Element,
            ];

            baseElement.children = [
                { ...(createNewElement('heading') as Element), content: '<h2>Our Amazing Features</h2>' },
                gridContainer
            ];
            break;
        case 'feature-block':
            baseElement.content = JSON.stringify({ icon: 'Star', title: 'Feature Title', text: 'Describe the feature in a few words.'});
            baseElement.styles.desktop.default = { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb' };
            break;
        case 'step-block':
        baseElement.name = 'Step Block';
        baseElement.styles.desktop.default = {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '12px',
            padding: '0 16px',
            flex: '0 1 300px',
            minWidth: '200px',
            overflow: 'hidden',
        };
        baseElement.children = [
            {
                ...(createNewElement('paragraph') as Element),
                content: '<p>01</p>',
                name: 'Step Number',
                styles: {
                    ...JSON.parse(JSON.stringify(defaultStyles)),
                    desktop: { default: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#eef2ff', color: '#4338ca', fontWeight: 'bold', fontSize: '1.25rem', marginBottom: '16px' } }
                }
            },
            {
                ...(createNewElement('heading') as Element),
                content: '<h3>Step Title</h3>',
                name: 'Step Title',
                styles: {
                    ...JSON.parse(JSON.stringify(defaultStyles)),
                    desktop: { default: { fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' } }
                }
            },
            {
                ...(createNewElement('paragraph') as Element),
                content: '<p>Explain the step here in a few words.</p>',
                name: 'Step Description',
                styles: {
                    ...JSON.parse(JSON.stringify(defaultStyles)),
                    desktop: { default: { fontSize: '1rem', color: '#6b7280' } }
                }
            }
        ];
        break;
        case 'step-connector':
            baseElement.name = 'Step Connector';
            baseElement.styles.desktop.default = {
                flex: '1',
                minWidth: '100px',
                height: '5px',
                backgroundColor: '#e5e7eb'
            }
            break;
        case 'steps':
        baseElement.name = 'Steps Section';
        baseElement.content = JSON.stringify({ connectorType: 'solid' });
        baseElement.styles.desktop.default = { width: '100%', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' };

        const createStep = (stepNumber: number): Element => {
            const step = createNewElement('step-block') as Element;
            if (step.children && step.children[0]) {
            step.children[0].content = `<p>${String(stepNumber).padStart(2, '0')}</p>`;
            }
            return step;
        }

        const stepsContainer = createNewElement('box') as Element;
        stepsContainer.name = "Steps Container";
        stepsContainer.styles.desktop.default = { width: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' };
        stepsContainer.children = [
            createStep(1),
            createNewElement('step-connector') as Element,
            createStep(2),
            createNewElement('step-connector') as Element,
            createStep(3),
        ];

        baseElement.children = [
            { ...(createNewElement('heading') as Element), content: '<h2>Get Started in 3 Easy Steps</h2>' },
            stepsContainer
        ];
        break;
        case 'testimonial':
            baseElement.content = JSON.stringify({ avatar: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=800&auto=format&fit=crop', quote: 'This is an amazing product!', name: 'Jane Doe', title: 'CEO, Company' });
            baseElement.styles.desktop.default = { margin: '0 auto', width: '100%', maxWidth: '600px', backgroundColor: '#ffffff', color: '#111827', padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' };
            break;
        case 'faq':
            baseElement.content = JSON.stringify({ items: [{id: getUniqueId('faq-item'), question: 'Is this a question?', answer: 'Yes, and this is the answer.', questionColor: '#111827', answerColor: '#4B5563'}]});
            baseElement.styles.desktop.default = { width: '100%', maxWidth: '700px' };
            break;
        case 'preview-card':
            baseElement.type = 'card';
            baseElement.name = "Preview Card";
            baseElement.styles.desktop.default = { margin: '0 auto', width: '350px', flexShrink: 0, alignSelf: 'center', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', overflow: 'hidden', color: '#111827', padding: '0px', alignItems: 'flex-start' };
            baseElement.children = [
                {...createNewElement('image') as Element, content: 'https://images.unsplash.com/photo-1553095066-5014bc7b7f2d?q=80&w=800&auto=format&fit=crop', styles: {desktop: {default: {width: '100%', borderRadius: '0px', alignSelf: 'stretch'}}}},
                {...createNewElement('box') as Element, children: [
                    {...createNewElement('heading') as Element, content: '<h3>Preview Title</h3>'},
                    {...createNewElement('paragraph') as Element, content: '<p>This is a short description for the preview card.</p>'}
                ], styles: {desktop: {default: {padding: '16px'}}}}
            ]
            break;
        case 'detail-card':
            baseElement.type = 'card';
            baseElement.name = "Detail Card";
            baseElement.styles.desktop.default = { margin: '0 auto', width: '350px', alignSelf: 'center', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', padding: '24px', color: '#111827' };
            baseElement.children = [
                {...createNewElement('heading') as Element, content: '<h3>Detail Card</h3>'},
                {...createNewElement('paragraph') as Element, content: '<p>More information here...</p>'},
            ];
            break;
        case 'profile-card':
        baseElement.name = "Profile Card";
        baseElement.styles.desktop.default = { margin: '0 auto', display: 'flex', alignItems: 'center', gap: '16px', width: '350px', alignSelf: 'center', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', padding: '24px', color: '#111827' };
        baseElement.content = JSON.stringify({});

        const profileImageElement = createNewElement('image') as Element;
        profileImageElement.content = 'https://images.unsplash.com/photo-1522252234503-e356532cafd5?q=80&w=800&auto=format&fit=crop';
        profileImageElement.styles.desktop.default = {
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            flexShrink: 0,
            objectFit: 'cover',
            margin: '0',
        };

        const textBoxElement = {
            ...(createNewElement('box') as Element),
            styles: { desktop: { default: { display: 'flex', flexDirection: 'column', gap: '4px', padding: '0px', minHeight: 'auto' } } },
            children: [
                { ...(createNewElement('heading') as Element), content: '<h3>Jane Doe</h3>', styles: { desktop: { default: { fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', textAlign: 'left', margin: '0' } } } },
                { ...(createNewElement('paragraph') as Element), content: '<p>UI/UX Designer</p>', styles: { desktop: { default: { fontSize: '1rem', color: '#4f46e5', textAlign: 'left', lineHeight: 1.2, margin: '0' } } } },
                { ...(createNewElement('paragraph') as Element), content: '<p>@janedoe</p>', styles: { desktop: { default: { fontSize: '0.875rem', color: '#6b7280', textAlign: 'left', lineHeight: 1.2, margin: '0' } } } },
            ]
        };

        baseElement.children = [
            profileImageElement,
            textBoxElement
        ];
        break;
        case 'columns':
            baseElement.styles.desktop.default = { width: '100%', padding: '20px', display: 'flex', gap: '20px' };
            baseElement.content = JSON.stringify({ columns: [{ id: getUniqueId('column_internal'), children: [] }, { id: getUniqueId('column_internal'), children: [] }] }, null, 2);
            break;
        case 'heading': baseElement.content = '<h1>Enter Heading Text...</h1>'; baseElement.styles.desktop.default = { fontSize: '2.25rem', fontWeight: 'bold', color: 'var(--text)', width: '100%', textAlign: 'center' }; break;
        case 'paragraph': baseElement.content = '<p>Enter your paragraph text here.</p>'; baseElement.styles.desktop.default = { fontSize: '1rem', color: '#4b5563', lineHeight: 1.6, width: '100%', textAlign: 'center' }; break;
        case 'gallery':
            baseElement.content = JSON.stringify({ columns: 3, images: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=800&auto=format&fit=crop'] }, null, 2);
            baseElement.styles.desktop.default = { width: '100%', padding: '20px', display: 'grid', gap: '16px' };
            break;
        case 'footer':
            baseElement.styles.desktop.default = { width: '100%', padding: '40px 20px', backgroundColor: '#111827', color: '#9ca3af', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' };
            const footerText = createNewElement('paragraph') as Element;
            footerText.content = `<p>© ${new Date().getFullYear()} Your Company. All rights reserved.</p>`;
            footerText.styles.desktop.default = { color: '#9ca3af', fontSize: '0.875rem' };
            baseElement.children = [footerText];
            break;
        case 'navbar':
            baseElement.content = JSON.stringify({ 
                logo: { type: 'image', src: "https://placehold.co/100x40/FFFFFF/1a202c?text=Logo", text: "My Site", alt: "Logo" }, 
                links: [{ id: getUniqueId('link'), label: "Home", href: "#" }], 
                linksPosition: 'right',
                cta: { label: "Sign Up", href: "#", enabled: true }
            }, null, 2);
            baseElement.styles.desktop.default = { width: '100%', backgroundColor: "#fff", color: "#111827", padding: "1rem 2rem", boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
            break;
        case 'image':
            baseElement.content = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop';
            baseElement.styles.desktop.default = { display: 'block', margin: '0 auto', width: 'auto', maxWidth: '100%', height: 'auto', borderRadius: '8px' };
            break;
        case 'video':
            baseElement.content = JSON.stringify({
                url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                autoplay: false,
                controls: true,
                loop: false,
                muted: false,
            }, null, 2);
            baseElement.styles.desktop.default = { display: 'block', margin: '0 auto', width: '100%', aspectRatio: '16 / 9' };
            break;
        case 'divider':
            baseElement.styles.desktop.default = { width: '100%', height: '1px', backgroundColor: '#e5e7eb', margin: '16px 0' };
            break;
        case 'contact-form':
        baseElement.content = JSON.stringify({
            fields: [
            { id: getUniqueId('form-field'), label: 'Name', type: 'text' },
            { id: getUniqueId('form-field'), label: 'Email', type: 'email' }
            ],
            buttonText: 'Submit'
        });
        baseElement.styles.desktop.default = { width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '16px', margin: '2rem auto' };
        break;
        case 'button':
            baseElement.content = 'Click Me';
            baseElement.styles.desktop.default = { 
                display: 'block',
                margin: '0 auto',
                textAlign: 'center',
                backgroundColor: 'var(--primary)', 
                color: '#fff', 
                padding: '10px 20px', 
                borderRadius: '8px', 
                border: 'none', 
                cursor: 'pointer',
                outline: 'none'
            };
            baseElement.styles.desktop.hover = { backgroundColor: '#4338ca' };
            break;
        case 'hero':
            baseElement.name = 'Hero Section';
            baseElement.styles.desktop.default = { width: '100%', height: '500px', position: 'relative', display: 'flex', color: '#ffffff'};
            baseElement.content = JSON.stringify({
                backgroundType: 'image',
                backgroundImageUrl: 'https://images.unsplash.com/photo-1522252234503-e356532cafd5?q=80&w=800&auto=format&fit=crop',
                backgroundVideoUrl: '',
                contentPosition: 'center-middle'
            });
            baseElement.children = [
                {...(createNewElement('heading') as Element), content: '<h1>Your Big Idea</h1>', styles: {desktop:{default:{color: '#ffffff', fontSize: '3rem'}}}},
                {...(createNewElement('paragraph') as Element), content: '<p>Explain it in a few words.</p>', styles: {desktop:{default:{color: '#eeeeee', maxWidth: '600px', fontSize: '1.25rem'}}}},
                {...(createNewElement('button') as Element), content: 'Get Started', styles: {desktop:{default:{ display: 'block', backgroundColor: '#ffffff', color: 'var(--primary)', margin: '1rem auto' }}}},
            ];
            break;
        case 'hero-slider':
            baseElement.name = 'Hero Slider';
            baseElement.styles.desktop.default = { width: '100%', height: '500px', position: 'relative', overflow: 'hidden', color: '#ffffff'};
            baseElement.content = JSON.stringify({ delay: 4000 });
            baseElement.children = [
                createNewElement('hero') as Element,
                createNewElement('hero') as Element,
            ];
            break;
        case 'ordered-list': baseElement.content = `<ol><li>List Item 1</li><li>List Item 2</li></ol>`; baseElement.styles.desktop.default = { paddingLeft: '40px', color: '#4b5563', width: '100%' }; break;
        case 'unordered-list': baseElement.content = `<ul><li>List Item 1</li><li>List Item 2</li></ul>`; baseElement.styles.desktop.default = { paddingLeft: '40px', color: '#4b5563', width: '100%' }; break;
    }
    return { ...baseElement, id };
};

export const EditorContext = createContext<{ state: EditorState; dispatch: React.Dispatch<EditorAction> } | null>(null);

export const useEditorContext = () => {
  const context = useContext(EditorContext);
  if (!context) { throw new Error('useEditorContext must be used within an EditorProvider'); }
  return context;
};

export default function EditorPage() {
  const router = useRouter();
  const params = useParams();
  const siteId = params.siteId as string;
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const token = isClient ? getAuthToken() : null;

  const {
    data: currentSite,
    error: apiError,
    isLoading,
  } = useSWR(
    siteId && token ? [`/api/sites/${siteId}`, token] : null,
    () => apiClient.fetchSite(siteId)
  );

  const [state, dispatch] = useReducer(editorReducer, initialState);
  const [screenSize, setScreenSize] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activePanel, setActivePanel] = useState<'properties' | 'history' | 'versions'>('properties');
  const [leftSidebarTab, setLeftSidebarTab] = useState<'elements' | 'layers' | 'css' | 'templates'>('elements');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving' | 'error'>('saved');
  
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isSaveVersionModalOpen, setIsSaveVersionModalOpen] = useState(false);
  
  const [pendingAiElements, setPendingAiElements] = useState<Element[] | null>(null);

  const initialContentLoaded = useRef(false);
  const hasUnsavedChanges = useRef(false);

  const [isMobileView, setIsMobileView] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLeftPanelOpenMobile, setIsLeftPanelOpenMobile] = useState(false);
  const [isRightPanelOpenMobile, setIsRightPanelOpenMobile] = useState(false);

  useEffect(() => {
    if (!isClient) return;

    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleResize = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobileView(e.matches);
      if (e.matches) {
        setScreenSize('mobile');
      } else {
        setIsMobileMenuOpen(false);
        setIsLeftPanelOpenMobile(false);
        setIsRightPanelOpenMobile(false);
        setScreenSize('desktop');
      }
    };

    handleResize(mediaQuery);
    mediaQuery.addEventListener('change', handleResize);
    return () => mediaQuery.removeEventListener('change', handleResize);
  }, [isClient]);

  useEffect(() => {
    if (currentSite && !initialContentLoaded.current) {
      dispatch({
        type: 'SET_INITIAL_STATE',
        payload: {
          content: currentSite.draftContent || [],
          pageStyles: currentSite.draftPageStyles || initialState.pageStyles,
        },
      });
      dispatch({ type: 'ADD_HISTORY' });
      initialContentLoaded.current = true;
    }
  }, [currentSite]);

  useEffect(() => {
    if (!initialContentLoaded.current || state.history.length <= 1) return;
    hasUnsavedChanges.current = true;
    setSaveStatus('unsaved');
  }, [state.pageContent, state.pageStyles, state.history.length]);

  useEffect(() => {
    if (!initialContentLoaded.current) return;

    const handler = setTimeout(async () => {
      if (hasUnsavedChanges.current) {
        setSaveStatus('saving');
        try {
          await apiClient.saveSiteDraft(siteId, {
            content: state.pageContent,
            pageStyles: state.pageStyles,
          });
          setSaveStatus('saved');
          hasUnsavedChanges.current = false;
        } catch (err) {
          console.error('Auto-save failed:', err);
          setSaveStatus('error');
        }
      }
    }, 2500);

    return () => clearTimeout(handler);
  }, [state.pageContent, state.pageStyles, siteId]);

  const handleAiGenerate = (elements: Element[]) => {
    if (state.pageContent.length > 0) {
      setPendingAiElements(elements);
    } else {
      dispatch({ type: 'SET_PAGE_CONTENT', payload: elements });
    }
  };

  const confirmAiGenerate = () => {
    if (pendingAiElements) {
      dispatch({ type: 'SET_PAGE_CONTENT', payload: pendingAiElements });
      setPendingAiElements(null);
    }
  };

  const findElement = (
    elements: Element[],
    elementId: string
  ): Element | null => {
    for (const el of elements) {
      if (el.id === elementId) return el;
      if (el.children?.length) {
        const found = findElement(el.children, elementId);
        if (found) return found;
      }
      if (el.type === 'columns') {
        try {
          const content = JSON.parse(el.content);
          for (const col of content.columns) {
            const found = findElement(col.children, elementId);
            if (found) return found;
          }
        } catch (e) {}
      }
    }
    return null;
  };

  const selectedElement = state.selectedElementId
    ? findElement(state.pageContent, state.selectedElementId)
    : null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        dispatch({ type: 'REDO' });
      }
      const target = e.target as HTMLElement;
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        state.selectedElementId &&
        !['input', 'textarea'].includes(target.tagName.toLowerCase()) &&
        !target.isContentEditable
      ) {
        e.preventDefault();
        dispatch({
          type: 'DELETE_ELEMENT',
          payload: { elementId: state.selectedElementId },
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.selectedElementId]);

  const handleSaveVersion = () => {
    setIsSaveVersionModalOpen(true);
  };

  const handleConfirmSaveVersion = async (versionName: string) => {
    setSaveStatus('saving');
    try {
      await apiClient.saveVersion(siteId, {
        content: state.pageContent,
        pageStyles: state.pageStyles,
        versionName: versionName,
      });
      setSaveStatus('saved');
      hasUnsavedChanges.current = false;
      mutate(`/api/sites/${siteId}/history`);
    } catch (err) {
      console.error('Save version failed:', err);
      setSaveStatus('error');
    }
    setIsSaveVersionModalOpen(false);
  };

  if (!isClient || isLoading)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        Loading Editor...
      </div>
    );
  if (apiError)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        Failed to load site data.
      </div>
    );
  if (!token)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        Authentication token not found. Please log in again.
      </div>
    );
  if (!currentSite && token)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        Site not found or you do not have permission to edit it.
      </div>
    );

  const renderScreenSizeButtons = () => (
    <div className="flex items-center gap-1 bg-gray-800 p-1 rounded-lg">
      {['desktop', 'tablet', 'mobile'].map((size) => (
        <button
          key={size}
          onClick={() => setScreenSize(size as any)}
          className={`cursor-pointer p-2 rounded-md transition-colors ${
            screenSize === size
              ? 'bg-indigo-600 text-white'
              : 'hover:bg-gray-700'
          }`}
          title={`${size.charAt(0).toUpperCase() + size.slice(1)} View`}
        >
          {size === 'desktop' && <FaDesktop />}
          {size === 'tablet' && <FaTabletAlt />}
          {size === 'mobile' && <FaMobileAlt />}
        </button>
      ))}
    </div>
  );

  const renderActionButtons = (isMobile = false) => (
    <div
      className={
        isMobile
          ? 'flex flex-col gap-2 w-full'
          : 'flex items-center gap-4'
      }
    >
      <SaveStatusIndicator status={saveStatus} />
      <div className={isMobile ? 'flex flex-col gap-2' : 'flex items-center gap-1'}>
        <button
          onClick={() => dispatch({ type: 'UNDO' })}
          disabled={state.historyIndex <= 0}
          className={`cursor-pointer p-2 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 ${isMobile ? 'w-full text-left' : ''}`}
          title="Undo"
        >
          <FaUndo className={isMobile ? 'inline mr-2' : ''} />
          {isMobile && 'Undo'}
        </button>
        <button
          onClick={() => dispatch({ type: 'REDO' })}
          disabled={state.historyIndex >= state.history.length - 1}
          className={`cursor-pointer p-2 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 ${isMobile ? 'w-full text-left' : ''}`}
          title="Redo"
        >
          <FaRedo className={isMobile ? 'inline mr-2' : ''} />
          {isMobile && 'Redo'}
        </button>
      </div>

      <button
        onClick={handleSaveVersion}
        className={`cursor-pointer flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors ${isMobile ? 'w-full' : ''}`}
      >
        <Check size={16} />
        <span>Save Version</span>
      </button>
      <button
        onClick={() => setIsAiModalOpen(true)}
        className={`cursor-pointer flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 rounded-md hover:bg-purple-500 transition-colors ${isMobile ? 'w-full' : ''}`}
        title="Generate Page Layout with AI"
      >
        <Sparkles size={16} />
        <span>AI Generate</span>
      </button>
      <a
        href={`/live-preview/${siteId}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`cursor-pointer inline-flex items-center justify-center px-3 py-2 bg-teal-600 rounded-md hover:bg-teal-500 transition-colors ${isMobile ? 'w-full' : ''}`}
      >
        <Eye size={16} className="mr-1" />
        Live Preview
      </a>
      <button
        onClick={() => {}}
        className={`cursor-pointer flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors ${isMobile ? 'w-full' : ''}`}
      >
        <Sparkles size={16} />
        <span>Publish</span>
      </button>
    </div>
  );

  return (
    <EditorContext.Provider value={{ state, dispatch }}>
      <div className="flex h-screen bg-gray-800 text-white font-sans antialiased overflow-hidden">
        <Head>
          <title>{currentSite?.title || 'Editor'} - Editor</title>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
        </Head>

        <DynamicStyleSheet pageStyles={state.pageStyles} />

        <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between px-4 bg-gray-900/80 backdrop-blur-md border-b border-gray-700">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              <FaArrowLeft />
            </button>
            <h1 className="text-xl font-semibold truncate max-w-[150px] sm:max-w-xs">
              {currentSite?.title || 'New Site'}
            </h1>
            <div className="hidden md:flex">{renderScreenSizeButtons()}</div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {renderActionButtons(false)}
          </div>

          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => {
                setIsLeftPanelOpenMobile(!isLeftPanelOpenMobile);
                setIsRightPanelOpenMobile(false);
              }}
              className={`p-2 rounded-md ${isLeftPanelOpenMobile ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700'}`}
              title="Toggle Elements Panel"
            >
              <FaLayerGroup />
            </button>
            <button
              onClick={() => {
                setIsRightPanelOpenMobile(!isRightPanelOpenMobile);
                setIsLeftPanelOpenMobile(false);
              }}
              className={`p-2 rounded-md ${isRightPanelOpenMobile ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700'}`}
              title="Toggle Properties Panel"
            >
              <FaSlidersH />
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 rounded-md ${isMobileMenuOpen ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700'}`}
              title="Open Menu"
            >
              <FaBars />
            </button>
          </div>
        </header>

        {isMobileMenuOpen && (
          <div className="fixed top-16 right-2 z-[60] w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-4 flex flex-col gap-4 md:hidden">
            {renderScreenSizeButtons()}
            <hr className="border-gray-700" />
            {renderActionButtons(true)}
          </div>
        )}

        <div className="flex flex-1 pt-16 h-full">
          <div className="hidden md:flex flex-1 h-full">
            <LeftPanel
              activeTab={leftSidebarTab}
              setActiveTab={setLeftSidebarTab}
            />
            <EditorCanvas screenSize={screenSize} />
            <RightPanel
              activePanel={activePanel}
              setActivePanel={setActivePanel}
              selectedElement={selectedElement}
              screenSize={screenSize}
              setScreenSize={setScreenSize}
            />
          </div>

          <div className="flex md:hidden flex-1 h-full">
            <EditorCanvas screenSize={screenSize} />
          </div>
        </div>

        {isLeftPanelOpenMobile && (
          <div className="fixed top-16 left-0 right-0 h-1/2 z-40 bg-gray-800 border-b border-gray-700 shadow-lg md:hidden flex flex-col">
            <button
              onClick={() => setIsLeftPanelOpenMobile(false)}
              className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white z-50"
              title="Close Panel"
            >
              <FaTimes />
            </button>
            <LeftPanel
              activeTab={leftSidebarTab}
              setActiveTab={setLeftSidebarTab}
            />
          </div>
        )}

        {isRightPanelOpenMobile && (
          <div className="fixed bottom-0 left-0 right-0 h-1/2 z-40 bg-gray-800 border-t border-gray-700 shadow-lg md:hidden flex flex-col">
            <button
              onClick={() => setIsRightPanelOpenMobile(false)}
              className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white z-50"
              title="Close Panel"
            >
              <FaTimes />
            </button>
            <RightPanel
              activePanel={activePanel}
              setActivePanel={setActivePanel}
              selectedElement={selectedElement}
              screenSize={screenSize}
              setScreenSize={setScreenSize}
            />
          </div>
        )}

        {selectedElement && <RichTextToolbar element={selectedElement} />}
        <AILayoutGeneratorModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          onGenerate={handleAiGenerate}
        />
        <SaveVersionModal
          isOpen={isSaveVersionModalOpen}
          onClose={() => setIsSaveVersionModalOpen(false)}
          onSave={handleConfirmSaveVersion}
        />
        <ConfirmationModal 
            isOpen={!!pendingAiElements}
            onClose={() => setPendingAiElements(null)}
            onConfirm={confirmAiGenerate}
            title="Replace Content?"
            message="This will replace your current page content with the AI generated layout. Are you sure?"
        />
      </div>
    </EditorContext.Provider>
  );
}
EditorPage.displayName = 'EditorPage';

const LeftPanel = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: 'elements' | 'layers' | 'templates';
  setActiveTab: (tab: 'elements' | 'layers' | 'templates') => void;
}) => {
  const { state } = useEditorContext();
  const elementGroups: { title: string; items: DraggableItemProps[] }[] = [
    {
      title: 'Layout',
      items: [
        { type: 'section', icon: Rows, label: 'Section' },
        { type: 'columns', icon: Columns, label: 'Columns' },
        { type: 'box', icon: Square, label: 'Box' },
        { type: 'accordion', icon: ChevronsUpDown, label: 'Accordion' },
        {
          type: 'horizontal-scroll',
          icon: GalleryThumbnails,
          label: 'Scroll Section',
        },
        {
          type: 'auto-scroll',
          icon: SlidersHorizontal,
          label: 'Auto Scroll',
        },
        {
          type: 'single-auto-scroll',
          icon: Replace,
          label: 'Single Scroll',
        },
        {
          type: 'image-carousel',
          icon: GalleryVerticalEnd,
          label: 'Image Carousel',
        },
        { type: 'hero-slider', icon: Presentation, label: 'Hero Slider' },
      ],
    },
    {
      title: 'Split Sections',
      items: [
        {
          type: 'right-image-section',
          icon: LayoutPanelLeft,
          label: 'Image Right',
        },
        {
          type: 'left-image-section',
          icon: PanelRight,
          label: 'Image Left',
        },
        {
          type: 'video-right-section',
          icon: LayoutPanelLeft,
          label: 'Video Right',
        },
        {
          type: 'video-left-section',
          icon: PanelRight,
          label: 'Video Left',
        },
      ],
    },
    {
      title: 'Content',
      items: [
        { type: 'heading', icon: Type, label: 'Heading' },
        { type: 'paragraph', icon: ListIcon, label: 'Paragraph' },
        { type: 'button', icon: LinkIcon, label: 'Button' },
        { type: 'divider', icon: Minus, label: 'Divider' },
        { type: 'ordered-list', icon: ListOrdered, label: 'Ordered List' },
        { type: 'unordered-list', icon: ListIcon, label: 'Unordered List' },
      ],
    },
    {
      title: 'Media',
      items: [
        { type: 'image', icon: ImageIcon, label: 'Image' },
        { type: 'video', icon: Video, label: 'Video' },
        { type: 'gallery', icon: GalleryHorizontal, label: 'Gallery' },
      ],
    },
    {
      title: 'Presets',
      items: [
        { type: 'hero', icon: Captions, label: 'Hero Section' },
        { type: 'navbar', icon: Menu, label: 'Navbar' },
        { type: 'footer', icon: Footprints, label: 'Footer' },
        { type: 'feature-grid', icon: Star, label: 'Feature Grid' },
        { type: 'steps', icon: GitBranch, label: 'Steps' },
        { type: 'testimonial', icon: Quote, label: 'Testimonial' },
        { type: 'faq', icon: MessageCircleQuestion, label: 'FAQ' },
        { type: 'contact-form', icon: MessageSquare, label: 'Contact Form' },
      ],
    },
    {
      title: 'Cards',
      items: [
        { type: 'card', icon: RectangleHorizontal, label: 'Card' },
        { type: 'preview-card', icon: BookImage, label: 'Preview Card' },
        { type: 'detail-card', icon: FileText, label: 'Detail Card' },
        { type: 'profile-card', icon: UserSquare, label: 'Profile Card' },
      ],
    },
  ];
  return (
    <aside className="w-full md:w-64 md:flex-shrink-0 bg-gray-900 md:border-r border-gray-700 flex flex-col h-full">
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('elements')}
          className={`cursor-pointer flex-1 flex items-center justify-center gap-2 py-2 text-sm ${
            activeTab === 'elements'
              ? 'bg-gray-800 text-white'
              : 'text-gray-400'
          }`}
        >
          <Square size={16} /> Elements
        </button>
        <button
          onClick={() => setActiveTab('layers')}
          className={`cursor-pointer flex-1 flex items-center justify-center gap-2 py-2 text-sm ${
            activeTab === 'layers'
              ? 'bg-gray-800 text-white'
              : 'text-gray-400'
          }`}
        >
          <Layers size={16} /> Layers
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`cursor-pointer flex-1 flex items-center justify-center gap-2 py-2 text-sm ${
            activeTab === 'templates'
              ? 'bg-gray-800 text-white'
              : 'text-gray-400'
          }`}
        >
          <LayoutTemplate size={16} /> Assets
        </button>
      </div>
      <div className="p-4 overflow-y-auto flex-1">
        {activeTab === 'elements' && (
          <div>
            {elementGroups.map((group) => (
              <div key={group.title} className="mb-4">
                <h3 className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">
                  {group.title}
                </h3>
                <div className="grid grid-cols-3 md:grid-cols-2 gap-2">
                  {group.items.map((el) => (
                    <DraggableItem key={el.type} {...el} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'layers' && <LayersPanel nodes={state.pageContent} />}
        {activeTab === 'templates' && <TemplatesPanel />}
      </div>
    </aside>
  );
};
LeftPanel.displayName = 'LeftPanel';

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

const LayersPanel = ({ nodes, level = 0 }: { nodes: Element[], level?: number }) => {
    const { state, dispatch } = useEditorContext();
    const { selectedElementId } = state;

    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

    const containsId = (element: Element, targetId: string): boolean => {
        if (element.id === targetId) return true;

        if (element.children) {
            for (const child of element.children) {
                if (containsId(child, targetId)) return true;
            }
        }

        if (element.type === 'columns' && element.content) {
            try {
                const content = JSON.parse(element.content);
                if (content.columns) {
                    for (const col of content.columns) {
                        if (col.children) {
                            for (const child of col.children) {
                                if (containsId(child, targetId)) return true;
                            }
                        }
                    }
                }
            } catch (e) {}
        }
        return false;
    };

    useEffect(() => {
        if (!selectedElementId) return;

        const nodesToExpand = new Set<string>();

        nodes.forEach(node => {
            if (node.id !== selectedElementId && containsId(node, selectedElementId)) {
                nodesToExpand.add(node.id);
            }

            if (node.id === selectedElementId) {
                setTimeout(() => {
                    const el = document.getElementById(`layer-node-${node.id}`);
                    if (el) {
                        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
                    }
                }, 100);
            }
        });

        if (nodesToExpand.size > 0) {
            setExpandedNodes(prev => {
                const next = new Set(prev);
                let hasChanges = false;
                nodesToExpand.forEach(id => {
                    if (!next.has(id)) {
                        next.add(id);
                        hasChanges = true;
                    }
                });
                return hasChanges ? next : prev;
            });
        }
    }, [selectedElementId, nodes]);

    if (!nodes || nodes.length === 0) return null;

    const toggleNode = (id: string) => {
        setExpandedNodes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    return (
        <div className="text-sm">
            {nodes.map(node => {
                const isExpanded = expandedNodes.has(node.id);
                const hasChildren = (node.children && node.children.length > 0) || (node.type === 'columns' && JSON.parse(node.content).columns.length > 0);

                return (
                    <div key={node.id}>
                        <div className="flex items-center w-full">
                            {hasChildren && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleNode(node.id); }}
                                    className="p-1"
                                >
                                    {isExpanded 
                                        ? <lucideIcons.ChevronDown size={16} /> 
                                        : <lucideIcons.ChevronRight size={16} />
                                    }
                                </button>
                            )}
                            <button
                                id={`layer-node-${node.id}`}
                                onClick={(e) => { e.stopPropagation(); dispatch({ type: 'SET_SELECTED_ELEMENT', payload: node.id })}}
                                className={`w-full text-left px-2 py-1 rounded hover:bg-gray-700 ${selectedElementId === node.id ? 'bg-indigo-600' : ''}`}
                                style={{ marginLeft: `${level*level*level*4}px` }}
                            >
                                {node.name || node.type}
                            </button>
                        </div>

                        {isExpanded && node.children && 
                        <div className = "ml-4">
                          <LayersPanel nodes={node.children} level={level + 1} />
                        </div>
                        }

                        {isExpanded && node.type === 'columns' && JSON.parse(node.content).columns.map((col: { id: string, children: Element[] }, i: number) => (
                            <div key={col.id} className='ml-8'>
                                <div className="px-2 py-1 text-gray-400" style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}>Column {i + 1}</div>
                                <LayersPanel nodes={col.children} level={level + 2} />
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
};

LayersPanel.displayName = 'LayersPanel';

const TemplatesPanel = () => {
  const { state, dispatch } = useEditorContext();
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [pendingTemplate, setPendingTemplate] = useState<(() => Element[]) | null>(null);
  
  const stockImages = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1553095066-5014bc7b7f2d?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1522252234503-e356532cafd5?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1488229297570-58520851e868?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop',
  ];

  // ... [Templates definitions are unchanged, keeping them implicit for brevity as requested to only show changes, but structure requires full component for context]
  // Assuming template definitions (portfolioTemplate, landingPageTemplate, etc.) are here as in original.
  // I will include the `pageTemplates` array and below logic which is the changed part.

  const portfolioTemplate = (): Element[] => {
    const hero = createNewElement('hero') as Element;
    hero.content = JSON.stringify({ backgroundType: 'image', backgroundImageUrl: 'https://images.unsplash.com/photo-1522252234503-e356532cafd5?q=80&w=1600&auto=format&fit=crop', contentPosition: 'center-middle' });
    hero.children = [
      { ...(createNewElement('heading') as Element), content: '<h1>John Doe</h1>' },
      { ...(createNewElement('paragraph') as Element), content: '<p>Creative Software Engineer & AI Enthusiast</p>' }
    ];

    const about = createNewElement('right-image-section') as Element;
    about.children = [
      { ...(createNewElement('heading') as Element), content: '<h2>About Me</h2>', styles: { desktop: { default: { textAlign: 'left' }}} },
      { ...(createNewElement('paragraph') as Element), content: '<p>I am a passionate developer... (add your description)</p>', styles: { desktop: { default: { textAlign: 'left' }}}}
    ];
    about.content = JSON.stringify({ imageSrc: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop' });

    const skills = createNewElement('feature-grid') as Element;
    (skills.children![0] as Element).content = '<h2>My Skills</h2>';
    const skillsContainer = skills.children![1] as Element;
    (skillsContainer.children![0] as Element).content = JSON.stringify({ icon: 'Type', title: 'Frontend', text: 'React, Next.js, Tailwind' });
    (skillsContainer.children![1] as Element).content = JSON.stringify({ icon: 'Square', title: 'Backend', text: 'Node.js, Python, Firebase' });
    (skillsContainer.children![2] as Element).content = JSON.stringify({ icon: 'Sparkles', title: 'AI', text: 'Gemini, TensorFlow' });

    const gallerySection = createNewElement('section') as Element;
    gallerySection.children = [
      { ...(createNewElement('heading') as Element), content: '<h2>My Work</h2>' },
      createNewElement('gallery') as Element
    ];

    const contactSection = createNewElement('section') as Element;
    contactSection.children = [
      { ...(createNewElement('heading') as Element), content: '<h2>Get In Touch</h2>' },
      createNewElement('contact-form') as Element
    ];

    return [
      createNewElement('navbar') as Element,
      hero,
      about,
      skills,
      gallerySection,
      createNewElement('testimonial') as Element,
      contactSection,
      createNewElement('footer') as Element,
    ];
  };

  const landingPageTemplate = (): Element[] => {
    const hero = createNewElement('hero') as Element;
    hero.content = JSON.stringify({ backgroundType: 'image', backgroundImageUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1600&auto=format&fit=crop', contentPosition: 'center-middle' });
    hero.children = [
      { ...(createNewElement('heading') as Element), content: '<h1>Launch Your Next Big Idea</h1>' },
      { ...(createNewElement('paragraph') as Element), content: '<p>The ultimate platform for innovation and creativity.</p>' },
      { ...(createNewElement('button') as Element), content: 'Get Started Today' }
    ];

    const featureSection = createNewElement('left-image-section') as Element;
    featureSection.children = [
      { ...(createNewElement('heading') as Element), content: '<h2>A Deeper Dive</h2>', styles: { desktop: { default: { textAlign: 'left' }}} },
      { ...(createNewElement('paragraph') as Element), content: '<p>Discover how our product can change the way you work.</p>', styles: { desktop: { default: { textAlign: 'left' }}}},
      { ...(createNewElement('button') as Element), content: 'Learn More', styles: { desktop: { default: { margin: '0' }}}}
    ];

    const demoSection = createNewElement('video-right-section') as Element;
    demoSection.children = [
      { ...(createNewElement('heading') as Element), content: '<h2>See It in Action</h2>', styles: { desktop: { default: { textAlign: 'left' }}} },
      { ...(createNewElement('paragraph') as Element), content: '<p>Watch our 2-minute demo video.</p>', styles: { desktop: { default: { textAlign: 'left' }}}}
    ];

    return [
      createNewElement('navbar') as Element,
      hero,
      createNewElement('feature-grid') as Element,
      featureSection,
      demoSection,
      createNewElement('testimonial') as Element,
      createNewElement('faq') as Element,
      createNewElement('footer') as Element,
    ];
  };

  const saasTemplate = (): Element[] => {
    const hero = createNewElement('hero') as Element;
    hero.content = JSON.stringify({ backgroundType: 'image', backgroundImageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1600&auto.format&fit=crop', contentPosition: 'center-middle' });
    hero.children = [
      { ...(createNewElement('heading') as Element), content: '<h1>SaaS Product Title</h1>' },
      { ...(createNewElement('paragraph') as Element), content: '<p>The best solution for your business.</p>' },
      { ...(createNewElement('button') as Element), content: 'Get Started' }
    ];

    const dashboardPreview = createNewElement('right-image-section') as Element;
    dashboardPreview.children = [
      { ...(createNewElement('heading') as Element), content: '<h2>Powerful Dashboard</h2>', styles: { desktop: { default: { textAlign: 'left' }}} },
      { ...(createNewElement('paragraph') as Element), content: '<p>All your data, in one place. Clean, intuitive, and simple.</p>', styles: { desktop: { default: { textAlign: 'left' }}}}
    ];
    dashboardPreview.content = JSON.stringify({ imageSrc: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=800&auto=format&fit=crop' });

    const contactSection = createNewElement('section') as Element;
    contactSection.children = [
      { ...(createNewElement('heading') as Element), content: '<h2>Request a Demo</h2>' },
      createNewElement('contact-form') as Element
    ];

    return [
      createNewElement('navbar') as Element,
      hero,
      createNewElement('feature-grid') as Element,
      createNewElement('steps') as Element,
      dashboardPreview,
      createNewElement('testimonial') as Element,
      createNewElement('faq') as Element,
      contactSection,
      createNewElement('footer') as Element,
    ];
  };

  const agencyTemplate = (): Element[] => {
    const hero = createNewElement('hero') as Element;
    hero.content = JSON.stringify({ backgroundType: 'image', backgroundImageUrl: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=1600&auto.format&fit=crop', contentPosition: 'center-middle' });
    hero.children = [
      { ...(createNewElement('heading') as Element), content: '<h1>Creative Agency</h1>' },
      { ...(createNewElement('paragraph') as Element), content: '<p>We build amazing digital experiences.</p>' }
    ];

    const services = createNewElement('feature-grid') as Element;
    (services.children![0] as Element).content = '<h2>Our Services</h2>';

    const portfolioSection = createNewElement('section') as Element;
    portfolioSection.children = [
      { ...(createNewElement('heading') as Element), content: '<h2>Our Portfolio</h2>' },
      createNewElement('gallery') as Element
    ];

    const teamSection = createNewElement('section') as Element;
    const teamScroll = createNewElement('horizontal-scroll') as Element;
    teamScroll.children = [
      createNewElement('profile-card') as Element,
      createNewElement('profile-card') as Element,
      createNewElement('profile-card') as Element
    ];
    teamSection.children = [
      { ...(createNewElement('heading') as Element), content: '<h2>Meet the Team</h2>' },
      teamScroll
    ];

    const contactSection = createNewElement('section') as Element;
    contactSection.children = [
      { ...(createNewElement('heading') as Element), content: '<h2>Let\'s Talk</h2>' },
      createNewElement('contact-form') as Element
    ];
    
    return [
      createNewElement('navbar') as Element,
      hero,
      services,
      portfolioSection,
      createNewElement('testimonial') as Element,
      teamSection,
      contactSection,
      createNewElement('footer') as Element,
    ];
  };

  const restaurantTemplate = (): Element[] => {
    const hero = createNewElement('hero') as Element;
    hero.content = JSON.stringify({ backgroundType: 'image', backgroundImageUrl: 'https://images.unsplash.com/photo-1517248135822-67b1e1b24b22?q=80&w=1600&auto.format&fit=crop', contentPosition: 'center-middle' });
    hero.children = [
      { ...(createNewElement('heading') as Element), content: '<h1>The Golden Spoon</h1>' },
      { ...(createNewElement('paragraph') as Element), content: '<p>Exquisite dining since 1999.</p>' }
    ];

    const about = createNewElement('left-image-section') as Element;
    about.children = [
      { ...(createNewElement('heading') as Element), content: '<h2>Our Story</h2>', styles: { desktop: { default: { textAlign: 'left' }}} },
      { ...(createNewElement('paragraph') as Element), content: '<p>Founded with a passion for flavor and a commitment to quality.</p>', styles: { desktop: { default: { textAlign: 'left' }}}}
    ];

    const specials = createNewElement('feature-grid') as Element;
    (specials.children![0] as Element).content = '<h2>Chef\'s Specials</h2>';
    (specials.children![1] as Element).children = [
      createNewElement('preview-card') as Element,
      createNewElement('preview-card') as Element,
      createNewElement('preview-card') as Element
    ];
    (specials.children![1] as Element).styles.desktop.default.gridTemplateColumns = 'repeat(3, 1fr)';

    const gallerySection = createNewElement('section') as Element;
    gallerySection.children = [
      { ...(createNewElement('heading') as Element), content: '<h2>Our Gallery</h2>' },
      createNewElement('gallery') as Element
    ];

    const reservationSection = createNewElement('section') as Element;
    reservationSection.children = [
      { ...(createNewElement('heading') as Element), content: '<h2>Make a Reservation</h2>' },
      createNewElement('contact-form') as Element
    ];

    return [
      createNewElement('navbar') as Element,
      hero,
      about,
      specials,
      gallerySection,
      createNewElement('testimonial') as Element,
      reservationSection,
      createNewElement('footer') as Element,
    ];
  };

  const personalTrainerTemplate = (): Element[] => {
    const hero = createNewElement('hero') as Element;
    hero.content = JSON.stringify({ backgroundType: 'image', backgroundImageUrl: 'https://images.unsplash.com/photo-1571019613442-75d0b9231f8b?q=80&w=1600&auto.format&fit=crop', contentPosition: 'center-middle' });
    hero.children = [
      { ...(createNewElement('heading') as Element), content: '<h1>Get Fit, Stay Strong</h1>' },
      { ...(createNewElement('paragraph') as Element), content: '<p>Personalized training programs to help you reach your goals.</p>' },
      { ...(createNewElement('button') as Element), content: 'Book a Session' }
    ];

    const about = createNewElement('right-image-section') as Element;
    about.children = [
      { ...(createNewElement('heading') as Element), content: '<h2>About Me</h2>', styles: { desktop: { default: { textAlign: 'left' }}} },
      { ...(createNewElement('paragraph') as Element), content: '<p>Certified personal trainer with 10 years of experience helping clients achieve their fitness goals.</p>', styles: { desktop: { default: { textAlign: 'left' }}}}
    ];
    about.content = JSON.stringify({ imageSrc: 'https://images.unsplash.com/photo-1548690312-e6b715ee72c2?q=80&w=800&auto=format&fit=crop' });

    const services = createNewElement('feature-grid') as Element;
    (services.children![0] as Element).content = '<h2>My Services</h2>';

    const journey = createNewElement('steps') as Element;
    (journey.children![0] as Element).content = '<h2>Your Fitness Journey</h2>';

    const contactSection = createNewElement('section') as Element;
    contactSection.children = [
      { ...(createNewElement('heading') as Element), content: '<h2>Book a Free Consultation</h2>' },
      createNewElement('contact-form') as Element
    ];

    return [
      createNewElement('navbar') as Element,
      hero,
      about,
      services,
      journey,
      createNewElement('testimonial') as Element,
      createNewElement('faq') as Element,
      contactSection,
      createNewElement('footer') as Element,
    ];
  };

  const createPriceCard = (title: string, price: string, features: string[]): Element => {
    const card = createNewElement('card') as Element;
    card.children = [
      { ...(createNewElement('heading') as Element), content: `<h3>${title}</h3>` },
      { ...(createNewElement('heading') as Element), content: `<h2>${price}</h2>`, styles: { desktop: { default: { color: '#4f46e5', margin: '0' }}} },
      { ...(createNewElement('paragraph') as Element), content: '<p>per month</p>', styles: { desktop: { default: { margin: '0 0 16px 0' }}} },
      { ...(createNewElement('unordered-list') as Element), content: `<ul>${features.map(f => `<li>${f}</li>`).join('')}</ul>`, styles: { desktop: { default: { textAlign: 'left', width: '100%', paddingLeft: '20px' }}} },
      { ...(createNewElement('button') as Element), content: 'Get Started', styles: { desktop: { default: { width: '100%', marginTop: '16px' }}} }
    ];
    card.styles.desktop.default.alignItems = 'center';
    return card;
  };

  const pricingPageTemplate = (): Element[] => {
    const pricingColumns = createNewElement('columns') as Element;
    const pricingContent = JSON.parse(pricingColumns.content);
    pricingContent.columns = [
      { id: getUniqueId('column_internal'), children: [ createPriceCard('Basic', '$10', ['Feature 1', 'Feature 2', 'Feature 3']) ] },
      { id: getUniqueId('column_internal'), children: [ createPriceCard('Pro', '$25', ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4']) ] },
      { id: getUniqueId('column_internal'), children: [ createPriceCard('Enterprise', '$50', ['All Features', 'Support', 'Analytics']) ] }
    ];
    pricingColumns.content = JSON.stringify(pricingContent, null, 2);
    pricingColumns.styles.desktop.default.alignItems = 'stretch';
    pricingColumns.styles.desktop.default.gap = '32px';

    const pricingHeader = createNewElement('section') as Element;
    pricingHeader.children = [
      { ...(createNewElement('heading') as Element), content: '<h2>Find the Plan That\'s Right for You</h2>' },
      { ...(createNewElement('paragraph') as Element), content: '<p>Simple, transparent pricing for everyone.</p>' }
    ];
    
    const featureCompare = createNewElement('feature-grid') as Element;
    (featureCompare.children![0] as Element).content = '<h2>Compare All Features</h2>';

    const contactSection = createNewElement('section') as Element;
    contactSection.children = [
      { ...(createNewElement('heading') as Element), content: '<h2>Enterprise or Custom Plan?</h2>' },
      createNewElement('contact-form') as Element
    ];

    return [
      createNewElement('navbar') as Element,
      pricingHeader,
      pricingColumns,
      featureCompare,
      createNewElement('testimonial') as Element,
      createNewElement('faq') as Element,
      contactSection,
      createNewElement('footer') as Element,
    ];
  };

  const blogPostTemplate = (): Element[] => {
    const hero = createNewElement('hero') as Element;
    hero.styles.desktop.default.height = '300px';
    hero.content = JSON.stringify({ backgroundType: 'image', backgroundImageUrl: 'https://images.unsplash.com/photo-1488229297570-58520851e868?q=80&w=1600&auto.format&fit=crop', contentPosition: 'center-middle' });
    hero.children = [
      { ...(createNewElement('heading') as Element), content: '<h1>Blog Post Title</h1>', styles: { desktop: { default: { color: '#ffffff' }}} },
      { ...(createNewElement('paragraph') as Element), content: '<p>Published on January 1, 2025 by Author Name</p>', styles: { desktop: { default: { color: '#e0e7ff' }}}}
    ];

    const mainContent = createNewElement('section') as Element;
    mainContent.children = [
      { ...(createNewElement('paragraph') as Element), content: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...</p>', styles: { desktop: { default: { textAlign: 'left', maxWidth: '800px' }}}},
      { ...(createNewElement('image') as Element), content: 'https://images.unsplash.com/photo-1553095066-5014bc7b7f2d?q=80&w=800&auto=format&fit=crop' },
      { ...(createNewElement('heading') as Element), content: '<h2>Subheading Here</h2>', styles: { desktop: { default: { textAlign: 'left', maxWidth: '800px' }}}},
      { ...(createNewElement('paragraph') as Element), content: '<p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat...</p>', styles: { desktop: { default: { textAlign: 'left', maxWidth: '800px' }}}},
      { ...(createNewElement('unordered-list') as Element), content: '<ul><li>List item one</li><li>List item two</li></ul>', styles: { desktop: { default: { textAlign: 'left', maxWidth: '800px', margin: '16px auto' }}}}
    ];

    const authorSection = createNewElement('right-image-section') as Element;
    authorSection.content = JSON.stringify({ imageSrc: 'https://images.unsplash.com/photo-1553095066-5014bc7b7f2d?q=80&w=800&auto=format&fit=crop' });
    authorSection.children = [
      { ...(createNewElement('heading') as Element), content: '<h2>About the Author</h2>', styles: { desktop: { default: { textAlign: 'left' }}} },
      { ...(createNewElement('paragraph') as Element), content: '<p>Author bio goes here...</p>', styles: { desktop: { default: { textAlign: 'left' }}}}
    ];

    const relatedPostsSection = createNewElement('section') as Element;
    const relatedScroll = createNewElement('horizontal-scroll') as Element;
    relatedScroll.children = [
      createNewElement('preview-card') as Element,
      createNewElement('preview-card') as Element,
      createNewElement('preview-card') as Element
    ];
    relatedPostsSection.children = [
      { ...(createNewElement('heading') as Element), content: '<h2>Related Posts</h2>' },
      relatedScroll
    ];

    const commentsSection = createNewElement('section') as Element;
    commentsSection.children = [
      { ...(createNewElement('heading') as Element), content: '<h2>Leave a Comment</h2>' },
      createNewElement('contact-form') as Element
    ];
    
    return [
      createNewElement('navbar') as Element,
      hero,
      mainContent,
      authorSection,
      relatedPostsSection,
      commentsSection,
      createNewElement('footer') as Element,
    ];
  };

  const productPageTemplate = (): Element[] => {
    const productDetails = createNewElement('columns') as Element;
    productDetails.content = JSON.stringify({
      columns: [
        { id: getUniqueId('column_internal'), children: [ { ...(createNewElement('image') as Element), content: 'https://images.unsplash.com/photo-1553095066-5014bc7b7f2d?q=80&w=800&auto=format&fit=crop' } ] },
        { id: getUniqueId('column_internal'), children: [
          { ...(createNewElement('heading') as Element), content: '<h2>Product Name</h2>', styles: { desktop: { default: { textAlign: 'left' }}}},
          { ...(createNewElement('heading') as Element), content: '<h3>$99.99</h3>', styles: { desktop: { default: { textAlign: 'left', color: '#4f46e5' }}}},
          { ...(createNewElement('paragraph') as Element), content: '<p>This is a great description of the product. It has many features and benefits that you will love.</p>', styles: { desktop: { default: { textAlign: 'left' }}}},
          { ...(createNewElement('button') as Element), content: 'Add to Cart', styles: { desktop: { default: { margin: '0', width: '100%' }}}}
        ] }
      ]
    }, null, 2);

    const demoVideo = createNewElement('video-right-section') as Element;
    demoVideo.children = [
      { ...(createNewElement('heading') as Element), content: '<h2>Product in Action</h2>', styles: { desktop: { default: { textAlign: 'left' }}} },
      { ...(createNewElement('paragraph') as Element), content: '<p>See how it works before you buy.</p>', styles: { desktop: { default: { textAlign: 'left' }}}}
    ];

    const features = createNewElement('feature-grid') as Element;
    (features.children![0] as Element).content = '<h2>Why You\'ll Love It</h2>';

  const relatedProductsSection = createNewElement('section') as Element;
    const relatedScroll = createNewElement('horizontal-scroll') as Element;
    relatedScroll.children = [
      createNewElement('preview-card') as Element,
      createNewElement('preview-card') as Element,
      createNewElement('preview-card') as Element
    ];
    relatedProductsSection.children = [
      { ...(createNewElement('heading') as Element), content: '<h2>Related Products</h2>' },
      relatedScroll
    ];
    
    return [
      createNewElement('navbar') as Element,
      productDetails,
      demoVideo,
      features,
      createNewElement('testimonial') as Element,
      createNewElement('faq') as Element,
      relatedProductsSection,
      createNewElement('footer') as Element,
    ];
  };

  const comingSoonTemplate = (): Element[] => {
    const hero = createNewElement('hero') as Element;
    hero.styles.desktop.default.height = '80vh';
    hero.children = [
      { ...(createNewElement('heading') as Element), content: '<h1>We\'re Launching Soon</h1>' },
      { ...(createNewElement('paragraph') as Element), content: '<p>Something amazing is coming. Sign up to be the first to know.</p>' }
    ];

    const notifyMe = createNewElement('section') as Element;
    const form = createNewElement('contact-form') as Element;
    form.content = JSON.stringify({
      fields: [ { id: getUniqueId('form-field'), label: 'Email', type: 'email' } ],
      buttonText: 'Notify Me'
    });
    notifyMe.children = [
      { ...(createNewElement('heading') as Element), content: '<h2>Get Notified</h2>' },
      form
    ];

    const features = createNewElement('feature-grid') as Element;
    (features.children![0] as Element).content = '<h2>What to Expect</h2>';

    const timeline = createNewElement('steps') as Element;
    (timeline.children![0] as Element).content = '<h2>Our Timeline</h2>';

    return [
      createNewElement('navbar') as Element,
      hero,
      notifyMe,
      features,
      timeline,
      createNewElement('faq') as Element,
      createNewElement('footer') as Element,
    ];
  };

  const eventLandingPageTemplate = (): Element[] => {
    const hero = createNewElement('hero') as Element;
    hero.content = JSON.stringify({ backgroundType: 'image', backgroundImageUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d266ac?q=80&w=1600&auto.format&fit=crop', contentPosition: 'center-middle' });
    hero.children = [
      { ...(createNewElement('heading') as Element), content: '<h1>Annual Tech Summit 2025</h1>' },
      { ...(createNewElement('paragraph') as Element), content: '<p>Join us on December 5th for a day of innovation.</p>' },
      { ...(createNewElement('button') as Element), content: 'Register Now' }
    ];

    const highlights = createNewElement('video-left-section') as Element;
    highlights.children = [
      { ...(createNewElement('heading') as Element), content: '<h2>Last Year\'s Highlights</h2>', styles: { desktop: { default: { textAlign: 'left' }}}}
    ];

    const speakers = createNewElement('feature-grid') as Element;
    (speakers.children![0] as Element).content = '<h2>Speakers</h2>';
    const speakersContainer = speakers.children![1] as Element;
    speakersContainer.styles.desktop.default.gridTemplateColumns = 'repeat(3, 1fr)';
    speakersContainer.children = [
      createNewElement('profile-card') as Element,
      createNewElement('profile-card') as Element,
      createNewElement('profile-card') as Element
    ];
    (speakers.children![1] as Element).children = speakersContainer.children;

    const schedule = createNewElement('steps') as Element;
    (schedule.children![0] as Element).content = '<h2>Event Schedule</h2>';

    const gallerySection = createNewElement('section') as Element;
    gallerySection.children = [
      { ...(createNewElement('heading') as Element), content: '<h2>Venue & Past Events</h2>' },
      createNewElement('gallery') as Element
    ];

    const registerSection = createNewElement('section') as Element;
    registerSection.children = [
      { ...(createNewElement('heading') as Element), content: '<h2>Register for Updates</h2>' },
      createNewElement('contact-form') as Element
    ];

    return [
      createNewElement('navbar') as Element,
      hero,
      highlights,
      speakers,
      schedule,
      gallerySection,
      registerSection,
      createNewElement('footer') as Element,
    ];
  };


  const pageTemplates = [
    { name: "Portfolio", template: portfolioTemplate },
    { name: "Landing Page", template: landingPageTemplate },
    { name: "SaaS", template: saasTemplate },
    { name: "Agency", template: agencyTemplate },
    { name: "Restaurant", template: restaurantTemplate },
    { name: "Fitness", template: personalTrainerTemplate },
    { name: "Pricing Page", template: pricingPageTemplate },
    { name: "Blog Post", template: blogPostTemplate },
    { name: "Product Page", template: productPageTemplate },
    { name: "Coming Soon", template: comingSoonTemplate },
    { name: "Event Page", template: eventLandingPageTemplate },
  ];

  useEffect(() => {
    const fetchUserAssets = async () => {
      const token = localStorage.getItem("blogToken");
      if (!token) {
        setIsLoadingAssets(false);
        return; 
      }
      try {
        const response = await fetch('/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const profile = await response.json();
          if (profile.assets && Array.isArray(profile.assets)) {
            setUploadedImages(profile.assets.reverse());
          }
        } else {
          console.error('Failed to fetch user profile for assets');
        }
      } catch (error) {
        console.error('Error fetching user assets:', error);
      } finally {
        setIsLoadingAssets(false);
      }
    };
    fetchUserAssets();
  }, []);

  const handleApplyTemplate = (templateFn: () => Element[]) => {
    if (state.pageContent.length === 0) {
      dispatch({ type: 'SET_PAGE_CONTENT', payload: templateFn() });
    } else {
      setPendingTemplate(() => templateFn);
    }
  };

  const confirmTemplate = () => {
    if (pendingTemplate) {
      dispatch({ type: 'SET_PAGE_CONTENT', payload: pendingTemplate() });
      setPendingTemplate(null);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async (file: File) => {
    const token = localStorage.getItem("blogToken");
    if (!token) {
      toast.error("Authentication error. Please log in again.");
      return;
    }
    setIsUploading(true);
    const uploadToastId = toast.loading('Uploading image...');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const uploadResponse = await fetch('/api/uploads', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.message || 'Image upload failed.');
      }
      const { photoURL: s3Url } = await uploadResponse.json();
      const profileUpdateResponse = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newAssetUrl: s3Url }), 
      });
      if (!profileUpdateResponse.ok) {
        const errorData = await profileUpdateResponse.json();
        throw new Error(errorData.message || 'Failed to save image to library.');
      }
      setUploadedImages(prev => [s3Url, ...prev]); 
      toast.success('Image added to library!', { id: uploadToastId });
    } catch (error: any) {
      console.error('Upload process failed:', error);
      toast.error(error.message || 'An error occurred during upload.', { id: uploadToastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenDeleteModal = (src: string) => {
    setImageToDelete(src);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isDeleting) return;
    setIsModalOpen(false);
    setImageToDelete(null);
  };

  const handleConfirmDelete = async () => {
    const token = localStorage.getItem("blogToken");
    if (!imageToDelete || !token) {
      toast.error("Error: Missing image URL or auth token.");
      return;
    }

    setIsDeleting(true);
    const deleteToastId = toast.loading('Deleting image...');

    try {
      const s3DeleteResponse = await fetch('/api/uploads', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photoURL: imageToDelete }),
      });

      if (!s3DeleteResponse.ok) {
        console.warn('S3 delete failed, proceeding to profile update...');
      }

      const profileUpdateResponse = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ removeAssetUrl: imageToDelete }),
      });

      if (!profileUpdateResponse.ok) {
        const errorData = await profileUpdateResponse.json();
        throw new Error(errorData.message || 'Failed to update profile.');
      }

      setUploadedImages(prev => prev.filter(img => img !== imageToDelete));
      
      toast.success('Image deleted!', { id: deleteToastId });
      handleCloseModal();

    } catch (error: any) {
      console.error('Delete process failed:', error);
      toast.error(error.message || 'An error occurred during deletion.', { id: deleteToastId });
    } finally {
      setIsDeleting(false);
    }
  };

  const DraggableImage = ({ src }: { src: string }) => {
    const handleDragStart = (e: React.DragEvent) => e.dataTransfer.setData('imageURL', src);
    return <Image src={src} draggable onDragStart={handleDragStart} className="w-full h-20 object-cover rounded-md cursor-grab border-2 border-transparent hover:border-indigo-500" alt="Draggable asset" width={100} height={80} priority />;
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h3 className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Page Templates</h3>
          <div className="space-y-2">
            {pageTemplates.map(t => <button key={t.name} onClick={() => handleApplyTemplate(t.template)} className="w-full text-left p-2 rounded-lg bg-gray-800 border border-gray-700 transition-all hover:bg-gray-700 hover:border-indigo-500">{t.name}</button>)}
          </div>
        </div>
        
        <div>
          <h3 className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Image Library</h3>
          <input 
            type="file" 
            id="imageUpload" 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange} 
            disabled={isUploading}
            ref={fileInputRef} 
          />
          <label htmlFor="imageUpload" className={`w-full flex items-center justify-center gap-2 p-2 rounded-lg text-white mb-4 ${isUploading ? 'bg-gray-500 cursor-not-allowed' : 'bg-indigo-600 cursor-pointer hover:bg-indigo-500'}`}>
            {isUploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
            <span>{isUploading ? 'Uploading...' : 'Upload Image'}</span>
          </label>
          
          {isLoadingAssets && (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Loader2 className="animate-spin mb-2" size={24} />
              <span className="text-xs">Loading library...</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            
            {uploadedImages.map((src, i) => (
              <div key={`uploaded-${i}`} className="relative group">
                <DraggableImage src={src} />
                <button
                  onClick={() => handleOpenDeleteModal(src)}
                  className="cursor-pointer absolute top-1 right-1 p-0.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 focus:opacity-100"
                  aria-label="Delete image"
                  disabled={isDeleting}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            
            {stockImages.map((src, i) => <DraggableImage key={`stock-${i}`} src={src} />)}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30" aria-modal="true" role="dialog">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h4 className="text-lg font-semibold text-white mb-4">Delete Image</h4>
            <p className="text-gray-300 mb-6">Are you sure you want to delete this image? This action cannot be undone.</p>
            {imageToDelete && (
              <Image src={imageToDelete} alt="Image to delete" width={80} height={80} className="w-20 h-20 object-cover rounded-md mb-4" />
            )}
            <div className="flex justify-end gap-4">
              <button
                onClick={handleCloseModal}
                disabled={isDeleting}
                className="cursor-pointer px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="cursor-pointer px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmationModal 
        isOpen={!!pendingTemplate}
        onClose={() => setPendingTemplate(null)}
        onConfirm={confirmTemplate}
        title="Apply Template?"
        message="This will replace your current page content. Are you sure you want to continue?"
      />
    </>
  );
};
TemplatesPanel.displayName = 'TemplatesPanel';


const EditorCanvas = ({ screenSize }: { screenSize: 'desktop' | 'tablet' | 'mobile' }) => {
    const { state, dispatch } = useEditorContext();
    const { pageContent, pageStyles } = state;
    const [dropIndicator, setDropIndicator] = useState<{ parentId: string; index: number; } | null>(null);

    const handleDragOver = (e: React.DragEvent, parentId: string) => {
        e.preventDefault(); e.stopPropagation();
        const target = e.currentTarget as HTMLElement;
        const children = Array.from(target.children).filter(c => c.hasAttribute('data-draggable'));
        const rect = target.getBoundingClientRect();
        const y = e.clientY - rect.top;
        let index = children.length;
        for (let i = 0; i < children.length; i++) {
            const childRect = children[i].getBoundingClientRect();
            if (y < childRect.top - rect.top + childRect.height / 2) {
                index = i; break;
            }
        }
        setDropIndicator({ parentId, index });
    };

    const handleDrop = (e: React.DragEvent, parentId: string, index: number) => {
        e.preventDefault(); e.stopPropagation();
        setDropIndicator(null);
        const draggedId = e.dataTransfer.getData('draggedElementId');
        if(draggedId) {
            dispatch({ type: 'MOVE_ELEMENT', payload: { draggedId, targetParentId: parentId, targetIndex: index } });
            return;
        }
        const elementType = e.dataTransfer.getData('elementType') as ElementType;
        if (elementType) {
            const newElement = createNewElement(elementType);
            dispatch({ type: 'ADD_ELEMENT', payload: { elements: Array.isArray(newElement) ? newElement : [newElement], parentId, index } });
        }
    };

    const renderChildren = (children: Element[], parentId: string) => (
        <>
            {children.map((child, i) => (
                <div key={child.id} data-draggable="true">
                    {dropIndicator?.parentId === parentId && dropIndicator.index === i && <DropIndicator />}
                    <RenderElement element={child} screenSize={screenSize} handleDragOver={handleDragOver} handleDrop={handleDrop} dropIndicator={dropIndicator} />
                </div>
            ))}
            {dropIndicator?.parentId === parentId && dropIndicator.index === children.length && <DropIndicator />}
            {children.length === 0 && <div className="min-h-[60px] flex items-center justify-center text-xs text-gray-400 border-2 border-dashed border-gray-300 rounded-md">Drag elements here</div>}
        </>
    );

    return (
        <main className="flex-1 overflow-auto md:p-8" style={{ backgroundColor: pageStyles.backgroundColor }}>
            <div
                className={`mx-auto bg-white shadow-2xl transition-all duration-300 relative ${getScreenSizeClass(screenSize)}`}
                style={{ ...pageStyles, minHeight: '100%', paddingBottom: '50vh' }}
                onDragOver={(e) => handleDragOver(e, 'canvas')}
                onDrop={(e) => handleDrop(e, 'canvas', dropIndicator?.index ?? pageContent.length)}
                onDragLeave={() => setDropIndicator(null)}
                onClick={() => dispatch({ type: 'SET_SELECTED_ELEMENT', payload: null})}
            >
                {renderChildren(pageContent, 'canvas')}
            </div>
        </main>
    );
};
EditorCanvas.displayName = 'EditorCanvas';

export const RenderElement = React.memo(({ element, screenSize, handleDragOver, handleDrop, dropIndicator }: { element: Element; screenSize: 'desktop' | 'tablet' | 'mobile'; handleDragOver: (e: React.DragEvent, parentId: string) => void; handleDrop: (e: React.DragEvent, parentId: string, index: number) => void; dropIndicator: { parentId: string; index: number } | null }) => {
    const { state, dispatch } = useEditorContext();
    const isSelected = state.selectedElementId === element.id;
    const ref = useRef<HTMLDivElement>(null);
    const handleSelect = (e: React.MouseEvent) => {
        e.stopPropagation();
        dispatch({ type: 'SET_SELECTED_ELEMENT', payload: element.id });
    };
    const handleDragStart = (e: React.DragEvent) => {
        e.stopPropagation();
        e.dataTransfer.setData('draggedElementId', element.id);
    };
    const handleContentBlur = () => {
        if (ref.current && ref.current.innerHTML !== element.content) {
            dispatch({ type: 'UPDATE_ELEMENT_CONTENT', payload: { elementId: element.id, content: ref.current.innerHTML } });
        }
    };
    const handleDropOnElement = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const imageURL = e.dataTransfer.getData('imageURL');
        if (imageURL) {
            if (element.type === 'image') {
                dispatch({ type: 'UPDATE_ELEMENT_CONTENT', payload: { elementId: element.id, content: imageURL } });
                return;
            }
            if (element.type === 'hero' || element.name === 'Hero Slide') {
                const content = JSON.parse(element.content);
                content.backgroundImageUrl = imageURL;
                content.backgroundType = 'image';
                dispatch({ type: 'UPDATE_ELEMENT_CONTENT', payload: { elementId: element.id, content: JSON.stringify(content, null, 2) } });
                return;
            }
             if (element.type === 'right-image-section' || element.type === 'left-image-section') {
                const content = JSON.parse(element.content);
                content.imageSrc = imageURL;
                dispatch({ type: 'UPDATE_ELEMENT_CONTENT', payload: { elementId: element.id, content: JSON.stringify(content, null, 2) } });
                return;
            }
             if (element.type === 'profile-card') {
                const content = JSON.parse(element.content);
                content.profileImage = imageURL;
                dispatch({ type: 'UPDATE_ELEMENT_CONTENT', payload: { elementId: element.id, content: JSON.stringify(content, null, 2) } });
                return;
            }
        }
        const currentDropIndex = dropIndicator?.index ?? (element.children || []).length
        handleDrop(e, element.id, currentDropIndex);
    }
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
    const props = { style: combinedStyles, onClick: handleSelect, onDragStart: handleDragStart, draggable: true, id: element.htmlId, className: element.className };
    const renderChildren = (children: Element[], parentId: string) => (
        <>
            {children.map((child, i) => (
                <div key={child.id} data-draggable="true">
                    {dropIndicator?.parentId === parentId && dropIndicator.index === i && <DropIndicator />}
                    <RenderElement element={child} screenSize={screenSize} handleDragOver={handleDragOver} handleDrop={handleDrop} dropIndicator={dropIndicator}/>
                </div>
            ))}
            {dropIndicator?.parentId === parentId && dropIndicator.index === children.length && <DropIndicator />}
            {children.length === 0 && <div className="min-h-[60px] flex items-center justify-center text-xs text-gray-400 border-2 border-dashed border-gray-300 rounded-md">Drag elements here</div>}
        </>
    );
    const renderTextContent = () => (
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onBlur={handleContentBlur}
          dangerouslySetInnerHTML={{ __html: element.content }}
        />
    );
    const renderComponent = () => {
        const dropProps = {
            onDragOver: (e: React.DragEvent) => handleDragOver(e, element.id),
            onDrop: handleDropOnElement
        };
        switch (element.type) {
            case 'section':
            case 'box':
                if (element.name === 'Hero Slide') {
                    return <HeroSlideComponent element={element} props={props} dropProps={dropProps} renderChildren={renderChildren} />;
                }
            case 'card':
            case 'preview-card':
            case 'detail-card':
            case 'feature-grid':
                return <section {...props} {...dropProps}>{renderChildren(element.children || [], element.id)}</section>;
            case 'hero': return <HeroComponent element={element} props={props} dropProps={dropProps} renderChildren={renderChildren} />;
            case 'horizontal-scroll': return <HorizontalScrollComponent element={element} props={props} dropProps={dropProps} renderChildren={renderChildren} />;
            case 'auto-scroll': return <AutoScrollComponent element={element} props={props} dropProps={dropProps} screenSize={screenSize} handleDragOver={handleDragOver} handleDrop={handleDrop} dropIndicator={dropIndicator} selectedElementId={state.selectedElementId}/>;
            case 'single-auto-scroll': return <SingleAutoScrollComponent element={element} props={props} dropProps={dropProps} selectedElementId={state.selectedElementId} />;
            case 'image-carousel': return <ImageCarouselComponent element={element} props={props} dropProps={dropProps} />;
            case 'hero-slider': return <HeroSliderComponent element={element} props={props} dropProps={dropProps} selectedElementId={state.selectedElementId} />;
            case 'accordion': return <AccordionComponent element={element} props={props} dropProps={dropProps} renderChildren={renderChildren} />;
            case 'feature-block': return <FeatureBlockComponent element={element} props={props}/>;
            case 'steps': return <StepsComponent element={element} props={props} dropProps={dropProps} renderChildren={renderChildren} />;
            case 'step-block': return <StepBlockComponent element={element} props={props} dropProps={dropProps} renderChildren={renderChildren} />;
            case 'step-connector': return <div {...props} />;
            case 'testimonial': return <TestimonialComponent element={element} props={props}/>;
            case 'faq': return <FaqComponent element={element} props={props} />;
            case 'profile-card': {
                return (
                    <div {...props} {...dropProps}>
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
                    <section {...props} {...dropProps}>
                        <div className="flex-1 min-h-[100px]" onDragOver={(e) => handleDragOver(e, element.id)} onDrop={(e) => handleDrop(e, element.id, dropIndicator?.index ?? (element.children || []).length)}>
                            {renderChildren(element.children || [], element.id)}
                        </div>
                        <div className="flex-1 min-h-[250px]">
                            <RenderElement element={videoElement} screenSize={screenSize} handleDragOver={e => e.preventDefault()} handleDrop={handleDropOnElement} dropIndicator={null} />
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
                    <section {...props} {...dropProps}>
                        <div className="flex-1 min-h-[250px]">
                            <RenderElement element={videoElement} screenSize={screenSize} handleDragOver={e => e.preventDefault()} handleDrop={handleDropOnElement} dropIndicator={null} />
                        </div>
                        <div className="flex-1 min-h-[100px]" onDragOver={(e) => handleDragOver(e, element.id)} onDrop={(e) => handleDrop(e, element.id, dropIndicator?.index ?? (element.children || []).length)}>
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
                    <section {...props} {...dropProps}>
                        <div className="flex-1 min-h-[100px]" onDragOver={(e) => handleDragOver(e, element.id)} onDrop={(e) => handleDrop(e, element.id, dropIndicator?.index ?? (element.children || []).length)}>
                            {renderChildren(element.children || [], element.id)}
                        </div>
                        <div className="flex-1 flex min-h-[250px]">
                            <RenderElement element={imageElement} screenSize={screenSize} handleDragOver={e => e.preventDefault()} handleDrop={handleDropOnElement} dropIndicator={null} />
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
                    <section {...props} {...dropProps}>
                        <div className="flex-1 flex min-h-[250px]">
                            <RenderElement element={imageElement} screenSize={screenSize} handleDragOver={e => e.preventDefault()} handleDrop={handleDropOnElement} dropIndicator={null} />
                        </div>
                        <div className="flex-1 min-h-[100px]" onDragOver={(e) => handleDragOver(e, element.id)} onDrop={(e) => handleDrop(e, element.id, dropIndicator?.index ?? (element.children || []).length)}>
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
                            <div key={col.id} className="flex-1" style={{ minHeight: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }} onDragOver={(e) => handleDragOver(e, col.id)} onDrop={(e) => handleDrop(e, col.id, dropIndicator?.index ?? col.children.length)}>
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
                return <div {...props} style={gridStyle}>{galleryContent.images.map((src: string, i: number) => <Image key={i} src={src} alt={`Gallery image ${i+1}`} width={1000} height={1000} style={{width: '100%', height: 'auto', borderRadius: '8px'}} />)}</div>;
            }
            case 'footer': {
                return <footer {...props} {...dropProps}>{renderChildren(element.children || [], element.id)}</footer>;
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

                // Helper to extract YouTube video ID for the 'playlist' parameter required by 'loop'
                const getYouTubeVideoId = (url: string) => {
                    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                    const match = url.match(regExp);
                    return (match && match[2].length === 11) ? match[2] : null;
                };

                const videoId = getYouTubeVideoId(url);

                const params = new URLSearchParams();
                if (autoplay) params.set('autoplay', '1');
                if (!controls) params.set('controls', '0');
                if (loop && videoId) {
                    params.set('loop', '1');
                    params.set('playlist', videoId); // YouTube's loop requires the playlist param
                }
                if (muted) params.set('mute', '1');
                if (autoplay) params.set('playsinline', '1'); // Helps with autoplay on mobile

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
            case 'image': return <Image {...props} onDrop={handleDropOnElement} src={element.content} alt="" width={1000} height={1000} />;
            case 'button': return <button {...props}>{element.content}</button>;
            default: return <div {...props} className="p-4 bg-gray-200 text-gray-800 rounded">Invalid Element: {element.type}</div>;
        }
    };
    
    return (
        <>
            <DynamicElementStyles element={element} />
            <ElementWrapper isSelected={isSelected} element={element}>
                {renderComponent()}
            </ElementWrapper>
        </>
    );
});
RenderElement.displayName = 'RenderElement';

const ElementWrapper = ({ isSelected, children, element }: { isSelected: boolean, children: React.ReactNode, element: Element }) => {
    const { dispatch } = useEditorContext();
    const dynamicClassName = `dynamic_element_${element.id.replace(/-/g, '_')}`;
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isSelected && wrapperRef.current) {
            wrapperRef.current.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }
    }, [isSelected]);

    return (
        <div 
            ref={wrapperRef}
            data-draggable="true" 
            id={element.htmlId || undefined} 
            className={`relative p-1 border-2 ${isSelected ? 'border-indigo-500' : 'border-transparent hover:border-indigo-500/50'} ${element.className || ''} ${dynamicClassName}`}
        >
            {isSelected && (
                <div className="absolute -top-7 left-0 flex items-center gap-1 bg-indigo-600 text-white px-2 py-0.5 rounded-t-md text-xs z-[100]">
                    <span className="capitalize">{element.name || element.type.replace(/-/g, ' ')}</span>
                    <button title="Duplicate" onClick={(e) => { e.stopPropagation(); dispatch({ type: 'DUPLICATE_ELEMENT', payload: { elementId: element.id } }); }} className="p-0.5 hover:bg-indigo-500 rounded"><Copy size={10} /></button>
                    <button title="Delete" onClick={(e) => { e.stopPropagation(); dispatch({ type: 'DELETE_ELEMENT', payload: { elementId: element.id } }); }} className="p-0.5 hover:bg-indigo-500 rounded"><FaTrashAlt size={10} /></button>
                </div>
            )}
            {children}
        </div>
    );
};
ElementWrapper.displayName = 'ElementWrapper';

const RichTextToolbar = ({ element }: { element: Element | null }) => {
    if (!element || !['heading', 'paragraph', 'ordered-list', 'unordered-list'].includes(element.type)) return null;

    const execCmd = (cmd: string, val?: string) => document.execCommand(cmd, false, val);
    const handleLink = () => {
        const url = prompt('Enter the URL:');
        if (url) execCmd('createLink', url);
    };

    return (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex gap-1 bg-gray-900 p-2 rounded-lg shadow-lg border border-gray-700">
            <button onClick={() => execCmd('bold')} className="p-2 hover:bg-gray-700 rounded"><FaBold /></button>
            <button onClick={() => execCmd('italic')} className="p-2 hover:bg-gray-700 rounded"><FaItalic /></button>
            <button onClick={() => execCmd('underline')} className="p-2 hover:bg-gray-700 rounded"><FaUnderline /></button>
            <button onClick={handleLink} className="p-2 hover:bg-gray-700 rounded"><FaLink /></button>
        </div>
    );
};
RichTextToolbar.displayName = 'RichTextToolbar';

const RightPanel = ({
  activePanel,
  setActivePanel,
  selectedElement,
  screenSize,
  setScreenSize,
}: {
  activePanel: 'properties' | 'history' | 'versions';
  setActivePanel: (panel: 'properties' | 'history' | 'versions') => void;
  selectedElement: Element | null;
  screenSize: 'desktop' | 'tablet' | 'mobile';
  setScreenSize: (size: 'desktop' | 'tablet' | 'mobile') => void;
}) => {
  const { state } = useEditorContext();
  const params = useParams();
  const siteId = params.siteId as string;

  return (
    <aside className="w-full md:w-80 md:flex-shrink-0 bg-gray-900 md:border-l border-gray-700 flex flex-col h-full">
      <div className="flex border-b border-gray-700 px-4">
        <button
          onClick={() => setActivePanel('properties')}
          className={`cursor-pointer flex-1 flex items-center justify-center gap-2 py-2 text-sm ${
            activePanel === 'properties'
              ? 'text-indigo-400 border-b-2 border-indigo-400'
              : 'text-gray-400'
          }`}
        >
          <Settings size={16} /> Properties
        </button>
        <button
          onClick={() => setActivePanel('history')}
          className={`cursor-pointer flex-1 flex items-center justify-center gap-2 py-2 text-sm ${
            activePanel === 'history'
              ? 'text-indigo-400 border-b-2 border-indigo-400'
              : 'text-gray-400'
          }`}
        >
          <History size={16} /> Session
        </button>
        <button
          onClick={() => setActivePanel('versions')}
          className={`cursor-pointer flex-1 flex items-center justify-center gap-2 py-2 text-sm ${
            activePanel === 'versions'
              ? 'text-indigo-400 border-b-2 border-indigo-400'
              : 'text-gray-400'
          }`}
        >
          <Clock size={16} /> Versions
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {activePanel === 'properties' &&
          (selectedElement ? (
            <ElementPropertiesPanel
              key={selectedElement.id}
              element={selectedElement}
              screenSize={screenSize}
              setScreenSize={setScreenSize}
            />
          ) : (
            <PagePropertiesPanel pageStyles={state.pageStyles} />
          ))}
        {activePanel === 'history' && (
          <HistoryPanel
            history={state.history}
            historyIndex={state.historyIndex}
          />
        )}
        {activePanel === 'versions' && <VersionHistoryPanel siteId={siteId} />}
      </div>
    </aside>
  );
};
RightPanel.displayName = 'RightPanel';

const AddChildElementProperties = ({ element }: { element: Element }) => {
    const { dispatch } = useEditorContext();

    const handleAddCard = () => {
        let newCardType: ElementType = 'preview-card';
        if (element.type === 'single-auto-scroll') newCardType = 'detail-card';
        if (element.type === 'image-carousel') newCardType = 'image';
        if (element.type === 'hero-slider') newCardType = 'hero';
        
        const newElement = createNewElement(newCardType) as Element;

        if (element.type === 'image-carousel') {
             newElement.styles = { desktop: { default: { width: '100%', height: '100%', objectFit: 'cover' }}};
        }

        dispatch({
            type: 'ADD_ELEMENT',
            payload: {
                elements: [newElement],
                parentId: element.id,
                index: element.children?.length || 0
            }
        });
    };

    const getButtonLabel = () => {
        if (['image-carousel', 'hero-slider'].includes(element.type)) return 'Add Slide';
        if (element.type === 'accordion') return 'Add Accordion Item';
        return 'Add Card';
    }

    return (
        <div>
            <button
                onClick={handleAddCard}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 py-2 rounded-md hover:bg-indigo-500"
            >
                <FaPlus size={12} /> {getButtonLabel()}
            </button>
        </div>
    );
};
AddChildElementProperties.displayName = 'AddChildElementProperties';


const ElementPropertiesPanel = ({ element, screenSize, setScreenSize }: { element: Element; screenSize: 'desktop' | 'tablet' | 'mobile', setScreenSize: (size: 'desktop' | 'tablet' | 'mobile') => void }) => {
  const { dispatch } = useEditorContext();
  const [styleState, setStyleState] = useState<'default' | 'hover'>('default');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleStyleChange = (key: string, value: string | number) => {
    dispatch({ type: 'UPDATE_ELEMENT_STYLES', payload: { elementId: element.id, styles: { [key]: value }, breakpoint: screenSize, state: styleState } });
  };

  const handleContentChange = (newContent: object) => {
    dispatch({ type: 'UPDATE_ELEMENT_CONTENT', payload: {elementId: element.id, content: JSON.stringify(newContent, null, 2)} });
  }

  const handleGenerateContent = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    const newContent = await generateContentWithGemini(aiPrompt);
    dispatch({ type: 'UPDATE_ELEMENT_CONTENT', payload: { elementId: element.id, content: `<p>${newContent}</p>` } });
    dispatch({ type: 'ADD_HISTORY' });
    setIsGenerating(false);
    setAiPrompt('');
  };

  const currentStyles = element.styles?.[screenSize]?.[styleState] || {};

  const renderContentInputs = () => {
    if (['card', 'preview-card', 'detail-card', 'profile-card'].includes(element.type)) {
        const handleAddChild = () => {
            const newElement = createNewElement('paragraph') as Element;
            dispatch({
                type: 'ADD_ELEMENT',
                payload: {
                    elements: [newElement],
                    parentId: element.id,
                    index: element.children?.length || 0
                }
            });
        };

        return (
            <>
                <p className="text-xs text-gray-400 mb-4">Manage the content inside this card. You can add new elements or select existing ones to edit.</p>
                <button
                    onClick={handleAddChild}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 py-2 rounded-md hover:bg-indigo-500 text-sm mb-4"
                >
                    <FaPlus size={12} /> Add Element to Card
                </button>
                <ChildElementSelector element={element} />
            </>
        );
    }

    if (['image', 'button'].includes(element.type)) {
        return <StyleInput label="URL / Text" value={element.content} onChange={val => dispatch({type: 'UPDATE_ELEMENT_CONTENT', payload: {elementId: element.id, content: val}})}/>;
    }

    if (element.type === 'video') {
        try {
            const videoContent = JSON.parse(element.content);
            return <VideoProperties content={videoContent} onContentChange={handleContentChange} />;
        } catch (e) {
            const videoContent = { url: element.content, autoplay: false, controls: true, loop: false, muted: false };
            return <VideoProperties content={videoContent} onContentChange={handleContentChange} />;
        }
    }
    
    if (['horizontal-scroll', 'image-carousel', 'hero-slider'].includes(element.type)) {
        const content = JSON.parse(element.content || '{}');
        return (
            <>
                <AddChildElementProperties element={element} />
                { (element.type === 'image-carousel' || element.type === 'hero-slider') &&
                    <div className='mt-2'>
                        <SliderDelayProperties content={content} onContentChange={handleContentChange} />
                    </div>
                }
            </>
        );
    }

    if (element.content) {
        try {
            const content = JSON.parse(element.content);

            if (element.name === 'Hero Slide') {
                return <HeroSlideProperties element={element} content={content} onContentChange={handleContentChange} />;
            }

            if (element.type === 'auto-scroll') {
                return <>
                    <AddChildElementProperties element={element} />
                    <div className="mt-4"><AutoScrollProperties content={content} onContentChange={handleContentChange} /></div>
                </>;
            }

            if (element.type === 'single-auto-scroll') {
                return <>
                    <AddChildElementProperties element={element} />
                    <div className="mt-4"><SingleAutoScrollProperties element={element} content={content} onContentChange={handleContentChange} /></div>
                </>;
            }

            if (typeof content === 'object' && content !== null) {
                const contentPanelMap: Record<string, React.ReactNode> = {
                    hero: <HeroProperties element={element} content={content} onContentChange={handleContentChange} />,
                    accordion: <AccordionProperties content={content} onContentChange={handleContentChange} />,
                    navbar: <NavbarProperties content={content} onContentChange={handleContentChange} />,
                    columns: <ColumnsProperties element={element} content={content} onContentChange={handleContentChange} />,
                    gallery: <GalleryProperties content={content} onContentChange={handleContentChange} />,
                    steps: <StepsProperties element={element} />,
                    "right-image-section": <SplitSectionProperties element={element} content={content} onContentChange={handleContentChange} />,
                    "left-image-section": <SplitSectionProperties element={element} content={content} onContentChange={handleContentChange} />,
                    "video-right-section": <SplitSectionProperties element={element} content={content} onContentChange={handleContentChange} />,
                    "video-left-section": <SplitSectionProperties element={element} content={content} onContentChange={handleContentChange} />,
                    "profile-card": <ProfileCardProperties element={element} />,
                    "testimonial": <TestimonialProperties content={content} onContentChange={handleContentChange} />,
                    "faq": <FaqProperties content={content} onContentChange={handleContentChange} />,
                    "feature-grid": <FeatureGridProperties element={element} content={content} onContentChange={handleContentChange} />,
                    "feature-block": <FeatureBlockProperties content={content} onContentChange={handleContentChange} />,
                    "step-block": <StepBlockProperties element={element} />,
                    "contact-form": <ContactFormProperties content={content} onContentChange={handleContentChange} />,
                };
                return contentPanelMap[element.type] || null;
            }
        } catch (e) {
        }
    }

    return null;
 };

  return (
    <div>
      <h3 className="font-bold mb-2 capitalize">{element.name || element.type.replace(/-/g, ' ')} Properties</h3>

      <div className="flex items-center gap-1 bg-gray-800 p-1 rounded-lg mb-4">
        {([ 'desktop', 'tablet', 'mobile' ] as const).map(size => (
          <button key={size} onClick={() => setScreenSize(size)} className={`cursor-pointer flex-1 p-2 rounded-md transition-colors text-xs ${screenSize === size ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700'}`} title={`${size.charAt(0).toUpperCase() + size.slice(1)} View`}>
            {size === 'desktop' && <FaDesktop />}
            {size === 'tablet' && <FaTabletAlt />}
            {size === 'mobile' && <FaMobileAlt />}
          </button>
        ))}
      </div>

      <div className="flex border-b-2 border-gray-700 mb-4">
        <button onClick={() => setStyleState('default')} className={`flex-1 py-1 text-sm ${styleState === 'default' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400'}`}>Default</button>
        <button onClick={() => setStyleState('hover')} className={`flex-1 py-1 text-sm ${styleState === 'hover' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400'}`}>Hover</button>
      </div>

      {['heading', 'paragraph'].includes(element.type) && (
        <CollapsibleGroup title="AI Content" open>
          <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="e.g., a catchy headline for a portfolio" className="w-full bg-gray-700 rounded-md p-2 text-sm h-20 mb-2" />
          <button onClick={handleGenerateContent} disabled={isGenerating} className="w-full flex items-center justify-center gap-2 bg-indigo-600 py-2 rounded-md hover:bg-indigo-500 disabled:bg-gray-500">
            <Sparkles size={16} />{isGenerating ? 'Generating...' : 'Generate with AI'}
          </button>
        </CollapsibleGroup>
      )}

      <CollapsibleGroup title="Content" open>{renderContentInputs()}</CollapsibleGroup>

        {['image', 'video', 'preview-card', 'detail-card', 'profile-card', 'card'].includes(element.type) && (
            <CollapsibleGroup title="Arrange" open>
                <WrapInColumnsProperties elementId={element.id} />
                <p className="text-xs text-gray-400 mt-2">This will wrap the current element in a new 2-column layout to add content next to it.</p>
            </CollapsibleGroup>
        )}

        <CollapsibleGroup title="Attributes & ID">
        <StyleInput label="HTML ID" value={element.htmlId || ''} onChange={val => dispatch({ type: 'UPDATE_ELEMENT_ATTRIBUTE', payload: { elementId: element.id, attribute: 'htmlId', value: val }})} />
        <StyleInput label="Custom Classes" value={element.className || ''} onChange={val => dispatch({ type: 'UPDATE_ELEMENT_ATTRIBUTE', payload: { elementId: element.id, attribute: 'className', value: val }})} />
      </CollapsibleGroup>

      <CollapsibleGroup title="Layout & Display">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs text-gray-400">Visible</label>
          <input type="checkbox" className="toggle-checkbox" checked={currentStyles.display !== 'none'} onChange={e => handleStyleChange('display', e.target.checked ? '' : 'none')} />
        </div>
        <StyleInput label="Display" type="select" value={currentStyles.display || ''} onChange={val => handleStyleChange('display', val)} options={['block', 'inline-block', 'flex', 'grid', 'inline', 'none'].map(v => ({label: v, value: v}))}/>
        <StyleInput label="Position" type="select" value={currentStyles.position || ''} onChange={val => handleStyleChange('position', val)} options={['static', 'relative', 'absolute', 'fixed', 'sticky'].map(v => ({label: v, value: v}))}/>
        <div className="grid grid-cols-2 gap-2">
          <StyleInput label="Top" value={currentStyles.top || ''} onChange={val => handleStyleChange('top', val)} />
          <StyleInput label="Right" value={currentStyles.right || ''} onChange={val => handleStyleChange('right', val)} />
          <StyleInput label="Bottom" value={currentStyles.bottom || ''} onChange={val => handleStyleChange('bottom', val)} />
          <StyleInput label="Left" value={currentStyles.left || ''} onChange={val => handleStyleChange('left', val)} />
        </div>
        <StyleInput label="Z-Index" type="number" value={currentStyles.zIndex || ''} onChange={val => handleStyleChange('zIndex', val)} />
        <StyleInput label="Flex Direction" value={currentStyles.flexDirection || ''} onChange={val => handleStyleChange('flexDirection', val)} />
        <StyleInput label="Justify Content" value={currentStyles.justifyContent || ''} onChange={val => handleStyleChange('justifyContent', val)} />
        <StyleInput label="Align Items" value={currentStyles.alignItems || ''} onChange={val => handleStyleChange('alignItems', val)} />
        <StyleInput label="Align Self" type="select" value={currentStyles.alignSelf || ''} onChange={val => handleStyleChange('alignSelf', val)} options={['auto', 'flex-start', 'flex-end', 'center', 'stretch'].map(v => ({label:v, value:v}))}/>
        <StyleInput label="Overflow" value={currentStyles.overflow || ''} onChange={val => handleStyleChange('overflow', val)} />
      </CollapsibleGroup>

      <CollapsibleGroup title="Box Model & Spacing">
        <StyleInput label="Width" value={currentStyles.width || ''} onChange={val => handleStyleChange('width', val)} />
        <StyleInput label="Height" value={currentStyles.height || ''} onChange={val => handleStyleChange('height', val)} />
        <div className="grid grid-cols-2 gap-2">
          <StyleInput label="Min-W" value={currentStyles.minWidth || ''} onChange={val => handleStyleChange('minWidth', val)} />
          <StyleInput label="Min-H" value={currentStyles.minHeight || ''} onChange={val => handleStyleChange('minHeight', val)} />
          <StyleInput label="Max-W" value={currentStyles.maxWidth || ''} onChange={val => handleStyleChange('maxWidth', val)} />
          <StyleInput label="Max-H" value={currentStyles.maxHeight || ''} onChange={val => handleStyleChange('maxHeight', val)} />
        </div>
        <StyleInput label="Padding" value={currentStyles.padding || ''} onChange={val => handleStyleChange('padding', val)} />
        <StyleInput label="Margin" value={currentStyles.margin || ''} onChange={val => handleStyleChange('margin', val)} />
        <StyleInput label="Gap" value={currentStyles.gap || ''} onChange={val => handleStyleChange('gap', val)} />
      </CollapsibleGroup>

      <CollapsibleGroup title="Typography">
        <StyleInput label="Font Family" value={currentStyles.fontFamily || ''} onChange={val => handleStyleChange('fontFamily', val)} />
        <StyleInput label="Font Size" value={currentStyles.fontSize || ''} onChange={val => handleStyleChange('fontSize', val)} />
        <StyleInput label="Font Weight" value={currentStyles.fontWeight || ''} onChange={val => handleStyleChange('fontWeight', val)} />
        <StyleInput label="Line Height" value={currentStyles.lineHeight || ''} onChange={val => handleStyleChange('lineHeight', val)} />
        <StyleInput label="Letter Spacing" value={currentStyles.letterSpacing || ''} onChange={val => handleStyleChange('letterSpacing', val)} />
        <StyleInput label="Text Align" type="select" value={currentStyles.textAlign || ''} onChange={val => handleStyleChange('textAlign', val)} options={[{label: 'Left', value: 'left'}, {label: 'Center', value: 'center'}, {label: 'Right', value: 'right'}]} />
        <StyleInput label="Text Decoration" value={currentStyles.textDecoration || ''} onChange={val => handleStyleChange('textDecoration', val)} />
        <StyleInput label="Text Transform" value={currentStyles.textTransform || ''} onChange={val => handleStyleChange('textTransform', val)} />
        <StyleInput label="Color" type="color" value={currentStyles.color || ''} onChange={val => handleStyleChange('color', val)} />
        {['ordered-list', 'unordered-list'].includes(element.type) &&
          <StyleInput label="List Style Type" type="select" value={currentStyles.listStyleType || ''} onChange={(val:string) => handleStyleChange('listStyleType', val)} options={['disc', 'circle', 'square', 'decimal', 'lower-alpha', 'upper-alpha', 'none'].map(v => ({label:v, value:v}))}/>
        }
      </CollapsibleGroup>

      <CollapsibleGroup title="Visual & Effects">
        <StyleInput label="Background" value={currentStyles.background || ''} onChange={val => handleStyleChange('background', val)} />
          <p className="text-yellow-300 text-[9px]">
            💡 Tip: To set a background image, enter the full image URL in this format: <code>url("https://example.com/image.jpg")</code>
          </p>
        <StyleInput label="Opacity" type="number" value={currentStyles.opacity || ''} onChange={val => handleStyleChange('opacity', val)} />
        <StyleInput label="Border" value={currentStyles.border || ''} onChange={val => handleStyleChange('border', val)} placeholder="e.g., 2px solid #4f46e5" />
        <StyleInput label="Border Radius" value={currentStyles.borderRadius || ''} onChange={val => handleStyleChange('borderRadius', val)} placeholder="e.g., 12px" />
        <StyleInput label="Box Shadow" value={currentStyles.boxShadow || ''} onChange={val => handleStyleChange('boxShadow', val)} placeholder="e.g., 0 10px 15px -3px #0000001a" />
        <StyleInput label="Transition" value={currentStyles.transition || ''} onChange={val => handleStyleChange('transition', val)} placeholder="e.g., all 0.3s ease" />
      </CollapsibleGroup>
       <div className="mt-4">
          <button
              onClick={() => dispatch({ type: 'DELETE_ELEMENT', payload: { elementId: element.id } })}
              className="w-full flex items-center justify-center gap-2 bg-red-600/20 text-red-400 py-2 rounded-md hover:bg-red-600/30"
          >
              <FaTrashAlt size={12} /> Delete Element
          </button>
      </div>
    </div>
  );
};
ElementPropertiesPanel.displayName = 'ElementPropertiesPanel';

const PagePropertiesPanel = ({ pageStyles }: { pageStyles: PageStyles }) => {
    const { dispatch } = useEditorContext();
    const handleStyleChange = (key: string, value: any) => {
        dispatch({ type: 'SET_PAGE_STYLES', payload: { [key]: value } });
    };
    return (
        <div>
            <h3 className="font-bold mb-4">Page Properties</h3>
            <CollapsibleGroup title="Global Styles" open={true}>
                <StyleInput label="Background Color" type="color" value={pageStyles.backgroundColor} onChange={(val: string) => handleStyleChange('backgroundColor', val)} />
                <StyleInput label="Default Text Color" type="color" value={pageStyles.color} onChange={(val: string) => handleStyleChange('color', val)} />
                <StyleInput label="Font Family" value={pageStyles.fontFamily} onChange={(val: string) => handleStyleChange('fontFamily', val)} />
            </CollapsibleGroup>
            <GlobalCssPanel />
            <CollapsibleGroup title="Design System" open>
                <h4 className="text-sm font-bold mb-2">Global Colors</h4>
                {pageStyles.globalColors?.map((color, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                        <input type="text" value={color.name} onChange={e => { const newColors = [...pageStyles.globalColors!]; newColors[index].name = e.target.value; handleStyleChange('globalColors', newColors)}} className="flex-1 bg-gray-700 rounded px-2 py-1 text-xs"/>
                        <input type="color" value={color.value} onChange={e => { const newColors = [...pageStyles.globalColors!]; newColors[index].value = e.target.value; handleStyleChange('globalColors', newColors)}} className="w-8 h-8 p-0 border-none rounded"/>
                    </div>
                ))}
            </CollapsibleGroup>
        </div>
    );
};
PagePropertiesPanel.displayName = 'PagePropertiesPanel';

const HistoryPanel = ({ history, historyIndex }: { history: { timestamp: number }[], historyIndex: number }) => {
    const { dispatch } = useEditorContext();
    return (
        <div className="space-y-2">
            {history.length > 0 ? history.slice().reverse().map((entry, i) => {
                const index = history.length - 1 - i;
                return (
                    <button key={entry.timestamp} onClick={() => index !== historyIndex && dispatch({ type: index < historyIndex ? 'UNDO' : 'REDO' })} className={`w-full text-left p-2 rounded-md transition-colors ${index === historyIndex ? 'bg-indigo-600' : 'bg-gray-800 hover:bg-gray-700'}`}>
                        <span className="text-sm font-medium">{index === historyIndex ? 'Current' : `Version ${index}`}</span>
                        <span className="block text-xs text-gray-400">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                    </button>
                )
            }) : <p className="text-sm text-gray-400">No history yet. Start editing to see changes.</p>}
        </div>
    );
};
HistoryPanel.displayName = 'HistoryPanel';

const VersionHistoryPanel = ({ siteId }: { siteId: string }) => {
    const { dispatch } = useEditorContext();
    const { data, error, isLoading } = useSWR(`/api/sites/${siteId}/history`, () => apiClient.getHistory(siteId));
    const [revertVersion, setRevertVersion] = useState<any>(null);

    const handleRevert = (version: any) => {
        setRevertVersion(version);
    };

    const confirmRevert = () => {
        if (revertVersion) {
            dispatch({ type: 'REVERT_TO_VERSION', payload: { content: revertVersion.content, pageStyles: revertVersion.pageStyles } });
            setRevertVersion(null);
        }
    };

    if (isLoading) return <p>Loading versions...</p>;
    if (error) return <p>Failed to load versions.</p>;

    return (
        <div className="space-y-2">
            {data?.history.length ? data.history.map((version: any) => (
                <div key={version.id} className=" p-2 rounded-md bg-gray-800">
                    <p className="text-sm font-medium">
                        {version.versionName || `${version.id}`}
                    </p>
                    <div className='flex items-center justify-between'>
                        <p className="text-sm font-medium text-gray-400">
                            {new Date(version.savedAt._seconds * 1000).toLocaleString()}
                        </p>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => handleRevert(version)}
                                title="Revert to this version"
                                className="cursor-pointer p-1.5 text-indigo-400 rounded-md hover:bg-gray-700 transition-colors"
                            >
                                <Undo2 size={20} />
                            </button>

                            <a
                                href={`/version-preview/${siteId}?version=${version.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Preview this version"
                                className="p-1.5 text-teal-400 rounded-md hover:bg-gray-700 transition-colors"
                            >
                                <Eye size={20} />
                            </a>
                        </div>
                    </div>
                </div>
            )) : <p className="text-sm text-gray-400">No saved versions yet.</p>}
            <ConfirmationModal 
                isOpen={!!revertVersion}
                onClose={() => setRevertVersion(null)}
                onConfirm={confirmRevert}
                title="Revert Version?"
                message="Are you sure you want to revert to this version? Your current draft will be overwritten."
            />
        </div>
    );
};
VersionHistoryPanel.displayName = 'VersionHistoryPanel';

const NavbarProperties = ({ content, onContentChange }: { content: any; onContentChange: (c: any) => void }) => {
    const handleLinkChange = (index: number, field: string, value: any) => {
        const newLinks = produce(content.links, draft => {
            draft[index][field] = value;
        });
        onContentChange({ ...content, links: newLinks });
    };

    const handleStyleChange = (key: string, value: string) => {
        onContentChange(produce(content, draft => {
            if (!draft.styles) draft.styles = {};
            draft.styles[key] = value;
        }));
    };

    const handleCtaStyleChange = (key: string, value: string) => {
        onContentChange(produce(content, draft => {
            if (!draft.cta.styles) draft.cta.styles = {};
            draft.cta.styles[key] = value;
        }));
    };

    return (
        <>
            <CollapsibleGroup title="Logo" open>
                <StyleInput label="Logo Type" type="select" value={content.logo.type} onChange={val => onContentChange({ ...content, logo: { ...content.logo, type: val } })} options={[{ label: 'Image', value: 'image' }, { label: 'Text', value: 'text' }]} />
                {content.logo.type === 'image' ? <StyleInput label="Logo URL" value={content.logo.src} onChange={val => onContentChange({ ...content, logo: { ...content.logo, src: val } })} /> : <StyleInput label="Logo Text" value={content.logo.text} onChange={val => onContentChange({ ...content, logo: { ...content.logo, text: val } })} />}
            </CollapsibleGroup>
            <CollapsibleGroup title="Positioning" open>
              <StyleInput
                  label="Position"
                  type="select"
                  value={content.position || 'static'}
                  onChange={val => onContentChange({ ...content, position: val })}
                  options={['static', 'relative', 'absolute', 'fixed', 'sticky'].map(v => ({ label: v.charAt(0).toUpperCase() + v.slice(1), value: v }))}
              />
              <StyleInput
                  label="Top Offset"
                  value={content.top || '0px'}
                  onChange={val => onContentChange({ ...content, top: val })}
                  placeholder="e.g., 0px, 1rem"
              />
            </CollapsibleGroup>
            <StyleInput 
                label="Links Position" 
                type="select" 
                value={content.linksPosition || 'right'} 
                onChange={val => onContentChange({ ...content, linksPosition: val })} 
                options={[{ label: 'Left', value: 'left' }, { label: 'Center', value: 'center' }, { label: 'Right', value: 'right' }]} 
            />

            <CollapsibleGroup title="Links" open>
                {content.links.map((link: { id: string, label: string, href: string }, index: number) => (
                    <div key={link.id} className="flex flex-col gap-1 bg-[#445671] mb-3 p-2 rounded-md">
                      <button onClick={() => { const newLinks = content.links.filter((_: any, i: number) => i !== index); onContentChange({ ...content, links: newLinks }) }} className="cursor-pointer p-1 text-xs text-red-400 self-end"><FaTrashAlt className="inline mr-1" size={12} /></button>
                        <StyleInput label="Label" value={link.label} onChange={val => handleLinkChange(index, 'label', val)} />
                        <StyleInput label="URL" value={link.href} onChange={val => handleLinkChange(index, 'href', val)} />
                    </div>
                ))}
                <button onClick={() => onContentChange({ ...content, links: [...content.links, { id: getUniqueId('link'), label: 'New Link', href: '#' }] })} className="cursor-pointer text-indigo-400 text-sm mt-2 flex items-center gap-1"><FaPlus size={10} /> Add Link</button>
            </CollapsibleGroup>

            <CollapsibleGroup title="Link Styles">
                <StyleInput label="Font Size" value={content.styles?.fontSize || '16px'} onChange={val => handleStyleChange('fontSize', val)} />
                <StyleInput label="Font Color" type="color" value={content.styles?.color || '#111827'} onChange={val => handleStyleChange('color', val)} />
                <StyleInput label="Hover Animation" type="select" value={content.styles?.hoverAnimation || 'underline'} onChange={val => handleStyleChange('hoverAnimation', val)} options={[{label: 'Underline', value: 'underline'}, {label: 'Grow', value: 'grow'}, {label: 'Shrink', value: 'shrink'}, {label: 'None', value: 'none'}]} />
                <StyleInput label="Hover Color" type="color" value={content.styles?.hoverColor || '#4f46e5'} onChange={val => handleStyleChange('hoverColor', val)} />
            </CollapsibleGroup>
            
            <CollapsibleGroup title="CTA Button">
                <label className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                    <input type="checkbox" checked={content.cta.enabled} onChange={e => onContentChange({ ...content, cta: { ...content.cta, enabled: e.target.checked } })} /> Enable CTA
                </label>
                {content.cta.enabled && <>
                    <StyleInput label="CTA Label" value={content.cta.label} onChange={(val: string) => onContentChange({ ...content, cta: { ...content.cta, label: val } })} />
                    <StyleInput label="CTA URL" value={content.cta.href} onChange={(val: string) => onContentChange({ ...content, cta: { ...content.cta, href: val } })} />
                    <StyleInput label="Background Color" type="color" value={content.cta.styles?.backgroundColor || '#4f46e5'} onChange={val => handleCtaStyleChange('backgroundColor', val)} />
                    <StyleInput label="Text Color" type="color" value={content.cta.styles?.color || '#ffffff'} onChange={val => handleCtaStyleChange('color', val)} />
                    <StyleInput label="Border Radius" value={content.cta.styles?.borderRadius || '8px'} onChange={val => handleCtaStyleChange('borderRadius', val)} />
                </>}
            </CollapsibleGroup>
        </>
    );
};
NavbarProperties.displayName = 'NavbarProperties';

const GalleryProperties = ({ content, onContentChange }: { content: any; onContentChange: (c: any) => void }) => (<> <StyleInput label="Columns" type="number" value={content.columns} onChange={val => onContentChange({...content, columns: Number(val)})} /> <h4 className="text-sm font-bold mt-4 mb-2">Images</h4> {content.images.map((img: string, index: number) => (<div key={index} className="flex gap-2 items-center mb-2 p-2 bg-gray-700 rounded-md"> <input type="text" placeholder="Image URL" value={img} onChange={e => { const newImages = [...content.images]; newImages[index] = e.target.value; onContentChange({...content, images: newImages});}} className="flex-1 bg-gray-600 rounded px-2 py-1"/> <button onClick={() => { const newImages = content.images.filter((_:any, i:number) => i !== index); onContentChange({...content, images: newImages})}} className="p-1 hover:bg-red-500 rounded"><FaTrashAlt size={12}/></button> </div> ))} <button onClick={() => onContentChange({...content, images: [...content.images, 'https://images.unsplash.com/photo-1553095066-5014bc7b7f2d?q=80&w=800&auto=format&fit=crop']})} className="text-indigo-400 text-sm mt-2 flex items-center gap-1"><FaPlus size={10}/> Add Image</button> </>);
const ProfileCardProperties = ({ element }: { element: Element }) => (
    <>
        <p className="text-xs text-gray-400 mb-2">
            To edit the image or text, select the element directly on the canvas or from the "Child Elements" list below.
        </p>
        <ChildElementSelector element={element} />
    </>
);
const ColumnsProperties = ({ element, content, onContentChange }: { element: Element, content: any, onContentChange: (c:any)=>void}) => {
    const handleColumnCountChange = (count: number) => {
        const newColumns = Array.from({ length: count }, (_, i) => {
            return content.columns[i] || { id: `col-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`, children: [] };
        });
        onContentChange({ ...content, columns: newColumns });
    };
    return <StyleInput label="Number of Columns" type="select" value={content.columns.length} onChange={val => handleColumnCountChange(Number(val))} options={[1,2,3,4].map(v => ({label: `${v} Column${v>1?'s':''}`, value: v}))} />
};


export const AILayoutGeneratorModal = ({
  isOpen,
  onClose,
  onGenerate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (elements: Element[]) => void;
}) => {
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const availableElements: ElementType[] = [
    'navbar', 'hero', 'right-image-section', 'left-image-section',
    'feature-grid', 'steps', 'gallery', 'testimonial', 'contact-form', 'footer'
  ];

  const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
    const base64EncodedData = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: base64EncodedData, mimeType: file.type },
    };
  };

const generateElementFromAI = (componentData: { type: ElementType; content: any }): Element | Element[] | null => {
    const { type, content } = componentData;

    const baseElementOrArray = createNewElement(type);
    if (!baseElementOrArray) return null;

    const baseElement = Array.isArray(baseElementOrArray) ? baseElementOrArray[0] : baseElementOrArray;

    const hydratedElement = produce(baseElement, draft => {
        switch (draft.type) {
            case 'navbar': {
                const navContent = JSON.parse(draft.content);
                navContent.logo.text = content.logoText || navContent.logo.text;
                navContent.logo.type = 'text';
                if (content.links) {
                    navContent.links = content.links.map((label: string) => ({ id: getUniqueId('link'), label, href: '#' }));
                }
                navContent.cta.label = content.ctaButton || navContent.cta.label;
                draft.content = JSON.stringify(navContent, null, 2);
                break;
            }
            case 'hero': {
                if (draft.children) {
                    if (content.heading) draft.children[0].content = `<h1>${content.heading}</h1>`;
                    if (content.subheading) draft.children[1].content = `<p>${content.subheading}</p>`;
                    if (content.ctaButton) draft.children[2].content = content.ctaButton;
                }
                if (content.imageUrl) {
                    const heroContent = JSON.parse(draft.content);
                    heroContent.backgroundImageUrl = content.imageUrl;
                    draft.content = JSON.stringify(heroContent);
                }
                break;
            }
            case 'right-image-section':
            case 'left-image-section': {
                const headingEl = createNewElement('heading') as Element;
                headingEl.content = `<h2>${content.heading || ''}</h2>`;
                const pEl = createNewElement('paragraph') as Element;
                pEl.content = `<p>${content.paragraph || ''}</p>`;
                draft.children = [headingEl, pEl];

                if (content.imageUrl) {
                    const sectionContent = JSON.parse(draft.content);
                    sectionContent.imageSrc = content.imageUrl;
                    draft.content = JSON.stringify(sectionContent);
                }
                break;
            }
            case 'feature-grid': {
                if (content.heading && draft.children?.[0]) {
                    draft.children[0].content = `<h2>${content.heading}</h2>`;
                }
                if (content.features && Array.isArray(content.features) && draft.children?.[1]) {
                    const gridContainer = draft.children[1];
                    gridContainer.children = content.features.map((feature: any) => {
                        const featureBlock = createNewElement('feature-block') as Element;
                        featureBlock.content = JSON.stringify({
                            icon: feature.icon || 'Star',
                            title: feature.title || 'Feature',
                            text: feature.text || 'Description',
                        });
                        return featureBlock;
                    });
                }
                break;
            }
            case 'steps': {
                if (content.heading && draft.children?.[0]) draft.children[0].content = `<h2>${content.heading}</h2>`;
                if (content.steps && Array.isArray(content.steps) && draft.children?.[1]) {
                    const stepsContainer = draft.children[1];
                    stepsContainer.children = [];
                    content.steps.forEach((step: any, index: number) => {
                        const stepBlock = createNewElement('step-block') as Element;
                        if (stepBlock.children) {
                            stepBlock.children[0].content = `<p>${step.number || String(index + 1).padStart(2, '0')}</p>`;
                            stepBlock.children[1].content = `<h3>${step.title || ''}</h3>`;
                            stepBlock.children[2].content = `<p>${step.text || ''}</p>`;
                        }
                        stepsContainer.children.push(stepBlock);
                        if (index < content.steps.length - 1) {
                            stepsContainer.children.push(createNewElement('step-connector') as Element);
                        }
                    });
                }
                break;
            }
             case 'gallery': {
                const galleryContent = JSON.parse(draft.content);
                if (content.imageUrls) {
                    galleryContent.images = content.imageUrls;
                }
                draft.content = JSON.stringify(galleryContent, null, 2);
                break;
            }
            case 'testimonial': {
                const testimonialContent = JSON.parse(draft.content);
                testimonialContent.quote = content.quote || testimonialContent.quote;
                testimonialContent.name = content.name || testimonialContent.name;
                testimonialContent.title = content.title || testimonialContent.title;
                testimonialContent.avatar = `https://i.pravatar.cc/150?u=${encodeURIComponent(content.name)}`;
                draft.content = JSON.stringify(testimonialContent);
                break;
            }
            case 'contact-form': {
                const heading = createNewElement('heading') as Element;
                heading.content = `<h2>${content.heading || 'Contact Us'}</h2>`;
                const subheading = createNewElement('paragraph') as Element;
                subheading.content = `<p>${content.subheading || 'Get in touch with us.'}</p>`;
                draft.children = [heading, subheading];
                break;
            }
            case 'footer': {
                if (draft.children?.[0]) {
                     draft.children[0].content = `<p>${content.copyrightText || `© ${new Date().getFullYear()} Your Company. All rights reserved.`}</p>`;
                }
                break;
            }
        }
    });

    if (type === 'gallery' && content.heading) {
        const headingEl = createNewElement('heading') as Element;
        headingEl.content = `<h2>${content.heading}</h2>`;
        return [headingEl, hydratedElement];
    }

    return hydratedElement;
};

  const handleGenerateClick = async () => {
    if (!prompt && !file) {
      setError('Please describe your page or upload a resume.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const requestBody: { prompt: string; filePart?: any } = { prompt };

      if (file) {
        requestBody.filePart = await fileToGenerativePart(file);
      }

      const response = await fetch('/api/generate-layout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate layout from server.');
      }
      
      const aiLayoutData = data.layout;

      if (!Array.isArray(aiLayoutData)) {
        throw new Error("AI response was not in the expected format (array of components).");
      }
      
      const newElements = aiLayoutData.flatMap((componentData: any) =>
          generateElementFromAI(componentData)
      ).filter(Boolean);

      onGenerate(newElements as Element[]);
      onClose();
      
    } catch (err) {
      console.error("AI Generation Failed:", err);
      let errorMessage = "Sorry, the AI failed to generate a valid layout. Please try again.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
};

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg text-white border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Generate Page with AI</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><X size={20} /></button>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          Describe the website you want, or upload a resume to generate a personalized portfolio.
        </p>
        
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., A modern portfolio for a software engineer specializing in AI."
          className="w-full h-24 bg-gray-700 rounded-md p-3 text-sm border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          disabled={isLoading}
        />

        <div className="mt-4">
            <label className="text-sm text-gray-400">Upload Resume (Optional)</label>
            <div className="mt-1 flex items-center gap-4 p-3 bg-gray-700 rounded-md border border-gray-600">
                <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    id="resume-upload"
                    disabled={isLoading}
                />
                <label htmlFor="resume-upload" className={`px-4 py-2 text-sm rounded-md transition-colors ${isLoading ? 'bg-gray-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 cursor-pointer'}`}>
                    Choose File
                </label>
                {file ? (
                    <div className="flex items-center gap-2 text-xs overflow-hidden">
                        <span className="truncate">{file.name}</span>
                        <button onClick={clearFile} disabled={isLoading} className="text-red-400 hover:text-red-300 flex-shrink-0"><X size={14}/></button>
                    </div>
                ) : (
                    <span className="text-xs text-gray-500">No file selected.</span>
                )}
            </div>
        </div>

        {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
        
        <div className="mt-6 flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500 transition-colors text-sm" disabled={isLoading}>
            Cancel
          </button>
          <button
            onClick={handleGenerateClick}
            className="px-4 py-2 bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors text-sm flex items-center gap-2 disabled:bg-indigo-800 disabled:cursor-not-allowed"
            disabled={isLoading || (!prompt && !file)}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {isLoading ? 'Generating...' : 'Generate Layout'}
          </button>
        </div>
      </div>
    </div>
  );
};
AILayoutGeneratorModal.displayName = 'AILayoutGeneratorModal';
