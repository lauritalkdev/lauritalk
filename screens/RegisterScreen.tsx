import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS, THEME } from "../constants/theme";
import { supabase } from "../supabase";

const { width, height } = Dimensions.get("window");

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState(""); // 🟢 ADDED: Country state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // 🟢 ADDED: Password visibility state
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // 🟢 ADDED: Confirm password visibility state
  const [referralCode, setReferralCode] = useState(""); // 🟢 ADDED: Referral code state

  const symbols = ["A", "文", "ع", "Ж", "Ω", "श", "あ", "한", "א", "Ж", "Я", "Ç", "Ü"];
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

  // 🟢 ADDED: Generate referral code function for new users
  const generateReferralCode = (): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert("Name Required", "Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      Alert.alert("Email Required", "Please enter your email.");
      return;
    }
    if (!country.trim()) { // 🟢 ADDED: Country validation
      Alert.alert("Country Required", "Please enter your country.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Password Too Short", "Use at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Passwords Do Not Match", "Please confirm your password.");
      return;
    }

    try {
      // 🟢 ADDED: Check if referral code exists and find the referrer
      let referrerId = null;
      if (referralCode.trim()) {
        console.log('Checking referral code:', referralCode.trim());
        
        // Find the user who owns this referral code by checking user metadata
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id')
          .eq('raw_user_meta_data->>referral_code', referralCode.trim())
          .single();

        if (!usersError && usersData) {
          referrerId = usersData.id;
          console.log('Found referrer:', referrerId);
        } else {
          console.log('No referrer found for code:', referralCode.trim());
        }
      }

      // Generate a referral code for the new user
      const newUserReferralCode = generateReferralCode();

      // Supabase sign-up
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: { 
            full_name: name.trim(),
            country: country.trim(), // 🟢 ADDED: Include country in user data
            referral_code: newUserReferralCode // 🟢 UPDATED: Give new user their own code
          },
        },
      });

      if (error) {
        let message = error.message;
        if (message.includes("already registered"))
          message = "Email already registered. Please log in.";
        Alert.alert("Registration Error", message);
        return;
      }

      // 🟢 ADDED: Record the referral if a valid code was used
      if (data?.user && referrerId) {
        console.log('Recording referral for user:', data.user.id);
        
        const { error: referralError } = await supabase
          .from('user_referrals')
          .insert({
            referrer_id: referrerId,
            referred_user_id: data.user.id,
            referral_code: referralCode.trim(),
            user_type: 'freemium'
          });

        if (referralError) {
          console.error('Error recording referral:', referralError);
        } else {
          console.log('Referral recorded successfully!');
        }
      }

      // Optional: auto-login after registration (remove if you want email confirmation)
      if (data?.user) {
        await supabase.auth.signInWithPassword({ email: email.trim(), password });
        Alert.alert("🎉 Registration Successful", "Welcome to Lauritalk!");
        navigation.replace("Home");
      } else {
        Alert.alert(
          "🎉 Registration Successful",
          "Check your email for a confirmation link before logging in."
        );
        navigation.replace("Login");
      }
    } catch (err: any) {
      Alert.alert("Unexpected Error", err.message || "Something went wrong.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: THEME.background }}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color={COLORS.gold} />
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
              color: COLORS.gold,
              opacity,
              transform: [{ translateY }, { rotate }],
            }}
          >
            {symbol}
          </Animated.Text>
        );
      })}

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Create Your Lauritalk Account</Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#888"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#888"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        
        {/* 🟢 ADDED: Country Input */}
        <TextInput
          style={styles.input}
          placeholder="Country"
          placeholderTextColor="#888"
          value={country}
          onChangeText={setCountry}
        />

        {/* 🟢 MODIFIED: Password Input with Eye Icon */}
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

        <Text style={styles.passwordNote}>
          Use at least 8 characters for your password
        </Text>

        {/* 🟢 MODIFIED: Confirm Password Input with Eye Icon */}
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirm Password"
            placeholderTextColor="#888"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity 
            style={styles.eyeIcon}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Ionicons 
              name={showConfirmPassword ? "eye-off" : "eye"} 
              size={20} 
              color="#888" 
            />
          </TouchableOpacity>
        </View>

        {/* 🟢 ADDED: Referral Code Input */}
        <TextInput
          style={styles.input}
          placeholder="Referral Code (Optional)"
          placeholderTextColor="#888"
          value={referralCode}
          onChangeText={setReferralCode}
        />

        <Text style={styles.notice}>
          By continuing, you agree to our{" "}
          <Text style={styles.link}>Terms and Conditions</Text>.
        </Text>

        <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
          <Text style={styles.registerButtonText}>Create Free Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.replace("Login")}
        >
          <Text style={styles.loginText}>Already have an account? Log in</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: { position: "absolute", top: 50, left: 20, zIndex: 10, padding: 5 },
  container: { flexGrow: 1, justifyContent: "center", padding: 25 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.gold,
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.black,
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    color: THEME.text,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  // 🟢 ADDED: Password container styles
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.black,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    color: THEME.text,
  },
  eyeIcon: {
    padding: 12,
  },
  passwordNote: {
    fontSize: 12,
    color: COLORS.forestGreen,
    marginBottom: 10,
    marginLeft: 4,
  },
  notice: {
    fontSize: 13,
    color: "#ddd",
    marginTop: 10,
    marginBottom: 25,
    lineHeight: 18,
    textAlign: "center",
  },
  link: { color: COLORS.gold, fontWeight: "600" },
  registerButton: {
    backgroundColor: COLORS.gold,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 15,
  },
  registerButtonText: { color: COLORS.black, fontWeight: "bold", fontSize: 16 },
  loginLink: { alignItems: "center" },
  loginText: { color: COLORS.forestGreen, fontSize: 14 },
});