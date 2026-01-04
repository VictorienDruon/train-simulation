import { useEffect, useState } from "react";

export type SegmentLocation = {
  fromStationId: string;
  toStationId: string;
  coordinates: [number, number][];
};

export function useSegmentLocations() {
  const [segmentLocations, setSegmentLocations] = useState<SegmentLocation[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/segment_locations.json")
      .then((response) => response.json())
      .then((data) => {
        setSegmentLocations(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load segment locations:", error);
        setIsLoading(false);
      });
  }, []);

  return { segmentLocations, isLoading };
}
