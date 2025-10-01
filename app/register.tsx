import { useRouter } from "expo-router";
import { Button, StyleSheet, Text, View } from "react-native";

export default function RegisterScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create an Account ✨</Text>
      <Button title="Go to Home" onPress={() => router.push("/home")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
});
