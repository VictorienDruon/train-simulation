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

import type { DelayCause } from "@/features/trains";
import { useSimulation } from "../../SimulationProvider";

const delayCauseLabels: Record<DelayCause, string> = {
  external: "Externe",
  infrastructure: "Infrastructure",
  traffic: "Trafic",
  rolling_stock: "Matériel roulant",
  station: "Gare",
  passenger: "Passagers",
};

const delayCauseColors: Record<DelayCause, string> = {
  external: "var(--color-chart-1)",
  infrastructure: "var(--color-chart-2)",
  traffic: "var(--color-chart-3)",
  rolling_stock: "var(--color-chart-4)",
  station: "var(--color-chart-5)",
  passenger: "var(--color-chart-6)",
};

export const AverageDelayByCauseCard = () => {
  const { state } = useSimulation();

  const data = useMemo(() => {
    if (!state?.trains) return [];

    const causeDelays: Record<DelayCause, number[]> = {
      external: [],
      infrastructure: [],
      traffic: [],
      rolling_stock: [],
      station: [],
      passenger: [],
    };

    Object.values(state.trains).forEach((train) => {
      if (train.event?.kind === "delay") {
        const delayEvent = train.event;
        const delayMinutes = Math.floor(
          delayEvent.duration / 1_000_000_000 / 60,
        );
        causeDelays[delayEvent.cause].push(delayMinutes);
      }
    });

    return Object.entries(causeDelays)
      .map(([cause, delays]) => {
        const average = delays.reduce((sum, d) => sum + d, 0) / delays.length;
        return {
          cause: cause as DelayCause,
          label: delayCauseLabels[cause as DelayCause],
          average: Math.round(average),
          fill: delayCauseColors[cause as DelayCause],
        };
      })
      .filter((item) => item.average > 0);
  }, [state?.trains]);

  const chartConfig: ChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    data.forEach((item) => {
      config[item.cause] = {
        label: item.label,
        color: item.fill,
      };
    });
    return config;
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Durée moyenne des retards</CardTitle>
        <CardDescription>
          Durée moyenne des retards par cause (en minutes)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis dataKey="average" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="average" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
