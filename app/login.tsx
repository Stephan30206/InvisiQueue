import { login } from "@/data/users";
import { getThemeColors, useTheme } from "@/lib/theme-provider";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View, } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LoginScreen = () => {
  const { colorScheme } = useTheme();
  const colors = getThemeColors(colorScheme);
  const [data, setData] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    const user = await login(data);
    if (!user) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
      return;
    }
    router.replace("/(protected)");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={{ padding: 20 }}
      >
        <Feather name="arrow-left" size={22} color={colors.text} />
      </TouchableOpacity>

      <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
        <View
          style={{
            width: 48,
            height: 48,
            backgroundColor: colors.text,
            borderRadius: 12,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <Feather name="zap" size={24} color={colors.background} />
        </View>

        <Text style={{ fontSize: 26, fontWeight: "800", color: colors.text, marginBottom: 6 }}>
          Connexion
        </Text>
        <Text style={{ fontSize: 14, color: colors.textMuted, marginBottom: 32 }}>
          Bon retour sur InvisiQueue
        </Text>

        {/* Email */}
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 }}>
          Email
        </Text>
        <TextInput
          placeholder="votre@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={data.email}
          onChangeText={(text) => setData({ ...data, email: text })}
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            padding: 14,
            fontSize: 15,
            marginBottom: 16,
            backgroundColor: colors.surfaceLight,
            color: colors.text,
          }}
          placeholderTextColor={colors.textMuted}
        />

        {/* Password */}
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 }}>
          Mot de passe
        </Text>
        <View
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            backgroundColor: colors.surfaceLight,
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <TextInput
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            value={data.password}
            onChangeText={(text) => setData({ ...data, password: text })}
            style={{ flex: 1, padding: 14, fontSize: 15, color: colors.text }}
            placeholderTextColor={colors.textMuted}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={{ padding: 14 }}
          >
            <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {error && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: 12,
            }}
          >
            <Feather name="alert-circle" size={14} color={colors.danger} />
            <Text style={{ color: colors.danger, fontSize: 13 }}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading || !data.email || !data.password}
          style={{
            backgroundColor: colors.text,
            padding: 16,
            borderRadius: 12,
            alignItems: "center",
            marginTop: 16,
            opacity: loading || !data.email || !data.password ? 0.5 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={{ color: colors.background, fontWeight: "700", fontSize: 16 }}>
              Se connecter
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/register")}
          style={{ alignItems: "center", marginTop: 20 }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
            Pas de compte ?{" "}
            <Text style={{ color: colors.text, fontWeight: "700" }}>S'inscrire</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;
