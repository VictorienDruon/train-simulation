import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useSimulationHistory } from "./SimulationHistoryProvider";
import type { DriverBehavior, Simulation, StationStrategy } from "./types";

type SimulationContextType = {
  state: Simulation | null;
  start: (
    driverBehavior: DriverBehavior,
    stationStrategy: StationStrategy,
  ) => void;
  nextTick: () => void;
  restart: () => void;
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
  isStartDialogOpen: boolean;
  setIsStartDialogOpen: (open: boolean) => void;
  isAnalyticsDialogOpen: boolean;
  setIsAnalyticsDialogOpen: (open: boolean) => void;
};

const SimulationContext = createContext<SimulationContextType | null>(null);

export function startSimulation(
  driverBehavior: DriverBehavior,
  stationStrategy: StationStrategy,
): Simulation {
  const newState = window.Start(driverBehavior, stationStrategy);
  return JSON.parse(newState);
}

export function tickSimulation(): Simulation {
  const newState = window.Tick();
  return JSON.parse(newState);
}

export const SimulationProvider = ({ children }: React.PropsWithChildren) => {
  const [state, setState] = useState<Simulation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(true);
  const [isAnalyticsDialogOpen, setIsAnalyticsDialogOpen] = useState(false);
  const { addToHistory } = useSimulationHistory();

  const start = useCallback(
    (driver: DriverBehavior, station: StationStrategy) => {
      setState(startSimulation(driver, station));
      setIsPlaying(true);
      setIsStartDialogOpen(false);
    },
    [],
  );

  const nextTick = useCallback(() => {
    setState(tickSimulation());
  }, []);

  const restart = useCallback(() => {
    setState(null);
    setIsPlaying(false);
    setIsStartDialogOpen(true);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      let shouldContinue = true;

      const tick = () => {
        if (shouldContinue) {
          nextTick();
          setTimeout(tick, 16);
        }
      };

      tick();

      return () => {
        shouldContinue = false;
      };
    }
  }, [isPlaying, nextTick]);

  useEffect(() => {
    if (state?.isFinished && isPlaying) {
      setIsPlaying(false);
      setIsAnalyticsDialogOpen(true);
      addToHistory({
        driverBehavior: state.driverBehavior,
        stationStrategy: state.stationStrategy,
        trains: state.trains,
      });
    }
  }, [state, isPlaying, addToHistory]);

  return (
    <SimulationContext.Provider
      value={{
        state,
        start,
        nextTick,
        restart,
        isPlaying,
        setIsPlaying,
        isStartDialogOpen,
        setIsStartDialogOpen,
        isAnalyticsDialogOpen,
        setIsAnalyticsDialogOpen,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error("useSimulation must be used within a SimulationProvider");
  }
  return context;
};
