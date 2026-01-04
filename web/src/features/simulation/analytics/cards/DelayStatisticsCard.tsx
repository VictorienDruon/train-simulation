import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDelay } from "@/utils/numbers";
import { useSimulation } from "../../SimulationProvider";

export const DelayStatisticsCard = () => {
  const { state } = useSimulation();

  const statistics = useMemo(() => {
    if (!state?.trains) {
      return {
        count: 0,
        mean: 0,
        median: 0,
        stdDev: 0,
        min: 0,
        max: 0,
        q1: 0,
        q3: 0,
      };
    }

    const delays: number[] = [];

    Object.values(state.trains).forEach((train) => {
      train.stops.forEach((stop, index) => {
        if (index > 0 && stop.arrivedAt !== null) {
          const delayNanoseconds = stop.arrivedAt - stop.arrival;
          const delayMinutes = delayNanoseconds / 1_000_000_000 / 60;
          delays.push(delayMinutes);
        }
      });
    });

    if (delays.length === 0) {
      return {
        count: 0,
        mean: 0,
        median: 0,
        stdDev: 0,
        min: 0,
        max: 0,
        q1: 0,
        q3: 0,
      };
    }

    const sortedDelays = [...delays].sort((a, b) => a - b);

    const mean = delays.reduce((sum, d) => sum + d, 0) / delays.length;

    const variance =
      delays.reduce((sum, d) => sum + (d - mean) ** 2, 0) / delays.length;
    const stdDev = Math.sqrt(variance);

    const median =
      sortedDelays.length % 2 === 0
        ? (sortedDelays[sortedDelays.length / 2 - 1]! +
            sortedDelays[sortedDelays.length / 2]!) /
          2
        : sortedDelays[Math.floor(sortedDelays.length / 2)]!;

    const q1Index = Math.floor(sortedDelays.length * 0.25);
    const q3Index = Math.floor(sortedDelays.length * 0.75);
    const q1 = sortedDelays[q1Index]!;
    const q3 = sortedDelays[q3Index]!;

    const min = sortedDelays[0]!;
    const max = sortedDelays[sortedDelays.length - 1]!;

    return {
      count: delays.length,
      mean,
      median,
      stdDev,
      min,
      max,
      q1,
      q3,
    };
  }, [state?.trains]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistiques de retard d'arrivée</CardTitle>
        <CardDescription>
          Analyse des retards à l'arrivée pour tous les arrêts effectués (en
          minutes)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {statistics.count === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Aucun arrêt effectué
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-muted-foreground text-sm">
                  Nombre d'arrêts
                </div>
                <div className="font-semibold text-xl">{statistics.count}</div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground text-sm">Moyenne</div>
                <div className="font-semibold text-xl">
                  {formatDelay(statistics.mean)}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground text-sm">Médiane</div>
                <div className="font-semibold text-xl">
                  {formatDelay(statistics.median)}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground text-sm">Écart-type</div>
                <div className="font-semibold text-xl">
                  {formatDelay(statistics.stdDev)}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground text-sm">Minimum</div>
                <div className="font-semibold text-xl">
                  {formatDelay(statistics.min)}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground text-sm">Maximum</div>
                <div className="font-semibold text-xl">
                  {formatDelay(statistics.max)}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground text-sm">
                  1er quartile (Q1)
                </div>
                <div className="font-semibold text-xl">
                  {formatDelay(statistics.q1)}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground text-sm">
                  3ème quartile (Q3)
                </div>
                <div className="font-semibold text-xl">
                  {formatDelay(statistics.q3)}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
