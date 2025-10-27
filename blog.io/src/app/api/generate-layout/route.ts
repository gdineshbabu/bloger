import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined in environment variables");
}

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash", // Using 1.5-flash as it's great with large contexts
  generationConfig: {
    responseMimeType: "application/json",
  },
});

// Define your stock images here
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

export async function POST(req: NextRequest) {
  try {
    const { prompt, filePart } = await req.json();

    let finalPrompt = `
      You are a professional web designer AI. Your task is to generate a webpage layout based on the user's request.
      Your response MUST be a single, valid JSON object with a key "layout", which is an array of component objects.

      **CRITICAL INSTRUCTION 1: RESPONSIVE STYLES**
      Each component object in the 'layout' array MUST include a "styles" key.
      The "styles" object must contain "desktop", "tablet", and "mobile" keys.
      - "desktop": This should contain the base styles for the component.
      - "tablet" and "mobile": These should ONLY contain the styles that OVERRIDE the desktop styles for smaller screens.
      - Use common responsive patterns: adjust font sizes, change flex-direction from row to column, reduce padding, etc.
      - All CSS properties MUST be in camelCase (e.g., "backgroundColor", "fontSize").

      **CRITICAL INSTRUCTION 2: IMAGES**
      For any component that requires an image, you MUST use the key "imageUrl" (for single images) or "imageUrls" (for galleries). The value for these keys MUST be a URL chosen from the provided 'stockImageUrls' list. Select an image that best matches the context. Do NOT create image prompts.

      Here is the list of available stock images:
      "stockImageUrls": ${JSON.stringify(stockImages, null, 2)}

      Here are the expected keys for each component object:
      - { "type": "navbar", "content": { "logoText": "...", "links": ["..."], "ctaButton": "..." }, "styles": { "desktop": {...}, "tablet": {...}, "mobile": {...} } }
      - { "type": "hero", "content": { "heading": "...", "subheading": "...", "ctaButton": "...", "imageUrl": "..." }, "styles": { "desktop": {...}, "tablet": {...}, "mobile": {...} } }
      - { "type": "right-image-section", "content": { "heading": "...", "paragraph": "...", "imageUrl": "..." }, "styles": { "desktop": {...}, "tablet": {...}, "mobile": {...} } }
      - { "type": "left-image-section", "content": { "heading": "...", "paragraph": "...", "imageUrl": "..." }, "styles": { "desktop": {...}, "tablet": {...}, "mobile": {...} } }
      - { "type": "feature-grid", "content": { "heading": "...", "features": [{ "icon": "Zap", "title": "...", "text": "..." }] }, "styles": { "desktop": {...}, "tablet": {...}, "mobile": {...} } }
      - { "type": "steps", "content": { "heading": "...", "steps": [{ "number": "01", "title": "...", "text": "..." }] }, "styles": { "desktop": {...}, "tablet": {...}, "mobile": {...} } }
      - { "type": "gallery", "content": { "heading": "...", "imageUrls": ["...", "..."] }, "styles": { "desktop": {...}, "tablet": {...}, "mobile": {...} } }
      - { "type": "testimonial", "content": { "quote": "...", "name": "...", "title": "..." }, "styles": { "desktop": {...}, "tablet": {...}, "mobile": {...} } }
      - { "type": "contact-form", "content": { "heading": "...", "subheading": "..." }, "styles": { "desktop": {...}, "tablet": {...}, "mobile": {...} } }
      - { "type": "footer", "content": { "copyrightText": "...", "links": ["..."] }, "styles": { "desktop": {...}, "tablet": {...}, "mobile": {...} } }

      EXAMPLE:
      {
        "layout": [
          {
            "type": "hero",
            "content": {
              "heading": "Transform Your Photos with AI",
              "subheading": "Intelligently improve your images with our cutting-edge technology.",
              "ctaButton": "Upload a Photo",
              "imageUrl": "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=800&auto=format&fit=crop"
            },
            "styles": {
              "desktop": {
                "display": "flex",
                "flexDirection": "column",
                "alignItems": "center",
                "justifyContent": "center",
                "textAlign": "center",
                "padding": "6rem 2rem",
                "minHeight": "400px",
                "color": "#ffffff"
              },
              "tablet": {
                "display": "inline-block",
                "padding": "4rem 1rem"
              },
              "mobile": {
                "display": "inline-block",
                "padding": "3rem 1rem"
              }
            }
          },
          {
            "type": "right-image-section",
            "content": {
                "heading": "Seamless Integration",
                "paragraph": "Easily integrate our AI tools into your existing workflow.",
                "imageUrl": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800&auto=format&fit=crop"
            },
            "styles": {
                "desktop": {
                    "display": "flex",
                    "alignItems": "center",
                    "gap": "3rem",
                    "padding": "4rem 2rem"
                },
                "tablet": {
                    "display": "inline-block",
                    "gap": "2rem",
                    "padding": "3rem 1rem"
                },
                "mobile": {
                    "display": "inline-block",
                    "flexDirection": "column"
                }
            }
          }
        ]
      }

      IMPORTANT: Do NOT include any text or markdown formatting like \`\`\`json outside of the main JSON object. The entire output must be parsable JSON.
    `;

    const requestPayload: any[] = [];
    if (filePart) {
      finalPrompt += `
        \n\n**USER'S PRIMARY REQUEST:**
        Analyze the attached file. Based on it, generate the JSON for a personalized portfolio website.
        Additional context from user: "${prompt}"
      `;
      requestPayload.push(finalPrompt, filePart);
    } else {
      finalPrompt += `\n\n**USER'S PRIMARY REQUEST:**
      Now, generate the JSON for the following user request: "${prompt}"
      `;
      requestPayload.push(finalPrompt);
    }

    const result = await model.generateContent(requestPayload);
    const responseText = result.response.text();
    const layoutData = JSON.parse(responseText);

    return NextResponse.json(layoutData);

  } catch (error) {
    console.error("Error in generate-layout API route:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json({ error: `Failed to generate layout. ${errorMessage}` }, { status: 500 });
  }
}
