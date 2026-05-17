import { distanceInMeters, getUserLocation } from "@/lib/geo";
import { useEffect, useState } from "react";

const RADIUS_METERS = 500; 

export function useGeoAccess(queueLat?: number, queueLng?: number) {
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
    label: string;
  } | null>(null);
  const [canJoin, setCanJoin] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    getUserLocation()
      .then((loc) => {
        if (!loc) {
          setPermissionDenied(true);
          return;
        }
        setUserLocation(loc);

        if (queueLat !== undefined && queueLng !== undefined) {
          const d = distanceInMeters(
            loc.latitude, loc.longitude,
            queueLat, queueLng
          );
          setDistance(Math.round(d));
          setCanJoin(d <= RADIUS_METERS);
        }
      })
      .finally(() => setLoading(false));
  }, [queueLat, queueLng]);

  return { userLocation, canJoin, distance, loading, permissionDenied };
}