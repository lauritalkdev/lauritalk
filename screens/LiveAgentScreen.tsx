import React from "react";
import { StyleSheet, Text, View } from "react-native";

const LiveAgentScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Connecting you to a human agent...</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0b0b0b" },
  text: { color: "#FFD700", fontSize: 18 },
});

export default LiveAgentScreen;
