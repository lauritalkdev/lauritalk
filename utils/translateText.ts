import { AZURE_TRANSLATOR_ENDPOINT, AZURE_TRANSLATOR_KEY, AZURE_TRANSLATOR_REGION } from '@env';

export async function translateText(text: string, fromLang: string, toLang: string) {
  if (!AZURE_TRANSLATOR_KEY || !AZURE_TRANSLATOR_REGION || !AZURE_TRANSLATOR_ENDPOINT) {
    throw new Error(
      "Missing Azure Translator configuration. Please set AZURE_TRANSLATOR_KEY, AZURE_TRANSLATOR_REGION, and AZURE_TRANSLATOR_ENDPOINT in .env"
    );
  }

  try {
    const url = `${AZURE_TRANSLATOR_ENDPOINT}/translate?api-version=3.0&from=${fromLang}&to=${toLang}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": AZURE_TRANSLATOR_KEY,
        "Ocp-Apim-Subscription-Region": AZURE_TRANSLATOR_REGION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([{ text }]),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Translation failed:", errorText);
      throw new Error(`Translation failed: ${errorText}`);
    }

    const data = await response.json();
    const translatedText = data[0]?.translations[0]?.text || "No translation found";
    return translatedText;

  } catch (error) {
    console.error("Translation error:", error);
    throw new Error("Failed to translate text. Check your key or internet.");
  }
}
