import { GoogleGenAI } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error("CRITICAL ERROR: Missing VITE_GEMINI_API_KEY. Please ensure .env file exists and server is restarted.");
} else {
  console.log("Gemini API Key loaded (first 5 chars):", API_KEY.substring(0, 5) + "...");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const sendMessageToGemini = async (history, newMessage) => {
  try {
    // Transform history to the format expected by the new SDK
    // The new SDK uses 'user' and 'model' roles
    const formattedHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    console.log("Starting chat with history:", JSON.stringify(formattedHistory, null, 2));

    const chat = ai.chats.create({
      //model: "gemini-2.5-flash",
      model: "gemini-2.5-flash-lite",
      history: formattedHistory,
    });

    console.log("Sending message to model...");
    const result = await chat.sendMessage({
      message: newMessage,
    });

    const text = result.text;
    console.log("Gemini Response:", text);
    return text;
  } catch (error) {
    console.error("Error communicating with Gemini (Full Details):", error);
    throw error;
  }
};
