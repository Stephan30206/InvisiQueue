import { logout } from "@/data/users";
import { logout, updateUserProfile, getUserProfile, updatePassword } from "@/data/users";
import { Language } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { getThemeColors, useTheme } from "@/lib/theme-provider";
import { useLanguage } from "@/lib/use-language";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, ScrollView, Switch, Text, TextInput, TouchableOpacity, View, } from "react-native";
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
  const { colorScheme, isDarkMode, toggleDarkMode, language, setLanguage } = useTheme();
  const { t } = useLanguage();
  const colors = getThemeColors(colorScheme);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isAuth, setIsAuth] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [activeQueuesCount, setActiveQueuesCount] = useState(0);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [personalName, setPersonalName] = useState("");
  const [personalPhone, setPersonalPhone] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  useEffect(() => {
    loadUserData();
    loadPreferences();
  }, []);

  useEffect(() => {
    setPersonalName(name);
  }, [name]);

  const loadUserData = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setIsAuth(true);
        setEmail(data.user.email ?? "");

        const profile = await getUserProfile();
        if (profile && profile.full_name) {
          setName(profile.full_name);
          setPersonalName(profile.full_name);
          setPersonalPhone(profile.phone_number || "");
        } else {
          setName(data.user.email?.split("@")[0] ?? "User");
        }
      }

      const { count } = await supabase
        .from("queue_entries")
        .select("*", { count: "exact", head: true })
        .eq("status", "waiting");

      setActiveQueuesCount(count ?? 0);
    } catch (error) {
      console.error("Failed to load user data:", error);
    }
  };

  const loadPreferences = async () => {
    try {
      setLoadingPrefs(false);
    } catch (error) {
      console.error("Failed to load preferences:", error);
    }
  };

  const handleLogout = () => {
    Alert.alert(t("confirmLogout"), t("confirmLogoutMessage"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("logout"),
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/");
        },
      },
    ]);
  };

  const handleLanguageChange = async (lang: Language) => {
    await setLanguage(lang);
    setShowLanguageModal(false);
  };

  const handleNotificationsChange = (value: boolean) => {
    setNotifications(value);
  };

  const handleSavePersonalInfo = async () => {
    if (!personalName.trim()) {
      Alert.alert(t("profile"), "Veuillez entrer un nom.");
      return;
    }
    try {
      const result = await updateUserProfile(personalName, personalPhone);
      if (result) {
        setName(personalName);
        setShowPersonalModal(false);
        Alert.alert(t("profile"), "Vos informations ont été mises à jour.");
      } else {
        Alert.alert("Erreur", "Impossible de sauvegarder les informations.");
      }
    } catch (error) {
      Alert.alert("Erreur", "Une erreur est survenue.");
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword.trim() || !newPassword.trim()) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Erreur", "Le nouveau mot de passe doit avoir au moins 6 caractères.");
      return;
    }
    try {
      const success = await updatePassword(oldPassword, newPassword);
      if (success) {
        setShowSecurityModal(false);
        setOldPassword("");
        setNewPassword("");
        Alert.alert("Succès", "Votre mot de passe a été changé.");
      } else {
        Alert.alert("Erreur", "L'ancien mot de passe est incorrect.");
      }
    } catch (error) {
      Alert.alert("Erreur", "Une erreur est survenue lors de la modification du mot de passe.");
    }
  };

  const Section = ({ title, items }: { title: string; items: MenuItem[] }) => (
    <View style={{ marginBottom: 24 }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: "700",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          marginBottom: 8,
          paddingHorizontal: 20,
        }}
      >
        {title}
      </Text>
      <View
        style={{
          marginHorizontal: 20,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: "hidden",
          backgroundColor: colors.surfaceLight,
        }}
      >
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
              backgroundColor: colors.surfaceLight,
              borderBottomWidth: index < items.length - 1 ? 1 : 0,
              borderBottomColor: colors.borderLight,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: item.danger ? colors.dangerBackground : colors.borderLight,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 12,
              }}
            >
              <Feather
                name={item.icon}
                size={16}
                color={item.danger ? colors.danger : colors.icon}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 15,
                  color: item.danger ? colors.danger : colors.text,
                  fontWeight: "500",
                }}
              >
                {item.label}
              </Text>
              {item.sub && (
                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 1 }}>
                  {item.sub}
                </Text>
              )}
            </View>
            {item.value && (
              <Text style={{ fontSize: 14, color: colors.textMuted }}>{item.value}</Text>
            )}
            {item.toggle ? (
              <Switch
                value={item.toggleValue}
                onValueChange={item.onToggle}
                trackColor={{ false: colors.border, true: colors.text }}
                thumbColor={colors.surfaceLight}
              />
            ) : (
              <Feather
                name="chevron-right"
                size={16}
                color={item.danger ? colors.danger : colors.textMuted}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (loadingPrefs) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Text
        style={{
          fontSize: 17,
          fontWeight: "700",
          color: colors.text,
          textAlign: "center",
          paddingVertical: 12,
        }}
      >
        {t("profile")}
      </Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Avatar + info */}
        <View style={{ alignItems: "center", paddingVertical: 20 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.text,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Feather name="user" size={36} color={colors.background} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text }}>
            {isAuth ? name : "Guest"}
          </Text>
          {isAuth && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
              <Feather name="mail" size={12} color={colors.textMuted} />
              <Text style={{ fontSize: 13, color: colors.textMuted }}>{email}</Text>
            </View>
          )}

          {/* Badges */}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            <View
              style={{
                backgroundColor: colors.borderLight,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textSecondary }}>
                {isAuth ? t("verified") : t("guest")}
              </Text>
            </View>
            {isAuth && (
              <View
                style={{
                  backgroundColor: colors.text,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: colors.background,
                  }}
                >
                  {t("goldClient")}
                </Text>
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
              backgroundColor: colors.text,
              borderRadius: 12,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Feather name="briefcase" size={18} color={colors.background} style={{ marginRight: 10 }} />
            <Text style={{ flex: 1, color: colors.background, fontWeight: "600" }}>
              {activeQueuesCount} {activeQueuesCount > 1 ? t("activeFiles") : t("activeFile")} {t("toManage")}
            </Text>
            <Feather name="chevron-right" size={18} color={colors.background} />
          </TouchableOpacity>
        )}

        <Section
          title={t("myAccount")}
          items={[
            {
              icon: "user",
              label: t("personalInformation"),
              sub: t("personalInfoSub"),
              onPress: () => setShowPersonalModal(true),
            },
            {
              icon: "lock",
              label: t("security"),
              sub: t("securitySub"),
              onPress: () => setShowSecurityModal(true),
            },
            {
              icon: "globe",
              label: t("language"),
              value: language === "fr" ? "Français" : "English",
              onPress: () => setShowLanguageModal(true),
            },
          ]}
        />

        <Section
          title={t("preferences")}
          items={[
            {
              icon: "bell",
              label: t("notifications"),
              sub: t("notificationsSub"),
              toggle: true,
              toggleValue: notifications,
              onToggle: handleNotificationsChange,
            },
            {
              icon: "moon",
              label: t("darkMode"),
              sub: t("darkModeSub"),
              toggle: true,
              toggleValue: isDarkMode,
              onToggle: toggleDarkMode,
            },
          ]}
        />

        <Section
          title={t("support")}
          items={[
            {
              icon: "help-circle",
              label: t("helpCenter"),
              sub: t("helpCenterSub"),
              onPress: () => router.push("/help-center"),
            },
            {
              icon: "info",
              label: t("appVersion"),
              value: "v1.0.0",
              onPress: () => {},
            },
          ]}
        />

        {/* Logout button */}
        <View style={{ marginHorizontal: 20, marginBottom: 12 }}>
          <TouchableOpacity
            onPress={isAuth ? handleLogout : () => router.push("/login")}
            style={{
              borderWidth: 1,
              borderColor: colors.danger,
              borderRadius: 14,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.surfaceLight,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: colors.dangerBackground,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 12,
              }}
            >
              <Feather name="log-out" size={16} color={colors.danger} />
            </View>
            <Text style={{ flex: 1, fontSize: 15, color: colors.danger, fontWeight: "600" }}>
              {isAuth ? t("logout") : t("login")}
            </Text>
            <Feather name="chevron-right" size={16} color={colors.danger} />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text
          style={{
            textAlign: "center",
            fontSize: 11,
            color: colors.textMuted,
            padding: 20,
            lineHeight: 16,
          }}
        >
          {t("termsFooter")}
        </Text>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal visible={showLanguageModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View
            style={{
              backgroundColor: colors.surfaceLight,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              marginTop: "auto",
              padding: 20,
              paddingBottom: 40,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: colors.text,
                marginBottom: 20,
              }}
            >
              {t("language")}
            </Text>
            <FlatList
              data={[
                { label: "English", value: "en" as Language },
                { label: "Français", value: "fr" as Language },
              ]}
              keyExtractor={(item) => item.value}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleLanguageChange(item.value)}
                  style={{
                    padding: 16,
                    borderRadius: 10,
                    marginBottom: 10,
                    backgroundColor:
                      language === item.value ? colors.borderLight : colors.background,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: colors.text,
                      fontWeight: language === item.value ? "600" : "400",
                    }}
                  >
                    {item.label}
                  </Text>
                  {language === item.value && (
                    <Feather name="check" size={20} color={colors.text} />
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              onPress={() => setShowLanguageModal(false)}
              style={{
                marginTop: 20,
                padding: 16,
                borderRadius: 10,
                backgroundColor: colors.borderLight,
              }}
            >
              <Text style={{ fontSize: 16, color: colors.text, textAlign: "center", fontWeight: "600" }}>
                {t("cancel")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Personal Information Modal */}
      <Modal visible={showPersonalModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View
            style={{
              backgroundColor: colors.surfaceLight,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              marginTop: "auto",
              padding: 20,
              paddingBottom: 40,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 20 }}>
              Informations Personnelles
            </Text>

            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 }}>
              Nom
            </Text>
            <TextInput
              value={personalName}
              onChangeText={setPersonalName}
              placeholder="Votre nom"
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                padding: 14,
                fontSize: 15,
                marginBottom: 16,
                backgroundColor: colors.background,
                color: colors.text,
              }}
              placeholderTextColor={colors.textMuted}
            />

            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 }}>
              Téléphone
            </Text>
            <TextInput
              value={personalPhone}
              onChangeText={setPersonalPhone}
              placeholder="+223 XX XX XXXX"
              keyboardType="phone-pad"
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                padding: 14,
                fontSize: 15,
                marginBottom: 20,
                backgroundColor: colors.background,
                color: colors.text,
              }}
              placeholderTextColor={colors.textMuted}
            />

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowPersonalModal(false)}
                style={{
                  flex: 1,
                  padding: 14,
                  borderRadius: 10,
                  backgroundColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 16, color: colors.text, textAlign: "center", fontWeight: "600" }}>
                  {t("cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSavePersonalInfo}
                style={{
                  flex: 1,
                  padding: 14,
                  borderRadius: 10,
                  backgroundColor: colors.text,
                }}
              >
                <Text style={{ fontSize: 16, color: colors.background, textAlign: "center", fontWeight: "600" }}>
                  Enregistrer
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Security Modal */}
      <Modal visible={showSecurityModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View
            style={{
              backgroundColor: colors.surfaceLight,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              marginTop: "auto",
              padding: 20,
              paddingBottom: 40,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 20 }}>
              Changer le mot de passe
            </Text>

            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 }}>
              Ancien mot de passe
            </Text>
            <View
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                backgroundColor: colors.background,
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <TextInput
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder="••••••••"
                secureTextEntry={!showOldPwd}
                style={{ flex: 1, padding: 14, fontSize: 15, color: colors.text }}
                placeholderTextColor={colors.textMuted}
              />
              <TouchableOpacity onPress={() => setShowOldPwd(!showOldPwd)} style={{ padding: 14 }}>
                <Feather name={showOldPwd ? "eye-off" : "eye"} size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 }}>
              Nouveau mot de passe
            </Text>
            <View
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                backgroundColor: colors.background,
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="••••••••"
                secureTextEntry={!showNewPwd}
                style={{ flex: 1, padding: 14, fontSize: 15, color: colors.text }}
                placeholderTextColor={colors.textMuted}
              />
              <TouchableOpacity onPress={() => setShowNewPwd(!showNewPwd)} style={{ padding: 14 }}>
                <Feather name={showNewPwd ? "eye-off" : "eye"} size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowSecurityModal(false)}
                style={{
                  flex: 1,
                  padding: 14,
                  borderRadius: 10,
                  backgroundColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 16, color: colors.text, textAlign: "center", fontWeight: "600" }}>
                  {t("cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleChangePassword}
                style={{
                  flex: 1,
                  padding: 14,
                  borderRadius: 10,
                  backgroundColor: colors.text,
                }}
              >
                <Text style={{ fontSize: 16, color: colors.background, textAlign: "center", fontWeight: "600" }}>
                  Changer
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
