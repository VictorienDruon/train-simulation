package simulation

import (
	"encoding/json"
	"fmt"
	"time"

	"ai30-project/internal/data"
	"ai30-project/internal/navigation"
	"ai30-project/internal/segments"
	"ai30-project/internal/stations"
	"ai30-project/internal/trains"
)

type Simulation struct {
	isStarted       bool
	currentTime     time.Duration
	activeTrains    int
	driverBehavior  string
	stationStrategy string

	trains            map[string]*trains.Train
	stations          map[string]*stations.Station
	segments          map[string]*segments.Segment
	navigationService *navigation.NavigationService

	tickChan       chan time.Duration
	doneChan       chan bool
	stationInboxes map[string]chan stations.StationMessage
	segmentInboxes map[string]chan segments.SegmentMessage
}

func NewSimulation(driverBehaviorName, stationStrategyName string) *Simulation {
	trainsData := data.GetTrainsData()
	stationsData := data.GetStationsData()
	segmentsData := data.GetSegmentsData()
	pathsData := data.GetPathsData()

	earliestDeparture := trainsData[0].StartStop().Departure()
	for _, train := range trainsData[1:] {
		if depTime := train.StartStop().Departure(); depTime < earliestDeparture {
			earliestDeparture = depTime
		}
	}

	s := &Simulation{
		currentTime:     earliestDeparture - time.Minute,
		activeTrains:    len(trainsData),
		driverBehavior:  driverBehaviorName,
		stationStrategy: stationStrategyName,
		trains:          make(map[string]*trains.Train),
		stations:        make(map[string]*stations.Station),
		segments:        make(map[string]*segments.Segment),
		tickChan:        make(chan time.Duration),
		doneChan:        make(chan bool),
		stationInboxes:  make(map[string]chan stations.StationMessage),
		segmentInboxes:  make(map[string]chan segments.SegmentMessage),
	}

	s.navigationService = navigation.NewNavigationService(pathsData, s.segments)

	driverBehavior := trains.NewDriverBehavior(driverBehaviorName)
	stationStrategy := stations.NewStationStrategy(stationStrategyName)

	for _, segment := range segmentsData {
		s.segments[segment.ID()] = segment
		s.segmentInboxes[segment.ID()] = segment.Inbox()
	}

	for _, station := range stationsData {
		s.stations[station.ID()] = station
		s.stationInboxes[station.ID()] = station.Inbox()
		station.SetStrategy(stationStrategy)
	}

	for _, train := range trainsData {
		s.trains[train.ID()] = train
		train.SetDriver(driverBehavior)
		train.SetChannels(s.tickChan, s.doneChan, s.stationInboxes, s.segmentInboxes, s.navigationService.Inbox())
	}

	return s
}

func (s *Simulation) IsStarted() bool {
	return s.isStarted
}

func (s *Simulation) IsFinished() bool {
	return s.activeTrains == 0
}

func (s *Simulation) Start() {
	if s.IsStarted() {
		return
	}

	fmt.Printf("[Simulation] Starting simulation with %d trains, %d stations and %d segments\n",
		len(s.trains), len(s.stations), len(s.segments))

	for _, train := range s.trains {
		go train.Run()
	}

	for _, station := range s.stations {
		go station.Run()
	}

	for _, segment := range s.segments {
		go segment.Run()
	}

	go s.navigationService.Run()

	s.isStarted = true
}

func (s *Simulation) Tick() {
	if !s.IsStarted() || s.IsFinished() {
		return
	}

	s.currentTime += time.Minute
	fmt.Printf("[Simulation] Tick: %v\n", s.currentTime)

	// Phase 1: percept + deliberate
	for range s.activeTrains {
		s.tickChan <- s.currentTime
	}
	for range s.activeTrains {
		<-s.doneChan
	}

	// Phase 2: act
	for range s.activeTrains {
		s.tickChan <- s.currentTime
	}

	stillActive := 0
	for range s.activeTrains {
		if !<-s.doneChan {
			stillActive++
		}
	}

	s.activeTrains = stillActive
	if s.activeTrains == 0 {
		fmt.Printf("[Simulation] All trains have completed their journeys\n")
	}
}

func (s *Simulation) MarshalJSON() ([]byte, error) {
	return json.Marshal(map[string]any{
		"isStarted":       s.isStarted,
		"isFinished":      s.IsFinished(),
		"currentTime":     s.currentTime,
		"driverBehavior":  s.driverBehavior,
		"stationStrategy": s.stationStrategy,
		"trains":          s.trains,
		"stations":        s.stations,
		"segments":        s.segments,
	})
}
