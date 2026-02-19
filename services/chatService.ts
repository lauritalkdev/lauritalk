/* services/chatService.ts (UPDATED - With Profile Joins for Connections + Chat Translation Limits) */
import {
  ApiResponse,
  CHAT_CONSTANTS,
  ChatMessage,
  Connection,
  ConnectionResponse,
  Conversation,
  MessageTranslationResult,
  SearchUserResult,
  SendMessagePayload,
  TranslationMethod
} from '../src/types/chat';
import { supabase } from '../supabase';

// ==================== REMOVED OPENAI API KEY ====================
// OpenAI API key is now stored securely in Supabase Edge Function
// ==================== END CONFIGURATION ====================

interface TranslationRequest {
  message_id: string;
  target_language: string;
  original_text: string;
  original_language: string;
}

interface TranslationResponse {
  translated_text: string;
  translation_provider: string;
  confidence_score?: number;
}

// ==================== CHAT TRANSLATION LIMIT INTERFACES ====================
export interface ChatTranslationLimitStatus {
  success: boolean;
  is_premium: boolean;
  can_translate: boolean;
  current_count: number;
  monthly_limit: number;
  remaining_words: number;
  reset_date?: string;
  days_until_reset?: number;
  error?: string;
}

export interface ChatTranslationUpdateResult {
  success: boolean;
  is_premium: boolean;
  limit_exceeded: boolean;
  current_count: number;
  monthly_limit: number;
  remaining_words: number;
  words_added?: number;
  reset_date?: string;
  error?: string;
  message?: string;
}

// Local cache for translations to avoid duplicate API calls
const localTranslationCache = new Map<string, string>();

class ChatService {
  // Translation service status
  private isTranslationServiceAvailable: boolean = false;
  
  // Store active channels for cleanup
  private activeChannels: Map<string, any> = new Map();
  
  // OPTION 2: Duplicate prevention at service level
  private recentMessageIds: Set<string> = new Set();

  constructor() {
    this.initializeTranslationService();
    this.testEdgeFunction(); // Test Edge Function on startup
  }

  private initializeTranslationService(): void {
    try {
      // Edge Function is always available if Supabase is configured
      this.isTranslationServiceAvailable = true;
      console.log('✅ Translation service (Edge Function) initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing translation service:', error);
      this.isTranslationServiceAvailable = false;
    }
  }

  // ==================== EDGE FUNCTION TRANSLATION ====================

  /**
   * Test the Edge Function
   */
  async testEdgeFunction(): Promise<void> {
    try {
      console.log('🔍 Testing Edge Function...');
      
      // Simple test translation
      const response = await supabase.functions.invoke('translate-chat', {
        body: {
          action: 'translate',
          text: 'Hello',
          sourceLanguage: 'en',
          targetLanguage: 'es'
        }
      });
      
      if (response.error) {
        console.error('❌ Edge Function test failed:', response.error);
        this.isTranslationServiceAvailable = false;
      } else {
        console.log('✅ Edge Function is working!');
        this.isTranslationServiceAvailable = true;
      }
    } catch (error) {
      console.error('❌ Error testing Edge Function:', error);
      this.isTranslationServiceAvailable = false;
    }
  }

  /**
   * Translate text using Edge Function
   */
  private async translateWithEdgeFunction(
    text: string, 
    sourceLanguage: string, 
    targetLanguage: string
  ): Promise<string> {
    try {
      console.log(`🌍 [EDGE] Translating: ${sourceLanguage} → ${targetLanguage}`);
      
      const response = await supabase.functions.invoke('translate-chat', {
        body: {
          action: 'translate',
          text,
          sourceLanguage,
          targetLanguage
        }
      });

      if (response.error) {
        console.error(`❌ [EDGE] API error:`, response.error);
        throw new Error(`Edge Function error: ${response.error.message}`);
      }

      const data = response.data;
      
      if (data && data.translatedText) {
        console.log(`✅ [EDGE] Translation successful: ${text.substring(0, 50)}... → ${data.translatedText.substring(0, 50)}...`);
        return data.translatedText;
      } else {
        console.error('❌ [EDGE] No translation received:', data);
        throw new Error('No translation received from Edge Function');
      }

    } catch (error: any) {
      console.error('❌ [EDGE] Translation error:', error);
      throw error;
    }
  }

  /**
   * Batch translate texts using Edge Function
   */
  private async translateBatchWithEdgeFunction(
    texts: string[], 
    sourceLanguage: string, 
    targetLanguage: string
  ): Promise<string[]> {
    // For single text, use regular translation
    if (texts.length === 1) {
      try {
        const result = await this.translateWithEdgeFunction(texts[0], sourceLanguage, targetLanguage);
        return [result];
      } catch (error) {
        console.error('❌ [EDGE] Single translation failed:', error);
        return [texts[0]]; // Return original text on error
      }
    }

    try {
      console.log(`🌍 [EDGE] Batch translating ${texts.length} messages`);
      
      const response = await supabase.functions.invoke('translate-chat', {
        body: {
          action: 'translateBatch',
          texts,
          sourceLanguage,
          targetLanguage
        }
      });

      if (response.error) {
        console.error(`❌ [EDGE] Batch API error:`, response.error);
        throw new Error(`Edge Function batch error: ${response.error.message}`);
      }

      const data = response.data;
      
      if (data && data.translations && Array.isArray(data.translations)) {
        console.log(`✅ [EDGE] Batch translation successful for ${data.translations.length} messages`);
        return data.translations;
      } else {
        throw new Error('No batch translation received from Edge Function');
      }

    } catch (error: any) {
      console.error('❌ [EDGE] Batch translation failed:', error);
      // Fallback to individual translations
      console.log('⚠️ [EDGE] Falling back to individual translations');
      
      const translations: string[] = [];
      for (let i = 0; i < texts.length; i++) {
        try {
          const translated = await this.translateWithEdgeFunction(texts[i], sourceLanguage, targetLanguage);
          translations.push(translated);
        } catch (individualError) {
          console.error(`❌ [EDGE] Failed to translate message ${i + 1}:`, individualError);
          translations.push(texts[i]); // Return original on error
        }
      }
      
      return translations;
    }
  }

