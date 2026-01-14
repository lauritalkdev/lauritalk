import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const AZURE_KEY = process.env.AZURE_TRANSLATOR_KEY;
const AZURE_ENDPOINT =
  process.env.AZURE_TRANSLATOR_ENDPOINT ||
  "https://api.cognitive.microsofttranslator.com";
const AZURE_REGION = process.env.AZURE_TRANSLATOR_REGION;

if (!AZURE_KEY) {
  console.error("❌ Set AZURE_TRANSLATOR_KEY in .env");
  process.exit(1);
}

// ✅ Strongly typed request/response
app.post("/api/translate", async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, to, from } = req.body as {
      text: string;
      to: string;
      from?: string;
    };

    if (!text || !to) {
      res.status(400).json({ error: "text and to are required" });
      return;
    }

    const params = new URLSearchParams({ "api-version": "3.0", to });
    if (from) params.append("from", from);

    const url = `${AZURE_ENDPOINT.replace(/\/$/, "")}/translate?${params.toString()}`;

    const headers: Record<string, string> = {
      "Ocp-Apim-Subscription-Key": AZURE_KEY,
      "Content-Type": "application/json",
    };

    if (AZURE_REGION) {
      headers["Ocp-Apim-Subscription-Region"] = AZURE_REGION;
    }

    const body = [{ Text: text }];

    const azureResp = await axios.post(url, body, { headers });
    const translations = azureResp.data?.[0]?.translations;
    const firstTranslation = translations?.[0]?.text ?? null;

    res.json({ translatedText: firstTranslation, raw: azureResp.data });
  } catch (err: any) {
    console.error("Translate error:", err?.response?.data ?? err.message);
    res.status(500).json({
      error: "translation_failed",
      details: err?.response?.data ?? err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Translator proxy running on http://localhost:${PORT}`);
});
