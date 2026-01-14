import { Ionicons } from "@expo/vector-icons";
import NetInfo from '@react-native-community/netinfo';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Clipboard,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { ChatMode, getLauribotResponse } from "../services/lauribotService";

// ---------- TYPES ----------
type Message = {
  from: "user" | "bot";
  text: string;
  timestamp: number;
  id: string;
};

type NavigationProps = {
  navigation: {
    goBack: () => void;
    navigate: (screen: string) => void;
  };
};

// ---------- CONSTANTS (i18n-ready) ----------
const STRINGS = {
  header: {
    title: "Lauribot",
    supportSubtitle: "Your Support Assistant",
    exploreSubtitle: "Your Knowledge Partner",
  },
  modes: {
    support: "Support",
    explore: "Explore",
  },
  placeholders: {
    support: "Ask about Lauritalk features...",
    explore: "What would you like to know?",
  },
  empty: {
    emoji: "💬",
    title: "Start a conversation",
    subtitle: "Ask me about Lauritalk features or anything you'd like to explore!",
  },
  welcome: {
    supportEmoji: "🎯",
    exploreEmoji: "✨",
    supportText: "Ready to assist with Lauritalk!",
    exploreText: "Let's explore something amazing!",
  },
  typing: "Lauribot is thinking...",
  humanAgent: "Connect with Live Agent",
  footer: {
    support: "Tap speaker icon to hear responses",
    explore: "Ask me anything!",
  },
  errors: {
    offline: "You're offline. Please check your connection.",
    generic: "I'm experiencing technical difficulties. Please try again later.",
    retryButton: "Retry",
  },
  actions: {
    copy: "Copy",
    share: "Share",
    speak: "Speak",
    regenerate: "Regenerate",
    copied: "Message copied!",
  },
};

const QUICK_REPLIES = {
  customer_care: [
    "How do I register?",
    "What are the features?",
    "Pricing information",
    "Technical support",
  ],
  ask_me_anything: [
    "Tell me something interesting",
    "Explain quantum physics",
    "Random fact",
    "What's AI?",
  ],
};

// ---------- THEME ----------
const COLORS = {
  gold: "#D4AF37",
  black: "#000",
  forestGreen: "#228B22",
  white: "#fff",
  gray: "#222",
  darkGray: "#111",
  lightGold: "#F4E4A2",
  error: "#FF6B6B",
  gradientStart: "#D4AF37",
  gradientEnd: "#F4E4A2",
};

const ACCESSIBILITY = {
  minContrastRatio: 4.5, // WCAG AA compliance
  touchTargetSize: 44, // Minimum touch target
};

// ---------- UTILITY FUNCTIONS ----------
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// ---------- SUB-COMPONENTS ----------
const Header: React.FC<{
  mode: ChatMode;
  onBack: () => void;
}> = ({ mode, onBack }) => (
  <View style={styles.header}>
    <TouchableOpacity 
      style={styles.backButton} 
      onPress={onBack}
      accessible={true}
      accessibilityLabel="Go back"
      accessibilityRole="button"
    >
      <Ionicons name="arrow-back" size={24} color={COLORS.gold} />
    </TouchableOpacity>
    
    <View style={styles.headerCenter}>
      <Text style={styles.headerTitle}>{STRINGS.header.title}</Text>
      <Text style={styles.headerSubtitle}>
        {mode === 'customer_care' 
          ? `🤖 ${STRINGS.header.supportSubtitle}` 
          : `🌍 ${STRINGS.header.exploreSubtitle}`}
      </Text>
    </View>
    
    <View style={styles.headerPlaceholder} />
  </View>
);

