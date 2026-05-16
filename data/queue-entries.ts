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

// Quitter une file volontairement
export const leaveQueue = async (entryId: string): Promise<boolean> => {
  // Récupérer l'entrée actuelle
  const { data: entry } = await supabase
    .from("queue_entries")
    .select("*")
    .eq("id", entryId)
    .single();

  if (!entry) return false;

  // Marquer comme sorti
  await supabase
    .from("queue_entries")
    .update({ status: "left" })
    .eq("id", entryId);

  // Réajuster les positions des suivants
  await reorderAfterPosition(entry.queue_id, entry.position);

  return true;
};

// Signaler un tour manqué
export const missedTurn = async (entryId: string): Promise<boolean> => {
  const { data: entry } = await supabase
    .from("queue_entries")
    .select("*")
    .eq("id", entryId)
    .single();

  if (!entry) return false;

  const newMissedCount = entry.missed_count + 1;

  if (newMissedCount >= 3) {
    // Exclusion automatique après 3 tours manqués
    await supabase
      .from("queue_entries")
      .update({ status: "excluded", missed_count: newMissedCount })
      .eq("id", entryId);

    // Réajuster les positions pour combler le départ
    await reorderAfterPosition(entry.queue_id, entry.position);
    return true;
  }

  // Reculer de 3 positions dans la file (§3.6)
  // Récupérer la position max pour s'assurer que nous ne dépassons pas
  const { data: maxPosData } = await supabase
    .from("queue_entries")
    .select("position")
    .eq("queue_id", entry.queue_id)
    .eq("status", "waiting")
    .order("position", { ascending: false })
    .limit(1);

  const maxPosition = maxPosData && maxPosData.length > 0 ? maxPosData[0].position : entry.position;
  const newPosition = Math.min(entry.position + 3, maxPosition + 1);

  await supabase
    .from("queue_entries")
    .update({ missed_count: newMissedCount, position: newPosition })
    .eq("id", entryId);

  // Réajuster les positions intermédiaires
  await reorderQueuePositions(entry.queue_id);

  return true;
};

// Marquer comme servi
export const markAsServed = async (entryId: string): Promise<boolean> => {
  const { data: entry } = await supabase
    .from("queue_entries")
    .select("*")
    .eq("id", entryId)
    .single();

  if (!entry) return false;

  await supabase
    .from("queue_entries")
    .update({ status: "served" })
    .eq("id", entryId);

  await reorderAfterPosition(entry.queue_id, entry.position);
  return true;
};

// Réajuster les positions après un départ
const reorderAfterPosition = async (
  queueId: string,
  fromPosition: number
): Promise<void> => {
  const { data: entries } = await supabase
    .from("queue_entries")
    .select("id, position")
    .eq("queue_id", queueId)
    .eq("status", "waiting")
    .gt("position", fromPosition)
    .order("position", { ascending: true });

  if (!entries) return;

  for (const entry of entries) {
    await supabase
      .from("queue_entries")
      .update({ position: entry.position - 1 })
      .eq("id", entry.id);
  }
};

// Réajuster toutes les positions d'une file pour éviter les trous
const reorderQueuePositions = async (queueId: string): Promise<void> => {
  const { data: entries } = await supabase
    .from("queue_entries")
    .select("id, position")
    .eq("queue_id", queueId)
    .eq("status", "waiting")
    .order("position", { ascending: true });

  if (!entries || entries.length === 0) return;

  for (let i = 0; i < entries.length; i++) {
    const expectedPosition = i + 1;
    if (entries[i].position !== expectedPosition) {
      await supabase
        .from("queue_entries")
        .update({ position: expectedPosition })
        .eq("id", entries[i].id);
    }
  }
};