  /**
   * Get language name from code - 60 HIGH-QUALITY Languages (OpenAI Well-Supported)
   */
  private getLanguageName(languageCode: string): string {
    // 60 High-Quality Languages - OpenAI Well-Supported
    const languageMap: { [key: string]: string } = {
      // Major World Languages (37)
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'zh-Hans': 'Chinese (Simplified)',
      'zh-Hant': 'Chinese (Traditional)',
      'ja': 'Japanese',
      'ko': 'Korean',
      'pt': 'Portuguese',
      'it': 'Italian',
      'ru': 'Russian',
      'ar': 'Arabic',
      'hi': 'Hindi',
      'tr': 'Turkish',
      'nl': 'Dutch',
      'sv': 'Swedish',
      'da': 'Danish',
      'no': 'Norwegian',
      'fi': 'Finnish',
      'pl': 'Polish',
      'cs': 'Czech',
      'hu': 'Hungarian',
      'ro': 'Romanian',
      'el': 'Greek',
      'he': 'Hebrew',
      'th': 'Thai',
      'vi': 'Vietnamese',
      'id': 'Indonesian',
      'ms': 'Malay',
      'fil': 'Filipino',
      'sw': 'Swahili',
      'af': 'Afrikaans',
      'zu': 'Zulu',
      'xh': 'Xhosa',
      'yo': 'Yoruba',
      'ig': 'Igbo',
      'ha': 'Hausa',
      // Well-Supported Additional Languages (23)
      'bn': 'Bengali',
      'ur': 'Urdu',
      'fa': 'Persian',
      'uk': 'Ukrainian',
      'bg': 'Bulgarian',
      'hr': 'Croatian',
      'sr': 'Serbian',
      'sk': 'Slovak',
      'sl': 'Slovenian',
      'lt': 'Lithuanian',
      'lv': 'Latvian',
      'et': 'Estonian',
      'ca': 'Catalan',
      'pa': 'Punjabi',
      'ta': 'Tamil',
      'te': 'Telugu',
      'kn': 'Kannada',
      'ml': 'Malayalam',
      'mr': 'Marathi',
      'gu': 'Gujarati',
      'am': 'Amharic',
      'so': 'Somali',
      'hy': 'Armenian',
    };
    
    return languageMap[languageCode] || languageCode.toUpperCase();
  }

  // ==================== CHAT TRANSLATION LIMIT METHODS ====================

  /**
   * Count words in a text string
   */
  countWords(text: string): number {
    if (!text || text.trim().length === 0) return 0;
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
  }

  /**
   * Get chat translation limit status for current user
   */
  async getChatTranslationStatus(): Promise<ApiResponse<ChatTranslationLimitStatus>> {
    try {
      const userResponse = await supabase.auth.getUser();
      const userId = userResponse.data.user?.id;
      if (!userId) {
        return { 
          success: false, 
          error: 'User not authenticated',
          data: {
            success: false,
            is_premium: false,
            can_translate: false,
            current_count: 0,
            monthly_limit: 100,
            remaining_words: 0,
            error: 'User not authenticated'
          }
        };
      }

      const { data, error } = await supabase.rpc('get_chat_translation_status', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error getting chat translation status:', error);
        return { 
          success: false, 
          error: error.message,
          data: {
            success: false,
            is_premium: false,
            can_translate: false,
            current_count: 0,
            monthly_limit: 100,
            remaining_words: 0,
            error: error.message
          }
        };
      }

      const statusData = data as ChatTranslationLimitStatus;
      return { 
        success: true, 
        data: statusData 
      };
    } catch (error: any) {
      console.error('Error in getChatTranslationStatus:', error);
      return { 
        success: false, 
        error: error.message,
        data: {
          success: false,
          is_premium: false,
          can_translate: false,
          current_count: 0,
          monthly_limit: 100,
          remaining_words: 0,
          error: error.message
        }
      };
    }
  }

  /**
   * Update chat translation word count after successful translation
   */
  async updateChatTranslationCount(wordCount: number): Promise<ApiResponse<ChatTranslationUpdateResult>> {
    try {
      const userResponse = await supabase.auth.getUser();
      const userId = userResponse.data.user?.id;
      if (!userId) {
        return { 
          success: false, 
          error: 'User not authenticated',
          data: {
            success: false,
            is_premium: false,
            limit_exceeded: true,
            current_count: 0,
            monthly_limit: 100,
            remaining_words: 0,
            error: 'User not authenticated'
          }
        };
      }

      const { data, error } = await supabase.rpc('update_chat_translation_count', {
        p_user_id: userId,
        p_word_count: wordCount
      });

      if (error) {
        console.error('Error updating chat translation count:', error);
        return { 
          success: false, 
          error: error.message,
          data: {
            success: false,
            is_premium: false,
            limit_exceeded: true,
            current_count: 0,
            monthly_limit: 100,
            remaining_words: 0,
            error: error.message
          }
        };
      }

      const updateData = data as ChatTranslationUpdateResult;
      return { 
        success: updateData.success, 
        data: updateData 
      };
    } catch (error: any) {
      console.error('Error in updateChatTranslationCount:', error);
      return { 
        success: false, 
        error: error.message,
        data: {
          success: false,
          is_premium: false,
          limit_exceeded: true,
          current_count: 0,
          monthly_limit: 100,
          remaining_words: 0,
          error: error.message
        }
      };
    }
  }

  /**
   * Check if user can translate (has remaining words)
   */
  async canUserTranslate(): Promise<{ canTranslate: boolean; status: ChatTranslationLimitStatus | null }> {
    try {
      const response = await this.getChatTranslationStatus();
      
      if (!response.success || !response.data) {
        return { canTranslate: false, status: null };
      }

      return { 
        canTranslate: response.data.can_translate, 
        status: response.data 
      };
    } catch (error) {
      console.error('Error checking if user can translate:', error);
      return { canTranslate: false, status: null };
    }
  }

  // ==================== REALTIME SUBSCRIPTIONS - OPTION 2: WITH DUPLICATE PREVENTION ====================
  
  /**
   * Subscribe to conversation messages with proper cleanup and duplicate prevention
   */
  subscribeToConversation(
    otherUserId: string,
    callback: (message: ChatMessage) => void
  ): (() => void) {
    console.log(`🔌 [REALTIME] subscribeToConversation called for user ${otherUserId}`);
    
    const unsubscribe = (): void => {
      const channelKey = `chat:${otherUserId}`;
      if (this.activeChannels.has(channelKey)) {
        console.log(`🔌 [REALTIME] Removing channel: ${channelKey}`);
        const channel = this.activeChannels.get(channelKey);
        supabase.removeChannel(channel);
        this.activeChannels.delete(channelKey);
      }
    };
    
    // Start subscription asynchronously
    (async () => {
      const userResponse = await supabase.auth.getUser();
      const userId = userResponse.data.user?.id;
      
      console.log(`🔌 [REALTIME] Setting up subscription for conversation: User ${userId} ↔ User ${otherUserId}`);
      
      if (!userId) {
        console.error('❌ [REALTIME] No user ID for subscription');
        return;
      }

      const channelKey = `chat:${otherUserId}`;
      console.log(`🔌 [REALTIME] Creating channel: ${channelKey}`);

      // Remove existing channel if present
      if (this.activeChannels.has(channelKey)) {
        console.log(`🔌 [REALTIME] Removing existing channel: ${channelKey}`);
        const existingChannel = this.activeChannels.get(channelKey);
        supabase.removeChannel(existingChannel);
        this.activeChannels.delete(channelKey);
      }

      // Create connection ID for filtering
      const connectionId = this.getConnectionId(userId, otherUserId);
      
      const channel = supabase.channel(channelKey)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `connection_id=eq.${connectionId}`
          },
          (payload) => {
            console.log(`📨 [REALTIME] Received message for connection ${connectionId}:`, payload.new?.id);
            
            const msg = payload.new as ChatMessage;
            if (!msg) {
              console.error('❌ [REALTIME] No message in payload');
              return;
            }
            
            console.log(`📨 [REALTIME] New message ID: ${msg.id}, From: ${msg.sender_id}, To: ${msg.receiver_id}`);
            
            // Check if message is relevant
            const isRelevant =
              (msg.sender_id === otherUserId && msg.receiver_id === userId) ||
              (msg.sender_id === userId && msg.receiver_id === otherUserId);
            
            if (isRelevant) {
              // OPTION 2: Duplicate prevention at service level
              if (this.recentMessageIds.has(msg.id)) {
                console.log(`📨 [REALTIME] 🛡️ Duplicate message ${msg.id} detected - preventing duplicate callback`);
                return;
              }
              
              // Track message ID (keep last 100 to prevent memory bloat)
              this.recentMessageIds.add(msg.id);
              if (this.recentMessageIds.size > 100) {
                // Remove oldest message ID
                const firstId = this.recentMessageIds.values().next().value;
                if (firstId) {
                  this.recentMessageIds.delete(firstId);
                }
              }
              
              console.log(`📨 [REALTIME] ✅ Calling callback for relevant message ${msg.id} (tracked: ${this.recentMessageIds.size} recent IDs)`);
              callback(msg);
            } else {
              console.log(`📨 [REALTIME] Message not relevant - ignoring`);
            }
          }
        )
        .subscribe((status) => {
          console.log(`🔌 [REALTIME] Subscription status for ${channelKey}: ${status}`);
          
          if (status === 'SUBSCRIBED') {
            console.log(`✅ [REALTIME] Successfully subscribed to ${channelKey}`);
            this.activeChannels.set(channelKey, channel);
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`❌ [REALTIME] Channel error for ${channelKey}`);
            this.activeChannels.delete(channelKey);
          } else if (status === 'CLOSED') {
            console.log(`🔌 [REALTIME] Channel closed: ${channelKey}`);
            this.activeChannels.delete(channelKey);
          }
        });

