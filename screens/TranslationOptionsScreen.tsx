import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS, THEME } from "../constants/theme";

// ✅ Define navigation types for this screen
type RootStackParamList = {
  TranslationOptions: undefined;
  TextTranslation: undefined;
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
  const options = [
    {
      title: "Text to Text",
      icon: "text-outline",
      screen: "TextTranslation" as keyof RootStackParamList,
      description: "Translate written text between languages"
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
      <Text style={styles.title}>Select Translation Mode</Text>

      <View style={styles.optionsContainer}>
        {options.map((item) => (
          <TouchableOpacity
            key={item.title}
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
        ))}
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
    backgroundColor: THEME.background,
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.gold,
    marginBottom: 40,
    textAlign: "center",
  },
  optionsContainer: {
    width: "100%",
    flex: 1,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.black,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginVertical: 8,
    borderWidth: 2,
    borderColor: COLORS.forestGreen,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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