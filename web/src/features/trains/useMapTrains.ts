import type { GeoJSONSource, MapMouseEvent } from "mapbox-gl";
import { useEffect } from "react";
import type { SegmentLocation } from "@/features/segments";
import type { Simulation } from "../simulation/types";
import { useTrainSelection } from "./TrainSelectionProvider";
import type { Train } from "./types";

const SOURCE_ID = "trains";
const LAYER_ID = "trains-layer";

type TrainFeature = {
  id: string;
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: {
    trainId: string;
    hasActiveDelay: boolean;
  };
};

function getPositionAlongLine(
  coordinates: [number, number][],
  positionMeters: number,
  segmentLengthMeters: number,
): [number, number] {
  const ratio = Math.max(0, Math.min(1, positionMeters / segmentLengthMeters));

  const totalSegments = coordinates.length - 1;
  const index = ratio * totalSegments;
  const segmentIndex = Math.floor(index);
  const segmentRatio = index - segmentIndex;

  const clampedSegmentIndex = Math.min(segmentIndex, totalSegments - 1);
  const coord1 = coordinates[clampedSegmentIndex];
  const coord2 = coordinates[clampedSegmentIndex + 1];

  const lng = coord1![0] + (coord2![0] - coord1![0]) * segmentRatio;
  const lat = coord1![1] + (coord2![1] - coord1![1]) * segmentRatio;

  return [lng, lat];
}

function isDelayActive(train: Train, currentTime: number): boolean {
  if (train.event.kind !== "delay") {
    return false;
  }
  const { startTime, duration } = train.event;
  return currentTime >= startTime && currentTime < startTime + duration;
}

function createTrainFeatures(
  locations: SegmentLocation[],
  state: Simulation,
): TrainFeature[] {
  return locations.reduce<TrainFeature[]>((acc, location) => {
    const forwardSegmentId = `${location.fromStationId}-${location.toStationId}`;
    const forwardSegment = state.segments[forwardSegmentId];
    if (forwardSegment) {
      Object.entries(forwardSegment.trainsOnSegment).forEach(
        ([trainId, trainInfo]) => {
          const train = state.trains[trainId];
          const hasActiveDelay = train
            ? isDelayActive(train, state.currentTime)
            : false;
          const position = getPositionAlongLine(
            location.coordinates,
            trainInfo.position,
            forwardSegment.length,
          );
          acc.push({
            id: trainId,
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: position,
            },
            properties: {
              trainId,
              hasActiveDelay,
            },
          });
        },
      );
    }

    const reverseSegmentId = `${location.toStationId}-${location.fromStationId}`;
    const reverseSegment = state.segments[reverseSegmentId];
    if (reverseSegment) {
      Object.entries(reverseSegment.trainsOnSegment).forEach(
        ([trainId, trainInfo]) => {
          const train = state.trains[trainId];
          const hasActiveDelay = train
            ? isDelayActive(train, state.currentTime)
            : false;
          const positionFromStart = reverseSegment.length - trainInfo.position;
          const position = getPositionAlongLine(
            location.coordinates,
            positionFromStart,
            reverseSegment.length,
          );
          acc.push({
            id: trainId,
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: position,
            },
            properties: {
              trainId,
              hasActiveDelay,
            },
          });
        },
      );
    }

    return acc;
  }, []);
}

export function useMapTrains(
  map: mapboxgl.Map | null,
  locations: SegmentLocation[],
  state: Simulation | null,
) {
  const { selectTrain, selectedTrainId } = useTrainSelection();

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
        "circle-radius": 6,
        "circle-color": "#10b981",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
        "circle-opacity": 0.9,
      },
    });

    const handleClick = (e: MapMouseEvent) => {
      const trainId = e.features?.[0]?.properties?.trainId;
      if (trainId) {
        selectTrain(trainId);
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
  }, [map, selectTrain]);

  useEffect(() => {
    if (!map || !map.getLayer(LAYER_ID)) {
      return;
    }

    const selectedId = selectedTrainId || "";
    map.setPaintProperty(LAYER_ID, "circle-radius", [
      "case",
      ["==", ["get", "trainId"], selectedId],
      10,
      6,
    ]);
    map.setPaintProperty(LAYER_ID, "circle-color", [
      "case",
      ["get", "hasActiveDelay"],
      "#eab308",
      ["==", ["get", "trainId"], selectedId],
      "#059669",
      "#10b981",
    ]);
    map.setPaintProperty(LAYER_ID, "circle-stroke-width", [
      "case",
      ["==", ["get", "trainId"], selectedId],
      3,
      2,
    ]);
  }, [map, selectedTrainId]);

  useEffect(() => {
    if (!map || !state) {
      return;
    }

    const source = map.getSource<GeoJSONSource>(SOURCE_ID);
    if (!source) {
      return;
    }

    const features = createTrainFeatures(locations, state);
    source.setData({
      type: "FeatureCollection",
      features,
    });
  }, [map, locations, state]);
}
