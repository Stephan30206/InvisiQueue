import { getQueueEntries, joinQueue, leaveQueue } from "@/data/queue-entries";
import { getThemeColors, useTheme } from "@/lib/theme-provider";
import { supabase } from "@/lib/supabase";
import { useGeoAccess } from "@/hooks/useGeoAccess";
import { useMissedTurnCounter } from "@/hooks/useMissedTurnCounter";
import { QueueEntry } from "@/types";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View, } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function QueueScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colorScheme } = useTheme();
  const colors = getThemeColors(colorScheme);

  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [myEntry, setMyEntry] = useState<QueueEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [queueName, setQueueName] = useState("");
  const [queueCoords, setQueueCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [guestData, setGuestData] = useState({ name: "", email: "" });
  const [notification, setNotification] = useState<string | null>(null);
  const prevPositionRef = useRef<number | null>(null);

  const { userLocation, canJoin: canJoinByDistance, distance, loading: geoLoading, permissionDenied } = useGeoAccess(queueCoords?.lat, queueCoords?.lng);
  const { showCounter, secondsLeft, percentage } = useMissedTurnCounter(
    myEntry?.position === 1,
    myEntry?.is_present ?? false
  );

  useEffect(() => {
    loadQueue();
    const channel = supabase
      .channel(`queue-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queue_entries", filter: `queue_id=eq.${id}` },
        () => loadQueue()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  // Rafraîchissement automatique des données toutes les 2 secondes pour sync temps réel
  useEffect(() => {
    if (!myEntry) return;
    const interval = setInterval(() => loadQueue(), 2000);
    return () => clearInterval(interval);
  }, [myEntry?.id]);

  useEffect(() => {
    if (!myEntry) return;
    const prev = prevPositionRef.current;
    const current = myEntry.position;
    if (current <= 3 && (prev === null || prev > 3)) {
      setNotification("Votre tour approche ! Plus que 3 personnes avant vous.");
    }
    if (current === 1 && prev !== 1) {
      setNotification("C'est votre tour ! Présentez-vous.");
    }
    prevPositionRef.current = current;
  }, [myEntry?.position]);

  const loadQueue = async () => {
    const { data: q } = await supabase.from("queues").select("name, lat, lng").eq("id", id).single();
    if (q) {
      setQueueName(q.name);
      setQueueCoords({ lat: q.lat, lng: q.lng });
    }
    const data = await getQueueEntries(id!);
    setEntries(data);
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      setMyEntry(data.find((e) => e.user_id === userData.user!.id) ?? null);
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (geoLoading) return;

    if (permissionDenied) {
      Alert.alert("Géolocalisation refusée", "Activez-la dans les paramètres.");
      return;
    }

    if (!canJoinByDistance) {
      Alert.alert("Trop loin", "Vous devez être à moins de 500m de la file.");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      setJoining(true);
      const entry = await joinQueue(id!, userData.user.email!, userData.user.email!, userData.user.id);
      if (entry) { setMyEntry(entry); await loadQueue(); }
      setJoining(false);
    } else {
      setShowGuestModal(true);
    }
  };

  const handleGuestJoin = async () => {
    if (!guestData.name || !guestData.email) return;
    setShowGuestModal(false);
    setJoining(true);
    const entry = await joinQueue(id!, guestData.name, guestData.email, null);
    if (entry) { setMyEntry(entry); await loadQueue(); }
    setJoining(false);
  };

  const handleLeave = () => {
    Alert.alert("Quitter la file", "Êtes-vous sûr ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Quitter", style: "destructive",
        onPress: async () => {
          if (!myEntry) return;
          await leaveQueue(myEntry.id);
          setMyEntry(null);
          await loadQueue();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.text} />
      </SafeAreaView>
    );
  }

  const peopleAhead = myEntry ? myEntry.position - 1 : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 17, fontWeight: "700", color: colors.text }}>{queueName}</Text>
      </View>

      {/* Notification */}
      {notification && (
        <TouchableOpacity
          onPress={() => setNotification(null)}
          style={{ marginHorizontal: 20, marginBottom: 8, backgroundColor: colors.text, borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 10 }}
        >
          <Feather name="bell" size={16} color={colors.background} style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.background, fontWeight: "700", fontSize: 13 }}>Notification</Text>
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 }}>{notification}</Text>
          </View>
          <Feather name="x" size={14} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Geolocation status */}
        {!myEntry && (
          <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
            {geoLoading ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <ActivityIndicator size="small" color={colors.text} />
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>Localisation en cours...</Text>
              </View>
            ) : permissionDenied ? (
              <Text style={{ color: colors.danger, fontSize: 13, fontWeight: "600" }}>
                Géolocalisation refusée. Activez-la dans les paramètres.
              </Text>
            ) : userLocation ? (
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Feather name="navigation" size={14} color={colors.textMuted} />
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                    {userLocation.label}
                  </Text>
                </View>
                {distance !== null && (
                  <Text style={{ fontSize: 12, color: canJoinByDistance ? colors.text : colors.danger, fontWeight: "600" }}>
                    {canJoinByDistance
                      ? `✓ À ${distance}m — Accès autorisé`
                      : `✗ À ${distance}m — Trop éloigné (max 500m)`}
                  </Text>
                )}
              </View>
            ) : null}
          </View>
        )}

        {/* Ma position */}
        {myEntry ? (
          <View style={{ margin: 20, padding: 24, borderRadius: 16, backgroundColor: colors.text, alignItems: "center" }}>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Votre position
            </Text>
            <Text style={{ color: colors.background, fontSize: 64, fontWeight: "900", lineHeight: 76 }}>
              #{myEntry.position}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, marginBottom: 16 }}>
              {peopleAhead === 0 ? "C'est votre tour !" : `${peopleAhead} personne${peopleAhead! > 1 ? "s" : ""} avant vous`}
            </Text>

            {/* Compteur de temps si c'est votre tour */}
            {showCounter && myEntry.position === 1 && !myEntry.is_present && (
              <View style={{ width: "100%", marginBottom: 16, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: "rgba(255,100,100,0.15)", borderRadius: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: "600" }}>
                    ⚠️ Confirmez votre présence
                  </Text>
                  <Text style={{ color: "#ff9a9a", fontSize: 14, fontWeight: "800" }}>
                    {secondsLeft}s
                  </Text>
                </View>
                <View
                  style={{
                    height: 4,
                    backgroundColor: "rgba(255,255,255,0.2)",
                    borderRadius: 2,
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
                <Text style={{ color: "rgba(255,150,150,0.8)", fontSize: 11, marginTop: 6 }}>
                  Sinon, vous reculerez automatiquement de 3 positions.
                </Text>
              </View>
            )}

            <View style={{ flexDirection: "row", gap: 20, marginBottom: 20 }}>
              <View style={{ alignItems: "center", gap: 4 }}>
                <Feather name="clock" size={16} color="rgba(255,255,255,0.6)" />
                <Text style={{ color: colors.background, fontWeight: "700" }}>~{(peopleAhead ?? 0) * 3} min</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleLeave}
              style={{ borderWidth: 1, borderColor: colors.danger, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Feather name="log-out" size={14} color={colors.danger} />
              <Text style={{ color: colors.danger, fontWeight: "600" }}>Quitter la file</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ margin: 20, padding: 24, borderRadius: 16, borderWidth: 1, borderColor: colors.border, alignItems: "center", backgroundColor: colors.surfaceLight }}>
            <Feather name="users" size={32} color={colors.textMuted} style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 4 }}>
              {entries.length} personne{entries.length !== 1 ? "s" : ""} en attente
            </Text>
            <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 16 }}>
              Estimation : ~{entries.length * 3} min
            </Text>
            <TouchableOpacity
              onPress={handleJoin}
              disabled={joining || geoLoading || !canJoinByDistance}
              style={{ backgroundColor: canJoinByDistance ? colors.text : colors.border, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12, opacity: joining || !canJoinByDistance ? 0.6 : 1 }}
            >
              {joining ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={{ color: canJoinByDistance ? colors.background : colors.textMuted, fontWeight: "700", fontSize: 15, textAlign: "center" }}>
                  {canJoinByDistance ? "Rejoindre la file" : "Trop éloigné pour rejoindre"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Liste */}
        <Text style={{ paddingHorizontal: 20, fontSize: 12, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
          File d'attente ({entries.length})
        </Text>
        {entries.map((entry) => (
          <View
            key={entry.id}
            style={{
              marginHorizontal: 20, marginBottom: 8, padding: 14, borderRadius: 12,
              borderWidth: 1, borderColor: myEntry?.id === entry.id ? colors.text : colors.border,
              backgroundColor: myEntry?.id === entry.id ? colors.surfaceLight : colors.background,
              flexDirection: "row", alignItems: "center", gap: 12,
            }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: myEntry?.id === entry.id ? colors.text : colors.borderLight, justifyContent: "center", alignItems: "center" }}>
              <Text style={{ fontWeight: "800", color: myEntry?.id === entry.id ? colors.background : colors.textSecondary, fontSize: 13 }}>
                #{entry.position}
              </Text>
            </View>
            <Text style={{ flex: 1, fontSize: 14, color: colors.text, fontWeight: myEntry?.id === entry.id ? "700" : "400" }}>
              {myEntry?.id === entry.id ? `${entry.name} (vous)` : entry.name}
            </Text>
            {myEntry?.id === entry.id && (
              <View style={{ backgroundColor: colors.text, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                <Text style={{ color: colors.background, fontSize: 10, fontWeight: "700" }}>VOUS</Text>
              </View>
            )}
          </View>
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Modal invité */}
      <Modal visible={showGuestModal} transparent animationType="slide" onRequestClose={() => setShowGuestModal(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: colors.surfaceLight, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12 }}>
            <View style={{ width: 36, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 8 }} />
            <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text }}>Rejoindre en tant qu'invité</Text>
            <Text style={{ fontSize: 13, color: colors.textMuted }}>Saisissez vos informations pour rejoindre la file.</Text>
            <TextInput
              placeholder="Votre nom"
              value={guestData.name}
              onChangeText={(text) => setGuestData({ ...guestData, name: text })}
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, fontSize: 15, marginTop: 4, backgroundColor: colors.background, color: colors.text }}
              placeholderTextColor={colors.textMuted}
            />
            <TextInput
              placeholder="Votre email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={guestData.email}
              onChangeText={(text) => setGuestData({ ...guestData, email: text })}
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, fontSize: 15, backgroundColor: colors.background, color: colors.text }}
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity
              onPress={handleGuestJoin}
              disabled={!guestData.name || !guestData.email}
              style={{ backgroundColor: colors.text, padding: 16, borderRadius: 12, alignItems: "center", opacity: !guestData.name || !guestData.email ? 0.5 : 1 }}
            >
              <Text style={{ color: colors.background, fontWeight: "700", fontSize: 16 }}>Rejoindre</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowGuestModal(false)} style={{ alignItems: "center", padding: 8 }}>
              <Text style={{ color: colors.textMuted, fontSize: 14 }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
