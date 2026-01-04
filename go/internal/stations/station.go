package stations

import (
	"encoding/json"
	"fmt"
	"time"
)

type Station struct {
	id       string
	name     string
	capacity int

	trainsInStation      map[string]*trainInfo
	trainsDemandingEntry []demandInfo
	strategy             StationStrategy

	inbox chan StationMessage
}

func NewStation(id, name string, capacity int) *Station {
	return &Station{
		id:                   id,
		name:                 name,
		capacity:             capacity,
		trainsInStation:      make(map[string]*trainInfo),
		trainsDemandingEntry: []demandInfo{},
		inbox:                make(chan StationMessage, 100),
	}
}

func (s *Station) ID() string { return s.id }

func (s *Station) Inbox() chan StationMessage {
	return s.inbox
}

func (s *Station) SetStrategy(strategy StationStrategy) {
	s.strategy = strategy
}

func (s *Station) Run() {
	for {
		msg, ok := <-s.inbox
		if !ok {
			return
		}

		switch m := msg.(type) {
		case DemandingEntry:
			s.handleDemandingEntry(m)
		case EntryRequest:
			s.handleEntryRequest(m)
		case DepartureNotification:
			s.handleDeparture(m)
		default:
			fmt.Printf("  [Station %s] ERROR: Unknown message type\n", s.ID())
		}
	}
}

func (s *Station) MarshalJSON() ([]byte, error) {
	return json.Marshal(map[string]any{
		"id":              s.id,
		"name":            s.name,
		"capacity":        s.capacity,
		"trainsInStation": s.trainsInStation,
	})
}

type trainInfo struct {
	entryTime time.Duration
}

func (t *trainInfo) MarshalJSON() ([]byte, error) {
	return json.Marshal(map[string]any{
		"entryTime": t.entryTime,
	})
}

type demandInfo struct {
	trainID   string
	delay     time.Duration
	entryTime time.Duration
}

// addOrUpdateDemand adds a demand or updates the entryTime if train already present.
func (s *Station) addOrUpdateDemand(id string, d time.Duration, t time.Duration) {
	for i := range s.trainsDemandingEntry {
		if s.trainsDemandingEntry[i].trainID == id {
			s.trainsDemandingEntry[i].entryTime = t
			s.trainsDemandingEntry[i].delay = d
			return
		}
	}
	s.trainsDemandingEntry = append(s.trainsDemandingEntry, demandInfo{trainID: id, entryTime: t, delay: d})
}

// removeDemand removes a train from the demanding slice by id.
func (s *Station) removeDemand(id string) {
	for i := range s.trainsDemandingEntry {
		if s.trainsDemandingEntry[i].trainID == id {
			s.trainsDemandingEntry = append(s.trainsDemandingEntry[:i], s.trainsDemandingEntry[i+1:]...)
			return
		}
	}
}

// sortDemands sorts the demanding slice by entryTime ascending.
func (s *Station) sortDemands() {
	if s.strategy != nil {
		s.strategy.Sort(s.trainsDemandingEntry)
	}
}
