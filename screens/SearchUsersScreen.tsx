// Task 12: Create Search Users Screen (FULLY FIXED VERSION)
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
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
import { SearchUserResult } from '../src/types/chat';

export default function SearchUsersScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [connectionLoading, setConnectionLoading] = useState<string | null>(null);

  // Load recent searches from storage
  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    // For now, using a simple array. You can integrate with AsyncStorage later
    const recent = ['john', 'mary', 'david']; // Example recent searches
    setRecentSearches(recent);
  };

  // Simple debounced search without useCallback to avoid dependency issues
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        console.log('DEBUG: Query is empty, clearing results');
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        console.log('DEBUG: Calling chatService.searchUsers with:', searchQuery);
        const response = await chatService.searchUsers(searchQuery);
        console.log('DEBUG: Search response success:', response.success);
        console.log('DEBUG: Search response data length:', response.data?.length);
        console.log('DEBUG: Full search response data:', response.data);
        
        if (response.success && response.data) {
          console.log('DEBUG: Found users:', response.data.length);
          console.log('DEBUG: Setting search results to state');
          setSearchResults(response.data);
          
          // Save to recent searches
          if (searchQuery.trim() && !recentSearches.includes(searchQuery.toLowerCase())) {
            const updated = [searchQuery.toLowerCase(), ...recentSearches.slice(0, 4)];
            setRecentSearches(updated);
          }
        } else {
          console.log('DEBUG: Search failed or no data:', response.error);
          setSearchResults([]);
          if (response.error) {
            Alert.alert('Error', response.error || 'Failed to search users');
          }
        }
      } catch (error: any) {
        console.error('DEBUG: Error searching users:', error);
        setSearchResults([]);
        Alert.alert('Error', 'Failed to search users');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(performSearch, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleRefresh = async () => {
    if (!searchQuery.trim()) return;
    
    setRefreshing(true);
    try {
      const response = await chatService.searchUsers(searchQuery);
      if (response.success && response.data) {
        setSearchResults(response.data);
      }
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSendRequest = async (userId: string, username: string) => {
    setConnectionLoading(userId);
    try {
      const response = await chatService.sendConnectionRequest(username);
      
      if (response.success) {
        Alert.alert('Success', 'Connection request sent!');
        // Update the result status
        setSearchResults(prev => 
          prev.map(user => 
            user.id === userId 
              ? { ...user, is_connected: true, connection_status: 'pending' }
              : user
          )
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to send request');
      }
    } catch (error: any) {
      console.error('Error sending request:', error);
      Alert.alert('Error', 'Failed to send connection request');
    } finally {
      setConnectionLoading(null);
    }
  };

  const getStatusText = (user: SearchUserResult) => {
    switch (user.connection_status) {
      case 'accepted':
        return 'Connected';
      case 'pending':
        return 'Request Pending';
      case 'rejected':
        return 'Request Rejected';
      case 'blocked':
        return 'Blocked';
      default:
        return 'Not Connected';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return COLORS.forestGreen;
      case 'pending':
        return COLORS.gold;
      case 'rejected':
        return '#ff6b6b';
      case 'blocked':
        return '#ff4757';
      default:
        return '#888';
    }
  };

  const renderUserItem = ({ item }: { item: SearchUserResult }) => (
    <View style={styles.userItem}>
      <View style={styles.userAvatar}>
        <Text style={styles.avatarText}>
          {item.username.charAt(0).toUpperCase()}
        </Text>
      </View>
      
      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {item.full_name || item.username}
        </Text>
        <Text style={styles.userUsername}>@{item.username}</Text>
        <View style={styles.userMeta}>
          <View style={styles.languageTag}>
            <Ionicons name="language" size={12} color={COLORS.gold} />
            <Text style={styles.languageText}>
              {item.language_preference.toUpperCase()}
            </Text>
          </View>
          <Text style={[
            styles.statusText,
            { color: getStatusColor(item.connection_status) }
          ]}>
            {getStatusText(item)}
          </Text>
        </View>
      </View>
      
      <View style={styles.actionContainer}>
        {item.connection_status === 'not_connected' ? (
          <TouchableOpacity
            style={styles.connectButton}
            onPress={() => handleSendRequest(item.id, item.username)}
            disabled={connectionLoading === item.id}
          >
            {connectionLoading === item.id ? (
              <ActivityIndicator size="small" color={COLORS.black} />
            ) : (
              <>
                <Ionicons name="person-add" size={16} color={COLORS.black} />
                <Text style={styles.connectButtonText}>Connect</Text>
              </>
            )}
          </TouchableOpacity>
        ) : item.connection_status === 'pending' ? (
          <TouchableOpacity
            style={styles.pendingButton}
            onPress={() => Alert.alert('Info', 'Request pending acceptance')}
          >
            <Ionicons name="time" size={16} color={COLORS.gold} />
            <Text style={styles.pendingButtonText}>Pending</Text>
          </TouchableOpacity>
        ) : item.connection_status === 'accepted' ? (
          <TouchableOpacity
            style={styles.connectedButton}
            onPress={() => navigation.navigate('ConversationScreen', {
              otherUserId: item.id,
              otherUsername: item.username,
              otherFullName: item.full_name,
            })}
          >
            <Ionicons name="chatbubble" size={16} color={COLORS.forestGreen} />
            <Text style={styles.connectedButtonText}>Message</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  const renderRecentSearchItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.recentItem}
      onPress={() => setSearchQuery(item)}
    >
      <Ionicons name="time-outline" size={16} color="#888" />
      <Text style={styles.recentText}>{item}</Text>
      <TouchableOpacity
        style={styles.clearRecentButton}
        onPress={() => {
          const updated = recentSearches.filter(search => search !== item);
          setRecentSearches(updated);
        }}
      >
        <Ionicons name="close" size={16} color="#888" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (searchQuery.trim() && !loading) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={60} color="#888" />
          <Text style={styles.emptyStateTitle}>No Users Found</Text>
          <Text style={styles.emptyStateText}>
            No users match "{searchQuery}"
          </Text>
          <Text style={styles.debugHint}>
            Try searching for: 'g', 'william', 'kyan', or 'gcmmemberbuea'
          </Text>
        </View>
      );
    }

    return null;
  };

  const handleClearRecent = () => {
    setRecentSearches([]);
    // Clear from AsyncStorage if implemented
  };

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
        <Text style={styles.headerTitle}>Find Users</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.gold} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by username, name, or email..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Ionicons name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {/* Debug Info - Remove after fixing */}
      {__DEV__ && searchQuery.trim() && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>
            DEBUG: Query: "{searchQuery}" | Loading: {loading.toString()} | Results: {searchResults.length}
          </Text>
          {searchResults.length > 0 && (
            <Text style={styles.debugTextSmall}>
              First result: {searchResults[0].username} ({searchResults[0].full_name})
            </Text>
          )}
        </View>
      )}

      {/* Recent Searches (when no search query) */}
      {!searchQuery.trim() && recentSearches.length > 0 && (
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Searches</Text>
            <TouchableOpacity onPress={handleClearRecent}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={recentSearches}
            renderItem={renderRecentSearchItem}
            keyExtractor={(item, index) => `${item}-${index}`}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Search Results */}
      {searchQuery.trim() ? (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>
            {loading ? 'Searching...' : `Results for "${searchQuery}"`}
          </Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.gold} />
              <Text style={styles.loadingText}>Searching users...</Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.resultsList}
              ListEmptyComponent={renderEmptyState}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={[COLORS.gold]}
                  tintColor={COLORS.gold}
                />
              }
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      ) : (
        <View style={styles.initialState}>
          <Ionicons name="people-outline" size={80} color={COLORS.gold} />
          <Text style={styles.initialTitle}>Find People to Chat With</Text>
          <Text style={styles.initialText}>
            Search by username, full name, or email to find users and start conversations
          </Text>
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>Search Tips:</Text>
            <View style={styles.tipItem}>
              <Ionicons name="search" size={16} color={COLORS.gold} />
              <Text style={styles.tipText}>Try: 'g', 'william', 'kyan', or 'gcmmemberbuea'</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.forestGreen} />
              <Text style={styles.tipText}>Users must accept connection requests</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.forestGreen} />
              <Text style={styles.tipText}>Premium users get auto-translation</Text>
            </View>
          </View>
        </View>
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
  headerSpacer: {
    width: 32,
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
  clearButton: {
    padding: 4,
  },
  debugContainer: {
    padding: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  debugText: {
    color: 'yellow',
    fontSize: 12,
  },
  debugTextSmall: {
    color: 'yellow',
    fontSize: 10,
    marginTop: 5,
  },
  recentSection: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: '600',
  },
  clearAllText: {
    color: '#888',
    fontSize: 14,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    marginBottom: 8,
  },
  recentText: {
    flex: 1,
    color: '#888',
    fontSize: 16,
    marginLeft: 8,
  },
  clearRecentButton: {
    padding: 4,
  },
  resultsSection: {
    flex: 1,
  },
  resultsTitle: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
  resultsList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.1)',
  },
  userAvatar: {
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
  userInfo: {
    flex: 1,
  },
  userName: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: '600',
  },
  userUsername: {
    color: '#888',
    fontSize: 14,
    marginTop: 2,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 12,
  },
  languageTag: {
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
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionContainer: {
    marginLeft: 8,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gold,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  connectButtonText: {
    color: COLORS.black,
    fontSize: 14,
    fontWeight: '600',
  },
  pendingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  pendingButtonText: {
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: '600',
  },
  connectedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 139, 87, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.forestGreen,
  },
  connectedButtonText: {
    color: COLORS.forestGreen,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    color: COLORS.gold,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateText: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  debugHint: {
    color: COLORS.forestGreen,
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: COLORS.gold,
    marginTop: 12,
  },
  initialState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  initialTitle: {
    color: COLORS.gold,
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  initialText: {
    color: '#888',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 22,
  },
  tipsContainer: {
    marginTop: 30,
    alignSelf: 'stretch',
  },
  tipsTitle: {
    color: COLORS.gold,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tipText: {
    color: '#888',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
});