      console.log(`🔌 [REALTIME] Channel created for ${channelKey}`);
    })();
    
    return unsubscribe;
  }

  /**
   * Generate connection ID for filtering
   */
  private getConnectionId(userId1: string, userId2: string): string {
    const sortedIds = [userId1, userId2].sort();
    return `connection:${sortedIds[0]}:${sortedIds[1]}`;
  }

  subscribeToConnectionUpdates(callback: (connection: Connection) => void): (() => void) {
    console.log(`🔌 [REALTIME] subscribeToConnectionUpdates called`);
    
    const unsubscribe = (): void => {
      const channelKey = 'connections:updates';
      if (this.activeChannels.has(channelKey)) {
        console.log(`🔌 [REALTIME] Removing channel: ${channelKey}`);
        const channel = this.activeChannels.get(channelKey);
        supabase.removeChannel(channel);
        this.activeChannels.delete(channelKey);
      }
    };
    
    (async () => {
      const userResponse = await supabase.auth.getUser();
      const userId = userResponse.data.user?.id;
      if (!userId) return;

      const channelKey = 'connections:updates';
      
      // Remove existing channel if present
      if (this.activeChannels.has(channelKey)) {
        const existingChannel = this.activeChannels.get(channelKey);
        supabase.removeChannel(existingChannel);
        this.activeChannels.delete(channelKey);
      }

      const channel = supabase.channel(channelKey)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'connections'
          },
          (payload) => {
            const conn = payload.new as Connection;
            if (!conn) return;
            const relevant = conn.requester_id === userId || conn.receiver_id === userId;
            if (relevant) callback(conn);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            this.activeChannels.set(channelKey, channel);
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            this.activeChannels.delete(channelKey);
          }
        });
    })();
    
    return unsubscribe;
  }

  // ==================== PRESENCE & TYPING INDICATORS ====================
  subscribeToPresence(
    userId: string, 
    callback: (data: { isOnline: boolean; lastSeen: string | null }) => void
  ): (() => void) | null {
    try {
      const channelKey = `presence:${userId}`;
      
      // Remove existing channel if present
      if (this.activeChannels.has(channelKey)) {
        console.log(`🔌 [PRESENCE] Removing existing channel: ${channelKey}`);
        const existingChannel = this.activeChannels.get(channelKey);
        supabase.removeChannel(existingChannel);
        this.activeChannels.delete(channelKey);
      }

      const channel = supabase.channel(channelKey);
      
      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const userPresence = state[userId] as any[];
          
          if (userPresence && userPresence.length > 0) {
            callback({ isOnline: true, lastSeen: null });
          } else {
            callback({ isOnline: false, lastSeen: null });
          }
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          const joinedUser = newPresences.find((p: any) => p.user_id === userId);
          if (joinedUser) {
            callback({ isOnline: true, lastSeen: null });
          }
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          const leftUser = leftPresences.find((p: any) => p.user_id === userId);
          if (leftUser) {
            callback({ isOnline: false, lastSeen: null });
          }
        })
        .subscribe(async (status) => {
          console.log(`🔌 [PRESENCE] Presence channel ${channelKey} status: ${status}`);
          
          if (status === 'SUBSCRIBED') {
            const userResponse = await supabase.auth.getUser();
            const currentUserId = userResponse.data.user?.id;
            if (currentUserId) {
              await channel.track({
                user_id: currentUserId,
                online_at: new Date().toISOString()
              });
            }
            this.activeChannels.set(channelKey, channel);
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            this.activeChannels.delete(channelKey);
          }
        });

      const unsubscribe = (): void => {
        console.log(`🔌 [PRESENCE] Unsubscribing from ${channelKey}`);
        supabase.removeChannel(channel);
        this.activeChannels.delete(channelKey);
      };

      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to presence:', error);
      return null;
    }
  }

  subscribeToTypingIndicator(
    userId: string, 
    callback: (isTyping: boolean) => void
  ): (() => void) | null {
    try {
      const userResponse = supabase.auth.getUser();
      const currentUserId = userResponse.then(res => res.data.user?.id);
      
      if (!currentUserId) return null;
      
      const channelKey = `typing:${userId}`;
      
      // Remove existing channel if present
      if (this.activeChannels.has(channelKey)) {
        const existingChannel = this.activeChannels.get(channelKey);
        supabase.removeChannel(existingChannel);
        this.activeChannels.delete(channelKey);
      }

      const channel = supabase.channel(channelKey);

      channel
        .on('broadcast', { event: 'typing' }, (payload) => {
          const { isTyping, senderId } = payload.payload;
          if (senderId === userId) {
            callback(isTyping);
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            this.activeChannels.set(channelKey, channel);
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            this.activeChannels.delete(channelKey);
          }
        });

      const unsubscribe = (): void => {
        supabase.removeChannel(channel);
        this.activeChannels.delete(channelKey);
      };

      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to typing indicator:', error);
      return null;
    }
  }

  async sendTypingIndicator(userId: string, isTyping: boolean): Promise<void> {
    try {
      const userResponse = await supabase.auth.getUser();
      const currentUserId = userResponse.data.user?.id;
      if (!currentUserId) return;

      const channelKey = `typing:${userId}`;
      
      // Get or create channel
      let channel = this.activeChannels.get(channelKey);
      if (!channel) {
        channel = supabase.channel(channelKey);
        this.activeChannels.set(channelKey, channel);
      }
      
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          senderId: currentUserId,
          isTyping,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  }

  // ==================== CLEANUP METHOD ====================
  /**
   * Clean up all active subscriptions
   */
  cleanupAllSubscriptions(): void {
    console.log(`🧹 [CLEANUP] Cleaning up ${this.activeChannels.size} active channels`);
    
    for (const [channelKey, channel] of this.activeChannels) {
      console.log(`🧹 [CLEANUP] Removing channel: ${channelKey}`);
      try {
        supabase.removeChannel(channel);
      } catch (error) {
        console.error(`❌ [CLEANUP] Error removing channel ${channelKey}:`, error);
      }
    }
    
    this.activeChannels.clear();
    
    // OPTION 2: Clear recent message IDs on cleanup
    console.log(`🧹 [CLEANUP] Clearing ${this.recentMessageIds.size} tracked message IDs`);
    this.recentMessageIds.clear();
    
    console.log('✅ [CLEANUP] All subscriptions cleaned up');
  }

  // ==================== USER SEARCH ====================
  async searchUsers(searchTerm: string): Promise<ApiResponse<SearchUserResult[]>> {
    try {
      const userResponse = await supabase.auth.getUser();
      const userId = userResponse.data.user?.id;
      if (!userId) throw new Error('User not authenticated');

      const { data: rpcData, error: rpcError } = await supabase.rpc('search_users', {
        search_term: searchTerm,
        current_user_id: userId
      });

      if (!rpcError && rpcData && (rpcData as any[]).length > 0) {
        return { success: true, data: rpcData as SearchUserResult[] };
      }

      const directResult = await this.searchUsersDirect(searchTerm, userId);
      if (directResult.success && directResult.data && directResult.data.length > 0) return directResult;

      const manualResult = await this.searchUsersManual(searchTerm, userId);
      if (manualResult.success) return manualResult;

      return { success: true, data: [] };
    } catch (error: any) {
      console.error('🔍 ERROR in searchUsers:', error);
      return { success: false, error: error.message };
    }
  }

  async searchUsersDirect(searchTerm: string, userId: string): Promise<ApiResponse<SearchUserResult[]>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, language_preference, email, account_tier')
        .neq('id', userId)
        .or(`username.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
        .order('username')
        .limit(50);

      if (error) throw error;

      const results: SearchUserResult[] = (data || []).map((profile: any) => ({
        id: profile.id,
        username: profile.username,
        full_name: profile.full_name,
        language_preference: profile.language_preference,
        is_connected: false,
        connection_status: 'not_connected'
      }));

      return { success: true, data: results };
    } catch (error: any) {
      console.error('🔍 DIRECT QUERY error:', error);
      return { success: false, error: error.message };
    }
  }

  async searchUsersManual(searchTerm: string, userId: string): Promise<ApiResponse<SearchUserResult[]>> {
    try {
      const { data: allProfiles, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, language_preference, email')
        .neq('id', userId)
        .order('username')
        .limit(100);

      if (error) throw error;
      if (!allProfiles) return { success: true, data: [] };

      const searchLower = searchTerm.toLowerCase();
      const filtered = allProfiles.filter((profile: any) => {
        const usernameMatch = profile.username?.toLowerCase().includes(searchLower) || false;
        const fullNameMatch = profile.full_name?.toLowerCase().includes(searchLower) || false;
        const emailMatch = profile.email?.toLowerCase().includes(searchLower) || false;
        return usernameMatch || fullNameMatch || emailMatch;
      });

      const results: SearchUserResult[] = filtered.map((profile: any) => ({
        id: profile.id,
        username: profile.username,
        full_name: profile.full_name,
        language_preference: profile.language_preference,
        is_connected: false,
        connection_status: 'not_connected'
      }));

      return { success: true, data: results };
    } catch (error: any) {
      console.error('🔍 MANUAL SEARCH error:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== CONNECTION MANAGEMENT ====================
  async sendConnectionRequest(targetUsername: string): Promise<ApiResponse<ConnectionResponse>> {
    try {
      const userResponse = await supabase.auth.getUser();
      const userId = userResponse.data.user?.id;
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('send_connection_request', {
        target_username: targetUsername,
        current_user_id: userId
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Error sending connection request:', error);
      return { success: false, error: error.message };
    }
  }

  async acceptConnectionRequest(connectionId: string): Promise<ApiResponse> {
    try {
      const userResponse = await supabase.auth.getUser();
      const userId = userResponse.data.user?.id;
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: connection, error: fetchError } = await supabase
        .from('connections')
        .select('*')
        .eq('id', connectionId)
        .single();

      if (fetchError) {
        console.error('Error fetching connection:', fetchError);
        return { success: false, error: 'Connection not found' };
      }

      if (connection.receiver_id !== userId) {
        return { 
          success: false, 
          error: 'Only the receiver can accept this connection request' 
        };
      }

      if (connection.status !== 'pending') {
        return { 
          success: false, 
          error: `Connection is already ${connection.status}` 
        };
      }
      
      const { data, error } = await supabase
        .from('connections')
        .update({ 
          status: 'accepted', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', connectionId)
        .eq('receiver_id', userId)
        .eq('status', 'pending')
        .select();

      if (error) {
        console.error('Error updating connection:', error);
        return { success: false, error: error.message };
      }

      if (!data || data.length === 0) {
        return { 
          success: false, 
          error: 'Update failed. The connection may have been modified by another user.' 
        };
      }

      return { 
        success: true, 
        message: 'Connection accepted',
        data: data[0]
      };
      
    } catch (error: any) {
      console.error('Error in acceptConnectionRequest:', error);
      return { success: false, error: error.message };
    }
  }

  async rejectConnectionRequest(connectionId: string): Promise<ApiResponse> {
    try {
      const userResponse = await supabase.auth.getUser();
      const userId = userResponse.data.user?.id;
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: connection, error: fetchError } = await supabase
        .from('connections')
        .select('*')
        .eq('id', connectionId)
        .single();

      if (fetchError) {
        return { success: false, error: 'Connection not found' };
      }

      if (connection.receiver_id !== userId) {
        return { 
          success: false, 
          error: 'Only the receiver can reject this connection request' 
        };
      }

      if (connection.status !== 'pending') {
        return { 
          success: false, 
          error: `Connection is already ${connection.status}` 
        };
      }

      const { data, error } = await supabase
        .from('connections')
        .update({ 
          status: 'rejected', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', connectionId)
        .eq('receiver_id', userId)
        .eq('status', 'pending')
        .select();

      if (error) {
        console.error('Error rejecting connection:', error);
        return { success: false, error: error.message };
      }

      if (!data || data.length === 0) {
        return { 
          success: false, 
          error: 'Update failed. The connection may have been modified by another user.' 
        };
      }

      return { 
        success: true, 
        message: 'Connection rejected',
        data: data[0]
      };
      
    } catch (error: any) {
      console.error('❌ [DEBUG] Unexpected error in rejectConnectionRequest:', error);
      return { success: false, error: error.message };
    }
  }

  async cancelSentConnectionRequest(connectionId: string): Promise<ApiResponse> {
    try {
      const userResponse = await supabase.auth.getUser();
      const userId = userResponse.data.user?.id;
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: connection, error: fetchError } = await supabase
        .from('connections')
        .select('*')
        .eq('id', connectionId)
        .single();

      if (fetchError) {
        console.error('Error fetching connection:', fetchError);
        return { success: false, error: 'Connection not found' };
      }

      if (connection.requester_id !== userId) {
        return { 
          success: false, 
          error: 'Only the sender can cancel this connection request' 
        };
      }

      if (connection.status !== 'pending') {
        return { 
          success: false, 
          error: `Cannot cancel. Connection is already ${connection.status}` 
        };
      }

      const { data, error } = await supabase
        .from('connections')
        .update({ 
          status: 'cancelled', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', connectionId)
        .eq('requester_id', userId)
        .eq('status', 'pending')
        .select();

      if (error) {
        console.error('Error cancelling connection:', error);
        return { success: false, error: error.message };
      }

      if (!data || data.length === 0) {
        return { 
          success: false, 
          error: 'Cancel failed. The connection may have been modified by another user.' 
        };
      }

      return { 
        success: true, 
        message: 'Connection request cancelled',
        data: data[0]
      };
      
    } catch (error: any) {
      console.error('Error in cancelSentConnectionRequest:', error);
      return { success: false, error: error.message };
    }
  }

  // ================= GET CONNECTIONS METHODS (UPDATED WITH PROFILE JOINS) =================
  async getPendingConnections(): Promise<ApiResponse<Connection[]>> {
    try {
      const userResponse = await supabase.auth.getUser();
      const userId = userResponse.data.user?.id;
      if (!userId) throw new Error('User not authenticated');

      // Join with profiles table to get requester and receiver details
      const { data, error } = await supabase
        .from('connections')
        .select(`
          *,
          requester:profiles!connections_requester_id_fkey(id, username, full_name),
          receiver:profiles!connections_receiver_id_fkey(id, username, full_name)
        `)
        .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending connections:', error);
        // Fallback to manual profile fetching
        return this.getPendingConnectionsWithManualJoin(userId);
      }

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Error getting pending connections:', error);
      return { success: false, error: error.message };
    }
  }

  // Fallback method that manually fetches profile data
  private async getPendingConnectionsWithManualJoin(userId: string): Promise<ApiResponse<Connection[]>> {
    try {
      // First get the connections
      const { data: connections, error } = await supabase
        .from('connections')
        .select('*')
        .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!connections || connections.length === 0) {
        return { success: true, data: [] };
      }

      // Collect all unique user IDs we need to fetch
      const userIds = new Set<string>();
      connections.forEach(conn => {
        userIds.add(conn.requester_id);
        userIds.add(conn.receiver_id);
      });

      // Fetch all profiles at once
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name')
        .in('id', Array.from(userIds));

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return { success: true, data: connections };
      }

      // Create a map for quick lookup
      const profileMap = new Map<string, { id: string; username: string | null; full_name: string | null }>();
      profiles?.forEach(profile => {
        profileMap.set(profile.id, profile);
      });

      // Attach profile data to connections
      const connectionsWithProfiles: Connection[] = connections.map(conn => ({
        ...conn,
        requester: profileMap.get(conn.requester_id) || undefined,
        receiver: profileMap.get(conn.receiver_id) || undefined,
      }));

      return { success: true, data: connectionsWithProfiles };
    } catch (error: any) {
      console.error('Error in getPendingConnectionsWithManualJoin:', error);
      return { success: false, error: error.message };
    }
  }

  // Fallback method if join fails (simple query)
  private async getPendingConnectionsFallback(userId: string): Promise<ApiResponse<Connection[]>> {
    try {
      const { data, error } = await supabase
        .from('connections')
        .select('*')
        .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Error in getPendingConnectionsFallback:', error);
      return { success: false, error: error.message };
    }
  }

  async getActiveConnections(): Promise<ApiResponse<Connection[]>> {
    try {
      const userResponse = await supabase.auth.getUser();
      const userId = userResponse.data.user?.id;
      if (!userId) throw new Error('User not authenticated');

      // Join with profiles table to get requester and receiver details
      const { data, error } = await supabase
        .from('connections')
        .select(`
          *,
          requester:profiles!connections_requester_id_fkey(id, username, full_name),
          receiver:profiles!connections_receiver_id_fkey(id, username, full_name)
        `)
        .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
        .eq('status', 'accepted')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching active connections:', error);
        // Fallback to manual profile fetching
        return this.getActiveConnectionsWithManualJoin(userId);
      }

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Error getting active connections:', error);
      return { success: false, error: error.message };
    }
  }

  // Fallback method that manually fetches profile data for active connections
  private async getActiveConnectionsWithManualJoin(userId: string): Promise<ApiResponse<Connection[]>> {
    try {
      // First get the connections
      const { data: connections, error } = await supabase
        .from('connections')
        .select('*')
        .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
        .eq('status', 'accepted')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      if (!connections || connections.length === 0) {
        return { success: true, data: [] };
      }

      // Collect all unique user IDs we need to fetch
      const userIds = new Set<string>();
      connections.forEach(conn => {
        userIds.add(conn.requester_id);
        userIds.add(conn.receiver_id);
      });

      // Fetch all profiles at once
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name')
        .in('id', Array.from(userIds));

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return { success: true, data: connections };
      }

      // Create a map for quick lookup
      const profileMap = new Map<string, { id: string; username: string | null; full_name: string | null }>();
      profiles?.forEach(profile => {
        profileMap.set(profile.id, profile);
      });

      // Attach profile data to connections
      const connectionsWithProfiles: Connection[] = connections.map(conn => ({
        ...conn,
        requester: profileMap.get(conn.requester_id) || undefined,
        receiver: profileMap.get(conn.receiver_id) || undefined,
      }));

      return { success: true, data: connectionsWithProfiles };
    } catch (error: any) {
      console.error('Error in getActiveConnectionsWithManualJoin:', error);
      return { success: false, error: error.message };
    }
  }

  // Fallback method if join fails (simple query)
  private async getActiveConnectionsFallback(userId: string): Promise<ApiResponse<Connection[]>> {
    try {
      const { data, error } = await supabase
        .from('connections')
        .select('*')
        .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
        .eq('status', 'accepted')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Error in getActiveConnectionsFallback:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== MESSAGES - NO TRANSLATION ON SEND ====================
  async sendMessage(payload: SendMessagePayload): Promise<ApiResponse<MessageTranslationResult>> {
    try {
      console.log('🔵 [FRONTEND] Sending message WITHOUT translation:', payload);
      
      let senderLanguage = payload.sender_language || 'en';
      
      // SEND ORIGINAL MESSAGE AS-IS (NO TRANSLATION)
      const { data, error } = await supabase.rpc('process_chat_message_v2', {
        p_receiver_username: payload.receiver_username,
        p_message_text: payload.message_text,
        p_sender_language: senderLanguage
      });

      if (error) {
        console.error('❌ [DEBUG] RPC error:', error);
        return await this.sendMessageFallback(payload, senderLanguage);
      }

      if (!data) {
        return { success: false, error: 'No response from server' };
      }

      const messageData = data as any;
      
      const result: MessageTranslationResult = {
        success: true,
        message_id: messageData.message_id || `msg-${Date.now()}`,
        is_translated: false,
        translation_method: undefined,
        receiver_language: undefined
      };

      console.log('✅ [FRONTEND] Message sent successfully (no translation)');
      return { success: true, data: result };
      
    } catch (error: any) {
      console.error('❌ [DEBUG] Error sending message:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to send message' 
      };
    }
  }

  private async sendMessageFallback(
    payload: SendMessagePayload, 
    senderLanguage: string
  ): Promise<ApiResponse<MessageTranslationResult>> {
    try {
      console.log('🔄 [FALLBACK] Using direct message insertion');
      
      const userResponse = await supabase.auth.getUser();
      const currentUserId = userResponse.data.user?.id;
      if (!currentUserId) throw new Error('User not authenticated');

      const { data: receiverData, error: receiverError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', payload.receiver_username)
        .single();

      if (receiverError || !receiverData) {
        throw new Error('Receiver not found');
      }

      const { data: connectionData } = await supabase
        .from('connections')
        .select('id')
        .eq('status', 'accepted')
        .or(`and(requester_id.eq.${currentUserId},receiver_id.eq.${receiverData.id}),and(requester_id.eq.${receiverData.id},receiver_id.eq.${currentUserId})`)
        .single();

      if (!connectionData) {
        throw new Error('No active connection with this user');
      }

      const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const { error: insertError } = await supabase
        .from('chat_messages')
        .insert({
          id: messageId,
          sender_id: currentUserId,
          receiver_id: receiverData.id,
          original_text: payload.message_text,
          original_language: senderLanguage,
          is_translated: false,
          translation_method: null,
          translated_text: null,
          translated_language: null,
          connection_id: connectionData.id,
          read_at: null
        });

      if (insertError) throw insertError;

      const result: MessageTranslationResult = {
        success: true,
        message_id: messageId,
        is_translated: false,
        translation_method: undefined,
        receiver_language: undefined
      };

      return { success: true, data: result };
      
    } catch (error: any) {
      console.error('❌ [FALLBACK] Error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to send message' 
      };
    }
  }

  async getConversationMessages(
    otherUserId: string,
    page: number = 0
  ): Promise<ApiResponse<{ messages: ChatMessage[]; hasMore: boolean }>> {
    try {
      const limit = CHAT_CONSTANTS.MESSAGES_PER_PAGE;
      const offset = page * limit;

      console.log(`🔵 [FRONTEND] Getting messages for user ${otherUserId}, page: ${page}`);

      try {
        const { data, error } = await supabase.rpc('get_conversation_messages_with_translations', {
          p_other_user_id: otherUserId,
          p_limit: limit,
          p_offset: offset,
          p_target_language: 'en'
        });

        if (error) {
          console.error('❌ [DEBUG] RPC error:', error);
          return await this.getConversationMessagesFallback(otherUserId, page, limit);
        }

        console.log(`✅ [FRONTEND] Got ${data?.length || 0} messages`);

        const messages = (data || []).map((msg: any) => ({
          id: msg.id,
          sender_id: msg.sender_id,
          receiver_id: msg.receiver_id,
          original_text: msg.original_text,
          original_language: msg.original_language || 'en',
          translated_text: msg.translated_text,
          translated_language: msg.translated_language,
          translation_method: msg.translation_method,
          is_translated: Boolean(msg.is_translated), 
          created_at: new Date(msg.created_at).toISOString(),
          read_at: msg.read_at ? new Date(msg.read_at).toISOString() : null,
          connection_id: msg.connection_id,
          is_sent_by_me: !!msg.is_sent_by_me
        }));

        return {
          success: true,
          data: {
            messages,
            hasMore: messages.length === limit
          }
        };
      } catch (rpcError: any) {
        console.error('❌ [DEBUG] RPC function error:', rpcError);
        return await this.getConversationMessagesFallback(otherUserId, page, limit);
      }
    } catch (error: any) {
      console.error('❌ Error getting conversation messages:', error);
      return { 
        success: false, 
        error: error.message,
        data: { messages: [], hasMore: false }
      };
    }
  }

  private async getConversationMessagesFallback(
    otherUserId: string,
    page: number,
    limit: number
  ): Promise<ApiResponse<{ messages: ChatMessage[]; hasMore: boolean }>> {
    try {
      const offset = page * limit;
      const userResponse = await supabase.auth.getUser();
      const userId = userResponse.data.user?.id;
      
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log(`🔄 [FALLBACK] Using fallback query for messages`);

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ [FALLBACK] Query error:', error);
        throw error;
      }

      const messages: ChatMessage[] = (data || []).map((msg: any) => ({
        id: msg.id,
        sender_id: msg.sender_id,
        receiver_id: msg.receiver_id,
        original_text: msg.original_text,
        original_language: msg.original_language || 'en',
        translated_text: msg.translated_text,
        translated_language: msg.translated_language,
        translation_method: msg.translation_method as TranslationMethod,
        is_translated: Boolean(msg.is_translated),
        created_at: new Date(msg.created_at).toISOString(),
        read_at: msg.read_at ? new Date(msg.read_at).toISOString() : null,
        connection_id: msg.connection_id,
        is_sent_by_me: msg.sender_id === userId
      }));

      messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      return {
        success: true,
        data: {
          messages,
          hasMore: messages.length === limit
        }
      };
    } catch (error: any) {
      console.error('❌ Fallback query error:', error);
      return { 
        success: false, 
        error: error.message,
        data: { messages: [], hasMore: false }
      };
    }
  }

  async markMessagesAsRead(senderId: string): Promise<ApiResponse<{ updatedCount: number }>> {
    try {
      const { data, error } = await supabase.rpc('mark_messages_as_read', {
        p_sender_id: senderId
      });

      if (error) throw error;
      return { success: true, data: { updatedCount: data || 0 } };
    } catch (error: any) {
      console.error('Error marking messages as read:', error);
      return { success: false, error: error.message };
    }
  }

  async getConversations(): Promise<ApiResponse<Conversation[]>> {
    try {
      const userResponse = await supabase.auth.getUser();
      const userId = userResponse.data.user?.id;
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('get_user_conversations', {
        user_id: userId
      });

      if (error) throw error;

      const conversations = (data || []).map((conv: any) => ({
        ...conv,
        last_message_time: conv.last_message_time ? new Date(conv.last_message_time).toISOString() : null
      }));

      return { success: true, data: conversations };
    } catch (error: any) {
      console.error('Error getting conversations:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== FRONTEND AUTO TRANSLATE ALL MESSAGES (WITH LIMIT CHECKING) ====================
  async autoTranslateIncomingMessage(
    message: ChatMessage,
    targetLanguage: string
  ): Promise<ApiResponse<{ translated_text: string; limit_exceeded?: boolean; limit_status?: ChatTranslationLimitStatus }>> {
    try {
      console.log(`🔍 [DEBUG] Auto-translate called for message ${message.id.substring(0, 20)} to ${targetLanguage}`);
      
      // Don't translate if original text is empty
      if (!message.original_text || message.original_text.trim().length === 0) {
        console.log('⚠️ [FRONTEND] Original text is empty, skipping');
        return {
          success: false,
          error: 'Original text is empty'
        };
      }

      // Don't translate if already in target language
      const originalLang = message.original_language || 'en';
      if (originalLang === targetLanguage) {
        console.log('⚠️ [FRONTEND] Already in target language, skipping');
        return {
          success: false,
          error: 'Already in target language'
        };
      }

      // Check local cache first
      const localCacheKey = `${message.original_text}|${originalLang}|${targetLanguage}`;
      const cachedTranslation = localTranslationCache.get(localCacheKey);
      if (cachedTranslation) {
        console.log('✅ [FRONTEND] Using cached translation for incoming message');
        return {
          success: true,
          data: { translated_text: cachedTranslation }
        };
      }

      // Check if translation service is available
      if (!this.isTranslationServiceAvailable) {
        console.log('⚠️ [FRONTEND] Translation service not available');
        return {
          success: false,
          error: 'Translation service not available'
        };
      }

      // CHECK CHAT TRANSLATION LIMIT BEFORE TRANSLATING
      const limitCheck = await this.getChatTranslationStatus();
      if (limitCheck.success && limitCheck.data) {
        // If not premium and limit exceeded, return limit exceeded response
        if (!limitCheck.data.is_premium && !limitCheck.data.can_translate) {
          console.log('⚠️ [FRONTEND] Chat translation limit exceeded');
          return {
            success: false,
            error: 'Chat translation limit exceeded',
            data: {
              translated_text: '',
              limit_exceeded: true,
              limit_status: limitCheck.data
            }
          };
        }
      }

      // Calculate word count for this message
      const wordCount = this.countWords(message.original_text);

      // Call Edge Function for translation
      console.log(`📤 [FRONTEND] Translating incoming message via Edge Function: ${originalLang} → ${targetLanguage}`);
      
      const translatedText = await this.translateWithEdgeFunction(
        message.original_text,
        originalLang,
        targetLanguage
      );

      console.log('✅ [FRONTEND] Incoming message translation successful');

      // Store in local cache
      localTranslationCache.set(localCacheKey, translatedText);

      // UPDATE WORD COUNT AFTER SUCCESSFUL TRANSLATION (only for non-premium users)
      if (limitCheck.data && !limitCheck.data.is_premium) {
        const updateResult = await this.updateChatTranslationCount(wordCount);
        if (updateResult.data) {
          console.log(`📊 [FRONTEND] Updated word count: ${updateResult.data.current_count}/${updateResult.data.monthly_limit}`);
        }
      }

      return {
        success: true,
        data: { translated_text: translatedText }
      };
    } catch (error: any) {
      console.error('❌ [FRONTEND] Error translating incoming message:', error);
      return {
        success: false,
        error: error.message || 'Translation failed'
      };
    }
  }

  // ==================== TRANSLATE ALL MESSAGES FOR USERS (WITH LIMIT CHECKING) ====================
  async translateMessagesForUser(
    messages: ChatMessage[],
    targetLanguage: string,
    currentUserId: string
  ): Promise<ApiResponse<{ [messageId: string]: string }>> {
    try {
      console.log(`🔵 [FRONTEND] Translating ${messages.length} messages to ${targetLanguage}`);
      
      if (!this.isTranslationServiceAvailable) {
        console.log('❌ [DEBUG] Translation service not available');
        return {
          success: false,
          error: 'Translation service not available'
        };
      }

      // CHECK CHAT TRANSLATION LIMIT BEFORE TRANSLATING
      const limitCheck = await this.getChatTranslationStatus();
      if (limitCheck.success && limitCheck.data) {
        // If not premium and limit exceeded, return limit exceeded response
        if (!limitCheck.data.is_premium && !limitCheck.data.can_translate) {
          console.log('⚠️ [FRONTEND] Chat translation limit exceeded');
          return {
            success: false,
            error: 'Chat translation limit exceeded'
          };
        }
      }

      const isPremium = limitCheck.data?.is_premium || false;
      const remainingWords = limitCheck.data?.remaining_words || 0;

      // Filter messages that need translation (incoming messages only)
      let messagesToTranslate = messages.filter(msg => 
        msg.sender_id !== currentUserId && // Only incoming messages
        !msg.translated_text && // Not already translated
        msg.original_text && 
        msg.original_text.trim().length > 0 &&
        (msg.original_language || 'en') !== targetLanguage // Different language
      );

      if (messagesToTranslate.length === 0) {
        console.log('⚠️ [FRONTEND] No messages need translation');
        return {
          success: true,
          data: {}
        };
      }

      // For non-premium users, check if we have enough remaining words
      let totalWordsToTranslate = 0;
      if (!isPremium) {
        for (const msg of messagesToTranslate) {
          totalWordsToTranslate += this.countWords(msg.original_text);
        }
        
        // If total words exceed remaining, limit the messages we translate
        if (totalWordsToTranslate > remainingWords) {
          console.log(`⚠️ [FRONTEND] Total words (${totalWordsToTranslate}) exceeds remaining (${remainingWords}), limiting translations`);
          
          // Translate only messages that fit within the limit
          let wordsUsed = 0;
          const limitedMessages: ChatMessage[] = [];
          
          for (const msg of messagesToTranslate) {
            const msgWordCount = this.countWords(msg.original_text);
            if (wordsUsed + msgWordCount <= remainingWords) {
              limitedMessages.push(msg);
              wordsUsed += msgWordCount;
            } else {
              break;
            }
          }
          
          if (limitedMessages.length === 0) {
            // No room for any translation
            return {
              success: false,
              error: 'Chat translation limit exceeded'
            };
          }
          
          // Update to only translate limited messages
          messagesToTranslate = limitedMessages;
          totalWordsToTranslate = wordsUsed;
        }
      }

      console.log(`🔄 [FRONTEND] Translating ${messagesToTranslate.length} incoming messages (${totalWordsToTranslate} words)`);

      // Extract texts for batch translation
      const textsToTranslate = messagesToTranslate.map(msg => msg.original_text);
      
      // Get source languages for each message
      const sourceLanguages = messagesToTranslate.map(msg => msg.original_language || 'en');
      
      // Group messages by source language for efficient batch translation
      const messagesBySourceLang: { [key: string]: { texts: string[], messageIndices: number[] } } = {};
      
      for (let i = 0; i < messagesToTranslate.length; i++) {
        const msg = messagesToTranslate[i];
        const sourceLang = msg.original_language || 'en';
        
        if (!messagesBySourceLang[sourceLang]) {
          messagesBySourceLang[sourceLang] = {
            texts: [],
            messageIndices: []
          };
        }
        
        messagesBySourceLang[sourceLang].texts.push(msg.original_text);
        messagesBySourceLang[sourceLang].messageIndices.push(i);
      }
      
      // Translate each language group
      const translatedTexts: string[] = new Array(messagesToTranslate.length).fill('');
      
      for (const [sourceLang, { texts, messageIndices }] of Object.entries(messagesBySourceLang)) {
        try {
          let batchTranslations: string[];
          
          if (texts.length > 1) {
            // Batch translate for this language group
            batchTranslations = await this.translateBatchWithEdgeFunction(texts, sourceLang, targetLanguage);
          } else {
            // Single translation
            batchTranslations = [await this.translateWithEdgeFunction(texts[0], sourceLang, targetLanguage)];
          }
          
          // Assign translations back to their positions
          for (let i = 0; i < messageIndices.length; i++) {
            const originalIndex = messageIndices[i];
            translatedTexts[originalIndex] = batchTranslations[i];
          }
          
        } catch (batchError) {
          console.error(`❌ [EDGE] Failed to translate ${sourceLang} group:`, batchError);
          
          // Fallback: try individual translations for this group
          for (let i = 0; i < messageIndices.length; i++) {
            const originalIndex = messageIndices[i];
            const msg = messagesToTranslate[originalIndex];
            
            try {
              const translated = await this.translateWithEdgeFunction(
                msg.original_text,
                sourceLang,
                targetLanguage
              );
              translatedTexts[originalIndex] = translated;
            } catch (error) {
              console.error(`❌ [EDGE] Failed to translate message ${msg.id}:`, error);
              translatedTexts[originalIndex] = msg.original_text; // Keep original text on error
            }
          }
        }
      }

      // Build result object and store translations in cache
      const results: { [messageId: string]: string } = {};
      
      for (let i = 0; i < messagesToTranslate.length; i++) {
        const msg = messagesToTranslate[i];
        const translatedText = translatedTexts[i];
        
        results[msg.id] = translatedText;
        
        // Store in local cache
        const cacheKey = `${msg.original_text}|${msg.original_language || 'en'}|${targetLanguage}`;
        localTranslationCache.set(cacheKey, translatedText);
      }

      // UPDATE WORD COUNT AFTER SUCCESSFUL TRANSLATION (only for non-premium users)
      if (!isPremium && totalWordsToTranslate > 0) {
        const updateResult = await this.updateChatTranslationCount(totalWordsToTranslate);
        if (updateResult.data) {
          console.log(`📊 [FRONTEND] Updated word count: ${updateResult.data.current_count}/${updateResult.data.monthly_limit}`);
        }
      }

      console.log(`✅ [FRONTEND] Successfully translated ${messagesToTranslate.length} messages`);
      return {
        success: true,
        data: results
      };
    } catch (error: any) {
      console.error('❌ [FRONTEND] Error translating messages:', error);
      return {
        success: false,
        error: error.message || 'Translation failed'
      };
    }
  }

  // ==================== BACKWARD COMPATIBILITY METHODS ====================
  /**
   * @deprecated Use autoTranslateIncomingMessage instead
   */
  async autoTranslateMessage(
    message: ChatMessage,
    targetLanguage: string
  ): Promise<ApiResponse<{ translated_text: string }>> {
    console.warn('⚠️ autoTranslateMessage is deprecated, use autoTranslateIncomingMessage instead');
    return this.autoTranslateIncomingMessage(message, targetLanguage);
  }

  /**
   * @deprecated Use translateMessagesForUser instead
   */
  async translateIncomingMessages(
    messages: ChatMessage[],
    targetLanguage: string,
    currentUserId: string
  ): Promise<ApiResponse<{ [messageId: string]: string }>> {
    console.warn('⚠️ translateIncomingMessages is deprecated, use translateMessagesForUser instead');
    return this.translateMessagesForUser(messages, targetLanguage, currentUserId);
  }

  // ==================== USER LANGUAGE PREFERENCES ====================
  async getUserLanguagePreference(): Promise<ApiResponse<{ language: string }>> {
    try {
      const userResponse = await supabase.auth.getUser();
      const userId = userResponse.data.user?.id;
      if (!userId) throw new Error('User not authenticated');

      try {
        const { data, error } = await supabase.rpc('get_user_language_preference');

        if (error) {
          throw error;
        }

        const languageData = data as any;
        return { 
          success: true, 
          data: { 
            language: languageData.language || 'en' 
          } 
        };
      } catch (rpcError) {
        // Fallback to direct query
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('language_preference')
          .eq('id', userId)
          .single();

        if (profileError) throw profileError;
        
        return { 
          success: true, 
          data: { 
            language: profileData.language_preference || 'en' 
          } 
        };
      }
    } catch (error: any) {
      console.error('Error getting language preference:', error);
      return { 
        success: false, 
        error: error.message,
        data: { language: 'en' }
      };
    }
  }

  async updateLanguagePreference(languageCode: string): Promise<ApiResponse> {
    try {
      const userResponse = await supabase.auth.getUser();
      const userId = userResponse.data.user?.id;
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('update_user_language_preference', {
        p_language_code: languageCode
      });

      if (error) {
        return { 
          success: false, 
          error: error.message 
        };
      }

      const result = data as any;
      
      if (result.error === 'Premium feature only') {
        return {
          success: false,
          error: result.error,
          message: result.message
        };
      }

      return { 
        success: true, 
        message: result.message || 'Language preference updated',
        data: result
      };
    } catch (error: any) {
      console.error('Error updating language preference:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== USER STATUS METHODS ====================
  async updateLastOnline(): Promise<ApiResponse> {
    try {
      const { error } = await supabase.rpc('update_last_online');
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error updating last online:', error);
      return { success: false, error: error.message };
    }
  }

  async checkPremiumAccess(): Promise<ApiResponse<{ hasPremium: boolean }>> {
    try {
      const userResponse = await supabase.auth.getUser();
      const userId = userResponse.data.user?.id;
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('account_tier')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { 
        success: true, 
        data: { 
          hasPremium: data.account_tier === 'premium' 
        } 
      };
    } catch (error: any) {
      console.error('Error checking premium access:', error);
      return { success: false, error: error.message };
    }
  }

  async getCurrentUser() {
    const userResponse = await supabase.auth.getUser();
    return userResponse.data.user;
  }

  // ==================== UTILITY METHODS ====================
  /**
   * Clear the local translation cache
   */
  clearTranslationCache(): void {
    localTranslationCache.clear();
    console.log('🧹 [CACHE] Local translation cache cleared');
  }

  /**
   * Check if translation service is available
   */
  isTranslationAvailable(): boolean {
    return this.isTranslationServiceAvailable;
  }

  /**
   * Check if a message needs translation (frontend-only logic)
   */
  messageNeedsTranslation(
    message: ChatMessage, 
    targetLanguage: string, 
    currentUserId: string
  ): boolean {
    // Get original language as string or default to 'en'
    const originalLang = message.original_language ? String(message.original_language) : 'en';
    const targetLang = String(targetLanguage);
    
    // Ensure all conditions return boolean values
    const isIncomingMessage: boolean = message.sender_id !== currentUserId;
    const notTranslated: boolean = !message.translated_text;
    const hasOriginalText: boolean = Boolean(message.original_text && message.original_text.trim().length > 0);
    const differentLanguage: boolean = originalLang !== targetLang;
    
    return isIncomingMessage && notTranslated && hasOriginalText && differentLanguage;
  }
}

export const chatService = new ChatService();