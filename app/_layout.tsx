import { DemoSessionProvider } from "@/lib/demo-session";
import { Inter_400Regular } from "@expo-google-fonts/inter";
import { Lora_400Regular, useFonts } from "@expo-google-fonts/lora";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import "./global.css";

export {
	// Catch any errors thrown by the Layout component.
	ErrorBoundary
} from "expo-router";

// Keep the splash screen visible until fonts are ready.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Lora_400Regular,
    Inter_400Regular,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <DemoSessionProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </DemoSessionProvider>
  );
}
