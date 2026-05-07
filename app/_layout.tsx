import { Stack } from "expo-router";
import { ThemeProvider } from "@/lib/theme-provider";

export const unstable_settings = {
  initialRouteName: "index",
};

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="(protected)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
