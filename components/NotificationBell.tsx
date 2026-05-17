import { useNotifications } from "@/lib/notification-center";
import { getThemeColors, useTheme } from "@/lib/theme-provider";
import { useLanguage } from "@/lib/use-language";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const NOTIF_ICONS: Record<string, any> = {
  approaching: { name: "clock", color: "#f39c12" },
  your_turn: { name: "bell", color: "#27ae60" },
  missed: { name: "alert-triangle", color: "#e74c3c" },
  excluded: { name: "x-circle", color: "#c0392b" },
  left: { name: "log-out", color: "#7f8c8d" },
  joined: { name: "check-circle", color: "#2980b9" },
};

export function NotificationBell() {
  const { colorScheme } = useTheme();
  const { t } = useLanguage();
  const colors = getThemeColors(colorScheme);
  const { notifications, unreadCount, markRead, markAllRead } =
    useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Bell icon with badge */}
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={{ position: "relative", padding: 4 }}
      >
        <Feather name="bell" size={22} color={colors.text} />
        {unreadCount > 0 && (
          <View
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: "#e74c3c",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 9, fontWeight: "800" }}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Modal notifications panel */}
      <Modal visible={open} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => setOpen(false)}
          />
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: "75%",
              paddingBottom: 32,
            }}
          >
            {/* Handle */}
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.border,
                alignSelf: "center",
                marginTop: 12,
                marginBottom: 16,
              }}
            />

            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 20,
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "800",
                  color: colors.text,
                }}
              >
                {t("profileTab") === "Profile"
                  ? "Notifications"
                  : "Notifications"}
              </Text>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={markAllRead}>
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.textMuted,
                      fontWeight: "600",
                    }}
                  >
                    {t("profileTab") === "Profile"
                      ? "Mark all as read"
                      : "Tout marquer lu"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {notifications.length === 0 ? (
                <View
                  style={{
                    alignItems: "center",
                    paddingTop: 48,
                    paddingBottom: 32,
                  }}
                >
                  <Feather name="bell-off" size={36} color={colors.textMuted} />
                  <Text
                    style={{ color: colors.textMuted, marginTop: 12 }}
                  >
                    {t("profileTab") === "Profile"
                      ? "No notifications"
                      : "Aucune notification"}
                  </Text>
                </View>
              ) : (
                notifications.map((notif) => {
                  const icon =
                    NOTIF_ICONS[notif.type] ?? NOTIF_ICONS.joined;
                  return (
                    <TouchableOpacity
                      key={notif.id}
                      onPress={() => markRead(notif.id)}
                      style={{
                        flexDirection: "row",
                        gap: 14,
                        paddingHorizontal: 20,
                        paddingVertical: 14,
                        backgroundColor: notif.read
                          ? colors.background
                          : colors.surfaceLight,
                        borderBottomWidth: 1,
                        borderColor: colors.borderLight,
                      }}
                    >
                      {/* Icon circle */}
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: `${icon.color}18`,
                          justifyContent: "center",
                          alignItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Feather
                          name={icon.name}
                          size={18}
                          color={icon.color}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: "700",
                              color: colors.text,
                              flex: 1,
                            }}
                          >
                            {notif.title}
                          </Text>
                          {!notif.read && (
                            <View
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: "#e74c3c",
                                marginTop: 4,
                                marginLeft: 8,
                              }}
                            />
                          )}
                        </View>
                        <Text
                          style={{
                            fontSize: 13,
                            color: colors.textMuted,
                            marginTop: 2,
                            lineHeight: 18,
                          }}
                        >
                          {notif.message}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            color: colors.textMuted,
                            marginTop: 4,
                          }}
                        >
                          {notif.createdAt.toLocaleTimeString(
                            t("language") === "English" ? "en-US" : "fr-FR",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
