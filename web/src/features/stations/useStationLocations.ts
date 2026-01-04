import { useEffect, useState } from "react";

export type StationLocation = {
  id: string;
  coordinates: [number, number];
};

export function useStationLocations() {
  const [stationLocations, setStationLocations] = useState<StationLocation[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/station_locations.json")
      .then((response) => response.json())
      .then((data) => {
        setStationLocations(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load station locations:", error);
        setIsLoading(false);
      });
  }, []);

  return { stationLocations, isLoading };
}
