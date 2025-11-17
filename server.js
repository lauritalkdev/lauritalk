// server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Load from .env
const AZURE_KEY = process.env.AZURE_TRANSLATOR_KEY;
const AZURE_REGION = process.env.AZURE_REGION;
const AZURE_ENDPOINT = process.env.AZURE_ENDPOINT;
const PORT = process.env.PORT || 3000;

if (!AZURE_KEY || !AZURE_REGION || !AZURE_ENDPOINT) {
  console.error("❌ Missing Azure Translator credentials in .env");
  process.exit(1);
}

// Translation route
app.post("/api/translate", async (req, res) => {
  try {
    const { text, to, from } = req.body;

    if (!text || !to) {
      return res.status(400).json({ error: "Missing 'text' or 'to' fields" });
    }

    const params = new URLSearchParams({ "api-version": "3.0" });
    params.append("to", to);
    if (from && from !== "auto") params.append("from", from);

    const url = `${AZURE_ENDPOINT.replace(/\/$/, '')}/translate?${params.toString()}`;

    const headers = {
      "Ocp-Apim-Subscription-Key": AZURE_KEY,
      "Ocp-Apim-Subscription-Region": AZURE_REGION,
      "Content-Type": "application/json",
    };

    const body = [{ Text: text }];
    const response = await axios.post(url, body, { headers });

    const translatedText = response.data?.[0]?.translations?.[0]?.text ?? "";
    const detectedLanguage = response.data?.[0]?.detectedLanguage?.language ?? null;

    res.json({ translatedText, detectedLanguage });
  } catch (err) {
    console.error("⚠️ Azure Translation Error:", err.response?.data || err.message);
    res.status(500).json({
      error: "translation_failed",
      details: err.response?.data || err.message,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Translator API running on http://localhost:${PORT}`);
});
