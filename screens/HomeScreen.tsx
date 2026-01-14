import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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
  ChatBot: undefined;
  LearnANewLanguage: undefined;
  ForgotPassword: undefined;
  LiveAgent: undefined;
  TranslationHistory: undefined; // Added since it exists in AppNavigator
  DebugWordLimit: undefined; // Added since it exists in AppNavigator
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

  // 🟢 ADDED: Function to open website for registration
  const handleRegisterRedirect = async () => {
    try {
      const url = "https://www.lauritalk.com/register";
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.log("Cannot open URL:", url);
      }
    } catch (error) {
      console.error("Error opening URL:", error);
    }
  };

  // 🟢 UPDATED: Function to handle Translate button press
  const handleTranslatePress = () => {
    if (isLoggedIn) {
      // User is logged in, navigate to TranslationOptions
      navigation.navigate("TranslationOptions");
    } else {
      // User is logged out, navigate to Login screen
      navigation.navigate("Login");
    }
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

  // ----------------- Glowing Gold Border Animation for Translate Button -----------------
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // ----------------- Breathing Gold Line Animation for Mic Icon -----------------
  const micGlowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(micGlowAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(micGlowAnim, {
          toValue: 0,
          duration: 2000,
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

  const glowInterpolate = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3]
  });

  const shadowInterpolate = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 20]
  });

  const micGlowInterpolate = micGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1]
  });

  const micShadowInterpolate = micGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [5, 15]
  });

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
        </View>

        {/* Profile Icon - Only show when user is logged in */}
        {isLoggedIn && (
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
        )}
      </View>

      {/* ---------- MAIN CONTENT ---------- */}
      <View style={styles.content}>
        <Text style={styles.welcomeText}>
          {isLoggedIn ? "Welcome back to Lauritalk!" : "Welcome to Lauritalk"}
        </Text>

        {/* 🎤 3D Bowling Ball Mic Button with Glass Reflection and Breathing Gold Line - Larger Size */}
        <Animated.View style={[styles.micButton, { transform: [{ scale: micScale }] }]}>
          <View style={styles.micButton3D}>
            {/* Main mic button - Bowling Ball Style */}
            <Animated.View style={[
              styles.micBase,
              {
                shadowOpacity: micGlowInterpolate,
                elevation: micShadowInterpolate
              }
            ]}>
              {/* Bowling Ball Finger Holes */}
              <View style={styles.bowlingHole1} />
              <View style={styles.bowlingHole2} />
              <View style={styles.bowlingHole3} />
              
              {/* Gold glow effect */}
              <Animated.View style={[
                styles.micGoldGlow,
                {
                  opacity: micGlowInterpolate,
                  shadowOpacity: micGlowInterpolate
                }
              ]} />
              
              {/* Glass reflection effect */}
              <View style={styles.glassReflection} />
              
              <TouchableOpacity 
                style={styles.micTouchable}
                onPress={() => {
                  if (isLoggedIn) {
                    navigation.navigate("VoiceToVoice");
                  } else {
                    navigation.navigate("Login");
                  }
                }}
              >
                <Ionicons name="mic" size={70} color={COLORS.gold} />
              </TouchableOpacity>
            </Animated.View>
            {/* 3D shadow effect */}
            <View style={styles.micShadow} />
          </View>
        </Animated.View>

        {/* Translate Button with Glowing Gold Breathing Effect */}
        <Animated.View style={[
          styles.translateButtonContainer, 
          { 
            shadowOpacity: glowAnim,
            elevation: shadowInterpolate
          }
        ]}>
          <TouchableOpacity
            style={styles.translateButton}
            onPress={handleTranslatePress}
          >
            <View style={styles.translateButtonInner}>
              <Text style={styles.translateButtonText}>Translate</Text>
            </View>
            <Animated.View style={[
              styles.goldGlow,
              {
                shadowOpacity: glowAnim,
                shadowRadius: shadowInterpolate
              }
            ]} />
          </TouchableOpacity>
        </Animated.View>

        {/* ✅ Learn a New Language Button - Only show when logged in with Royal Blue border */}
        {isLoggedIn && (
          <TouchableOpacity
            style={[styles.learnLanguageButton, { marginTop: 15, backgroundColor: COLORS.forestGreen }]}
            onPress={() => navigation.navigate("LearnANewLanguage")}
          >
            <Text style={[styles.learnLanguageButtonText, { color: COLORS.gold }]}>
              Learn a New Language
            </Text>
          </TouchableOpacity>
        )}

        {/* 🟢 MODIFIED: Login, Register, Settings - Conditionally rendered */}
        <View style={styles.bottomButtons}>
          {!isLoggedIn ? (
            <>
              <TouchableOpacity
                style={[styles.smallButton, styles.loginButton]}
                onPress={() => navigation.navigate("Login")}
              >
                <Text style={styles.smallButtonText}>Login</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.smallButton, styles.registerButton]}
                onPress={handleRegisterRedirect}
              >
                <Text style={styles.smallButtonText}>Register</Text>
              </TouchableOpacity>
            </>
          ) : (
            // Settings Button centered when logged in
            <TouchableOpacity
              style={[styles.smallButton, { backgroundColor: COLORS.forestGreen }]}
              onPress={() => navigation.navigate("Settings")}
            >
              <Text style={styles.smallButtonText}>Settings</Text>
            </TouchableOpacity>
          )}
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

      {/* ---------- BLINKING AI CHATBOT ICON (ORIGINAL) ---------- */}
      <Animated.View
        style={[styles.chatbotIconContainer, { opacity: blinkAnim }]}
      >
        <TouchableOpacity onPress={() => {
          if (isLoggedIn) {
            navigation.navigate("ChatBot");
          } else {
            navigation.navigate("Login");
          }
        }}>
          <Ionicons name="chatbubbles" size={60} color={COLORS.gold} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A', // Shiny black background
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
  micButton: {
    marginBottom: 40,
  },
  micButton3D: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBase: {
    backgroundColor: COLORS.black,
    borderRadius: 100,
    padding: 30,
    borderWidth: 3,
    borderColor: COLORS.gold,
    shadowColor: COLORS.gold,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  // Bowling Ball Finger Holes
  bowlingHole1: {
    position: 'absolute',
    top: '30%',
    left: '40%',
    width: 8,
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    zIndex: 3,
  },
  bowlingHole2: {
    position: 'absolute',
    top: '45%',
    left: '30%',
    width: 8,
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    zIndex: 3,
  },
  bowlingHole3: {
    position: 'absolute',
    top: '45%',
    left: '50%',
    width: 8,
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    zIndex: 3,
  },
  micGoldGlow: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 103,
    borderWidth: 2,
    borderColor: COLORS.gold,
    backgroundColor: 'transparent',
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
  },
  glassReflection: {
    position: 'absolute',
    top: 5,
    left: 5,
    right: 5,
    height: '30%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 50,
    zIndex: 1,
  },
  micTouchable: {
    zIndex: 2,
  },
  micShadow: {
    width: 90,
    height: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 45,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  translateButtonContainer: {
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
  },
  translateButton: {
    backgroundColor: COLORS.black,
    paddingVertical: 18,
    paddingHorizontal: 80,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: COLORS.gold,
    shadowColor: COLORS.gold,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  translateButtonInner: {
    zIndex: 2,
    position: 'relative',
  },
  goldGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
  },
  translateButtonText: {
    color: COLORS.gold,
    fontWeight: "bold",
    fontSize: 20,
    textAlign: 'center',
  },
  learnLanguageButton: {
    backgroundColor: COLORS.forestGreen,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#4169E1',
    shadowColor: COLORS.black,
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  learnLanguageButtonText: {
    color: COLORS.gold,
    fontWeight: "bold",
    fontSize: 16,
    textAlign: 'center',
  },
  bottomButtons: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 15,
    marginTop: 30,
    marginBottom: 80,
    width: '100%',
  },
  smallButton: {
    backgroundColor: COLORS.black,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  loginButton: {
    borderWidth: 2,
    borderColor: '#4169E1',
  },
  registerButton: {
    borderWidth: 2,
    borderColor: COLORS.forestGreen,
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