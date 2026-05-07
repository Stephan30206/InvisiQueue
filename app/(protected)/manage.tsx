import { useTheme, getThemeColors } from "@/lib/theme-provider";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ManageScreen() {
  const router = useRouter();
  const { colorScheme } = useTheme();
  const colors = getThemeColors(colorScheme);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ width: 36, height: 36, backgroundColor: colors.text, borderRadius: 10, justifyContent: "center", alignItems: "center" }}>
          <Feather name="zap" size={18} color={colors.background} />
        </View>
        <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>Gestionnaire</Text>
        <TouchableOpacity
          onPress={() => router.push("/(protected)/create-queue")}
          style={{ width: 36, height: 36, backgroundColor: colors.text, borderRadius: 18, justifyContent: "center", alignItems: "center" }}
        >
          <Feather name="plus" size={20} color={colors.background} />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.borderLight, justifyContent: "center", alignItems: "center", marginBottom: 16 }}>
          <Feather name="briefcase" size={32} color={colors.textMuted} />
        </View>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, textAlign: "center" }}>
          Gestion des files
        </Text>
        <Text style={{ color: colors.textMuted, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
          Créez votre première file pour commencer à gérer vos clients.
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(protected)/create-queue")}
          style={{ backgroundColor: colors.text, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, marginTop: 24, flexDirection: "row", alignItems: "center", gap: 8 }}
        >
          <Feather name="plus" size={16} color={colors.background} />
          <Text style={{ color: colors.background, fontWeight: "700" }}>Créer une file</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
