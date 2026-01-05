import { PlayIcon } from "lucide-react";
import { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { useSimulation } from "./SimulationProvider";
import type { DriverBehavior, StationStrategy } from "./types";

export const StartDialog = () => {
  const { isStartDialogOpen, start } = useSimulation();
  const [driverBehavior, setDriverBehavior] = useState<DriverBehavior>("eco");
  const [stationStrategy, setStationStrategy] =
    useState<StationStrategy>("no_sort");

  function handleStart() {
    start(driverBehavior, stationStrategy);
  }

  return (
    <Dialog open={isStartDialogOpen}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Démarrer la simulation</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Field>
            <FieldLabel>Comportement du conducteur</FieldLabel>
            <Select
              value={driverBehavior}
              onValueChange={(value: DriverBehavior) =>
                setDriverBehavior(value)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisir un comportement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eco">Éco</SelectItem>
                <SelectItem value="intermediate">Intermédiaire</SelectItem>
                <SelectItem value="crazy">Crazy</SelectItem>
                <SelectItem value="very_crazy">Very Crazy</SelectItem>
                <SelectItem value="soigneux">Soigneux</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Stratégie de gare</FieldLabel>
            <Select
              value={stationStrategy}
              onValueChange={(value: StationStrategy) =>
                setStationStrategy(value)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisir une stratégie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_sort">Aucun tri</SelectItem>
                <SelectItem value="entry_time_asc">
                  Par heure d'entrée (croissant)
                </SelectItem>
                <SelectItem value="delay_asc">
                  Par retard (croissant)
                </SelectItem>
                <SelectItem value="delay_asc_with_threshold">
                  Par retard avec seuil (30 min)
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <DialogFooter>
          <Button onClick={handleStart}>
            <PlayIcon />
            Démarrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
