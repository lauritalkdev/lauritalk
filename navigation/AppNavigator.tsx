import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import { Dimensions } from "react-native";
import { COLORS } from "../constants/theme";

import ChatBotScreen from "../screens/ChatBotScreen";
import FAQScreen from "../screens/FAQScreen";
import HomeScreen from "../screens/HomeScreen";
import LearnANewLanguageScreen from "../screens/LearnANewLanguageScreen";
import LoginScreen from "../screens/LoginScreen";
import PrivacyPolicyScreen from "../screens/PrivacyPolicyScreen";
import RegisterScreen from "../screens/RegisterScreen";
import SettingsScreen from "../screens/SettingsScreen";
import TermsAndConditionsScreen from "../screens/TermsAndConditionsScreen";
import TextTranslationScreen from "../screens/TextTranslationScreen";
import TranslationHistoryScreen from "../screens/TranslationHistoryScreen";
import TranslationOptionsScreen from "../screens/TranslationOptionsScreen";
import VideoToVoiceScreen from "../screens/VideoToVoiceScreen";
import VoiceToTextScreen from "../screens/VoiceToTextScreen";
import VoiceToVoiceScreen from "../screens/VoiceToVoiceScreen";

// CHAT SCREENS
import ChatScreen from "../screens/ChatScreen";
import ConnectionRequestsScreen from "../screens/ConnectionRequestsScreen";
import ConversationScreen from "../screens/ConversationScreen";
import SearchUsersScreen from "../screens/SearchUsersScreen";

const Stack = createStackNavigator();
const { height } = Dimensions.get("window");

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
          gestureDirection: "horizontal",
          cardStyle: { flex: 1, minHeight: height },
          cardStyleInterpolator: ({ current, layouts }) => ({
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
          }),
        }}
      >
        {/* Home */}
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ gestureEnabled: false }}
        />

        <Stack.Screen
          name="LearnANewLanguage"
          component={LearnANewLanguageScreen}
        />

        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ChatBot" component={ChatBotScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="TermsAndConditions" component={TermsAndConditionsScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        <Stack.Screen name="FAQ" component={FAQScreen} />

        <Stack.Screen
          name="TranslationOptions"
          component={TranslationOptionsScreen}
        />
        <Stack.Screen name="VoiceToVoice" component={VoiceToVoiceScreen} />
        <Stack.Screen name="VoiceToText" component={VoiceToTextScreen} />
        <Stack.Screen
          name="TextTranslation"
          component={TextTranslationScreen}
        />
        <Stack.Screen
          name="TranslationHistory"
          component={TranslationHistoryScreen}
        />
        <Stack.Screen name="VideoToVoice" component={VideoToVoiceScreen} />

        {/* CHAT FEATURE */}
        <Stack.Screen
          name="ChatTranslation"
          component={ChatScreen}
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: COLORS.black },
            headerTintColor: COLORS.gold,
            headerTitle: "Messages",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="ConversationScreen"
          component={ConversationScreen}
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: COLORS.black },
            headerTintColor: COLORS.gold,
            headerTitle: "Chat",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="SearchUsersScreen"
          component={SearchUsersScreen}
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: COLORS.black },
            headerTintColor: COLORS.gold,
            headerTitle: "Find Users",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="ConnectionRequestsScreen"
          component={ConnectionRequestsScreen}
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: COLORS.black },
            headerTintColor: COLORS.gold,
            headerTitle: "Connection Requests",
            headerBackTitle: "Back",
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
