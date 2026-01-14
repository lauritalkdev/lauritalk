// screens/ChatScreen.tsx - FINAL CORRECT VERSION
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { chatService } from '../services/chatService';
import { Conversation } from '../src/types/chat';

export default function ChatScreen({ navigation }: any) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);

  // Load conversations on focus
  useFocusEffect(
    useCallback(() => {
      loadConversations();
      return () => {
        // Cleanup if needed
      };
    }, [])
  );

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await chatService.getConversations();
      
      if (response.success && response.data) {
        setConversations(response.data);
        setFilteredConversations(response.data);
      } else {
        Alert.alert('Error', response.error || 'Failed to load conversations');
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      Alert.alert('Error', 'Failed to load conversations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  // Filter conversations based on search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter(conv =>
        conv.other_username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (conv.other_full_name && conv.other_full_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredConversations(filtered);
    }
  }, [searchQuery, conversations]);

  const handleConversationPress = (conversation: Conversation) => {
    navigation.navigate('ConversationScreen', {
      otherUserId: conversation.other_user_id,
      otherUsername: conversation.other_username,
      otherFullName: conversation.other_full_name,
    });
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const truncateText = (text: string, maxLength: number = 40) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => handleConversationPress(item)}
    >
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>
          {item.other_username.charAt(0).toUpperCase()}
        </Text>
      </View>
      
      <View style={styles.conversationInfo}>
        <View style={styles.conversationHeader}>
          <Text style={styles.username}>
            {item.other_full_name || item.other_username}
          </Text>
          {item.last_message_time && (
            <Text style={styles.timeText}>
              {formatTime(item.last_message_time)}
            </Text>
          )}
        </View>
        
        <Text style={styles.lastMessage} numberOfLines={1}>
          {truncateText(item.last_message)}
        </Text>
        
        <View style={styles.conversationFooter}>
          <View style={styles.languageBadge}>
            <Ionicons name="language" size={12} color={COLORS.gold} />
            <Text style={styles.languageText}>
              {item.other_language_preference.toUpperCase()}
            </Text>
          </View>
          
          {item.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread_count}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={80} color={COLORS.gold} />
      <Text style={styles.emptyStateTitle}>No Conversations Yet</Text>
      <Text style={styles.emptyStateText}>
        Connect with other users to start chatting
      </Text>
      <TouchableOpacity
        style={styles.searchUsersButton}
        onPress={() => navigation.navigate('SearchUsersScreen')}
      >
        <Ionicons name="search" size={20} color={COLORS.black} />
        <Text style={styles.searchUsersButtonText}>Find Users to Chat With</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.black} barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.gold} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat Translation</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('SearchUsersScreen')}
          >
            <Ionicons name="person-add" size={24} color={COLORS.gold} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('ConnectionRequestsScreen')}
          >
            <Ionicons name="people" size={24} color={COLORS.gold} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.gold} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {/* Conversations List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.gold} />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.other_user_id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.gold]}
              tintColor={COLORS.gold}
            />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gold,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff6b6b',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.gold,
    fontSize: 16,
    paddingVertical: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.gold,
    marginTop: 12,
  },
  listContent: {
    flexGrow: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.1)',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: COLORS.black,
    fontSize: 20,
    fontWeight: 'bold',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  timeText: {
    color: '#888',
    fontSize: 12,
    marginLeft: 8,
  },
  lastMessage: {
    color: '#888',
    fontSize: 14,
    marginBottom: 6,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  languageText: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  unreadBadge: {
    backgroundColor: '#ff6b6b',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyStateTitle: {
    color: COLORS.gold,
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  emptyStateText: {
    color: '#888',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 22,
  },
  searchUsersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gold,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
    gap: 10,
  },
  searchUsersButtonText: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: '600',
  },
});