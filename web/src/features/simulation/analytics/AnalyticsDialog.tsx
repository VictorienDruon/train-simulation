import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { useSimulation } from "../SimulationProvider";
import { AverageDelayByCauseCard } from "./cards/AverageDelayByCauseCard";
import { ConfigurationComparisonCard } from "./cards/ConfigurationComparisonCard";
import { DelayByCauseCard } from "./cards/DelayByCauseCard";
import { DelayDistributionCard } from "./cards/DelayDistributionCard";
import { DelayStatisticsCard } from "./cards/DelayStatisticsCard";
import { EventDistributionCard } from "./cards/EventDistributionCard";
import { MostDelayedStationsCard } from "./cards/MostDelayedStationsCard";
import { MostDelayedTrainsCard } from "./cards/MostDelayedTrainsCard";

export const AnalyticsDialog = () => {
  const { isAnalyticsDialogOpen, setIsAnalyticsDialogOpen } = useSimulation();

  function closeAnalytics() {
    setIsAnalyticsDialogOpen(false);
  }

  return (
    <Dialog
      open={isAnalyticsDialogOpen}
      onOpenChange={setIsAnalyticsDialogOpen}
    >
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[90vh] flex-col px-0 sm:max-w-[90vw]"
      >
        <DialogHeader className="px-6">
          <DialogTitle>Analyse de la simulation</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 overflow-y-auto border-y bg-muted px-6 py-4 md:grid-cols-2 lg:grid-cols-3">
          <DelayStatisticsCard />
          <DelayDistributionCard />
          <MostDelayedTrainsCard />
          <MostDelayedStationsCard />
          <EventDistributionCard />
          <DelayByCauseCard />
          <AverageDelayByCauseCard />
          <ConfigurationComparisonCard />
        </div>

        <DialogFooter className="px-6">
          <Button variant="outline" onClick={closeAnalytics}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
