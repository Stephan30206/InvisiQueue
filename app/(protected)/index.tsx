import { getQueuesNearby } from "@/data/queues";
import { useLocation } from "@/hooks/useLocation";
import { useI18n } from "@/hooks/useI18n";
import { getThemeColors, useTheme } from "@/lib/theme-provider";
import { Queue } from "@/types";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, Text, TextInput, TouchableOpacity, View, } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();
  const { colorScheme } = useTheme();
  const colors = getThemeColors(colorScheme);
  const { t } = useI18n();
  const { location, loading: locLoading, error: locError, refresh: refetchLocation } = useLocation();

  const [queues, setQueues] = useState<Queue[]>([]);
  const [filtered, setFiltered] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (location && !locLoading) {
      loadQueues();
    }
  }, [location, locLoading]);

  useEffect(() => {
    if (locError) {
      setLocationError(true);
      setLoading(false);
      setRefreshing(false);
    }
  }, [locError]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(queues);
    } else {
      setFiltered(
        queues.filter((q) =>
          q.name.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }, [search, queues]);

  const loadQueues = async () => {
    if (!location) return;
    const nearby = await getQueuesNearby(location.lat, location.lng);
    setQueues(nearby);
    setFiltered(nearby);
    setLoading(false);
    setRefreshing(false);
  };

  if (loading || locLoading) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.text} />
        <Text style={{ marginTop: 12, color: colors.textMuted, fontSize: 14 }}>
          {t("geo.locating")}
        </Text>
      </SafeAreaView>
    );
  }

  if (locationError) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 32,
          backgroundColor: colors.background,
        }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: colors.borderLight,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Feather name="map-pin" size={28} color={colors.textMuted} />
        </View>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, textAlign: "center" }}>
          {t("geo.permission_denied")}
        </Text>
        <Text style={{ color: colors.textMuted, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
          {t("queue.no_queues")}
        </Text>
        <TouchableOpacity
          onPress={() => refetchLocation()}
          style={{
            backgroundColor: colors.text,
            paddingHorizontal: 24,
            paddingVertical: 14,
            borderRadius: 12,
            marginTop: 24,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Feather name="refresh-cw" size={16} color={colors.background} />
          <Text style={{ color: colors.background, fontWeight: "700" }}>{t("common.confirm")}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 12,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            backgroundColor: colors.text,
            borderRadius: 10,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Feather name="zap" size={18} color={colors.background} />
        </View>
        <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>
          {t("queue.nearby")}
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(protected)/create-queue")}
          style={{
            width: 36,
            height: 36,
            backgroundColor: colors.text,
            borderRadius: 18,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Feather name="plus" size={20} color={colors.background} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View
        style={{
          marginHorizontal: 20,
          marginBottom: 16,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.borderLight,
          borderRadius: 12,
          paddingHorizontal: 12,
          gap: 8,
        }}
      >
        <Feather name="search" size={16} color={colors.textMuted} />
        <TextInput
          placeholder={t("queue.nearby")}
          value={search}
          onChangeText={setSearch}
          style={{ flex: 1, paddingVertical: 12, fontSize: 14, color: colors.text }}
          placeholderTextColor={colors.textMuted}
        />
      </View>

      {/* Subtitle */}
      <Text
        style={{
          paddingHorizontal: 20,
          fontSize: 12,
          color: colors.textMuted,
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          fontWeight: "600",
        }}
      >
        {filtered.length} {t("queue.wait_count")}
      </Text>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadQueues(); }}
            tintColor={colors.text}
          />
        }
        ListEmptyComponent={
          <View style={{ paddingTop: 60, alignItems: "center" }}>
            <Feather name="inbox" size={40} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted, marginTop: 12, textAlign: "center", fontSize: 15 }}>
              {t("queue.no_queues")}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/(protected)/queue/[id]",
                params: { id: item.id },
              })
            }
            style={{
              marginBottom: 12,
              padding: 16,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surfaceLight,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>
                  {item.name}
                </Text>
                {item.location_label && (
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
                    📍 {item.location_label}
                  </Text>
                )}
              </View>
              <View
                style={{
                  backgroundColor: colors.borderLight,
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  marginLeft: 12,
                }}
              >
                <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: "600" }}>
                  {Math.round(item.distance_meters!)} m
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginTop: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Feather name="users" size={14} color={colors.textMuted} />
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  {item.waiting_count} {t("queue.wait_count")}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Feather name="clock" size={14} color={colors.textMuted} />
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  ~{(item.waiting_count ?? 0) * 3} min
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
