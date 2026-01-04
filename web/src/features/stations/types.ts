export type StationTrainInfo = {
  entryTime: number;
};
export type Station = {
  id: string;
  name: string;
  capacity: number;
  trainsInStation: Record<string, StationTrainInfo>;
};
