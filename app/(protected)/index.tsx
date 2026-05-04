import { getQueuesNearby } from "@/data/queues";
import { logout } from "@/data/users";
import { getCurrentPosition } from "@/lib/location";
import { supabase } from "@/lib/supabase";
import { Queue } from "@/types";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
    loadQueues();
  }, []);

  const loadQueues = async () => {
    const position = await getCurrentPosition();

    if (!position) {
      setLocationError(true);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setLocationError(false);
    const nearby = await getQueuesNearby(position.lat, position.lng);
    setQueues(nearby);
    setLoading(false);
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Localisation en cours...</Text>
      </SafeAreaView>
    );
  }

  if (locationError) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", textAlign: "center" }}>
          Localisation requise
        </Text>
        <Text style={{ textAlign: "center", marginTop: 10, color: "#666" }}>
          InvisiQueue a besoin de votre position pour afficher les files proches.
        </Text>
        <TouchableOpacity
          onPress={() => { setLoading(true); loadQueues(); }}
          style={{ marginTop: 20, backgroundColor: "#000", padding: 12, borderRadius: 8 }}
        >
          <Text style={{ color: "#fff" }}>Réessayer</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Header */}
      <View style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
      }}>
        <View>
          <Text style={{ fontSize: 22, fontWeight: "bold" }}>InvisiQueue</Text>
          {userEmail && (
            <Text style={{ fontSize: 12, color: "#666" }}>{userEmail}</Text>
          )}
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            onPress={() => router.push("/(protected)/create-queue")}
            style={{
              backgroundColor: "#000",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>+ Créer</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={{ color: "#e00", padding: 8 }}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={{ paddingHorizontal: 16, color: "#666", marginBottom: 8 }}>
        Files dans un rayon de 500m
      </Text>

      <FlatList
        data={queues}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadQueues(); }}
          />
        }
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: "center" }}>
            <Text style={{ color: "#666", textAlign: "center" }}>
              Aucune file d'attente trouvée près de vous.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/(protected)/queue/${item.id}`)}
            style={{
              marginHorizontal: 16,
              marginVertical: 6,
              padding: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#e0e0e0",
              backgroundColor: "#fff",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>{item.name}</Text>
            <View style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 6,
            }}>
              <Text style={{ color: "#666" }}>
                {item.waiting_count} personne{item.waiting_count !== 1 ? "s" : ""} en attente
              </Text>
              <Text style={{ color: "#666" }}>
                {Math.round(item.distance_meters!)} m
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}