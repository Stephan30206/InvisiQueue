import { createQueue } from "@/data/queues";
import { getCurrentPosition } from "@/lib/location";
import { supabase } from "@/lib/supabase";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

const createQueueSchema = z.object({
  name: z.string().min(3, "Le nom doit avoir au moins 3 caractères"),
});

type CreateQueueSchema = z.infer<typeof createQueueSchema>;

export default function CreateQueueScreen() {
  const router = useRouter();

  const form = useForm<CreateQueueSchema>({
    resolver: zodResolver(createQueueSchema),
    defaultValues: { name: "" },
  });

  const handleCreate = async (data: CreateQueueSchema) => {
    const position = await getCurrentPosition();
    if (!position) {
      Alert.alert("Localisation requise", "Activez votre GPS pour créer une file.");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      Alert.alert("Erreur", "Vous devez être connecté pour créer une file.");
      return;
    }

    const queue = await createQueue(
      data.name,
      position.lat,
      position.lng,
      userData.user.id
    );

    if (!queue) {
      Alert.alert("Erreur", "Impossible de créer la file. Réessayez.");
      return;
    }

    Alert.alert("Succès", `File "${data.name}" créée !`, [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        gap: 12,
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 16 }}>← Retour</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "bold" }}>Créer une file</Text>
      </View>

      <View style={{ padding: 16, gap: 12 }}>
        <Text style={{ color: "#666" }}>
          La file sera créée à votre position actuelle (GPS).
        </Text>

        <Controller
          control={form.control}
          name="name"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <View style={{ gap: 4 }}>
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="Nom de la file (ex: Guichet Banque BFV)"
                style={{
                  borderWidth: 1,
                  borderColor: error ? "#e00" : "#ccc",
                  borderRadius: 8,
                  padding: 12,
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
            backgroundColor: "#000",
            padding: 14,
            borderRadius: 8,
            alignItems: "center",
            opacity: !form.formState.isValid || form.formState.isSubmitting ? 0.5 : 1,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>
            {form.formState.isSubmitting ? "Création..." : "Créer la file"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}