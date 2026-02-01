// App.tsx
import React, { useEffect, useState } from "react";
import { ActivityIndicator, LogBox, View } from "react-native";
import AppNavigator from "./navigation/AppNavigator";
import { supabase } from "./supabase";

// 🔕 Hide specific LogBox warnings (DEV ONLY)
LogBox.ignoreLogs([
  "Text strings must be rendered within a <Text> component",
  "[REALTIME] Channel error",
]);

export default function App() {
  const [initialRoute, setInitialRoute] = useState<"Home" | "Login">("Login");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ Check if user already has a saved session
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setInitialRoute("Home");
      } else {
        setInitialRoute("Login");
      }
      setLoading(false);
    };

    checkSession();

    // ✅ Listen for auth state changes (login/logout)
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setInitialRoute("Home");
        } else {
          setInitialRoute("Login");
        }
      },
    );

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#000",
        }}
      >
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  return <AppNavigator />;
}
