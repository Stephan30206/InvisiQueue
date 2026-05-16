export type Queue = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  location_label?: string; // e.g., "Analakely, Antananarivo"
  city?: string;
  country?: string;
  created_by: string | null;
  created_at: string;
  // champ calculé côté client
  waiting_count?: number;
  distance_meters?: number;
};

export type QueueEntryStatus =
  | "waiting"
  | "served"
  | "missed"
  | "left"
  | "excluded";

export type QueueEntry = {
  id: string;
  queue_id: string;
  name: string;
  email: string;
  user_id: string | null;
  position: number;
  status: QueueEntryStatus;
  missed_count: number;
  joined_at: string;
};
