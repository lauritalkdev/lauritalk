import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
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

  // 🟢 MODIFIED: Fetch user referral data only for internal use (no longer displayed)
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

      // Get referral code from user metadata
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

      // Get actual referral counts from user_referrals table
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

        // Calculate stats from real referral data
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

  // Use same referral code generation as RegisterScreen
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

            {/* 🟢 REMOVED: Share with Friends button */}
            {/* 🟢 REMOVED: Referral Program Section */}
            {/* 🟢 REMOVED: Current Level Display */}
            {/* 🟢 REMOVED: Wallet Section */}

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