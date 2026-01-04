import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTrainSelection } from "@/features/trains/TrainSelectionProvider";
import { formatDelay } from "@/utils/numbers";
import { useSimulation } from "../../SimulationProvider";

type TrainDelay = {
  trainId: string;
  delayMinutes: number;
};

export const MostDelayedTrainsCard = () => {
  const { state, setIsAnalyticsDialogOpen } = useSimulation();
  const { selectTrain } = useTrainSelection();

  const topDelayedTrains = useMemo(() => {
    if (!state?.trains) return [];

    const trainDelays: TrainDelay[] = [];

    Object.values(state.trains).forEach((train) => {
      let lastCompletedStop = null;
      for (let i = train.stops.length - 1; i > 0; i--) {
        if (train.stops[i]?.arrivedAt !== null) {
          lastCompletedStop = train.stops[i];
          break;
        }
      }

      if (lastCompletedStop) {
        const delayNanoseconds =
          lastCompletedStop.arrivedAt! - lastCompletedStop.arrival;
        const delayMinutes = delayNanoseconds / 1_000_000_000 / 60;
        trainDelays.push({
          trainId: train.id,
          delayMinutes,
        });
      }
    });

    return trainDelays
      .sort((a, b) => b.delayMinutes - a.delayMinutes)
      .slice(0, 5);
  }, [state?.trains]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trains les plus en retard</CardTitle>
        <CardDescription>
          Classement des trains selon leur retard au dernier arrêt effectué (en
          minutes)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {topDelayedTrains.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Aucun train n'a effectué d'arrêt
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Train</TableHead>
                <TableHead className="text-right">Retard</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topDelayedTrains.map((train, index) => (
                <TableRow
                  key={train.trainId}
                  className="cursor-pointer"
                  onClick={() => {
                    selectTrain(train.trainId);
                    setIsAnalyticsDialogOpen(false);
                  }}
                >
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {train.trainId}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatDelay(train.delayMinutes)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
