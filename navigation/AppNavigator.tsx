import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import { Dimensions } from "react-native";
import ChatBotScreen from "../screens/ChatBotScreen";
import HomeScreen from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import SettingsScreen from "../screens/SettingsScreen";
import TextTranslationScreen from "../screens/TextTranslationScreen";
import TranslationHistoryScreen from "../screens/TranslationHistoryScreen";
import TranslationOptionsScreen from "../screens/TranslationOptionsScreen";
import VideoToVoiceScreen from "../screens/VideoToVoiceScreen";
import VoiceToTextScreen from "../screens/VoiceToTextScreen";
import VoiceToVoiceScreen from "../screens/VoiceToVoiceScreen";

// 🟢 ADDED:
import ComingSoonScreen from "../screens/ComingSoonScreen";
import CryptoSelectionScreen from "../screens/CryptoSelectionScreen";
import QRPaymentScreen from "../screens/QRPaymentScreen"; // 🟢 ADD THIS LINE

const Stack = createStackNavigator();
const { height } = Dimensions.get('window');

interface AppNavigatorProps {
  initialRoute?: "Home" | "Login";
}

export default function AppNavigator({ initialRoute = "Home" }: AppNavigatorProps) {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          cardStyle: { flex: 1, minHeight: height },
          cardStyleInterpolator: ({ current, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
              },
            };
          },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ChatBot" component={ChatBotScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen
          name="TranslationOptions"
          component={TranslationOptionsScreen}
        />
        <Stack.Screen
          name="VoiceToVoice"
          component={VoiceToVoiceScreen}
        />
        <Stack.Screen
          name="VoiceToText"
          component={VoiceToTextScreen}
        />
        <Stack.Screen
          name="TextTranslation"
          component={TextTranslationScreen}
        />
        <Stack.Screen
          name="TranslationHistory"
          component={TranslationHistoryScreen}
        />
        {/* 🟢 ADDED: Video to Voice Screen */}
        <Stack.Screen
          name="VideoToVoice"
          component={VideoToVoiceScreen}
        />
        {/* 🟢 ADDED: Coming Soon Screen */}
        <Stack.Screen name="ComingSoon" component={ComingSoonScreen} />
        {/* 🟢 ADDED: Crypto Selection Screen */}
        <Stack.Screen name="CryptoSelection" component={CryptoSelectionScreen} />
        {/* 🟢 ADDED: QR Payment Screen */}
        <Stack.Screen name="QRPayment" component={QRPaymentScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}