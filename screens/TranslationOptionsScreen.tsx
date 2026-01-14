import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../constants/theme";

// ✅ Define navigation types for this screen - ADDED ChatTranslation
type RootStackParamList = {
  TranslationOptions: undefined;
  TextTranslation: undefined;
  ChatTranslation: undefined; // ADDED
  VoiceToText: undefined;
  VoiceToVoice: undefined;
  VideoToVoice: undefined;
};

type TranslationOptionsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "TranslationOptions"
>;

type Props = {
  navigation: TranslationOptionsNavigationProp;
};

export default function TranslationOptionsScreen({ navigation }: Props) {
  // Create animated values for each button's glow effect - UPDATED to 5
  const glowAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0) // ADDED for Chat Translation
  ]).current;

  useEffect(() => {
    // Start pulsing glow animations for all buttons with staggered timing
    glowAnims.forEach((anim, index) => {
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 2000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 2000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ).start();
      }, index * 500); // Stagger the start times
    });
  }, []);

  const options = [
    {
      title: "Text to Text",
      icon: "text-outline",
      screen: "TextTranslation" as keyof RootStackParamList,
      description: "Translate written text between languages"
    },
    {
      title: "Chat Translation", // ADDED as 2nd option
      icon: "chatbubbles-outline",
      screen: "ChatTranslation" as keyof RootStackParamList,
      description: "Translate conversations with connected users"
    },
    {
      title: "Voice to Text",
      icon: "mic-outline",
      screen: "VoiceToText" as keyof RootStackParamList,
      description: "Convert speech to text and translate"
    },
    {
      title: "Voice to Voice",
      icon: "mic-circle-outline",
      screen: "VoiceToVoice" as keyof RootStackParamList,
      description: "Real-time voice translation"
    },
    {
      title: "Video to Voice",
      icon: "videocam-outline",
      screen: "VideoToVoice" as keyof RootStackParamList,
      description: "Gesture detection for speech/hearing impaired"
    },
  ];

  return (
    <View style={styles.container}>
      {/* 3D Title Text */}
      <Text style={styles.title3D}>Select Translation Mode</Text>

      <View style={styles.optionsContainer}>
        {options.map((item, index) => {
          const glowOpacity = glowAnims[index].interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 1]
          });

          const glowScale = glowAnims[index].interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.05]
          });

          const shadowRadius = glowAnims[index].interpolate({
            inputRange: [0, 1],
            outputRange: [5, 15]
          });

          return (
            <View key={item.title} style={styles.buttonContainer}>
              {/* Pulsing Glow Border */}
              <Animated.View 
                style={[
                  styles.glowBorder,
                  {
                    opacity: glowOpacity,
                    transform: [{ scale: glowScale }],
                    shadowRadius: shadowRadius,
                  }
                ]}
              />
              
              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => {
                  console.log("Navigating to", item.screen);
                  navigation.navigate(item.screen);
                }}
              >
                <View style={styles.optionContent}>
                  <Ionicons
                    name={item.icon as any}
                    size={26}
                    color={COLORS.gold}
                    style={{ marginRight: 12 }}
                  />
                  <View style={styles.textContainer}>
                    <Text style={styles.optionText}>{item.title}</Text>
                    <Text style={styles.optionDescription}>{item.description}</Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={COLORS.gold}
                />
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={22} color={COLORS.black} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Black background
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title3D: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.gold,
    marginBottom: 40,
    textAlign: "center",
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 2,
    letterSpacing: 1,
  },
  optionsContainer: {
    width: "100%",
    flex: 1,
  },
  buttonContainer: {
    marginVertical: 8,
    borderRadius: 16,
    position: 'relative',
  },
  glowBorder: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: '#4169E1', // Royal Blue
    backgroundColor: 'transparent',
    shadowColor: '#4169E1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    elevation: 8,
    zIndex: 1,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.black,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(65, 105, 225, 0.5)', // Semi-transparent royal blue
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 2,
    position: 'relative',
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  textContainer: {
    flex: 1,
  },
  optionText: {
    color: COLORS.gold,
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 4,
  },
  optionDescription: {
    color: COLORS.forestGreen,
    fontSize: 12,
    opacity: 0.8,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gold,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backText: {
    color: COLORS.black,
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: 16,
  },
});