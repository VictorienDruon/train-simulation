export type TrainStop = {
  stationId: string;
  arrival: number;
  arrivedAt: number | null;
  departure: number;
  departedAt: number | null;
};

export type DelayCause =
  | "external"
  | "infrastructure"
  | "traffic"
  | "rolling_stock"
  | "station"
  | "passenger";

export type DelayEvent = {
  kind: "delay";
  cause: DelayCause;
  duration: number;
  startTime: number;
};

export type CancellationEvent = {
  kind: "cancellation";
  startTime: number;
};

export type NoEvent = {
  kind: "none";
};

export type TrainEvent = DelayEvent | CancellationEvent | NoEvent;

export type Train = {
  id: string;
  stops: TrainStop[];
  event: TrainEvent;
};
