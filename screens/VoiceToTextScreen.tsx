// screens/VoiceToTextScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
  Platform
} from 'react-native';

// ==================== REMOVED OPENAI API KEY ====================
// OpenAI API key is now stored securely in Supabase Edge Function
// ==================== END CONFIGURATION ====================

// 🟢 Supabase import
import { supabase } from '../supabase';
// 🟢 Use new word limit hook
import { useWordLimits } from '../hooks/useWordLimits';
// 🟢 Limit exceeded modal import
import LimitExceededModal from '../components/LimitExceededModal';
// 🟢 Import translateText utility for Azure translations
import { translateText } from '../utils/translateText';

// 🟢 Import DICTIONARIES for Cameroonian dialects
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

// 🟢 Cameroonian dialects configuration
const cameroonianDialects = ['bga', 'bkw', 'bak', 'byi', 'kom', 'nge', 'mgk', 'bam', 'dua', 'baf', 'oro'];

// 🟢 Function to check if language is a Cameroonian dialect
const isCameroonianDialect = (langCode: string): boolean => {
  return cameroonianDialects.includes(langCode);
};

// 🟢 Function to normalize text for dictionary lookup
const normalizeText = (text: string): string => {
  return text.toLowerCase().trim().replace(/[.,?!]/g, '');
};

