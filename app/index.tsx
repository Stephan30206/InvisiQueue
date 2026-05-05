import { getCurrentPosition } from "@/lib/location";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    Dimensions,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const OnboardingScreen = () => {
  const router = useRouter();

  const handleAuthorizeLocation = async () => {
    await getCurrentPosition();
    router.replace("/(protected)");
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#fff",
        paddingHorizontal: 24,
      }}
    >
      {/* Logo */}
      <View style={{ alignItems: "center", marginTop: 48, marginBottom: 16 }}>
        <View
          style={{
            width: 64,
            height: 64,
            backgroundColor: "#111",
            borderRadius: 16,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <Feather name="zap" size={32} color="#fff" />
        </View>
        <Text
          style={{
            fontSize: 15,
            color: "#111",
            textAlign: "center",
            lineHeight: 22,
            paddingHorizontal: 16,
          }}
        >
          Gérez votre place dans la file d'attente à distance et recevez une
          notification quand c'est votre tour.
        </Text>
      </View>

      {/* Hero image */}
      <View
        style={{
          borderRadius: 16,
          overflow: "hidden",
          marginVertical: 20,
          height: 200,
          backgroundColor: "#e8e8e8",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            padding: 16,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
            Votre temps est précieux.
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 2 }}>
            L'attente devient invisible et sereine.
          </Text>
        </View>
      </View>

      {/* Features */}
      <View style={{ gap: 14, marginBottom: 32 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Feather name="map-pin" size={18} color="#111" />
          <Text style={{ fontSize: 15, color: "#222" }}>
            Trouvez les files à proximité
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Feather name="navigation" size={18} color="#111" />
          <Text style={{ fontSize: 15, color: "#222" }}>
            Suivez votre position en temps réel
          </Text>
        </View>
      </View>

      {/* Buttons */}
      <View style={{ gap: 12 }}>
        <TouchableOpacity
          onPress={handleAuthorizeLocation}
          style={{
            backgroundColor: "#111",
            padding: 16,
            borderRadius: 12,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
            Autoriser la localisation
          </Text>
          <Feather name="arrow-right" size={18} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(protected)")}
          style={{
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#ddd",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#222", fontWeight: "600", fontSize: 15 }}>
            Continuer en tant qu'invité
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/login")}
          style={{ alignItems: "center", padding: 8 }}
        >
          <Text style={{ color: "#666", fontSize: 14 }}>
            Déjà un compte ?{" "}
            <Text style={{ color: "#111", fontWeight: "700" }}>Connexion</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default OnboardingScreen;