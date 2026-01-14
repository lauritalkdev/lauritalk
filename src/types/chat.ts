// Task 8: Create TypeScript types for chat feature

// Connection types
export type ConnectionStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';

export interface Connection {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: ConnectionStatus;
  created_at: string;
  updated_at: string;
}

export interface ConnectionRequest {
  target_username: string;
}

export interface ConnectionResponse {
  connection_id: string;
  status: ConnectionStatus;
  requester_username: string;
  receiver_username: string;
  created_at: string;
}

// Chat message types
export type TranslationMethod = 'azure' | 'dictionary' | 'none' | 'openai';

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  original_text: string;
  original_language: string;
  translated_text: string | null;
  translated_language: string | null;
  is_translated: boolean;
  translation_method: TranslationMethod | null;
  connection_id: string;
  created_at: string;
  read_at: string | null;
  
  // Frontend only fields
  is_sent_by_me?: boolean;
  sender_username?: string;
  sender_full_name?: string;
  receiver_username?: string;
}

export interface SendMessagePayload {
  receiver_username: string;
  message_text: string;
  sender_language?: string;
}

export interface MessageTranslationResult {
  success: boolean;
  message_id?: string;
  is_translated: boolean;
  translation_method?: TranslationMethod;
  receiver_language?: string;
  error?: string;
}

// User profile for chat
export interface ChatUserProfile {
  id: string;
  username: string;
  full_name: string | null;
  email: string;
  language_preference: string;
  account_tier: 'freemium' | 'premium';
  last_online: string;
  daily_word_count: number;
  last_word_count_reset: string;
}

// Conversation types
export interface Conversation {
  other_user_id: string;
  other_username: string;
  other_full_name: string | null;
  other_language_preference: string;
  last_message: string;
  last_message_time: string | null;
  unread_count: number;
  connection_status: ConnectionStatus;
}

export interface ConversationMessagesResponse {
  messages: ChatMessage[];
  hasMore: boolean;
  totalCount: number;
}

// Search types
export interface SearchUserResult {
  id: string;
  username: string;
  full_name: string | null;
  language_preference: string;
  is_connected: boolean;
  connection_status: ConnectionStatus | 'not_connected';
}

// Realtime subscription types
export interface RealtimeMessagePayload {
  table: 'chat_messages' | 'connections';
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  data: ChatMessage | Connection;
  sender_id?: string;
  receiver_id?: string;
  requester_id?: string;
  old_status?: ConnectionStatus;
  new_status?: ConnectionStatus;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Chat UI state types
export interface ChatState {
  conversations: Conversation[];
  activeConversation: string | null; // other_user_id
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  hasMoreMessages: boolean;
  searchResults: SearchUserResult[];
}

// Constants
export const CHAT_CONSTANTS = {
  MESSAGES_PER_PAGE: 50,
  REALTIME_CHANNEL: 'chat_updates',
  CONNECTION_UPDATE_CHANNEL: 'connection_updates',
} as const;