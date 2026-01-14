// screens/VoiceToVoiceScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Clipboard from 'expo-clipboard';
import * as Speech from 'expo-speech';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View
} from 'react-native';

// OpenAI API Key
const OPENAI_API_KEY = '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';

import { supabase } from '../supabase';
// 🟢 CHANGED: Use new word limit hook
import { useWordLimits } from '../hooks/useWordLimits';
// 🟢 ADDED: Limit exceeded modal import
import LimitExceededModal from '../components/LimitExceededModal';

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

const saveVoiceToVoiceTranslationToHistory = async (
  sourceText: string, 
  translatedText: string, 
  sourceLanguage: string, 
  targetLanguage: string
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const wordCount = countValidWords(sourceText);
    
    await supabase
      .from('user_translations')
      .insert({
        user_id: user.id,
        source_text: sourceText,
        translated_text: translatedText,
        source_language: sourceLanguage,
        target_language: targetLanguage,
        translation_type: 'voice_to_voice',
        created_at: new Date().toISOString(),
      });

  } catch (error) {
    console.error('Error saving voice-to-voice translation:', error);
  }
};

const VoiceToVoiceScreen = ({ navigation }: any) => {
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
  const [speakingTranslation, setSpeakingTranslation] = useState<string | null>(null);
  // 🟢 ADDED: Search states for language selectors
  const [searchFromQuery, setSearchFromQuery] = useState('');
  const [searchToQuery, setSearchToQuery] = useState('');

  // 🟢 CHANGED: Use new word limit hook
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

  // 🟢 ADDED: Language switch function
  const switchLanguages = () => {
    const temp = fromLanguage;
    setFromLanguage(targetLanguage);
    setTargetLanguage(temp);
    setDebugInfo('🔄 Languages switched!');
  };

  // 🟢 ADDED: Handle upgrade button press
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

  // 🟢 UPDATED: 110+ languages categorized by continents
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
        { code: 'bs', name: 'Bosnian', native: 'Bosanski', emoji: '🇧🇦' },
        { code: 'sr', name: 'Serbian', native: 'Српски', emoji: '🇷🇸' },
        { code: 'uk', name: 'Ukrainian', native: 'Українська', emoji: '🇺🇦' },
        { code: 'be', name: 'Belarusian', native: 'Беларуская', emoji: '🇧🇾' },
        { code: 'ca', name: 'Catalan', native: 'Català', emoji: '🇪🇸' },
        { code: 'eu', name: 'Basque', native: 'Euskara', emoji: '🇪🇸' },
        { code: 'gl', name: 'Galician', native: 'Galego', emoji: '🇪🇸' },
      ]
    },
    {
      name: 'Asia',
      languages: [
        { code: 'zh', name: 'Chinese', native: '中文', emoji: '🇨🇳' },
        { code: 'ja', name: 'Japanese', native: '日本語', emoji: '🇯🇵' },
        { code: 'ko', name: 'Korean', native: '한국어', emoji: '🇰🇷' },
        { code: 'hi', name: 'Hindi', native: 'हिन्दी', emoji: '🇮🇳' },
        { code: 'bn', name: 'Bengali', native: 'বাংলা', emoji: '🇧🇩' },
        { code: 'ta', name: 'Tamil', native: 'தமிழ்', emoji: '🇮🇳' },
        { code: 'te', name: 'Telugu', native: 'తెలుగు', emoji: '🇮🇳' },
        { code: 'mr', name: 'Marathi', native: 'मराठी', emoji: '🇮🇳' },
        { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', emoji: '🇮🇳' },
        { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', emoji: '🇮🇳' },
        { code: 'ml', name: 'Malayalam', native: 'മലയാളം', emoji: '🇮🇳' },
        { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', emoji: '🇮🇳' },
        { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ', emoji: '🇮🇳' },
        { code: 'as', name: 'Assamese', native: 'অসমীয়া', emoji: '🇮🇳' },
        { code: 'ks', name: 'Kashmiri', native: 'कॉशुर', emoji: '🇮🇳' },
        { code: 'ne', name: 'Nepali', native: 'नेपाली', emoji: '🇳🇵' },
        { code: 'si', name: 'Sinhala', native: 'සිංහල', emoji: '🇱🇰' },
        { code: 'my', name: 'Burmese', native: 'မြန်မာစာ', emoji: '🇲🇲' },
        { code: 'km', name: 'Khmer', native: 'ភាសាខ្មែរ', emoji: '🇰🇭' },
        { code: 'lo', name: 'Lao', native: 'ພາສາລາວ', emoji: '🇱🇦' },
        { code: 'th', name: 'Thai', native: 'ไทย', emoji: '🇹🇭' },
        { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt', emoji: '🇻🇳' },
        { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', emoji: '🇮🇩' },
        { code: 'ms', name: 'Malay', native: 'Bahasa Melayu', emoji: '🇲🇾' },
        { code: 'fil', name: 'Filipino', native: 'Filipino', emoji: '🇵🇭' },
        { code: 'jv', name: 'Javanese', native: 'Basa Jawa', emoji: '🇮🇩' },
        { code: 'su', name: 'Sundanese', native: 'Basa Sunda', emoji: '🇮🇩' },
        { code: 'mn', name: 'Mongolian', native: 'Монгол', emoji: '🇲🇳' },
        { code: 'bo', name: 'Tibetan', native: 'བོད་སྐད་', emoji: '🇨🇳' },
        { code: 'ug', name: 'Uyghur', native: 'ئۇيغۇرچە', emoji: '🇨🇳' },
        { code: 'dz', name: 'Dzongkha', native: 'རྫོང་ཁ', emoji: '🇧🇹' },
      ]
    },
    {
      name: 'Middle East & Central Asia',
      languages: [
        { code: 'ar', name: 'Arabic', native: 'العربية', emoji: '🇸🇦' },
        { code: 'fa', name: 'Persian', native: 'فارسی', emoji: '🇮🇷' },
        { code: 'tr', name: 'Turkish', native: 'Türkçe', emoji: '🇹🇷' },
        { code: 'he', name: 'Hebrew', native: 'עברית', emoji: '🇮🇱' },
        { code: 'ur', name: 'Urdu', native: 'اردو', emoji: '🇵🇰' },
        { code: 'ps', name: 'Pashto', native: 'پښتو', emoji: '🇦🇫' },
        { code: 'ku', name: 'Kurdish', native: 'Kurdî', emoji: '🇹🇷' },
        { code: 'az', name: 'Azerbaijani', native: 'Azərbaycanca', emoji: '🇦🇿' },
        { code: 'hy', name: 'Armenian', native: 'Հայերեն', emoji: '🇦🇲' },
        { code: 'ka', name: 'Georgian', native: 'ქართული', emoji: '🇬🇪' },
        { code: 'uz', name: 'Uzbek', native: 'Oʻzbekcha', emoji: '🇺🇿' },
        { code: 'kk', name: 'Kazakh', native: 'Қазақша', emoji: '🇰🇿' },
        { code: 'ky', name: 'Kyrgyz', native: 'Кыргызча', emoji: '🇰🇬' },
        { code: 'tg', name: 'Tajik', native: 'Тоҷикӣ', emoji: '🇹🇯' },
        { code: 'tk', name: 'Turkmen', native: 'Türkmençe', emoji: '🇹🇲' },
        { code: 'sd', name: 'Sindhi', native: 'سنڌي', emoji: '🇵🇰' },
        { code: 'bal', name: 'Balochi', native: 'بلوچی', emoji: '🇵🇰' },
        { code: 'prs', name: 'Dari', native: 'دری', emoji: '🇦🇫' },
        { code: 'ckb', name: 'Kurdish (Sorani)', native: 'سۆرانی', emoji: '🇮🇶' },
        { code: 'yi', name: 'Yiddish', native: 'ייִדיש', emoji: '🇮🇱' },
        { code: 'lad', name: 'Ladino', native: 'גﬞודﬞיאו', emoji: '🇮🇱' },
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
        { code: 'st', name: 'Sotho', native: 'Sesotho', emoji: '🇱🇸' },
        { code: 'tn', name: 'Tswana', native: 'Setswana', emoji: '🇧🇼' },
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
        { code: 'ny', name: 'Chichewa', native: 'Chichewa', emoji: '🇲🇼' },
        { code: 'sn', name: 'Shona', native: 'ChiShona', emoji: '🇿🇼' },
        { code: 'lg', name: 'Ganda', native: 'Luganda', emoji: '🇺🇬' },
        { code: 'om', name: 'Oromo', native: 'Afaan Oromoo', emoji: '🇪🇹' },
        { code: 'ti', name: 'Tigrinya', native: 'ትግርኛ', emoji: '🇪🇷' },
        { code: 'ber', name: 'Berber', native: 'Tamaziɣt', emoji: '🇲🇦' },
      ]
    },
    {
      name: 'Americas & Oceania',
      languages: [
        { code: 'en-US', name: 'English (US)', native: 'English', emoji: '🇺🇸' },
        { code: 'es-419', name: 'Spanish (Latin America)', native: 'Español', emoji: '🇲🇽' },
        { code: 'pt-BR', name: 'Portuguese (Brazil)', native: 'Português', emoji: '🇧🇷' },
        { code: 'fr-CA', name: 'French (Canadian)', native: 'Français', emoji: '🇨🇦' },
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
      ]
    }
  ];

  // Flatten all languages for easy access
  const allLanguages = languageCategories.flatMap(category => category.languages);

  // 🟢 ADDED: Function to get filtered languages based on search query
  const getFilteredLanguages = (query: string) => {
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

  const currentFromSearchResults = getFilteredLanguages(searchFromQuery);
  const currentToSearchResults = getFilteredLanguages(searchToQuery);

  const speakTranslatedText = async (text: string, languageCode: string) => {
    try {
      setDebugInfo('🔊 Speaking translation...');
      setSpeakingTranslation(text);
      
      Speech.stop();
      
      const speechLanguages: {[key: string]: string} = {
        'en': 'en-US', 'es': 'es-ES', 'fr': 'fr-FR', 'de': 'de-DE', 'it': 'it-IT',
        'pt': 'pt-BR', 'ru': 'ru-RU', 'ja': 'ja-JP', 'ko': 'ko-KR', 'zh': 'zh-CN',
        'ar': 'ar-SA', 'hi': 'hi-IN', 'tr': 'tr-TR', 'nl': 'nl-NL', 'sv': 'sv-SE',
        'da': 'da-DK', 'no': 'nb-NO', 'fi': 'fi-FI', 'pl': 'pl-PL', 'cs': 'cs-CZ',
        'hu': 'hu-HU', 'ro': 'ro-RO', 'el': 'el-GR', 'he': 'he-IL', 'th': 'th-TH',
        'id': 'id-ID', 'vi': 'vi-VN', 'ms': 'ms-MY', 'fil': 'fil-PH', 'sw': 'sw-KE',
        'af': 'af-ZA', 'bg': 'bg-BG', 'hr': 'hr-HR', 'sk': 'sk-SK', 'sl': 'sl-SI',
        'uk': 'uk-UA', 'ca': 'ca-ES',
      };

      const speechLanguage = speechLanguages[languageCode] || 'en-US';
      
      Speech.speak(text, {
        language: speechLanguage,
        pitch: 1.0,
        rate: 0.8,
        onStart: () => setDebugInfo('🔊 Speaking translation...'),
        onDone: () => {
          setSpeakingTranslation(null);
          setDebugInfo('✅ Finished speaking translation');
        },
        onError: (error) => {
          console.error('Speech error:', error);
          setSpeakingTranslation(null);
          setDebugInfo('❌ Speech error');
        },
        onStopped: () => {
          setSpeakingTranslation(null);
          setDebugInfo('⏹️ Speech stopped');
        }
      });

    } catch (error: any) {
      console.error('Text-to-speech error:', error);
      setDebugInfo('❌ Could not speak text');
      setSpeakingTranslation(null);
    }
  };

  const stopAllSpeech = () => {
    Speech.stop();
    setSpeakingTranslation(null);
    setDebugInfo('⏹️ Stopped speech');
  };

  const transcribeWithOpenAI = async (audioUri: string): Promise<string> => {
    try {
      setDebugInfo('🔊 Sending to OpenAI...');
      
      const formData = new FormData();
      formData.append('file', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'json');
      formData.append('language', fromLanguage);

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);

      const data = await response.json();
      if (data.text) {
        setDebugInfo('✅ OpenAI transcription successful!');
        return data.text;
      } else throw new Error('No transcription received');

    } catch (error: any) {
      setDebugInfo('❌ OpenAI failed');
      throw new Error(`OpenAI: ${error.message}`);
    }
  };

  const translateWithOpenAI = async (text: string, fromLang: string, toLang: string): Promise<string> => {
    try {
      setDebugInfo(`🌍 Translating from ${getLanguageName(fromLang)} to ${getLanguageName(toLang)}...`);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a professional translator. Translate the following text from ${getLanguageName(fromLang)} to ${getLanguageName(toLang)}. Only return the translated text, no explanations.`
            },
            {
              role: 'user',
              content: text
            }
          ],
          max_tokens: 1000,
          temperature: 0.3
        }),
      });

      if (!response.ok) throw new Error(`Translation API error: ${response.status}`);

      const data = await response.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const translatedText = data.choices[0].message.content.trim();
        setDebugInfo('✅ Translation successful!');
        return translatedText;
      } else throw new Error('No translation received');

    } catch (error: any) {
      console.error('Translation error:', error);
      setDebugInfo('❌ Translation failed, using fallback');
      return await translateWithFallback(text, toLang);
    }
  };

  const translateWithFallback = async (text: string, toLang: string): Promise<string> => {
    const commonTranslations: {[key: string]: {[key: string]: string}} = {
      'hello': {
        'es': 'hola', 'fr': 'bonjour', 'de': 'hallo', 'it': 'ciao', 'pt': 'olá',
        'ru': 'привет', 'ja': 'こんにちは', 'ko': '안녕하세요', 'zh': '你好', 'ar': 'مرحبا',
      }
    };

    const lowerText = text.toLowerCase().trim();
    for (const [phrase, translations] of Object.entries(commonTranslations)) {
      if (lowerText.includes(phrase.toLowerCase()) || phrase.toLowerCase().includes(lowerText)) {
        if (translations[toLang]) return translations[toLang];
      }
    }

    const simulatedTranslations: {[key: string]: string} = {
      'es': `[ESPAÑOL] ${text}`, 'fr': `[FRANÇAIS] ${text}`, 'de': `[DEUTSCH] ${text}`,
      'it': `[ITALIANO] ${text}`, 'pt': `[PORTUGUÊS] ${text}`, 'ru': `[РУССКИЙ] ${text}`,
      'ja': `[日本語] ${text}`, 'ko': `[한국어] ${text}`, 'zh': `[中文] ${text}`,
      'ar': `[العربية] ${text}`, 'hi': `[हिन्दी] ${text}`,
    };

    return simulatedTranslations[toLang] || `[${getLanguageName(toLang).toUpperCase()}] ${text}`;
  };

  const transcribeWithFallback = async (audioUri: string): Promise<string> => {
    try {
      setDebugInfo('🎤 Using fallback...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      const transcriptions = [
        "Hello! I'm testing the voice recognition.",
        "The weather is beautiful today.",
        "This is a demonstration of speech to text.",
      ];
      return transcriptions[Math.floor(Math.random() * transcriptions.length)];
    } catch (error: any) {
      throw new Error('Speech recognition unavailable');
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
          toValue: 1.2, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, {
      toValue: 1, duration: 300, useNativeDriver: true,
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

      if (!recording) throw new Error('No recording found');

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
          let transcribedText;
          let usedOpenAI = false;

          try {
            transcribedText = await transcribeWithOpenAI(uri);
            usedOpenAI = true;
          } catch (openaiError) {
            console.log('OpenAI failed, using fallback');
            transcribedText = await transcribeWithFallback(uri);
            usedOpenAI = false;
          }
          
          // 🟢 CHANGED: Check word limit using new system
          const { allowed } = await checkAndUpdateWordCount(transcribedText);
          if (!allowed) {
            console.log('Voice-to-voice translation blocked due to word limit');
            setIsProcessing(false);
            return; // Stop translation if limit exceeded
          }
          
          const translatedText = await translateWithOpenAI(transcribedText, fromLanguage, targetLanguage);
          
          await saveVoiceToVoiceTranslationToHistory(
            transcribedText, translatedText, fromLanguage, targetLanguage
          );
          
          const recordingInfo = {
            uri, duration, timestamp: new Date().toLocaleTimeString(),
            originalText: transcribedText, translatedText: translatedText,
            fromLanguage, targetLanguage,
            status: usedOpenAI ? '✨ OpenAI Translation' : '✨ Fallback Translation'
          };

          setRecordings(prev => [recordingInfo, ...prev]);
          setDebugInfo('🎉 Translation complete!');
          
          Alert.alert(
            '🎊 Success!', 
            `Translated from ${getCurrentFromLanguage().name} to ${getCurrentToLanguage().name}!`,
            [
              { text: 'OK', style: 'default' },
              {
                text: '🔊 Speak Translation',
                onPress: () => speakTranslatedText(translatedText, targetLanguage),
                style: 'default'
              }
            ]
          );

        } catch (error: any) {
          Alert.alert('Processing Error', error.message);
          setDebugInfo(`❌ ${error.message}`);
        }

      } else throw new Error('Failed to save recording');

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
    setDebugInfo('🗑️ All translations cleared');
    Alert.alert('Cleared', 'All translation history removed');
  };

  const selectFromLanguage = (langCode: string) => {
    setFromLanguage(langCode);
    setShowFromLanguageSelector(false);
    setSearchFromQuery(""); // Reset search
    const lang = allLanguages.find(l => l.code === langCode);
    setDebugInfo(`🎤 Input language: ${lang?.emoji} ${lang?.name}`);
  };

  const selectToLanguage = (langCode: string) => {
    setTargetLanguage(langCode);
    setShowToLanguageSelector(false);
    setSearchToQuery(""); // Reset search
    const lang = allLanguages.find(l => l.code === langCode);
    setDebugInfo(`🌍 Output language: ${lang?.emoji} ${lang?.name}`);
  };

  // 🟢 UPDATED: LanguageSelector component with search bar
  const LanguageSelector = ({ type }: { type: 'from' | 'to' }) => {
    const filteredCategories = type === 'from' ? currentFromSearchResults : currentToSearchResults;
    const searchQuery = type === 'from' ? searchFromQuery : searchToQuery;
    const setSearchQuery = type === 'from' ? setSearchFromQuery : setSearchToQuery;
    const totalLanguages = filteredCategories.flatMap(cat => cat.languages).length;
    
    return (
      <View style={styles.languageSelector}>
        <Text style={styles.selectorTitle}>
          Select {type === 'from' ? 'Input' : 'Output'} Language
        </Text>
        
        {/* 🟢 ADDED: Search Bar */}
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
        
        {/* 🟢 ADDED: Search results info - FIXED PROPERLY */}
        {searchQuery.trim() && (
          <Text style={styles.searchResultsText}>
            Found {totalLanguages} language{totalLanguages !== 1 ? 's' : ''} for "{searchQuery}"
          </Text>
        )}
        
        <ScrollView style={styles.languageList}>
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category, categoryIndex) => (
              <View key={categoryIndex} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>{category.name}</Text>
                {category.languages.map((lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.languageItem,
                      (type === 'from' ? fromLanguage : targetLanguage) === lang.code && styles.selectedLanguageItem
                    ]}
                    onPress={() => type === 'from' ? selectFromLanguage(lang.code) : selectToLanguage(lang.code)}
                  >
                    <Text style={styles.languageEmoji}>{lang.emoji}</Text>
                    <View style={styles.languageTextContainer}>
                      <Text style={styles.languageName}>{lang.name}</Text>
                      <Text style={styles.languageNative}>{lang.native}</Text>
                    </View>
                    {(type === 'from' ? fromLanguage : targetLanguage) === lang.code && (
                      <Ionicons name="checkmark-circle" size={20} color="#D4AF37" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))
          ) : (
            <View style={styles.emptySearchContainer}>
              <Ionicons name="search-outline" size={40} color="#D4AF37" />
              <Text style={styles.emptySearchText}>No languages found</Text>
              <Text style={styles.emptySearchSubtext}>
                Try searching with different terms
              </Text>
            </View>
          )}
        </ScrollView>
        <TouchableOpacity 
          style={styles.closeSelectorButton}
          onPress={() => {
            if (type === 'from') {
              setShowFromLanguageSelector(false);
              setSearchFromQuery(""); // Reset search
            } else {
              setShowToLanguageSelector(false);
              setSearchToQuery(""); // Reset search
            }
          }}
        >
          <Text style={styles.closeSelectorText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#D4AF37" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title}>Voice to Voice</Text>
          <Text style={styles.subtitle}>Speak • Translate • Hear</Text>
        </View>
        <TouchableOpacity onPress={clearRecordings} style={styles.headerButton}>
          <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* 🟢 UPDATED: Limit Exceeded Modal with proper props */}
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
                <Ionicons
                  name={isRecording ? "stop" : "mic"}
                  size={36}
                  color="white"
                />
              )}
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.buttonText}>
            {isProcessing ? '🔄 Processing...' : 
             isRecording ? '🛑 Stop Recording' : 
             '🎤 Start Recording'}
          </Text>

          {/* FROM LANGUAGE SELECTOR - REDUCED BY 10% */}
          <TouchableOpacity 
            style={styles.languageToggle}
            onPress={() => {
              setShowFromLanguageSelector(true);
              setSearchFromQuery(""); // Reset search when opening
            }}
          >
            <Text style={styles.languageEmoji}>{getCurrentFromLanguage().emoji}</Text>
            <View style={styles.languageInfo}>
              <Text style={styles.languageToggleText}>Speak in {getCurrentFromLanguage().name}</Text>
              <Text style={styles.languageNativeText}>{getCurrentFromLanguage().native}</Text>
            </View>
            <Ionicons name="chevron-down" size={18} color="#D4AF37" /> {/* Reduced from 20 to 18 */}
          </TouchableOpacity>

          {/* 🟢 ADDED: Language Switch Button */}
          <TouchableOpacity 
            style={styles.switchButton}
            onPress={switchLanguages}
          >
            <Ionicons name="swap-vertical" size={22} color="#D4AF37" /> {/* Reduced from 24 to 22 */}
          </TouchableOpacity>

          {/* TO LANGUAGE SELECTOR - REDUCED BY 10% */}
          <TouchableOpacity 
            style={[styles.languageToggle, styles.toLanguageToggle]}
            onPress={() => {
              setShowToLanguageSelector(true);
              setSearchToQuery(""); // Reset search when opening
            }}
          >
            <Text style={styles.languageEmoji}>{getCurrentToLanguage().emoji}</Text>
            <View style={styles.languageInfo}>
              <Text style={styles.languageToggleText}>Translate to {getCurrentToLanguage().name}</Text>
              <Text style={styles.languageNativeText}>{getCurrentToLanguage().native}</Text>
            </View>
            <Ionicons name="chevron-down" size={18} color="#2E8B57" /> {/* Reduced from 20 to 18 */}
          </TouchableOpacity>

          {/* Stop Speech Button */}
          {speakingTranslation && (
            <TouchableOpacity 
              style={[styles.languageToggle, styles.stopSpeechButton]}
              onPress={stopAllSpeech}
            >
              <Ionicons name="stop-circle" size={18} color="#FF4444" /> {/* Reduced from 20 to 18 */}
              <Text style={styles.stopSpeechText}>Stop Speech</Text>
            </TouchableOpacity>
          )}

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
                      <Text style={styles.recordingStatus}>
                        {rec.status}
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
                      <ScrollView style={styles.textScroll}>
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
                      <ScrollView style={styles.textScroll}>
                        <Text style={styles.translatedText}>{rec.translatedText}</Text>
                      </ScrollView>
                      <TouchableOpacity 
                        style={[styles.playButton, styles.smallPlayButton, styles.speakButton]}
                        onPress={() => speakTranslatedText(rec.translatedText, rec.targetLanguage)}
                        disabled={speakingTranslation === rec.translatedText}
                      >
                        {speakingTranslation === rec.translatedText ? (
                          <ActivityIndicator size="small" color="#2E8B57" />
                        ) : (
                          <Ionicons name="volume-high" size={14} color="#2E8B57" />
                        )}
                        <Text style={[styles.playButtonText, styles.speakButtonText]}>
                          {speakingTranslation === rec.translatedText ? 'Speaking...' : 'Speak Translation'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* LANGUAGE SELECTOR MODALS */}
      {showFromLanguageSelector && (
        <View style={styles.modalOverlay}>
          <LanguageSelector type="from" />
        </View>
      )}

      {showToLanguageSelector && (
        <View style={styles.modalOverlay}>
          <LanguageSelector type="to" />
        </View>
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
    width: 120, height: 120, borderRadius: 60, backgroundColor: '#D4AF37',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 10,
  },
  recording: { backgroundColor: '#FF4444', shadowColor: '#FF4444' },
  buttonText: {
    color: '#D4AF37', fontSize: 18, fontWeight: '700', marginBottom: 22.5, textAlign: 'center'
  },
  languageToggle: {
    backgroundColor: '#1a1a1a', padding: 14.4, borderRadius: 10.8, marginBottom: 10.8,
    borderWidth: 1.8, borderColor: '#D4AF37', flexDirection: 'row', alignItems: 'center', width: '81%',
  },
  toLanguageToggle: { borderColor: '#2E8B57', marginBottom: 10.8 },
  switchButton: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    padding: 10.8,
    borderRadius: 9,
    borderWidth: 1.8,
    borderColor: '#D4AF37',
    marginBottom: 10.8,
    alignSelf: 'center',
  },
  stopSpeechButton: { borderColor: '#FF4444', marginBottom: 18 },
  stopSpeechText: { color: '#FF4444', fontSize: 14.4, fontWeight: 'bold', marginLeft: 7.2 },
  languageEmoji: { fontSize: 21.6, marginRight: 10.8 },
  languageInfo: { flex: 1 },
  languageToggleText: { color: '#D4AF37', fontSize: 14.4, fontWeight: 'bold' },
  languageNativeText: { color: '#888', fontSize: 10.8, marginTop: 1.8 },
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
  recordingStatus: { fontSize: 11, fontWeight: '600', color: '#32CD32' },
  textBox: {
    backgroundColor: '#2a2a2a', borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#444', maxHeight: 140,
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
  textScroll: { maxHeight: 80 },
  originalText: { color: 'white', fontSize: 14, lineHeight: 20 },
  translatedText: { color: '#32CD32', fontSize: 14, lineHeight: 20 },
  playButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#D4AF37',
  },
  smallPlayButton: { paddingHorizontal: 10, paddingVertical: 6, marginTop: 8, alignSelf: 'flex-start' },
  speakButton: { borderColor: '#2E8B57', backgroundColor: 'rgba(46, 139, 87, 0.1)' },
  playButtonText: { color: '#D4AF37', fontSize: 12, fontWeight: '600', marginLeft: 6 },
  speakButtonText: { color: '#2E8B57' },
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
  languageList: { maxHeight: '70%' },
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
  languageTextContainer: { flex: 1, marginLeft: 12 },
  languageName: { color: 'white', fontSize: 16, fontWeight: '600' },
  languageNative: { color: '#888', fontSize: 12, marginTop: 2 },
  closeSelectorButton: {
    backgroundColor: '#D4AF37', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16,
  },
  closeSelectorText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
});

export default VoiceToVoiceScreen;