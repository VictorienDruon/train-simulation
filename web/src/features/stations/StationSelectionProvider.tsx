import { createContext, useCallback, useContext, useState } from "react";

type StationSelectionContextType = {
  selectedStationId: string | null;
  selectStation: (stationId: string) => void;
  clearSelection: () => void;
};

const StationSelectionContext =
  createContext<StationSelectionContextType | null>(null);

export const StationSelectionProvider = ({
  children,
}: React.PropsWithChildren) => {
  const [selectedStationId, setSelectedStationId] = useState<string | null>(
    null,
  );

  const selectStation = useCallback((stationId: string) => {
    setSelectedStationId(stationId);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedStationId(null);
  }, []);

  return (
    <StationSelectionContext.Provider
      value={{
        selectedStationId,
        selectStation,
        clearSelection,
      }}
    >
      {children}
    </StationSelectionContext.Provider>
  );
};

export const useStationSelection = () => {
  const context = useContext(StationSelectionContext);
  if (!context) {
    throw new Error(
      "useStationSelection must be used within a StationSelectionProvider",
    );
  }
  return context;
};
