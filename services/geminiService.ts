import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

// Initialize only if key exists, otherwise we handle error gracefully in UI
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const getGeminiResponse = async (
  userMessage: string, 
  context: string
): Promise<string> => {
  if (!ai) {
    return "AI Tutor is offline. Please configure the API Key.";
  }

  try {
    const model = ai.models;
    const response = await model.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Context: The user is a 12th-grade student or teacher using a simulation about Chemical Kinetics, 
        specifically Collision Theory and Activation Energy.
        Current Simulation State: ${context}
        
        Question: ${userMessage}
        
        Answer nicely, briefly, and conceptually. Use analogies if possible.
      `,
    });
    
    return response.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error connecting to the AI tutor.";
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