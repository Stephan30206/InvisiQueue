import { supabase } from "@/lib/supabase";
import { QueueEntry } from "@/types";

// Récupérer les entrées actives d'une file (triées par position)
export const getQueueEntries = async (
  queueId: string
): Promise<QueueEntry[]> => {
  const { data, error } = await supabase
    .from("queue_entries")
    .select("*")
    .eq("queue_id", queueId)
    .eq("status", "waiting")
    .order("position", { ascending: true });

  if (error) return [];
  return data;
};

// Rejoindre une file
export const joinQueue = async (
  queueId: string,
  name: string,
  email: string,
  userId: string | null
): Promise<QueueEntry | null> => {
  // Calculer la prochaine position
  const { data: existing } = await supabase
    .from("queue_entries")
    .select("position")
    .eq("queue_id", queueId)
    .eq("status", "waiting")
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition =
    existing && existing.length > 0 ? existing[0].position + 1 : 1;

  const { data, error } = await supabase
    .from("queue_entries")
    .insert({
      queue_id: queueId,
      name,
      email,
      user_id: userId,
      position: nextPosition,
      status: "waiting",
    })
    .select()
    .single();

  if (error) return null;
  return data;
};

// Marquer l'utilisateur #1 comme PRÉSENT
export async function markPresent(entryId: string) {
  const { error } = await supabase
    .from("queue_entries")
    .update({ is_present: true })
    .eq("id", entryId);

  if (error) throw error;
}

const MAX_MISSED_TURNS = 3;
const MISSED_PENALTY_POSITIONS = 3;

// Appeler le suivant (action du gestionnaire)
export async function callNext(queueId: string) {
  const { data: first, error } = await supabase
    .from("queue_entries")
    .select("*")
    .eq("queue_id", queueId)
    .eq("status", "waiting")
    .order("position", { ascending: true })
    .limit(1)
    .single();

  if (error || !first) return;

  if (first.is_present) {
    // CAS PRÉSENT → marquer "servi"
    await supabase
      .from("queue_entries")
      .update({ status: "served" })
      .eq("id", first.id);

    await reorderAfterRemoval(queueId, first.position);
  } else {
    // CAS ABSENT → pénalité
    const newMissed = (first.missed_turns ?? 0) + 1;

    if (newMissed >= MAX_MISSED_TURNS) {
      // Exclusion définitive
      await supabase
        .from("queue_entries")
        .update({ status: "excluded", missed_turns: newMissed })
        .eq("id", first.id);

      await reorderAfterRemoval(queueId, first.position);
    } else {
      // Recul de 3 positions
      await applyMissedPenalty(queueId, first, newMissed);
    }
  }
}

// Recul de 3 positions
async function applyMissedPenalty(
  queueId: string,
  entry: any,
  newMissed: number
) {
  const { count } = await supabase
    .from("queue_entries")
    .select("*", { count: "exact", head: true })
    .eq("queue_id", queueId)
    .eq("status", "waiting");

  const total = count ?? 1;
  const newPosition = Math.min(entry.position + MISSED_PENALTY_POSITIONS, total);

  await supabase.rpc("shift_positions_up", {
    p_queue_id: queueId,
    p_from: entry.position + 1,
    p_to: newPosition,
  });

  await supabase
    .from("queue_entries")
    .update({
      position: newPosition,
      missed_turns: newMissed,
      status: "waiting",
      is_present: false,
    })
    .eq("id", entry.id);
}

// Réajustement après retrait (servi / exclu / quitté)
async function reorderAfterRemoval(queueId: string, removedPosition: number) {
  await supabase.rpc("shift_positions_down", {
    p_queue_id: queueId,
    p_from: removedPosition + 1,
  });
}

// Quitter volontairement
export async function leaveQueue(entryId: string) {
  const { data: entry } = await supabase
    .from("queue_entries")
    .select("queue_id, position")
    .eq("id", entryId)
    .single();

  if (!entry) return;

  await supabase
    .from("queue_entries")
    .update({ status: "left" })
    .eq("id", entryId);

  await reorderAfterRemoval(entry.queue_id, entry.position);
}
