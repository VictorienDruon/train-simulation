import { createContext, useCallback, useContext, useState } from "react";

type TrainSelectionContextType = {
  selectedTrainId: string | null;
  selectTrain: (trainId: string) => void;
  clearSelection: () => void;
};

const TrainSelectionContext = createContext<TrainSelectionContextType | null>(
  null,
);

export const TrainSelectionProvider = ({
  children,
}: React.PropsWithChildren) => {
  const [selectedTrainId, setSelectedTrainId] = useState<string | null>(null);

  const selectTrain = useCallback((trainId: string) => {
    setSelectedTrainId(trainId);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedTrainId(null);
  }, []);

  return (
    <TrainSelectionContext.Provider
      value={{
        selectedTrainId,
        selectTrain,
        clearSelection,
      }}
    >
      {children}
    </TrainSelectionContext.Provider>
  );
};

export const useTrainSelection = () => {
  const context = useContext(TrainSelectionContext);
  if (!context) {
    throw new Error(
      "useTrainSelection must be used within a TrainSelectionProvider",
    );
  }
  return context;
};
