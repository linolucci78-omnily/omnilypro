import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateLuckyTicketDetails = async (customerName: string, eventName: string): Promise<GeminiResponse> => {
  try {
    const prompt = `
      Genera un numero di biglietto della lotteria univoco e creativo (formato alfanumerico interessante, es: 'GOLD-777-X') 
      e una breve frase della fortuna o un augurio mistico (max 15 parole) in ITALIANO per un cliente di nome "${customerName}" 
      che partecipa all'evento "${eventName}".
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            luckyNumber: {
              type: Type.STRING,
              description: "A unique alphanumeric lottery ticket number.",
            },
            fortune: {
              type: Type.STRING,
              description: "A short, mystical fortune or wish in Italian.",
            },
          },
          required: ["luckyNumber", "fortune"],
        },
      },
    });

    const jsonStr = response.text;
    if (!jsonStr) {
      throw new Error("No content returned from Gemini");
    }

    return JSON.parse(jsonStr) as GeminiResponse;
  } catch (error) {
    console.error("Error generating ticket details:", error);
    // Fallback if AI fails
    return {
      luckyNumber: `ERR-${Math.floor(Math.random() * 10000)}`,
      fortune: "La fortuna aiuta gli audaci, riprova ancora!",
    };
  }
};