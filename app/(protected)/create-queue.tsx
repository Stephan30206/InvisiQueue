import { createQueue } from "@/data/queues";
import { getCurrentPosition } from "@/lib/location";
import { supabase } from "@/lib/supabase";
import { Feather } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(3, "Le nom doit avoir au moins 3 caractères"),
});
type Schema = z.infer<typeof schema>;

export default function CreateQueueScreen() {
  const router = useRouter();
  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
    mode: "onChange",
  });

  const handleCreate = async (data: Schema) => {
    const position = await getCurrentPosition();
    if (!position) {
      Alert.alert("Localisation requise", "Activez votre GPS pour créer une file.");
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      Alert.alert("Erreur", "Vous devez être connecté.");
      return;
    }
    const queue = await createQueue(data.name, position.lat, position.lng, userData.user.id);
    if (!queue) {
      Alert.alert("Erreur", "Impossible de créer la file.");
      return;
    }
    Alert.alert("Succès !", `File "${data.name}" créée avec succès.`, [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <TouchableOpacity onPress={() => router.back()} style={{ padding: 20 }}>
        <Feather name="arrow-left" size={22} color="#111" />
      </TouchableOpacity>

      <View style={{ paddingHorizontal: 24 }}>
        <Text style={{ fontSize: 26, fontWeight: "800", color: "#111", marginBottom: 6 }}>
          Créer une file
        </Text>
        <Text style={{ fontSize: 14, color: "#888", marginBottom: 32, lineHeight: 20 }}>
          La file sera créée à votre position GPS actuelle.
        </Text>

        <View style={{ backgroundColor: "#f5f5f5", borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <Feather name="map-pin" size={16} color="#555" />
          <Text style={{ fontSize: 13, color: "#555" }}>Position GPS actuelle détectée</Text>
        </View>

        <Text style={{ fontSize: 13, fontWeight: "600", color: "#444", marginBottom: 6 }}>
          Nom de la file
        </Text>
        <Controller
          control={form.control}
          name="name"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <View style={{ gap: 4, marginBottom: 8 }}>
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="Ex: Guichet Banque BFV - Matin"
                style={{
                  borderWidth: 1,
                  borderColor: error ? "#e00" : "#e0e0e0",
                  borderRadius: 10,
                  padding: 14,
                  fontSize: 15,
                  backgroundColor: "#fafafa",
                }}
              />
              {error && (
                <Text style={{ color: "#e00", fontSize: 12 }}>{error.message}</Text>
              )}
            </View>
          )}
        />

        <TouchableOpacity
          onPress={form.handleSubmit(handleCreate)}
          disabled={!form.formState.isValid || form.formState.isSubmitting}
          style={{
            backgroundColor: "#111",
            padding: 16,
            borderRadius: 12,
            alignItems: "center",
            marginTop: 24,
            opacity: !form.formState.isValid || form.formState.isSubmitting ? 0.5 : 1,
          }}
        >
          {form.formState.isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
              Créer la file
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}