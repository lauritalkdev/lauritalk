import React from "react";
import { StyleSheet, Text, View } from "react-native";

const ComingSoonScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚀 Coming Soon!</Text>
      <Text style={styles.subtitle}>
        This feature is still in development. Stay tuned! 🎉
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
  },
});

export default ComingSoonScreen;
