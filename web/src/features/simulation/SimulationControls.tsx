import {
  BarChart3Icon,
  ClockIcon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  SkipForwardIcon,
} from "lucide-react";
import { Button, ButtonGroup } from "@/components/ui";
import { formatTime } from "@/utils/dates";
import { useSimulation } from "./SimulationProvider";

export const SimulationControls = () => {
  const {
    state,
    isPlaying,
    setIsPlaying,
    setIsAnalyticsDialogOpen,
    nextTick,
    restart,
  } = useSimulation();

  function togglePlay() {
    setIsPlaying(!isPlaying);
  }

  function openAnalytics() {
    setIsPlaying(false);
    setIsAnalyticsDialogOpen(true);
  }

  if (!state) {
    return null;
  }

  return (
    <div className="-translate-x-1/2 absolute bottom-4 left-1/2 z-10 flex max-w-[calc(100%-2rem)] items-center gap-8 rounded-xl border bg-background/60 px-4 py-2 shadow-lg backdrop-blur-lg">
      <ButtonGroup>
        <Button
          onClick={togglePlay}
          variant="outline"
          size="icon"
          disabled={state.isFinished}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </Button>

        <Button
          variant="outline"
          size="icon"
          disabled={state.isFinished || isPlaying}
          onClick={nextTick}
        >
          <SkipForwardIcon />
        </Button>
      </ButtonGroup>

      <div className="flex items-center gap-2 font-semibold">
        <ClockIcon className="size-4" />
        <span className="text-right tabular-nums">
          {formatTime(state.currentTime)}
        </span>
      </div>

      <ButtonGroup>
        <Button variant="outline" size="icon" onClick={openAnalytics}>
          <BarChart3Icon />
        </Button>
        <Button variant="outline" size="icon" onClick={restart}>
          <RotateCcwIcon />
        </Button>
      </ButtonGroup>
    </div>
  );
};
