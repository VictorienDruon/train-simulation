import { useTrainSelection } from "@/features/trains";
import { formatTime } from "@/utils/dates";
import type { StationTrainInfo } from "./types";

type StationTrainItemProps = {
  trainId: string;
  trainInfo: StationTrainInfo;
};

export const StationTrainItem = ({
  trainId,
  trainInfo,
}: StationTrainItemProps) => {
  const { selectTrain } = useTrainSelection();

  return (
    <button
      type="button"
      className="rounded-lg border bg-background p-3 text-left transition-colors hover:border-primary"
      onClick={() => selectTrain(trainId)}
    >
      <div className="truncate font-semibold text-sm">Train {trainId}</div>
      <div className="text-muted-foreground text-xs">
        Entrée: {formatTime(trainInfo.entryTime)}
      </div>
    </button>
  );
};
