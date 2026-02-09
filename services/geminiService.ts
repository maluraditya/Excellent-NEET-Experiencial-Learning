import { GoogleGenAI } from "@google/genai";

// Vite uses import.meta.env for environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Initialize only if key exists, otherwise we handle error gracefully in UI
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const getGeminiResponse = async (
  userMessage: string,
  context: string
): Promise<string> => {
  if (!ai) {
    return "AI Tutor is offline. Please add VITE_GEMINI_API_KEY to your .env file.";
  }

  try {
    const model = ai.models;
    const response = await model.generateContent({
      model: 'gemini-2.0-flash',
      contents: `
You are an expert NCERT-focused AI tutor for Class 11-12 students preparing for NEET/JEE.

CURRENT CONTEXT:
${context}

STUDENT'S QUESTION:
${userMessage}

INSTRUCTIONS:
- Answer based on NCERT textbooks (Physics, Chemistry, Biology)
- Be concise but comprehensive (2-4 paragraphs max)
- Use simple language with analogies when helpful
- Include relevant formulas in LaTeX-like format when applicable
- If asked about the simulation, explain what they're seeing
- For numerical problems, show step-by-step solution
- Relate concepts to real-world applications when relevant
      `,
    });

    return response.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error connecting to the AI tutor. Please check your API key.";
  }
};

export const generateTopicThumbnail = async (topicTitle: string, description: string): Promise<string | null> => {
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `Create a high-quality, realistic 3D educational illustration for a chemistry textbook cover about: ${topicTitle}. 
                   Description: ${description}. 
                   Style: Clean, scientific, photorealistic 3D render, bright academic lighting.`
          }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          // imageSize: "1K" // REMOVED: This parameter is only supported by gemini-3-pro-image-preview
        }
      }
    });

    // Extract image with safety checks
    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          return `data:image/png;base64,${base64EncodeString}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Image Gen Error:", error);
    return null;
  }
};