const ModeSelector: React.FC<{
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
}> = ({ mode, onModeChange }) => (
  <View style={styles.modeSelector}>
    <TouchableOpacity 
      style={[
        styles.modeButton, 
        mode === 'customer_care' && styles.modeButtonActive
      ]}
      onPress={() => onModeChange('customer_care')}
      accessible={true}
      accessibilityLabel="Switch to Support mode"
      accessibilityRole="button"
      accessibilityState={{ selected: mode === 'customer_care' }}
    >
      <Ionicons 
        name="headset" 
        size={16} 
        color={mode === 'customer_care' ? COLORS.white : COLORS.gold} 
      />
      <Text style={[
        styles.modeButtonText,
        mode === 'customer_care' && styles.modeButtonTextActive
      ]}>{STRINGS.modes.support}</Text>
    </TouchableOpacity>
    
    <View style={styles.modeDivider} />
    
    <TouchableOpacity 
      style={[
        styles.modeButton, 
        mode === 'ask_me_anything' && styles.modeButtonActive
      ]}
      onPress={() => onModeChange('ask_me_anything')}
      accessible={true}
      accessibilityLabel="Switch to Explore mode"
      accessibilityRole="button"
      accessibilityState={{ selected: mode === 'ask_me_anything' }}
    >
      <Ionicons 
        name="bulb" 
        size={16} 
        color={mode === 'ask_me_anything' ? COLORS.white : COLORS.gold} 
      />
      <Text style={[
        styles.modeButtonText,
        mode === 'ask_me_anything' && styles.modeButtonTextActive
      ]}>{STRINGS.modes.explore}</Text>
    </TouchableOpacity>
  </View>
);

const TypingIndicator: React.FC = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: -10,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animate(dot1, 0);
    animate(dot2, 150);
    animate(dot3, 300);
  }, []);

  return (
    <View style={styles.typingIndicator}>
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.typingBubble}
      >
        <View style={styles.typingDots}>
          <Animated.View style={[styles.dot, { transform: [{ translateY: dot1 }] }]} />
          <Animated.View style={[styles.dot, { transform: [{ translateY: dot2 }] }]} />
          <Animated.View style={[styles.dot, { transform: [{ translateY: dot3 }] }]} />
        </View>
        <Text style={styles.typingText}>{STRINGS.typing}</Text>
      </LinearGradient>
    </View>
  );
};

