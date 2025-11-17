import { Ionicons } from "@expo/vector-icons";
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../constants/theme";
import { supabase } from "../supabase"; // 🟢 ADDED: Import supabase
import { translateText } from "../utils/translateText";

// 🟢 ADDED: Save translation function
const saveTranslation = async (translationData: {
  source_text: string;
  translated_text: string;
  source_language: string;
  target_language: string;
  translation_type: string;
}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('User not logged in, skipping translation save');
      return false;
    }

    const { error } = await supabase
      .from('user_translations')
      .insert([
        {
          user_id: user.id,
          ...translationData
        }
      ]);

    if (error) {
      console.error('Error saving translation to database:', error);
      return false;
    }

    console.log('Translation saved successfully');
    return true;
  } catch (error) {
    console.error('Unexpected error saving translation:', error);
    return false;
  }
};

// 🟢 IMPORT DICTIONARIES
import enBafut from '../assets/dictionaries/EnglishtoBafut.json';
import enBakossi from '../assets/dictionaries/EnglishtoBakossi.json';
import enBakwere from '../assets/dictionaries/EnglishtoBakwere.json';
import enBamileke from '../assets/dictionaries/EnglishtoBamileke.json';
import enBangwa from '../assets/dictionaries/EnglishtoBangwa.json';
import enBayangi from '../assets/dictionaries/EnglishtoBayangi.json';
import enDuala from '../assets/dictionaries/EnglishtoDuala.json';
import enKom from '../assets/dictionaries/EnglishtoKom.json';
import enMungaka from '../assets/dictionaries/EnglishtoMungaka.json';
import enNgemba from '../assets/dictionaries/EnglishtoNgemba.json';
import enOroko from '../assets/dictionaries/EnglishtoOroko.json';

