// screens/VoiceToVoiceScreen.tsx
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
  View
} from 'react-native';

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
  
  if (dictionary.translations[normalizedInput]) {
    return dictionary.translations[normalizedInput] as string;
  }
  
  for (const [english, dialect] of Object.entries(dictionary.translations)) {
    if (normalizeText(english) === normalizedInput) {
      return dialect as string;
    }
  }
  
  if (normalizedInput.includes(' ')) {
    const words = normalizedInput.split(' ');
    let translatedWords: string[] = [];
    let someWordsTranslated = false;

    for (const word of words) {
      let translated = false;
      
      for (const [english, dialect] of Object.entries(dictionary.translations)) {
        if (normalizeText(english) === word) {
          translatedWords.push(dialect as string);
          translated = true;
          someWordsTranslated = true;
          break;
        }
      }
      
      if (!translated) {
        translatedWords.push(word);
      }
    }

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
  
  for (const [english, dialect] of Object.entries(dictionary.translations)) {
    if (normalizeText(dialect as string) === normalizedInput) {
      return english;
    }
  }
  
  if (normalizedInput.includes(' ')) {
    const words = normalizedInput.split(' ');
    let translatedWords: string[] = [];
    let someWordsTranslated = false;

    for (const word of words) {
      let translated = false;
      
      for (const [english, dialect] of Object.entries(dictionary.translations)) {
        if (normalizeText(dialect as string) === word) {
          translatedWords.push(english);
          translated = true;
          someWordsTranslated = true;
          break;
        }
      }
      
      if (!translated) {
        translatedWords.push(word);
      }
    }

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
  
  const englishText = translateDialectToEnglish(text, sourceDialect);
  
  if (englishText.includes('[')) {
    return englishText;
  }
  
  console.log(`✅ ${sourceDict.targetLanguage} → English: "${text}" → "${englishText}"`);
  
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
  
  let englishText = '';
  try {
    englishText = await translateText(text, sourceInternational, 'en');
    console.log(`✅ ${sourceInternational} → English: "${text}" → "${englishText}"`);
  } catch (err) {
    console.error("Azure Translation failed:", err);
    return `[Azure Translation Error from ${sourceInternational}]`;
  }
  
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
  
  const englishText = translateDialectToEnglish(text, sourceDialect);
  
  if (englishText.includes('[')) {
    return englishText;
  }
  
  console.log(`✅ ${sourceDialect} → English: "${text}" → "${englishText}"`);
  
  try {
    const internationalText = await translateText(englishText, 'en', targetInternational);
    console.log(`✅ English → ${targetInternational}: "${englishText}" → "${internationalText}"`);
    return internationalText;
  } catch (err) {
    console.error("Azure Translation failed:", err);
    return `[Azure Translation Error for ${targetInternational}]`;
  }
};

// 🟢 Word counting function
const countValidWords = (text: string): number => {
  if (!text || text.trim().length === 0) return 0;
  
  const cleanText = text
    .replace(/https?:\/\/[^\s]+/g, '')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
    .replace(/[^\w\s']|_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (cleanText.length === 0) return 0;
  
  const words = cleanText.split(/\s+/);
  
  const validWords = words.filter(word => {
    if (word.length < 2) return false;
    if (!/[a-zA-Z]/.test(word)) return false;
    
    const invalidPatterns = [
      /^[0-9]+$/,
      /^[^a-zA-Z0-9]+$/,
      /^[a-zA-Z]{1}$/,
    ];
    
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
    
    console.log(`🟢 Saving voice-to-voice translation: ${wordCount} valid words`);
    
    const { error } = await supabase
      .from('user_translations')
      .insert({
        user_id: user.id,
        source_text: sourceText,
        translated_text: translatedText,
        source_language: sourceLanguage,
        target_language: targetLanguage,
        translation_type: 'voice-to-voice',
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error saving voice-to-voice translation:', error);
    } else {
      console.log('✅ Voice-to-voice translation saved to history');
    }
  } catch (error) {
    console.error('Error saving voice-to-voice translation:', error);
  }
};

const VoiceToVoiceScreen = ({ navigation }: any) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [debugInfo, setDebugInfo] = useState('');
  const [fromLanguage, setFromLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [showFromLanguageSelector, setShowFromLanguageSelector] = useState(false);
  const [showToLanguageSelector, setShowToLanguageSelector] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [searchFromQuery, setSearchFromQuery] = useState('');
  const [searchToQuery, setSearchToQuery] = useState('');
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
        { code: 'uk', name: 'Ukrainian', native: 'Українська', emoji: '🇺🇦' },
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
      ]
    },
    {
      name: 'Americas',
      languages: [
        { code: 'en-US', name: 'English (US)', native: 'English', emoji: '🇺🇸' },
        { code: 'es-419', name: 'Spanish (Latin America)', native: 'Español Latinoamericano', emoji: '🇲🇽' },
        { code: 'pt-BR', name: 'Portuguese (Brazil)', native: 'Português Brasileiro', emoji: '🇧🇷' },
        { code: 'fr-CA', name: 'French (Canadian)', native: 'Français Canadien', emoji: '🇨🇦' },
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

  const allLanguages = languageCategories.flatMap(category => category.languages);

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

  const switchLanguages = () => {
    const temp = fromLanguage;
    setFromLanguage(targetLanguage);
    setTargetLanguage(temp);
    
    const fromLang = allLanguages.find(l => l.code === temp);
    const toLang = allLanguages.find(l => l.code === fromLanguage);
    
    setDebugInfo(`🔄 Switched: ${fromLang?.emoji} ${fromLang?.name} ↔ ${toLang?.emoji} ${toLang?.name}`);
  };

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
    
    if (fromLang === 'en' && isCameroonianTarget) {
      console.log('📚 Using local dictionary: English → Dialect');
      return translateEnglishToDialect(text, toLang);
    }
    
    if (isCameroonianSource && toLang === 'en') {
      console.log('📚 Using local dictionary: Dialect → English');
      return translateDialectToEnglish(text, fromLang);
    }
    
    if (isCameroonianSource && isCameroonianTarget) {
      console.log('📚 Using local dictionary: Dialect → Dialect');
      return translateDialectToDialect(text, fromLang, toLang);
    }
    
    if (!isCameroonianSource && isCameroonianTarget) {
      console.log('🌐 Using Azure + Dictionary: International → Dialect');
      return await translateInternationalToDialect(text, fromLang, toLang);
    }
    
    if (isCameroonianSource && !isCameroonianTarget) {
      console.log('🌐 Using Dictionary + Azure: Dialect → International');
      return await translateDialectToInternational(text, fromLang, toLang);
    }
    
    console.log('🌐 Using Azure for International → International');
    try {
      return await translateText(text, fromLang, toLang);
    } catch (err) {
      console.error("Azure translation failed, using Edge Function fallback:", err);
      return await translateWithEdgeFunction(text, fromLang, toLang);
    }
  };

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
      setDebugInfo('❌ Translation failed');
      return `[Translation Error: ${error.message}]`;
    }
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
          
          {searchQuery.trim() && (
            <Text style={styles.searchResultsText}>
              Found {totalLanguages} language{totalLanguages !== 1 ? 's' : ''} for "{searchQuery}"
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
    setDebugInfo(`🔊 Output language: ${lang?.emoji} ${lang?.name}`);
  };

  const startRecording = async () => {
    try {
      setDebugInfo('🔊 Initializing microphone...');
      
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please enable microphone permissions.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      setDebugInfo(`🎙️ Starting recording in ${getCurrentFromLanguage().name}...`);
      
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
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
        const sound = new Audio.Sound();
        await sound.loadAsync({ uri });
        const status = await sound.getStatusAsync();
        await sound.unloadAsync();

        const duration = status.isLoaded ? status.durationMillis : 0;
        
        if (!duration || duration < 1000) {
          throw new Error('Recording too short. Please speak for at least 2 seconds.');
        }
        
        setDebugInfo(`✅ Recorded ${Math.round(duration/1000)}s audio...`);
        
        try {
          // Transcribe audio
          const transcribedText = await transcribeWithEdgeFunction(uri);
          
          // Check word limit
          const { allowed } = await checkAndUpdateWordCount(transcribedText);
          if (!allowed) {
            console.log('Voice-to-voice translation blocked due to word limit');
            setIsProcessing(false);
            return;
          }
          
          // Translate text
          const translatedText = await translateTextWithDialectSupport(
            transcribedText, 
            fromLanguage, 
            targetLanguage
          );
          
          // Generate speech for translated text
          const translatedAudioUri = await textToSpeech(translatedText, targetLanguage);
          
          // Calculate word count
          const wordCount = countValidWords(transcribedText);
          setCurrentWordCount(wordCount);
          
          // Save to translation history
          await saveVoiceTranslationToHistory(
            transcribedText, 
            translatedText, 
            fromLanguage, 
            targetLanguage
          );
          
          const conversationInfo = {
            originalUri: uri,
            translatedUri: translatedAudioUri,
            duration: duration,
            timestamp: new Date().toLocaleTimeString(),
            originalText: transcribedText,
            translatedText: translatedText,
            fromLanguage: fromLanguage,
            targetLanguage: targetLanguage,
            wordCount: wordCount,
            translationType: isCameroonianDialect(fromLanguage) || isCameroonianDialect(targetLanguage) 
              ? '📚 Dictionary' 
              : '🌐 AI'
          };

          setConversations(prev => [conversationInfo, ...prev]);
          
          // Auto-play translated audio
          await playAudio(translatedAudioUri);
          
          if (isCameroonianDialect(fromLanguage) || isCameroonianDialect(targetLanguage)) {
            setDebugInfo(`📚 Dictionary translation complete! (${wordCount} words)`);
          } else {
            setDebugInfo(`🎉 Translation complete! (${wordCount} words)`);
          }
          
          const fromLangName = getCurrentFromLanguage().name;
          const toLangName = getCurrentToLanguage().name;
          
          Alert.alert(
            '🎊 Success!', 
            `Translated from ${fromLangName} to ${toLangName}!\n\n${wordCount} valid words counted.`,
            [{ text: 'OK', style: 'default' }]
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

  const playAudio = async (uri: string) => {
    try {
      const sound = new Audio.Sound();
      await sound.loadAsync({ uri });
      await sound.playAsync();
      
      sound.setOnPlaybackStatusUpdate(async (status: any) => {
        if (status.didJustFinish) {
          await sound.unloadAsync();
        }
      });

    } catch (error) {
      console.error('Playback error:', error);
    }
  };

  const clearConversations = () => {
    setConversations([]);
    setCurrentWordCount(0);
    setDebugInfo('🗑️ All conversations cleared');
    Alert.alert('Cleared', 'All conversation history removed');
  };

  // ==================== UPDATED: Edge Function Transcription with BASE64 ====================
  const transcribeWithEdgeFunction = async (audioUri: string): Promise<string> => {
    try {
      setDebugInfo('🔊 Processing audio via Edge Function...');
      console.log('🔍 [TRANSCRIBE] Audio URI:', audioUri);
      
      const response = await fetch(audioUri);
      console.log('✅ [TRANSCRIBE] Fetched audio file, status:', response.status);
      
      const blob = await response.blob();
      console.log('✅ [TRANSCRIBE] Got blob, size:', blob.size, 'bytes, type:', blob.type);

      // Convert to base64
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      console.log('📤 [TRANSCRIBE] Calling Edge Function with base64, length:', base64Audio.length);

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

  // ==================== FIXED TEXT-TO-SPEECH FUNCTION (NO FILESYSTEM) ====================
  const textToSpeech = async (text: string, language: string): Promise<string> => {
    try {
      setDebugInfo('🔊 Converting text to speech...');
      console.log('🔊 [TTS] Converting text:', text, 'Language:', language);
      
      // For Cameroonian dialects, use English TTS
      const ttsLanguage = isCameroonianDialect(language) ? 'en' : language;
      console.log('🔊 [TTS] Using TTS language:', ttsLanguage);
      
      // Call Edge Function for TTS
      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: {
          action: 'tts',
          text: text,
          language: ttsLanguage
        }
      });

      console.log('📡 [TTS] Edge Function response:', { data, error });

      if (error) {
        console.error('❌ [TTS] Edge Function error:', error);
        throw new Error(`TTS error: ${error.message || JSON.stringify(error)}`);
      }

      if (data && data.audioBase64) {
        console.log('✅ [TTS] Received audio base64, length:', data.audioBase64.length);
        
        // ===== FIX: Create data URI directly from base64 (NO FileSystem needed) =====
        const dataUri = `data:audio/mp3;base64,${data.audioBase64}`;
        
        console.log('✅ [TTS] Created data URI for audio playback');
        setDebugInfo('✅ Text-to-speech conversion complete!');
        
        return dataUri;
      } else {
        console.error('❌ [TTS] No audio in response:', data);
        throw new Error('No audio received from TTS');
      }
      
    } catch (error: any) {
      console.error('❌ [TTS] Full TTS error:', error);
      setDebugInfo('❌ Text-to-speech failed');
      throw new Error(`TTS error: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#D4AF37" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title}>Voice-to-Voice</Text>
          <Text style={styles.subtitle}>Speak • Translate • Hear</Text>
        </View>
        <TouchableOpacity onPress={clearConversations} style={styles.headerButton}>
          <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <LimitExceededModal
            visible={modalVisible}
            type={modalType}
            remainingWords={remainingWords}
            usedWords={usedWords}
            limitWords={limitWords}
            onClose={closeModal}
            onUpgrade={handleUpgrade}
          />

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

          {currentWordCount > 0 && (
            <View style={styles.wordCountBadge}>
              <Text style={styles.wordCountText}>
                📊 {currentWordCount} valid words counted
              </Text>
            </View>
          )}

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
                <Text style={styles.languageToggleText}>Hear in {getCurrentToLanguage().name}</Text>
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

          <View style={styles.conversationsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Conversations ({conversations.length})
              </Text>
              {conversations.length > 0 && (
                <TouchableOpacity onPress={clearConversations}>
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {conversations.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={64} color="#444" />
                <Text style={styles.emptyStateText}>No conversations yet</Text>
                <Text style={styles.emptyStateSubtext}>Start your first voice-to-voice translation!</Text>
              </View>
            ) : (
              <View style={styles.conversationsList}>
                {conversations.map((conv, index) => (
                  <View key={index} style={styles.conversationItem}>
                    <View style={styles.conversationHeader}>
                      <View style={styles.conversationTitle}>
                        <Text style={styles.conversationNumber}>Conversation #{conversations.length - index}</Text>
                        <Text style={styles.conversationLanguage}>
                          {allLanguages.find(l => l.code === conv.fromLanguage)?.emoji} → {allLanguages.find(l => l.code === conv.targetLanguage)?.emoji}
                        </Text>
                      </View>
                      <Text style={styles.conversationDetails}>
                        ⏱️ {Math.round(conv.duration / 1000)}s • 🕒 {conv.timestamp}
                      </Text>
                      <Text style={styles.wordCountDisplay}>
                        📝 {conv.wordCount} valid words • {conv.translationType}
                      </Text>
                    </View>
                    
                    <View style={styles.textBox}>
                      <View style={styles.textHeader}>
                        <Text style={styles.textLabel}>
                          {allLanguages.find(l => l.code === conv.fromLanguage)?.name} Text
                        </Text>
                        <TouchableOpacity 
                          style={styles.copyButton}
                          onPress={() => copyToClipboard(conv.originalText)}
                        >
                          <Ionicons name="copy-outline" size={16} color="#D4AF37" />
                          <Text style={styles.copyButtonText}>Copy</Text>
                        </TouchableOpacity>
                      </View>
                      <ScrollView style={styles.textScroll} nestedScrollEnabled={true}>
                        <Text style={styles.originalText}>{conv.originalText}</Text>
                      </ScrollView>
                      <TouchableOpacity 
                        style={[styles.playButton, styles.smallPlayButton]}
                        onPress={() => playAudio(conv.originalUri)}
                      >
                        <Ionicons name="play" size={14} color="#D4AF37" />
                        <Text style={styles.playButtonText}>Play Original</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={[styles.textBox, styles.translatedBox]}>
                      <View style={styles.textHeader}>
                        <Text style={[styles.textLabel, styles.translatedLabel]}>
                          {allLanguages.find(l => l.code === conv.targetLanguage)?.name} Translation
                        </Text>
                        <TouchableOpacity 
                          style={styles.copyButton}
                          onPress={() => copyToClipboard(conv.translatedText)}
                        >
                          <Ionicons name="copy-outline" size={16} color="#2E8B57" />
                          <Text style={styles.copyButtonText}>Copy</Text>
                        </TouchableOpacity>
                      </View>
                      <ScrollView style={styles.textScroll} nestedScrollEnabled={true}>
                        <Text style={styles.translatedText}>{conv.translatedText}</Text>
                      </ScrollView>
                      {conv.translatedUri && (
                        <TouchableOpacity 
                          style={[styles.playButton, styles.smallPlayButton, styles.translatedPlayButton]}
                          onPress={() => playAudio(conv.translatedUri)}
                        >
                          <Ionicons name="volume-high" size={14} color="#2E8B57" />
                          <Text style={[styles.playButtonText, styles.translatedPlayText]}>Play Translation</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {showFromLanguageSelector && (
        <LanguageSelectorModal type="from" />
      )}

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
    position: 'absolute', top: '30%', left: '40%',
    width: 6, height: 6, backgroundColor: '#333', borderRadius: 3, zIndex: 3,
  },
  bowlingHole2: {
    position: 'absolute', top: '45%', left: '30%',
    width: 6, height: 6, backgroundColor: '#333', borderRadius: 3, zIndex: 3,
  },
  bowlingHole3: {
    position: 'absolute', top: '45%', left: '50%',
    width: 6, height: 6, backgroundColor: '#333', borderRadius: 3, zIndex: 3,
  },
  glassReflection: {
    position: 'absolute', top: 5, left: 5, right: 5, height: '30%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 50, zIndex: 1,
  },
  recording: { 
    backgroundColor: '#000', borderColor: '#FF4444', shadowColor: '#FF4444' 
  },
  buttonText: {
    color: '#D4AF37', fontSize: 18, fontWeight: '700', marginBottom: 10, textAlign: 'center'
  },
  wordCountBadge: {
    backgroundColor: 'rgba(46, 139, 87, 0.2)',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#2E8B57', marginBottom: 15,
  },
  wordCountText: {
    color: '#2E8B57', fontSize: 14, fontWeight: 'bold', textAlign: 'center',
  },
  wordCountDisplay: {
    color: '#2E8B57', fontSize: 12, fontWeight: '600', marginBottom: 4,
  },
  languageSelectorsContainer: {
    width: '100%', alignItems: 'center', marginBottom: 10,
  },
  languageToggle: {
    backgroundColor: '#1a1a1a', padding: 12, borderRadius: 10, marginBottom: 8,
    borderWidth: 2, borderColor: '#D4AF37', flexDirection: 'row', alignItems: 'center', width: '85%',
  },
  smallLanguageToggle: {
    padding: 10, borderRadius: 8, width: '80%',
  },
  toLanguageToggle: { borderColor: '#2E8B57', marginBottom: 8 },
  switchButton: {
    backgroundColor: '#1a1a1a', width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#D4AF37',
    marginVertical: 5, shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
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
  conversationsContainer: { width: '100%', flex: 1 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15,
  },
  sectionTitle: { color: '#D4AF37', fontSize: 18, fontWeight: 'bold' },
  clearAllText: { color: '#FF6B6B', fontSize: 14, fontWeight: '600' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyStateText: { color: '#666', fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  emptyStateSubtext: { color: '#444', fontSize: 14, textAlign: 'center' },
  conversationsList: { width: '100%' },
  conversationItem: {
    backgroundColor: '#1a1a1a', borderRadius: 16, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: '#333',
  },
  conversationHeader: { marginBottom: 15 },
  conversationTitle: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6,
  },
  conversationNumber: { color: '#D4AF37', fontSize: 16, fontWeight: 'bold' },
  conversationLanguage: { color: '#2E8B57', fontSize: 12, fontWeight: '600' },
  conversationDetails: { color: '#CCCCCC', fontSize: 12, marginBottom: 6 },
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
  textScroll: { minHeight: 40, marginBottom: 8 },
  originalText: { color: 'white', fontSize: 14, lineHeight: 20 },
  translatedText: { color: '#32CD32', fontSize: 14, lineHeight: 20 },
  playButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#D4AF37',
  },
  smallPlayButton: { paddingHorizontal: 10, paddingVertical: 6, marginTop: 8, alignSelf: 'flex-start' },
  translatedPlayButton: { 
    backgroundColor: 'rgba(46, 139, 87, 0.1)', 
    borderColor: '#2E8B57' 
  },
  playButtonText: { color: '#D4AF37', fontSize: 12, fontWeight: '600', marginLeft: 6 },
  translatedPlayText: { color: '#2E8B57' },
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
    flexDirection: "row", alignItems: "center", backgroundColor: '#000',
    borderWidth: 1, borderColor: '#D4AF37', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1, color: '#D4AF37', fontSize: 16, padding: 0,
  },
  clearButton: { padding: 4 },
  searchResultsText: {
    color: '#2E8B57', fontSize: 12, textAlign: "center", marginBottom: 10, fontStyle: "italic",
  },
  emptySearchContainer: {
    alignItems: "center", justifyContent: "center", paddingVertical: 40,
  },
  emptySearchText: {
    color: '#D4AF37', fontSize: 16, fontWeight: "bold", marginTop: 10,
  },
  emptySearchSubtext: {
    color: '#888', fontSize: 14, marginTop: 5,
  },
  categorySection: { marginBottom: 20 },
  categoryTitle: {
    color: '#D4AF37', fontSize: 16, fontWeight: 'bold', marginBottom: 10,
    paddingHorizontal: 8, borderLeftWidth: 3, borderLeftColor: '#D4AF37', paddingLeft: 12,
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

export default VoiceToVoiceScreen;