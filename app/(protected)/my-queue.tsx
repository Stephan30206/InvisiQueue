import { leaveQueue } from "@/data/queue-entries";
import { supabase } from "@/lib/supabase";
import { QueueEntry } from "@/types";
import { useTheme, getThemeColors } from "@/lib/theme-provider";
import { Feather } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
    Alert,
    ScrollView,
    Share,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type HistoryItem = { time: string; label: string; done: boolean };

export default function MyQueueScreen() {
  const { colorScheme } = useTheme();
  const colors = getThemeColors(colorScheme);
  const [myEntry, setMyEntry] = useState<QueueEntry | null>(null);
  const [totalWaiting, setTotalWaiting] = useState(0);
  const [queueName, setQueueName] = useState("");
  const [queueAddress, setQueueAddress] = useState("");
  const [notification, setNotification] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const prevPositionRef = useRef<number | null>(null);

  useEffect(() => {
    loadMyQueue();
  }, []);

  useEffect(() => {
    if (!myEntry) return;
    const prev = prevPositionRef.current;
    const current = myEntry.position;
    if (current <= 3 && (prev === null || prev > 3)) {
      setNotification("Vous êtes 3ème dans la file. Veuillez vous rapprocher de l'entrée du magasin.");
    }
    if (current === 1 && prev !== 1) {
      setNotification("C'est votre tour ! Présentez-vous au comptoir.");
    }
    prevPositionRef.current = current;
  }, [myEntry?.position]);

  const loadMyQueue = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    // Chercher l'entrée active de l'utilisateur
    const { data: entryData } = await supabase
      .from("queue_entries")
      .select("*, queues(name, lat, lng)")
      .eq("user_id", userData.user.id)
      .eq("status", "waiting")
      .order("joined_at", { ascending: false })
      .limit(1)
      .single();

    if (!entryData) {
      setMyEntry(null);
      return;
    }

    setMyEntry(entryData);

    const q = (entryData as any).queues;
    if (q) {
      setQueueName(q.name);
      setQueueAddress(`${q.lat.toFixed(4)}, ${q.lng.toFixed(4)}`);
    }

    // Total en attente
    const { count } = await supabase
      .from("queue_entries")
      .select("*", { count: "exact", head: true })
      .eq("queue_id", entryData.queue_id)
      .eq("status", "waiting");

    setTotalWaiting(count ?? 0);

    // Historique simulé
    const joinedAt = new Date(entryData.joined_at);
    const fmt = (d: Date) =>
      d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

    const items: HistoryItem[] = [
      { time: fmt(joinedAt), label: "Inscription à la file", done: true },
      {
        time: fmt(new Date(joinedAt.getTime() + 60000)),
        label: "Confirmation reçue",
        done: true,
      },
      {
        time: fmt(new Date(joinedAt.getTime() + 420000)),
        label: "Moitié du temps écoulée",
        done: entryData.position <= Math.ceil(totalWaiting / 2),
      },
      {
        time: fmt(new Date(joinedAt.getTime() + 720000)),
        label: "Proche du comptoir",
        done: entryData.position <= 3,
      },
    ];
    setHistory(items);

    // Realtime
    supabase
      .channel(`my-entry-${entryData.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "queue_entries",
          filter: `id=eq.${entryData.id}`,
        },
        (payload) => {
          setMyEntry(payload.new as QueueEntry);
        }
      )
      .subscribe();
  };

  const handleLeave = () => {
    Alert.alert("Quitter la file", "Êtes-vous sûr de vouloir quitter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Quitter",
        style: "destructive",
        onPress: async () => {
          if (myEntry) {
            await leaveQueue(myEntry.id);
            setMyEntry(null);
          }
        },
      },
    ]);
  };

  const handleShare = async () => {
    if (!myEntry) return;
    await Share.share({
      message: `Je suis en position #${myEntry.position} dans la file "${queueName}" sur InvisiQueue.`,
    });
  };

  const peopleAhead = myEntry ? myEntry.position - 1 : 0;
  const estimatedMin = peopleAhead * 3;
  const progress = totalWaiting > 0 ? Math.max(0, Math.min(100, Math.round(((totalWaiting - peopleAhead) / totalWaiting) * 100))) : 0;

  // Pas de file active
  if (!myEntry) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center", padding: 32 }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: colors.borderLight,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Feather name="bell" size={32} color={colors.textMuted} />
        </View>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, textAlign: "center" }}>
          Vous n'êtes dans aucune file
        </Text>
        <Text style={{ color: colors.textMuted, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
          Rejoignez une file depuis l'onglet "Files" pour suivre votre position ici.
        </Text>
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
          Ma position
        </Text>
        <TouchableOpacity onPress={handleShare}>
          <Feather name="share-2" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Notification */}
        {notification && (
          <TouchableOpacity
            onPress={() => setNotification(null)}
            style={{
              marginHorizontal: 20,
              marginBottom: 12,
              backgroundColor: colors.text,
              borderRadius: 12,
              padding: 14,
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <Feather name="bell" size={16} color={colors.background} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.background, fontWeight: "700", fontSize: 13 }}>
                Notification d'approche
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2, lineHeight: 16 }}>
                {notification}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Position circulaire */}
        <View style={{ alignItems: "center", paddingVertical: 24 }}>
          <View
            style={{
              width: 160,
              height: 160,
              borderRadius: 80,
              borderWidth: 8,
              borderColor: colors.text,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: colors.surfaceLight,
            }}
          >
            <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>
              VOTRE PLACE
            </Text>
            <Text style={{ fontSize: 52, fontWeight: "900", color: colors.text, lineHeight: 60 }}>
              #{myEntry.position}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textMuted }}>En progression</Text>
          </View>
        </View>

        {/* Nom de la file */}
        <View style={{ alignItems: "center", marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>
            {queueName}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
            <Feather name="map-pin" size={12} color={colors.textMuted} />
            <Text style={{ fontSize: 12, color: colors.textMuted }}>{queueAddress}</Text>
          </View>
        </View>

        {/* Stats */}
        <View
          style={{
            flexDirection: "row",
            marginHorizontal: 20,
            marginBottom: 16,
            gap: 12,
          }}
        >
          <View
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
              gap: 4,
              backgroundColor: colors.surfaceLight,
            }}
          >
            <Feather name="clock" size={18} color={colors.text} />
            <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text }}>
              {estimatedMin} min
            </Text>
            <Text style={{ fontSize: 11, color: colors.textMuted, textTransform: "uppercase", fontWeight: "600" }}>
              Attente estimée
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
              gap: 4,
              backgroundColor: colors.surfaceLight,
            }}
          >
            <Feather name="users" size={18} color={colors.text} />
            <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text }}>
              {peopleAhead} pers.
            </Text>
            <Text style={{ fontSize: 11, color: colors.textMuted, textTransform: "uppercase", fontWeight: "600" }}>
              Devant vous
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: "600" }}>
              Progression totale
            </Text>
            <Text style={{ fontSize: 12, color: colors.text, fontWeight: "700" }}>
              {progress}%
            </Text>
          </View>
          <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3 }}>
            <View
              style={{
                height: 6,
                width: `${progress}%`,
                backgroundColor: colors.text,
                borderRadius: 3,
              }}
            />
          </View>
        </View>

        {/* Boutons */}
        <View style={{ paddingHorizontal: 20, gap: 10, marginBottom: 24 }}>
          <TouchableOpacity
            onPress={handleShare}
            style={{
              backgroundColor: colors.text,
              padding: 14,
              borderRadius: 12,
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Feather name="share-2" size={16} color={colors.background} />
            <Text style={{ color: colors.background, fontWeight: "700", fontSize: 15 }}>
              Partager ma position
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLeave}
            style={{
              padding: 14,
              borderRadius: 12,
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
              borderWidth: 1,
              borderColor: colors.danger,
              backgroundColor: colors.surfaceLight,
            }}
          >
            <Feather name="log-out" size={16} color={colors.danger} />
            <Text style={{ color: colors.danger, fontWeight: "600", fontSize: 15 }}>
              Quitter la file
            </Text>
          </TouchableOpacity>
        </View>

        {/* Historique */}
        <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text, marginBottom: 16, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Historique de ma file
          </Text>
          {history.map((item, index) => (
            <View key={index} style={{ flexDirection: "row", gap: 12, marginBottom: 14 }}>
              <View style={{ alignItems: "center" }}>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: item.done ? colors.text : colors.border,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Feather
                    name={item.done ? "check" : "circle"}
                    size={12}
                    color={item.done ? colors.background : colors.textMuted}
                  />
                </View>
                {index < history.length - 1 && (
                  <View style={{ width: 1, flex: 1, backgroundColor: colors.border, marginTop: 4 }} />
                )}
              </View>
              <View style={{ flex: 1, paddingBottom: 14 }}>
                <Text style={{ fontSize: 14, color: item.done ? colors.text : colors.textMuted, fontWeight: item.done ? "600" : "400" }}>
                  {item.label}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{item.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
