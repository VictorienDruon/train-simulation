import { useMemo } from "react";
import { Pie, PieChart } from "recharts";
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
  ChartLegend,
  ChartLegendContent,
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

export const DelayByCauseCard = () => {
  const { state } = useSimulation();

  const data = useMemo(() => {
    if (!state?.trains) return [];

    const causeCounts: Record<DelayCause, number> = {
      external: 0,
      infrastructure: 0,
      traffic: 0,
      rolling_stock: 0,
      station: 0,
      passenger: 0,
    };

    Object.values(state.trains).forEach((train) => {
      if (train.event?.kind === "delay") {
        const delayEvent = train.event;
        causeCounts[delayEvent.cause] += 1;
      }
    });

    return Object.entries(causeCounts)
      .map(([cause, count]) => ({
        cause: cause as DelayCause,
        label: delayCauseLabels[cause as DelayCause],
        value: count,
        fill: delayCauseColors[cause as DelayCause],
      }))
      .filter((item) => item.value > 0);
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
        <CardTitle>Retards par cause</CardTitle>
        <CardDescription>
          Répartition des retards selon leur cause
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie data={data} dataKey="value" nameKey="cause" />
            <ChartLegend content={<ChartLegendContent />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
