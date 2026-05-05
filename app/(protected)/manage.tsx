import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ManageScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ width: 36, height: 36, backgroundColor: "#111", borderRadius: 10, justifyContent: "center", alignItems: "center" }}>
          <Feather name="zap" size={18} color="#fff" />
        </View>
        <Text style={{ fontSize: 17, fontWeight: "700", color: "#111" }}>Gestionnaire</Text>
        <TouchableOpacity
          onPress={() => router.push("/(protected)/create-queue")}
          style={{ width: 36, height: 36, backgroundColor: "#111", borderRadius: 18, justifyContent: "center", alignItems: "center" }}
        >
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "#f5f5f5", justifyContent: "center", alignItems: "center", marginBottom: 16 }}>
          <Feather name="briefcase" size={32} color="#ccc" />
        </View>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#111", textAlign: "center" }}>
          Gestion des files
        </Text>
        <Text style={{ color: "#888", textAlign: "center", marginTop: 8, lineHeight: 20 }}>
          Créez votre première file pour commencer à gérer vos clients.
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(protected)/create-queue")}
          style={{ backgroundColor: "#111", paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, marginTop: 24, flexDirection: "row", alignItems: "center", gap: 8 }}
        >
          <Feather name="plus" size={16} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "700" }}>Créer une file</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}