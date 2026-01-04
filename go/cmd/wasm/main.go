package main

import (
	"ai30-project/internal/simulation"
	"encoding/json"
	"syscall/js"
)

var sim *simulation.Simulation

func start(this js.Value, args []js.Value) any {
	driverBehavior := "eco"
	stationStrategy := "no_sort"

	if len(args) >= 1 && args[0].Type() == js.TypeString {
		driverBehavior = args[0].String()
	}
	if len(args) >= 2 && args[1].Type() == js.TypeString {
		stationStrategy = args[1].String()
	}

	sim = simulation.NewSimulation(driverBehavior, stationStrategy)
	sim.Start()
	jsonData, _ := json.Marshal(sim)
	return string(jsonData)
}

func tick(this js.Value, args []js.Value) any {
	if sim == nil {
		return "{}"
	}
	sim.Tick()
	jsonData, _ := json.Marshal(sim)
	return string(jsonData)
}

func main() {
	js.Global().Set("Start", js.FuncOf(start))
	js.Global().Set("Tick", js.FuncOf(tick))
	select {}
}
