import { XIcon } from "lucide-react";
import { Button } from "@/components/ui";
import { useSimulation } from "@/features/simulation";
import { useStationSelection } from "./StationSelectionProvider";
import { StationTrainItem } from "./StationTrainItem";

export const StationPanel = () => {
  const { state } = useSimulation();
  const { selectedStationId, clearSelection } = useStationSelection();

  const station = selectedStationId && state?.stations[selectedStationId];

  if (!station) {
    return null;
  }

  const trainsInStation = Object.entries(station.trainsInStation);

  return (
    <div className="absolute top-4 right-4 z-10 flex max-h-[calc(100vh-2rem)] w-96 max-w-[calc(100%-2rem)] flex-col rounded-xl border bg-background/60 p-4 shadow-lg backdrop-blur-lg">
      <div className="flex items-center justify-between">
        <h2 className="truncate font-semibold text-lg">{station.name}</h2>
        <Button variant="ghost" size="icon-sm" onClick={clearSelection}>
          <XIcon />
        </Button>
      </div>

      <div className="mb-4 text-muted-foreground text-sm">
        Capacité: {trainsInStation.length}/{station.capacity}
      </div>

      <div className="overflow-y-auto">
        {trainsInStation.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            Aucun train en gare
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {trainsInStation.map(([trainId, trainInfo]) => (
              <StationTrainItem
                key={trainId}
                trainId={trainId}
                trainInfo={trainInfo}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
