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

export const EventDistributionCard = () => {
  const { state } = useSimulation();

  const data = useMemo(() => {
    let delays = 0;
    let cancellations = 0;
    let none = 0;

    if (state?.trains) {
      Object.values(state.trains).forEach((train) => {
        switch (train.event.kind) {
          case "delay":
            delays += 1;
            break;
          case "cancellation":
            cancellations += 1;
            break;
          case "none":
            none += 1;
            break;
        }
      });
    }

    return [
      {
        type: "Retards",
        value: delays,
        fill: "var(--color-chart-1)",
      },
      {
        type: "Annulations",
        value: cancellations,
        fill: "var(--color-chart-2)",
      },
      {
        type: "Aucun événement",
        value: none,
        fill: "var(--color-border)",
      },
    ];
  }, [state?.trains]);

  const chartConfig: ChartConfig = {
    delays: {
      label: "Retards",
    },
    cancellations: {
      label: "Annulations",
    },
    none: {
      label: "Aucun événement",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Répartition des événements</CardTitle>
        <CardDescription>
          Distribution des retards, annulations et trains sans événement
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="type" />
            <YAxis dataKey="value" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
