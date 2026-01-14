import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

const ComingSoonScreen = () => {
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
          <Ionicons name="rocket-outline" size={120} color="#D4AF37" />
          <View style={styles.iconGlow} />
        </Animated.View>

        {/* Title */}
        <Text style={styles.title}>🚀 Feature Launching Soon</Text>
        
        {/* Subtitle */}
        <Text style={styles.subtitle}>
          We're putting the finishing touches on an exciting new feature that will enhance your language learning experience
        </Text>

        {/* Feature highlights */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(212, 175, 55, 0.2)' }]}>
              <Ionicons name="bulb-outline" size={24} color="#D4AF37" />
            </View>
            <Text style={styles.featureText}>Innovative Learning Tools</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(34, 139, 34, 0.2)' }]}>
              <Ionicons name="stats-chart-outline" size={24} color="#228B22" />
            </View>
            <Text style={styles.featureText}>Progress Tracking</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(65, 105, 225, 0.2)' }]}>
              <Ionicons name="people-outline" size={24} color="#4169E1" />
            </View>
            <Text style={styles.featureText}>Interactive Practice</Text>
          </View>
        </View>

        {/* Countdown or progress indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <Animated.View 
              style={[
                styles.progressBarFill,
                {
                  width: "75%",
                }
              ]}
            />
          </View>
          <Text style={styles.progressText}>Development Progress: 75%</Text>
        </View>

        {/* Footer note */}
        <Text style={styles.footerText}>
          Estimated launch: Q1 2024 • Stay tuned for updates!
        </Text>
      </View>

      {/* Floating decorative elements */}
      <Animated.View 
        style={[
          styles.floatingElement1,
          {
            transform: [{ translateY: floatInterpolate }],
          },
        ]}
      >
        <Ionicons name="star" size={24} color="#D4AF37" />
      </Animated.View>
      
      <Animated.View 
        style={[
          styles.floatingElement2,
          {
            transform: [{ translateY: floatInterpolate }],
          },
        ]}
      >
        <Ionicons name="language" size={24} color="#228B22" />
      </Animated.View>
      
      <Animated.View 
        style={[
          styles.floatingElement3,
          {
            transform: [{ translateY: floatInterpolate }],
          },
        ]}
      >
        <Ionicons name="sparkles" size={20} color="#4169E1" />
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A", // Shiny black background
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
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    zIndex: 1,
    paddingTop: 60, // Added padding to account for back button
  },
  glowBorder: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
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
    borderRadius: 70,
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
    marginBottom: 40,
    opacity: 0.9,
  },
  featuresContainer: {
    width: "100%",
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.1)",
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  featureText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    flex: 1,
  },
  progressContainer: {
    width: "100%",
    marginBottom: 40,
  },
  progressBarBackground: {
    width: "100%",
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#D4AF37",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: "#B0B0B0",
    textAlign: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#888888",
    textAlign: "center",
    marginTop: 10,
    fontStyle: "italic",
  },
  floatingElement1: {
    position: "absolute",
    top: "20%",
    left: "10%",
    opacity: 0.7,
  },
  floatingElement2: {
    position: "absolute",
    top: "30%",
    right: "12%",
    opacity: 0.7,
  },
  floatingElement3: {
    position: "absolute",
    bottom: "25%",
    left: "15%",
    opacity: 0.7,
  },
});

export default ComingSoonScreen;