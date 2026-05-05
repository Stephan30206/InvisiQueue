import { getQueuesNearby } from "@/data/queues";
import { getCurrentPosition } from "@/lib/location";
import { Queue } from "@/types";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();
  const [queues, setQueues] = useState<Queue[]>([]);
  const [filtered, setFiltered] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadQueues();
  }, []);

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
    setFiltered(nearby);
    setLoading(false);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}
      >
        <ActivityIndicator size="large" color="#111" />
        <Text style={{ marginTop: 12, color: "#888", fontSize: 14 }}>
          Localisation en cours...
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
          backgroundColor: "#fff",
        }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: "#f5f5f5",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Feather name="map-pin" size={28} color="#999" />
        </View>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#111", textAlign: "center" }}>
          Localisation requise
        </Text>
        <Text style={{ color: "#888", textAlign: "center", marginTop: 8, lineHeight: 20 }}>
          InvisiQueue a besoin de votre position pour afficher les files proches.
        </Text>
        <TouchableOpacity
          onPress={() => { setLoading(true); loadQueues(); }}
          style={{
            backgroundColor: "#111",
            paddingHorizontal: 24,
            paddingVertical: 14,
            borderRadius: 12,
            marginTop: 24,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Feather name="refresh-cw" size={16} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "700" }}>Réessayer</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
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
            backgroundColor: "#111",
            borderRadius: 10,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Feather name="zap" size={18} color="#fff" />
        </View>
        <Text style={{ fontSize: 17, fontWeight: "700", color: "#111" }}>
          Files à proximité
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(protected)/create-queue")}
          style={{
            width: 36,
            height: 36,
            backgroundColor: "#111",
            borderRadius: 18,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View
        style={{
          marginHorizontal: 20,
          marginBottom: 16,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#f5f5f5",
          borderRadius: 12,
          paddingHorizontal: 12,
          gap: 8,
        }}
      >
        <Feather name="search" size={16} color="#999" />
        <TextInput
          placeholder="Rechercher une file..."
          value={search}
          onChangeText={setSearch}
          style={{ flex: 1, paddingVertical: 12, fontSize: 14, color: "#111" }}
          placeholderTextColor="#bbb"
        />
      </View>

      {/* Subtitle */}
      <Text
        style={{
          paddingHorizontal: 20,
          fontSize: 12,
          color: "#999",
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          fontWeight: "600",
        }}
      >
        {filtered.length} file{filtered.length !== 1 ? "s" : ""} trouvée{filtered.length !== 1 ? "s" : ""}
      </Text>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadQueues(); }}
            tintColor="#111"
          />
        }
        ListEmptyComponent={
          <View style={{ paddingTop: 60, alignItems: "center" }}>
            <Feather name="inbox" size={40} color="#ddd" />
            <Text style={{ color: "#bbb", marginTop: 12, textAlign: "center", fontSize: 15 }}>
              Aucune file trouvée près de vous.
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
              borderColor: "#f0f0f0",
              backgroundColor: "#fff",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#111", flex: 1 }}>
                {item.name}
              </Text>
              <View
                style={{
                  backgroundColor: "#f0f0f0",
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                }}
              >
                <Text style={{ fontSize: 12, color: "#555", fontWeight: "600" }}>
                  {Math.round(item.distance_meters!)} m
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginTop: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Feather name="users" size={14} color="#999" />
                <Text style={{ fontSize: 13, color: "#666" }}>
                  {item.waiting_count} en attente
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Feather name="clock" size={14} color="#999" />
                <Text style={{ fontSize: 13, color: "#666" }}>
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