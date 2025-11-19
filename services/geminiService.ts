
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AspectRatio, ValueStack } from "../types";

// Initialize client with environment variable
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * STEP 1, 2 & 3: Market Research & Hormozi Offer
 * Uses Gemini 3 Pro with Thinking Budget for deep analysis.
 */
export const performMarketResearch = async (keyword: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `
        Step 1: Pain Points Analysis
        List 10 specific pain points people have with "${keyword}".
        
        Step 2: Solutions Generation
        For each of these pain points, provide one concise solution.
        
        Step 3: $100M Offer Creation (Alex Hormozi Framework)
        Create a compelling offer using Alex Hormozi's framework for "${keyword}":
        - Dream Outcome: What they'll achieve
        - Perceived Likelihood: Why it works
        - Time Delay: How fast
        - Effort & Sacrifice: How easy
        
        Return the output as JSON.
      `,
      config: {
        // Reduce thinking budget to reserve tokens for the large JSON output
        thinkingConfig: { thinkingBudget: 2048 },
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            solutions: { type: Type.ARRAY, items: { type: Type.STRING } },
            hormoziOffer: {
              type: Type.OBJECT,
              properties: {
                dreamOutcome: { type: Type.STRING },
                perceivedLikelihood: { type: Type.STRING },
                timeDelay: { type: Type.STRING },
                effortSacrifice: { type: Type.STRING }
              }
            }
          }
        }
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("No response from Market Research");
    return JSON.parse(text);
  } catch (error) {
    console.error("Market Research Error:", error);
    throw error;
  }
};

/**
 * STEP 4 & 5: Title & Outline
 * Uses the research context to build the structure.
 */
export const generateTitleAndOutline = async (keyword: string, researchData: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Continuing with Pro for structural logic
      contents: `
        Context: ${JSON.stringify(researchData)}
        
        Step 4: Title Generation
        Generate 3 compelling ebook titles for "${keyword}".
        Select the best one based on conversion potential.
        
        Step 5: Outline Building
        Create a 6-section ebook outline for the selected title.
        Each section should have 3-5 sub-bullets.
        Include Introduction and Conclusion with 3-step action plan.
        
        Also, suggest a prompt for the cover image.
      `,
      config: {
        maxOutputTokens: 8192, // Increased to prevent JSON truncation
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            selectedTitle: { type: Type.STRING },
            subtitle: { type: Type.STRING },
            rationale: { type: Type.STRING },
            outline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  bullets: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            coverImagePrompt: { type: Type.STRING }
          }
        }
      }
    });
    const text = response.text;
    if (!text) throw new Error("No response from Outline Generation");
    return JSON.parse(text);
  } catch (error) {
    console.error("Outline Error:", error);
    throw error;
  }
};

/**
 * STEP 7: Ebook Writing
 * Writes a specific chapter based on the prompt requirements.
 */
export const writeChapter = async (chapterTitle: string, bullets: string[], assetTitle: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Flash is excellent for pure prose generation
      contents: `
        Write a complete ebook chapter based on this outline:
        Chapter: ${chapterTitle}
        Key Points to Cover: ${bullets.join(', ')}
        Book Title: ${assetTitle}

        Requirements:
        - Approx 400-500 words for this chapter
        - 6th grade reading level
        - Short paragraphs (3-4 sentences max)
        - Bold key phrases for emphasis
        - Action-oriented, motivating tone
        - Include specific examples
        - Format in Markdown with proper headings (##, ###)
      `,
      config: {
          maxOutputTokens: 8192
      }
    });
    return response.text;
  } catch (error) {
    console.error("Chapter Writing Error:", error);
    return "Error generating content.";
  }
};

/**
 * STEP 8: Value-Stacking Package
 * Generates the OTO, Workbook, and Bonuses.
 */
export const generateValueStack = async (title: string, keyword: string): Promise<ValueStack> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `
        Step 8: Value-Stacking Package
        Create a comprehensive value-stacking package for: "${title}".

        Generate structured JSON with icons from lucide-react (use actual icon names like "Gift", "FileText", "Target", "CheckCircle", "Star", "Zap", "Trophy", "Sparkles", "Crown", "Rocket", "Shield", "Award").

        Requirements:
        - 5 Bonuses with high perceived value.
        - 1 Interactive Workbook.
        - 1 OTO (One Time Offer) with clear ROI.
      `,
      config: {
        thinkingConfig: { thinkingBudget: 2048 }, // Reduced budget to ensure space for output
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bonuses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  icon: { type: Type.STRING },
                  value: { type: Type.STRING }
                }
              }
            },
            workbook: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                icon: { type: Type.STRING },
                value: { type: Type.STRING },
                sections: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            },
            oto: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                icon: { type: Type.STRING },
                price: { type: Type.STRING },
                originalPrice: { type: Type.STRING },
                bullets: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          }
        }
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("No response from Value Stack");
    return JSON.parse(text);
  } catch (error) {
    console.error("Value Stack Error:", error);
    // Fallback
    return {
      bonuses: [],
      workbook: { title: "Bonus Workbook", description: "", icon: "FileText", value: "$47", sections: [] },
      oto: { title: "VIP Upgrade", description: "", icon: "Crown", price: "$97", originalPrice: "$197", bullets: [] }
    };
  }
};

/**
 * STEP 6: Cover Image Generation
 */
export const generateCoverImage = async (prompt: string, aspectRatio: AspectRatio = '3:4') => {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `Professional ebook cover, portrait orientation. ${prompt}. Bold, legible title typography. High contrast color palette. Clean, modern aesthetic, minimalist style. No people in the image.`,
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

export const editImageWithPrompt = async (imageBase64: string, prompt: string) => {
  try {
    const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
          { text: `Edit this image: ${prompt}. Maintain the aspect ratio and main subject but apply the requested changes.` }
        ]
      },
      config: { responseModalities: [Modality.IMAGE] }
    });
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

export const quickTitleBrainstorm = async (currentTitle: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite-latest',
      contents: `Rewrite this title to be more catchy and viral: "${currentTitle}". Return only the new title text.`,
    });
    return response.text?.trim();
  } catch (error) {
    return currentTitle;
  }
};
