import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../supabase";

const { width, height } = Dimensions.get("window");

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const symbols = ["あ", "文", "ع", "Б", "ñ", "é", "ありがとう", "你好", "Ω", "ק"];
  const animations = useRef(symbols.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const loops = animations.map((anim) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 8000 + Math.random() * 4000,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 8000 + Math.random() * 4000,
            useNativeDriver: true,
          }),
        ])
      )
    );
    loops.forEach((loop) => loop.start());
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      return Alert.alert(
        "Missing Information",
        "Please enter both email and password.",
        [{ text: "OK", style: "default" }]
      );
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (data?.user) {
        // Beautiful success alert with custom styling
        Alert.alert(
          "🎉 Login Successful",
          "Welcome back to Lauritalk!",
          [
            { 
              text: "Continue", 
              style: "default",
              onPress: () => navigation.navigate("Home")
            }
          ],
          {
            // iOS specific styling
            userInterfaceStyle: 'dark',
          }
        );
        
        // Auto-navigate after 2 seconds if user doesn't press Continue
        setTimeout(() => {
          navigation.navigate("Home");
        }, 2000);
        
      } else {
        Alert.alert(
          "Login Failed",
          "Please try again.",
          [{ text: "OK", style: "default" }]
        );
      }
    } catch (error: any) {
      let message = error.message;

      if (message.includes("Invalid login credentials"))
        message = "Incorrect email or password.";
      else if (message.includes("Email not confirmed"))
        message = "Please verify your email before logging in.";

      Alert.alert(
        "Login Error",
        message,
        [{ text: "OK", style: "cancel" }]
      );
    }
  };

  const handleCreateAccountRedirect = async () => {
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

  // Custom function to show beautiful login success alert
  const showBeautifulSuccessAlert = () => {
    // For iOS, we can customize more
    if (Platform.OS === 'ios') {
      Alert.alert(
        "🎉 Login Successful",
        "Welcome back to Lauritalk!",
        [
          { 
            text: "Continue", 
            style: "default",
            onPress: () => navigation.navigate("Home")
          }
        ],
        {
          userInterfaceStyle: 'dark',
        }
      );
    } else {
      // For Android, use regular alert but with nicer options
      Alert.alert(
        "🎉 Login Successful",
        "Welcome back to Lauritalk!",
        [
          { 
            text: "Continue", 
            style: "default",
            onPress: () => navigation.navigate("Home")
          }
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={28} color="#FFD700" />
      </TouchableOpacity>

      {symbols.map((symbol, index) => {
        const translateY = animations[index].interpolate({
          inputRange: [0, 1],
          outputRange: [height, -100],
        });
        const translateX = Math.random() * width;
        const opacity = animations[index].interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 0.5, 0],
        });
        const rotate = animations[index].interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "360deg"],
        });

        return (
          <Animated.Text
            key={index}
            style={{
              position: "absolute",
              top: 0,
              left: translateX,
              fontSize: 26 + Math.random() * 20,
              color: "#FFD700",
              opacity,
              transform: [{ translateY }, { rotate }],
            }}
          >
            {symbol}
          </Animated.Text>
        );
      })}

      <Text style={styles.title}>Welcome Back to Lauritalk</Text>

      <TextInput
        style={styles.input}
        placeholder="Email Address"
        placeholderTextColor="#888"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          placeholderTextColor="#888"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity 
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons 
            name={showPassword ? "eye-off" : "eye"} 
            size={20} 
            color="#888" 
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
        <Text style={styles.forgotPassword}>Forgot Password?</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity
        style={styles.registerButton}
        onPress={handleCreateAccountRedirect}
      >
        <Text style={styles.registerButtonText}>Create a Free Account</Text>
      </TouchableOpacity>

      {/* Optional: Add a test button to see the beautiful alert */}
      {/* <TouchableOpacity 
        style={[styles.loginButton, { backgroundColor: '#228B22', marginTop: 20 }]} 
        onPress={showBeautifulSuccessAlert}
      >
        <Text style={styles.loginButtonText}>Test Beautiful Alert</Text>
      </TouchableOpacity> */}
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: { 
    position: "absolute", 
    top: Platform.OS === 'ios' ? 60 : 50, 
    left: 20, 
    zIndex: 10, 
    padding: 5 
  },
  container: { 
    flex: 1, 
    justifyContent: "center", 
    padding: 25, 
    backgroundColor: "#000" 
  },
  title: { 
    fontSize: 22, 
    fontWeight: "bold", 
    color: "#FFD700", 
    textAlign: "center", 
    marginBottom: 30 
  },
  input: { 
    borderWidth: 1, 
    borderColor: "#FFD700", 
    borderRadius: 8, 
    padding: 12, 
    marginBottom: 15, 
    backgroundColor: "#fff", 
    color: "#000" 
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#FFD700",
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    color: "#000",
  },
  eyeIcon: {
    padding: 12,
  },
  loginButton: { 
    backgroundColor: "#FFD700", 
    paddingVertical: 14, 
    borderRadius: 30, 
    alignItems: "center", 
    marginTop: 10,
    shadowColor: "#FFD700",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loginButtonText: { 
    color: "#000", 
    fontWeight: "bold", 
    fontSize: 16 
  },
  forgotPassword: { 
    color: "#228B22", 
    textAlign: "center", 
    marginTop: 10, 
    textDecorationLine: "underline", 
    fontSize: 13 
  },
  divider: { 
    height: 1, 
    backgroundColor: "#333", 
    marginVertical: 25 
  },
  registerButton: { 
    borderWidth: 1, 
    borderColor: "#FFD700", 
    borderRadius: 30, 
    paddingVertical: 14, 
    alignItems: "center" 
  },
  registerButtonText: { 
    color: "#FFD700", 
    fontWeight: "600", 
    fontSize: 15 
  },
});