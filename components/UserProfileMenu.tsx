// components/UserProfileMenu.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../constants/theme";
import { supabase } from "../supabase";

const { height } = Dimensions.get("window");

interface UserProfileMenuProps {
  visible: boolean;
  email: string;
  onClose: () => void;
  onLogout: () => void;
  onDelete: () => void;
  navigation: any;
  isLoggedIn: boolean;
}

interface ReferralStats {
  freemium: number;
  premium: number;
  total: number;
  earnings: number;
  referralCode: string;
}

// 🟢 FIXED: Use valid Ionicons names
const REFERRAL_MILESTONES = [
  { 
    target: 50, 
    reward: 15, 
    title: "Recruiter",
    description: "$15 Cash Reward",
    icon: "person" as const
  },
  { 
    target: 200, 
    reward: 50, 
    title: "Beginner",
    description: "$50 Cash Reward",
    icon: "star" as const
  },
  { 
    target: 1000, 
    reward: 300, 
    title: "Professional",
    description: "$300 Cash Reward",
    icon: "ribbon" as const
  },
  { 
    target: 10000, 
    reward: 3000, 
    title: "Ambassador",
    description: "$3,000 Cash or Fully Funded Trip",
    icon: "trophy" as const
  },
  { 
    target: 50000, 
    reward: 15000, 
    title: "Governor",
    description: "$15,000 + Luxury Watch",
    icon: "diamond" as const
  }
];