const ChatBubble: React.FC<{
  message: Message;
  isSpeaking: boolean;
  onToggleSpeech: (text: string) => void;
  onLongPress: (message: Message) => void;
  onRegenerate?: (message: Message) => void;
  mode: ChatMode;
}> = React.memo(({ message, isSpeaking, onToggleSpeech, onLongPress, onRegenerate, mode }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const BubbleContent = message.from === "bot" ? (
    <LinearGradient
      colors={[COLORS.gradientStart, COLORS.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.messageBubble, styles.botBubbleGradient]}
    >
      <Text style={styles.messageText}>{message.text}</Text>
    </LinearGradient>
  ) : (
    <View style={[styles.messageBubble, styles.userBubble]}>
      <Text style={styles.messageText}>{message.text}</Text>
    </View>
  );

  return (
    <Animated.View 
      style={[
        styles.messageWrapper,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        onLongPress={() => onLongPress(message)}
        activeOpacity={0.7}
        accessible={true}
        accessibilityLabel={`${message.from === 'user' ? 'You' : 'Lauribot'} said: ${message.text}`}
        accessibilityHint="Long press for options"
      >
        <View style={[
          styles.messageRow,
          message.from === "user" ? styles.userRow : styles.botRow
        ]}>
          {message.from === "bot" && (
            <View style={styles.botAvatar}>
              <Text style={styles.botAvatarText}>🤖</Text>
            </View>
          )}
          
          {BubbleContent}
          
          {message.from === "bot" && (
            <View style={styles.messageActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => onToggleSpeech(message.text)}
                accessible={true}
                accessibilityLabel={isSpeaking ? "Stop speaking" : "Speak message"}
                accessibilityRole="button"
              >
                <Ionicons 
                  name={isSpeaking ? "volume-mute" : "volume-medium"} 
                  size={14} 
                  color={COLORS.white} 
                />
              </TouchableOpacity>
              
              {onRegenerate && (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => onRegenerate(message)}
                  accessible={true}
                  accessibilityLabel="Regenerate response"
                  accessibilityRole="button"
                >
                  <Ionicons 
                    name="refresh" 
                    size={14} 
                    color={COLORS.white} 
                  />
                </TouchableOpacity>
              )}
            </View>
          )}
          
          {message.from === "user" && (
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>👤</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const QuickReplies: React.FC<{
  mode: ChatMode;
  onSelect: (text: string) => void;
}> = ({ mode, onSelect }) => {
  const replies = QUICK_REPLIES[mode];
  
  return (
    <View style={styles.quickRepliesContainer}>
      <Text style={styles.quickRepliesTitle}>Quick Replies:</Text>
      <View style={styles.quickRepliesChips}>
        {replies.map((reply, index) => (
          <TouchableOpacity
            key={index}
            style={styles.quickReplyChip}
            onPress={() => onSelect(reply)}
            accessible={true}
            accessibilityLabel={`Quick reply: ${reply}`}
            accessibilityRole="button"
          >
            <Text style={styles.quickReplyText}>{reply}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// ---------- MAIN COMPONENT ----------
export default function ChatBotScreen({ navigation }: NavigationProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHumanButton, setShowHumanButton] = useState(false);
  const [mode, setMode] = useState<ChatMode>('customer_care');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);
  
  const flatListRef = useRef<FlatList<Message>>(null);

  // Load saved mode from session
  useEffect(() => {
    // In a real app, load from AsyncStorage
    // const savedMode = await AsyncStorage.getItem('chatMode');
    // if (savedMode) setMode(savedMode as ChatMode);
  }, []);

  // Save mode to session
  useEffect(() => {
    // In a real app, save to AsyncStorage
    // AsyncStorage.setItem('chatMode', mode);
  }, [mode]);

  // Network listener
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
      if (!state.isConnected) {
        setError(STRINGS.errors.offline);
      } else {
        setError(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const debouncedSendMessage = useCallback(
    debounce(async (messageText: string, messageMode: ChatMode) => {
      if (!isOnline) {
        setError(STRINGS.errors.offline);
        return;
      }

      const messageId = generateId();
      const newMsg: Message = { 
        from: "user", 
        text: messageText, 
        timestamp: Date.now(),
        id: messageId,
      };
      
      setMessages((prev) => [...prev, newMsg]);
      setLoading(true);
      setError(null);
      scrollToBottom();

      try {
        const reply = await getLauribotResponse(messageText, messageMode);
        
        const botMessage: Message = { 
          from: "bot", 
          text: reply, 
          timestamp: Date.now(),
          id: generateId(),
        };
        setMessages((prev) => [...prev, botMessage]);
        setLastMessageId(botMessage.id);
        
        speakMessage(reply);
        
        if (messageMode === 'customer_care') {
          const userRequestedHuman = messageText.toLowerCase().includes("human") || 
                                    messageText.toLowerCase().includes("agent") ||
                                    messageText.toLowerCase().includes("representative") ||
                                    messageText.toLowerCase().includes("person");
          
          const botSuggestedHuman = reply.toLowerCase().includes("human agent") ||
                                   reply.toLowerCase().includes("live agent") ||
                                   reply.toLowerCase().includes("contact support") ||
                                   reply.toLowerCase().includes("talk to a human") ||
                                   reply.toLowerCase().includes("customer service") ||
                                   reply.toLowerCase().includes("cannot help") ||
                                   reply.toLowerCase().includes("unable to assist");
          
          setShowHumanButton(userRequestedHuman || botSuggestedHuman);
        }
        
      } catch (error: any) {
        const errorMessage: Message = { 
          from: "bot", 
          text: STRINGS.errors.generic,
          timestamp: Date.now(),
          id: generateId(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setError(STRINGS.errors.generic);
      } finally {
        setLoading(false);
        scrollToBottom();
      }
    }, 500),
    [isOnline, scrollToBottom]
  );

  const sendMessage = useCallback((messageText?: string) => {
    const textToSend = messageText || input.trim();
    
    if (!textToSend || loading) {
      return;
    }

    if (!messageText) {
      setInput("");
    }
    
    debouncedSendMessage(textToSend, mode);
  }, [input, loading, mode, debouncedSendMessage]);

  const speakMessage = useCallback((text: string) => {
    try {
      setIsSpeaking(true);
      Speech.speak(text, {
        language: 'en',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (error) {
      setIsSpeaking(false);
    }
  }, []);

  const handleTalkToHuman = useCallback(() => {
    navigation.navigate("HumanAgentScreen");
  }, [navigation]);

  const toggleSpeech = useCallback((text: string) => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      speakMessage(text);
    }
  }, [isSpeaking, speakMessage]);

  const handleLongPress = useCallback((message: Message) => {
    Alert.alert(
      'Message Options',
      `Sent ${new Date(message.timestamp).toLocaleTimeString()}`,
      [
        {
          text: STRINGS.actions.copy,
          onPress: () => {
            Clipboard.setString(message.text);
            Alert.alert(STRINGS.actions.copied);
          },
        },
        {
          text: STRINGS.actions.share,
          onPress: async () => {
            try {
              await Share.share({ message: message.text });
            } catch (error) {
              console.error('Share error:', error);
            }
          },
        },
        {
          text: STRINGS.actions.speak,
          onPress: () => speakMessage(message.text),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [speakMessage]);

  const handleRegenerate = useCallback((message: Message) => {
    // Find the user message that prompted this bot response
    const messageIndex = messages.findIndex(m => m.id === message.id);
    if (messageIndex > 0) {
      const previousMessage = messages[messageIndex - 1];
      if (previousMessage.from === 'user') {
        // Remove the bot message and regenerate
        setMessages(prev => prev.filter(m => m.id !== message.id));
        sendMessage(previousMessage.text);
      }
    }
  }, [messages, sendMessage]);

  const handleModeChange = useCallback((newMode: ChatMode) => {
    setMode(newMode);
    setShowHumanButton(false);
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    if (messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find(m => m.from === 'user');
      if (lastUserMessage) {
        sendMessage(lastUserMessage.text);
      }
    }
  }, [messages, sendMessage]);

  const renderItem = useCallback(({ item, index }: { item: Message; index: number }) => {
    const showWelcome = item.from === "bot" && index === 0 && messages.length === 1;
    
    return (
      <>
        {showWelcome && (
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeEmoji}>
              {mode === 'customer_care' ? STRINGS.welcome.supportEmoji : STRINGS.welcome.exploreEmoji}
            </Text>
            <Text style={styles.welcomeText}>
              {mode === 'customer_care' 
                ? STRINGS.welcome.supportText
                : STRINGS.welcome.exploreText}
            </Text>
          </View>
        )}
        
        <ChatBubble
          message={item}
          isSpeaking={isSpeaking}
          onToggleSpeech={toggleSpeech}
          onLongPress={handleLongPress}
          onRegenerate={item.from === 'bot' ? handleRegenerate : undefined}
          mode={mode}
        />
      </>
    );
  }, [mode, isSpeaking, toggleSpeech, handleLongPress, handleRegenerate, messages.length]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <Header mode={mode} onBack={() => navigation.goBack()} />
      
      <ModeSelector mode={mode} onModeChange={handleModeChange} />

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={20} color={COLORS.white} />
          <Text style={styles.errorText}>{error}</Text>
          {!isOnline && (
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={handleRetry}
              accessible={true}
              accessibilityLabel="Retry sending message"
              accessibilityRole="button"
            >
              <Text style={styles.retryButtonText}>{STRINGS.errors.retryButton}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.messageContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>{STRINGS.empty.emoji}</Text>
            <Text style={styles.emptyTitle}>{STRINGS.empty.title}</Text>
            <Text style={styles.emptySubtitle}>{STRINGS.empty.subtitle}</Text>
            <QuickReplies mode={mode} onSelect={sendMessage} />
          </View>
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
      />

      {loading && <TypingIndicator />}

      {showHumanButton && mode === 'customer_care' && (
        <TouchableOpacity 
          style={styles.humanButton} 
          onPress={handleTalkToHuman}
          accessible={true}
          accessibilityLabel={STRINGS.humanAgent}
          accessibilityRole="button"
        >
          <Ionicons name="person" size={18} color={COLORS.white} />
          <Text style={styles.humanButtonText}>{STRINGS.humanAgent}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={
              mode === 'customer_care' 
                ? STRINGS.placeholders.support
                : STRINGS.placeholders.explore
            }
            placeholderTextColor="#888"
            value={input}
            onChangeText={setInput}
            editable={!loading && isOnline}
            onSubmitEditing={() => sendMessage()}
            returnKeyType="send"
            multiline
            accessible={true}
            accessibilityLabel="Message input"
            accessibilityHint="Type your message here"
          />
          
          <TouchableOpacity 
            style={[
              styles.sendButton,
              (!input.trim() || loading || !isOnline) && styles.sendButtonDisabled
            ]} 
            onPress={() => sendMessage()} 
            disabled={!input.trim() || loading || !isOnline}
            accessible={true}
            accessibilityLabel="Send message"
            accessibilityRole="button"
            accessibilityState={{ disabled: !input.trim() || loading || !isOnline }}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={(!input.trim() || loading || !isOnline) ? COLORS.gray : COLORS.white} 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.inputFooter}>
          <Text style={styles.inputFooterText}>
            💡 {mode === 'customer_care' ? STRINGS.footer.support : STRINGS.footer.explore}
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ---------- STYLES ----------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 15,
    backgroundColor: COLORS.darkGray,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    minWidth: ACCESSIBILITY.touchTargetSize,
    minHeight: ACCESSIBILITY.touchTargetSize,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.gold,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  headerSubtitle: {
    color: COLORS.white,
    fontSize: 12,
    opacity: 0.8,
  },
  headerPlaceholder: {
    width: 40,
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.darkGray,
    margin: 20,
    borderRadius: 25,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
    minHeight: ACCESSIBILITY.touchTargetSize,
  },
  modeButtonActive: {
    backgroundColor: COLORS.forestGreen,
  },
  modeButtonText: {
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  modeDivider: {
    width: 1,
    backgroundColor: COLORS.gray,
    marginVertical: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  retryButtonText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: 'bold',
  },
  messageContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexGrow: 1,
  },
  messageWrapper: {
    marginVertical: 4,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginVertical: 20,
    padding: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  welcomeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  welcomeText: {
    color: COLORS.lightGold,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 6,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  botRow: {
    justifyContent: 'flex-start',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  botAvatarText: {
    fontSize: 16,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.forestGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  userAvatarText: {
    fontSize: 14,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    maxWidth: '75%',
  },
  userBubble: {
    backgroundColor: COLORS.forestGreen,
    borderBottomRightRadius: 6,
  },
  botBubbleGradient: {
    borderBottomLeftRadius: 6,
  },
  messageText: {
    color: COLORS.white,
    fontSize: 15,
    lineHeight: 20,
  },
  messageActions: {
    flexDirection: 'column',
    gap: 4,
    marginLeft: 8,
    alignSelf: 'center',
  },
  actionButton: {
    padding: 6,
    backgroundColor: COLORS.darkGray,
    borderRadius: 12,
    minWidth: ACCESSIBILITY.touchTargetSize / 2,
    minHeight: ACCESSIBILITY.touchTargetSize / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: COLORS.gold,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: COLORS.white,
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  quickRepliesContainer: {
    marginTop: 20,
    width: '100%',
    paddingHorizontal: 20,
  },
  quickRepliesTitle: {
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  quickRepliesChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickReplyChip: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    minHeight: ACCESSIBILITY.touchTargetSize,
    justifyContent: 'center',
  },
  quickReplyText: {
    color: COLORS.lightGold,
    fontSize: 13,
    fontWeight: '500',
  },
  typingIndicator: {
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    alignSelf: 'flex-start',
    maxWidth: '75%',
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
    marginRight: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
  },
  typingText: {
    color: COLORS.white,
    fontStyle: 'italic',
    fontSize: 14,
  },
  humanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.forestGreen,
    marginHorizontal: 20,
    marginVertical: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 8,
    shadowColor: COLORS.forestGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    minHeight: ACCESSIBILITY.touchTargetSize,
  },
  humanButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 25 : 15,
    paddingTop: 8,
    backgroundColor: COLORS.darkGray,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.black,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  input: {
    flex: 1,
    color: COLORS.white,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    backgroundColor: COLORS.gold,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  inputFooter: {
    alignItems: 'center',
    marginTop: 8,
  },
  inputFooterText: {
    color: COLORS.white,
    fontSize: 12,
    opacity: 0.6,
  },
});