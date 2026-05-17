import * as Location from "expo-location";

export async function getAddressFromCoords(
  lat: number,
  lng: number
): Promise<string> {
  try {
    // Essayer d'abord avec Expo Location
    const [place] = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lng,
    });

    if (place) {
      const parts = [
        place.street,
        place.district ?? place.subregion,
        place.city,
      ].filter(Boolean);

      if (parts.length > 0) {
        return parts.join(", ");
      }
      if (place.region) {
        return place.region;
      }
    }
  } catch {
    // Continue vers le fallback
  }

  // Fallback: utiliser Nominatim (OpenStreetMap)
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await response.json();

    if (data.address) {
      const { road, village, city, town, county, state } = data.address;
      const parts = [road, village || city || town, county, state].filter(Boolean);
      if (parts.length > 0) {
        return parts.slice(0, 2).join(", ");
      }
    }

    return data.name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
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
