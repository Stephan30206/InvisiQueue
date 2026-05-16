import { useEffect, useState } from "react";
import { getCurrentPositionWithName, LocationData } from "@/lib/location";

interface UseLocationReturn {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCurrentPositionWithName();
      if (data) {
        setLocation(data);
      } else {
        setError("Location permission denied");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get location");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  return {
    location,
    loading,
    error,
    refresh: fetchLocation,
  };
}
