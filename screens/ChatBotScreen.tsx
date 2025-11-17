import { Ionicons } from "@expo/vector-icons";
import * as Speech from 'expo-speech';
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ChatMode, getLauribotResponse } from "../services/lauribotService";

// ---------- TYPES ----------
type Message = {
  from: "user" | "bot";
  text: string;
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
};

// ---------- COMPONENT ----------
export default function ChatBotScreen({ navigation }: any) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHumanButton, setShowHumanButton] = useState(false);
  const [mode, setMode] = useState<ChatMode>('customer_care');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const flatListRef = useRef<FlatList<Message>>(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    
    if (!textToSend || loading) {
      return;
    }

    const newMsg: Message = { from: "user", text: textToSend };
    setMessages((prev: Message[]) => [...prev, newMsg]);
    
    if (!messageText) {
      setInput("");
    }
    
    setLoading(true);
    scrollToBottom();

    try {
      const reply = await getLauribotResponse(textToSend, mode);
      
      const botMessage: Message = { from: "bot", text: reply };
      setMessages((prev: Message[]) => [...prev, botMessage]);
      
      // Speak the bot's response
      speakMessage(reply);
      
      // Enhanced human agent button logic - ONLY show when:
      // 1. User explicitly asks for human agent, OR
      // 2. Bot indicates it can't help and suggests human agent
      if (mode === 'customer_care') {
        const userRequestedHuman = textToSend.toLowerCase().includes("human") || 
                                  textToSend.toLowerCase().includes("agent") ||
                                  textToSend.toLowerCase().includes("representative") ||
                                  textToSend.toLowerCase().includes("person");
        
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
        text: "I'm experiencing technical difficulties. Please try again later." 
      };
      setMessages((prev: Message[]) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const speakMessage = (text: string) => {
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
  };

  const handleTalkToHuman = () => {
    navigation.navigate("HumanAgentScreen");
  };

  const toggleSpeech = (text: string) => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      speakMessage(text);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* ---------- HEADER ---------- */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gold} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Lauribot</Text>
          <Text style={styles.headerSubtitle}>
            {mode === 'customer_care' ? '🤖 Your Support Assistant' : '🌍 Your Knowledge Partner'}
          </Text>
        </View>
        
        <View style={styles.headerPlaceholder} />
      </View>

      {/* ---------- MODE SELECTOR ---------- */}
      <View style={styles.modeSelector}>
        <TouchableOpacity 
          style={[
            styles.modeButton, 
            mode === 'customer_care' && styles.modeButtonActive
          ]}
          onPress={() => setMode('customer_care')}
        >
          <Ionicons 
            name="headset" 
            size={16} 
            color={mode === 'customer_care' ? COLORS.white : COLORS.gold} 
          />
          <Text style={[
            styles.modeButtonText,
            mode === 'customer_care' && styles.modeButtonTextActive
          ]}>Support</Text>
        </TouchableOpacity>
        
        <View style={styles.modeDivider} />
        
        <TouchableOpacity 
          style={[
            styles.modeButton, 
            mode === 'ask_me_anything' && styles.modeButtonActive
          ]}
          onPress={() => setMode('ask_me_anything')}
        >
          <Ionicons 
            name="bulb" 
            size={16} 
            color={mode === 'ask_me_anything' ? COLORS.white : COLORS.gold} 
          />
          <Text style={[
            styles.modeButtonText,
            mode === 'ask_me_anything' && styles.modeButtonTextActive
          ]}>Explore</Text>
        </TouchableOpacity>
      </View>

      {/* ---------- CHAT MESSAGES ---------- */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => {
          const showWelcome = item.from === "bot" && index === 0 && messages.length === 1;
          
          return (
            <View style={styles.messageWrapper}>
              {showWelcome && (
                <View style={styles.welcomeContainer}>
                  <Text style={styles.welcomeEmoji}>
                    {mode === 'customer_care' ? "🎯" : "✨"}
                  </Text>
                  <Text style={styles.welcomeText}>
                    {mode === 'customer_care' 
                      ? "Ready to assist with Lauritalk!" 
                      : "Let's explore something amazing!"}
                  </Text>
                </View>
              )}
              
              <View style={[
                styles.messageRow,
                item.from === "user" ? styles.userRow : styles.botRow
              ]}>
                {item.from === "bot" && (
                  <View style={styles.botAvatar}>
                    <Text style={styles.botAvatarText}>🤖</Text>
                  </View>
                )}
                
                <View
                  style={[
                    styles.messageBubble,
                    item.from === "user" ? styles.userBubble : styles.botBubble,
                  ]}
                >
                  <Text style={styles.messageText}>{item.text}</Text>
                </View>
                
                {item.from === "bot" && (
                  <TouchableOpacity 
                    style={styles.speakButton}
                    onPress={() => toggleSpeech(item.text)}
                  >
                    <Ionicons 
                      name={isSpeaking ? "volume-mute" : "volume-medium"} 
                      size={14} 
                      color={COLORS.white} 
                    />
                  </TouchableOpacity>
                )}
                
                {item.from === "user" && (
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>👤</Text>
                  </View>
                )}
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.messageContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyTitle}>Start a conversation</Text>
            <Text style={styles.emptySubtitle}>
              Ask me about Lauritalk features or anything you'd like to explore!
            </Text>
          </View>
        }
      />

      {/* ---------- TYPING INDICATOR ---------- */}
      {loading && (
        <View style={styles.typingIndicator}>
          <View style={styles.typingBubble}>
            <ActivityIndicator size="small" color={COLORS.gold} />
            <Text style={styles.typingText}>Lauribot is thinking...</Text>
          </View>
        </View>
      )}

      {/* ---------- HUMAN AGENT BUTTON ---------- */}
      {showHumanButton && mode === 'customer_care' && (
        <TouchableOpacity style={styles.humanButton} onPress={handleTalkToHuman}>
          <Ionicons name="person" size={18} color={COLORS.white} />
          <Text style={styles.humanButtonText}>Connect with Live Agent</Text>
        </TouchableOpacity>
      )}

      {/* ---------- INPUT AREA ---------- */}
      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={
              mode === 'customer_care' 
                ? "Ask about Lauritalk features..." 
                : "What would you like to know?"
            }
            placeholderTextColor="#888"
            value={input}
            onChangeText={setInput}
            editable={!loading}
            onSubmitEditing={() => sendMessage()}
            returnKeyType="send"
            multiline
          />
          
          <TouchableOpacity 
            style={[
              styles.sendButton,
              (!input.trim() || loading) && styles.sendButtonDisabled
            ]} 
            onPress={() => sendMessage()} 
            disabled={!input.trim() || loading}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={(!input.trim() || loading) ? COLORS.gray : COLORS.white} 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.inputFooter}>
          <Text style={styles.inputFooterText}>
            💡 {mode === 'customer_care' ? 'Tap speaker icon to hear responses' : 'Ask me anything!'}
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
  botBubble: {
    backgroundColor: COLORS.gold,
    borderBottomLeftRadius: 6,
  },
  messageText: {
    color: COLORS.white,
    fontSize: 15,
    lineHeight: 20,
  },
  speakButton: {
    padding: 6,
    backgroundColor: COLORS.darkGray,
    borderRadius: 12,
    marginLeft: 8,
    alignSelf: 'center',
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
  },
  typingIndicator: {
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gold,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    alignSelf: 'flex-start',
    maxWidth: '75%',
  },
  typingText: {
    color: COLORS.white,
    marginLeft: 8,
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