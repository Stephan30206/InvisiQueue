import { supabase } from "@/lib/supabase";
import { getThemeColors, useTheme } from "@/lib/theme-provider";
import { Feather } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View, } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

const registerSchema = z
  .object({
    email: z.string().email("Email invalide"),
    password: z.string().min(6, "Minimum 6 caractères"),
    confirmPassword: z.string().min(6, "Minimum 6 caractères"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type RegisterSchema = z.infer<typeof registerSchema>;

const RegisterScreen = () => {
  const router = useRouter();
  const { colorScheme } = useTheme();
  const colors = getThemeColors(colorScheme);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
    mode: "onChange",
  });

  const handleRegister = async (data: RegisterSchema) => {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });
    if (error) {
      form.setError("email", {
        message:
          error.code === "email_exists"
            ? "Cet email est déjà utilisé."
            : "Une erreur est survenue.",
      });
      return;
    }
    router.replace("/(protected)");
  };

  const Field = ({
    name,
    label,
    placeholder,
    secure,
    showToggle,
    onToggle,
    keyboard,
  }: any) => (
    <Controller
      control={form.control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 }}>
            {label}
          </Text>
          <View
            style={{
              borderWidth: 1,
              borderColor: error ? colors.danger : colors.border,
              borderRadius: 10,
              backgroundColor: colors.surfaceLight,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder={placeholder}
              secureTextEntry={secure && !showToggle}
              keyboardType={keyboard ?? "default"}
              autoCapitalize="none"
              style={{ flex: 1, padding: 14, fontSize: 15, color: colors.text }}
              placeholderTextColor={colors.textMuted}
            />
            {secure && (
              <TouchableOpacity onPress={onToggle} style={{ padding: 14 }}>
                <Feather
                  name={showToggle ? "eye-off" : "eye"}
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>
          {error && (
            <Text style={{ color: colors.danger, fontSize: 12, marginTop: 4 }}>
              {error.message}
            </Text>
          )}
        </View>
      )}
    />
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 20 }}>
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
          Créer un compte
        </Text>
        <Text style={{ fontSize: 14, color: colors.textMuted, marginBottom: 28 }}>
          Rejoignez InvisiQueue
        </Text>

        <Field
          name="email"
          label="Email"
          placeholder="votre@email.com"
          keyboard="email-address"
        />
        <Field
          name="password"
          label="Mot de passe"
          placeholder="••••••••"
          secure
          showToggle={showPwd}
          onToggle={() => setShowPwd(!showPwd)}
        />
        <Field
          name="confirmPassword"
          label="Confirmer le mot de passe"
          placeholder="••••••••"
          secure
          showToggle={showConfirm}
          onToggle={() => setShowConfirm(!showConfirm)}
        />

        <TouchableOpacity
          onPress={form.handleSubmit(handleRegister)}
          disabled={form.formState.isSubmitting}
          style={{
            backgroundColor: colors.text,
            padding: 16,
            borderRadius: 12,
            alignItems: "center",
            marginTop: 8,
            opacity: form.formState.isSubmitting ? 0.5 : 1,
          }}
        >
          {form.formState.isSubmitting ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={{ color: colors.background, fontWeight: "700", fontSize: 16 }}>
              S'inscrire
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          style={{ alignItems: "center", marginTop: 20 }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
            Déjà un compte ?{" "}
            <Text style={{ color: colors.text, fontWeight: "700" }}>Se connecter</Text>
          </Text>
        </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;
