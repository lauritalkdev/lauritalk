// ConversationScreen.tsx (PHASE 1 COMPLETE - Real-time + Menu + Last Seen Fixed)
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Animated,
  Clipboard,
  FlatList,
  Keyboard,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { chatService } from '../services/chatService';
import { ChatMessage, SendMessagePayload, TranslationMethod } from '../src/types/chat';

// Format relative time (e.g., "2 hours ago", "5 minutes ago")
const formatLastSeen = (timestamp: string | null): string => {
  if (!timestamp) return 'Never';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
};

type ConversationRouteParams = {
  otherUserId: string;
  otherUsername: string;
  otherFullName: string;
};

// PHASE 3: Available reactions
const AVAILABLE_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

// PHASE 3: Message Reaction type
type MessageReaction = {
  messageId: string;
  reaction: string;
  userId: string;
};

// OPENAI SUPPORTED LANGUAGES - 60 HIGH-QUALITY Languages
const OPENAI_SUPPORTED_LANGUAGES = [
  // Major World Languages (37)
  { code: 'en', name: 'English', nativeName: 'English', emoji: '🇬🇧' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', emoji: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', emoji: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', emoji: '🇩🇪' },
  { code: 'zh-Hans', name: 'Chinese (Simplified)', nativeName: '中文(简体)', emoji: '🇨🇳' },
  { code: 'zh-Hant', name: 'Chinese (Traditional)', nativeName: '中文(繁體)', emoji: '🇭🇰' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', emoji: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', emoji: '🇰🇷' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', emoji: '🇵🇹' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', emoji: '🇮🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', emoji: '🇷🇺' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', emoji: '🇸🇦' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', emoji: '🇮🇳' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', emoji: '🇹🇷' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', emoji: '🇳🇱' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', emoji: '🇸🇪' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', emoji: '🇩🇰' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', emoji: '🇳🇴' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', emoji: '🇫🇮' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', emoji: '🇵🇱' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', emoji: '🇨🇿' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', emoji: '🇭🇺' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', emoji: '🇷🇴' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', emoji: '🇬🇷' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', emoji: '🇮🇱' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', emoji: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', emoji: '🇻🇳' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', emoji: '🇮🇩' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', emoji: '🇲🇾' },
  { code: 'fil', name: 'Filipino', nativeName: 'Filipino', emoji: '🇵🇭' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', emoji: '🇰🇪' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', emoji: '🇿🇦' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', emoji: '🇿🇦' },
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa', emoji: '🇿🇦' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', emoji: '🇳🇬' },
  { code: 'ig', name: 'Igbo', nativeName: 'Igbo', emoji: '🇳🇬' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa', emoji: '🇳🇬' },
  // Well-Supported Additional Languages (23)
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', emoji: '🇧🇩' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', emoji: '🇵🇰' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', emoji: '🇮🇷' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', emoji: '🇺🇦' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', emoji: '🇧🇬' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', emoji: '🇭🇷' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски', emoji: '🇷🇸' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', emoji: '🇸🇰' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', emoji: '🇸🇮' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', emoji: '🇱🇹' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', emoji: '🇱🇻' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti', emoji: '🇪🇪' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català', emoji: '🇪🇸' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', emoji: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', emoji: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', emoji: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', emoji: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', emoji: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', emoji: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', emoji: '🇮🇳' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', emoji: '🇪🇹' },
  { code: 'so', name: 'Somali', nativeName: 'Soomaali', emoji: '🇸🇴' },
  { code: 'hy', name: 'Armenian', nativeName: 'Հայերեն', emoji: '🇦🇲' },
];

// Helper function to get language name from code
const getLanguageName = (code: string): string => {
  const lang = OPENAI_SUPPORTED_LANGUAGES.find(l => l.code === code);
  return lang ? lang.nativeName : code.toUpperCase();
};

// Helper function to get language emoji from code
const getLanguageEmoji = (code: string): string => {
  const lang = OPENAI_SUPPORTED_LANGUAGES.find(l => l.code === code);
  return lang ? lang.emoji : '🌐';
};

// Format date for date separators
const formatDateForSeparator = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
};

// Type for grouped messages
type GroupedMessage = {
  date: string;
  messages: ChatMessage[];
};

// Create animated typing dots component
const TypingDots = () => {
  const dot1Opacity = useRef(new Animated.Value(0.4)).current;
  const dot2Opacity = useRef(new Animated.Value(0.4)).current;
  const dot3Opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animateDots = (): void => {
      // Dot 1 animation
      Animated.sequence([
        Animated.timing(dot1Opacity, {
          toValue: 0.8,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dot1Opacity, {
          toValue: 0.4,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      // Dot 2 animation (starts after delay)
      setTimeout(() => {
        Animated.sequence([
          Animated.timing(dot2Opacity, {
            toValue: 0.8,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot2Opacity, {
            toValue: 0.4,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      }, 200);

      // Dot 3 animation (starts after longer delay)
      setTimeout(() => {
        Animated.sequence([
          Animated.timing(dot3Opacity, {
            toValue: 0.8,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot3Opacity, {
            toValue: 0.4,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      }, 400);
    };

    const interval = setInterval(animateDots, 1200);
    animateDots();

    return () => clearInterval(interval);
  }, [dot1Opacity, dot2Opacity, dot3Opacity]);

  return (
    <View style={styles.typingDots}>
      <Animated.View style={[styles.typingDot, { opacity: dot1Opacity }]} />
      <Animated.View style={[styles.typingDot, { opacity: dot2Opacity }]} />
      <Animated.View style={[styles.typingDot, { opacity: dot3Opacity }]} />
    </View>
  );
};

// PHASE 3: Reaction Picker Modal Component
const ReactionPicker = ({
  visible,
  onClose,
  onSelectReaction,
  messageId
}: {
  visible: boolean;
  onClose: () => void;
  onSelectReaction: (messageId: string, reaction: string) => void;
  messageId: string;
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.reactionPickerOverlay} 
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.reactionPickerContainer}>
          <Text style={styles.reactionPickerTitle}>React to message</Text>
          <View style={styles.reactionPickerGrid}>
            {AVAILABLE_REACTIONS.map((reaction) => (
              <TouchableOpacity
                key={reaction}
                style={styles.reactionButton}
                onPress={() => {
                  onSelectReaction(messageId, reaction);
                  onClose();
                }}
              >
                <Text style={styles.reactionEmoji}>{reaction}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// NEW: Action Sheet Menu Component for Android
const ActionSheetMenu = ({
  visible,
  onClose,
  options,
  title
}: {
  visible: boolean;
  onClose: () => void;
  options: { label: string; onPress: () => void; icon?: string; destructive?: boolean }[];
  title?: string;
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.actionSheetOverlay} 
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.actionSheetContainer}>
          {title && (
            <View style={styles.actionSheetHeader}>
              <Text style={styles.actionSheetTitle}>{title}</Text>
            </View>
          )}
          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.actionSheetOption,
                option.destructive && styles.actionSheetOptionDestructive
              ]}
              onPress={() => {
                onClose();
                option.onPress();
              }}
            >
              {option.icon && (
                <Ionicons 
                  name={option.icon as any} 
                  size={20} 
                  color={option.destructive ? '#ff3b30' : COLORS.gold} 
                  style={styles.actionSheetIcon}
                />
              )}
              <Text style={[
                styles.actionSheetOptionText,
                option.destructive && styles.actionSheetOptionTextDestructive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.actionSheetOption, styles.actionSheetCancel]}
            onPress={onClose}
          >
            <Text style={styles.actionSheetCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// Language Selector Component  
const LanguageSelector = ({
  visible,
  onClose,
  currentLanguage,
  onLanguageSelect,
  isPremiumUser
}: {
  visible: boolean;
  onClose: () => void;
  currentLanguage: string;
  onLanguageSelect: (languageCode: string) => void;
  isPremiumUser: boolean;
}) => {
  const [selectedLang, setSelectedLang] = useState(currentLanguage);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter languages based on search query
  const filteredLanguages = OPENAI_SUPPORTED_LANGUAGES.filter(lang =>
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (code: string) => {
    if (!isPremiumUser) {
      Alert.alert(
        'Chat Translation Feature',
        'Visit the website to enable chat translation: www.lauritalk.com/login',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Visit Website', 
            onPress: () => Linking.openURL('https://www.lauritalk.com/login')
          }
        ]
      );
      return;
    }
    
    setSelectedLang(code);
    onLanguageSelect(code);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.languageModalOverlay}>
        <View style={styles.languageModalContent}>
          <View style={styles.languageModalHeader}>
            <View>
              <Text style={styles.languageModalTitle}>Select Language</Text>
              <Text style={styles.languageModalSubtitle}>
                {isPremiumUser ? '60 languages available' : 'Visit website to enable translation'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.gold} />
            </TouchableOpacity>
          </View>
          
          {!isPremiumUser && (
            <View style={styles.premiumWarning}>
              <Ionicons name="lock-closed" size={16} color={COLORS.gold} />
              <Text style={styles.premiumWarningText}>
                Visit www.lauritalk.com/login to enable chat translation
              </Text>
            </View>
          )}
          
          {/* Search Input */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={COLORS.gold} style={styles.searchIcon} />
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
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#888" />
              </TouchableOpacity>
            )}
          </View>
          
          <ScrollView style={styles.languageList}>
            {filteredLanguages.length === 0 ? (
              <Text style={styles.noResultsText}>No languages found</Text>
            ) : (
              filteredLanguages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageItem,
                    selectedLang === lang.code && styles.languageItemSelected,
                    !isPremiumUser && styles.languageItemDisabled
                  ]}
                  onPress={() => handleSelect(lang.code)}
                  disabled={!isPremiumUser}
                >
                  <Text style={styles.languageEmojiSelector}>{lang.emoji}</Text>
                  <View style={styles.languageInfo}>
                    <Text style={[
                      styles.languageName,
                      !isPremiumUser && styles.languageNameDisabled
                    ]}>
                      {lang.nativeName}
                    </Text>
                    <Text style={[
                      styles.languageEnglishName,
                      !isPremiumUser && styles.languageEnglishNameDisabled
                    ]}>
                      {lang.name} ({lang.code})
                    </Text>
                  </View>
                  {selectedLang === lang.code && (
                    <Ionicons name="checkmark" size={20} color={COLORS.gold} />
                  )}
                  {!isPremiumUser && (
                    <Ionicons name="lock-closed" size={14} color="#888" />
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default function ConversationScreen(): React.ReactElement {
  const route = useRoute<RouteProp<{ params: ConversationRouteParams }, 'params'>>();
  const navigation = useNavigation();
  const { otherUserId, otherUsername, otherFullName } = route.params;
  
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Presence and typing state
  const [isUserOnline, setIsUserOnline] = useState<boolean>(false);
  const [lastSeenTimestamp, setLastSeenTimestamp] = useState<string | null>(null);
  const [otherUserIsTyping, setOtherUserIsTyping] = useState<boolean>(false);
  
  // Language states
  const [userLanguage, setUserLanguage] = useState<string>('en');
  const [showLanguageSelector, setShowLanguageSelector] = useState<boolean>(false);
  const [isPremiumUser, setIsPremiumUser] = useState<boolean>(false);
  const [updatingLanguage, setUpdatingLanguage] = useState<boolean>(false);
  const [showTranslations, setShowTranslations] = useState<boolean>(true);
  const [showOriginalText, setShowOriginalText] = useState<Map<string, boolean>>(new Map());
  
  // Translation state - FRONTEND ONLY WITH OPENAI
  const [translatingMessages, setTranslatingMessages] = useState<boolean>(false);
  const [translationServiceAvailable, setTranslationServiceAvailable] = useState<boolean>(true);
  
  // Local storage for translations
  const [translationCache, setTranslationCache] = useState<Map<string, string>>(new Map());
  
  // Keyboard state
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState<boolean>(false);
  
  // NEW: More options menu state
  const [showMoreOptions, setShowMoreOptions] = useState<boolean>(false);
  
  // PHASE 2: Message long-press menu state
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [showMessageOptions, setShowMessageOptions] = useState<boolean>(false);
  
  // PHASE 3: Reaction states
  const [messageReactions, setMessageReactions] = useState<Map<string, MessageReaction[]>>(new Map());
  const [showReactionPicker, setShowReactionPicker] = useState<boolean>(false);
  const [reactionPickerMessageId, setReactionPickerMessageId] = useState<string>('');
  
  // Refs
  const flatListRef = useRef<FlatList<GroupedMessage>>(null);
  const textInputRef = useRef<TextInput>(null);
  const subscriptionRef = useRef<(() => void) | null>(null);
  const presenceSubscriptionRef = useRef<(() => void) | null>(null);
  const typingSubscriptionRef = useRef<(() => void) | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // FIX #1: Ref to track current messages (prevents stale closure in subscription)
  const messagesRef = useRef<ChatMessage[]>([]);
  
  const INPUT_WRAPPER_HEIGHT = 80;

  // Function to handle website redirection
  const handleWebsiteRedirect = () => {
    Linking.openURL('https://www.lauritalk.com/login').catch(err => {
      console.error('Failed to open URL:', err);
      Alert.alert('Error', 'Could not open the website. Please try again.');
    });
  };

  // FIX #2: Handle More Options Menu (3-dots menu)
  const handleMoreOptions = () => {
    const options = [
      'Clear Chat',
      'Mute Notifications',
      'Block User',
      'Report User',
      'Cancel'
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex: [2, 3],
          cancelButtonIndex: 4,
          title: `Chat with ${otherFullName || otherUsername}`,
        },
        (buttonIndex) => {
          switch (buttonIndex) {
            case 0:
              handleClearChat();
              break;
            case 1:
              handleMuteNotifications();
              break;
            case 2:
              handleBlockUser();
              break;
            case 3:
              handleReportUser();
              break;
          }
        }
      );
    } else {
      // Android: Show custom modal
      setShowMoreOptions(true);
    }
  };

  const handleClearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear this chat? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setMessages([]);
            setMessageReactions(new Map());
            Alert.alert('Success', 'Chat cleared successfully');
          }
        }
      ]
    );
  };

  const handleMuteNotifications = () => {
    Alert.alert(
      'Mute Notifications',
      'Mute notifications for this chat?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '1 hour', onPress: () => console.log('Muted for 1 hour') },
        { text: '8 hours', onPress: () => console.log('Muted for 8 hours') },
        { text: 'Forever', onPress: () => console.log('Muted forever') }
      ]
    );
  };

  const handleBlockUser = () => {
    Alert.alert(
      'Block User',
      `Block ${otherFullName || otherUsername}? They will no longer be able to send you messages.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            console.log('User blocked');
            Alert.alert('Success', 'User blocked successfully');
            navigation.goBack();
          }
        }
      ]
    );
  };

  const handleReportUser = () => {
    Alert.alert(
      'Report User',
      `Report ${otherFullName || otherUsername} for inappropriate behavior?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: () => {
            console.log('User reported');
            Alert.alert('Success', 'User reported successfully. We will review this report.');
          }
        }
      ]
    );
  };

  // PHASE 2: Handle message long-press
  const handleMessageLongPress = (message: ChatMessage) => {
    setSelectedMessage(message);
    const isSentByMe = message.sender_id === currentUserId;
    
    if (Platform.OS === 'ios') {
      const options = isSentByMe 
        ? ['Copy Text', 'Delete Message', 'React', 'Cancel']
        : ['Copy Text', 'React', 'Cancel'];
      
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex: isSentByMe ? 1 : undefined,
          cancelButtonIndex: isSentByMe ? 3 : 2,
        },
        (buttonIndex) => {
          if (isSentByMe) {
            switch (buttonIndex) {
              case 0: handleCopyText(message); break;
              case 1: handleDeleteMessage(message); break;
              case 2: handleReactToMessage(message.id); break;
            }
          } else {
            switch (buttonIndex) {
              case 0: handleCopyText(message); break;
              case 1: handleReactToMessage(message.id); break;
            }
          }
        }
      );
    } else {
      setShowMessageOptions(true);
    }
  };

  // PHASE 2: Copy message text
  const handleCopyText = (message: ChatMessage) => {
    const { text } = getDisplayText(message);
    Clipboard.setString(text);
    Alert.alert('Copied', 'Message copied to clipboard');
  };

  // PHASE 2: Delete message
  const handleDeleteMessage = (message: ChatMessage) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setMessages(prev => prev.filter(msg => msg.id !== message.id));
            setMessageReactions(prev => {
              const newReactions = new Map(prev);
              newReactions.delete(message.id);
              return newReactions;
            });
          }
        }
      ]
    );
  };

  // PHASE 3: React to message
  const handleReactToMessage = (messageId: string) => {
    setReactionPickerMessageId(messageId);
    setShowReactionPicker(true);
  };

  // PHASE 3: Add/remove reaction
  const handleAddReaction = (messageId: string, reaction: string) => {
    if (!currentUserId) return;
    
    setMessageReactions(prev => {
      const newReactions = new Map(prev);
      const existingReactions = newReactions.get(messageId) || [];
      const userReactionIndex = existingReactions.findIndex(
        r => r.userId === currentUserId && r.reaction === reaction
      );
      
      if (userReactionIndex >= 0) {
        existingReactions.splice(userReactionIndex, 1);
      } else {
        const filteredReactions = existingReactions.filter(r => r.userId !== currentUserId);
        filteredReactions.push({ messageId, reaction, userId: currentUserId });
        newReactions.set(messageId, filteredReactions);
        return newReactions;
      }
      
      newReactions.set(messageId, existingReactions);
      return newReactions;
    });
  };

  // Load user preferences and check premium status
  const loadUserPreferences = async () => {
    try {
      // Get user language preference
      const langResponse = await chatService.getUserLanguagePreference();
      if (langResponse.success && langResponse.data) {
        setUserLanguage(langResponse.data.language);
      }
      
      // Check premium status
      const premiumResponse = await chatService.checkPremiumAccess();
      if (premiumResponse.success && premiumResponse.data) {
        setIsPremiumUser(premiumResponse.data.hasPremium);
      }
      
      // Check if translation service is available
      setTranslationServiceAvailable(chatService.isTranslationAvailable());
      
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  // Toggle translation display
  const toggleTranslationDisplay = () => {
    setShowTranslations(!showTranslations);
    // Force re-render of messages when toggling translations
    setMessages(prev => [...prev]);
  };

  // Toggle showing original text for a specific message
  const toggleShowOriginalText = (messageId: string) => {
    setShowOriginalText(prev => {
      const newMap = new Map(prev);
      newMap.set(messageId, !prev.get(messageId));
      return newMap;
    });
  };

  // TRANSLATE ALL MESSAGES FOR PREMIUM USER
  const translateAllMessages = async (messagesToTranslate: ChatMessage[]) => {
    if (!isPremiumUser || !currentUserId || translatingMessages || loading) {
      return;
    }
    
    if (!translationServiceAvailable) {
      console.log('⚠️ Translation service unavailable');
      Alert.alert(
        'Translation Unavailable',
        'Chat translation service is not configured. Please check your API key.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Filter only incoming messages that need translation
    const incomingMessages = messagesToTranslate.filter(msg => 
      msg.sender_id !== currentUserId && // Only incoming messages
      !msg.translated_text && // Not already translated
      msg.original_text && 
      msg.original_text.trim().length > 0 &&
      (msg.original_language || 'en') !== userLanguage // Different language
    );

    if (incomingMessages.length === 0) {
      console.log('✅ No messages need translation');
      return;
    }

    console.log(`🔄 [TRANSLATION] Translating ${incomingMessages.length} incoming messages to ${userLanguage}`);
    
    setTranslatingMessages(true);

    try {
      const batchResult = await chatService.translateMessagesForUser(
        incomingMessages,
        userLanguage,
        currentUserId
      );
      
      if (batchResult.success && batchResult.data) {
        const translatedMessages = batchResult.data;
        
        // Update messages with translations
        setMessages(prev => prev.map(msg => {
          if (translatedMessages[msg.id]) {
            return {
              ...msg,
              translated_text: translatedMessages[msg.id],
              translated_language: userLanguage,
              is_translated: true,
              translation_method: 'openai' as TranslationMethod
            };
          }
          return msg;
        }));
        
        const translatedCount = Object.keys(translatedMessages).length;
        console.log(`✅ [TRANSLATION] Translated ${translatedCount} incoming messages`);
        
        // Store in local cache
        const newCache = new Map(translationCache);
        Object.entries(translatedMessages).forEach(([messageId, translation]) => {
          newCache.set(messageId, translation);
        });
        setTranslationCache(newCache);
        
      } else {
        console.error('❌ [TRANSLATION] Translation failed:', batchResult.error);
        Alert.alert(
          'Translation Failed',
          batchResult.error || 'Failed to translate messages',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('❌ [TRANSLATION] Error translating messages:', error);
      Alert.alert(
        'Translation Error',
        error.message || 'Failed to translate messages',
        [{ text: 'OK' }]
      );
    } finally {
      setTranslatingMessages(false);
    }
  };

  // Handle new incoming message translation (REAL-TIME) USING TRANSLATION SERVICE
  const handleNewIncomingMessage = async (message: ChatMessage) => {
    if (!isPremiumUser || !currentUserId || !translationServiceAvailable) {
      return;
    }

    // Check if this message needs translation (incoming and different language)
    const needsTranslation = 
      message.sender_id !== currentUserId && // Incoming message
      !message.translated_text && // Not already translated
      message.original_text && 
      message.original_text.trim().length > 0 &&
      (message.original_language || 'en') !== userLanguage; // Different language

    if (needsTranslation) {
      console.log(`🔄 [TRANSLATION] Translating new incoming message to ${userLanguage}`);
      
      try {
        const translationResult = await chatService.autoTranslateIncomingMessage(
          message,
          userLanguage
        );
        
        if (translationResult.success && translationResult.data) {
          // Update the specific message with translation
          setMessages(prev => prev.map(m => 
            m.id === message.id 
              ? { 
                  ...m, 
                  translated_text: translationResult.data?.translated_text || '',
                  translated_language: userLanguage,
                  is_translated: true,
                  translation_method: 'openai' as TranslationMethod
                }
              : m
          ));
          
          // Store in local cache
          setTranslationCache(prev => {
            const newCache = new Map(prev);
            newCache.set(message.id, translationResult.data?.translated_text || '');
            return newCache;
          });
          
          console.log('✅ [TRANSLATION] New incoming message translated in real-time');
        } else {
          console.log('⚠️ [TRANSLATION] Translation not needed or failed for new message');
        }
      } catch (error) {
        console.error('❌ [TRANSLATION] Failed to translate new incoming message:', error);
      }
    } else {
      console.log('✅ [TRANSLATION] New message doesn\'t need translation (same language or already translated)');
    }
  };

  useEffect(() => {
    console.log(`🔌 [UI] useEffect triggered for initial setup`);
    
    // Get current user ID
    const fetchCurrentUser = async (): Promise<void> => {
      try {
        const user = await chatService.getCurrentUser();
        setCurrentUserId(user?.id || null);
        console.log(`🔌 [UI] Current user ID set: ${user?.id}`);
        
        // Load user preferences after getting user ID
        if (user?.id) {
          await loadUserPreferences();
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    
    fetchCurrentUser();
    loadMessages();
    markMessagesAsRead();
  }, []);

  // FIX #1: Keep messagesRef synced with messages state (prevents stale closure)
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Update header when language or premium status changes
  useEffect(() => {
    navigation.setOptions({
      title: '',
      headerTitle: () => (
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerName}>{otherFullName || otherUsername}</Text>
          <Text style={styles.headerStatus}>
            {isUserOnline 
              ? '🟢 Online' 
              : `Last seen ${formatLastSeen(lastSeenTimestamp)}`
            }
          </Text>
        </View>
      ),
      headerRight: () => (
        <View style={styles.headerRightContainer}>
          {/* Translation toggle button */}
          {isPremiumUser && messages.some(m => m.is_translated) && (
            <TouchableOpacity 
              style={styles.translationToggleButton}
              onPress={toggleTranslationDisplay}
            >
              <Ionicons 
                name={showTranslations ? "eye-off" : "eye"} 
                size={18} 
                color={COLORS.gold} 
              />
              <Text style={styles.translationToggleText}>
                {showTranslations ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>
          )}
          
          {/* Language selector button */}
          <TouchableOpacity 
            style={styles.languageButton}
            onPress={() => setShowLanguageSelector(true)}
            disabled={updatingLanguage}
          >
            {updatingLanguage ? (
              <ActivityIndicator size="small" color={COLORS.gold} />
            ) : (
              <>
                <Text style={styles.languageButtonEmoji}>
                  {getLanguageEmoji(userLanguage)}
                </Text>
                <Text style={[
                  styles.languageButtonText,
                  !isPremiumUser && styles.languageButtonDisabled
                ]}>
                  {getLanguageName(userLanguage)}
                </Text>
                {!isPremiumUser && (
                  <Ionicons name="lock-closed" size={12} color={COLORS.gold} style={styles.languageLockIcon} />
                )}
              </>
            )}
          </TouchableOpacity>
          
          {/* FIX #2: Working 3-dots menu */}
          <TouchableOpacity 
            style={styles.moreOptionsButton}
            onPress={handleMoreOptions}
          >
            <Ionicons name="ellipsis-vertical" size={24} color={COLORS.gold} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [
    userLanguage, 
    isPremiumUser, 
    showTranslations, 
    messages, 
    isUserOnline, 
    lastSeenTimestamp, 
    updatingLanguage, 
    translatingMessages, 
    currentUserId,
    otherFullName,
    otherUsername
  ]);

  // KEYBOARD LISTENERS
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setIsKeyboardVisible(true);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (typingDebounceRef.current) {
        clearTimeout(typingDebounceRef.current);
      }
    };
  }, []);

  // Setup realtime subscription after currentUserId is available
  useEffect(() => {
    console.log(`🔌 [UI] useEffect triggered for subscriptions, currentUserId: ${currentUserId}`);
    
    if (currentUserId) {
      console.log(`🔌 [UI] Setting up all subscriptions for user ${currentUserId}`);
      
      // Setup all subscriptions
      const conversationUnsubscribe = setupRealtimeSubscription();
      const presenceUnsubscribe = setupPresenceSubscription();
      const typingUnsubscribe = setupTypingSubscription();
      
      // Return cleanup function
      return () => {
        console.log(`🔌 [UI] Cleaning up all subscriptions`);
        
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        if (typingDebounceRef.current) {
          clearTimeout(typingDebounceRef.current);
        }
        
        // Clear typing indicator on unmount
        if (currentUserId) {
          try {
            chatService.sendTypingIndicator(otherUserId, false);
          } catch (error) {
            console.error('Error clearing typing indicator on unmount:', error);
          }
        }
        
        // Call all unsubscribe functions
        if (conversationUnsubscribe && typeof conversationUnsubscribe === 'function') {
          conversationUnsubscribe();
        }
        if (presenceUnsubscribe && typeof presenceUnsubscribe === 'function') {
          presenceUnsubscribe();
        }
        if (typingUnsubscribe && typeof typingUnsubscribe === 'function') {
          typingUnsubscribe();
        }
        
        // Clear refs
        subscriptionRef.current = null;
        presenceSubscriptionRef.current = null;
        typingSubscriptionRef.current = null;
      };
    } else {
      console.log(`❌ [UI] No currentUserId, skipping subscription setup`);
      return undefined;
    }
  }, [currentUserId]);

  // FIX #1: Setup Realtime Subscription with messagesRef to prevent stale closure
  const setupRealtimeSubscription = (): (() => void) => {
    console.log(`🔌 [UI] Setting up realtime subscription for user ${currentUserId} ↔ ${otherUserId}`);
    
    // Clean up previous subscription if exists
    if (subscriptionRef.current) {
      console.log(`🔌 [UI] Removing previous subscription`);
      subscriptionRef.current();
    }
    
    // Get the unsubscribe function and store it
    const unsubscribe = chatService.subscribeToConversation(otherUserId, (newMessage: ChatMessage) => {
      console.log(`📨 [UI] Subscription callback triggered for message ${newMessage.id}`);
      
      const isMessageFromMe = newMessage.sender_id === currentUserId;
      
      // FIX #1: Use messagesRef.current instead of stale messages closure
      const isAlreadyInList = messagesRef.current.some(msg => msg.id === newMessage.id);
      
      console.log(`📨 [UI] Message from me? ${isMessageFromMe}, Already in list? ${isAlreadyInList}`);
      console.log(`📨 [UI] Current messages count: ${messagesRef.current.length}`);
      
      // Add message if it's not already in the list (prevents duplicates)
      if (!isAlreadyInList) {
        console.log(`📨 [UI] ✅ Adding NEW message ${newMessage.id} to UI`);
        
        const messageToAdd = {
          ...newMessage,
          is_translated: false,
          translated_text: null,
          translated_language: null,
          translation_method: null
        };
        
        setMessages(prev => [...prev, messageToAdd]);
        
        // Only mark as read if it's an incoming message
        if (!isMessageFromMe) {
          markMessagesAsRead();
        }
        
        // Translate incoming messages in real-time using translation service
        if (!isMessageFromMe && isPremiumUser && translationServiceAvailable) {
          console.log(`📨 [UI] Scheduling translation for incoming message`);
          // Small delay to ensure message is rendered first
          setTimeout(async () => {
            await handleNewIncomingMessage(messageToAdd);
          }, 500);
        }
        
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        console.log(`📨 [UI] ⚠️ Skipping message (already in list - duplicate prevention)`);
      }
    });
    
    // Store the unsubscribe function
    subscriptionRef.current = unsubscribe;
    console.log(`✅ [UI] Realtime subscription setup complete`);
    
    return unsubscribe;
  };

  // FIX #3: Enhanced Presence Subscription with better last seen tracking
  const setupPresenceSubscription = (): (() => void) | null => {
    console.log(`🔌 [UI] Setting up presence subscription for user ${otherUserId}`);
    
    // Clean up previous subscription if exists
    if (presenceSubscriptionRef.current) {
      console.log(`🔌 [UI] Removing previous presence subscription`);
      presenceSubscriptionRef.current();
    }

    const presenceCallback = (presenceData: { isOnline: boolean; lastSeen: string | null }): void => {
      console.log(`🟢 [PRESENCE] User ${otherUserId} status:`, presenceData);
      setIsUserOnline(presenceData.isOnline);
      
      // FIX #3: Update last seen timestamp properly
      if (!presenceData.isOnline && presenceData.lastSeen) {
        setLastSeenTimestamp(presenceData.lastSeen);
      } else if (presenceData.isOnline) {
        setLastSeenTimestamp(new Date().toISOString());
      }
    };

    try {
      const unsubscribe = chatService.subscribeToPresence(otherUserId, presenceCallback);
      if (unsubscribe) {
        presenceSubscriptionRef.current = unsubscribe;
        return unsubscribe;
      }
    } catch (error) {
      console.error('Error subscribing to presence:', error);
    }
    
    return null;
  };

  // Setup Typing Subscription
  const setupTypingSubscription = (): (() => void) | null => {
    console.log(`🔌 [UI] Setting up typing subscription for user ${otherUserId}`);
    
    // Clean up previous subscription if exists
    if (typingSubscriptionRef.current) {
      console.log(`🔌 [UI] Removing previous typing subscription`);
      typingSubscriptionRef.current();
    }

    const typingCallback = (isTyping: boolean): void => {
      setOtherUserIsTyping(isTyping);
    };

    try {
      const unsubscribe = chatService.subscribeToTypingIndicator(otherUserId, typingCallback);
      if (unsubscribe) {
        typingSubscriptionRef.current = unsubscribe;
        return unsubscribe;
      }
    } catch (error) {
      console.error('Error subscribing to typing indicator:', error);
    }
    
    return null;
  };

  const broadcastTypingStatus = (): void => {
    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
    }

    try {
      chatService.sendTypingIndicator(otherUserId, true);
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      try {
        chatService.sendTypingIndicator(otherUserId, false);
      } catch (error) {
        console.error('Error clearing typing indicator:', error);
      }
    }, 3000);
  };

  // Translate messages when user language changes
  useEffect(() => {
    if (isPremiumUser && currentUserId && messages.length > 0 && translationServiceAvailable) {
      console.log(`🔄 [UI] User language changed to ${userLanguage}, translating messages...`);
      translateAllMessages(messages);
    }
  }, [userLanguage, isPremiumUser]);

  const loadMessages = async (loadMore: boolean = false): Promise<void> => {
    if ((loadMore && !hasMore) || (loadMore && loadingMore)) return;

    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const currentPage = loadMore ? page + 1 : 0;
      const response = await chatService.getConversationMessages(otherUserId, currentPage);

      if (response.success && response.data) {
        const newMessages = response.data.messages;
        
        const sortedMessages = [...newMessages].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        if (loadMore) {
          setMessages(prev => [...sortedMessages, ...prev]);
          setPage(currentPage);
        } else {
          setMessages(sortedMessages);
          setPage(0);
        }
        
        setHasMore(response.data.hasMore);
        
        // Translate messages for premium users
        if (isPremiumUser && currentUserId && translationServiceAvailable) {
          console.log(`✅ [TRANSLATION] Loaded ${sortedMessages.length} messages, will translate for premium user`);
          translateAllMessages(sortedMessages);
        } else {
          console.log(`✅ [TRANSLATION] Loaded ${sortedMessages.length} messages`);
        }
        
        if (!loadMore && sortedMessages.length > 0) {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }, 100);
        }
      } else if (response.error) {
        console.error('Error loading messages:', response.error);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const markMessagesAsRead = async (): Promise<void> => {
    try {
      await chatService.markMessagesAsRead(otherUserId);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Handle language selection - Translate all messages to new language
  const handleLanguageSelect = async (languageCode: string) => {
    if (!isPremiumUser) {
      Alert.alert(
        'Chat Translation Feature',
        'Visit the website to enable chat translation: www.lauritalk.com/login',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Visit Website', 
            onPress: () => handleWebsiteRedirect()
          }
        ]
      );
      return;
    }

    if (!translationServiceAvailable) {
      Alert.alert(
        'Translation Service Unavailable',
        'Chat translation service is not configured. Please check your API key configuration.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Don't update if same language
    if (languageCode === userLanguage) {
      setShowLanguageSelector(false);
      return;
    }

    setUpdatingLanguage(true);
    try {
      const response = await chatService.updateLanguagePreference(languageCode);
      
      if (response.success) {
        // Update state immediately for UI feedback
        const oldLanguage = userLanguage;
        setUserLanguage(languageCode);
        
        // Clear translation cache for old language
        setTranslationCache(new Map());
        
        // Translate all messages to new language
        if (messages.length > 0) {
          console.log(`🔄 [TRANSLATION] Translating all messages from ${oldLanguage} to ${languageCode}`);
          translateAllMessages(messages);
        }
        
        // Show success with the actual language name
        Alert.alert(
          'Success', 
          `Language changed to ${getLanguageName(languageCode)} ${getLanguageEmoji(languageCode)}\n\nAll incoming messages will be translated to this language.`
        );
        
        console.log(`🔄 [TRANSLATION] Language changed from ${oldLanguage} to ${languageCode}`);
        
      } else if (response.error === 'Premium feature only') {
        Alert.alert(
          'Chat Translation Feature',
          'Visit the website to enable chat translation: www.lauritalk.com/login',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Visit Website', 
              onPress: () => handleWebsiteRedirect()
            }
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to update language');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update language');
    } finally {
      setUpdatingLanguage(false);
      setShowLanguageSelector(false);
    }
  };

  // Get display text based on translation settings
  const getDisplayText = (message: ChatMessage): { 
    text: string; 
    isTranslated: boolean; 
    showOriginal: boolean;
    shouldShowTranslatedByDefault: boolean;
  } => {
    const isIncomingMessage = message.sender_id !== currentUserId;
    const hasTranslation = message.is_translated && message.translated_text && message.translated_text.trim().length > 0;
    
    // For incoming messages with translation: show translated text by default
    if (isIncomingMessage && hasTranslation && showTranslations) {
      return {
        text: message.translated_text!,
        isTranslated: true,
        showOriginal: showOriginalText.get(message.id) || false,
        shouldShowTranslatedByDefault: true
      };
    }
    
    // For outgoing messages or when translations are hidden: show original text
    return {
      text: message.original_text,
      isTranslated: false,
      showOriginal: false,
      shouldShowTranslatedByDefault: false
    };
  };

  const handleSendMessage = async (): Promise<void> => {
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      setSending(true);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      try {
        chatService.sendTypingIndicator(otherUserId, false);
      } catch (error) {
        console.error('Error clearing typing indicator:', error);
      }
      
      const payload: SendMessagePayload = {
        receiver_username: otherUsername,
        message_text: messageText,
        sender_language: userLanguage
      };

      console.log('🟡 [FRONTEND] Sending message with language:', userLanguage);

      // OPTIMISTIC UPDATE - NO TRANSLATION
      const optimisticMessage: ChatMessage = {
        id: tempId,
        sender_id: currentUserId || '',
        receiver_id: otherUserId,
        original_text: messageText,
        original_language: userLanguage,
        translated_text: null,
        translated_language: null,
        translation_method: null,
        is_translated: false,
        created_at: new Date().toISOString(),
        read_at: null,
        connection_id: `temp-connection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage('');
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);
      
      const response = await chatService.sendMessage(payload);

      console.log('🟡 [FRONTEND] Send message response:', response);

      if (response.success && response.data) {
        // Update with real message ID - NO TRANSLATION
        const serverMessage: ChatMessage = {
          ...optimisticMessage,
          id: response.data.message_id || optimisticMessage.id,
          is_translated: false // Frontend-only translation
        };
        
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? serverMessage : msg
        ));
        
        console.log('✅ [FRONTEND] Message sent successfully (no backend translation)');
      } else {
        Alert.alert('Error', response.error || 'Failed to send message');
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
      }
    } catch (error: any) {
      console.error('❌ Error sending message:', error);
      Alert.alert('Error', error.message || 'Failed to send message');
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  // Group messages by date for date separators
  const getGroupedMessages = (): GroupedMessage[] => {
    const grouped: GroupedMessage[] = [];
    let currentDate = '';
    
    messages.forEach((message: ChatMessage) => {
      const messageDate = formatDateForSeparator(message.created_at);
      
      if (messageDate !== currentDate) {
        grouped.push({ date: messageDate, messages: [message] });
        currentDate = messageDate;
      } else {
        grouped[grouped.length - 1].messages.push(message);
      }
    });
    
    return grouped;
  };

  const renderDateSeparator = (date: string): React.ReactElement => (
    <View style={styles.dateSeparatorContainer}>
      <View style={styles.dateSeparatorLine} />
      <Text style={styles.dateSeparatorText}>{date}</Text>
      <View style={styles.dateSeparatorLine} />
    </View>
  );

  const renderMessageItem = ({ item }: { item: ChatMessage }): React.ReactElement => {
    const isSentByMe = item.sender_id === currentUserId;
    const isOptimistic = item.id.startsWith('temp-');
    const isIncomingMessage = !isSentByMe;
    
    const { 
      text: displayText, 
      isTranslated, 
      showOriginal,
      shouldShowTranslatedByDefault 
    } = getDisplayText(item);

    const shouldShowOriginalToggle = isIncomingMessage && isTranslated && showTranslations;
    const isShowingOriginal = showOriginalText.get(item.id) || false;

    // PHASE 3: Get reactions for this message
    const reactions = messageReactions.get(item.id) || [];
    const reactionCounts = new Map<string, number>();
    const userReaction = reactions.find(r => r.userId === currentUserId);
    reactions.forEach(r => {
      reactionCounts.set(r.reaction, (reactionCounts.get(r.reaction) || 0) + 1);
    });

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onLongPress={() => handleMessageLongPress(item)}
        delayLongPress={500}
      >
        <View style={[
          styles.messageContainer,
          isSentByMe ? styles.sentMessage : styles.receivedMessage
        ]}>
          <View style={[
            styles.messageBubble,
            isSentByMe ? styles.sentBubble : styles.receivedBubble,
            isOptimistic && styles.optimisticMessage
          ]}>
            <Text style={isSentByMe ? styles.sentMessageText : styles.receivedMessageText}>
              {displayText}
            </Text>
            
            {/* Translation indicator for incoming messages */}
            {isTranslated && showTranslations && isIncomingMessage && (
              <View style={styles.translationContainer}>
                <View style={styles.translationHeader}>
                  <Ionicons 
                    name="sparkles" 
                    size={12} 
                    color={isSentByMe ? COLORS.black : COLORS.forestGreen} 
                  />
                  <Text style={[
                    styles.translationLabel,
                    { color: isSentByMe ? 'rgba(0,0,0,0.7)' : COLORS.forestGreen }
                  ]}>
                    Chat Translation to {getLanguageName(item.translated_language || 'en')}
                  </Text>
                  
                  {/* Toggle to show original text */}
                  {shouldShowOriginalToggle && (
                    <TouchableOpacity 
                      style={styles.showOriginalButton}
                      onPress={() => toggleShowOriginalText(item.id)}
                    >
                      <Text style={styles.showOriginalButtonText}>
                        {isShowingOriginal ? 'Hide Original' : 'Show Original'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                {/* Original text (only shown when toggled) */}
                {isShowingOriginal && showOriginal && (
                  <View style={styles.originalTextContainer}>
                    <Text style={[
                      styles.originalTextLabel,
                      { color: isSentByMe ? 'rgba(0,0,0,0.6)' : 'rgba(212, 175, 55, 0.7)' }
                    ]}>
                      Original ({getLanguageName(item.original_language || 'en')}):
                    </Text>
                    <Text style={[
                      styles.originalText,
                      { color: isSentByMe ? 'rgba(0,0,0,0.6)' : 'rgba(212, 175, 55, 0.7)' }
                    ]}>
                      {item.original_text}
                    </Text>
                  </View>
                )}
              </View>
            )}
            
            {/* Translation indicator for outgoing messages (always show original) */}
            {isTranslated && showTranslations && !isIncomingMessage && (
              <View style={styles.translationContainer}>
                <View style={styles.translationHeader}>
                  <Ionicons 
                    name="send" 
                    size={12} 
                    color={isSentByMe ? COLORS.black : COLORS.forestGreen} 
                  />
                  <Text style={[
                    styles.translationLabel,
                    { color: isSentByMe ? 'rgba(0,0,0,0.7)' : COLORS.forestGreen }
                  ]}>
                    Sent in {getLanguageName(item.original_language || 'en')}
                  </Text>
                </View>
              </View>
            )}
            
            {/* Hidden translation indicator */}
            {item.is_translated && !showTranslations && (
              <View style={styles.translationHiddenContainer}>
                <Ionicons name="language" size={10} color={isSentByMe ? 'rgba(0,0,0,0.4)' : 'rgba(212, 175, 55, 0.4)'} />
                <Text style={[
                  styles.translationHiddenText,
                  { color: isSentByMe ? 'rgba(0,0,0,0.4)' : 'rgba(212, 175, 55, 0.4)' }
                ]}>
                  Tap eye icon to show translation
                </Text>
              </View>
            )}
            
            <View style={styles.messageFooter}>
              <Text style={[
                styles.messageTime,
                { 
                  color: isSentByMe 
                    ? isOptimistic 
                      ? 'rgba(0,0,0,0.4)' 
                      : 'rgba(0,0,0,0.6)' 
                    : 'rgba(212, 175, 55, 0.7)' 
                }
              ]}>
                {new Date(item.created_at).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
                {isOptimistic && ' (Sending...)'}
              </Text>
              {isSentByMe && !isOptimistic && (
                <Ionicons 
                  name={item.read_at ? 'checkmark-done' : 'checkmark'} 
                  size={12} 
                  color={item.read_at ? COLORS.forestGreen : 'rgba(0,0,0,0.5)'} 
                  style={{ marginLeft: 4 }}
                />
              )}
              {isSentByMe && isOptimistic && (
                <ActivityIndicator size="small" color="rgba(0,0,0,0.5)" style={{ marginLeft: 4 }} />
              )}
            </View>
          </View>
          
          {/* PHASE 3: Message Reactions Display */}
          {reactions.length > 0 && (
            <View style={[styles.reactionsContainer, isSentByMe ? styles.reactionsContainerSent : styles.reactionsContainerReceived]}>
              {Array.from(reactionCounts.entries()).map(([reaction, count]) => (
                <TouchableOpacity
                  key={reaction}
                  style={[
                    styles.reactionBubble,
                    userReaction?.reaction === reaction && styles.reactionBubbleActive
                  ]}
                  onPress={() => handleAddReaction(item.id, reaction)}
                >
                  <Text style={styles.reactionBubbleEmoji}>{reaction}</Text>
                  {count > 1 && <Text style={styles.reactionBubbleCount}>{count}</Text>}
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.addReactionButton} onPress={() => handleReactToMessage(item.id)}>
                <Ionicons name="add-circle-outline" size={16} color={COLORS.gold} />
              </TouchableOpacity>
            </View>
          )}
          
          {/* PHASE 3: Quick add reaction button (when no reactions) */}
          {reactions.length === 0 && (
            <TouchableOpacity 
              style={[styles.quickReactButton, isSentByMe ? styles.quickReactButtonSent : styles.quickReactButtonReceived]} 
              onPress={() => handleReactToMessage(item.id)}
            >
              <Ionicons name="add-circle-outline" size={18} color={COLORS.gold} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = (): React.ReactElement => (
    <View style={styles.headerInfo}>
      {/* Encryption notice */}
      <View style={styles.encryptionNotice}>
        <Ionicons name="lock-closed" size={14} color={COLORS.forestGreen} />
        <Text style={styles.encryptionText}>
          Messages are end-to-end encrypted
        </Text>
      </View>
      
      {/* Translation status notice */}
      {isPremiumUser && (
        <View style={styles.translationNotice}>
          <Ionicons name="sparkles" size={14} color={COLORS.gold} />
          <Text style={styles.translationNoticeText}>
            Chat Translation {showTranslations ? 'enabled' : 'disabled'} 
          </Text>
          <View style={styles.languageBadge}>
            <Text style={styles.languageBadgeEmoji}>{getLanguageEmoji(userLanguage)}</Text>
            <Text style={styles.languageBadgeText}>{getLanguageName(userLanguage)}</Text>
          </View>
          <TouchableOpacity onPress={toggleTranslationDisplay} style={styles.toggleButton}>
            <Text style={styles.toggleButtonText}>
              {showTranslations ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Service availability notice */}
      {!translationServiceAvailable && isPremiumUser && (
        <View style={styles.warningNotice}>
          <Ionicons name="warning" size={14} color="#ff9800" />
          <Text style={styles.warningText}>
            Chat translation service not configured
          </Text>
        </View>
      )}
      
      {/* Website redirect notice */}
      {!isPremiumUser && (
        <TouchableOpacity 
          style={styles.premiumUpgradeNotice}
          onPress={handleWebsiteRedirect}
        >
          <Ionicons name="globe" size={14} color={COLORS.gold} />
          <Text style={styles.premiumUpgradeText}>
            Visit the website to enable chat translation
          </Text>
          <Ionicons name="arrow-forward" size={12} color={COLORS.gold} />
        </TouchableOpacity>
      )}
      
      {/* Incoming translation status */}
      {translatingMessages && (
        <View style={styles.translationProgressContainer}>
          <ActivityIndicator size="small" color={COLORS.gold} />
          <Text style={styles.translationProgressText}>
            Translating messages...
          </Text>
        </View>
      )}
      
      {messages.length === 0 && !loading && (
        <Text style={styles.emptyChatText}>
          No messages yet. Say hello to start the conversation!
        </Text>
      )}
      
      {/* Typing indicator */}
      {otherUserIsTyping && (
        <View style={styles.typingIndicatorContainer}>
          <TypingDots />
          <Text style={styles.typingIndicatorText}>
            {otherFullName || otherUsername} is typing...
          </Text>
        </View>
      )}
    </View>
  );

  const renderFooter = (): React.ReactElement => {
    return (
      <View>
        {loadingMore && (
          <View style={styles.loadingMoreContainer}>
            <ActivityIndicator size="small" color={COLORS.gold} />
            <Text style={styles.loadingMoreText}>Loading older messages...</Text>
          </View>
        )}
      </View>
    );
  };

  const groupedMessages = getGroupedMessages();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar backgroundColor={COLORS.black} barStyle="light-content" />
        
        {loading && messages.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.gold} />
            <Text style={styles.loadingText}>Loading conversation...</Text>
          </View>
        ) : (
          <>
            <FlatList
              ref={flatListRef}
              data={groupedMessages}
              renderItem={({ item }: { item: GroupedMessage }) => (
                <View>
                  {renderDateSeparator(item.date)}
                  {item.messages.map((message: ChatMessage) => (
                    <View key={`${message.id}-${message.created_at}`}>
                      {renderMessageItem({ item: message })}
                    </View>
                  ))}
                </View>
              )}
              keyExtractor={(item: GroupedMessage, index) => `${item.date}-${index}`}
              contentContainerStyle={[
                styles.messagesList,
                { 
                  paddingBottom: isKeyboardVisible 
                    ? keyboardHeight + 100
                    : INPUT_WRAPPER_HEIGHT + 20
                }
              ]}
              inverted={false}
              onEndReached={() => loadMessages(true)}
              onEndReachedThreshold={0.3}
              ListHeaderComponent={renderHeader}
              ListFooterComponent={renderFooter}
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="interactive"
              keyboardShouldPersistTaps="handled"
            />
            
            <View style={[
              styles.inputWrapper,
              {
                bottom: isKeyboardVisible ? keyboardHeight : 0,
              }
            ]}>
              <View style={styles.inputContainer}>
                <TextInput
                  ref={textInputRef}
                  style={styles.textInput}
                  placeholder="Type your message..."
                  placeholderTextColor="#888"
                  value={newMessage}
                  onChangeText={(text) => {
                    setNewMessage(text);
                    if (text.trim().length > 0) {
                      broadcastTypingStatus();
                    }
                  }}
                  multiline
                  maxLength={500}
                  editable={!sending}
                  onSubmitEditing={handleSendMessage}
                  blurOnSubmit={false}
                  returnKeyType="send"
                />
                
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!newMessage.trim() || sending) && styles.sendButtonDisabled
                  ]}
                  onPress={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color={COLORS.black} />
                  ) : (
                    <Ionicons name="send" size={20} color={COLORS.black} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Language Selector Modal */}
            <LanguageSelector
              visible={showLanguageSelector}
              onClose={() => setShowLanguageSelector(false)}
              currentLanguage={userLanguage}
              onLanguageSelect={handleLanguageSelect}
              isPremiumUser={isPremiumUser}
            />
            
            {/* FIX #2: Android Action Sheet Menu */}
            {Platform.OS === 'android' && (
              <>
                <ActionSheetMenu
                  visible={showMoreOptions}
                  onClose={() => setShowMoreOptions(false)}
                  title={`Chat with ${otherFullName || otherUsername}`}
                  options={[
                    {
                      label: 'Clear Chat',
                      icon: 'trash-outline',
                      onPress: handleClearChat,
                      destructive: false
                    },
                    {
                      label: 'Mute Notifications',
                      icon: 'notifications-off-outline',
                      onPress: handleMuteNotifications,
                      destructive: false
                    },
                    {
                      label: 'Block User',
                      icon: 'ban-outline',
                      onPress: handleBlockUser,
                      destructive: true
                    },
                    {
                      label: 'Report User',
                      icon: 'flag-outline',
                      onPress: handleReportUser,
                      destructive: true
                    }
                  ]}
                />
                {/* PHASE 2: Message options menu */}
                {selectedMessage && (
                  <ActionSheetMenu
                    visible={showMessageOptions}
                    onClose={() => setShowMessageOptions(false)}
                    title="Message Options"
                    options={[
                      { label: 'Copy Text', icon: 'copy-outline', onPress: () => handleCopyText(selectedMessage), destructive: false },
                      ...(selectedMessage.sender_id === currentUserId ? [
                        { label: 'Delete Message', icon: 'trash-outline', onPress: () => handleDeleteMessage(selectedMessage), destructive: true }
                      ] : []),
                      { label: 'React', icon: 'happy-outline', onPress: () => handleReactToMessage(selectedMessage.id), destructive: false }
                    ]}
                  />
                )}
              </>
            )}
            {/* PHASE 3: Reaction picker */}
            <ReactionPicker
              visible={showReactionPicker}
              onClose={() => setShowReactionPicker(false)}
              onSelectReaction={handleAddReaction}
              messageId={reactionPickerMessageId}
            />
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerName: {
    color: COLORS.gold,
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerStatus: {
    color: '#888',
    fontSize: 12,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  translationToggleButton: {
    padding: 6,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  translationToggleText: {
    color: COLORS.gold,
    fontSize: 12,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  languageButtonEmoji: {
    fontSize: 14,
  },
  languageButtonText: {
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: '500',
  },
  languageButtonDisabled: {
    color: '#888',
  },
  languageLockIcon: {
    marginLeft: 2,
  },
  moreOptionsButton: {
    padding: 4,
  },
  inputWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: COLORS.black,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.2)',
    paddingTop: 10,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.gold,
    marginTop: 12,
    fontSize: 16,
  },
  headerInfo: {
    padding: 16,
    alignItems: 'center',
  },
  encryptionNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  encryptionText: {
    color: COLORS.forestGreen,
    fontSize: 12,
    marginLeft: 6,
  },
  translationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
    gap: 6,
  },
  translationNoticeText: {
    color: COLORS.gold,
    fontSize: 12,
    marginLeft: 2,
  },
  languageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 139, 87, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 4,
    gap: 4,
  },
  languageBadgeEmoji: {
    fontSize: 12,
  },
  languageBadgeText: {
    color: COLORS.forestGreen,
    fontSize: 10,
    fontWeight: '600',
  },
  toggleButton: {
    marginLeft: 4,
  },
  toggleButtonText: {
    color: COLORS.forestGreen,
    fontSize: 12,
    fontWeight: '600',
  },
  premiumUpgradeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
    gap: 6,
  },
  premiumUpgradeText: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '600',
  },
  warningNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
    gap: 6,
  },
  warningText: {
    color: '#ff9800',
    fontSize: 12,
    marginLeft: 2,
  },
  translationProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
    gap: 6,
  },
  translationProgressText: {
    color: COLORS.gold,
    fontSize: 12,
  },
  emptyChatText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  typingIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  typingIndicatorText: {
    color: COLORS.gold,
    fontSize: 12,
    fontStyle: 'italic',
  },
  messagesList: {
    paddingHorizontal: 12,
    paddingTop: 16,
    flexGrow: 1,
  },
  dateSeparatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
  },
  dateSeparatorText: {
    color: '#888',
    fontSize: 12,
    marginHorizontal: 12,
  },
  messageContainer: {
    marginVertical: 6,
    flexDirection: 'row',
  },
  sentMessage: {
    justifyContent: 'flex-end',
  },
  receivedMessage: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
  },
  optimisticMessage: {
    opacity: 0.7,
  },
  sentBubble: {
    backgroundColor: COLORS.gold,
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderBottomLeftRadius: 4,
  },
  sentMessageText: {
    color: COLORS.black,
    fontSize: 16,
  },
  receivedMessageText: {
    color: COLORS.gold,
    fontSize: 16,
  },
  translationContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  translationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 6,
  },
  translationLabel: {
    fontSize: 11,
    marginLeft: 2,
    fontWeight: '600',
  },
  showOriginalButton: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 4,
  },
  showOriginalButtonText: {
    fontSize: 10,
    color: COLORS.gold,
    fontWeight: '600',
  },
  originalTextContainer: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  originalTextLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  originalText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  translationHiddenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    gap: 4,
  },
  translationHiddenText: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: COLORS.gold,
    fontSize: 16,
    maxHeight: 120,
    minHeight: 44,
  },
  sendButton: {
    backgroundColor: COLORS.gold,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
  },
  loadingMoreContainer: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMoreText: {
    color: COLORS.gold,
    fontSize: 12,
    marginTop: 5,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.gold,
    marginHorizontal: 2,
  },
  // Language Selector Modal Styles
  languageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  languageModalContent: {
    backgroundColor: COLORS.black,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  languageModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
  languageModalTitle: {
    color: COLORS.gold,
    fontSize: 18,
    fontWeight: 'bold',
  },
  languageModalSubtitle: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  premiumWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 8,
    gap: 8,
  },
  premiumWarningText: {
    color: COLORS.gold,
    fontSize: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: COLORS.gold,
    fontSize: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  languageList: {
    maxHeight: 500,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.1)',
  },
  languageItemSelected: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  languageItemDisabled: {
    opacity: 0.5,
  },
  languageEmojiSelector: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: '500',
  },
  languageNameDisabled: {
    color: '#888',
  },
  languageEnglishName: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  languageEnglishNameDisabled: {
    color: '#666',
  },
  noResultsText: {
    color: '#888',
    textAlign: 'center',
    padding: 20,
    fontSize: 14,
    fontStyle: 'italic',
  },
  // NEW: Android Action Sheet Styles
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  actionSheetContainer: {
    backgroundColor: COLORS.black,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  actionSheetHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
  actionSheetTitle: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.1)',
  },
  actionSheetOptionDestructive: {
    backgroundColor: 'rgba(255, 59, 48, 0.05)',
  },
  actionSheetIcon: {
    marginRight: 12,
  },
  actionSheetOptionText: {
    color: COLORS.gold,
    fontSize: 16,
  },
  actionSheetOptionTextDestructive: {
    color: '#ff3b30',
  },
  actionSheetCancel: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    marginTop: 8,
    marginHorizontal: 12,
    borderRadius: 12,
    borderBottomWidth: 0,
  },
  actionSheetCancelText: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
  // PHASE 3: Reaction styles
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 6,
    alignItems: 'center',
  },
  reactionsContainerSent: {
    justifyContent: 'flex-end',
  },
  reactionsContainerReceived: {
    justifyContent: 'flex-start',
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  reactionBubbleActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
    borderColor: COLORS.gold,
  },
  reactionBubbleEmoji: {
    fontSize: 14,
  },
  reactionBubbleCount: {
    fontSize: 10,
    color: COLORS.gold,
    marginLeft: 4,
    fontWeight: '600',
  },
  addReactionButton: {
    padding: 4,
  },
  quickReactButton: {
    position: 'absolute',
    top: -10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  quickReactButtonSent: {
    right: 10,
  },
  quickReactButtonReceived: {
    left: 10,
  },
  reactionPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionPickerContainer: {
    backgroundColor: COLORS.black,
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.gold,
    minWidth: 280,
  },
  reactionPickerTitle: {
    color: COLORS.gold,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  reactionPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  reactionButton: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 16,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  reactionEmoji: {
    fontSize: 32,
  },
});