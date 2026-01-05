import type { Segment } from "@/features/segments";
import type { Station } from "@/features/stations";
import type { Train } from "@/features/trains";

export type DriverBehavior =
  | "eco"
  | "intermediate"
  | "crazy"
  | "very_crazy"
  | "soigneux";

export type StationStrategy =
  | "no_sort"
  | "entry_time_asc"
  | "delay_asc"
  | "delay_asc_with_threshold";

export type Simulation = {
  isStarted: boolean;
  isFinished: boolean;
  currentTime: number;
  driverBehavior: DriverBehavior;
  stationStrategy: StationStrategy;
  trains: Record<string, Train>;
  stations: Record<string, Station>;
  segments: Record<string, Segment>;
};
