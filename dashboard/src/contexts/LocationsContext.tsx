import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { fetchLocations } from '../api/endpoints';
import type { Location } from '../types/location';

interface LocationsContextValue {
  locations: Location[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getLocationName: (id: string) => string;
}

const LocationsContext = createContext<LocationsContextValue | null>(null);

export function LocationsProvider({ children }: { children: ReactNode }) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setLocations(await fetchLocations());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const getLocationName = useCallback(
    (id: string) => locations.find((l) => l.id === id)?.businessName ?? id,
    [locations],
  );

  const value = useMemo(
    () => ({ locations, loading, error, refresh, getLocationName }),
    [locations, loading, error, refresh, getLocationName],
  );

  return (
    <LocationsContext.Provider value={value}>{children}</LocationsContext.Provider>
  );
}

export function useLocations() {
  const ctx = useContext(LocationsContext);
  if (!ctx) {
    throw new Error('useLocations must be used within LocationsProvider');
  }
  return ctx;
}
