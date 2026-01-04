import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useSimulation } from "../../SimulationProvider";

type DelayBin = {
  range: string;
  count: number;
  fill: string;
};

export const DelayDistributionCard = () => {
  const { state } = useSimulation();

  const data = useMemo(() => {
    if (!state?.trains) {
      return [];
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
      return [];
    }

    const maxDelay = Math.max(...delays);
    const minDelay = Math.min(...delays);

    const range = maxDelay - minDelay;
    let binSize: number;

    if (range <= 10) {
      binSize = 1;
    } else if (range <= 30) {
      binSize = 2;
    } else if (range <= 60) {
      binSize = 5;
    } else if (range <= 120) {
      binSize = 10;
    } else {
      binSize = 15;
    }

    const bins: Map<number, number> = new Map();
    const startBin = Math.floor(minDelay / binSize) * binSize;
    const endBin = Math.ceil(maxDelay / binSize) * binSize;

    for (let bin = startBin; bin < endBin; bin += binSize) {
      bins.set(bin, 0);
    }

    delays.forEach((delay) => {
      const bin = Math.floor(delay / binSize) * binSize;
      bins.set(bin, (bins.get(bin) || 0) + 1);
    });

    const binArray: DelayBin[] = Array.from(bins.entries()).map(
      ([binStart, count]) => {
        const binEnd = binStart + binSize;
        const rangeLabel =
          binSize === 1 ? `${binStart}` : `${binStart}-${binEnd}`;
        return {
          range: rangeLabel,
          count,
          fill: "var(--color-chart-1)",
        };
      },
    );

    return binArray;
  }, [state?.trains]);

  const chartConfig: ChartConfig = {
    delays: {
      label: "Nombre de retards",
      color: "var(--color-chart-1)",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribution des retards</CardTitle>
        <CardDescription>
          Histogramme des retards d'arrivée par tranche (en minutes)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Aucun arrêt effectué
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={data}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="range" />
              <YAxis dataKey="count" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};
