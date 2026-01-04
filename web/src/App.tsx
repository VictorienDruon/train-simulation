import {
  AnalyticsDialog,
  SimulationControls,
  SimulationMap,
  SimulationProvider,
  StartDialog,
} from "@/features/simulation";
import { SimulationHistoryProvider } from "@/features/simulation/SimulationHistoryProvider";
import { StationPanel, StationSelectionProvider } from "@/features/stations";
import { TrainPanel, TrainSelectionProvider } from "@/features/trains";

export default function App() {
  return (
    <SimulationHistoryProvider>
      <SimulationProvider>
        <StationSelectionProvider>
          <TrainSelectionProvider>
            <div className="relative h-screen w-full">
              <SimulationMap />
              <SimulationControls />
              <StationPanel />
              <TrainPanel />
              <StartDialog />
              <AnalyticsDialog />
            </div>
          </TrainSelectionProvider>
        </StationSelectionProvider>
      </SimulationProvider>
    </SimulationHistoryProvider>
  );
}
