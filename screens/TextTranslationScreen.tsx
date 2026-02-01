import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Clipboard, // 🟢 ADDED: Import Clipboa1rd
  FlatList,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import LimitExceededModal from "../components/LimitExceededModal";
import { COLORS } from "../constants/theme";
import { useWordLimits } from "../hooks/useWordLimits";
import { supabase } from "../supabase";
import { translateText } from "../utils/translateText";

// 🟢 ADDED: Save translation function
const saveTranslation = async (translationData: {
  source_text: string;
  translated_text: string;
  source_language: string;
  target_language: string;
}) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("User not logged in, skipping translation save");
      return false;
    }

    const { error } = await supabase.from("user_translations").insert([
      {
        user_id: user.id,
        ...translationData,
        translation_type: "text",
      },
    ]);

    if (error) {
      console.error("Error saving translation to database:", error);
      return false;
    }

    console.log("Translation saved successfully");
    return true;
  } catch (error) {
    console.error("Unexpected error saving translation:", error);
    return false;
  }
};

// 🟢 IMPORT DICTIONARIES
import enBafut from "../assets/dictionaries/EnglishtoBafut.json";
import enBakossi from "../assets/dictionaries/EnglishtoBakossi.json";
import enBakwere from "../assets/dictionaries/EnglishtoBakwere.json";
import enBamileke from "../assets/dictionaries/EnglishtoBamileke.json";
import enBangwa from "../assets/dictionaries/EnglishtoBangwa.json";
import enBayangi from "../assets/dictionaries/EnglishtoBayangi.json";
import enDuala from "../assets/dictionaries/EnglishtoDuala.json";
import enKom from "../assets/dictionaries/EnglishtoKom.json";
import enMungaka from "../assets/dictionaries/EnglishtoMungaka.json";
import enNgemba from "../assets/dictionaries/EnglishtoNgemba.json";
import enOroko from "../assets/dictionaries/EnglishtoOroko.json";

// 🟢 MAP DICTIONARIES
const dictionaries: { [key: string]: any } = {
  bkw: enBakwere,
  bam: enBamileke,
  baf: enBafut,
  bak: enBakossi,
  bga: enBangwa,
  kom: enKom,
  dua: enDuala,
  nge: enNgemba,
  byi: enBayangi,
  mgk: enMungaka,
  oro: enOroko,
};

