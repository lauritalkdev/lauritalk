import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

const VideoToVoiceScreen = () => {
  const navigation = useNavigation();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Pulsating animation for the main icon
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // Floating animation for secondary elements
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [floatAnim]);

  // Glowing border animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.ease,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.ease,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [glowAnim]);

  const floatInterpolate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const glowInterpolate = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });

  const glowColorInterpolate = glowAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["rgba(212, 175, 55, 0.7)", "rgba(212, 175, 55, 1)", "rgba(212, 175, 55, 0.7)"],
  });

  const signLanguages = [
    { name: "American Sign Language (ASL)", users: "500,000+ native users" },
    { name: "British Sign Language (BSL)", users: "151,000+ users in UK" },
    { name: "International Sign (ISL)", users: "Global conference language" },
    { name: "LSF (French Sign)", users: "100,000+ users" },
  ];

  const features = [
    { icon: "videocam", title: "Real-time Sign Language Recognition", color: "#D4AF37" },
    { icon: "volume-high", title: "Instant Speech Synthesis", color: "#228B22" },
    { icon: "language", title: "Multiple Sign Language Support", color: "#4169E1" },
    { icon: "save", title: "Translation History", color: "#D4AF37" },
    { icon: "share", title: "Share Translations", color: "#228B22" },
    { icon: "accessibility", title: "Accessibility First Design", color: "#4169E1" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Arrow Button at Top Left */}
      <TouchableOpacity 
        style={styles.backButtonTop}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back-outline" size={28} color="#D4AF37" />
      </TouchableOpacity>

      {/* Animated background pattern */}
      <View style={styles.backgroundPattern}>
        {Array.from({ length: 20 }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.patternDot,
              {
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                backgroundColor: index % 4 === 0 ? "#228B22" : 
                               index % 4 === 1 ? "#4169E1" : 
                               "#D4AF37",
                opacity: 0.1 + Math.random() * 0.2,
              },
            ]}
          />
        ))}
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main content */}
        <View style={styles.content}>
          {/* Glowing circle border */}
          <Animated.View 
            style={[
              styles.glowBorder,
              {
                borderColor: glowColorInterpolate,
                opacity: glowInterpolate,
              }
            ]}
          />
          
          {/* Main icon with animation */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [
                  { scale: pulseAnim },
                  { translateY: floatInterpolate },
                ],
              },
            ]}
          >
            <Ionicons name="accessibility-outline" size={100} color="#D4AF37" />
            <View style={styles.iconGlow} />
          </Animated.View>

          {/* Title with special emphasis */}
          <Text style={styles.title}>🎬 Video to Voice/Text Translation</Text>
          
          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Empowering the speech and hearing impaired community through real-time sign language to speech conversion
          </Text>

          {/* Mission Statement */}
          <View style={styles.missionCard}>
            <Ionicons name="heart" size={30} color="#FF6B6B" style={styles.missionIcon} />
            <Text style={styles.missionTitle}>Our Mission</Text>
            <Text style={styles.missionText}>
              Breaking communication barriers by converting sign language videos into spoken words instantly, 
              creating an inclusive environment for everyone.
            </Text>
          </View>

          {/* Features Grid */}
          <Text style={styles.sectionHeader}>Key Features</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={[styles.featureIconContainer, { backgroundColor: `${feature.color}20` }]}>
                  <Ionicons name={feature.icon as any} size={28} color={feature.color} />
                </View>
                <Text style={styles.featureCardTitle}>{feature.title}</Text>
              </View>
            ))}
          </View>

          {/* Supported Languages */}
          <Text style={styles.sectionHeader}>Supported Sign Languages</Text>
          <View style={styles.languagesContainer}>
            {signLanguages.map((lang, index) => (
              <View key={index} style={styles.languageCard}>
                <View style={styles.languageHeader}>
                  <Ionicons name="hand-right" size={20} color="#D4AF37" />
                  <Text style={styles.languageName}>{lang.name}</Text>
                </View>
                <Text style={styles.languageUsers}>{lang.users}</Text>
              </View>
            ))}
          </View>

          {/* Progress Section */}
          <View style={styles.progressSection}>
            <Text style={styles.sectionHeader}>Development Progress</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBackground}>
                <Animated.View 
                  style={[
                    styles.progressBarFill,
                    {
                      width: "65%",
                    }
                  ]}
                />
              </View>
              <View style={styles.progressStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>3</Text>
                  <Text style={styles.statLabel}>Sign Languages</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>95%</Text>
                  <Text style={styles.statLabel}>Accuracy</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>∞</Text>
                  <Text style={styles.statLabel}>Real-time</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Impact Statement */}
          <View style={styles.impactCard}>
            <Ionicons name="megaphone" size={40} color="#228B22" style={styles.impactIcon} />
            <Text style={styles.impactTitle}>Building Bridges of Communication</Text>
            <Text style={styles.impactText}>
              This feature will revolutionize how the speech and hearing impaired community interacts 
              with the world, providing seamless communication in educational, professional, and social settings.
            </Text>
          </View>

          {/* Footer note */}
          <Text style={styles.footerText}>
            Estimated launch: Q3 2026 • Join us in creating an accessible world!
          </Text>
        </View>
      </ScrollView>

      {/* Floating decorative elements */}
      <Animated.View 
        style={[
          styles.floatingElement1,
          {
            transform: [{ translateY: floatInterpolate }],
          },
        ]}
      >
        <Ionicons name="videocam" size={24} color="#D4AF37" />
      </Animated.View>
      
      <Animated.View 
        style={[
          styles.floatingElement2,
          {
            transform: [{ translateY: floatInterpolate }],
          },
        ]}
      >
        <Ionicons name="volume-high" size={24} color="#228B22" />
      </Animated.View>
      
      <Animated.View 
        style={[
          styles.floatingElement3,
          {
            transform: [{ translateY: floatInterpolate }],
          },
        ]}
      >
        <Ionicons name="hand-left" size={20} color="#4169E1" />
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A", // Shiny black background
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  backButtonTop: {
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  backgroundPattern: {
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 0,
  },
  patternDot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 100,
    zIndex: 1,
  },
  glowBorder: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 2,
    borderColor: "#D4AF37",
  },
  iconContainer: {
    marginBottom: 30,
    position: "relative",
  },
  iconGlow: {
    position: "absolute",
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderRadius: 60,
    zIndex: -1,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#D4AF37", // Gold
    textAlign: "center",
    marginBottom: 15,
    textShadowColor: "rgba(212, 175, 55, 0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#E0E0E0", // Light gray
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
    opacity: 0.9,
    paddingHorizontal: 10,
  },
  missionCard: {
    backgroundColor: "rgba(34, 139, 34, 0.1)",
    padding: 20,
    borderRadius: 16,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "rgba(34, 139, 34, 0.3)",
    width: "100%",
    alignItems: "center",
  },
  missionIcon: {
    marginBottom: 10,
  },
  missionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#228B22",
    marginBottom: 10,
    textAlign: "center",
  },
  missionText: {
    fontSize: 14,
    color: "#CCCCCC",
    textAlign: "center",
    lineHeight: 20,
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#D4AF37",
    marginBottom: 20,
    textAlign: "center",
    width: "100%",
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 30,
    width: "100%",
  },
  featureCard: {
    width: "48%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.1)",
  },
  featureIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  featureCardTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 18,
  },
  languagesContainer: {
    width: "100%",
    marginBottom: 30,
  },
  languageCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(65, 105, 225, 0.1)",
  },
  languageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  languageName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 10,
    flex: 1,
  },
  languageUsers: {
    fontSize: 13,
    color: "#888888",
    fontStyle: "italic",
  },
  progressSection: {
    width: "100%",
    marginBottom: 30,
  },
  progressContainer: {
    width: "100%",
  },
  progressBarBackground: {
    width: "100%",
    height: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 20,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#D4AF37",
    borderRadius: 5,
  },
  progressStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#D4AF37",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#B0B0B0",
    textAlign: "center",
  },
  impactCard: {
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    padding: 25,
    borderRadius: 16,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    width: "100%",
    alignItems: "center",
  },
  impactIcon: {
    marginBottom: 15,
  },
  impactTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#D4AF37",
    marginBottom: 15,
    textAlign: "center",
  },
  impactText: {
    fontSize: 14,
    color: "#CCCCCC",
    textAlign: "center",
    lineHeight: 20,
  },
  footerText: {
    fontSize: 14,
    color: "#888888",
    textAlign: "center",
    marginTop: 10,
    fontStyle: "italic",
    marginBottom: 40,
  },
  floatingElement1: {
    position: "absolute",
    top: "15%",
    left: "10%",
    opacity: 0.7,
  },
  floatingElement2: {
    position: "absolute",
    top: "25%",
    right: "12%",
    opacity: 0.7,
  },
  floatingElement3: {
    position: "absolute",
    bottom: "10%",
    left: "15%",
    opacity: 0.7,
  },
});

export default VideoToVoiceScreen;