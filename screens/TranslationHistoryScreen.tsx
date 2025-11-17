import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS, THEME } from "../constants/theme";
import { supabase } from "../supabase";

interface TranslationHistoryItem {
  id: string;
  source_text: string;
  translated_text: string;
  source_language: string;
  target_language: string;
  created_at: string;
  translation_type: string;
}

// 🟢 ADDED: Reward milestones configuration
const REWARD_MILESTONES = [
  { words: 100000, reward: 10, title: "First Milestone" },
  { words: 200000, reward: 25, title: "Word Master" },
  { words: 800000, reward: 100, title: "Translation Expert" },
  { words: 1600000, reward: 200, title: "Language Legend" },
];

// 🟢 IMPROVED: Advanced word counting with proper validation
const countValidWords = (text: string): number => {
  if (!text || text.trim().length === 0) return 0;
  
  // Remove URLs, emails, and special patterns
  const cleanText = text
    .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '') // Remove emails
    .replace(/[^\w\s']|_/g, ' ') // Replace punctuation with spaces (keep apostrophes for contractions)
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
  
  if (cleanText.length === 0) return 0;
  
  const words = cleanText.split(/\s+/);
  
  // Filter valid words with strict criteria
  const validWords = words.filter(word => {
    // Must have at least 2 characters (adjust based on language requirements)
    if (word.length < 2) return false;
    
    // Must contain at least one letter (not just numbers or symbols)
    if (!/[a-zA-Z]/.test(word)) return false;
    
    // Common invalid patterns to exclude
    const invalidPatterns = [
      /^[0-9]+$/, // Only numbers
      /^[^a-zA-Z0-9]+$/, // Only symbols
      /^[a-zA-Z]{1}$/, // Single letter
      /^(?:a|an|the|and|or|but|in|on|at|to|for|of|with|by)$/i, // Common single-character or very short words (optional)
    ];
    
    // Check if word matches any invalid pattern
    return !invalidPatterns.some(pattern => pattern.test(word));
  });
  
  return validWords.length;
};

export default function TranslationHistoryScreen({ navigation }: any) {
  const [history, setHistory] = useState<TranslationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalWordsTranslated, setTotalWordsTranslated] = useState(0);
  const [currentMilestone, setCurrentMilestone] = useState(0);

  // 🟢 IMPROVED: Better word counting with validation
  const calculateWordCount = useCallback((translations: TranslationHistoryItem[]): number => {
    let totalCount = 0;
    
    translations.forEach(item => {
      // Count only valid words from source text
      const wordCount = countValidWords(item.source_text);
      totalCount += wordCount;
      
      // 🟢 OPTIONAL: Debug logging to see what's being counted
      if (__DEV__ && wordCount > 0) {
        console.log(`Text: "${item.source_text.substring(0, 50)}..." → Words: ${wordCount}`);
      }
    });
    
    return totalCount;
  }, []);

  // 🟢 FIXED: Better milestone calculation
  const getCurrentMilestoneInfo = useCallback(() => {
    const nextMilestone = REWARD_MILESTONES.find(milestone => milestone.words > totalWordsTranslated);
    const currentMilestoneIndex = REWARD_MILESTONES.findIndex(milestone => milestone.words > totalWordsTranslated) - 1;
    
    return {
      nextMilestone: nextMilestone || REWARD_MILESTONES[REWARD_MILESTONES.length - 1],
      currentMilestone: currentMilestoneIndex >= 0 ? REWARD_MILESTONES[currentMilestoneIndex] : null,
      progressPercentage: nextMilestone 
        ? Math.min((totalWordsTranslated / nextMilestone.words) * 100, 100)
        : 100
    };
  }, [totalWordsTranslated]);

  // 🟢 ADDED: Format large numbers with commas
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const fetchTranslationHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Fetch translations from database
      const { data, error } = await supabase
        .from('user_translations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching translation history:', error);
        // Only set empty array on error, don't use sample data
        setHistory([]);
        setTotalWordsTranslated(0);
      } else if (data && data.length > 0) {
        setHistory(data);
        const wordCount = calculateWordCount(data);
        setTotalWordsTranslated(wordCount);
        
        // 🟢 ADDED: Log total count for debugging
        if (__DEV__) {
          console.log(`Total valid words counted: ${wordCount}`);
        }
      } else {
        // No data found - set empty state
        setHistory([]);
        setTotalWordsTranslated(0);
      }
    } catch (error) {
      console.error('Error:', error);
      // On error, maintain previous state instead of resetting
      setHistory([]);
      setTotalWordsTranslated(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTranslationHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTranslationHistory();
  };

  // 🟢 FIXED: Clear history with proper state management
  const clearHistory = () => {
    Alert.alert(
      "Clear History",
      "Are you sure you want to clear all translation history?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          style: "destructive",
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                // Actually delete from database
                const { error } = await supabase
                  .from('user_translations')
                  .delete()
                  .eq('user_id', user.id);
                
                if (error) {
                  console.error('Error clearing history:', error);
                  Alert.alert("Error", "Failed to clear history");
                  return;
                }
              }
              
              // Update UI state only after successful deletion
              setHistory([]);
              setTotalWordsTranslated(0);
              Alert.alert("Success", "Translation history cleared");
            } catch (error) {
              console.error('Error clearing history:', error);
              Alert.alert("Error", "Failed to clear history");
            }
          }
        }
      ]
    );
  };

  const getLanguageName = (code: string) => {
    const languages: { [key: string]: string } = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'pt': 'Portuguese',
      'bkw': 'Bakweri',
      'bam': 'Bamileke',
      'baf': 'Bafut',
    };
    return languages[code] || code;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // 🟢 ADDED: Show word count per item for transparency
  const getWordCountForItem = (item: TranslationHistoryItem) => {
    return countValidWords(item.source_text);
  };

  // 🟢 FIXED: Render progress section with proper typing
  const renderProgressSection = () => {
    const { nextMilestone, currentMilestone: currentMilestoneInfo, progressPercentage } = getCurrentMilestoneInfo();
    
    return (
      <View style={styles.progressContainer}>
        <Text style={styles.progressTitle}>Translation Rewards Program</Text>
        
        {/* 🟢 ADDED: Word counting info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.gold} />
          <Text style={styles.infoText}>
            Only valid words (2+ letters) are counted toward rewards
          </Text>
        </View>
        
        {/* Current Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{formatNumber(totalWordsTranslated)}</Text>
            <Text style={styles.statLabel}>Valid Words</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>${currentMilestoneInfo ? currentMilestoneInfo.reward : 0}</Text>
            <Text style={styles.statLabel}>Earned</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>${nextMilestone.reward}</Text>
            <Text style={styles.statLabel}>Next Reward</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>
              Next: {nextMilestone.title} - ${nextMilestone.reward}
            </Text>
            <Text style={styles.progressCount}>
              {formatNumber(totalWordsTranslated)} / {formatNumber(nextMilestone.words)} words
            </Text>
          </View>
          
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${Math.min(progressPercentage, 100)}%` }
              ]} 
            />
          </View>
          
          <Text style={styles.progressPercentage}>
            {Math.round(progressPercentage)}% complete
          </Text>
        </View>

        {/* Milestones Overview */}
        <View style={styles.milestonesContainer}>
          <Text style={styles.milestonesTitle}>Reward Milestones</Text>
          {REWARD_MILESTONES.map((milestone, index) => {
            const isCompleted = totalWordsTranslated >= milestone.words;
            const isCurrent = totalWordsTranslated < milestone.words && 
              (index === 0 || totalWordsTranslated >= REWARD_MILESTONES[index - 1].words);
            
            return (
              <View key={index} style={[
                styles.milestoneItem,
                isCompleted && styles.milestoneCompleted,
                isCurrent && styles.milestoneCurrent
              ]}>
                <View style={styles.milestoneIcon}>
                  {isCompleted ? (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.forestGreen} />
                  ) : isCurrent ? (
                    <Ionicons name="ellipse" size={20} color={COLORS.gold} />
                  ) : (
                    <Ionicons name="ellipse-outline" size={20} color="rgba(212, 175, 55, 0.3)" />
                  )}
                </View>
                <View style={styles.milestoneInfo}>
                  <Text style={[
                    styles.milestoneText,
                    isCompleted && styles.milestoneTextCompleted,
                    isCurrent && styles.milestoneTextCurrent
                  ]}>
                    {milestone.title}
                  </Text>
                  <Text style={styles.milestoneReward}>
                    {formatNumber(milestone.words)} valid words → ${milestone.reward}
                  </Text>
                </View>
                {isCompleted && (
                  <View style={styles.rewardBadge}>
                    <Text style={styles.rewardBadgeText}>${milestone.reward}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderHistoryItem = ({ item }: { item: TranslationHistoryItem }) => {
    const wordCount = getWordCountForItem(item);
    
    return (
      <View style={styles.historyItem}>
        <View style={styles.translationHeader}>
          <View style={styles.languageBadge}>
            <Text style={styles.languageText}>
              {getLanguageName(item.source_language)} → {getLanguageName(item.target_language)}
            </Text>
          </View>
          <View style={styles.wordCountBadge}>
            <Text style={styles.wordCountText}>{wordCount} words</Text>
          </View>
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.sourceText} numberOfLines={2}>
            {item.source_text}
          </Text>
          <Text style={styles.translatedText} numberOfLines={2}>
            {item.translated_text}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => Alert.alert("Original Text", item.source_text)}
          >
            <Ionicons name="eye-outline" size={16} color={COLORS.gold} />
            <Text style={styles.actionText}>View Original</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => Alert.alert("Translated Text", item.translated_text)}
          >
            <Ionicons name="eye-outline" size={16} color={COLORS.gold} />
            <Text style={styles.actionText}>View Translation</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.gold} />
          </TouchableOpacity>
          <Text style={styles.title}>Translation History</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.gold} />
          <Text style={styles.loadingText}>Loading your translation history...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gold} />
        </TouchableOpacity>
        <Text style={styles.title}>Translation History</Text>
        <TouchableOpacity onPress={clearHistory} style={styles.clearButton}>
          <Ionicons name="trash-outline" size={20} color="#FF4444" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={history}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderProgressSection}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={64} color={COLORS.gold} />
            <Text style={styles.emptyTitle}>No Translation History</Text>
            <Text style={styles.emptyText}>
              Your translation history will appear here as you use Lauritalk.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212, 175, 55, 0.3)",
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.gold,
  },
  clearButton: {
    padding: 5,
  },
  placeholder: {
    width: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: COLORS.gold,
    marginTop: 10,
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  // 🟢 ADDED: Progress section styles
  progressContainer: {
    backgroundColor: "rgba(212, 175, 55, 0.05)",
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.gold,
    textAlign: "center",
    marginBottom: 10,
  },
  // 🟢 ADDED: Info box styles
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
  },
  infoText: {
    color: COLORS.gold,
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.gold,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.forestGreen,
    textAlign: "center",
  },
  progressSection: {
    marginBottom: 25,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gold,
    flex: 1,
  },
  progressCount: {
    fontSize: 12,
    color: COLORS.forestGreen,
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(212, 175, 55, 0.2)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.gold,
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 12,
    color: COLORS.forestGreen,
    textAlign: "center",
  },
  milestonesContainer: {
    marginTop: 10,
  },
  milestonesTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.gold,
    marginBottom: 12,
    textAlign: "center",
  },
  milestoneItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212, 175, 55, 0.1)",
  },
  milestoneCompleted: {
    opacity: 0.7,
  },
  milestoneCurrent: {
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderRadius: 8,
    marginHorizontal: -8,
    paddingHorizontal: 8,
  },
  milestoneIcon: {
    width: 24,
    marginRight: 12,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneText: {
    fontSize: 14,
    color: "rgba(212, 175, 55, 0.7)",
    fontWeight: "500",
  },
  milestoneTextCompleted: {
    color: COLORS.forestGreen,
    textDecorationLine: "line-through",
  },
  milestoneTextCurrent: {
    color: COLORS.gold,
    fontWeight: "bold",
  },
  milestoneReward: {
    fontSize: 12,
    color: COLORS.forestGreen,
    marginTop: 2,
  },
  rewardBadge: {
    backgroundColor: COLORS.forestGreen,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rewardBadgeText: {
    fontSize: 10,
    color: "#000",
    fontWeight: "bold",
  },
  // Existing history item styles
  historyItem: {
    backgroundColor: "rgba(212, 175, 55, 0.05)",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
  },
  translationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  languageBadge: {
    backgroundColor: "rgba(46, 139, 87, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.forestGreen,
  },
  languageText: {
    color: COLORS.forestGreen,
    fontSize: 12,
    fontWeight: "600",
  },
  // 🟢 ADDED: Word count badge
  wordCountBadge: {
    backgroundColor: "rgba(212, 175, 55, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.5)",
  },
  wordCountText: {
    color: COLORS.gold,
    fontSize: 10,
    fontWeight: "600",
  },
  dateText: {
    color: "rgba(212, 175, 55, 0.7)",
    fontSize: 11,
  },
  textContainer: {
    marginBottom: 12,
  },
  sourceText: {
    color: THEME.text,
    fontSize: 14,
    marginBottom: 4,
    fontWeight: "500",
  },
  translatedText: {
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  actionText: {
    color: COLORS.gold,
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.gold,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: THEME.text,
    textAlign: "center",
    lineHeight: 22,
  },
});