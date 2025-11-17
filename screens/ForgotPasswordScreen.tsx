import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { supabase } from "../supabase";

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState("");

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      return Alert.alert("Email Required", "Please enter your email.");
    }

    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: "yourapp://login", // optional: deep link back to app login
      });

      if (error) throw error;

      Alert.alert(
        "Check Your Email",
        "A password reset link has been sent to your email."
      );
      navigation.goBack();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Unable to send reset email.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Your Password</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        placeholderTextColor="#888"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TouchableOpacity style={styles.resetButton} onPress={handlePasswordReset}>
        <Text style={styles.resetButtonText}>Send Reset Link</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 25, backgroundColor: "#000" },
  title: { fontSize: 22, fontWeight: "bold", color: "#FFD700", marginBottom: 25, textAlign: "center" },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#FFD700",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    backgroundColor: "#fff",
    color: "#000",
  },
  resetButton: {
    backgroundColor: "#FFD700",
    paddingVertical: 14,
    borderRadius: 30,
    width: "100%",
    alignItems: "center",
    marginBottom: 15,
  },
  resetButtonText: { color: "#000", fontWeight: "bold", fontSize: 16 },
  backText: { color: "#228B22", fontSize: 14, textDecorationLine: "underline", textAlign: "center" },
});
