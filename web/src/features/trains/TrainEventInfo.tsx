import { AlertTriangleIcon } from "lucide-react";
import { formatTime } from "@/utils/dates";
import type { DelayCause, TrainEvent } from "./types";

function formatDelayCause(cause: DelayCause): string {
  const causeMap: Record<DelayCause, string> = {
    external: "Causes externes",
    infrastructure: "Infrastructure",
    traffic: "Gestion du trafic",
    rolling_stock: "Matériel roulant",
    station: "Gestion en gare",
    passenger: "Passenger",
  };
  return causeMap[cause];
}

type TrainEventInfoProps = {
  event: TrainEvent;
};

export const TrainEventInfo = ({ event }: TrainEventInfoProps) => {
  if (event.kind !== "delay") {
    return null;
  }

  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex items-start gap-2">
        <AlertTriangleIcon className="mt-0.5 size-4" />
        <div className="space-y-1">
          <div className="font-semibold text-foreground text-sm">
            Incident : {formatDelayCause(event.cause)}
          </div>
          <div className="space-y-0.5 text-muted-foreground text-xs">
            <div>
              Début :&nbsp;
              <span className="font-medium">{formatTime(event.startTime)}</span>
            </div>
            <div>
              Durée :&nbsp;
              <span className="font-medium">{formatTime(event.duration)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
