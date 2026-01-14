import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

// ✅ Updated RootStackParamList with only needed screens
type RootStackParamList = {
  FAQ: undefined;
  TermsAndConditions: undefined;
  PrivacyPolicy: undefined;
};

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();

  const handle2FASetup = () => {
    Alert.alert(
      "Two-Factor Authentication",
      "Secure your account with 2FA:\n\n• Download Google Authenticator or Authy\n• Scan the QR code with your app\n• Enter the 6-digit code to verify\n• Keep your backup codes safe",
      [
        {
          text: "Setup Authenticator",
          onPress: () => {
            Alert.alert(
              "Authenticator Setup",
              "1. Open Google Authenticator/Authy\n2. Tap '+' to add new account\n3. Scan the QR code below\n4. Enter the 6-digit code to verify\n\n📱 QR Code would be displayed here",
              [
                {
                  text: "I've Scanned the QR Code",
                  onPress: () =>
                    Alert.alert(
                      "Verification",
                      "Enter the 6-digit code from your authenticator app:",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Verify",
                          onPress: () => Alert.alert("Success", "2FA has been enabled!"),
                        },
                      ]
                    ),
                },
                { text: "Cancel", style: "cancel" },
              ]
            );
          },
        },
        { text: "Later", style: "cancel" },
      ]
    );
  };

  // ✅ Updated settings options with removed buttons
  const settingsOptions: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    onPress: () => void;
  }[] = [
    {
      icon: "lock-closed-outline",
      title: "Privacy Policy",
      onPress: () => navigation.navigate("PrivacyPolicy"),
    },
    {
      icon: "document-text-outline",
      title: "Terms and Conditions",
      onPress: () => navigation.navigate("TermsAndConditions"),
    },
    {
      icon: "shield-checkmark-outline",
      title: "Two-Factor Authentication (2FA)",
      onPress: handle2FASetup,
    },
    {
      icon: "help-buoy-outline",
      title: "FAQ",
      onPress: () => navigation.navigate("FAQ"),
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#D4AF37" />
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.titleUnderline} />

        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.optionsContainer}>
            {settingsOptions.map((item, index) => (
              <TouchableOpacity key={index} style={styles.option} onPress={item.onPress}>
                <View style={styles.optionContent}>
                  <View style={styles.iconContainer}>
                    <Ionicons name={item.icon} size={22} color="#D4AF37" />
                  </View>
                  <Text style={styles.optionText}>{item.title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#D4AF37" />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Lauritalk App Version 25.02</Text>
            <Text style={styles.copyrightText}>
              © 2025 Lauritalk. All rights reserved.
            </Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  contentWrapper: {
    width: width * 0.9,
    height: height * 0.9,
    backgroundColor: "#000",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#D4AF37",
    overflow: "hidden",
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 15,
  },
  backButton: {
    padding: 8,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  title: { fontSize: 28, fontWeight: "bold", color: "#D4AF37", textAlign: "center", flex: 1 },
  headerSpacer: { width: 40 },
  titleUnderline: {
    height: 3,
    backgroundColor: "#2E8B57",
    width: 60,
    alignSelf: "center",
    borderRadius: 2,
    marginBottom: 25,
  },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 25 },
  optionsContainer: {
    backgroundColor: "rgba(212, 175, 55, 0.05)",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    overflow: "hidden",
    marginBottom: 25,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212, 175, 55, 0.1)",
  },
  optionContent: { flexDirection: "row", alignItems: "center", flex: 1 },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  optionText: { fontSize: 16, fontWeight: "500", color: "#FFFFFF", flex: 1 },
  versionContainer: {
    alignItems: "center",
    paddingVertical: 25,
    paddingHorizontal: 20,
    backgroundColor: "rgba(212, 175, 55, 0.05)",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(158, 135, 59, 0.2)",
  },
  versionText: { fontSize: 16, fontWeight: "600", color: "#D4AF37", marginBottom: 8 },
  copyrightText: { fontSize: 12, color: "rgba(212, 175, 55, 0.7)", textAlign: "center" },
});