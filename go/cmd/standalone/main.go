package main

import (
	"ai30-project/internal/simulation"
	"time"
)

func main() {
	sim := simulation.NewSimulation("eco", "no_sort")
	sim.Start()

	for !sim.IsFinished() {
		sim.Tick()
		time.Sleep(70 * time.Millisecond)
	}
}
