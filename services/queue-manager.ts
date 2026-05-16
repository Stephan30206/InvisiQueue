import { supabase } from "@/lib/supabase";
import { missedTurn, markAsServed } from "@/data/queue-entries";

export interface TurnResult {
  success: boolean;
  message?: string;
  action: "served" | "missed" | "excluded";
}

// Marquer l'utilisateur comme présent (servi)
export const handleUserPresent = async (entryId: string): Promise<TurnResult> => {
  try {
    const success = await markAsServed(entryId);
    return {
      success,
      action: "served",
      message: success ? "User marked as served" : "Failed to mark as served",
    };
  } catch (error) {
    console.error("Error marking user as served:", error);
    return { success: false, action: "served", message: "Error marking as served" };
  }
};

// Marquer l'utilisateur comme absent (tour manqué)
export const handleUserMissed = async (entryId: string): Promise<TurnResult> => {
  try {
    const { data: entry } = await supabase
      .from("queue_entries")
      .select("missed_count")
      .eq("id", entryId)
      .single();

    if (!entry) {
      return { success: false, action: "missed", message: "Entry not found" };
    }

    const newMissedCount = entry.missed_count + 1;
    const success = await missedTurn(entryId);

    if (newMissedCount >= 3) {
      return {
        success,
        action: "excluded",
        message: "User removed after 3 missed turns",
      };
    }

    return {
      success,
      action: "missed",
      message: `User moved back 3 positions (${newMissedCount} missed turns)`,
    };
  } catch (error) {
    console.error("Error handling missed turn:", error);
    return { success: false, action: "missed", message: "Error processing missed turn" };
  }
};

// Vérifier si l'utilisateur est au sommet et devrait être servi ou marqué absent
export const checkAndProcessTurn = async (
  queueId: string,
  userId?: string
): Promise<TurnResult | null> => {
  try {
    // Récupérer l'entrée au sommet (position 1)
    const { data: entry } = await supabase
      .from("queue_entries")
      .select("*")
      .eq("queue_id", queueId)
      .eq("position", 1)
      .eq("status", "waiting")
      .single();

    if (!entry) {
      return null;
    }

    // Si un userId est fourni, vérifier si c'est le bon utilisateur
    if (userId && entry.user_id !== userId) {
      return null;
    }

    // À ce stade, on pourrait implémenter une logique automatique ou manuelle
    // Pour l'MVP, on laisse le gestionnaire décider
    return null;
  } catch (error) {
    console.error("Error checking turn:", error);
    return null;
  }
};

// Obtenir des statistiques sur la file
export const getQueueStats = async (queueId: string) => {
  try {
    const { data: entries } = await supabase
      .from("queue_entries")
      .select("status")
      .eq("queue_id", queueId);

    if (!entries) {
      return { waiting: 0, served: 0, missed: 0, excluded: 0, total: 0 };
    }

    const stats = {
      waiting: entries.filter((e) => e.status === "waiting").length,
      served: entries.filter((e) => e.status === "served").length,
      excluded: entries.filter((e) => e.status === "excluded").length,
      total: entries.length,
    };

    return stats;
  } catch (error) {
    console.error("Error getting queue stats:", error);
    return { waiting: 0, served: 0, excluded: 0, total: 0 };
  }
};
