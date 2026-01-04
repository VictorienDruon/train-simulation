import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMapSegments, useSegmentLocations } from "@/features/segments";
import { useMapStations, useStationLocations } from "@/features/stations";
import { useMapTrains } from "@/features/trains";
import { useSimulation } from "./SimulationProvider";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export const SimulationMap = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const { state } = useSimulation();
  const { segmentLocations } = useSegmentLocations();
  const { stationLocations } = useStationLocations();

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      center: [4.5, 46.5],
      zoom: 5.5,
      style: "mapbox://styles/mapbox/streets-v12",
    });

    map.on("style.load", () => {
      mapRef.current = map;
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useMapSegments(mapRef.current, segmentLocations);
  useMapStations(mapRef.current, stationLocations);
  useMapTrains(mapRef.current, segmentLocations, state);

  return <div ref={mapContainerRef} className="h-full w-full" />;
};
