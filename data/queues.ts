import { getDistanceInMeters, QUEUE_RADIUS_METERS } from "@/lib/location";
import { supabase } from "@/lib/supabase";
import { Queue } from "@/types";

export const getQueuesNearby = async (
  userLat: number,
  userLng: number
): Promise<Queue[]> => {
  const { data, error } = await supabase
    .from("queues")
    .select("*, queue_entries(count)");

  if (error || !data) return [];

  return data
    .map((q: any) => ({
      ...q,
      waiting_count: q.queue_entries?.[0]?.count ?? 0,
      distance_meters: getDistanceInMeters(userLat, userLng, q.lat, q.lng),
    }))
    .filter((q: Queue) => q.distance_meters! <= QUEUE_RADIUS_METERS)
    .sort((a: Queue, b: Queue) => a.distance_meters! - b.distance_meters!);
};

export const createQueue = async (
  name: string,
  lat: number,
  lng: number,
  userId: string,
  locationLabel?: string,
  city?: string,
  country?: string
): Promise<Queue | null> => {
  const { data, error } = await supabase
    .from("queues")
    .insert({
      name,
      lat,
      lng,
      location_label: locationLabel,
      city,
      country,
      created_by: userId,
    })
    .select()
    .single();

  if (error) return null;
  return data;
};