export default function UserProfileMenu({
  visible,
  email,
  onClose,
  onLogout,
  onDelete,
  navigation,
  isLoggedIn,
}: UserProfileMenuProps) {
  const [walletBalance] = useState("$0.00");
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    freemium: 0,
    premium: 0,
    total: 0,
    earnings: 0,
    referralCode: ""
  });
  const [loading, setLoading] = useState(true);

  // 🟢 ADDED: Copy referral code function
  const copyReferralCode = async () => {
    Alert.alert(
      "Referral Code",
      `Your referral code: ${referralStats.referralCode}\n\nCopy this code to share with friends!`,
      [
        {
          text: "OK",
          style: "default"
        }
      ]
    );
  };

  // 🟢 ADDED: Get current level and next milestone
  const getCurrentLevelInfo = () => {
    const completedMilestones = REFERRAL_MILESTONES.filter(milestone => referralStats.premium >= milestone.target);
    const currentLevel = completedMilestones.length > 0 
      ? completedMilestones[completedMilestones.length - 1] 
      : { ...REFERRAL_MILESTONES[0], target: 0 }; // Base level before first milestone
    
    const nextMilestone = REFERRAL_MILESTONES.find(milestone => referralStats.premium < milestone.target);
    
    return {
      currentLevel,
      nextMilestone: nextMilestone || REFERRAL_MILESTONES[REFERRAL_MILESTONES.length - 1],
      progressPercentage: nextMilestone 
        ? ((referralStats.premium - currentLevel.target) / (nextMilestone.target - currentLevel.target)) * 100 
        : 100,
      remainingForNext: nextMilestone ? nextMilestone.target - referralStats.premium : 0,
      levelIndex: completedMilestones.length
    };
  };

  // 🟢 ADDED: Format large numbers
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // 🟢 UPDATED: Fetch user referral data with proper referral counting
  useEffect(() => {
    if (visible && isLoggedIn) {
      fetchUserReferralData();
    }
  }, [visible, isLoggedIn]);

  const fetchUserReferralData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 🟢 UPDATED: Get referral code from user metadata
      let userReferralCode = user.user_metadata?.referral_code;
      
      // If no referral code exists, create one using the same method as RegisterScreen
      if (!userReferralCode) {
        userReferralCode = generateReferralCode();
        
        // Update user metadata with the new referral code
        try {
          const { error: updateError } = await supabase.auth.updateUser({
            data: { referral_code: userReferralCode }
          });
          
          if (updateError) {
            console.log('Failed to update user referral code:', updateError);
          }
        } catch (updateError) {
          console.log('Error updating user referral code:', updateError);
        }
      }

      // 🟢 UPDATED: Get actual referral counts from user_referrals table
      try {
        const { data: referrals, error } = await supabase
          .from('user_referrals')
          .select('*')
          .eq('referrer_id', user.id);

        if (error) {
          console.log('Error fetching referrals:', error);
          // Use default values if error
          setReferralStats({
            freemium: 0,
            premium: 0,
            total: 0,
            earnings: 0,
            referralCode: userReferralCode
          });
          return;
        }

        // 🟢 UPDATED: Calculate stats from real referral data
        const freemiumCount = referrals?.filter(ref => ref.user_type === 'freemium').length || 0;
        const premiumCount = referrals?.filter(ref => ref.user_type === 'premium').length || 0;
        const totalCount = freemiumCount + premiumCount;
        
        // Calculate earnings based on completed milestones
        let totalEarnings = 0;
        REFERRAL_MILESTONES.forEach(milestone => {
          if (premiumCount >= milestone.target) {
            totalEarnings += milestone.reward;
          }
        });

        console.log('Referral stats:', { freemiumCount, premiumCount, totalCount, userReferralCode });

        setReferralStats({
          freemium: freemiumCount,
          premium: premiumCount,
          total: totalCount,
          earnings: totalEarnings,
          referralCode: userReferralCode
        });

      } catch (tableError) {
        console.log('Error fetching referral data:', tableError);
        setReferralStats({
          freemium: 0,
          premium: 0,
          total: 0,
          earnings: 0,
          referralCode: userReferralCode
        });
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
      // Use default values on any error
      setReferralStats({
        freemium: 0,
        premium: 0,
        total: 0,
        earnings: 0,
        referralCode: "LOADING..."
      });
    } finally {
      setLoading(false);
    }
  };

  // 🟢 ADDED: Use same referral code generation as RegisterScreen
  const generateReferralCode = (): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  };

  const displayEmail = isLoggedIn ? email : "Not logged in";

  // 🟢 MODIFIED: Navigation to Translation History Screen
  const handleTranslationHistory = () => {
    onClose(); // Close the menu first
    navigation.navigate("TranslationHistory"); // Navigate to the Translation History screen
  };

  const handleShareWithFriends = async () => {
    try {
      const shareLink = `https://lauritalk.com/invite/${referralStats.referralCode}`;
      const shareMessage = `Join me on Lauritalk - the ultimate translation app! Use my referral code: ${referralStats.referralCode} or click: ${shareLink}\n\nGet 10% off your first premium subscription!`;
      
      await Share.share({
        message: shareMessage,
        title: 'Join Lauritalk - Get 10% Off!',
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share referral link");
    }
  };

  const handleWalletPress = () => {
    Alert.alert(
      "Wallet Balance",
      `Current Balance: ${walletBalance}`,
      [
        {
          text: "Withdraw Funds",
          onPress: handleWithdraw,
        },
        {
          text: "Close",
          style: "cancel",
        },
      ]
    );
  };

  const handleWithdraw = () => {
    if (parseFloat(walletBalance.replace('$', '')) <= 0) {
      Alert.alert("Insufficient Funds", "Your wallet balance is $0.00. You need funds to withdraw.");
      return;
    }

    Alert.alert(
      "Withdraw Funds",
      `Select withdrawal method for ${walletBalance}:`,
      [
        {
          text: "PayPal",
          onPress: () => {
            Alert.alert("PayPal Withdrawal", `Processing ${walletBalance} withdrawal to PayPal...\n\nFunds will arrive within 3-5 business days.`);
          },
        },
        {
          text: "Crypto",
          onPress: () => {
            Alert.alert("Crypto Withdrawal", `Processing ${walletBalance} withdrawal to cryptocurrency wallet...\n\nPlease ensure you provide a valid wallet address.`);
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const handleReferralCountPress = () => {
    const { currentLevel, nextMilestone, remainingForNext } = getCurrentLevelInfo();
    const completedMilestones = REFERRAL_MILESTONES.filter(milestone => referralStats.premium >= milestone.target);
    
    let message = `Your referral statistics:\n\n🏆 Current Level: ${currentLevel.title}\n📊 Total Referrals: ${referralStats.total}\n🔗 Your Referral Code: ${referralStats.referralCode}\n\n📈 Breakdown:\n• Freemium Users: ${referralStats.freemium}\n• Premium Users: ${referralStats.premium}\n\n💰 Total Earnings: $${referralStats.earnings}\n\n`;
    
    if (completedMilestones.length > 0) {
      message += "✅ Completed Milestones:\n";
      completedMilestones.forEach(milestone => {
        message += `• ${milestone.title}: $${milestone.reward}\n`;
      });
      message += "\n";
    }
    
    message += `🎯 Next Goal: ${nextMilestone.title}\n📈 Progress: ${formatNumber(referralStats.premium)}/${formatNumber(nextMilestone.target)} premium users\n💰 Next Reward: ${nextMilestone.description}\n`;
    
    // 🟢 ADDED: Show progress to all ranks
    message += `\n📊 Progress to All Ranks:\n`;
    REFERRAL_MILESTONES.forEach((milestone, index) => {
      const progress = (referralStats.premium / milestone.target) * 100;
      const isCompleted = referralStats.premium >= milestone.target;
      const isCurrent = index === completedMilestones.length;
      
      if (isCompleted) {
        message += `✅ ${milestone.title}: COMPLETED (${formatNumber(referralStats.premium)}/${formatNumber(milestone.target)})\n`;
      } else if (isCurrent) {
        message += `🎯 ${milestone.title}: ${Math.min(100, Math.round(progress))}% (${formatNumber(referralStats.premium)}/${formatNumber(milestone.target)})\n`;
      } else {
        message += `⏳ ${milestone.title}: ${Math.min(100, Math.round(progress))}% (${formatNumber(referralStats.premium)}/${formatNumber(milestone.target)})\n`;
      }
    });
    
    if (remainingForNext > 0) {
      message += `\n📊 Need ${remainingForNext} more premium users for next level!`;
    }

    Alert.alert(
      "🎯 Referral Program - All Ranks Progress",
      message,
      [
        {
          text: "Share Referral Link",
          onPress: handleShareWithFriends,
        },
        {
          text: "Close",
          style: "cancel",
        },
      ]
    );
  };

  const handleSettings = () => {
    onClose();
    navigation.navigate("Settings");
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "⚠️ Delete Account",
      "This action will permanently delete your account and all associated data.\n\n🚨 WARNING:\n• All your data will be marked for deletion\n• Account deletion takes up to 7 days to complete\n• This action cannot be undone\n• You will lose all translation history\n• Any wallet balance will be forfeited\n\nAre you absolutely sure you want to proceed?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes, Delete My Account",
          style: "destructive",
          onPress: onDelete,
        },
      ]
    );
  };

  // 🟢 FIXED: Render current level with progress bar component
  const renderCurrentLevel = () => {
    const { currentLevel, nextMilestone, progressPercentage, remainingForNext } = getCurrentLevelInfo();
    
    return (
      <View style={styles.levelContainer}>
        <View style={styles.levelHeader}>
          {/* 🟢 FIXED: Using valid Ionicons name */}
          <Ionicons name={currentLevel.icon} size={24} color={COLORS.gold} />
          <View style={styles.levelTextContainer}>
            <Text style={styles.currentLevelText}>Current Level: ${currentLevel.title}</Text>
            <Text style={styles.levelDescription}>{currentLevel.description}</Text>
          </View>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>Progress to {nextMilestone.title}</Text>
            <Text style={styles.progressPercentage}>{Math.round(progressPercentage)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${Math.min(progressPercentage, 100)}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressCount}>
            {formatNumber(referralStats.premium)}/{formatNumber(nextMilestone.target)} premium users
            {remainingForNext > 0 && ` • ${remainingForNext} more needed`}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        {/* 🟢 ADDED: ScrollView for web compatibility */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.menuContainer}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>User Profile</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS.gold} />
              </TouchableOpacity>
            </View>

            {/* User Email */}
            <View style={styles.emailContainer}>
              <Ionicons name="person-circle-outline" size={24} color={COLORS.gold} />
              <View style={styles.emailTextContainer}>
                <Text style={styles.emailLabel}>
                  {isLoggedIn ? "Logged in as" : "Guest User"}
                </Text>
                <Text style={styles.emailText}>{displayEmail}</Text>
              </View>
            </View>

            {/* Translation History */}
            <TouchableOpacity style={styles.menuItem} onPress={handleTranslationHistory}>
              <View style={styles.menuItemContent}>
                <Ionicons name="time-outline" size={24} color={COLORS.gold} />
                <Text style={styles.menuItemText}>Translation History</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gold} />
            </TouchableOpacity>

            {/* 🟢 CORRECTED: Referral Count with Statistics and Progress Bar */}
            <TouchableOpacity style={styles.menuItem} onPress={handleReferralCountPress}>
              <View style={styles.menuItemContent}>
                <Ionicons name="trophy-outline" size={24} color={COLORS.gold} />
                <View style={styles.referralContainer}>
                  <Text style={styles.menuItemText}>Referral Program</Text>
                  
                  {/* 🟢 ADDED: Referral Code Display with Copy Button */}
                  <View style={styles.referralCodeContainer}>
                    <Text style={styles.referralCodeLabel}>Your Referral Code:</Text>
                    <View style={styles.referralCodeRow}>
                      <Text style={styles.referralCodeText}>{referralStats.referralCode}</Text>
                      <TouchableOpacity 
                        style={styles.copyButton}
                        onPress={copyReferralCode}
                      >
                        <Ionicons name="copy-outline" size={16} color={COLORS.gold} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.referralStats}>
                    <View style={styles.referralMainStats}>
                      <View style={styles.statItem}>
                        <Ionicons name="people" size={16} color={COLORS.forestGreen} />
                        <Text style={styles.statNumber}>{referralStats.total}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.statItem}>
                        <Ionicons name="star" size={16} color={COLORS.gold} />
                        <Text style={styles.statNumber}>{referralStats.premium}</Text>
                        <Text style={styles.statLabel}>Premium</Text>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.statItem}>
                        <Ionicons name="diamond" size={16} color="#FFD700" />
                        <Text style={styles.statNumber}>${referralStats.earnings}</Text>
                        <Text style={styles.statLabel}>Earned</Text>
                      </View>
                    </View>
                    
                    {/* 🟢 CORRECTED: Progress bar displayed below statistics */}
                    {referralStats.total > 0 && (
                      <View style={styles.referralProgressContainer}>
                        <View style={styles.referralProgressBar}>
                          <View 
                            style={[
                              styles.referralProgressFill,
                              { 
                                width: `${Math.min(
                                  (referralStats.premium / (getCurrentLevelInfo().nextMilestone.target || 1)) * 100, 
                                  100
                                )}%` 
                              }
                            ]} 
                          />
                        </View>
                        <Text style={styles.referralProgressText}>
                          Progress to next level: {Math.round(
                            (referralStats.premium / (getCurrentLevelInfo().nextMilestone.target || 1)) * 100
                          )}%
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gold} />
            </TouchableOpacity>

            {/* 🟢 ADDED: Current Level Display immediately below Referral Program */}
            {isLoggedIn && renderCurrentLevel()}

            {/* Wallet */}
            <TouchableOpacity style={styles.menuItem} onPress={handleWalletPress}>
              <View style={styles.menuItemContent}>
                <Ionicons name="wallet-outline" size={24} color={COLORS.gold} />
                <View style={styles.walletContainer}>
                  <Text style={styles.menuItemText}>Wallet</Text>
                  <Text style={styles.balanceAmount}>{walletBalance}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gold} />
            </TouchableOpacity>

            {/* Share with Friends */}
            <TouchableOpacity style={styles.menuItem} onPress={handleShareWithFriends}>
              <View style={styles.menuItemContent}>
                <Ionicons name="share-social-outline" size={24} color={COLORS.gold} />
                <Text style={styles.menuItemText}>Share with Friends</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gold} />
            </TouchableOpacity>

            {/* Settings */}
            <TouchableOpacity style={styles.menuItem} onPress={handleSettings}>
              <View style={styles.menuItemContent}>
                <Ionicons name="settings-outline" size={24} color={COLORS.gold} />
                <Text style={styles.menuItemText}>Settings</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gold} />
            </TouchableOpacity>

            {/* Log Out */}
            <TouchableOpacity style={styles.menuItem} onPress={onLogout}>
              <View style={styles.menuItemContent}>
                <Ionicons name="log-out-outline" size={24} color={COLORS.gold} />
                <Text style={styles.menuItemText}>Log Out</Text>
              </View>
            </TouchableOpacity>

            {/* Delete Account */}
            <TouchableOpacity style={[styles.menuItem, styles.deleteItem]} onPress={handleDeleteAccount}>
              <View style={styles.menuItemContent}>
                <Ionicons name="trash-outline" size={24} color="#FF4444" />
                <Text style={[styles.menuItemText, styles.deleteText]}>Delete Account</Text>
              </View>
            </TouchableOpacity>

            {/* App Version */}
            <View style={styles.versionContainer}>
              <Text style={styles.versionText}>Lauritalk App Version 25.02</Text>
              <Text style={styles.copyrightText}>© 2025 Lauritalk. All rights reserved.</Text>
            </View>
          </View>
        </ScrollView>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
  },
  // 🟢 ADDED: ScrollView styles for web compatibility
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  menuContainer: {
    backgroundColor: COLORS.black,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.gold,
    borderTopWidth: 0,
    minHeight: height * 0.85, // 🟢 CHANGED: from maxHeight to minHeight for better web scrolling
    shadowColor: COLORS.gold,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gold,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.gold,
  },
  closeButton: {
    padding: 5,
  },
  // 🟢 ADDED: Referral Code Styles
  referralCodeContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  referralCodeLabel: {
    color: COLORS.forestGreen,
    fontSize: 12,
    marginBottom: 4,
  },
  referralCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  referralCodeText: {
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  copyButton: {
    padding: 4,
  },
  // 🟢 ADDED: Current Level Styles
  levelContainer: {
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  levelHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  levelTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  currentLevelText: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: "bold",
  },
  levelDescription: {
    color: COLORS.forestGreen,
    fontSize: 12,
    marginTop: 2,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  progressLabel: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: "500",
  },
  progressPercentage: {
    color: COLORS.forestGreen,
    fontSize: 12,
    fontWeight: "bold",
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.gold,
    borderRadius: 4,
  },
  progressCount: {
    color: COLORS.gold,
    fontSize: 10,
    marginTop: 6,
    textAlign: 'center',
  },
  emailContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  emailTextContainer: {
    marginLeft: 10,
  },
  emailLabel: {
    color: COLORS.gold,
    fontSize: 12,
    opacity: 0.8,
  },
  emailText: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: "600",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212, 175, 55, 0.2)",
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuItemText: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 15,
  },
  referralContainer: {
    marginLeft: 15,
    flex: 1,
  },
  referralStats: {
    marginTop: 8,
  },
  referralMainStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statLabel: {
    color: COLORS.forestGreen,
    fontSize: 10,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
  },
  // 🟢 ADDED: Referral progress bar styles
  referralProgressContainer: {
    marginTop: 8,
  },
  referralProgressBar: {
    height: 6,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  referralProgressFill: {
    height: '100%',
    backgroundColor: COLORS.forestGreen,
    borderRadius: 3,
  },
  referralProgressText: {
    color: COLORS.forestGreen,
    fontSize: 9,
    textAlign: 'center',
  },
  walletContainer: {
    marginLeft: 15,
    flex: 1,
  },
  balanceAmount: {
    color: COLORS.forestGreen,
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 2,
  },
  deleteItem: {
    borderBottomWidth: 0,
    marginTop: 5,
    marginBottom: 20,
  },
  deleteText: {
    color: "#FF4444",
  },
  versionContainer: {
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: "rgba(212, 175, 55, 0.05)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
    marginTop: 10,
  },
  versionText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gold,
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 10,
    color: "rgba(212, 175, 55, 0.7)",
    textAlign: "center",
  },
});