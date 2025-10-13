import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined in environment variables");
}

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
  },
});

export async function POST(req: NextRequest) {
  try {
    const { prompt, filePart } = await req.json();

    const availableElements = [
        'navbar', 'hero', 'right-image-section', 'left-image-section',
        'feature-grid', 'steps', 'gallery', 'testimonial', 'contact-form', 'footer'
    ];

    let finalPrompt = `
      You are a professional web designer and content creator AI. Your task is to generate a complete, structured layout for a webpage based on the user's request.
      Your response MUST be a single, valid JSON object with a key "layout", which is an array of component objects.
      Each component object must have "type" (from the available list) and "content" (an object with generated text, image prompts, etc.).

      Here are the expected "content" keys for each type:
      - navbar: { "logoText": "...", "links": ["Home", "About"], "ctaButton": "..." }
      - hero: { "heading": "...", "subheading": "...", "ctaButton": "...", "backgroundImagePrompt": "A high-quality image of..." }
      - right-image-section: { "heading": "...", "paragraph": "...", "imagePrompt": "A relevant image of..." }
      - left-image-section: { "heading": "...", "paragraph": "...", "imagePrompt": "A relevant image of..." }
      - feature-grid: { "heading": "...", "features": [{ "icon": "Zap", "title": "...", "text": "..." }] } (icon must be a valid Lucide icon name)
      - steps: { "heading": "...", "steps": [{ "number": "01", "title": "...", "text": "..." }] }
      - gallery: { "heading": "...", "imagePrompts": ["...", "..."] }
      - testimonial: { "quote": "...", "name": "...", "title": "..." }
      - contact-form: { "heading": "...", "subheading": "..." }
      - footer: { "copyrightText": "...", "links": ["Privacy Policy", "Terms"] }

      EXAMPLE:
      User request: "A landing page for a new AI photo editing app called 'EnhanceAI'."
      Your JSON response:
      {
        "layout": [
          {
            "type": "navbar",
            "content": { "logoText": "EnhanceAI", "links": ["Features", "Pricing"], "ctaButton": "Try for Free" }
          },
          {
            "type": "hero",
            "content": {
              "heading": "Transform Your Photos with AI",
              "subheading": "EnhanceAI intelligently improves your images, from simple touch-ups to stunning artistic creations.",
              "ctaButton": "Upload a Photo",
              "backgroundImagePrompt": "vibrant, abstract image representing artificial intelligence and creativity"
            }
          }
        ]
      }

      IMPORTANT: Do NOT include any text or markdown formatting like \`\`\`json outside of the main JSON object. The entire output must be parsable JSON.
      Generate creative and relevant content. For image prompts, be descriptive.
    `;

    const requestPayload: any[] = [];
    if (filePart) {
      finalPrompt += `
        \n\n**USER'S PRIMARY REQUEST:**
        Analyze the attached resume to understand the user's profession and skills.
        Generate the JSON for a personalized portfolio website.
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