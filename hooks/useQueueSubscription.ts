import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { QueueEntry } from "@/types";

interface UseQueueSubscriptionReturn {
  entries: QueueEntry[];
  loading: boolean;
  error: string | null;
}

export function useQueueSubscription(queueId: string): UseQueueSubscriptionReturn {
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!queueId) return;

    // Initial fetch
    const fetchEntries = async () => {
      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from("queue_entries")
          .select("*")
          .eq("queue_id", queueId)
          .eq("status", "waiting")
          .order("position", { ascending: true });

        if (err) throw err;
        setEntries(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch entries");
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`queue_${queueId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_entries",
          filter: `queue_id=eq.${queueId}`,
        },
        () => {
          // Re-fetch on any change (INSERT, UPDATE, DELETE)
          fetchEntries();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [queueId]);

  return { entries, loading, error };
}