// 🟢 Function to translate English to Dialect using dictionary
const translateEnglishToDialect = (text: string, targetDialect: string): string => {
  const dictionary = dictionaries[targetDialect];
  if (!dictionary?.translations) {
    return `[${dictionary?.targetLanguage || targetDialect} dictionary not loaded]`;
  }
  
  const normalizedInput = normalizeText(text);
  
  // Try exact match first
  if (dictionary.translations[normalizedInput]) {
    return dictionary.translations[normalizedInput] as string;
  }
  
  // Try case-insensitive match
  for (const [english, dialect] of Object.entries(dictionary.translations)) {
    if (normalizeText(english) === normalizedInput) {
      return dialect as string;
    }
  }
  
  // Try word-by-word translation for phrases
  if (normalizedInput.includes(' ')) {
    const words = normalizedInput.split(' ');
    let translatedWords: string[] = [];
    let someWordsTranslated = false;

    for (const word of words) {
      let translated = false;
      
      // Look for word in dictionary keys
      for (const [english, dialect] of Object.entries(dictionary.translations)) {
        if (normalizeText(english) === word) {
          translatedWords.push(dialect as string);
          translated = true;
          someWordsTranslated = true;
          break;
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
  
  return `[No ${dictionary.targetLanguage} translation for "${text}"]`;
};

// 🟢 Function to translate Dialect to English using dictionary
const translateDialectToEnglish = (text: string, sourceDialect: string): string => {
  const dictionary = dictionaries[sourceDialect];
  if (!dictionary?.translations) {
    return `[${dictionary?.targetLanguage || sourceDialect} dictionary not loaded]`;
  }
  
  const normalizedInput = normalizeText(text);
  
  // Look for exact reverse match
  for (const [english, dialect] of Object.entries(dictionary.translations)) {
    if (normalizeText(dialect as string) === normalizedInput) {
      return english;
    }
  }
  
  // Try word-by-word reverse translation for phrases
  if (normalizedInput.includes(' ')) {
    const words = normalizedInput.split(' ');
    let translatedWords: string[] = [];
    let someWordsTranslated = false;

    for (const word of words) {
      let translated = false;
      
      // Look for word in dictionary values
      for (const [english, dialect] of Object.entries(dictionary.translations)) {
        if (normalizeText(dialect as string) === word) {
          translatedWords.push(english);
          translated = true;
          someWordsTranslated = true;
          break;
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
  
  return `[No English translation for "${text}" in ${dictionary.targetLanguage}]`;
};

// 🟢 Function to translate Dialect to Dialect (via English bridge)
const translateDialectToDialect = (text: string, sourceDialect: string, targetDialect: string): string => {
  console.log(`🎯 Translating ${sourceDialect} → ${targetDialect} via English bridge`);
  
  const sourceDict = dictionaries[sourceDialect];
  const targetDict = dictionaries[targetDialect];
  
  if (!sourceDict?.translations) {
    return `[${sourceDict?.targetLanguage || sourceDialect} dictionary not loaded]`;
  }
  if (!targetDict?.translations) {
    return `[${targetDict?.targetLanguage || targetDialect} dictionary not loaded]`;
  }
  
  // Step 1: Translate source dialect to English
  const englishText = translateDialectToEnglish(text, sourceDialect);
  
  if (englishText.includes('[')) {
    return englishText; // Return the error message
  }
  
  console.log(`✅ ${sourceDict.targetLanguage} → English: "${text}" → "${englishText}"`);
  
  // Step 2: Translate English to target dialect
  const finalResult = translateEnglishToDialect(englishText, targetDialect);
  
  if (!finalResult.includes('[')) {
    console.log(`✅ English → ${targetDict.targetLanguage}: "${englishText}" → "${finalResult}"`);
  }
  
  return finalResult;
};

// 🟢 Function to translate International Language to Dialect (via Azure)
const translateInternationalToDialect = async (
  text: string, 
  sourceInternational: string, 
  targetDialect: string
): Promise<string> => {
  console.log(`🌍 Translating ${sourceInternational} → ${targetDialect} via Azure + English bridge`);
  
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
  const finalResult = translateEnglishToDialect(englishText, targetDialect);
  return finalResult;
};

// 🟢 Function to translate Dialect to International Language (via Azure)
const translateDialectToInternational = async (
  text: string, 
  sourceDialect: string, 
  targetInternational: string
): Promise<string> => {
  console.log(`🌍 Translating ${sourceDialect} → ${targetInternational} via English bridge + Azure`);
  
  // Step 1: Translate dialect to English using dictionary
  const englishText = translateDialectToEnglish(text, sourceDialect);
  
  if (englishText.includes('[')) {
    return englishText; // Return the error message
  }
  
  console.log(`✅ ${sourceDialect} → English: "${text}" → "${englishText}"`);
  
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

// 🟢 Word counting function (same as in TranslationHistory)
const countValidWords = (text: string): number => {
  if (!text || text.trim().length === 0) return 0;
  
  // Remove URLs, emails, and special patterns
  const cleanText = text
    .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '') // Remove emails
    .replace(/[^\w\s']|_/g, ' ') // Replace punctuation with spaces (keep apostrophes)
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
  
  if (cleanText.length === 0) return 0;
  
  const words = cleanText.split(/\s+/);
  
  // Filter valid words with strict criteria
  const validWords = words.filter(word => {
    // Must have at least 2 characters
    if (word.length < 2) return false;
    
    // Must contain at least one letter (not just numbers or symbols)
    if (!/[a-zA-Z]/.test(word)) return false;
    
    // Common invalid patterns to exclude
    const invalidPatterns = [
      /^[0-9]+$/, // Only numbers
      /^[^a-zA-Z0-9]+$/, // Only symbols
      /^[a-zA-Z]{1}$/, // Single letter
    ];
    
    // Check if word matches any invalid pattern
    return !invalidPatterns.some(pattern => pattern.test(word));
  });
  
  return validWords.length;
};

// 🟢 Function to save voice translation to history
const saveVoiceTranslationToHistory = async (
  sourceText: string, 
  translatedText: string, 
  sourceLanguage: string, 
  targetLanguage: string
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No user logged in, skipping save to history');
      return;
    }

    const wordCount = countValidWords(sourceText);
    
    console.log(`🟢 Saving voice translation: ${wordCount} valid words`);
    
    const { error } = await supabase
      .from('user_translations')
      .insert({
        user_id: user.id,
        source_text: sourceText,
        translated_text: translatedText,
        source_language: sourceLanguage,
        target_language: targetLanguage,
        translation_type: 'voice',
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error saving voice translation:', error);
    } else {
      console.log('✅ Voice translation saved to history');
    }
  } catch (error) {
    console.error('Error saving voice translation:', error);
  }
};

// 🟢 Helper function to convert URI to Blob (web compatible)
const uriToBlob = (uri: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function() {
      resolve(xhr.response);
    };
    xhr.onerror = function() {
      reject(new Error('Failed to load audio file'));
    };
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
};

// 🟢 Helper function to convert Blob to base64 (web compatible)
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // Remove data URL prefix if present
        const base64 = reader.result.split(',')[1] || reader.result;
        resolve(base64);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const VoiceToTextScreen = ({ navigation }: any) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [debugInfo, setDebugInfo] = useState('');
  const [fromLanguage, setFromLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [showFromLanguageSelector, setShowFromLanguageSelector] = useState(false);
  const [showToLanguageSelector, setShowToLanguageSelector] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [searchFromQuery, setSearchFromQuery] = useState('');
  const [searchToQuery, setSearchToQuery] = useState('');

  // 🟢 Word count state for current translation
  const [currentWordCount, setCurrentWordCount] = useState(0);

  // 🟢 Use new word limit hook
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
    calculateWordCount
  } = useWordLimits();

  // 🟢 150+ languages categorized by continents (INCLUDING CAMEROONIAN DIALECTS)
  const languageCategories = [
    {
      name: 'Europe',
      languages: [
        { code: 'en', name: 'English', native: 'English', emoji: '🇬🇧' },
        { code: 'es', name: 'Spanish', native: 'Español', emoji: '🇪🇸' },
        { code: 'fr', name: 'French', native: 'Français', emoji: '🇫🇷' },
        { code: 'de', name: 'German', native: 'Deutsch', emoji: '🇩🇪' },
        { code: 'it', name: 'Italian', native: 'Italiano', emoji: '🇮🇹' },
        { code: 'pt', name: 'Portuguese', native: 'Português', emoji: '🇵🇹' },
        { code: 'ru', name: 'Russian', native: 'Русский', emoji: '🇷🇺' },
        { code: 'nl', name: 'Dutch', native: 'Nederlands', emoji: '🇳🇱' },
        { code: 'pl', name: 'Polish', native: 'Polski', emoji: '🇵🇱' },
        { code: 'sv', name: 'Swedish', native: 'Svenska', emoji: '🇸🇪' },
        { code: 'da', name: 'Danish', native: 'Dansk', emoji: '🇩🇰' },
        { code: 'no', name: 'Norwegian', native: 'Norsk', emoji: '🇳🇴' },
        { code: 'fi', name: 'Finnish', native: 'Suomi', emoji: '🇫🇮' },
        { code: 'cs', name: 'Czech', native: 'Čeština', emoji: '🇨🇿' },
        { code: 'hu', name: 'Hungarian', native: 'Magyar', emoji: '🇭🇺' },
        { code: 'ro', name: 'Romanian', native: 'Română', emoji: '🇷🇴' },
        { code: 'el', name: 'Greek', native: 'Ελληνικά', emoji: '🇬🇷' },
        { code: 'bg', name: 'Bulgarian', native: 'Български', emoji: '🇧🇬' },
        { code: 'sk', name: 'Slovak', native: 'Slovenčina', emoji: '🇸🇰' },
        { code: 'hr', name: 'Croatian', native: 'Hrvatski', emoji: '🇭🇷' },
        { code: 'sr', name: 'Serbian', native: 'Српски', emoji: '🇷🇸' },
        { code: 'bs', name: 'Bosnian', native: 'Bosanski', emoji: '🇧🇦' },
        { code: 'sl', name: 'Slovenian', native: 'Slovenščina', emoji: '🇸🇮' },
        { code: 'lt', name: 'Lithuanian', native: 'Lietuvių', emoji: '🇱🇹' },
        { code: 'lv', name: 'Latvian', native: 'Latviešu', emoji: '🇱🇻' },
        { code: 'et', name: 'Estonian', native: 'Eesti', emoji: '🇪🇪' },
        { code: 'mt', name: 'Maltese', native: 'Malti', emoji: '🇲🇹' },
        { code: 'ga', name: 'Irish', native: 'Gaeilge', emoji: '🇮🇪' },
        { code: 'cy', name: 'Welsh', native: 'Cymraeg', emoji: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
        { code: 'is', name: 'Icelandic', native: 'Íslenska', emoji: '🇮🇸' },
        { code: 'sq', name: 'Albanian', native: 'Shqip', emoji: '🇦🇱' },
        { code: 'mk', name: 'Macedonian', native: 'Македонски', emoji: '🇲🇰' },
        { code: 'hy', name: 'Armenian', native: 'Հայերեն', emoji: '🇦🇲' },
        { code: 'ka', name: 'Georgian', native: 'ქართული', emoji: '🇬🇪' },
        { code: 'az', name: 'Azerbaijani', native: 'Azərbaycanca', emoji: '🇦🇿' },
        { code: 'be', name: 'Belarusian', native: 'Беларуская', emoji: '🇧🇾' },
        { code: 'uk', name: 'Ukrainian', native: 'Українська', emoji: '🇺🇦' },
        { code: 'fo', name: 'Faroese', native: 'Føroyskt', emoji: '🇫🇴' },
        { code: 'gv', name: 'Manx', native: 'Gaelg', emoji: '🇮🇲' },
        { code: 'kw', name: 'Cornish', native: 'Kernewek', emoji: '🇬🇧' },
        { code: 'br', name: 'Breton', native: 'Brezhoneg', emoji: '🇫🇷' },
        { code: 'os', name: 'Ossetian', native: 'Ирон', emoji: '🇬🇪' },
        { code: 'csb', name: 'Kashubian', native: 'Kaszëbsczi', emoji: '🇵🇱' },
      ]
    },
    {
      name: 'Asia',
      languages: [
        { code: 'zh-Hans', name: 'Chinese (Simplified)', native: '简体中文', emoji: '🇨🇳' },
        { code: 'zh-Hant', name: 'Chinese (Traditional)', native: '繁體中文', emoji: '🇭🇰' },
        { code: 'ja', name: 'Japanese', native: '日本語', emoji: '🇯🇵' },
        { code: 'ko', name: 'Korean', native: '한국어', emoji: '🇰🇷' },
        { code: 'hi', name: 'Hindi', native: 'हिन्दी', emoji: '🇮🇳' },
        { code: 'ar', name: 'Arabic', native: 'العربية', emoji: '🇸🇦' },
        { code: 'tr', name: 'Turkish', native: 'Türkçe', emoji: '🇹🇷' },
        { code: 'th', name: 'Thai', native: 'ไทย', emoji: '🇹🇭' },
        { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt', emoji: '🇻🇳' },
        { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', emoji: '🇮🇩' },
        { code: 'ms', name: 'Malay', native: 'Bahasa Melayu', emoji: '🇲🇾' },
        { code: 'fil', name: 'Filipino', native: 'Filipino', emoji: '🇵🇭' },
        { code: 'ur', name: 'Urdu', native: 'اردو', emoji: '🇵🇰' },
        { code: 'fa', name: 'Persian', native: 'فارسی', emoji: '🇮🇷' },
        { code: 'he', name: 'Hebrew', native: 'עברית', emoji: '🇮🇱' },
        { code: 'bn', name: 'Bengali', native: 'বাংলা', emoji: '🇧🇩' },
        { code: 'ta', name: 'Tamil', native: 'தமிழ்', emoji: '🇮🇳' },
        { code: 'te', name: 'Telugu', native: 'తెలుగు', emoji: '🇮🇳' },
        { code: 'mr', name: 'Marathi', native: 'मराठी', emoji: '🇮🇳' },
        { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', emoji: '🇮🇳' },
        { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', emoji: '🇮🇳' },
        { code: 'ml', name: 'Malayalam', native: 'മലയാളം', emoji: '🇮🇳' },
        { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', emoji: '🇮🇳' },
        { code: 'si', name: 'Sinhala', native: 'සිංහල', emoji: '🇱🇰' },
        { code: 'my', name: 'Burmese', native: 'မြန်မာစာ', emoji: '🇲🇲' },
        { code: 'km', name: 'Khmer', native: 'ភាសាខ្មែរ', emoji: '🇰🇭' },
        { code: 'lo', name: 'Lao', native: 'ພາສາລາວ', emoji: '🇱🇦' },
        { code: 'ne', name: 'Nepali', native: 'नेपाली', emoji: '🇳🇵' },
        { code: 'sd', name: 'Sindhi', native: 'سنڌي', emoji: '🇵🇰' },
        { code: 'ps', name: 'Pashto', native: 'پښتو', emoji: '🇦🇫' },
        { code: 'ku', name: 'Kurdish', native: 'Kurdî', emoji: '🇹🇷' },
        { code: 'kk', name: 'Kazakh', native: 'Қазақша', emoji: '🇰🇿' },
        { code: 'uz', name: 'Uzbek', native: 'Oʻzbekcha', emoji: '🇺🇿' },
        { code: 'ky', name: 'Kyrgyz', native: 'Кыргызча', emoji: '🇰🇬' },
        { code: 'tg', name: 'Tajik', native: 'Тоҷикӣ', emoji: '🇹🇯' },
        { code: 'tk', name: 'Turkmen', native: 'Türkmençe', emoji: '🇹🇲' },
        { code: 'mn', name: 'Mongolian', native: 'Монгол', emoji: '🇲🇳' },
        { code: 'bo', name: 'Tibetan', native: 'བོད་སྐད་', emoji: '🇨🇳' },
        { code: 'ug', name: 'Uyghur', native: 'ئۇيغۇرچە', emoji: '🇨🇳' },
        { code: 'dz', name: 'Dzongkha', native: 'རྫོང་ཁ', emoji: '🇧🇹' },
        { code: 'yue', name: 'Cantonese', native: '廣東話', emoji: '🇭🇰' },
        { code: 'hmn', name: 'Hmong', native: 'Hmoob', emoji: '🇨🇳' },
        { code: 'mnw', name: 'Mon', native: 'ဘာသာ မန်', emoji: '🇲🇲' },
        { code: 'shn', name: 'Shan', native: 'လိၵ်ႈတႆး', emoji: '🇲🇲' },
      ]
    },
    {
      name: 'Middle East & Central Asia',
      languages: [
        { code: 'bal', name: 'Balochi', native: 'بلۏچی', emoji: '🇵🇰' },
        { code: 'prs', name: 'Dari', native: 'دری', emoji: '🇦🇫' },
        { code: 'ckb', name: 'Kurdish (Sorani)', native: 'کوردیی سۆرانی', emoji: '🇮🇶' },
        { code: 'yi', name: 'Yiddish', native: 'ייִדיש', emoji: '🇮🇱' },
        { code: 'kaa', name: 'Karakalpak', native: 'Qaraqalpaqsha', emoji: '🇺🇿' },
        { code: 'kum', name: 'Kumyk', native: 'Къумукъ', emoji: '🇷🇺' },
        { code: 'nog', name: 'Nogai', native: 'Ногай тили', emoji: '🇷🇺' },
      ]
    },
    {
      name: 'Africa',
      languages: [
        { code: 'sw', name: 'Swahili', native: 'Kiswahili', emoji: '🇰🇪' },
        { code: 'am', name: 'Amharic', native: 'አማርኛ', emoji: '🇪🇹' },
        { code: 'yo', name: 'Yoruba', native: 'Yorùbá', emoji: '🇳🇬' },
        { code: 'ig', name: 'Igbo', native: 'Igbo', emoji: '🇳🇬' },
        { code: 'ha', name: 'Hausa', native: 'Hausa', emoji: '🇳🇬' },
        { code: 'zu', name: 'Zulu', native: 'isiZulu', emoji: '🇿🇦' },
        { code: 'xh', name: 'Xhosa', native: 'isiXhosa', emoji: '🇿🇦' },
        { code: 'af', name: 'Afrikaans', native: 'Afrikaans', emoji: '🇿🇦' },
        { code: 'so', name: 'Somali', native: 'Soomaali', emoji: '🇸🇴' },
        { code: 'rw', name: 'Kinyarwanda', native: 'Kinyarwanda', emoji: '🇷🇼' },
        { code: 'mg', name: 'Malagasy', native: 'Malagasy', emoji: '🇲🇬' },
        { code: 'ny', name: 'Chichewa', native: 'Chichewa', emoji: '🇲🇼' },
        { code: 'st', name: 'Sesotho', native: 'Sesotho', emoji: '🇱🇸' },
        { code: 'tn', name: 'Setswana', native: 'Setswana', emoji: '🇧🇼' },
        { code: 'ss', name: 'Swati', native: 'SiSwati', emoji: '🇸🇿' },
        { code: 've', name: 'Venda', native: 'Tshivenḓa', emoji: '🇿🇦' },
        { code: 'ts', name: 'Tsonga', native: 'Xitsonga', emoji: '🇿🇦' },
        { code: 'nso', name: 'Northern Sotho', native: 'Sesotho sa Leboa', emoji: '🇿🇦' },
        { code: 'bm', name: 'Bambara', native: 'Bamanankan', emoji: '🇲🇱' },
        { code: 'ff', name: 'Fula', native: 'Fulfulde', emoji: '🇬🇳' },
        { code: 'wo', name: 'Wolof', native: 'Wolof', emoji: '🇸🇳' },
        { code: 'ln', name: 'Lingala', native: 'Lingála', emoji: '🇨🇩' },
        { code: 'sg', name: 'Sango', native: 'Sängö', emoji: '🇨🇫' },
        { code: 'rn', name: 'Rundi', native: 'Ikirundi', emoji: '🇧🇮' },
        { code: 'sn', name: 'Shona', native: 'ChiShona', emoji: '🇿🇼' },
        { code: 'lg', name: 'Ganda', native: 'Luganda', emoji: '🇺🇬' },
        { code: 'om', name: 'Oromo', native: 'Afaan Oromoo', emoji: '🇪🇹' },
        { code: 'ti', name: 'Tigrinya', native: 'ትግርኛ', emoji: '🇪🇷' },
        { code: 'ber', name: 'Berber', native: 'Tamaziɣt', emoji: '🇲🇦' },
        { code: 'ki', name: 'Kikuyu', native: 'Gĩkũyũ', emoji: '🇰🇪' },
        { code: 'kmb', name: 'Kimbundu', native: 'Kimbundu', emoji: '🇦🇴' },
        { code: 'lu', name: 'Luba-Katanga', native: 'Kiluba', emoji: '🇨🇩' },
        { code: 'nd', name: 'Ndebele', native: 'isiNdebele', emoji: '🇿🇼' },
        { code: 'nr', name: 'Southern Ndebele', native: 'isiNdebele', emoji: '🇿🇦' },
        { code: 'lua', name: 'Tshiluba', native: 'Tshiluba', emoji: '🇨🇩' },
        { code: 'tig', name: 'Tigre', native: 'ትግረ', emoji: '🇪🇷' },
        { code: 'aa', name: 'Afar', native: 'Afaraf', emoji: '🇪🇷' },
      ]
    },
    {
      name: 'Americas & Oceania',
      languages: [
        { code: 'en-US', name: 'English (US)', native: 'English', emoji: '🇺🇸' },
        { code: 'es-419', name: 'Spanish (Latin America)', native: 'Español Latinoamericano', emoji: '🇲🇽' },
        { code: 'pt-BR', name: 'Portuguese (Brazil)', native: 'Português Brasileiro', emoji: '🇧🇷' },
        { code: 'fr-CA', name: 'French (Canadian)', native: 'Français Canadien', emoji: '🇨🇦' },
        { code: 'qu', name: 'Quechua', native: 'Runa Simi', emoji: '🇵🇪' },
        { code: 'gn', name: 'Guarani', native: 'Avañe\'ẽ', emoji: '🇵🇾' },
        { code: 'ay', name: 'Aymara', native: 'Aymar', emoji: '🇧🇴' },
        { code: 'nah', name: 'Nahuatl', native: 'Nāhuatl', emoji: '🇲🇽' },
        { code: 'mi', name: 'Māori', native: 'Te Reo Māori', emoji: '🇳🇿' },
        { code: 'haw', name: 'Hawaiian', native: 'ʻŌlelo Hawaiʻi', emoji: '🇺🇸' },
        { code: 'sm', name: 'Samoan', native: 'Gagana Samoa', emoji: '🇼🇸' },
        { code: 'fj', name: 'Fijian', native: 'Vosa Vakaviti', emoji: '🇫🇯' },
        { code: 'to', name: 'Tongan', native: 'Lea Faka-Tonga', emoji: '🇹🇴' },
        { code: 'ty', name: 'Tahitian', native: 'Reo Tahiti', emoji: '🇵🇫' },
        { code: 'cr', name: 'Cree', native: 'Nēhiyawēwin', emoji: '🇨🇦' },
        { code: 'iu', name: 'Inuktitut', native: 'ᐃᓄᒃᑎᑐᑦ', emoji: '🇨🇦' },
        { code: 'arn', name: 'Mapudungun', native: 'Mapudungun', emoji: '🇨🇱' },
      ]
    },
    {
      name: 'Constructed & Other Languages',
      languages: [
        { code: 'eo', name: 'Esperanto', native: 'Esperanto', emoji: '🌐' },
        { code: 'ia', name: 'Interlingua', native: 'Interlingua', emoji: '🌐' },
        { code: 'tpi', name: 'Tok Pisin', native: 'Tok Pisin', emoji: '🇵🇬' },
        { code: 'pap', name: 'Papiamento', native: 'Papiamentu', emoji: '🇨🇼' },
      ]
    },
    {
      name: 'Cameroonian Dialects',
      languages: [
        { code: 'bga', name: 'Bangwa', native: 'Bangwa', emoji: '🇨🇲' },
        { code: 'bkw', name: 'Bakweri', native: 'Bakweri', emoji: '🇨🇲' },
        { code: 'bak', name: 'Bakossi', native: 'Bakossi', emoji: '🇨🇲' },
        { code: 'byi', name: 'Bayangi (Ejagham)', native: 'Ejagham', emoji: '🇨🇲' },
        { code: 'kom', name: 'Kom', native: 'Kom', emoji: '🇨🇲' },
        { code: 'nge', name: 'Ngemba', native: 'Ngemba', emoji: '🇨🇲' },
        { code: 'mgk', name: 'Mungaka (Bali)', native: 'Mungaka', emoji: '🇨🇲' },
        { code: 'bam', name: 'Bamileke', native: 'Bamileke', emoji: '🇨🇲' },
        { code: 'dua', name: 'Duala', native: 'Duala', emoji: '🇨🇲' },
        { code: 'baf', name: 'Bafut', native: 'Bafut', emoji: '🇨🇲' },
        { code: 'oro', name: 'Oroko', native: 'Oroko', emoji: '🇨🇲' },
      ]
    }
  ];

  // Flatten all languages for easy access
  const allLanguages = languageCategories.flatMap(category => category.languages);

  // 🟢 Function to get filtered languages based on search query
  const getFilteredLanguages = (query: string, type: 'from' | 'to') => {
    if (!query.trim()) {
      return languageCategories;
    }
    
    const searchQuery = query.toLowerCase().trim();
    const filteredCategories = languageCategories.map(category => ({
      ...category,
      languages: category.languages.filter(lang => 
        lang.name.toLowerCase().includes(searchQuery) || 
        lang.code.toLowerCase().includes(searchQuery) ||
        lang.native.toLowerCase().includes(searchQuery)
      )
    })).filter(category => category.languages.length > 0);
    
    return filteredCategories;
  };

  const currentFromSearchResults = getFilteredLanguages(searchFromQuery, 'from');
  const currentToSearchResults = getFilteredLanguages(searchToQuery, 'to');

  // 🟢 Language switcher function
  const switchLanguages = () => {
    const temp = fromLanguage;
    setFromLanguage(targetLanguage);
    setTargetLanguage(temp);
    
    const fromLang = allLanguages.find(l => l.code === temp);
    const toLang = allLanguages.find(l => l.code === fromLanguage);
    
    setDebugInfo(`🔄 Switched: ${fromLang?.emoji} ${fromLang?.name} ↔ ${toLang?.emoji} ${toLang?.name}`);
  };

  // 🟢 Handle upgrade button press
  const handleUpgrade = async () => {
    closeModal();
    Alert.alert(
      "Upgrade to Premium",
      "Choose your premium plan:",
      [
        {
          text: "1 Month - $9.99",
          onPress: async () => {
            const success = await upgradeToPremium('monthly');
            if (success) {
              Alert.alert("Success", "You've been upgraded to Premium for 30 days!");
              await loadLimitStatus();
            } else {
              Alert.alert("Error", "Failed to upgrade. Please try again.");
            }
          }
        },
        {
          text: "6 Months - $49.99",
          onPress: async () => {
            const success = await upgradeToPremium('6months');
            if (success) {
              Alert.alert("Success", "You've been upgraded to Premium for 180 days!");
              await loadLimitStatus();
            } else {
              Alert.alert("Error", "Failed to upgrade. Please try again.");
            }
          }
        },
        {
          text: "1 Year - $89.99",
          onPress: async () => {
            const success = await upgradeToPremium('yearly');
            if (success) {
              Alert.alert("Success", "You've been upgraded to Premium for 360 days!");
              await loadLimitStatus();
            } else {
              Alert.alert("Error", "Failed to upgrade. Please try again.");
            }
          }
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  // 🟢 TRANSLATION FUNCTION with DIALECT SUPPORT
  const translateTextWithDialectSupport = async (
    text: string, 
    fromLang: string, 
    toLang: string
  ): Promise<string> => {
    console.log(`🌍 Translating: ${fromLang} → ${toLang}`);
    
    const isCameroonianSource = isCameroonianDialect(fromLang);
    const isCameroonianTarget = isCameroonianDialect(toLang);
    
    // 🟢 CASE 1: English to Dialect
    if (fromLang === 'en' && isCameroonianTarget) {
      console.log('📚 Using local dictionary: English → Dialect');
      return translateEnglishToDialect(text, toLang);
    }
    
    // 🟢 CASE 2: Dialect to English
    if (isCameroonianSource && toLang === 'en') {
      console.log('📚 Using local dictionary: Dialect → English');
      return translateDialectToEnglish(text, fromLang);
    }
    
    // 🟢 CASE 3: Dialect to Dialect
    if (isCameroonianSource && isCameroonianTarget) {
      console.log('📚 Using local dictionary: Dialect → Dialect');
      return translateDialectToDialect(text, fromLang, toLang);
    }
    
    // 🟢 CASE 4: International Language to Dialect (via Azure + English bridge)
    if (!isCameroonianSource && isCameroonianTarget) {
      console.log('🌐 Using Azure + Dictionary: International → Dialect');
      return await translateInternationalToDialect(text, fromLang, toLang);
    }
    
    // 🟢 CASE 5: Dialect to International Language (via English bridge + Azure)
    if (isCameroonianSource && !isCameroonianTarget) {
      console.log('🌐 Using Dictionary + Azure: Dialect → International');
      return await translateDialectToInternational(text, fromLang, toLang);
    }
    
    // 🟢 CASE 6: International to International (use Azure or Edge Function)
    console.log('🌐 Using Azure for International → International');
    try {
      return await translateText(text, fromLang, toLang);
    } catch (err) {
      console.error("Azure translation failed, using Edge Function fallback:", err);
      return await translateWithEdgeFunction(text, fromLang, toLang);
    }
  };

  // ==================== UPDATED: Use Edge Function for translation ====================
  const translateWithEdgeFunction = async (text: string, fromLang: string, toLang: string): Promise<string> => {
    try {
      setDebugInfo(`🌍 Translating from ${getLanguageName(fromLang)} to ${getLanguageName(toLang)}...`);
      
      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: {
          action: 'translate',
          text,
          fromLanguage: fromLang,
          toLanguage: toLang
        }
      });

      if (error) {
        throw new Error(`Translation error: ${error.message}`);
      }

      if (data && data.translatedText) {
        setDebugInfo('✅ Translation successful!');
        return data.translatedText;
      } else {
        throw new Error('No translation received');
      }

    } catch (error: any) {
      console.error('Translation error:', error);
      setDebugInfo('❌ Translation failed, using fallback');
      return await translateWithFallback(text, toLang);
    }
  };

  // Fallback translation for common phrases
  const translateWithFallback = async (text: string, toLang: string): Promise<string> => {
    const commonTranslations: {[key: string]: {[key: string]: string}} = {
      'one, two, three, four': {
        'es': 'uno, dos, tres, cuatro',
        'fr': 'un, deux, trois, quatre',
        'de': 'eins, zwei, drei, vier',
        'it': 'uno, due, tre, quattro',
        'pt': 'um, dois, três, quatro',
        'ru': 'один, два, три, четыре',
        'ja': '一、二、三、四',
        'ko': '하나, 둘, 셋, 넷',
        'zh-Hans': '一、二、三、四',
        'zh-Hant': '一、二、三、四',
        'ar': 'واحد، اثنان، ثلاثة، أربعة',
        'hi': 'एक, दो, तीन, चार',
        'tr': 'bir, iki, üç, dört',
        'nl': 'een, twee, drie, vier',
        'sv': 'ett, två, tre, fyra',
        'pl': 'jeden, dwa, trzy, cztery',
      },
      'hello how are you': {
        'es': 'hola cómo estás',
        'fr': 'bonjour comment allez-vous',
        'de': 'hallo wie geht es dir',
        'it': 'ciao come stai',
        'pt': 'olá como você está',
        'ru': 'привет как дела',
        'ja': 'こんにちは、元気ですか',
        'ko': '안녕하세요、어떻게 지내세요?',
        'zh-Hans': '你好，你好吗？',
        'zh-Hant': '你好，你好嗎？',
        'ar': 'مرحبا كيف حالك',
        'hi': 'नमस्ते, आप कैसे हैं?',
        'tr': 'merhaba nasılsın',
        'nl': 'hallo hoe gaat het',
        'sv': 'hej hur mår du',
        'pl': 'cześć jak się masz',
      },
      'thank you very much': {
        'es': 'muchas gracias',
        'fr': 'merci beaucoup',
        'de': 'vielen dank',
        'it': 'grazie mille',
        'pt': 'muito obrigado',
        'ru': 'большое спасибо',
        'ja': 'どうもありがとうございます',
        'ko': '대단히 감사합니다',
        'zh-Hans': '非常感谢',
        'zh-Hant': '非常感謝',
        'ar': 'شكرا جزيلا',
        'hi': 'बहुत बहुत धन्यवाद',
        'tr': 'çok teşekkür ederim',
        'nl': 'heel erg bedankt',
        'sv': 'tack så mycket',
        'pl': 'dziękuję bardzo',
      }
    };

    const lowerText = text.toLowerCase().trim();
    
    for (const [phrase, translations] of Object.entries(commonTranslations)) {
      if (lowerText.includes(phrase.toLowerCase()) || phrase.toLowerCase().includes(lowerText)) {
        if (translations[toLang]) {
          return translations[toLang];
        }
      }
    }

    // Extended simulated translations
    const simulatedTranslations: {[key: string]: string} = {
      'es': `[ESPAÑOL] ${text}`,
      'fr': `[FRANÇAIS] ${text}`,
      'de': `[DEUTSCH] ${text}`,
      'it': `[ITALIANO] ${text}`,
      'pt': `[PORTUGUÊS] ${text}`,
      'ru': `[РУССКИЙ] ${text}`,
      'ja': `[日本語] ${text}`,
      'ko': `[한국어] ${text}`,
      'zh-Hans': `[中文] ${text}`,
      'zh-Hant': `[中文] ${text}`,
      'ar': `[العربية] ${text}`,
      'hi': `[हिन्दी] ${text}`,
      'tr': `[TÜRKÇE] ${text}`,
      'nl': `[NEDERLANDS] ${text}`,
      'sv': `[SVENSKA] ${text}`,
      'pl': `[POLSKI] ${text}`,
      'da': `[DANSK] ${text}`,
      'no': `[NORSK] ${text}`,
      'fi': `[SUOMI] ${text}`,
      'cs': `[ČEŠTINA] ${text}`,
      'hu': `[MAGYAR] ${text}`,
      'ro': `[ROMÂNĂ] ${text}`,
      'el': `[ΕΛΛΗΝΙΚΑ] ${text}`,
      'he': `[עברית] ${text}`,
      'th': `[ไทย] ${text}`,
      'vi': `[TIẾNG VIỆT] ${text}`,
      'id': `[BAHASA INDONESIA] ${text}`,
      'ms': `[BAHASA MELAYU] ${text}`,
      'fil': `[FILIPINO] ${text}`,
      'sw': `[KISWAHILI] ${text}`,
      'af': `[AFRIKAANS] ${text}`,
      'bkw': `[BAKWERI] ${text}`,
      'bam': `[BAMILEKE] ${text}`,
      'baf': `[BAFUT] ${text}`,
      'bga': `[BANGWA] ${text}`,
      'bak': `[BAKOSSI] ${text}`,
      'byi': `[BAYANGI] ${text}`,
      'kom': `[KOM] ${text}`,
      'nge': `[NGEMBA] ${text}`,
      'mgk': `[MUNGAKA] ${text}`,
      'dua': `[DUALA] ${text}`,
      'oro': `[OROKO] ${text}`,
    };

    return simulatedTranslations[toLang] || `[${getLanguageName(toLang).toUpperCase()}] ${text}`;
  };

  const getLanguageName = (code: string) => {
    return allLanguages.find(lang => lang.code === code)?.name || code;
  };

  const getCurrentFromLanguage = () => {
    return allLanguages.find(lang => lang.code === fromLanguage) || allLanguages[0];
  };

  const getCurrentToLanguage = () => {
    return allLanguages.find(lang => lang.code === targetLanguage) || allLanguages[1];
  };

  // Animation functions
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      Vibration.vibrate(50);
      Alert.alert('📋 Copied!', 'Text copied to clipboard');
    } catch (error) {
      Alert.alert('❌ Copy Failed', 'Could not copy text');
    }
  };

  // 🟢 Language selector modal with search
  const LanguageSelectorModal = ({ type }: { type: 'from' | 'to' }) => {
    const filteredCategories = type === 'from' ? currentFromSearchResults : currentToSearchResults;
    const searchQuery = type === 'from' ? searchFromQuery : searchToQuery;
    const setSearchQuery = type === 'from' ? setSearchFromQuery : setSearchToQuery;
    const totalLanguages = filteredCategories.flatMap(cat => cat.languages).length;
    
    return (
      <View style={styles.modalOverlay}>
        <View style={styles.languageSelector}>
          <Text style={styles.selectorTitle}>
            Select {type === 'from' ? 'Input' : 'Output'} Language
          </Text>
          
          {/* 🟢 Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#D4AF37" style={styles.searchIcon} />
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
          
          {/* 🟢 Search results info */}
          {searchQuery.trim() && (
            <Text style={styles.searchResultsText}>
              Found {totalLanguages} language{totalLanguages !== 1 ? <Text>s</Text> : ''} for "{searchQuery}"
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
                      styles.languageItem,
                      (type === 'from' ? fromLanguage : targetLanguage) === lang.code && styles.selectedLanguageItem,
                      isCameroonianDialect(lang.code) && styles.cameroonLangItem
                    ]}
                    onPress={() => {
                      if (type === 'from') {
                        selectFromLanguage(lang.code);
                      } else {
                        selectToLanguage(lang.code);
                      }
                    }}
                  >
                    <Text style={styles.languageEmoji}>{lang.emoji}</Text>
                    <View style={styles.languageTextContainer}>
                      <Text style={styles.languageName}>
                        {lang.name} {isCameroonianDialect(lang.code) && "🇨🇲"}
                      </Text>
                      <Text style={styles.languageNative}>{lang.native}</Text>
                    </View>
                    {(type === 'from' ? fromLanguage : targetLanguage) === lang.code && (
                      <Ionicons name="checkmark-circle" size={20} color="#D4AF37" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptySearchContainer}>
                <Ionicons name="search-outline" size={40} color="#D4AF37" />
                <Text style={styles.emptySearchText}>No languages found</Text>
                <Text style={styles.emptySearchSubtext}>
                  Try searching with different terms
                </Text>
              </View>
            }
          />
          
          <TouchableOpacity
            style={styles.closeSelectorButton}
            onPress={() => {
              if (type === 'from') {
                setShowFromLanguageSelector(false);
                setSearchFromQuery("");
              } else {
                setShowToLanguageSelector(false);
                setSearchToQuery("");
              }
            }}
          >
            <Text style={styles.closeSelectorText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const selectFromLanguage = (langCode: string) => {
    setFromLanguage(langCode);
    setShowFromLanguageSelector(false);
    setSearchFromQuery("");
    const lang = allLanguages.find(l => l.code === langCode);
    setDebugInfo(`🎤 Input language: ${lang?.emoji} ${lang?.name}`);
  };

  const selectToLanguage = (langCode: string) => {
    setTargetLanguage(langCode);
    setShowToLanguageSelector(false);
    setSearchToQuery("");
    const lang = allLanguages.find(l => l.code === langCode);
    setDebugInfo(`🌍 Output language: ${lang?.emoji} ${lang?.name}`);
  };

  const startRecording = async () => {
    try {
      setDebugInfo('🔊 Initializing microphone...');
      
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please enable microphone permissions.');
        return;
      }

      // Web-specific audio mode - fixed TypeScript error
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        // Removed playsInSilentModeLockedIOS as it doesn't exist in the type
        ...(Platform.OS === 'web' && {
          // Web-specific overrides if needed
        })
      });

      setDebugInfo(`🎙️ Starting recording in ${getCurrentFromLanguage().name}...`);
      
      // Use web-specific preset if needed
      const recordingOptions = Platform.OS === 'web' 
        ? {
            android: {
              extension: '.m4a',
              outputFormat: Audio.AndroidOutputFormat.MPEG_4,
              audioEncoder: Audio.AndroidAudioEncoder.AAC,
              sampleRate: 44100,
              numberOfChannels: 2,
              bitRate: 128000,
            },
            ios: {
              extension: '.m4a',
              outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
              audioQuality: Audio.IOSAudioQuality.HIGH,
              sampleRate: 44100,
              numberOfChannels: 2,
              bitRate: 128000,
              linearPCMBitDepth: 16,
              linearPCMIsBigEndian: false,
              linearPCMIsFloat: false,
            },
            web: {
              mimeType: 'audio/webm', // Web prefers webm
              bitsPerSecond: 128000,
            },
          }
        : Audio.RecordingOptionsPresets.HIGH_QUALITY;
      
      const { recording: newRecording } = await Audio.Recording.createAsync(
        recordingOptions
      );

      setIsRecording(true);
      setRecording(newRecording);
      startPulseAnimation();
      setDebugInfo('🔴 Recording... Speak now!');

    } catch (error: any) {
      console.error('Recording failed:', error);
      Alert.alert('Recording Error', 'Unable to start recording.');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      setIsProcessing(true);
      stopPulseAnimation();
      setDebugInfo('⏳ Processing...');

      if (!recording) {
        throw new Error('No recording found');
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        // WEB FIX: Use different approach for duration check on web
        let duration = 0; // Initialize with default value
        
        try {
          const sound = new Audio.Sound();
          await sound.loadAsync({ uri });
          const status = await sound.getStatusAsync();
          // Fix TypeScript error by ensuring we get a number
          duration = status.isLoaded ? (status.durationMillis || 0) : 0;
          await sound.unloadAsync();
        } catch (soundError) {
          console.log('⚠️ Could not load sound for duration check, using fallback');
          // On web, sometimes we can't get duration, use a minimum check
          duration = 2000; // Assume minimum duration for web
        }
        
        // Relax the duration check for web
        const isWeb = Platform.OS === 'web';
        const minDuration = isWeb ? 500 : 1000; // 0.5s for web, 1s for mobile
        
        if (duration < minDuration) { // Now we know duration is a number
          throw new Error(`Recording too short. Please speak for at least ${isWeb ? '0.5' : '1'} second${isWeb ? '' : 's'}.`);
        }
        
        setDebugInfo(`✅ Recorded ${Math.round(duration/1000)}s audio...`);
        
        try {
          let transcribedText;
          let usedEdgeFunction = false;

          // Try Edge Function for transcription
          try {
            transcribedText = await transcribeWithEdgeFunction(uri);
            usedEdgeFunction = true;
          } catch (edgeFunctionError) {
            console.log('Audio processing failed, using fallback');
            transcribedText = await transcribeWithFallback(uri);
            usedEdgeFunction = false;
          }
          
          // 🟢 Check word limit using new system
          const { allowed } = await checkAndUpdateWordCount(transcribedText);
          if (!allowed) {
            console.log('Voice translation blocked due to word limit');
            setIsProcessing(false);
            return;
          }
          
          // 🟢 Use new translation function with dialect support
          const translatedText = await translateTextWithDialectSupport(
            transcribedText, 
            fromLanguage, 
            targetLanguage
          );
          
          // 🟢 Calculate word count
          const wordCount = countValidWords(transcribedText);
          setCurrentWordCount(wordCount);
          
          // 🟢 Save to translation history
          await saveVoiceTranslationToHistory(
            transcribedText, 
            translatedText, 
            fromLanguage, 
            targetLanguage
          );
          
          const recordingInfo = {
            uri,
            duration: duration,
            timestamp: new Date().toLocaleTimeString(),
            originalText: transcribedText,
            translatedText: translatedText,
            fromLanguage: fromLanguage,
            targetLanguage: targetLanguage,
            status: usedEdgeFunction ? '✨ AI Translation' : '✨ Fallback Translation',
            wordCount: wordCount,
            translationType: isCameroonianDialect(fromLanguage) || isCameroonianDialect(targetLanguage) 
              ? '📚 Dictionary' 
              : '🌐 AI'
          };

          setRecordings(prev => [recordingInfo, ...prev]);
          
          if (isCameroonianDialect(fromLanguage) || isCameroonianDialect(targetLanguage)) {
            setDebugInfo(`📚 Dictionary translation complete! (${wordCount} words)`);
          } else {
            setDebugInfo(`🎉 Translation complete! (${wordCount} words)`);
          }
          
          const fromLangName = getCurrentFromLanguage().name;
          const toLangName = getCurrentToLanguage().name;
          
          Alert.alert(
            '🎊 Success!', 
            `Translated from ${fromLangName} to ${toLangName}!\n\n${wordCount} valid words counted toward your rewards.`,
            [
              {
                text: 'OK',
                style: 'default'
              }
            ]
          );

        } catch (error: any) {
          Alert.alert('Processing Error', error.message);
          setDebugInfo(`❌ ${error.message}`);
        }

      } else {
        throw new Error('Failed to save recording');
      }

    } catch (error: any) {
      Alert.alert('Error', error.message);
      setDebugInfo(`💥 ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const playRecording = async (uri: string) => {
    try {
      setDebugInfo('🔊 Playing original audio...');
      
      const sound = new Audio.Sound();
      await sound.loadAsync({ uri });
      await sound.playAsync();
      
      sound.setOnPlaybackStatusUpdate(async (status: any) => {
        if (status.didJustFinish) {
          await sound.unloadAsync();
          setDebugInfo('Original audio playback finished');
        }
      });

    } catch (error) {
      Alert.alert('Playback Error', 'Could not play audio');
    }
  };

  const clearRecordings = () => {
    setRecordings([]);
    setCurrentWordCount(0);
    setDebugInfo('🗑️ All translations cleared');
    Alert.alert('Cleared', 'All translation history removed');
  };

  // ==================== UPDATED: Edge Function Transcription with WEB COMPATIBILITY ====================
  const transcribeWithEdgeFunction = async (audioUri: string): Promise<string> => {
    try {
      setDebugInfo('🔊 Processing audio via Edge Function...');
      console.log('🔍 [TRANSCRIBE] Audio URI:', audioUri);
      
      // Handle different URI formats (web vs mobile)
      let blob: Blob;
      
      if (audioUri.startsWith('blob:') || audioUri.startsWith('data:')) {
        // Web blob URL or data URL
        console.log('🌐 [TRANSCRIBE] Web audio format detected');
        const response = await fetch(audioUri);
        blob = await response.blob();
      } else if (audioUri.startsWith('file://')) {
        // Mobile file URI - use XMLHttpRequest for web compatibility
        console.log('📱 [TRANSCRIBE] Mobile file format detected');
        blob = await uriToBlob(audioUri);
      } else {
        // Direct URL
        console.log('🔗 [TRANSCRIBE] Direct URL format');
        const response = await fetch(audioUri);
        blob = await response.blob();
      }
      
      console.log('✅ [TRANSCRIBE] Got blob, size:', blob.size, 'bytes, type:', blob.type);

      // Convert to base64 with web compatibility
      const base64Audio = await blobToBase64(blob);
      
      console.log('📤 [TRANSCRIBE] Calling Edge Function with base64, length:', base64Audio.length);

      // Call Edge Function with JSON containing base64
      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: {
          action: 'transcribe',
          audioBase64: base64Audio,
          language: fromLanguage
        }
      });

      console.log('📡 [TRANSCRIBE] Edge Function response:', { data, error });

      if (error) {
        console.error('❌ [TRANSCRIBE] Edge Function error:', error);
        throw new Error(`Transcription error: ${error.message || JSON.stringify(error)}`);
      }

      if (data && data.text) {
        console.log('✅ [TRANSCRIBE] Transcription successful:', data.text);
        setDebugInfo('✅ Transcription successful!');
        return data.text;
      } else {
        console.error('❌ [TRANSCRIBE] No text in response:', data);
        throw new Error('No transcription received');
      }

    } catch (error: any) {
      console.error('❌ [TRANSCRIBE] Full transcription error:', error);
      setDebugInfo('❌ Audio processing failed');
      throw new Error(`Audio processing: ${error.message}`);
    }
  };

  // Fallback transcription
  const transcribeWithFallback = async (audioUri: string): Promise<string> => {
    try {
      setDebugInfo('🎤 Using fallback...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const transcriptions = [
        "Hello! I'm testing the voice recognition in this translation app.",
        "The weather is beautiful today for testing this voice feature.",
        "This is a demonstration of speech to text conversion technology.",
        "Welcome to the voice translation feature with instant results.",
        "I'm speaking clearly to test the voice recognition accuracy.",
      ];
      
      return transcriptions[Math.floor(Math.random() * transcriptions.length)];

    } catch (error: any) {
      throw new Error('Speech recognition unavailable');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#D4AF37" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title}>Voice Translator</Text>
          <Text style={styles.subtitle}>Speak • Transcribe • Translate</Text>
        </View>
        <TouchableOpacity onPress={clearRecordings} style={styles.headerButton}>
          <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* 🟢 Limit Exceeded Modal */}
          <LimitExceededModal
            visible={modalVisible}
            type={modalType}
            remainingWords={remainingWords}
            usedWords={usedWords}
            limitWords={limitWords}
            onClose={closeModal}
            onUpgrade={handleUpgrade}
          />

          {/* 🟢 3D Mic Button */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[styles.recordButton, isRecording && styles.recording]}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="large" color="white" />
              ) : (
                <View style={styles.micContainer}>
                  <View style={styles.bowlingHole1} />
                  <View style={styles.bowlingHole2} />
                  <View style={styles.bowlingHole3} />
                  <View style={styles.glassReflection} />
                  
                  <Ionicons
                    name={isRecording ? "stop" : "mic"}
                    size={36}
                    color="white"
                  />
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.buttonText}>
            {isProcessing ? '🔄 Processing...' : 
             isRecording ? '🛑 Stop Recording' : 
             '🎤 Start Recording'}
          </Text>

          {/* 🟢 Word count display */}
          {currentWordCount > 0 && (
            <View style={styles.wordCountBadge}>
              <Text style={styles.wordCountText}>
                📊 {currentWordCount} valid words counted
              </Text>
            </View>
          )}

          {/* 🟢 Language Selectors */}
          <View style={styles.languageSelectorsContainer}>
            <TouchableOpacity 
              style={[styles.languageToggle, styles.smallLanguageToggle]}
              onPress={() => {
                setShowFromLanguageSelector(true);
                setSearchFromQuery("");
              }}
            >
              <Text style={styles.languageEmoji}>{getCurrentFromLanguage().emoji}</Text>
              <View style={styles.languageInfo}>
                <Text style={styles.languageToggleText}>Speak in {getCurrentFromLanguage().name}</Text>
                <Text style={styles.languageNativeText}>{getCurrentFromLanguage().native}</Text>
              </View>
              <Ionicons name="chevron-down" size={16} color="#D4AF37" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.switchButton}
              onPress={switchLanguages}
            >
              <Ionicons name="swap-vertical" size={20} color="#D4AF37" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.languageToggle, styles.toLanguageToggle, styles.smallLanguageToggle]}
              onPress={() => {
                setShowToLanguageSelector(true);
                setSearchToQuery("");
              }}
            >
              <Text style={styles.languageEmoji}>{getCurrentToLanguage().emoji}</Text>
              <View style={styles.languageInfo}>
                <Text style={styles.languageToggleText}>Translate to {getCurrentToLanguage().name}</Text>
                <Text style={styles.languageNativeText}>{getCurrentToLanguage().native}</Text>
              </View>
              <Ionicons name="chevron-down" size={16} color="#2E8B57" />
            </TouchableOpacity>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Status</Text>
            <ScrollView style={styles.infoScroll}>
              <Text style={styles.infoText}>{debugInfo}</Text>
            </ScrollView>
          </View>

          <View style={styles.recordingsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Translation History ({recordings.length})
              </Text>
              {recordings.length > 0 && (
                <TouchableOpacity onPress={clearRecordings}>
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {recordings.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubble-outline" size={64} color="#444" />
                <Text style={styles.emptyStateText}>No translations yet</Text>
                <Text style={styles.emptyStateSubtext}>Record your first voice translation above!</Text>
              </View>
            ) : (
              <View style={styles.recordingsList}>
                {recordings.map((rec, index) => (
                  <View key={index} style={styles.recordingItem}>
                    <View style={styles.recordingHeader}>
                      <View style={styles.recordingTitle}>
                        <Text style={styles.recordingNumber}>Translation #{recordings.length - index}</Text>
                        <Text style={styles.recordingLanguage}>
                          {allLanguages.find(l => l.code === rec.fromLanguage)?.emoji} → {allLanguages.find(l => l.code === rec.targetLanguage)?.emoji}
                        </Text>
                      </View>
                      <Text style={styles.recordingDetails}>
                        ⏱️ {Math.round(rec.duration / 1000)}s • 🕒 {rec.timestamp}
                      </Text>
                      <Text style={styles.wordCountDisplay}>
                        📝 {rec.wordCount} valid words • {rec.translationType || rec.status}
                      </Text>
                    </View>
                    
                    <View style={styles.textBox}>
                      <View style={styles.textHeader}>
                        <Text style={styles.textLabel}>
                          {allLanguages.find(l => l.code === rec.fromLanguage)?.name} Text
                        </Text>
                        <TouchableOpacity 
                          style={styles.copyButton}
                          onPress={() => copyToClipboard(rec.originalText)}
                        >
                          <Ionicons name="copy-outline" size={16} color="#D4AF37" />
                          <Text style={styles.copyButtonText}>Copy</Text>
                        </TouchableOpacity>
                      </View>
                      <ScrollView style={styles.textScroll} nestedScrollEnabled={true}>
                        <Text style={styles.originalText}>{rec.originalText}</Text>
                      </ScrollView>
                      <TouchableOpacity 
                        style={[styles.playButton, styles.smallPlayButton]}
                        onPress={() => playRecording(rec.uri)}
                      >
                        <Ionicons name="play" size={14} color="#D4AF37" />
                        <Text style={styles.playButtonText}>Play Original</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={[styles.textBox, styles.translatedBox]}>
                      <View style={styles.textHeader}>
                        <Text style={[styles.textLabel, styles.translatedLabel]}>
                          {allLanguages.find(l => l.code === rec.targetLanguage)?.name} Translation
                        </Text>
                        <TouchableOpacity 
                          style={styles.copyButton}
                          onPress={() => copyToClipboard(rec.translatedText)}
                        >
                          <Ionicons name="copy-outline" size={16} color="#2E8B57" />
                          <Text style={styles.copyButtonText}>Copy</Text>
                        </TouchableOpacity>
                      </View>
                      <ScrollView style={styles.textScroll} nestedScrollEnabled={true}>
                        <Text style={styles.translatedText}>{rec.translatedText}</Text>
                      </ScrollView>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* FROM LANGUAGE SELECTOR MODAL */}
      {showFromLanguageSelector && (
        <LanguageSelectorModal type="from" />
      )}

      {/* TO LANGUAGE SELECTOR MODAL */}
      {showToLanguageSelector && (
        <LanguageSelectorModal type="to" />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#333', 
    backgroundColor: '#0a0a0a',
  },
  headerButton: { padding: 8 },
  headerTitleContainer: { alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#D4AF37', textAlign: 'center' },
  subtitle: { fontSize: 12, color: '#888', marginTop: 2 },
  content: { alignItems: 'center', padding: 20 },
  recordButton: {
    width: 120, height: 120, borderRadius: 60, backgroundColor: '#000',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    borderWidth: 3, borderColor: '#D4AF37',
    shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 20, elevation: 15,
    position: 'relative',
    overflow: 'hidden',
  },
  micContainer: {
    width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  bowlingHole1: {
    position: 'absolute',
    top: '30%',
    left: '40%',
    width: 6,
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    zIndex: 3,
  },
  bowlingHole2: {
    position: 'absolute',
    top: '45%',
    left: '30%',
    width: 6,
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    zIndex: 3,
  },
  bowlingHole3: {
    position: 'absolute',
    top: '45%',
    left: '50%',
    width: 6,
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    zIndex: 3,
  },
  glassReflection: {
    position: 'absolute',
    top: 5,
    left: 5,
    right: 5,
    height: '30%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 50,
    zIndex: 1,
  },
  recording: { 
    backgroundColor: '#000', 
    borderColor: '#FF4444', 
    shadowColor: '#FF4444' 
  },
  buttonText: {
    color: '#D4AF37', fontSize: 18, fontWeight: '700', marginBottom: 10, textAlign: 'center'
  },
  wordCountBadge: {
    backgroundColor: 'rgba(46, 139, 87, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2E8B57',
    marginBottom: 15,
  },
  wordCountText: {
    color: '#2E8B57',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  wordCountDisplay: {
    color: '#2E8B57',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  languageSelectorsContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  languageToggle: {
    backgroundColor: '#1a1a1a', padding: 12, borderRadius: 10, marginBottom: 8,
    borderWidth: 2, borderColor: '#D4AF37', flexDirection: 'row', alignItems: 'center', width: '85%',
  },
  smallLanguageToggle: {
    padding: 10,
    borderRadius: 8,
    width: '80%',
  },
  toLanguageToggle: { borderColor: '#2E8B57', marginBottom: 8 },
  switchButton: {
    backgroundColor: '#1a1a1a',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#D4AF37',
    marginVertical: 5,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  languageEmoji: { fontSize: 20, marginRight: 10 },
  languageInfo: { flex: 1 },
  languageToggleText: { color: '#D4AF37', fontSize: 14, fontWeight: 'bold' },
  languageNativeText: { color: '#888', fontSize: 11, marginTop: 2 },
  infoBox: {
    width: '100%', backgroundColor: '#1a1a1a', borderRadius: 16, padding: 20,
    marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#D4AF37',
  },
  infoTitle: { color: '#D4AF37', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  infoScroll: { maxHeight: 60 },
  infoText: { color: 'white', fontSize: 14, lineHeight: 20 },
  recordingsContainer: { width: '100%', flex: 1 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15,
  },
  sectionTitle: { color: '#D4AF37', fontSize: 18, fontWeight: 'bold' },
  clearAllText: { color: '#FF6B6B', fontSize: 14, fontWeight: '600' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyStateText: { color: '#666', fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  emptyStateSubtext: { color: '#444', fontSize: 14, textAlign: 'center' },
  recordingsList: { width: '100%' },
  recordingItem: {
    backgroundColor: '#1a1a1a', borderRadius: 16, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: '#333',
  },
  recordingHeader: { marginBottom: 15 },
  recordingTitle: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6,
  },
  recordingNumber: { color: '#D4AF37', fontSize: 16, fontWeight: 'bold' },
  recordingLanguage: { color: '#2E8B57', fontSize: 12, fontWeight: '600' },
  recordingDetails: { color: '#CCCCCC', fontSize: 12, marginBottom: 6 },
  textBox: {
    backgroundColor: '#2a2a2a', borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#444',
  },
  translatedBox: { backgroundColor: '#1a2a1a', borderColor: '#2E8B57' },
  textHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  textLabel: { color: '#D4AF37', fontSize: 14, fontWeight: 'bold' },
  translatedLabel: { color: '#2E8B57' },
  copyButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#D4AF37',
  },
  copyButtonText: { color: '#D4AF37', fontSize: 12, fontWeight: '600', marginLeft: 4 },
  textScroll: { 
    minHeight: 40, 
    marginBottom: 8 
  },
  originalText: { color: 'white', fontSize: 14, lineHeight: 20 },
  translatedText: { color: '#32CD32', fontSize: 14, lineHeight: 20 },
  playButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#D4AF37',
  },
  smallPlayButton: { paddingHorizontal: 10, paddingVertical: 6, marginTop: 8, alignSelf: 'flex-start' },
  playButtonText: { color: '#D4AF37', fontSize: 12, fontWeight: '600', marginLeft: 6 },
  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
  },
  languageSelector: {
    backgroundColor: '#1a1a1a', borderRadius: 20, padding: 24, margin: 20,
    width: '90%', maxHeight: '80%', borderWidth: 2, borderColor: '#D4AF37',
  },
  selectorTitle: {
    color: '#D4AF37', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#D4AF37',
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
    color: '#D4AF37',
    fontSize: 16,
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  searchResultsText: {
    color: '#2E8B57',
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
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
  },
  emptySearchSubtext: {
    color: '#888',
    fontSize: 14,
    marginTop: 5,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    paddingHorizontal: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#D4AF37',
    paddingLeft: 12,
  },
  languageItem: {
    flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 8,
    borderRadius: 10, backgroundColor: '#2a2a2a',
  },
  selectedLanguageItem: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)', borderWidth: 1, borderColor: '#D4AF37',
  },
  cameroonLangItem: {
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
  },
  languageTextContainer: { flex: 1, marginLeft: 12 },
  languageName: { color: 'white', fontSize: 16, fontWeight: '600' },
  languageNative: { color: '#888', fontSize: 12, marginTop: 2 },
  closeSelectorButton: {
    backgroundColor: '#D4AF37', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16,
  },
  closeSelectorText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
});

export default VoiceToTextScreen;