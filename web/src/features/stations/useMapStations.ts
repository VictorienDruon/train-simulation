import type { GeoJSONSource, MapMouseEvent } from "mapbox-gl";
import { useEffect } from "react";
import { useStationSelection } from "./StationSelectionProvider";
import type { StationLocation } from "./useStationLocations";

const SOURCE_ID = "stations";
const LAYER_ID = "stations-layer";

type StationFeature = {
  id: string;
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: {
    stationId: string;
  };
};

function createStationFeatures(stations: StationLocation[]): StationFeature[] {
  return stations.reduce<StationFeature[]>((acc, s) => {
    acc.push({
      id: s.id,
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: s.coordinates,
      },
      properties: {
        stationId: s.id,
      },
    });
    return acc;
  }, []);
}

export function useMapStations(
  map: mapboxgl.Map | null,
  stations: StationLocation[],
) {
  const { selectStation, selectedStationId } = useStationSelection();

  useEffect(() => {
    if (!map) {
      return;
    }

    map.addSource(SOURCE_ID, {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [],
      },
    });

    map.addLayer({
      id: LAYER_ID,
      type: "circle",
      source: SOURCE_ID,
      paint: {
        "circle-radius": 4,
        "circle-color": "#ef4444",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
        "circle-opacity": 0.9,
      },
    });

    const handleClick = (e: MapMouseEvent) => {
      const stationId =
        e.features?.[0]?.properties?.stationId ||
        (e.features?.[0]?.id as string);
      if (stationId) {
        selectStation(stationId);
      }
    };
    map.on("click", LAYER_ID, handleClick);

    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    map.on("mouseenter", LAYER_ID, handleMouseEnter);

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "";
    };
    map.on("mouseleave", LAYER_ID, handleMouseLeave);

    return () => {
      if (map.getLayer(LAYER_ID)) {
        map.removeLayer(LAYER_ID);
      }
      if (map.getSource(SOURCE_ID)) {
        map.removeSource(SOURCE_ID);
      }
      map.off("click", LAYER_ID, handleClick);
      map.off("mouseenter", LAYER_ID, handleMouseEnter);
      map.off("mouseleave", LAYER_ID, handleMouseLeave);
    };
  }, [map, selectStation]);

  useEffect(() => {
    if (!map || !map.getLayer(LAYER_ID)) {
      return;
    }

    const selectedId = selectedStationId || "";
    map.setPaintProperty(LAYER_ID, "circle-radius", [
      "case",
      ["==", ["get", "stationId"], selectedId],
      8,
      4,
    ]);
    map.setPaintProperty(LAYER_ID, "circle-color", [
      "case",
      ["==", ["get", "stationId"], selectedId],
      "#dc2626",
      "#ef4444",
    ]);
    map.setPaintProperty(LAYER_ID, "circle-stroke-width", [
      "case",
      ["==", ["get", "stationId"], selectedId],
      3,
      2,
    ]);
  }, [map, selectedStationId]);

  useEffect(() => {
    if (!map) {
      return;
    }

    const source = map.getSource<GeoJSONSource>(SOURCE_ID);
    if (!source) {
      return;
    }

    const features = createStationFeatures(stations);
    source.setData({
      type: "FeatureCollection",
      features,
    });
  }, [map, stations]);
}
