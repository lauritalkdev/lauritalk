import { Button, Text, View } from "react-native";

export default function HomeScreen({ navigation }) {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>Welcome to Lauritalk</Text>

      <Button title="Login" onPress={() => navigation.navigate("Login")} />
      <Button title="Register" onPress={() => navigation.navigate("Register")} />

      <Text style={{ marginTop: 20, fontWeight: "bold" }}>Translation Modes</Text>
      <Button title="Text to Text" onPress={() => navigation.navigate("Translation")} />
      <Button title="Voice to Voice" onPress={() => navigation.navigate("ComingSoon")} />
      <Button title="Voice to Video" onPress={() => navigation.navigate("ComingSoon")} />
      <Button title="Video to Voice" onPress={() => navigation.navigate("ComingSoon")} />

      <Button title="Settings" onPress={() => navigation.navigate("Settings")} />
    </View>
  );
}
