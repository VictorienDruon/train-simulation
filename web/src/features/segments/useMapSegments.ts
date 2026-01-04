import type { GeoJSONSource } from "mapbox-gl";
import { useEffect } from "react";
import type { SegmentLocation } from "./useSegmentLocations";

const SOURCE_ID = "segments";
const LAYER_ID = "segments-layer";

type SegmentFeature = {
  id: string;
  type: "Feature";
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
  properties: Record<string, never>;
};

function createSegmentFeatures(segments: SegmentLocation[]): SegmentFeature[] {
  return segments.reduce<SegmentFeature[]>((acc, s) => {
    acc.push({
      id: `${s.fromStationId}-${s.toStationId}`,
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: s.coordinates,
      },
      properties: {},
    });
    return acc;
  }, []);
}

export function useMapSegments(
  map: mapboxgl.Map | null,
  segments: SegmentLocation[],
) {
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
      type: "line",
      source: SOURCE_ID,
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#3b82f6",
        "line-width": 2,
        "line-opacity": 1,
      },
    });

    return () => {
      if (map.getLayer(LAYER_ID)) {
        map.removeLayer(LAYER_ID);
      }
      if (map.getSource(SOURCE_ID)) {
        map.removeSource(SOURCE_ID);
      }
    };
  }, [map]);

  useEffect(() => {
    if (!map) {
      return;
    }

    const source = map.getSource<GeoJSONSource>(SOURCE_ID);
    if (!source) {
      return;
    }

    const features = createSegmentFeatures(segments);
    source.setData({
      type: "FeatureCollection",
      features,
    });
  }, [map, segments]);
}
