import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import PaymentButton from '../components/PaymentButton';
import PaymentStatus from '../components/PaymentStatus';
import UserProfileMenu from "../components/UserProfileMenu";
import { COLORS, THEME } from "../constants/theme";
import { supabase } from "../supabase";

const { width, height } = Dimensions.get("window");

type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
  Settings: undefined;
  TranslationOptions: undefined;
  TextTranslation: undefined;
  VoiceToText: undefined;
  VoiceToVoice: undefined;
  VideoToVoice: undefined;
  ComingSoon: undefined;
  ChatBot: undefined;
  LearnANewLanguage: undefined;
  ForgotPassword: undefined;
  LiveAgent: undefined;
  CryptoSelection: undefined;
};

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

export default function HomeScreen({ navigation }: Props) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("user@example.com");

  // Check user authentication status
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setIsLoggedIn(true);
          setUserEmail(session.user.email || "user@example.com");
        } else {
          setIsLoggedIn(false);
          setUserEmail("user@example.com");
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      }
    };

    checkAuthStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setUserEmail(session.user.email || "user@example.com");
      } else {
        setIsLoggedIn(false);
        setUserEmail("user@example.com");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsLoggedIn(false);
      setUserEmail("user@example.com");
      setMenuVisible(false);
      console.log("User logged out");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleDelete = () => {
    setIsLoggedIn(false);
    setUserEmail("user@example.com");
    setMenuVisible(false);
    console.log("Delete account clicked");
  };

  // ----------------- Blinking AI Chatbot Animation -----------------
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.3,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // ----------------- Breathing Mic Animation -----------------
  const micScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(micScale, {
          toValue: 1.15,
          duration: 900,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(micScale, {
          toValue: 1,
          duration: 900,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // ----------------- Floating Language Symbols -----------------
  const symbols = ["あ", "文", "ع", "Б", "ñ", "é", "ありがとう", "你好", "Ω", "ק"];
  const floatingAnimations = useRef(
    symbols.map(() => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(Math.random() * height),
      opacity: new Animated.Value(0.2),
    }))
  ).current;

  useEffect(() => {
    floatingAnimations.forEach((anim, index) => {
      const loop = () => {
        anim.x.setValue(Math.random() * width);
        anim.y.setValue(height + 50);
        anim.opacity.setValue(0.2);

        Animated.parallel([
          Animated.timing(anim.y, {
            toValue: -50,
            duration: 15000 + index * 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(anim.opacity, {
              toValue: 0.5,
              duration: 4000,
              useNativeDriver: true,
            }),
            Animated.timing(anim.opacity, {
              toValue: 0.2,
              duration: 4000,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => loop());
      };
      loop();
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* ---------- FLOATING BACKGROUND SYMBOLS ---------- */}
      {floatingAnimations.map((anim, i) => (
        <Animated.Text
          key={i}
          style={[
            styles.symbol,
            {
              transform: [{ translateX: anim.x }, { translateY: anim.y }],
              opacity: anim.opacity,
            },
          ]}
        >
          {symbols[i]}
        </Animated.Text>
      ))}

      {/* ---------- HEADER ---------- */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.appName}>Lauritalk</Text>
          {isLoggedIn && <PaymentStatus />}
        </View>

        <TouchableOpacity
          style={styles.profileIconContainer}
          onPress={() => setMenuVisible(true)}
        >
          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/847/847969.png",
            }}
            style={styles.profileIcon}
          />
        </TouchableOpacity>
      </View>

      {/* ---------- MAIN CONTENT ---------- */}
      <View style={styles.content}>
        <Text style={styles.welcomeText}>
          {isLoggedIn ? "Welcome back to Lauritalk!" : "Welcome to Lauritalk"}
        </Text>

        {/* 🎤 Breathing Mic Button */}
        <Animated.View style={[styles.micButton, { transform: [{ scale: micScale }] }]}>
          <TouchableOpacity onPress={() => navigation.navigate("VoiceToVoice")}>
            <Ionicons name="mic" size={60} color={COLORS.gold} />
          </TouchableOpacity>
        </Animated.View>

        {/* Translate Button */}
        <TouchableOpacity
          style={styles.translateButton}
          onPress={() => navigation.navigate("TranslationOptions")}
        >
          <Text style={styles.translateButtonText}>Translate</Text>
        </TouchableOpacity>

        {/* ✅ Learn a New Language Button */}
        <TouchableOpacity
          style={[styles.translateButton, { marginTop: 15, backgroundColor: COLORS.forestGreen }]}
          onPress={() => navigation.navigate("LearnANewLanguage")}
        >
          <Text style={[styles.translateButtonText, { color: COLORS.gold }]}>
            Learn a New Language
          </Text>
        </TouchableOpacity>

        {/* 🟢 ADDED: Payment Button - Only show when logged in */}
        {isLoggedIn && <PaymentButton />}

        {/* 🟢 MODIFIED: Login, Register, Settings - Conditionally rendered */}
        <View style={styles.bottomButtons}>
          {!isLoggedIn ? (
            <>
              <TouchableOpacity
                style={styles.smallButton}
                onPress={() => navigation.navigate("Login")}
              >
                <Text style={styles.smallButtonText}>Login</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.smallButton}
                onPress={() => navigation.navigate("Register")}
              >
                <Text style={styles.smallButtonText}>Register</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.welcomeMessage}>You're logged in! 🎉</Text>
          )}
          
          <TouchableOpacity
            style={[styles.smallButton, { backgroundColor: COLORS.forestGreen }]}
            onPress={() => navigation.navigate("Settings")}
          >
            <Text style={styles.smallButtonText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ---------- USER PROFILE MENU ---------- */}
      <UserProfileMenu
        visible={menuVisible}
        email={userEmail}
        onClose={() => setMenuVisible(false)}
        onLogout={handleLogout}
        onDelete={handleDelete}
        navigation={navigation}
        isLoggedIn={isLoggedIn}
      />

      {/* ---------- BLINKING AI CHATBOT ICON ---------- */}
      <Animated.View
        style={[styles.chatbotIconContainer, { opacity: blinkAnim }]}
      >
        <TouchableOpacity onPress={() => navigation.navigate("ChatBot")}>
          <Ionicons name="chatbubbles" size={60} color={COLORS.gold} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
    paddingTop: 50,
  },
  symbol: {
    position: "absolute",
    fontSize: 28,
    color: COLORS.gold,
    opacity: 0.2,
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
  },
  headerLeft: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  appName: {
    fontSize: 22,
    fontWeight: "bold",
    color: THEME.primary,
    marginBottom: 5,
  },
  profileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: THEME.accent,
  },
  profileIcon: {
    width: "100%",
    height: "100%",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "bold",
    color: THEME.text,
    marginBottom: 40,
  },
  welcomeMessage: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 10,
  },
  micButton: {
    backgroundColor: COLORS.black,
    borderRadius: 100,
    padding: 25,
    marginBottom: 40,
    borderWidth: 3,
    borderColor: COLORS.gold,
    shadowColor: COLORS.gold,
    shadowOpacity: 0.8,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  translateButton: {
    backgroundColor: COLORS.gold,
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 30,
    shadowColor: COLORS.black,
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  translateButtonText: {
    color: COLORS.black,
    fontWeight: "bold",
    fontSize: 18,
  },
  bottomButtons: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 15,
    marginTop: 30,
    marginBottom: 80,
  },
  smallButton: {
    backgroundColor: COLORS.black,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  smallButtonText: {
    color: COLORS.gold,
    fontWeight: "600",
  },
  chatbotIconContainer: {
    position: "absolute",
    bottom: 30,
    right: 30,
    backgroundColor: COLORS.black,
    borderRadius: 50,
    padding: 10,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
});