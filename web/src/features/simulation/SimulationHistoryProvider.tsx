import { createContext, useCallback, useContext, useState } from "react";
import type { Train } from "@/features/trains";
import type { DriverBehavior, StationStrategy } from "./types";

export type SimulationResult = {
  id: string;
  driverBehavior: DriverBehavior;
  stationStrategy: StationStrategy;
  trains: Record<string, Train>;
  completedAt: string;
};

const STORAGE_KEY = "simulation_history";
const MAX_HISTORY_SIZE = 20;

type SimulationHistoryContextType = {
  simulationHistory: SimulationResult[];
  addToHistory: (result: Omit<SimulationResult, "id" | "completedAt">) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
};

const SimulationHistoryContext =
  createContext<SimulationHistoryContextType | null>(null);

function loadHistory(): SimulationResult[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveHistory(history: SimulationResult[]): void {
  try {
    const limited = history.slice(-MAX_HISTORY_SIZE);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
  } catch (error) {
    console.error("Failed to save simulation history:", error);
  }
}

export const SimulationHistoryProvider = ({
  children,
}: React.PropsWithChildren) => {
  const [simulationHistory, setSimulationHistory] = useState<
    SimulationResult[]
  >(() => loadHistory());

  const addToHistory = useCallback(
    (result: Omit<SimulationResult, "id" | "completedAt">) => {
      const newResult: SimulationResult = {
        ...result,
        id: crypto.randomUUID(),
        completedAt: new Date().toISOString(),
      };

      setSimulationHistory((prev) => {
        const updated = [...prev, newResult];
        saveHistory(updated);
        return updated;
      });
    },
    [],
  );

  const removeFromHistory = useCallback((id: string) => {
    setSimulationHistory((prev) => {
      const updated = prev.filter((result) => result.id !== id);
      saveHistory(updated);
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setSimulationHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <SimulationHistoryContext.Provider
      value={{
        simulationHistory,
        addToHistory,
        removeFromHistory,
        clearHistory,
      }}
    >
      {children}
    </SimulationHistoryContext.Provider>
  );
};

export const useSimulationHistory = () => {
  const context = useContext(SimulationHistoryContext);
  if (!context) {
    throw new Error(
      "useSimulationHistory must be used within a SimulationHistoryProvider",
    );
  }
  return context;
};
