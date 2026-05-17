import { createQueue } from "@/data/queues";
import { getCurrentPosition } from "@/lib/location";
import { supabase } from "@/lib/supabase";
import { useTheme, getThemeColors } from "@/lib/theme-provider";
import { useLanguage } from "@/lib/use-language";
import { Feather } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

export default function CreateQueueScreen() {
  const router = useRouter();
  const { colorScheme } = useTheme();
  const { t } = useLanguage();
  const colors = getThemeColors(colorScheme);

  const schema = z.object({
    name: z.string().min(3, t("createqueue.queue_name_error")),
  });
  type Schema = z.infer<typeof schema>;

  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
    mode: "onChange",
  });

  const handleCreate = async (data: Schema) => {
    const position = await getCurrentPosition();
    if (!position) {
      Alert.alert(t("createqueue.location_required"), t("createqueue.location_required_message"));
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      Alert.alert(t("createqueue.error_title"), t("createqueue.not_authenticated"));
      return;
    }
    const queue = await createQueue(data.name, position.lat, position.lng, userData.user.id);
    if (!queue) {
      Alert.alert(t("createqueue.error_title"), t("createqueue.error_create"));
      return;
    }
    Alert.alert(t("createqueue.success_title"), t("createqueue.success_message", { name: data.name }), [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <TouchableOpacity onPress={() => router.back()} style={{ padding: 20 }}>
        <Feather name="arrow-left" size={22} color={colors.text} />
      </TouchableOpacity>

      <View style={{ paddingHorizontal: 24 }}>
        <Text style={{ fontSize: 26, fontWeight: "800", color: colors.text, marginBottom: 6 }}>
          {t("createqueue.title")}
        </Text>
        <Text style={{ fontSize: 14, color: colors.textMuted, marginBottom: 32, lineHeight: 20 }}>
          {t("createqueue.description")}
        </Text>

        <View style={{ backgroundColor: colors.borderLight, borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <Feather name="map-pin" size={16} color={colors.textSecondary} />
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>{t("createqueue.current_location_detected")}</Text>
        </View>

        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 }}>
          {t("createqueue.queue_name_label")}
        </Text>
        <Controller
          control={form.control}
          name="name"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <View style={{ gap: 4, marginBottom: 8 }}>
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder={t("createqueue.queue_name_placeholder")}
                style={{
                  borderWidth: 1,
                  borderColor: error ? colors.danger : colors.border,
                  borderRadius: 10,
                  padding: 14,
                  fontSize: 15,
                  backgroundColor: colors.surfaceLight,
                  color: colors.text,
                }}
                placeholderTextColor={colors.textMuted}
              />
              {error && (
                <Text style={{ color: colors.danger, fontSize: 12 }}>{error.message}</Text>
              )}
            </View>
          )}
        />

        <TouchableOpacity
          onPress={form.handleSubmit(handleCreate)}
          disabled={!form.formState.isValid || form.formState.isSubmitting}
          style={{
            backgroundColor: colors.text,
            padding: 16,
            borderRadius: 12,
            alignItems: "center",
            marginTop: 24,
            opacity: !form.formState.isValid || form.formState.isSubmitting ? 0.5 : 1,
          }}
        >
          {form.formState.isSubmitting ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={{ color: colors.background, fontWeight: "700", fontSize: 16 }}>
              {t("createqueue.create_button")}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
