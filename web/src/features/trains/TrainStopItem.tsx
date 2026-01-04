import { useSimulation } from "@/features/simulation";
import { useStationSelection } from "@/features/stations";
import { cn } from "@/utils/cn";
import { formatTime } from "@/utils/dates";
import type { TrainStop } from "./types";

type TrainStopItemProps = {
  stop: TrainStop;
};

export const TrainStopItem = ({ stop }: TrainStopItemProps) => {
  const { state } = useSimulation();
  const { selectStation } = useStationSelection();
  const station = state?.stations[stop.stationId];

  return (
    <div className="group flex gap-4">
      <div className="space-y-2 group-not-last:mb-8">
        <TimeDisplay
          planned={stop.arrival}
          actual={stop.arrivedAt}
          className="group-first:hidden"
        />
        <TimeDisplay
          planned={stop.departure}
          actual={stop.departedAt}
          className="group-last:hidden"
        />
      </div>

      <div className="flex flex-col items-center">
        <div
          className={cn(
            "size-6 shrink-0 rounded-full border-2 border-primary",
            stop.arrivedAt !== null ? "bg-primary" : "bg-background",
          )}
        />
        <div className="h-full w-0.5 bg-primary group-last:hidden" />
      </div>

      <button
        type="button"
        className="self-start truncate text-left font-semibold"
        onClick={() => selectStation(stop.stationId)}
      >
        {station?.name || stop.stationId}
      </button>
    </div>
  );
};

type TimeDisplayProps = {
  planned: number;
  actual: number | null;
  className?: string;
};

const TimeDisplay = ({ planned, actual, className }: TimeDisplayProps) => {
  const delay =
    actual !== null
      ? Math.floor((actual - planned) / 1_000_000_000 / 60)
      : null;
  const isDelayed = actual !== null && delay !== null && delay > 0;

  return (
    <div className={cn("font-medium text-sm tabular-nums", className)}>
      <div
        className={cn(
          isDelayed && "text-destructive text-xs leading-none line-through",
        )}
      >
        {formatTime(planned)}
      </div>
      {isDelayed && (
        <div className="text-destructive">{formatTime(actual)}</div>
      )}
    </div>
  );
};
