// hooks/useWordLimits.ts - UPDATED VERSION
import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import wordLimitService, { LimitStatus, WordCountInfo } from '../services/wordLimitService';

export const useWordLimits = () => {
  const [limitStatus, setLimitStatus] = useState<LimitStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'daily' | 'monthly'>('daily');
  const [remainingWords, setRemainingWords] = useState(0);
  const [usedWords, setUsedWords] = useState(0);
  const [limitWords, setLimitWords] = useState(0);

  // Load limit status on mount
  useEffect(() => {
    loadLimitStatus();
  }, []);

  const loadLimitStatus = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading limit status...');
      const status = await wordLimitService.getLimitStatus();
      setLimitStatus(status);
      console.log('✅ Limit status loaded:', status);
    } catch (error) {
      console.error('❌ Error loading limit status:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAndUpdateWordCount = async (text: string) => {
    console.log('🔍 Starting checkAndUpdateWordCount for text:', text.substring(0, 50) + '...');
    
    // Use the service method to calculate word count
    const wordCount = wordLimitService.calculateWordCount(text);
    console.log(`📝 Calculated word count: ${wordCount} words`);
    
    if (wordCount === 0) {
      console.log('⚠️ Word count is 0, returning true');
      return { allowed: true, result: null };
    }

    // Debug current status first
    await wordLimitService.debugWordCounts();

    const { allowed, limitType, result } = await wordLimitService.canTranslate(wordCount);
    
    console.log(`✅ canTranslate result: allowed=${allowed}, limitType=${limitType}`);
    
    if (!allowed && limitType && result) {
      // Show modal with limit details
      console.log(`🚫 Translation not allowed: ${limitType} limit exceeded`);
      console.log('Result:', result);
      
      setModalType(limitType);
      
      if (limitType === 'daily') {
        setRemainingWords(result.remaining_daily_words);
        setUsedWords(result.current_daily_words);
        setLimitWords(200); // daily limit
      } else {
        setRemainingWords(result.remaining_monthly_words);
        setUsedWords(result.current_monthly_words);
        setLimitWords(1200); // monthly limit
      }
      
      setModalVisible(true);
      return { allowed: false, result };
    }

    // If allowed, refresh status
    if (allowed) {
      console.log('✅ Translation allowed, refreshing status...');
      await loadLimitStatus();
    }
    
    return { allowed, result };
  };

  const forceUpdateWordCount = async (wordCount: number) => {
    console.log(`🔄 Force updating word count: ${wordCount}`);
    const result = await wordLimitService.updateWordCount(wordCount);
    await loadLimitStatus();
    return result;
  };

  const upgradeToPremium = async (plan: 'monthly' | '6months' | 'yearly') => {
    console.log(`🔼 Upgrading to premium: ${plan}`);
    const success = await wordLimitService.upgradeToPremium(plan);
    if (success) {
      await loadLimitStatus();
      setModalVisible(false);
    }
    return success;
  };

  const closeModal = () => {
    console.log('❌ Closing limit modal');
    setModalVisible(false);
  };

  const openModal = (type: 'daily' | 'monthly', result?: any) => {
    console.log(`📱 Opening ${type} limit modal`);
    setModalType(type);
    if (result) {
      if (type === 'daily') {
        setRemainingWords(result.remaining_daily_words);
        setUsedWords(result.current_daily_words);
        setLimitWords(200);
      } else {
        setRemainingWords(result.remaining_monthly_words);
        setUsedWords(result.current_monthly_words);
        setLimitWords(1200);
      }
    }
    setModalVisible(true);
  };

  // Add a debug function
  const debugCurrentStatus = () => {
    console.log('🔍 Current hook state:');
    console.log('  limitStatus:', limitStatus);
    console.log('  modalVisible:', modalVisible);
    console.log('  modalType:', modalType);
    console.log('  remainingWords:', remainingWords);
    console.log('  usedWords:', usedWords);
    console.log('  limitWords:', limitWords);
  };

  // Add a function to manually trigger limit check
  const manuallyCheckLimit = async () => {
    console.log('🔍 Manually checking limits...');
    await loadLimitStatus();
    await wordLimitService.debugWordCounts();
  };

  // Test the service methods on mount
  useEffect(() => {
    const testServiceMethods = async () => {
      console.log('🧪 Testing service methods...');
      
      // Test calculateWordCount
      const testText = "Hello world this is a test";
      const wordCount = wordLimitService.calculateWordCount(testText);
      console.log(`Test word count: "${testText}" = ${wordCount} words`);
      
      // Test getWordCountInfo
      const info = wordLimitService.getWordCountInfo(testText);
      console.log('Word count info:', info);
      
      console.log('✅ Service methods tested successfully');
    };
    
    testServiceMethods();
  }, []);

  return {
    limitStatus,
    loading,
    modalVisible,
    modalType,
    remainingWords,
    usedWords,
    limitWords,
    checkAndUpdateWordCount,
    forceUpdateWordCount,
    upgradeToPremium: wordLimitService.upgradeToPremium.bind(wordLimitService),
    loadLimitStatus,
    closeModal,
    openModal,
    calculateWordCount: wordLimitService.calculateWordCount.bind(wordLimitService),
    getWordCountInfo: wordLimitService.getWordCountInfo.bind(wordLimitService),
    debugCurrentStatus,
    manuallyCheckLimit,
    resetWordCountsForTesting: wordLimitService.resetWordCountsForTesting.bind(wordLimitService)
  };
};