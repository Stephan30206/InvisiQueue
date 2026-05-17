import * as Location from "expo-location";

export const QUEUE_RADIUS_METERS = 500; // rayon max pour rejoindre une file

export const requestLocationPermission = async (): Promise<boolean> => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted";
};

export const getCurrentPosition = async (): Promise<{
  lat: number;
  lng: number;
} | null> => {
  const granted = await requestLocationPermission();
  if (!granted) return null;

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    lat: location.coords.latitude,
    lng: location.coords.longitude,
  };
};

// Calcul de distance Haversine en mètres
export const getDistanceInMeters = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const isWithinRadius = (
  userLat: number,
  userLng: number,
  queueLat: number,
  queueLng: number
): boolean => {
  return (
    getDistanceInMeters(userLat, userLng, queueLat, queueLng) <=
    QUEUE_RADIUS_METERS
  );
};