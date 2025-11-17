// /services/chatbotService.ts
// Improved service: retries a backup model if the primary Hugging Face model fails

import axios from "axios";
import { huggingFaceConfig } from "../config/huggingFaceConfig";

// Backup free model in case the main one fails
const backupModel = "facebook/blenderbot-400M-distill";

export const getAIResponse = async (userMessage: string) => {
  const modelsToTry = [huggingFaceConfig.model, backupModel];

  for (const model of modelsToTry) {
    try {
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${model}`,
        { inputs: userMessage },
        {
          headers: {
            Authorization: `Bearer ${huggingFaceConfig.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 15000, // 15 seconds timeout
        }
      );

      // Some models return arrays; handle both shapes.
      const aiMessage =
        response.data?.[0]?.generated_text ||
        response.data?.generated_text ||
        null;

      if (aiMessage) return aiMessage;
    } catch (error: any) {
      console.warn(`Hugging Face API error with model "${model}":`, error.response?.data || error.message);
      // Try the next model in the loop
    }
  }

  // If all models fail
  return "I'm having trouble connecting right now. Please try again later.";
};
