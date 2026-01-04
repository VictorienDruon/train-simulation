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
import { useStationSelection } from "@/features/stations/StationSelectionProvider";
import { formatDelay } from "@/utils/numbers";
import { useSimulation } from "../../SimulationProvider";

type StationDelay = {
  stationId: string;
  stationName: string;
  averageDelayMinutes: number;
  stopCount: number;
};

export const MostDelayedStationsCard = () => {
  const { state, setIsAnalyticsDialogOpen } = useSimulation();
  const { selectStation } = useStationSelection();

  const topDelayedStations = useMemo(() => {
    if (!state?.trains || !state?.stations) return [];

    const stationDelays: Record<string, number[]> = {};

    Object.values(state.trains).forEach((train) => {
      train.stops.forEach((stop, index) => {
        if (index > 0 && stop.arrivedAt !== null) {
          const delayNanoseconds = stop.arrivedAt - stop.arrival;
          const delayMinutes = delayNanoseconds / 1_000_000_000 / 60;

          if (!stationDelays[stop.stationId]) {
            stationDelays[stop.stationId] = [];
          }
          stationDelays[stop.stationId]!.push(delayMinutes);
        }
      });
    });

    const stationsWithDelay: StationDelay[] = Object.entries(stationDelays)
      .map(([stationId, delays]) => {
        const averageDelay =
          delays.reduce((sum, d) => sum + d, 0) / delays.length;
        const station = state.stations[stationId];
        return {
          stationId,
          stationName: station?.name || stationId,
          averageDelayMinutes: averageDelay,
          stopCount: delays.length,
        };
      })
      .filter((station) => station.stopCount > 0);

    return stationsWithDelay
      .sort((a, b) => b.averageDelayMinutes - a.averageDelayMinutes)
      .slice(0, 5);
  }, [state?.trains, state?.stations]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gares les plus en retard</CardTitle>
        <CardDescription>
          Classement des gares selon le retard moyen à l'arrivée de tous les
          trains (en minutes)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {topDelayedStations.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Aucun arrêt n'a été effectué dans les gares
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Gare</TableHead>
                <TableHead className="text-right">Retard moyen</TableHead>
                <TableHead className="text-right">Arrêts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topDelayedStations.map((station, index) => (
                <TableRow
                  key={station.stationId}
                  className="cursor-pointer"
                  onClick={() => {
                    selectStation(station.stationId);
                    setIsAnalyticsDialogOpen(false);
                  }}
                >
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{station.stationName}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatDelay(station.averageDelayMinutes)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {station.stopCount}
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
