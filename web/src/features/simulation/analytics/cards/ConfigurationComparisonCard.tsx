import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
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
import { formatDelay } from "@/utils/numbers";
import { useSimulationHistory } from "../../SimulationHistoryProvider";
import type { DriverBehavior, StationStrategy } from "../../types";

type ConfigurationKey = `${DriverBehavior}-${StationStrategy}`;

type ConfigurationStats = {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
};

function getConfigurationKey(
  driverBehavior: DriverBehavior,
  stationStrategy: StationStrategy,
): ConfigurationKey {
  return `${driverBehavior}-${stationStrategy}`;
}

function formatConfigurationName(
  driverBehavior: DriverBehavior,
  stationStrategy: StationStrategy,
): string {
  const driverLabels: Record<DriverBehavior, string> = {
    eco: "Éco",
    intermediate: "Intermédiaire",
    crazy: "Crazy",
    very_crazy: "Very Crazy",
  };
  const strategyLabels: Record<StationStrategy, string> = {
    no_sort: "Aucun tri",
    entry_time_asc: "Temps d'entrée",
    delay_asc: "Retard croissant",
    delay_asc_with_threshold: "Retard avec seuil",
  };
  return `${driverLabels[driverBehavior]} - ${strategyLabels[stationStrategy]}`;
}

function calculateStatistics(delays: number[]): ConfigurationStats {
  if (delays.length === 0) {
    return {
      mean: 0,
      median: 0,
      stdDev: 0,
      min: 0,
      max: 0,
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
  const min = sortedDelays[0]!;
  const max = sortedDelays[sortedDelays.length - 1]!;

  return { mean, median, stdDev, min, max };
}

export const ConfigurationComparisonCard = () => {
  const { simulationHistory } = useSimulationHistory();

  const { data, chartConfig } = useMemo(() => {
    // Group delays by configuration
    const delaysByConfig = new Map<ConfigurationKey, number[]>();

    simulationHistory.forEach((result) => {
      const configKey = getConfigurationKey(
        result.driverBehavior,
        result.stationStrategy,
      );

      if (!delaysByConfig.has(configKey)) {
        delaysByConfig.set(configKey, []);
      }

      const delays = delaysByConfig.get(configKey)!;

      Object.values(result.trains).forEach((train) => {
        train.stops.forEach((stop, index) => {
          if (index > 0 && stop.arrivedAt !== null) {
            const delayNanoseconds = stop.arrivedAt - stop.arrival;
            const delayMinutes = delayNanoseconds / 1_000_000_000 / 60;
            delays.push(delayMinutes);
          }
        });
      });
    });

    // Calculate statistics for each configuration
    const configStats = new Map<ConfigurationKey, ConfigurationStats>();
    delaysByConfig.forEach((delays, configKey) => {
      configStats.set(configKey, calculateStatistics(delays));
    });

    // Convert to chart data format
    const configKeys = Array.from(configStats.keys()).sort();
    const chartData = configKeys.map((configKey) => {
      const stats = configStats.get(configKey)!;
      const [driverBehavior, stationStrategy] = configKey.split("-") as [
        DriverBehavior,
        StationStrategy,
      ];
      const configName = formatConfigurationName(
        driverBehavior,
        stationStrategy,
      );

      return {
        configuration: configName,
        mean: stats.mean,
        median: stats.median,
        stdDev: stats.stdDev,
        min: stats.min,
        max: stats.max,
      };
    });

    const chartConfig: ChartConfig = {
      mean: {
        label: "Moyenne",
        color: "var(--color-chart-1)",
      },
      median: {
        label: "Médiane",
        color: "var(--color-chart-2)",
      },
      stdDev: {
        label: "Écart-type",
        color: "var(--color-chart-3)",
      },
      min: {
        label: "Minimum",
        color: "var(--color-chart-4)",
      },
      max: {
        label: "Maximum",
        color: "var(--color-chart-5)",
      },
    };

    return { data: chartData, chartConfig };
  }, [simulationHistory]);

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Comparaison des configurations</CardTitle>
        <CardDescription>
          Comparaison des statistiques de retard par configuration (comportement
          du conducteur et stratégie de gare)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Aucune donnée historique disponible
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="configuration"
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis tickFormatter={(value) => formatDelay(value)} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="mean"
                stroke="var(--color-chart-1)"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="median"
                stroke="var(--color-chart-2)"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="stdDev"
                stroke="var(--color-chart-3)"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="min"
                stroke="var(--color-chart-4)"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="max"
                stroke="var(--color-chart-5)"
                strokeWidth={2}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};