export default function TextTranslationScreen({ navigation }: any) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("es");
  const [isLoading, setIsLoading] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [isSelectingSource, setIsSelectingSource] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    checkAndUpdateWordCount,
    modalVisible,
    modalType,
    remainingWords,
    usedWords,
    limitWords,
    closeModal,
    upgradeToPremium,
    loadLimitStatus,
    calculateWordCount,
  } = useWordLimits();

  const cameroonianDialects = [
    "bga",
    "bkw",
    "bak",
    "byi",
    "kom",
    "nge",
    "mgk",
    "bam",
    "dua",
    "baf",
    "oro",
  ];

  const languageCategories = [
    {
      name: "Europe",
      languages: [
        { code: "en", name: "English" },
        { code: "es", name: "Spanish" },
        { code: "fr", name: "French" },
        { code: "de", name: "German" },
        { code: "it", name: "Italian" },
        { code: "pt", name: "Portuguese" },
        { code: "ru", name: "Russian" },
        { code: "nl", name: "Dutch" },
        { code: "pl", name: "Polish" },
        { code: "sv", name: "Swedish" },
        { code: "da", name: "Danish" },
        { code: "no", name: "Norwegian" },
        { code: "fi", name: "Finnish" },
        { code: "cs", name: "Czech" },
        { code: "hu", name: "Hungarian" },
        { code: "ro", name: "Romanian" },
        { code: "el", name: "Greek" },
        { code: "bg", name: "Bulgarian" },
        { code: "hr", name: "Croatian" },
        { code: "sk", name: "Slovak" },
        { code: "sl", name: "Slovenian" },
        { code: "lt", name: "Lithuanian" },
        { code: "lv", name: "Latvian" },
        { code: "et", name: "Estonian" },
        { code: "mt", name: "Maltese" },
        { code: "ga", name: "Irish" },
        { code: "is", name: "Icelandic" },
        { code: "sq", name: "Albanian" },
        { code: "mk", name: "Macedonian" },
        { code: "bs", name: "Bosnian" },
        { code: "sr", name: "Serbian" },
        { code: "uk", name: "Ukrainian" },
        { code: "be", name: "Belarusian" },
        { code: "ca", name: "Catalan" },
        { code: "eu", name: "Basque" },
        { code: "gl", name: "Galician" },
        { code: "cy", name: "Welsh" },
        { code: "fo", name: "Faroese" },
        { code: "gv", name: "Manx" },
        { code: "kw", name: "Cornish" },
        { code: "br", name: "Breton" },
        { code: "os", name: "Ossetian" },
        { code: "csb", name: "Kashubian" },
      ],
    },
    {
      name: "Asia",
      languages: [
        { code: "zh-Hans", name: "Chinese (Simplified)" },
        { code: "zh-Hant", name: "Chinese (Traditional)" },
        { code: "ja", name: "Japanese" },
        { code: "ko", name: "Korean" },
        { code: "hi", name: "Hindi" },
        { code: "bn", name: "Bengali" },
        { code: "ta", name: "Tamil" },
        { code: "te", name: "Telugu" },
        { code: "mr", name: "Marathi" },
        { code: "gu", name: "Gujarati" },
        { code: "kn", name: "Kannada" },
        { code: "ml", name: "Malayalam" },
        { code: "pa", name: "Punjabi" },
        { code: "or", name: "Odia" },
        { code: "as", name: "Assamese" },
        { code: "ks", name: "Kashmiri" },
        { code: "ne", name: "Nepali" },
        { code: "si", name: "Sinhala" },
        { code: "my", name: "Burmese" },
        { code: "km", name: "Khmer" },
        { code: "lo", name: "Lao" },
        { code: "th", name: "Thai" },
        { code: "vi", name: "Vietnamese" },
        { code: "id", name: "Indonesian" },
        { code: "ms", name: "Malay" },
        { code: "fil", name: "Filipino" },
        { code: "jv", name: "Javanese" },
        { code: "su", name: "Sundanese" },
        { code: "mn", name: "Mongolian" },
        { code: "bo", name: "Tibetan" },
        { code: "ug", name: "Uyghur" },
        { code: "dz", name: "Dzongkha" },
        { code: "yue", name: "Cantonese" },
        { code: "hmn", name: "Hmong" },
        { code: "mnw", name: "Mon" },
        { code: "shn", name: "Shan" },
      ],
    },
    {
      name: "Middle East & Central Asia",
      languages: [
        { code: "ar", name: "Arabic" },
        { code: "fa", name: "Persian" },
        { code: "tr", name: "Turkish" },
        { code: "he", name: "Hebrew" },
        { code: "ur", name: "Urdu" },
        { code: "ps", name: "Pashto" },
        { code: "ku", name: "Kurdish" },
        { code: "az", name: "Azerbaijani" },
        { code: "hy", name: "Armenian" },
        { code: "ka", name: "Georgian" },
        { code: "uz", name: "Uzbek" },
        { code: "kk", name: "Kazakh" },
        { code: "ky", name: "Kyrgyz" },
        { code: "tg", name: "Tajik" },
        { code: "tk", name: "Turkmen" },
        { code: "sd", name: "Sindhi" },
        { code: "bal", name: "Balochi" },
        { code: "prs", name: "Dari" },
        { code: "ckb", name: "Kurdish (Sorani)" },
        { code: "yi", name: "Yiddish" },
        { code: "kaa", name: "Karakalpak" },
        { code: "kum", name: "Kumyk" },
        { code: "nog", name: "Nogai" },
      ],
    },
    {
      name: "Africa",
      languages: [
        { code: "sw", name: "Swahili" },
        { code: "am", name: "Amharic" },
        { code: "yo", name: "Yoruba" },
        { code: "ig", name: "Igbo" },
        { code: "ha", name: "Hausa" },
        { code: "zu", name: "Zulu" },
        { code: "xh", name: "Xhosa" },
        { code: "af", name: "Afrikaans" },
        { code: "so", name: "Somali" },
        { code: "rw", name: "Kinyarwanda" },
        { code: "mg", name: "Malagasy" },
        { code: "st", name: "Sesotho" },
        { code: "tn", name: "Setswana" },
        { code: "ss", name: "Swati" },
        { code: "ve", name: "Venda" },
        { code: "ts", name: "Tsonga" },
        { code: "nso", name: "Northern Sotho" },
        { code: "bm", name: "Bambara" },
        { code: "ff", name: "Fula" },
        { code: "wo", name: "Wolof" },
        { code: "ln", name: "Lingala" },
        { code: "sg", name: "Sango" },
        { code: "rn", name: "Rundi" },
        { code: "ny", name: "Chichewa" },
        { code: "sn", name: "Shona" },
        { code: "lg", name: "Ganda" },
        { code: "om", name: "Oromo" },
        { code: "ti", name: "Tigrinya" },
        { code: "ber", name: "Berber" },
        { code: "ki", name: "Kikuyu" },
        { code: "kmb", name: "Kimbundu" },
        { code: "lu", name: "Luba-Katanga" },
        { code: "nd", name: "Ndebele" },
        { code: "nr", name: "Southern Ndebele" },
        { code: "lua", name: "Tshiluba" },
        { code: "tig", name: "Tigre" },
        { code: "aa", name: "Afar" },
      ],
    },
    {
      name: "Americas & Oceania",
      languages: [
        { code: "en-US", name: "English (US)" },
        { code: "es-419", name: "Spanish (Latin America)" },
        { code: "pt-BR", name: "Portuguese (Brazil)" },
        { code: "fr-CA", name: "French (Canadian)" },
        { code: "qu", name: "Quechua" },
        { code: "gn", name: "Guarani" },
        { code: "ay", name: "Aymara" },
        { code: "nah", name: "Nahuatl" },
        { code: "mi", name: "Māori" },
        { code: "haw", name: "Hawaiian" },
        { code: "sm", name: "Samoan" },
        { code: "fj", name: "Fijian" },
        { code: "to", name: "Tongan" },
        { code: "ty", name: "Tahitian" },
        { code: "cr", name: "Cree" },
        { code: "iu", name: "Inuktitut" },
        { code: "arn", name: "Mapudungun" },
      ],
    },
    {
      name: "Constructed & Other Languages",
      languages: [
        { code: "eo", name: "Esperanto" },
        { code: "ia", name: "Interlingua" },
        { code: "tpi", name: "Tok Pisin" },
        { code: "pap", name: "Papiamento" },
      ],
    },
    {
      name: "Cameroonian Dialects",
      languages: [
        { code: "bga", name: "Bangwa" },
        { code: "bkw", name: "Bakweri" },
        { code: "bak", name: "Bakossi" },
        { code: "byi", name: "Bayangi (Ejagham)" },
        { code: "kom", name: "Kom" },
        { code: "nge", name: "Ngemba" },
        { code: "mgk", name: "Mungaka (Bali)" },
        { code: "bam", name: "Bamileke" },
        { code: "dua", name: "Duala" },
        { code: "baf", name: "Bafut" },
        { code: "oro", name: "Oroko" },
      ],
    },
  ];

  const allLanguages = languageCategories.flatMap(
    (category) => category.languages,
  );

  const getFilteredLanguages = () => {
    if (!searchQuery.trim()) {
      return languageCategories;
    }

    const query = searchQuery.toLowerCase().trim();
    const filteredCategories = languageCategories
      .map((category) => ({
        ...category,
        languages: category.languages.filter(
          (lang) =>
            lang.name.toLowerCase().includes(query) ||
            lang.code.toLowerCase().includes(query),
        ),
      }))
      .filter((category) => category.languages.length > 0);

    return filteredCategories;
  };

  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[.,?!]/g, "");
  };

  const translatePhrase = (
    text: string,
    translations: { [key: string]: string },
    isReverse: boolean = false,
  ): string | null => {
    const normalizedInput = normalizeText(text);

    if (!isReverse && translations[normalizedInput]) {
      return translations[normalizedInput];
    }

    if (isReverse) {
      for (const [english, dialect] of Object.entries(translations)) {
        if (normalizeText(dialect as string) === normalizedInput) {
          return english;
        }
      }
    }

    if (normalizedInput.includes(" ")) {
      const words = normalizedInput.split(" ");
      let translatedWords: string[] = [];
      let someWordsTranslated = false;

      for (const word of words) {
        let translated = false;

        if (!isReverse) {
          for (const [english, dialect] of Object.entries(translations)) {
            if (normalizeText(english) === word) {
              translatedWords.push(dialect as string);
              translated = true;
              someWordsTranslated = true;
              break;
            }
          }
        } else {
          for (const [english, dialect] of Object.entries(translations)) {
            if (normalizeText(dialect as string) === word) {
              translatedWords.push(english);
              translated = true;
              someWordsTranslated = true;
              break;
            }
          }
        }

        if (!translated) {
          translatedWords.push(word);
        }
      }

      if (someWordsTranslated) {
        return translatedWords.join(" ");
      }
    }

    return null;
  };

  const translateDialectToInternational = async (
    text: string,
    sourceDialect: string,
    targetInternational: string,
  ): Promise<string> => {
    console.log(
      `🌍 Translating ${sourceDialect} → ${targetInternational} via English bridge`,
    );

    const sourceDict = dictionaries[sourceDialect];
    if (!sourceDict?.translations) {
      return `[${sourceDict?.targetLanguage || sourceDialect} dictionary not loaded]`;
    }

    let englishText = "";
    const normalizedInput = normalizeText(text);

    for (const [english, dialect] of Object.entries(sourceDict.translations)) {
      if (normalizeText(dialect as string) === normalizedInput) {
        englishText = english;
        break;
      }
    }

    if (!englishText) {
      for (const [english, dialect] of Object.entries(
        sourceDict.translations,
      )) {
        if (normalizeText(dialect as string) === normalizedInput) {
          englishText = english;
          break;
        }
      }
    }

    if (!englishText) {
      const phraseResult = translatePhrase(text, sourceDict.translations, true);
      if (phraseResult) {
        englishText = phraseResult;
      }
    }

    if (!englishText) {
      return `[Cannot translate from ${sourceDict.targetLanguage} to English]`;
    }

    console.log(
      `✅ ${sourceDict.targetLanguage} → English: "${text}" → "${englishText}"`,
    );

    try {
      const internationalText = await translateText(
        englishText,
        "en",
        targetInternational,
      );
      console.log(
        `✅ English → ${targetInternational}: "${englishText}" → "${internationalText}"`,
      );
      return internationalText;
    } catch (err) {
      console.error("Azure Translation failed:", err);
      return `[Azure Translation Error for ${targetInternational}]`;
    }
  };

  const translateInternationalToDialect = async (
    text: string,
    sourceInternational: string,
    targetDialect: string,
  ): Promise<string> => {
    console.log(
      `🌍 Translating ${sourceInternational} → ${targetDialect} via English bridge`,
    );

    let englishText = "";
    try {
      englishText = await translateText(text, sourceInternational, "en");
      console.log(
        `✅ ${sourceInternational} → English: "${text}" → "${englishText}"`,
      );
    } catch (err) {
      console.error("Azure Translation failed:", err);
      return `[Azure Translation Error from ${sourceInternational}]`;
    }

    const targetDict = dictionaries[targetDialect];
    if (!targetDict?.translations) {
      return `[${targetDict?.targetLanguage || targetDialect} dictionary not loaded]`;
    }

    const normalizedEnglish = normalizeText(englishText);

    if (targetDict.translations[normalizedEnglish]) {
      const finalResult = targetDict.translations[normalizedEnglish] as string;
      console.log(
        `✅ English → ${targetDict.targetLanguage}: "${englishText}" → "${finalResult}"`,
      );
      return finalResult;
    }

    for (const [english, dialect] of Object.entries(targetDict.translations)) {
      if (normalizeText(english) === normalizedEnglish) {
        console.log(
          `✅ English → ${targetDict.targetLanguage}: "${englishText}" → "${dialect}"`,
        );
        return dialect as string;
      }
    }

    const phraseResult = translatePhrase(
      englishText,
      targetDict.translations,
      false,
    );
    if (phraseResult) {
      console.log(
        `✅ English → ${targetDict.targetLanguage} phrase: "${englishText}" → "${phraseResult}"`,
      );
      return phraseResult;
    }

    return `[Cannot translate from English to ${targetDict.targetLanguage}]`;
  };

  const translateWithDictionary = async (
    text: string,
    sourceLang: string,
    targetLang: string,
  ): Promise<string> => {
    if (!text.trim()) return "";

    if (sourceLang === "en" && isCameroonianDialect(targetLang)) {
      const dictionary = dictionaries[targetLang];
      if (!dictionary?.translations) {
        return `[${dictionary?.targetLanguage || targetLang} dictionary not loaded]`;
      }

      const normalizedInput = normalizeText(text);
      if (dictionary.translations[normalizedInput]) {
        return dictionary.translations[normalizedInput] as string;
      }

      for (const [english, dialect] of Object.entries(
        dictionary.translations,
      )) {
        if (normalizeText(english) === normalizedInput) {
          return dialect as string;
        }
      }

      const phraseResult = translatePhrase(
        text,
        dictionary.translations,
        false,
      );
      if (phraseResult) {
        return phraseResult;
      }

      return `[No ${dictionary.targetLanguage} translation for "${text}"]`;
    }

    if (isCameroonianDialect(sourceLang) && targetLang === "en") {
      const dictionary = dictionaries[sourceLang];
      if (!dictionary?.translations) {
        return `[${dictionary?.targetLanguage || sourceLang} dictionary not loaded]`;
      }

      const normalizedInput = normalizeText(text);

      for (const [english, dialect] of Object.entries(
        dictionary.translations,
      )) {
        if (normalizeText(dialect as string) === normalizedInput) {
          return english;
        }
      }

      for (const [english, dialect] of Object.entries(
        dictionary.translations,
      )) {
        if (normalizeText(dialect as string) === normalizedInput) {
          return english;
        }
      }

      const phraseResult = translatePhrase(text, dictionary.translations, true);
      if (phraseResult) {
        return phraseResult;
      }

      return `[No English translation for "${text}" in ${dictionary.targetLanguage}]`;
    }

    if (isCameroonianDialect(sourceLang) && isCameroonianDialect(targetLang)) {
      console.log(
        `🎯 Translating ${sourceLang} → ${targetLang} via English bridge`,
      );

      const sourceDict = dictionaries[sourceLang];
      const targetDict = dictionaries[targetLang];

      if (!sourceDict?.translations) {
        return `[${sourceDict?.targetLanguage || sourceLang} dictionary not loaded]`;
      }
      if (!targetDict?.translations) {
        return `[${targetDict?.targetLanguage || targetLang} dictionary not loaded]`;
      }

      let englishText = "";
      const normalizedInput = normalizeText(text);

      for (const [english, dialect] of Object.entries(
        sourceDict.translations,
      )) {
        if (normalizeText(dialect as string) === normalizedInput) {
          englishText = english;
          break;
        }
      }

      if (!englishText) {
        for (const [english, dialect] of Object.entries(
          sourceDict.translations,
        )) {
          if (normalizeText(dialect as string) === normalizedInput) {
            englishText = english;
            break;
          }
        }
      }

      if (!englishText) {
        const phraseResult = translatePhrase(
          text,
          sourceDict.translations,
          true,
        );
        if (phraseResult) {
          englishText = phraseResult;
        }
      }

      if (!englishText) {
        return `[Cannot translate from ${sourceDict.targetLanguage} to English]`;
      }

      console.log(
        `✅ ${sourceDict.targetLanguage} → English: "${text}" → "${englishText}"`,
      );

      const normalizedEnglish = normalizeText(englishText);

      if (targetDict.translations[normalizedEnglish]) {
        const finalResult = targetDict.translations[
          normalizedEnglish
        ] as string;
        console.log(
          `✅ English → ${targetDict.targetLanguage}: "${englishText}" → "${finalResult}"`,
        );
        return finalResult;
      }

      for (const [english, dialect] of Object.entries(
        targetDict.translations,
      )) {
        if (normalizeText(english) === normalizedEnglish) {
          console.log(
            `✅ English → ${targetDict.targetLanguage}: "${englishText}" → "${dialect}"`,
          );
          return dialect as string;
        }
      }

      const phraseResult = translatePhrase(
        englishText,
        targetDict.translations,
        false,
      );
      if (phraseResult) {
        console.log(
          `✅ English → ${targetDict.targetLanguage} phrase: "${englishText}" → "${phraseResult}"`,
        );
        return phraseResult;
      }

      return `[Cannot translate from English to ${targetDict.targetLanguage}]`;
    }

    return `[Unsupported translation: ${sourceLang} to ${targetLang}]`;
  };

  const isCameroonianDialect = (langCode: string): boolean => {
    return cameroonianDialects.includes(langCode);
  };

  useEffect(() => {
    if (input.trim()) {
      const translateTimer = setTimeout(() => {
        handleTranslate();
      }, 1000);

      return () => clearTimeout(translateTimer);
    } else {
      setOutput("");
    }
  }, [input, sourceLang, targetLang]);

  const swapLanguages = () => {
    if (sourceLang === "auto") {
      Alert.alert(
        "Cannot Swap",
        "Cannot swap when source is set to auto-detect.",
      );
      return;
    }

    const prevSource = sourceLang;
    const prevTarget = targetLang;

    setSourceLang(prevTarget);
    setTargetLang(prevSource);

    if (
      output &&
      output !== "[Azure Translation Error]" &&
      !output.includes("[Dictionary")
    ) {
      setInput(output);
      setOutput(input);
    }
  };

  const handleUpgrade = async () => {
    closeModal();
    Alert.alert("Upgrade to Premium", "Choose your premium plan:", [
      {
        text: "1 Month - $9.99",
        onPress: async () => {
          const success = await upgradeToPremium("monthly");
          if (success) {
            Alert.alert(
              "Success",
              "You've been upgraded to Premium for 30 days!",
            );
            await loadLimitStatus();
          } else {
            Alert.alert("Error", "Failed to upgrade. Please try again.");
          }
        },
      },
      {
        text: "6 Months - $49.99",
        onPress: async () => {
          const success = await upgradeToPremium("6months");
          if (success) {
            Alert.alert(
              "Success",
              "You've been upgraded to Premium for 180 days!",
            );
            await loadLimitStatus();
          } else {
            Alert.alert("Error", "Failed to upgrade. Please try again.");
          }
        },
      },
      {
        text: "1 Year - $89.99",
        onPress: async () => {
          const success = await upgradeToPremium("yearly");
          if (success) {
            Alert.alert(
              "Success",
              "You've been upgraded to Premium for 360 days!",
            );
            await loadLimitStatus();
          } else {
            Alert.alert("Error", "Failed to upgrade. Please try again.");
          }
        },
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const handleTranslate = async () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    const { allowed, result } = await checkAndUpdateWordCount(input);

    if (!allowed) {
      console.log("Translation blocked due to word limit");
      return;
    }

    const isCameroonianSource = isCameroonianDialect(sourceLang);
    const isCameroonianTarget = isCameroonianDialect(targetLang);

    if (isCameroonianSource && !isCameroonianTarget && targetLang !== "en") {
      setIsLoading(true);
      try {
        const translatedText = await translateDialectToInternational(
          input,
          sourceLang,
          targetLang,
        );
        setOutput(translatedText);
        if (translatedText && !translatedText.includes("[")) {
          await saveTranslation({
            source_text: input,
            translated_text: translatedText,
            source_language: sourceLang,
            target_language: targetLang,
          });
        }
      } catch (err) {
        console.error("Dialect to International translation failed:", err);
        setOutput("[Translation Error]");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!isCameroonianSource && sourceLang !== "en" && isCameroonianTarget) {
      setIsLoading(true);
      try {
        const translatedText = await translateInternationalToDialect(
          input,
          sourceLang,
          targetLang,
        );
        setOutput(translatedText);
        if (translatedText && !translatedText.includes("[")) {
          await saveTranslation({
            source_text: input,
            translated_text: translatedText,
            source_language: sourceLang,
            target_language: targetLang,
          });
        }
      } catch (err) {
        console.error("International to Dialect translation failed:", err);
        setOutput("[Translation Error]");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (
      (isCameroonianSource && targetLang === "en") ||
      (sourceLang === "en" && isCameroonianTarget) ||
      (isCameroonianSource && isCameroonianTarget)
    ) {
      setIsLoading(true);
      try {
        const translatedText = await translateWithDictionary(
          input,
          sourceLang,
          targetLang,
        );
        setOutput(translatedText);
        if (
          translatedText &&
          !translatedText.includes("[") &&
          !translatedText.includes("No ")
        ) {
          await saveTranslation({
            source_text: input,
            translated_text: translatedText,
            source_language: sourceLang,
            target_language: targetLang,
          });
        }
      } catch (err) {
        console.error("Dictionary Translation failed:", err);
        setOutput("[Translation Error]");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    try {
      const translatedText = await translateText(input, sourceLang, targetLang);
      setOutput(translatedText);
      if (translatedText && translatedText !== "[Azure Translation Error]") {
        await saveTranslation({
          source_text: input,
          translated_text: translatedText,
          source_language: sourceLang,
          target_language: targetLang,
        });
      }
    } catch (err) {
      console.error("Azure Translation failed:", err);
      setOutput("[Azure Translation Error]");
    } finally {
      setIsLoading(false);
    }
  };

  // 🟢 UPDATED: COPY OUTPUT FUNCTION - Actually copies to clipboard
  const copyOutput = async () => {
    if (
      !output ||
      output.includes("[Error]") ||
      output.includes("[Dictionary") ||
      output.includes("[No translation")
    ) {
      Alert.alert("No Text", "There is no text to copy.");
      return;
    }

    try {
      await Clipboard.setString(output);
      Alert.alert("Copied", "Text copied to clipboard");
    } catch (error) {
      console.error("Copy failed:", error);
      Alert.alert("Copy Error", "Could not copy text to clipboard");
    }
  };

  // 🟢 ADDED: SHARE OUTPUT FUNCTION
  const shareOutput = async () => {
    if (
      !output ||
      output.includes("[Error]") ||
      output.includes("[Dictionary") ||
      output.includes("[No translation")
    ) {
      Alert.alert("No Text", "There is no translated text to share.");
      return;
    }

    try {
      const sourceLangName = getLanguageName(sourceLang);
      const targetLangName = getLanguageName(targetLang);

      const shareMessage =
        `🌐 Translation Result\n\n` +
        `From ${sourceLangName} (${sourceLang}):\n${input}\n\n` +
        `To ${targetLangName} (${targetLang}):\n${output}\n\n` +
        `Translated via Language Translator App`;

      await Share.share({
        message: shareMessage,
        title: "Share Translation",
      });
    } catch (error) {
      console.error("Sharing failed:", error);
      Alert.alert("Share Error", "Could not share the translation.");
    }
  };

  const speakOutput = async () => {
    if (
      !output ||
      output.includes("[Error]") ||
      output.includes("[Dictionary") ||
      output.includes("[No translation")
    ) {
      Alert.alert("No Text", "There is no translated text to speak.");
      return;
    }

    try {
      if (isSpeaking) {
        Speech.stop();
        setIsSpeaking(false);
        return;
      }

      setIsSpeaking(true);

      const languageMap: { [key: string]: string } = {
        en: "en-US",
        es: "es-ES",
        fr: "fr-FR",
        de: "de-DE",
      };

      const speechLanguage = languageMap[targetLang] || "en-US";

      await Speech.speak(output, {
        language: speechLanguage,
        pitch: 1.0,
        rate: 0.8,
        onDone: () => setIsSpeaking(false),
        onError: () => {
          Alert.alert("Speech Error", "Could not speak the text.");
          setIsSpeaking(false);
        },
      });
    } catch (error) {
      Alert.alert("Speech Error", "Text-to-speech is not available.");
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const getLanguageName = (code: string) => {
    return allLanguages.find((lang) => lang.code === code)?.name || code;
  };

  const LanguageSelectorModal = () => {
    const filteredCategories = getFilteredLanguages();
    const totalFilteredLanguages = filteredCategories.flatMap(
      (cat) => cat.languages,
    ).length;

    return (
      <Modal
        visible={showLangModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowLangModal(false);
          setSearchQuery("");
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isSelectingSource
                ? "Select Source Language"
                : "Select Target Language"}
            </Text>

            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={20}
                color={COLORS.gold}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search languages..."
                placeholderTextColor="#888"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setSearchQuery("")}
                >
                  <Ionicons name="close-circle" size={18} color="#888" />
                </TouchableOpacity>
              )}
            </View>

            {searchQuery.trim() && (
              <Text style={styles.searchResultsText}>
                Found {totalFilteredLanguages} language
                {totalFilteredLanguages !== 1 ? "s" : ""} for "{searchQuery}"
              </Text>
            )}

            <FlatList
              data={filteredCategories}
              keyExtractor={(item) => item.name}
              renderItem={({ item: category }) => (
                <View style={styles.categorySection}>
                  <Text style={styles.categoryTitle}>{category.name}</Text>
                  {category.languages.map((lang) => (
                    <TouchableOpacity
                      key={lang.code}
                      style={[
                        styles.langItem,
                        (isSelectingSource ? sourceLang : targetLang) ===
                          lang.code && styles.selectedLangItem,
                        isCameroonianDialect(lang.code) &&
                          styles.cameroonLangItem,
                      ]}
                      onPress={() => {
                        if (isSelectingSource) setSourceLang(lang.code);
                        else setTargetLang(lang.code);
                        setShowLangModal(false);
                        setSearchQuery("");
                      }}
                    >
                      <Text
                        style={[
                          styles.langText,
                          isCameroonianDialect(lang.code) &&
                            styles.cameroonLangText,
                        ]}
                      >
                        {lang.name} {isCameroonianDialect(lang.code) && "🇨🇲"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptySearchContainer}>
                  <Ionicons
                    name="search-outline"
                    size={40}
                    color={COLORS.gold}
                  />
                  <Text style={styles.emptySearchText}>No languages found</Text>
                  <Text style={styles.emptySearchSubtext}>
                    Try searching with different terms
                  </Text>
                </View>
              }
            />

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setShowLangModal(false);
                setSearchQuery("");
              }}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={28} color={COLORS.gold} />
      </TouchableOpacity>

      <Text style={styles.title}>🌐 Text Translator</Text>

      <View style={styles.supportIndicator}>
        <Ionicons name="globe-outline" size={16} color={COLORS.forestGreen} />
        <Text style={styles.supportText}>150+ languages supported</Text>
      </View>

      <View style={styles.debugInfo}>
        <Text style={styles.debugInfoText}>
          💡 Now supports local dialect ↔ international language translation!
        </Text>
      </View>

      <View style={styles.languageContainer}>
        <View style={styles.pickerWrapper}>
          <Text style={styles.label}>From:</Text>
          <TouchableOpacity
            style={styles.customPicker}
            onPress={() => {
              setIsSelectingSource(true);
              setSearchQuery("");
              setShowLangModal(true);
            }}
          >
            <Text style={styles.pickerText}>{getLanguageName(sourceLang)}</Text>
            <Ionicons name="chevron-down" size={20} color={COLORS.gold} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.swapButton} onPress={swapLanguages}>
          <Ionicons name="swap-horizontal" size={28} color={COLORS.gold} />
        </TouchableOpacity>

        <View style={styles.pickerWrapper}>
          <Text style={styles.label}>To:</Text>
          <TouchableOpacity
            style={styles.customPicker}
            onPress={() => {
              setIsSelectingSource(false);
              setSearchQuery("");
              setShowLangModal(true);
            }}
          >
            <Text style={styles.pickerText}>{getLanguageName(targetLang)}</Text>
            <Ionicons name="chevron-down" size={20} color={COLORS.gold} />
          </TouchableOpacity>
        </View>
      </View>

      <LanguageSelectorModal />

      <LimitExceededModal
        visible={modalVisible}
        type={modalType}
        remainingWords={remainingWords}
        usedWords={usedWords}
        limitWords={limitWords}
        onClose={closeModal}
        onUpgrade={handleUpgrade}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder={
            isCameroonianDialect(sourceLang) || isCameroonianDialect(targetLang)
              ? "Type words, phrases or sentences to translate..."
              : "Type here to translate with Azure..."
          }
          placeholderTextColor={COLORS.forestGreen}
          value={input}
          onChangeText={setInput}
          multiline
        />
        {isLoading && (
          <ActivityIndicator color={COLORS.gold} style={styles.loader} />
        )}
      </View>

      <View style={styles.outputContainer}>
        <Text style={styles.outputText}>
          {output ||
            (isCameroonianDialect(sourceLang) ||
            isCameroonianDialect(targetLang)
              ? "Cameroonian translation will appear here..."
              : "Translation will appear here...")}
        </Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity onPress={speakOutput} style={styles.speakerButton}>
            <Ionicons
              name={isSpeaking ? "stop-circle" : "volume-high"}
              size={28}
              color={isSpeaking ? COLORS.forestGreen : COLORS.gold}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={copyOutput} style={styles.actionButton}>
            <Ionicons name="copy" size={28} color={COLORS.gold} />
          </TouchableOpacity>
          <TouchableOpacity onPress={shareOutput} style={styles.actionButton}>
            <Ionicons name="share-social" size={28} color={COLORS.gold} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.testInfo}>
        <Text style={styles.testInfoText}>
          • 150+ International languages{"\n"}• English ↔ Dialects: Words,
          phrases & sentences{"\n"}• Dialect ↔ Dialect: eg (Bakweri↔Bakossi)
          {"\n"}• Dialect ↔ International: eg (Bakweri↔French){"\n"}• Partial
          translations for unknown words{"\n"}• Share translations with others
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.black,
    padding: 16,
    paddingTop: 50,
  },
  backButton: {
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.gold,
    marginBottom: 10,
    textAlign: "center",
  },
  supportIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    backgroundColor: "rgba(46, 139, 87, 0.1)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(46, 139, 87, 0.3)",
    alignSelf: "center",
  },
  supportText: {
    color: COLORS.forestGreen,
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  debugInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    alignSelf: "center",
  },
  debugInfoText: {
    color: COLORS.gold,
    fontSize: 12,
    textAlign: "center",
  },
  languageContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  pickerWrapper: {
    flex: 1,
    marginHorizontal: 5,
  },
  label: {
    color: COLORS.forestGreen,
    marginBottom: 8,
    fontWeight: "bold",
    fontSize: 14,
  },
  customPicker: {
    backgroundColor: COLORS.black,
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickerText: {
    color: COLORS.gold,
    fontWeight: "600",
    fontSize: 14,
  },
  swapButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gold,
    marginHorizontal: 8,
    marginTop: 15,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: COLORS.black,
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxHeight: "85%",
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  modalTitle: {
    color: COLORS.gold,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.black,
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.gold,
    fontSize: 16,
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  searchResultsText: {
    color: COLORS.forestGreen,
    fontSize: 12,
    textAlign: "center",
    marginBottom: 10,
    fontStyle: "italic",
  },
  emptySearchContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptySearchText: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
  },
  emptySearchSubtext: {
    color: "#888",
    fontSize: 14,
    marginTop: 5,
  },
  categorySection: {
    marginBottom: 15,
  },
  categoryTitle: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    paddingLeft: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
  },
  langItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomColor: "rgba(212, 175, 55, 0.2)",
    borderBottomWidth: 1,
  },
  selectedLangItem: {
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
  },
  langText: {
    color: COLORS.gold,
    fontSize: 16,
  },
  cameroonLangItem: {
    backgroundColor: "rgba(212, 175, 55, 0.05)",
  },
  cameroonLangText: {
    fontWeight: "600",
  },
  modalCloseButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 20,
    paddingVertical: 12,
    marginTop: 10,
  },
  modalCloseText: {
    color: COLORS.black,
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  inputContainer: {
    backgroundColor: COLORS.black,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.gold,
    padding: 15,
    marginBottom: 15,
  },
  textInput: {
    color: COLORS.gold,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  loader: {
    marginTop: 10,
  },
  outputContainer: {
    backgroundColor: COLORS.black,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.gold,
    padding: 15,
    minHeight: 100,
    marginBottom: 15,
  },
  outputText: {
    color: COLORS.gold,
    fontSize: 16,
    marginBottom: 10,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 15,
  },
  speakerButton: {},
  actionButton: {},
  testInfo: {
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  testInfoText: {
    color: COLORS.gold,
    fontSize: 12,
    textAlign: "center",
  },
});
