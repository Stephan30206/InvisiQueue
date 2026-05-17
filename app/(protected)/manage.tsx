import { callNext, markPresent } from "@/data/queue-entries";
import { supabase } from "@/lib/supabase";
import { getThemeColors, useTheme } from "@/lib/theme-provider";
import { useMissedTurnCounter } from "@/hooks/useMissedTurnCounter";
import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ManageScreen() {
  const { colorScheme } = useTheme();
  const colors = getThemeColors(colorScheme);
  const [entries, setEntries] = useState<any[]>([]);
  const [queueId, setQueueId] = useState<string | null>(null);
  const [calling, setCalling] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(0);

  const first = entries[0];
  const { showCounter, secondsLeft, percentage } = useMissedTurnCounter(
    !!first,
    first?.is_present ?? false
  );

  useEffect(() => {
    loadQueue();
  }, []);

  // Realtime subscription + auto-refresh toutes les 1 seconde
  useEffect(() => {
    if (!queueId) return;

    const channel = supabase
      .channel(`manage-${queueId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "queue_entries",
        filter: `queue_id=eq.${queueId}`,
      }, () => {
        fetchEntries(queueId);
        setLastUpdate(Date.now());
      })
      .subscribe();

    const interval = setInterval(() => {
      fetchEntries(queueId);
      setLastUpdate(Date.now());
    }, 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [queueId]);

  const loadQueue = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const { data: queue } = await supabase
      .from("queues")
      .select("id")
      .eq("created_by", user.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!queue) return;
    setQueueId(queue.id);
    fetchEntries(queue.id);
  };

  const fetchEntries = async (id: string) => {
    const { data } = await supabase
      .from("queue_entries")
      .select("*")
      .eq("queue_id", id)
      .eq("status", "waiting")
      .order("position", { ascending: true });

    setEntries(data ?? []);
  };

  const handleCallNext = async () => {
    if (!queueId) return;
    setCalling(true);
    try {
      await callNext(queueId);
    } finally {
      setCalling(false);
    }
  };

  const handleMarkPresent = async (entryId: string, name: string) => {
    await markPresent(entryId);
    Alert.alert("✓ Présence confirmée", `${name} est marqué comme présent.`);
  };

  const first = entries[0];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text }}>
          Gestion de la file
        </Text>
        <Text style={{ color: colors.textMuted, marginTop: 4 }}>
          {entries.length} personne{entries.length > 1 ? "s" : ""} en attente
        </Text>
      </View>

      {/* Carte "Prochain" */}
      {first && (
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 16,
            backgroundColor: colors.text,
            borderRadius: 16,
            padding: 20,
          }}
        >
          <Text
            style={{
              color: colors.background,
              fontSize: 11,
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            Prochain
          </Text>
          <Text style={{ color: colors.background, fontSize: 22, fontWeight: "800" }}>
            {first.name}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 2 }}>
            {first.email}
          </Text>

          {/* Compteur de temps en cas d'absence */}
          {showCounter && !first.is_present && (
            <View style={{ marginTop: 12, marginBottom: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "600" }}>
                  Délai avant recul automatique
                </Text>
                <Text style={{ color: "#ff9a9a", fontSize: 14, fontWeight: "800" }}>
                  {secondsLeft}s
                </Text>
              </View>
              <View
                style={{
                  height: 6,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: "100%",
                    width: `${percentage}%`,
                    backgroundColor: percentage > 30 ? "#ff6464" : "#ffa500",
                  }}
                />
              </View>
            </View>
          )}

          {/* Indicateur tours manqués */}
          {first.missed_turns > 0 && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginTop: 10,
                backgroundColor: "rgba(255,100,100,0.2)",
                padding: 8,
                borderRadius: 8,
              }}
            >
              <Feather name="alert-triangle" size={14} color="#ff6464" />
              <Text style={{ color: "#ff6464", fontSize: 12, fontWeight: "600" }}>
                {first.missed_turns} tour{first.missed_turns > 1 ? "s" : ""} manqué
                {first.missed_turns > 1 ? "s" : ""} — encore{" "}
                {3 - first.missed_turns} avant exclusion
              </Text>
            </View>
          )}

          {/* Présence */}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
            <TouchableOpacity
              onPress={() => handleMarkPresent(first.id, first.name)}
              style={{
                flex: 1,
                backgroundColor: first.is_present
                  ? "rgba(255,255,255,0.3)"
                  : colors.background,
                padding: 12,
                borderRadius: 10,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Feather
                name={first.is_present ? "check-circle" : "user-check"}
                size={16}
                color={first.is_present ? colors.background : colors.text}
              />
              <Text
                style={{
                  color: first.is_present ? colors.background : colors.text,
                  fontWeight: "700",
                  fontSize: 13,
                }}
              >
                {first.is_present ? "Présent ✓" : "Marquer présent"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bouton Appeler suivant */}
      <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
        <TouchableOpacity
          onPress={handleCallNext}
          disabled={calling || entries.length === 0}
          style={{
            backgroundColor: entries.length === 0 ? colors.border : colors.text,
            padding: 16,
            borderRadius: 14,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Feather name="skip-forward" size={18} color={colors.background} />
          <Text style={{ color: colors.background, fontWeight: "800", fontSize: 16 }}>
            {calling ? "Traitement..." : "Appeler le suivant"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Liste d'attente */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: "700",
            color: colors.textMuted,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            marginBottom: 12,
          }}
        >
          File d'attente
        </Text>

        {entries.map((entry) => (
          <View
            key={entry.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderColor: colors.borderLight,
              gap: 14,
            }}
          >
            {/* Position badge */}
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: entry.position === 1 ? colors.text : colors.surfaceLight,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontWeight: "800",
                  fontSize: 15,
                  color: entry.position === 1 ? colors.background : colors.text,
                }}
              >
                {entry.position}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>
                {entry.name}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>{entry.email}</Text>
            </View>

            {/* Badges état */}
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              {entry.is_present && (
                <View
                  style={{
                    backgroundColor: "#d4f5d4",
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: "#2d7a2d", fontSize: 11, fontWeight: "700" }}>
                    Présent
                  </Text>
                </View>
              )}
              {entry.missed_turns > 0 && (
                <View
                  style={{
                    backgroundColor: "#fde8e8",
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: "#c0392b", fontSize: 11, fontWeight: "700" }}>
                    {entry.missed_turns} manqué{entry.missed_turns > 1 ? "s" : ""}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))}

        {entries.length === 0 && (
          <View style={{ alignItems: "center", paddingTop: 40 }}>
            <Feather name="check-circle" size={40} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 15 }}>
              File vide — tout le monde a été servi
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
