import axios from "axios";
import Constants from "expo-constants";

// Azure Translator configuration - now using environment variables
const AZURE_ENDPOINT = Constants.expoConfig?.extra?.azureTranslatorEndpoint || 
                       "https://api.cognitive.microsofttranslator.com/";
const AZURE_REGION = Constants.expoConfig?.extra?.azureTranslatorRegion || "eastus";

// Get API key from environment variables
const getApiKey = (): string => {
  // Try to get from different sources in order of priority
  const key = 
    Constants.expoConfig?.extra?.azureTranslatorKey || 
    process.env.AZURE_TRANSLATOR_KEY || 
    process.env.EXPO_PUBLIC_AZURE_TRANSLATOR_KEY;

  if (!key) {
    console.warn(
      "Azure Translator API key not found in environment variables. " +
      "Please set EXPO_PUBLIC_AZURE_TRANSLATOR_KEY in your .env file."
    );
    return "";
  }
  
  return key;
};

const AZURE_API_KEY = getApiKey();

// Translation cache to avoid duplicate API calls
const translationCache = new Map<string, string>();

/**
 * Generate cache key for translation request
 */
const generateCacheKey = (text: string, from: string, to: string): string => {
  return `${text}|${from}|${to}`;
};

export const AzureTranslatorService = {
  /**
   * Check if Azure Translator is properly configured
   */
  isConfigured: (): boolean => {
    const isConfigured = !!AZURE_API_KEY && AZURE_API_KEY.length > 0;
    if (!isConfigured) {
      console.error("Azure Translator not configured. Missing API key.");
    }
    return isConfigured;
  },

  /**
   * Clear the translation cache
   */
  clearCache: (): void => {
    translationCache.clear();
  },

  /**
   * Translates text from one language to another using Azure Translator API
   * @param text - Text to translate
   * @param from - Source language (use empty string "" for auto-detect)
   * @param to - Target language code (e.g., "en", "fr", "zh-Hans")
   * @returns Translated text
   */
  translate: async (text: string, from: string = "", to: string): Promise<string> => {
    // Input validation
    if (!text || !text.trim()) {
      console.warn("Empty text provided for translation");
      return text;
    }

    if (!to || !to.trim()) {
      throw new Error("Missing target language.");
    }

    // Skip translation if source and target languages are the same (and source is known)
    if (from && from.toLowerCase() === to.toLowerCase()) {
      console.log(`Skipping translation: Same language (${from} to ${to})`);
      return text;
    }

    // Check if Azure Translator is configured
    if (!AZURE_API_KEY) {
      throw new Error("Azure Translator not configured. Please check your environment variables.");
    }

    // Check cache first
    const cacheKey = generateCacheKey(text, from || "auto", to);
    const cachedTranslation = translationCache.get(cacheKey);
    if (cachedTranslation) {
      console.log("Using cached translation");
      return cachedTranslation;
    }

    try {
      // Construct URL based on endpoint format
      let url: string;
      const params = new URLSearchParams({
        'api-version': '3.0',
        'to': to,
        'textType': 'plain'
      });
      
      // Only add 'from' parameter if source language is specified
      if (from && from.trim()) {
        params.append('from', from);
      }
      
      if (AZURE_ENDPOINT.includes('api.cognitive.microsofttranslator.com')) {
        // New endpoint format
        url = `${AZURE_ENDPOINT}translate?${params.toString()}`;
      } else {
        // Legacy endpoint format
        url = `${AZURE_ENDPOINT}/translate?${params.toString()}`;
      }

      const headers = {
        "Ocp-Apim-Subscription-Key": AZURE_API_KEY,
        "Ocp-Apim-Subscription-Region": AZURE_REGION,
        "Content-Type": "application/json",
      };

      const body = [{ text }];

      console.log(`Translating ${from ? `from ${from}` : 'auto-detect'} to ${to}: ${text.substring(0, 50)}...`);
      
      const response = await axios.post(url, body, { headers, timeout: 10000 });

      // Azure returns array: extract translated text
      const translatedText = response.data?.[0]?.translations?.[0]?.text || text;
      
      if (translatedText !== text) {
        // Cache the successful translation
        translationCache.set(cacheKey, translatedText);
        console.log(`Translation successful: ${translatedText.substring(0, 50)}...`);
      } else {
        console.warn("Translation returned same text as input");
      }
      
      return translatedText;
    } catch (error: any) {
      console.error("AzureTranslatorService error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
      });
      
      // Provide more specific error messages
      if (error.response?.status === 400) {
        if (error.response?.data?.error?.code === 400035) {
          throw new Error("Invalid source language. Please check the language code.");
        }
        throw new Error(`Bad request: ${error.response.data?.error?.message || error.message}`);
      } else if (error.response?.status === 401) {
        throw new Error("Invalid Azure Translator API key. Please check your configuration.");
      } else if (error.response?.status === 403) {
        throw new Error("Access denied. Check your Azure subscription status.");
      } else if (error.response?.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      } else if (error.code === 'ECONNABORTED') {
        throw new Error("Translation request timeout. Please check your network connection.");
      } else {
        throw new Error(`Translation failed: ${error.message || "Unknown error"}`);
      }
    }
  },

  /**
   * Batch translate multiple texts (more efficient for multiple messages)
   */
  translateBatch: async (
    texts: string[], 
    from: string = "", 
    to: string
  ): Promise<string[]> => {
    if (!texts || texts.length === 0) {
      return [];
    }

    if (!to) {
      throw new Error("Missing target language.");
    }

    if (!AZURE_API_KEY) {
      throw new Error("Azure Translator not configured.");
    }

    try {
      // Construct URL with parameters
      const params = new URLSearchParams({
        'api-version': '3.0',
        'to': to,
        'textType': 'plain'
      });
      
      // Only add 'from' parameter if source language is specified
      if (from && from.trim()) {
        params.append('from', from);
      }
      
      const url = AZURE_ENDPOINT.includes('api.cognitive.microsofttranslator.com')
        ? `${AZURE_ENDPOINT}translate?${params.toString()}`
        : `${AZURE_ENDPOINT}/translate?${params.toString()}`;

      const headers = {
        "Ocp-Apim-Subscription-Key": AZURE_API_KEY,
        "Ocp-Apim-Subscription-Region": AZURE_REGION,
        "Content-Type": "application/json",
      };

      const body = texts.map(text => ({ text }));
      
      console.log(`Batch translating ${texts.length} texts ${from ? `from ${from}` : 'auto-detect'} to ${to}`);
      
      const response = await axios.post(url, body, { headers, timeout: 15000 });
      
      const results = response.data.map((item: any, index: number) => {
        const translated = item?.translations?.[0]?.text || texts[index];
        // Cache each translation
        const cacheKey = generateCacheKey(texts[index], from || "auto", to);
        translationCache.set(cacheKey, translated);
        return translated;
      });
      
      console.log(`Batch translation successful for ${results.length} texts`);
      return results;
    } catch (error: any) {
      console.error("Batch translation failed:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      // Fallback to individual translations
      console.log("Falling back to individual translations...");
      const results = [];
      for (const text of texts) {
        try {
          const translated = await AzureTranslatorService.translate(text, from, to);
          results.push(translated);
        } catch (err) {
          console.error("Individual translation failed, using original text:", err);
          results.push(text); // Return original text on error
        }
      }
      return results;
    }
  },
};