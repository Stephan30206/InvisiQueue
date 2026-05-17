import * as Location from "expo-location";

export async function getAddressFromCoords(
  lat: number,
  lng: number
): Promise<string> {
  try {
    const [place] = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lng,
    });

    if (!place) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    // Compose le nom selon ce qui est disponible
    const parts = [
      place.street,
      place.district ?? place.subregion,
      place.city,
    ].filter(Boolean);

    return parts.length > 0
      ? parts.join(", ")
      : place.region ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

// Position de l'utilisateur + nom
export async function getUserLocation(): Promise<{
  latitude: number;
  longitude: number;
  label: string;
} | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") return null;

  const coords = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const label = await getAddressFromCoords(
    coords.coords.latitude,
    coords.coords.longitude
  );

  return {
    latitude: coords.coords.latitude,
    longitude: coords.coords.longitude,
    label,
  };
}

export function distanceInMeters(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}