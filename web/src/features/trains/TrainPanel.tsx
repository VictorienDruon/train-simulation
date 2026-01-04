import { XIcon } from "lucide-react";
import { Button } from "@/components/ui";
import { useSimulation } from "@/features/simulation";
import { TrainEventInfo } from "./TrainEventInfo";
import { useTrainSelection } from "./TrainSelectionProvider";
import { TrainStopItem } from "./TrainStopItem";

export const TrainPanel = () => {
  const { state } = useSimulation();
  const { selectedTrainId, clearSelection } = useTrainSelection();

  const train = selectedTrainId && state?.trains[selectedTrainId];

  if (!train) {
    return null;
  }

  return (
    <div className="absolute top-4 left-4 z-10 flex max-h-[calc(100vh-2rem)] w-96 flex-col gap-4 rounded-xl border bg-background/60 p-4 shadow-lg backdrop-blur-lg">
      <div className="flex items-center justify-between">
        <h2 className="truncate font-semibold text-lg">{selectedTrainId}</h2>
        <Button variant="ghost" size="icon-sm" onClick={clearSelection}>
          <XIcon />
        </Button>
      </div>

      {train.event && <TrainEventInfo event={train.event} />}

      <div className="overflow-y-auto">
        {train.stops.map((stop, index) => (
          <TrainStopItem key={index} stop={stop} />
        ))}
      </div>
    </div>
  );
};
