// components/LimitExceededModal.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { COLORS } from '../constants/theme';

interface LimitExceededModalProps {
  visible: boolean;
  type: 'daily' | 'monthly';
  remainingWords: number;
  usedWords: number;
  limitWords: number;
  onClose: () => void;
  onUpgrade: () => void;
}

export default function LimitExceededModal({
  visible,
  type,
  remainingWords,
  usedWords,
  limitWords,
  onClose,
  onUpgrade
}: LimitExceededModalProps) {
  const isDaily = type === 'daily';
  const title = isDaily ? 'Daily Limit Reached' : 'Monthly Limit Reached';
  
  const getMessage = () => {
    if (isDaily) {
      return `You've used ${usedWords} of ${limitWords} daily words. Please wait 24 hours from your first translation today to continue using the app for FREE, or click on the Learn More button below to know how to continue having access to the app.`;
    } else {
      return `You've used ${usedWords} of ${limitWords} monthly words. Please wait 30 days from your first translation this month to continue using the app for FREE, or click on the Learn More button below to know how to continue having access to the app.`;
    }
  };

  const handleLearnMore = () => {
    Linking.openURL('https://www.lauritalk.com');
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons 
              name="warning" 
              size={32} 
              color={COLORS.gold} 
            />
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.wordCount}>
              {usedWords} / {limitWords} words used
            </Text>
          </View>

          {/* Message */}
          <Text style={styles.message}>{getMessage()}</Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${Math.min((usedWords / limitWords) * 100, 100)}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {remainingWords} words remaining
            </Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {/* Option 1: Wait */}
            <TouchableOpacity style={styles.optionButton} onPress={onClose}>
              <Ionicons name="time-outline" size={20} color={COLORS.gold} />
              <Text style={styles.optionText}>
                Wait {isDaily ? '24 hours' : '30 days'} to continue
              </Text>
            </TouchableOpacity>

            {/* Option 2: Learn More (replaced Upgrade button) */}
            <TouchableOpacity 
              style={[styles.optionButton, styles.learnMoreButton]} 
              onPress={handleLearnMore}
            >
              <Ionicons name="information-circle-outline" size={20} color={COLORS.white} />
              <Text style={[styles.optionText, styles.learnMoreText]}>
                Learn More
              </Text>
            </TouchableOpacity>
          </View>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: COLORS.black,
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: COLORS.gold,
    width: '100%',
    maxWidth: 400,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.gold,
    marginTop: 12,
    textAlign: 'center',
  },
  wordCount: {
    fontSize: 16,
    color: COLORS.forestGreen,
    marginTop: 8,
    fontWeight: '600',
  },
  message: {
    fontSize: 16,
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.gold,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.forestGreen,
    textAlign: 'center',
  },
  optionsContainer: {
    marginBottom: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  learnMoreButton: {
    backgroundColor: COLORS.forestGreen,
    borderColor: COLORS.forestGreen,
  },
  optionText: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  learnMoreText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: '600',
  },
});