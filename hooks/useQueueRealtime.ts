import { NotificationCenter } from "@/lib/notification-center";
import { useLanguage } from "@/lib/use-language";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface QueueEntry {
  id: string;
  queue_id: string;
  user_id: string;
  status: "waiting" | "served" | "excluded" | "called";
  position: number;
  joined_at: string;
  missed_turns: number;
}

export function useQueueRealtime(
  userId: string | undefined,
  onUpdate?: (entry: QueueEntry | null) => void
) {
  const { t } = useLanguage();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`queue-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "queue_entries",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as QueueEntry;

          if (updated.status === "excluded") {
            NotificationCenter.push(
              "excluded",
              t("notif.excluded_title"),
              t("notif.excluded_body")
            );
            onUpdate?.(null);
            return;
          }

          if (updated.status === "served") {
            NotificationCenter.push(
              "left",
              t("notif.served_title"),
              t("notif.served_body")
            );
            onUpdate?.(null);
            return;
          }

          if (updated.status === "waiting") {
            onUpdate?.(updated);

            if (updated.position === 1) {
              NotificationCenter.push(
                "your_turn",
                t("notif.your_turn_title"),
                t("notif.your_turn_body")
              );
            } else if (updated.position <= 3) {
              NotificationCenter.push(
                "approaching",
                t("notif.approaching_title"),
                t("notif.approaching_body", { position: updated.position })
              );
            } else if (updated.missed_turns > 0) {
              NotificationCenter.push(
                "missed",
                t("notif.missed_title"),
                t("notif.missed_body", {
                  missed: updated.missed_turns,
                  remaining: 3 - updated.missed_turns,
                })
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, t, onUpdate]);
}
