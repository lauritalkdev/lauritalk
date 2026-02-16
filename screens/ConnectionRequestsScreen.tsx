// ConnectionRequestsScreen.tsx (UPDATED - Displays Real User Names)
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
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { chatService } from '../services/chatService';
import { Connection, ConnectionStatus, getDisplayName } from '../src/types/chat';

type ListItem = 
  | { type: 'header'; title: string; count: number }
  | { type: 'pending_received'; data: Connection }
  | { type: 'pending_sent'; data: Connection }
  | { type: 'active'; data: Connection };

export default function ConnectionRequestsScreen({ navigation }: any) {
  const [receivedRequests, setReceivedRequests] = useState<Connection[]>([]);
  const [sentRequests, setSentRequests] = useState<Connection[]>([]);
  const [activeConnections, setActiveConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadConnectionRequests();
      return () => {
        // Cleanup
      };
    }, [])
  );

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = await chatService.getCurrentUser();
      setCurrentUserId(user?.id || null);
    };
    fetchCurrentUser();
  }, []);

  const loadConnectionRequests = async () => {
    try {
      setLoading(true);
      
      // Get current user first
      const user = await chatService.getCurrentUser();
      const userId = user?.id;
      setCurrentUserId(userId || null);
      
      if (!userId) {
        console.error('No current user ID');
        return;
      }
      
      // Load all pending connections (now with profile data joined)
      const pendingResponse = await chatService.getPendingConnections();
      if (pendingResponse.success && pendingResponse.data) {
        const allPending = pendingResponse.data;
        
        // Separate received vs sent requests
        const received = allPending.filter(conn => conn.receiver_id === userId);
        const sent = allPending.filter(conn => conn.requester_id === userId);
        
        setReceivedRequests(received);
        setSentRequests(sent);
      }
      
      // Load active connections (now with profile data joined)
      const activeResponse = await chatService.getActiveConnections();
      if (activeResponse.success && activeResponse.data) {
        setActiveConnections(activeResponse.data);
      }
      
    } catch (error) {
      console.error('Error loading connections:', error);
      Alert.alert('Error', 'Failed to load connection requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadConnectionRequests();
  };

  const handleAcceptRequest = async (connectionId: string) => {
    setProcessingRequest(connectionId);
    try {
      console.log('🟡 [UI] Accepting connection:', connectionId);
      
      const response = await chatService.acceptConnectionRequest(connectionId);
      
      console.log('🟡 [UI] Response:', response);
      
      if (response.success) {
        Alert.alert('Success', 'Connection request accepted!');
        
        // Find and update the connection in state
        const acceptedRequest = receivedRequests.find(req => req.id === connectionId);
        if (acceptedRequest) {
          const updatedRequest: Connection = { 
            ...acceptedRequest, 
            status: 'accepted' as ConnectionStatus,
            updated_at: new Date().toISOString()
          };
          
          // Remove from received requests
          setReceivedRequests(prev => prev.filter(req => req.id !== connectionId));
          // Add to active
          setActiveConnections(prev => [updatedRequest, ...prev]);
        }
      } else {
        Alert.alert('Error', response.error || 'Failed to accept request');
      }
    } catch (error: any) {
      console.error('❌ [UI] Error accepting request:', error);
      Alert.alert('Error', 'Failed to accept connection request');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectRequest = async (connectionId: string) => {
    setProcessingRequest(connectionId);
    try {
      const response = await chatService.rejectConnectionRequest(connectionId);
      
      if (response.success) {
        Alert.alert('Request Rejected', 'Connection request has been rejected');
        // Update UI
        setReceivedRequests(prev => prev.filter(req => req.id !== connectionId));
      } else {
        Alert.alert('Error', response.error || 'Failed to reject request');
      }
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      Alert.alert('Error', 'Failed to reject connection request');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleCancelSentRequest = async (connectionId: string) => {
    try {
      const connection = sentRequests.find(req => req.id === connectionId);
      if (!connection) return;
      
      const receiverName = getDisplayName(connection.receiver, connection.receiver_username);
      
      Alert.alert(
        'Cancel Request',
        `Are you sure you want to cancel the connection request to ${receiverName}?`,
        [
          { text: 'No', style: 'cancel' },
          { 
            text: 'Yes', 
            onPress: async () => {
              setProcessingRequest(connectionId);
              try {
                const response = await chatService.cancelSentConnectionRequest(connectionId);
                if (response.success) {
                  Alert.alert('Cancelled', 'Connection request has been cancelled');
                  setSentRequests(prev => prev.filter(req => req.id !== connectionId));
                } else {
                  Alert.alert('Error', response.error || 'Failed to cancel request');
                }
              } catch (error) {
                console.error('Error cancelling request:', error);
                Alert.alert('Error', 'Failed to cancel connection request');
              } finally {
                setProcessingRequest(null);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error cancelling request:', error);
    }
  };

  // Helper to get the "other user" display name for a connection
  const getOtherUserDisplayName = (connection: Connection): string => {
    if (connection.requester_id === currentUserId) {
      // Current user is the requester, so show receiver's name
      return getDisplayName(connection.receiver, connection.receiver_username);
    } else {
      // Current user is the receiver, so show requester's name
      return getDisplayName(connection.requester, connection.requester_username);
    }
  };

  // Helper to get the "other user" info for navigation
  const getOtherUserInfo = (connection: Connection) => {
    if (connection.requester_id === currentUserId) {
      return {
        id: connection.receiver_id,
        username: connection.receiver?.username || connection.receiver_username || 'unknown',
        fullName: getDisplayName(connection.receiver, connection.receiver_username),
      };
    } else {
      return {
        id: connection.requester_id,
        username: connection.requester?.username || connection.requester_username || 'unknown',
        fullName: getDisplayName(connection.requester, connection.requester_username),
      };
    }
  };

  // Helper to get avatar initial
  const getAvatarInitial = (connection: Connection): string => {
    const name = getOtherUserDisplayName(connection);
    return name.charAt(0).toUpperCase();
  };

  const renderReceivedRequestItem = ({ item }: { item: Connection }) => {
    const senderName = getDisplayName(item.requester, item.requester_username);
    
    return (
      <View style={styles.requestItem}>
        <View style={styles.requestInfo}>
          <Text style={styles.requestText}>
            Connection request from {senderName}
          </Text>
          <Text style={styles.requestDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleAcceptRequest(item.id)}
            disabled={processingRequest === item.id}
          >
            {processingRequest === item.id ? (
              <ActivityIndicator size="small" color={COLORS.black} />
            ) : (
              <Text style={styles.acceptButtonText}>Accept</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleRejectRequest(item.id)}
            disabled={processingRequest === item.id}
          >
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSentRequestItem = ({ item }: { item: Connection }) => {
    const receiverName = getDisplayName(item.receiver, item.receiver_username);
    
    return (
      <View style={styles.requestItem}>
        <View style={styles.requestInfo}>
          <Text style={styles.requestText}>
            Request sent to {receiverName}
          </Text>
          <Text style={styles.requestDate}>
            Sent {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        
        <View style={styles.pendingStatus}>
          <Ionicons name="time-outline" size={16} color={COLORS.gold} />
          <Text style={styles.pendingText}>Pending</Text>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelSentRequest(item.id)}
            disabled={processingRequest === item.id}
          >
            {processingRequest === item.id ? (
              <ActivityIndicator size="small" color="#ff6b6b" />
            ) : (
              <Text style={styles.cancelText}>Cancel</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderActiveConnectionItem = ({ item }: { item: Connection }) => {
    const otherUser = getOtherUserInfo(item);
    const avatarInitial = getAvatarInitial(item);
    
    return (
      <TouchableOpacity
        style={styles.connectionItem}
        onPress={() => {
          // Navigate to chat with this connection
          navigation.navigate('ConversationScreen', {
            otherUserId: otherUser.id,
            otherUsername: otherUser.username,
            otherFullName: otherUser.fullName,
          });
        }}
      >
        <View style={styles.connectionAvatar}>
          <Text style={styles.avatarText}>{avatarInitial}</Text>
        </View>
        <View style={styles.connectionInfo}>
          <Text style={styles.connectionName}>{otherUser.fullName}</Text>
          <Text style={styles.connectionStatus}>Connected</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#888" />
      </TouchableOpacity>
    );
  };

  const renderEmptyState = (type: 'received' | 'sent' | 'active') => (
    <View style={styles.emptyState}>
      <Ionicons 
        name={type === 'received' ? 'person-add-outline' : 
               type === 'sent' ? 'paper-plane-outline' : 
               'chatbubbles-outline'} 
        size={60} 
        color="#888" 
      />
      <Text style={styles.emptyStateTitle}>
        {type === 'received' ? 'No Received Requests' : 
         type === 'sent' ? 'No Sent Requests' : 
         'No Active Connections'}
      </Text>
      <Text style={styles.emptyStateText}>
        {type === 'received' 
          ? 'When someone sends you a connection request, it will appear here'
          : type === 'sent'
          ? 'You haven\'t sent any connection requests yet'
          : 'Accept connection requests to start chatting'}
      </Text>
    </View>
  );

  // Create the list data
  const listData: ListItem[] = [
    { type: 'header', title: 'Requests Received', count: receivedRequests.length },
    ...receivedRequests.map(item => ({ type: 'pending_received' as const, data: item })),
    { type: 'header', title: 'Requests Sent', count: sentRequests.length },
    ...sentRequests.map(item => ({ type: 'pending_sent' as const, data: item })),
    { type: 'header', title: 'Active Connections', count: activeConnections.length },
    ...activeConnections.map(item => ({ type: 'active' as const, data: item })),
  ];

  const renderItem = ({ item }: { item: ListItem }) => {
    switch (item.type) {
      case 'header':
        return (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{item.title}</Text>
            <Text style={styles.sectionCount}>({item.count})</Text>
          </View>
        );
      case 'pending_received':
        return renderReceivedRequestItem({ item: item.data });
      case 'pending_sent':
        return renderSentRequestItem({ item: item.data });
      case 'active':
        return renderActiveConnectionItem({ item: item.data });
      default:
        return null;
    }
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
        <Text style={styles.headerTitle}>Connections</Text>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => navigation.navigate('SearchUsersScreen')}
        >
          <Ionicons name="search" size={24} color={COLORS.gold} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.gold} />
          <Text style={styles.loadingText}>Loading connections...</Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          renderItem={renderItem}
          keyExtractor={(item, index) => 
            item.type === 'header' 
              ? `header-${item.title}-${index}` 
              : `${item.type}-${item.data.id}-${index}`
          }
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.gold]}
              tintColor={COLORS.gold}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              {renderEmptyState('received')}
              {renderEmptyState('sent')}
              {renderEmptyState('active')}
            </View>
          )}
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
  searchButton: {
    padding: 4,
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
  listContent: {
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
  sectionTitle: {
    color: COLORS.gold,
    fontSize: 18,
    fontWeight: '600',
  },
  sectionCount: {
    color: '#888',
    fontSize: 16,
    marginLeft: 8,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.1)',
  },
  requestInfo: {
    flex: 1,
  },
  requestText: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: '500',
  },
  requestDate: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: COLORS.forestGreen,
  },
  acceptButtonText: {
    color: COLORS.black,
    fontWeight: '600',
    fontSize: 14,
  },
  rejectButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  rejectButtonText: {
    color: '#ff6b6b',
    fontWeight: '600',
    fontSize: 14,
  },
  pendingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  pendingText: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '500',
  },
  cancelButton: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cancelText: {
    color: '#ff6b6b',
    fontSize: 12,
  },
  connectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.1)',
  },
  connectionAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: COLORS.black,
    fontSize: 18,
    fontWeight: 'bold',
  },
  connectionInfo: {
    flex: 1,
  },
  connectionName: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: '500',
  },
  connectionStatus: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
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
    lineHeight: 20,
  },
  emptyContainer: {
    paddingTop: 40,
  },
});