// 🟢 MAP DICTIONARIES
const dictionaries: { [key: string]: any } = {
  'bkw': enBakwere,
  'bam': enBamileke,
  'baf': enBafut,
  'bak': enBakossi,
  'bga': enBangwa,
  'kom': enKom,
  'dua': enDuala,
  'nge': enNgemba,
  'byi': enBayangi,
  'mgk': enMungaka,
  'oro': enOroko,
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

  // 🟢 CAMEROONIAN DIALECTS CONFIGURATION
  const cameroonianDialects = ['bga', 'bkw', 'bak', 'byi', 'kom', 'nge', 'mgk', 'bam', 'dua', 'baf', 'oro'];

  const languages = [
    { code: "auto", name: "Auto Detect" },
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "pt", name: "Portuguese" },
    { code: "ru", name: "Russian" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "zh-Hans", name: "Chinese (Simplified)" },
    { code: "zh-Hant", name: "Chinese (Traditional)" },
    { code: "ar", name: "Arabic" },
    { code: "hi", name: "Hindi" },
    { code: "bn", name: "Bengali" },
    { code: "pa", name: "Punjabi" },
    { code: "ur", name: "Urdu" },
    { code: "tr", name: "Turkish" },
    { code: "vi", name: "Vietnamese" },
    { code: "th", name: "Thai" },
    { code: "id", name: "Indonesian" },
    { code: "nl", name: "Dutch" },
    { code: "pl", name: "Polish" },
    { code: "uk", name: "Ukrainian" },
    { code: "el", name: "Greek" },
    { code: "cs", name: "Czech" },
    { code: "sv", name: "Swedish" },
    { code: "da", name: "Danish" },
    { code: "fi", name: "Finnish" },
    { code: "no", name: "Norwegian" },
    { code: "ro", name: "Romanian" },
    { code: "hu", name: "Hungarian" },
    { code: "sk", name: "Slovak" },
    { code: "bg", name: "Bulgarian" },
    { code: "hr", name: "Croatian" },
    { code: "sr", name: "Serbian" },
    { code: "sl", name: "Slovenian" },
    { code: "lt", name: "Lithuanian" },
    { code: "lv", name: "Latvian" },
    { code: "et", name: "Estonian" },
    { code: "mt", name: "Maltese" },
    { code: "sw", name: "Swahili" },
    { code: "yo", name: "Yoruba" },
    { code: "ig", name: "Igbo" },
    { code: "ha", name: "Hausa" },
    { code: "zu", name: "Zulu" },
    { code: "xh", name: "Xhosa" },
    { code: "st", name: "Sesotho" },
    { code: "tn", name: "Tswana" },
    { code: "sn", name: "Shona" },
    { code: "am", name: "Amharic" },
    { code: "so", name: "Somali" },
    { code: "mg", name: "Malagasy" },
    { code: "fa", name: "Persian" },
    { code: "he", name: "Hebrew" },
    { code: "ps", name: "Pashto" },
    { code: "ku", name: "Kurdish" },
    { code: "ta", name: "Tamil" },
    { code: "te", name: "Telugu" },
    { code: "mr", name: "Marathi" },
    { code: "gu", name: "Gujarati" },
    { code: "kn", name: "Kannada" },
    { code: "ml", name: "Malayalam" },
    { code: "si", name: "Sinhala" },
    { code: "my", name: "Burmese" },
    { code: "km", name: "Khmer" },
    { code: "lo", name: "Lao" },
    { code: "fil", name: "Filipino" },
    { code: "ms", name: "Malay" },
    { code: "ca", name: "Catalan" },
    { code: "eu", name: "Basque" },
    { code: "gl", name: "Galician" },
    { code: "is", name: "Icelandic" },
    
    // 🟢 CAMEROONIAN DIALECTS
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
  ];

  // 🟢 ENHANCED DICTIONARY FUNCTIONS FOR PHRASES AND SENTENCES
  const normalizeText = (text: string): string => {
    return text.toLowerCase().trim().replace(/[.,?!]/g, '');
  };

  const translatePhrase = (text: string, translations: { [key: string]: string }, isReverse: boolean = false): string | null => {
    const normalizedInput = normalizeText(text);
    
    // First try exact phrase match
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

    // If it's a phrase with multiple words, try word-by-word translation
    if (normalizedInput.includes(' ')) {
      const words = normalizedInput.split(' ');
      let translatedWords: string[] = [];
      let someWordsTranslated = false;

      for (const word of words) {
        let translated = false;
        
        if (!isReverse) {
          // English to Dialect: Look for word in dictionary keys
          for (const [english, dialect] of Object.entries(translations)) {
            if (normalizeText(english) === word) {
              translatedWords.push(dialect as string);
              translated = true;
              someWordsTranslated = true;
              break;
            }
          }
        } else {
          // Dialect to English: Look for word in dictionary values
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
          translatedWords.push(word); // Keep original word
        }
      }

      // If we translated at least some words, return the result
      if (someWordsTranslated) {
        return translatedWords.join(' ');
      }
    }

    return null;
  };

  // 🟢 NEW FUNCTION: TRANSLATE DIALECT TO INTERNATIONAL LANGUAGE
  const translateDialectToInternational = async (text: string, sourceDialect: string, targetInternational: string): Promise<string> => {
    console.log(`🌍 Translating ${sourceDialect} → ${targetInternational} via English bridge`);
    
    // Step 1: Translate dialect to English using dictionary
    const sourceDict = dictionaries[sourceDialect];
    if (!sourceDict?.translations) {
      return `[${sourceDict?.targetLanguage || sourceDialect} dictionary not loaded]`;
    }
    
    let englishText = '';
    const normalizedInput = normalizeText(text);
    
    // Try exact match first
    for (const [english, dialect] of Object.entries(sourceDict.translations)) {
      if (normalizeText(dialect as string) === normalizedInput) {
        englishText = english;
        break;
      }
    }
    
    // Try case-insensitive match
    if (!englishText) {
      for (const [english, dialect] of Object.entries(sourceDict.translations)) {
        if (normalizeText(dialect as string) === normalizedInput) {
          englishText = english;
          break;
        }
      }
    }
    
    // Try phrase translation
    if (!englishText) {
      const phraseResult = translatePhrase(text, sourceDict.translations, true);
      if (phraseResult) {
        englishText = phraseResult;
      }
    }
    
    if (!englishText) {
      return `[Cannot translate from ${sourceDict.targetLanguage} to English]`;
    }
    
    console.log(`✅ ${sourceDict.targetLanguage} → English: "${text}" → "${englishText}"`);
    
    // Step 2: Translate English to international language using Azure
    try {
      const internationalText = await translateText(englishText, 'en', targetInternational);
      console.log(`✅ English → ${targetInternational}: "${englishText}" → "${internationalText}"`);
      return internationalText;
    } catch (err) {
      console.error("Azure Translation failed:", err);
      return `[Azure Translation Error for ${targetInternational}]`;
    }
  };

  // 🟢 NEW FUNCTION: TRANSLATE INTERNATIONAL LANGUAGE TO DIALECT
  const translateInternationalToDialect = async (text: string, sourceInternational: string, targetDialect: string): Promise<string> => {
    console.log(`🌍 Translating ${sourceInternational} → ${targetDialect} via English bridge`);
    
    // Step 1: Translate international language to English using Azure
    let englishText = '';
    try {
      englishText = await translateText(text, sourceInternational, 'en');
      console.log(`✅ ${sourceInternational} → English: "${text}" → "${englishText}"`);
    } catch (err) {
      console.error("Azure Translation failed:", err);
      return `[Azure Translation Error from ${sourceInternational}]`;
    }
    
    // Step 2: Translate English to dialect using dictionary
    const targetDict = dictionaries[targetDialect];
    if (!targetDict?.translations) {
      return `[${targetDict?.targetLanguage || targetDialect} dictionary not loaded]`;
    }
    
    const normalizedEnglish = normalizeText(englishText);
    
    // Try exact match first
    if (targetDict.translations[normalizedEnglish]) {
      const finalResult = targetDict.translations[normalizedEnglish] as string;
      console.log(`✅ English → ${targetDict.targetLanguage}: "${englishText}" → "${finalResult}"`);
      return finalResult;
    }
    
    // Try case-insensitive match
    for (const [english, dialect] of Object.entries(targetDict.translations)) {
      if (normalizeText(english) === normalizedEnglish) {
        console.log(`✅ English → ${targetDict.targetLanguage}: "${englishText}" → "${dialect}"`);
        return dialect as string;
      }
    }
    
    // Try phrase translation
    const phraseResult = translatePhrase(englishText, targetDict.translations, false);
    if (phraseResult) {
      console.log(`✅ English → ${targetDict.targetLanguage} phrase: "${englishText}" → "${phraseResult}"`);
      return phraseResult;
    }
    
    return `[Cannot translate from English to ${targetDict.targetLanguage}]`;
  };

  const translateWithDictionary = async (
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<string> => {
    if (!text.trim()) return '';
    
    // 🟢 ENGLISH TO DIALECT TRANSLATION
    if (sourceLang === 'en' && isCameroonianDialect(targetLang)) {
      const dictionary = dictionaries[targetLang];
      if (!dictionary?.translations) {
        return `[${dictionary?.targetLanguage || targetLang} dictionary not loaded]`;
      }
      
      // Try exact match first
      const normalizedInput = normalizeText(text);
      if (dictionary.translations[normalizedInput]) {
        return dictionary.translations[normalizedInput] as string;
      }
      
      // Try case-insensitive match
      for (const [english, dialect] of Object.entries(dictionary.translations)) {
        if (normalizeText(english) === normalizedInput) {
          return dialect as string;
        }
      }
      
      // Try phrase translation
      const phraseResult = translatePhrase(text, dictionary.translations, false);
      if (phraseResult) {
        return phraseResult;
      }
      
      return `[No ${dictionary.targetLanguage} translation for "${text}"]`;
    }
    
    // 🟢 DIALECT TO ENGLISH TRANSLATION
    if (isCameroonianDialect(sourceLang) && targetLang === 'en') {
      const dictionary = dictionaries[sourceLang];
      if (!dictionary?.translations) {
        return `[${dictionary?.targetLanguage || sourceLang} dictionary not loaded]`;
      }
      
      const normalizedInput = normalizeText(text);
      
      // Look for exact reverse match
      for (const [english, dialect] of Object.entries(dictionary.translations)) {
        if (normalizeText(dialect as string) === normalizedInput) {
          return english;
        }
      }
      
      // Try case-insensitive reverse match
      for (const [english, dialect] of Object.entries(dictionary.translations)) {
        if (normalizeText(dialect as string) === normalizedInput) {
          return english;
        }
      }
      
      // Try phrase translation
      const phraseResult = translatePhrase(text, dictionary.translations, true);
      if (phraseResult) {
        return phraseResult;
      }
      
      return `[No English translation for "${text}" in ${dictionary.targetLanguage}]`;
    }
    
    // 🟢 DIALECT TO DIALECT TRANSLATION (via English bridge)
    if (isCameroonianDialect(sourceLang) && isCameroonianDialect(targetLang)) {
      console.log(`🎯 Translating ${sourceLang} → ${targetLang} via English bridge`);
      
      const sourceDict = dictionaries[sourceLang];
      const targetDict = dictionaries[targetLang];
      
      if (!sourceDict?.translations) {
        return `[${sourceDict?.targetLanguage || sourceLang} dictionary not loaded]`;
      }
      if (!targetDict?.translations) {
        return `[${targetDict?.targetLanguage || targetLang} dictionary not loaded]`;
      }
      
      // Step 1: Translate source dialect to English
      let englishText = '';
      const normalizedInput = normalizeText(text);
      
      // Try exact match first
      for (const [english, dialect] of Object.entries(sourceDict.translations)) {
        if (normalizeText(dialect as string) === normalizedInput) {
          englishText = english;
          break;
        }
      }
      
      // Try case-insensitive match
      if (!englishText) {
        for (const [english, dialect] of Object.entries(sourceDict.translations)) {
          if (normalizeText(dialect as string) === normalizedInput) {
            englishText = english;
            break;
          }
        }
      }
      
      // Try phrase translation
      if (!englishText) {
        const phraseResult = translatePhrase(text, sourceDict.translations, true);
        if (phraseResult) {
          englishText = phraseResult;
        }
      }
      
      if (!englishText) {
        return `[Cannot translate from ${sourceDict.targetLanguage} to English]`;
      }
      
      console.log(`✅ ${sourceDict.targetLanguage} → English: "${text}" → "${englishText}"`);
      
      // Step 2: Translate English to target dialect
      const normalizedEnglish = normalizeText(englishText);
      
      // Try exact match first
      if (targetDict.translations[normalizedEnglish]) {
        const finalResult = targetDict.translations[normalizedEnglish] as string;
        console.log(`✅ English → ${targetDict.targetLanguage}: "${englishText}" → "${finalResult}"`);
        return finalResult;
      }
      
      // Try case-insensitive match
      for (const [english, dialect] of Object.entries(targetDict.translations)) {
        if (normalizeText(english) === normalizedEnglish) {
          console.log(`✅ English → ${targetDict.targetLanguage}: "${englishText}" → "${dialect}"`);
          return dialect as string;
        }
      }
      
      // Try phrase translation
      const phraseResult = translatePhrase(englishText, targetDict.translations, false);
      if (phraseResult) {
        console.log(`✅ English → ${targetDict.targetLanguage} phrase: "${englishText}" → "${phraseResult}"`);
        return phraseResult;
      }
      
      return `[Cannot translate from English to ${targetDict.targetLanguage}]`;
    }
    
    return `[Unsupported translation: ${sourceLang} to ${targetLang}]`;
  };

  const isCameroonianDialect = (langCode: string): boolean => {
    return cameroonianDialects.includes(langCode);
  };

  // 🟢 AUTO-TRANSLATE when input or languages change
  useEffect(() => {
    if (input.trim()) {
      handleTranslate();
    } else {
      setOutput("");
    }
  }, [input, sourceLang, targetLang]);

  // 🟢 INTERCHANGE LANGUAGES FUNCTION
  const swapLanguages = () => {
    if (sourceLang === "auto") {
      Alert.alert("Cannot Swap", "Cannot swap when source is set to auto-detect.");
      return;
    }
    
    const prevSource = sourceLang;
    const prevTarget = targetLang;
    
    setSourceLang(prevTarget);
    setTargetLang(prevSource);
    
    if (output && output !== "[Azure Translation Error]" && !output.includes("[Dictionary")) {
      setInput(output);
      setOutput(input);
    }
  };

  // 🟢 UPDATED TRANSLATION FUNCTION WITH SAVE FEATURE
  const handleTranslate = async () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    const isCameroonianSource = isCameroonianDialect(sourceLang);
    const isCameroonianTarget = isCameroonianDialect(targetLang);

    // 🟢 NEW: DIALECT TO INTERNATIONAL LANGUAGE TRANSLATION
    if (isCameroonianSource && !isCameroonianTarget && targetLang !== 'en') {
      setIsLoading(true);
      try {
        const translatedText = await translateDialectToInternational(input, sourceLang, targetLang);
        setOutput(translatedText);
        // 🟢 ADDED: Save successful translation
        if (translatedText && !translatedText.includes('[')) {
          await saveTranslation({
            source_text: input,
            translated_text: translatedText,
            source_language: sourceLang,
            target_language: targetLang,
            translation_type: 'text'
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

    // 🟢 NEW: INTERNATIONAL LANGUAGE TO DIALECT TRANSLATION
    if (!isCameroonianSource && sourceLang !== 'en' && isCameroonianTarget) {
      setIsLoading(true);
      try {
        const translatedText = await translateInternationalToDialect(input, sourceLang, targetLang);
        setOutput(translatedText);
        // 🟢 ADDED: Save successful translation
        if (translatedText && !translatedText.includes('[')) {
          await saveTranslation({
            source_text: input,
            translated_text: translatedText,
            source_language: sourceLang,
            target_language: targetLang,
            translation_type: 'text'
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

    // 🟢 HANDLE ALL CAMEROONIAN DIALECT SCENARIOS
    if ((isCameroonianSource && targetLang === 'en') || 
        (sourceLang === 'en' && isCameroonianTarget) ||
        (isCameroonianSource && isCameroonianTarget)) {
      setIsLoading(true);
      try {
        const translatedText = await translateWithDictionary(input, sourceLang, targetLang);
        setOutput(translatedText);
        // 🟢 ADDED: Save successful translation
        if (translatedText && !translatedText.includes('[') && !translatedText.includes('No ')) {
          await saveTranslation({
            source_text: input,
            translated_text: translatedText,
            source_language: sourceLang,
            target_language: targetLang,
            translation_type: 'text'
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

    // Use Azure for other languages
    setIsLoading(true);
    try {
      const translatedText = await translateText(input, sourceLang, targetLang);
      setOutput(translatedText);
      // 🟢 ADDED: Save successful translation
      if (translatedText && translatedText !== "[Azure Translation Error]") {
        await saveTranslation({
          source_text: input,
          translated_text: translatedText,
          source_language: sourceLang,
          target_language: targetLang,
          translation_type: 'text'
        });
      }
    } catch (err) {
      console.error("Azure Translation failed:", err);
      setOutput("[Azure Translation Error]");
    } finally {
      setIsLoading(false);
    }
  };

  const copyOutput = async () => {
    Alert.alert("Copied", "Text copied to clipboard");
  };

  // 🟢 SPEAK OUTPUT FUNCTION
  const speakOutput = async () => {
    if (!output || output.includes("[Error]") || output.includes("[Dictionary") || output.includes("[No translation")) {
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
        'en': 'en-US', 'es': 'es-ES', 'fr': 'fr-FR', 'de': 'de-DE',
      };

      const speechLanguage = languageMap[targetLang] || 'en-US';
      
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
    return languages.find(lang => lang.code === code)?.name || code;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color={COLORS.gold} />
      </TouchableOpacity>

      <Text style={styles.title}>🌐 Text Translator</Text>

      <View style={styles.supportIndicator}>
        <Ionicons name="globe-outline" size={16} color={COLORS.forestGreen} />
        <Text style={styles.supportText}>
          Azure + {cameroonianDialects.length} Cameroonian Dialects
        </Text>
      </View>

      <View style={styles.debugInfo}>
        <Text style={styles.debugInfoText}>
          💡 Now supports dialect ↔ international language translation!
        </Text>
      </View>

      <View style={styles.languageContainer}>
        <View style={styles.pickerWrapper}>
          <Text style={styles.label}>From:</Text>
          <TouchableOpacity
            style={styles.customPicker}
            onPress={() => {
              setIsSelectingSource(true);
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
              setShowLangModal(true);
            }}
          >
            <Text style={styles.pickerText}>{getLanguageName(targetLang)}</Text>
            <Ionicons name="chevron-down" size={20} color={COLORS.gold} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showLangModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLangModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isSelectingSource ? "Select Source Language" : "Select Target Language"}
            </Text>
            
            <FlatList
              data={languages}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.langItem,
                    isCameroonianDialect(item.code) && styles.cameroonLangItem
                  ]}
                  onPress={() => {
                    if (isSelectingSource) setSourceLang(item.code);
                    else setTargetLang(item.code);
                    setShowLangModal(false);
                  }}
                >
                  <Text style={[
                    styles.langText,
                    isCameroonianDialect(item.code) && styles.cameroonLangText
                  ]}>
                    {item.name} {isCameroonianDialect(item.code) && "🇨🇲"}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowLangModal(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
        {isLoading && <ActivityIndicator color={COLORS.gold} style={styles.loader} />}
      </View>

      <View style={styles.outputContainer}>
        <Text style={styles.outputText}>
          {output || (
            isCameroonianDialect(sourceLang) || isCameroonianDialect(targetLang)
              ? "Cameroonian translation will appear here..."
              : "Translation will appear here..."
          )}
        </Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity onPress={speakOutput} style={styles.speakerButton}>
            <Ionicons 
              name={isSpeaking ? "stop-circle" : "volume-high"} 
              size={28} 
              color={isSpeaking ? COLORS.forestGreen : COLORS.gold} 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={copyOutput}>
            <Ionicons name="copy" size={28} color={COLORS.gold} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.testInfo}>
        <Text style={styles.testInfoText}>
          • Azure: International languages{"\n"}
          • English ↔ Dialects: Words, phrases & sentences{"\n"}
          • Dialect ↔ Dialect: Via English bridge (Bakweri→Bakossi){"\n"}
          • Dialect ↔ International: Via English bridge (Bakweri→French){"\n"}
          • Partial translations for unknown words
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
    alignSelf: 'flex-start',
  },
  title: { 
    fontSize: 24, 
    fontWeight: "bold", 
    color: COLORS.gold, 
    marginBottom: 10, 
    textAlign: "center" 
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
    marginLeft: 8 
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
    textAlign: 'center',
  },
  languageContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    marginBottom: 20 
  },
  pickerWrapper: { 
    flex: 1, 
    marginHorizontal: 5 
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
    alignItems: "center" 
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
    alignItems: "center" 
  },
  modalContent: { 
    backgroundColor: COLORS.black, 
    borderRadius: 12, 
    padding: 20, 
    width: "90%", 
    maxHeight: "80%", 
    borderWidth: 2, 
    borderColor: COLORS.gold 
  },
  modalTitle: { 
    color: COLORS.gold, 
    fontSize: 18, 
    fontWeight: "bold", 
    marginBottom: 15, 
    textAlign: "center" 
  },
  langItem: { 
    paddingVertical: 12, 
    borderBottomColor: "rgba(212, 175, 55, 0.2)", 
    borderBottomWidth: 1 
  },
  langText: { 
    color: COLORS.gold, 
    fontSize: 16, 
    textAlign: "center" 
  },
  cameroonLangItem: {
    backgroundColor: "rgba(212, 175, 55, 0.05)",
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
  },
  cameroonLangText: {
    fontWeight: "600",
  },
  modalCloseButton: { 
    backgroundColor: COLORS.gold, 
    borderRadius: 20, 
    paddingVertical: 12, 
    marginTop: 10 
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
    marginBottom: 15 
  },
  textInput: { 
    color: COLORS.gold, 
    fontSize: 16, 
    minHeight: 100,
    textAlignVertical: 'top',
  },
  loader: { 
    marginTop: 10 
  },
  outputContainer: { 
    backgroundColor: COLORS.black, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: COLORS.gold, 
    padding: 15, 
    minHeight: 100, 
    marginBottom: 15 
  },
  outputText: { 
    color: COLORS.gold, 
    fontSize: 16, 
    marginBottom: 10 
  },
  actionsContainer: { 
    flexDirection: "row", 
    justifyContent: "flex-end",
    gap: 15,
  },
  speakerButton: {},
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
    textAlign: 'center',
  },
});