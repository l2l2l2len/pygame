
import { GoogleGenAI } from "@google/genai";

export const getMagicHint = async (chapterTitle: string, userCode: string, task: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are Merlin, a coding mentor in the game PyMancer. 
      The user is stuck on chapter "${chapterTitle}".
      Task: ${task}
      User's current code: 
      \`\`\`python
      ${userCode}
      \`\`\`
      Give a very short, mystical, yet helpful hint in 2 sentences. Don't give the full solution, just guide them.`,
      config: {
        temperature: 0.7,
      }
    });
    return response.text;
  } catch (error) {
    console.error("AI Hint Error:", error);
    return "The mana in the air is thin... try checking your syntax, young mage.";
  }
};
