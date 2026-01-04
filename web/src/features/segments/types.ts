export type SegmentTrainInfo = {
  position: number; // meters
  speed: number; // m/min
  entryTime: number;
};

export type Segment = {
  id: string;
  fromStationId: string;
  toStationId: string;
  length: number; // meters
  maxSpeed: number; // m/min
  trainsOnSegment: Record<string, SegmentTrainInfo>;
};
