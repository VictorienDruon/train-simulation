package stations

import (
	"fmt"
	"time"
)

type StationMessage interface {
	isMessage()
}

type DemandingEntry struct {
	TrainID     string
	FromSegment string
	Delay       time.Duration
	RequestTime time.Duration
	ResponseCh  chan DemandingEntryResponse
}

func (DemandingEntry) isMessage() {}

type DemandingEntryResponse struct {
	Validate bool
	Error    error
}

func (s *Station) handleDemandingEntry(req DemandingEntry) {
	// At 90% the train notifies it's demanding entry.
	// We register or update the demand in the slice and sort it.
	s.addOrUpdateDemand(req.TrainID, req.Delay, req.RequestTime)
	s.sortDemands()

	fmt.Printf("  [Station %s] Train %s registered/updated demanding entry at %v (demanding=%d)\n",
		s.id, req.TrainID, req.RequestTime, len(s.trainsDemandingEntry))

	// Acknowledge registration; actual admission occurs at EntryRequest.
	req.ResponseCh <- DemandingEntryResponse{Validate: true, Error: nil}
}

type EntryRequest struct {
	TrainID     string
	FromSegment string
	EntryTime   time.Duration
	ResponseCh  chan EntryResponse
}

func (EntryRequest) isMessage() {}

type EntryResponse struct {
	Allowed bool
	Error   error
}

func (s *Station) handleEntryRequest(req EntryRequest) {
	// On 100% the train asks to actually enter the station.
	// Allow only if the train is among the top-x demanding trains where
	// x = remaining slots.
	remaining := s.capacity - len(s.trainsInStation)
	if remaining <= 0 {
		fmt.Printf("  [Station %s] Train %s entry request DENIED (capacity full) at %v\n",
			s.id, req.TrainID, req.EntryTime)
		req.ResponseCh <- EntryResponse{Allowed: false, Error: nil}
		return
	}

	// Find if req.TrainID is within the first 'remaining' entries
	allowed := false
	limit := remaining
	if limit > len(s.trainsDemandingEntry) {
		limit = len(s.trainsDemandingEntry)
	}

	for i := 0; i < limit; i++ {
		if s.trainsDemandingEntry[i].trainID == req.TrainID {
			allowed = true
			break
		}
	}

	if allowed {
		// Admit the train
		s.trainsInStation[req.TrainID] = &trainInfo{entryTime: req.EntryTime}
		s.removeDemand(req.TrainID)
		fmt.Printf("  [Station %s] Train %s entry request ALLOWED (capacity: %d/%d) at %v\n",
			s.id, req.TrainID, len(s.trainsInStation), s.capacity, req.EntryTime)
	} else {
		fmt.Printf("  [Station %s] Train %s entry request DENIED (not in top-%d) at %v\n",
			s.id, req.TrainID, remaining, req.EntryTime)
	}

	req.ResponseCh <- EntryResponse{Allowed: allowed, Error: nil}
}

type DepartureNotification struct {
	TrainID string
}

func (DepartureNotification) isMessage() {}

func (s *Station) handleDeparture(notif DepartureNotification) {
	if _, exists := s.trainsInStation[notif.TrainID]; exists {
		delete(s.trainsInStation, notif.TrainID)
		fmt.Printf("  [Station %s] Train %s departed (capacity: %d/%d)\n",
			s.id, notif.TrainID, len(s.trainsInStation), s.capacity)
	}
}
