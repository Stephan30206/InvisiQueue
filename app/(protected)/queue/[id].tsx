import { getQueueEntries, joinQueue, leaveQueue } from "@/data/queue-entries";
import { getCurrentPosition, isWithinRadius } from "@/lib/location";
import { supabase } from "@/lib/supabase";
import { QueueEntry } from "@/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function QueueScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [myEntry, setMyEntry] = useState<QueueEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [queueName, setQueueName] = useState("");
  const [guestData, setGuestData] = useState({ name: "", email: "" });
  const [notification, setNotification] = useState<string | null>(null);

  const prevPositionRef = useRef<number | null>(null);

  useEffect(() => {
    loadQueue();
    checkCurrentUser();

    // Subscription temps réel
    const channel = supabase
      .channel(`queue-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_entries",
          filter: `queue_id=eq.${id}`,
        },
        () => {
          loadQueue();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  // Vérifier les notifications quand position change
  useEffect(() => {
    if (!myEntry) return;

    const prev = prevPositionRef.current;
    const current = myEntry.position;

    if (current <= 3 && (prev === null || prev > 3)) {
      setNotification("⚡ Votre tour approche ! Plus que 3 personnes avant vous.");
    }
    if (current === 1 && prev !== 1) {
      setNotification("🔔 Vous êtes le prochain ! Préparez-vous.");
    }

    prevPositionRef.current = current;
  }, [myEntry?.position]);

  const checkCurrentUser = async () => {
    const { data } = await supabase.auth.getUser();
    return data.user;
  };

  const loadQueue = async () => {
    // Charger le nom de la file
    const { data: queueData } = await supabase
      .from("queues")
      .select("name")
      .eq("id", id)
      .single();

    if (queueData) setQueueName(queueData.name);

    const data = await getQueueEntries(id!);
    setEntries(data);

    // Retrouver mon entrée dans la file (par session ou email stocké)
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const mine = data.find((e) => e.user_id === userData.user!.id);
      setMyEntry(mine ?? null);
    }

    setLoading(false);
  };

  const handleJoin = async () => {
    // Vérifier la proximité
    const position = await getCurrentPosition();
    if (!position) {
      Alert.alert("Localisation requise", "Activez votre GPS pour rejoindre la file.");
      return;
    }

    const { data: queueData } = await supabase
      .from("queues")
      .select("lat, lng")
      .eq("id", id)
      .single();

    if (!queueData || !isWithinRadius(position.lat, position.lng, queueData.lat, queueData.lng)) {
      Alert.alert(
        "Trop loin",
        "Vous devez être à moins de 500m de la file pour la rejoindre."
      );
      return;
    }

    const user = await checkCurrentUser();

    if (user) {
      // Utilisateur authentifié → rejoindre directement
      setJoining(true);
      const entry = await joinQueue(id!, user.email!, user.email!, user.id);
      if (entry) {
        setMyEntry(entry);
        await loadQueue();
      }
      setJoining(false);
    } else {
      // Invité → afficher le modal
      setShowGuestModal(true);
    }
  };

  const handleGuestJoin = async () => {
    if (!guestData.name || !guestData.email) return;
    setShowGuestModal(false);
    setJoining(true);

    const entry = await joinQueue(id!, guestData.name, guestData.email, null);
    if (entry) {
      setMyEntry(entry);
      await loadQueue();
    }
    setJoining(false);
  };

  const handleLeave = async () => {
    if (!myEntry) return;
    Alert.alert(
      "Quitter la file",
      "Êtes-vous sûr de vouloir quitter cette file ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Quitter",
          style: "destructive",
          onPress: async () => {
            await leaveQueue(myEntry.id);
            setMyEntry(null);
            await loadQueue();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  const peopleAhead = myEntry ? myEntry.position - 1 : null;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Header */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        gap: 12,
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 16 }}>← Retour</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "bold" }}>{queueName}</Text>
      </View>

      {/* Notification banner */}
      {notification && (
        <TouchableOpacity
          onPress={() => setNotification(null)}
          style={{
            marginHorizontal: 16,
            marginBottom: 8,
            backgroundColor: "#000",
            padding: 12,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#fff", textAlign: "center" }}>{notification}</Text>
          <Text style={{ color: "#aaa", textAlign: "center", fontSize: 12 }}>
            Appuyer pour fermer
          </Text>
        </TouchableOpacity>
      )}

      <ScrollView style={{ flex: 1 }}>
        {/* Ma position */}
        {myEntry ? (
          <View style={{
            margin: 16,
            padding: 20,
            borderRadius: 12,
            backgroundColor: "#000",
            alignItems: "center",
          }}>
            <Text style={{ color: "#fff", fontSize: 14 }}>Votre position</Text>
            <Text style={{ color: "#fff", fontSize: 48, fontWeight: "bold" }}>
              #{myEntry.position}
            </Text>
            <Text style={{ color: "#aaa", fontSize: 14 }}>
              {peopleAhead === 0
                ? "C'est votre tour !"
                : `${peopleAhead} personne${peopleAhead! > 1 ? "s" : ""} avant vous`}
            </Text>
            <Text style={{ color: "#aaa", fontSize: 12, marginTop: 4 }}>
              Estimation : ~{(peopleAhead ?? 0) * 3} min
            </Text>

            <TouchableOpacity
              onPress={handleLeave}
              style={{
                marginTop: 16,
                borderWidth: 1,
                borderColor: "#e00",
                paddingHorizontal: 20,
                paddingVertical: 8,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#e00" }}>Quitter la file</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{
            margin: 16,
            padding: 20,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#e0e0e0",
            alignItems: "center",
          }}>
            <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>
              {entries.length} personne{entries.length !== 1 ? "s" : ""} en attente
            </Text>
            <TouchableOpacity
              onPress={handleJoin}
              disabled={joining}
              style={{
                backgroundColor: "#000",
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 8,
                opacity: joining ? 0.6 : 1,
              }}
            >
              {joining ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                  Rejoindre la file
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Liste des personnes en attente */}
        <Text style={{ paddingHorizontal: 16, fontWeight: "bold", marginBottom: 8 }}>
          File d'attente ({entries.length})
        </Text>
        {entries.map((entry) => (
          <View
            key={entry.id}
            style={{
              marginHorizontal: 16,
              marginVertical: 4,
              padding: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: myEntry?.id === entry.id ? "#000" : "#e0e0e0",
              backgroundColor: myEntry?.id === entry.id ? "#f5f5f5" : "#fff",
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "bold", width: 32 }}>
              #{entry.position}
            </Text>
            <Text style={{ flex: 1 }}>
              {myEntry?.id === entry.id ? `${entry.name} (vous)` : entry.name}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Modal invité */}
      <Modal
        visible={showGuestModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGuestModal(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.5)",
        }}>
          <View style={{
            backgroundColor: "#fff",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 24,
            gap: 12,
          }}>
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>
              Rejoindre en tant qu'invité
            </Text>
            <TextInput
              placeholder="Votre nom"
              value={guestData.name}
              onChangeText={(text) => setGuestData({ ...guestData, name: text })}
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 8,
                padding: 12,
              }}
            />
            <TextInput
              placeholder="Votre email"
              keyboardType="email-address"
              value={guestData.email}
              onChangeText={(text) => setGuestData({ ...guestData, email: text })}
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 8,
                padding: 12,
              }}
            />
            <TouchableOpacity
              onPress={handleGuestJoin}
              disabled={!guestData.name || !guestData.email}
              style={{
                backgroundColor: "#000",
                padding: 14,
                borderRadius: 8,
                alignItems: "center",
                opacity: !guestData.name || !guestData.email ? 0.5 : 1,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Rejoindre</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowGuestModal(false)}
              style={{ alignItems: "center", padding: 8 }}
            >
              <Text style={{ color: "#666" }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}