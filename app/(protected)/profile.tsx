import { logout } from "@/data/users";
import { supabase } from "@/lib/supabase";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type MenuItem = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  sub?: string;
  value?: string;
  onPress?: () => void;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  danger?: boolean;
};

export default function ProfileScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isAuth, setIsAuth] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [activeQueuesCount, setActiveQueuesCount] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setIsAuth(true);
        setEmail(data.user.email ?? "");
        setName(data.user.email?.split("@")[0] ?? "Utilisateur");
      }
    });

    supabase
      .from("queue_entries")
      .select("*", { count: "exact", head: true })
      .eq("status", "waiting")
      .then(({ count }) => setActiveQueuesCount(count ?? 0));
  }, []);

  const handleLogout = () => {
    Alert.alert("Déconnexion", "Êtes-vous sûr de vouloir vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Se déconnecter",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/");
        },
      },
    ]);
  };

  const Section = ({ title, items }: { title: string; items: MenuItem[] }) => (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ fontSize: 11, fontWeight: "700", color: "#999", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, paddingHorizontal: 20 }}>
        {title}
      </Text>
      <View style={{ marginHorizontal: 20, borderRadius: 14, borderWidth: 1, borderColor: "#f0f0f0", overflow: "hidden" }}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={item.onPress}
            activeOpacity={item.toggle ? 1 : 0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 14,
              backgroundColor: "#fff",
              borderBottomWidth: index < items.length - 1 ? 1 : 0,
              borderBottomColor: "#f5f5f5",
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: item.danger ? "#fff0f0" : "#f5f5f5",
                justifyContent: "center",
                alignItems: "center",
                marginRight: 12,
              }}
            >
              <Feather name={item.icon} size={16} color={item.danger ? "#e00" : "#555"} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, color: item.danger ? "#e00" : "#111", fontWeight: "500" }}>
                {item.label}
              </Text>
              {item.sub && (
                <Text style={{ fontSize: 12, color: "#999", marginTop: 1 }}>{item.sub}</Text>
              )}
            </View>
            {item.value && (
              <Text style={{ fontSize: 14, color: "#999" }}>{item.value}</Text>
            )}
            {item.toggle ? (
              <Switch
                value={item.toggleValue}
                onValueChange={item.onToggle}
                trackColor={{ false: "#e0e0e0", true: "#111" }}
                thumbColor="#fff"
              />
            ) : (
              <Feather name="chevron-right" size={16} color={item.danger ? "#e00" : "#ccc"} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fafafa" }}>
      {/* Header */}
      <Text style={{ fontSize: 17, fontWeight: "700", color: "#111", textAlign: "center", paddingVertical: 12 }}>
        Profil
      </Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Avatar + info */}
        <View style={{ alignItems: "center", paddingVertical: 20 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: "#111",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Feather name="user" size={36} color="#fff" />
          </View>
          <Text style={{ fontSize: 20, fontWeight: "800", color: "#111" }}>
            {isAuth ? name : "Invité"}
          </Text>
          {isAuth && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
              <Feather name="mail" size={12} color="#999" />
              <Text style={{ fontSize: 13, color: "#999" }}>{email}</Text>
            </View>
          )}

          {/* Badges */}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            <View style={{ backgroundColor: "#f0f0f0", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#555" }}>
                {isAuth ? "Utilisateur Vérifié" : "Invité"}
              </Text>
            </View>
            {isAuth && (
              <View style={{ backgroundColor: "#111", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: "#fff" }}>Client Or</Text>
              </View>
            )}
          </View>
        </View>

        {/* Files actives banner */}
        {activeQueuesCount > 0 && (
          <TouchableOpacity
            onPress={() => router.push("/(protected)/my-queue")}
            style={{
              marginHorizontal: 20,
              marginBottom: 20,
              backgroundColor: "#111",
              borderRadius: 12,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Feather name="briefcase" size={18} color="#fff" style={{ marginRight: 10 }} />
            <Text style={{ flex: 1, color: "#fff", fontWeight: "600" }}>
              {activeQueuesCount} file{activeQueuesCount > 1 ? "s" : ""} active{activeQueuesCount > 1 ? "s" : ""} à administrer
            </Text>
            <Feather name="chevron-right" size={18} color="#fff" />
          </TouchableOpacity>
        )}

        <Section
          title="Mon compte"
          items={[
            {
              icon: "user",
              label: "Informations Personnelles",
              sub: "Modifier votre nom, email et téléphone",
              onPress: () => {},
            },
            {
              icon: "lock",
              label: "Sécurité & Confidentialité",
              sub: "Changer de mot de passe",
              onPress: () => {},
            },
            {
              icon: "globe",
              label: "Langue",
              value: "Français",
              onPress: () => {},
            },
          ]}
        />

        <Section
          title="Préférences"
          items={[
            {
              icon: "bell",
              label: "Notifications Push",
              sub: "Alertes de file d'attente et mises à jour",
              toggle: true,
              toggleValue: notifications,
              onToggle: setNotifications,
            },
            {
              icon: "moon",
              label: "Mode Sombre",
              sub: "Ajuster l'apparence visuelle",
              toggle: true,
              toggleValue: darkMode,
              onToggle: setDarkMode,
            },
          ]}
        />

        <Section
          title="Support"
          items={[
            {
              icon: "help-circle",
              label: "Centre d'aide",
              sub: "FAQ et support technique",
              onPress: () => {},
            },
            {
              icon: "info",
              label: "Version de l'application",
              value: "v1.0.0",
              onPress: () => {},
            },
          ]}
        />

        {/* Déconnexion */}
        <View style={{ marginHorizontal: 20, marginBottom: 12 }}>
          <TouchableOpacity
            onPress={isAuth ? handleLogout : () => router.push("/login")}
            style={{
              borderWidth: 1,
              borderColor: "#ffe0e0",
              borderRadius: 14,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#fff",
            }}
          >
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: "#fff0f0", justifyContent: "center", alignItems: "center", marginRight: 12 }}>
              <Feather name="log-out" size={16} color="#e00" />
            </View>
            <Text style={{ flex: 1, fontSize: 15, color: "#e00", fontWeight: "600" }}>
              {isAuth ? "Se déconnecter" : "Se connecter"}
            </Text>
            <Feather name="chevron-right" size={16} color="#e00" />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={{ textAlign: "center", fontSize: 11, color: "#ccc", padding: 20, lineHeight: 16 }}>
          En utilisant Invisible Queue, vous acceptez nos Conditions d'utilisation et notre Politique de confidentialité.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}