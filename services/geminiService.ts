import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AspectRatio } from "../types";

// Initialize client with environment variable
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates the initial strategy and outline using the Thinking model.
 * Uses Gemini 3 Pro Preview for deep reasoning.
 */
export const generateAssetStrategy = async (keyword: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a world-class marketing strategist. 
      Analyze the keyword: "${keyword}".
      1. Identify the target audience's biggest pain points.
      2. Create a "Hormozi-style" $100M offer title.
      3. Outline a 5-chapter ebook structure that solves the pain points.
      4. Suggest 3 bonus items (checklists, calculators, etc.).
      
      Return the output as JSON.`,
      config: {
        thinkingConfig: { thinkingBudget: 16000 }, // Utilizing Thinking Mode
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subtitle: { type: Type.STRING },
            targetAudience: { type: Type.STRING },
            chapters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  brief: { type: Type.STRING }
                }
              }
            },
            bonuses: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            coverImageIdea: { type: Type.STRING, description: "A visual description for an ebook cover art" }
          }
        }
      }
    });
    
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Strategy Generation Error:", error);
    throw error;
  }
};

/**
 * Generates chapter content.
 * Uses Gemini 2.5 Flash for speed and volume, or Pro if complexity is needed.
 */
export const generateChapterContent = async (chapterTitle: string, brief: string, audience: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a comprehensive chapter for an ebook.
      Title: ${chapterTitle}
      Context/Brief: ${brief}
      Audience: ${audience}
      Style: Authoritative, actionable, and engaging. Use markdown formatting.`,
    });
    return response.text;
  } catch (error) {
    console.error("Chapter Writing Error:", error);
    return "Error generating content.";
  }
};

/**
 * Generates a quick creative title alternative using the Lite model (Low Latency).
 */
export const quickTitleBrainstorm = async (currentTitle: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite-latest', // Fast model
      contents: `Rewrite this title to be more catchy and viral: "${currentTitle}". Return only the new title text.`,
    });
    return response.text?.trim();
  } catch (error) {
    return currentTitle;
  }
};

/**
 * Generates the cover image using Imagen 4.
 */
export const generateCoverImage = async (prompt: string, aspectRatio: AspectRatio = '3:4') => {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `Professional ebook cover, minimal typography, high quality, 8k, ${prompt}`,
      config: {
        numberOfImages: 1,
        aspectRatio: aspectRatio,
        outputMimeType: 'image/jpeg'
      }
    });
    
    const base64 = response.generatedImages?.[0]?.image?.imageBytes;
    return base64 ? `data:image/jpeg;base64,${base64}` : null;
  } catch (error) {
    console.error("Image Gen Error:", error);
    throw error;
  }
};

/**
 * Edits an existing image using Nano Banana (Gemini 2.5 Flash Image).
 * Used for "Add a retro filter" type requests.
 */
export const editImageWithPrompt = async (imageBase64: string, prompt: string) => {
  try {
    // Remove data URL prefix if present for the API call, though SDK handles some formats, cleaning is safer
    const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: `Edit this image: ${prompt}. Maintain the aspect ratio and main subject but apply the requested changes.`
          }
        ]
      },
      config: {
        responseModalities: [Modality.IMAGE],
      }
    });

    // Extract the new image
    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part && part.inlineData) {
       return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;

  } catch (error) {
    console.error("Image Edit Error:", error);
    throw error;
  }
};

/**
 * Analyzes an uploaded image to extract style or content cues.
 * Uses Gemini 3 Pro Vision Capabilities.
 */
export const analyzeReferenceImage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = (reader.result as string).split(',')[1];
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: {
            parts: [
              { inlineData: { mimeType: file.type, data: base64Data } },
              { text: "Describe the artistic style, color palette, and mood of this image in detail. This will be used to generate a similar style ebook cover." }
            ]
          }
        });
        resolve(response.text || "");
      } catch (e) {
        reject(e);
      }
    };
    reader.readAsDataURL(file);
  });
};
