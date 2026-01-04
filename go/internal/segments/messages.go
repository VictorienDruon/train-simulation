package segments

import (
	"ai30-project/internal/constants"
	"fmt"
	"time"
)

type SegmentMessage interface {
	isMessage()
}

type EntryRequest struct {
	TrainID    string
	Time       time.Duration
	ResponseCh chan EntryResponse
}

func (EntryRequest) isMessage() {}

type EntryResponse struct {
	Allowed bool
	Error   error
}

func (s *Segment) handleEntryRequest(req EntryRequest) {
	allowed := true
	if len(s.trainsOnSegment) > 0 {
		for _, info := range s.trainsOnSegment {
			if info.position < constants.SafetyDistance {
				allowed = false
				break
			}
		}
	}

	if !allowed {
		fmt.Printf("  [Segment %s] Train %s entry request DENIED (too close to another train) at %v\n",
			s.id, req.TrainID, req.Time)
		req.ResponseCh <- EntryResponse{
			Allowed: false,
			Error:   fmt.Errorf("Segment %s: Train %s cannot enter, too close to another train", s.id, req.TrainID),
		}
		return
	}

	s.trainsOnSegment[req.TrainID] = &trainInfo{
		position:  0,
		speed:     0,
		entryTime: req.Time,
	}

	fmt.Printf("  [Segment %s] Train %s entry request ALLOWED (trains on segment: %d) at %v\n",
		s.id, req.TrainID, len(s.trainsOnSegment), req.Time)

	req.ResponseCh <- EntryResponse{
		Allowed: true,
		Error:   nil,
	}
}

type GetTrainAheadRequest struct {
	TrainID    string
	Position   float64 // meters
	ResponseCh chan GetTrainAheadResponse
}

func (GetTrainAheadRequest) isMessage() {}

type GetTrainAheadResponse struct {
	HasTrainAhead bool
	Position      float64 // meters
	Speed         float64 // m/s
	Error         error
}

func (s *Segment) handleGetTrainAhead(req GetTrainAheadRequest) {
	minDist := 100000.0
	var closestTrain *trainInfo
	pos := req.Position // meters

	for trainID, info := range s.trainsOnSegment {
		if trainID != req.TrainID {
			if info.position > pos {
				dist := info.position - pos
				if dist < minDist {
					minDist = dist
					closestTrain = info
				}
			}
		}
	}

	if closestTrain != nil {
		req.ResponseCh <- GetTrainAheadResponse{
			HasTrainAhead: true,
			Position:      minDist,
			Speed:         closestTrain.speed,
			Error:         nil,
		}
	} else {
		req.ResponseCh <- GetTrainAheadResponse{
			HasTrainAhead: false,
			Position:      0,
			Speed:         0,
			Error:         nil,
		}
	}
}

type UpdatePositionNotification struct {
	TrainID  string
	Position float64 // meters
	Speed    float64 // m/s
}

func (UpdatePositionNotification) isMessage() {}

func (s *Segment) handleUpdatePosition(notif UpdatePositionNotification) {
	if info, exists := s.trainsOnSegment[notif.TrainID]; exists {
		info.position = notif.Position
		info.speed = notif.Speed
	}
}

type ExitNotification struct {
	TrainID string
}

func (ExitNotification) isMessage() {}

func (s *Segment) handleExit(notif ExitNotification) {
	if _, exists := s.trainsOnSegment[notif.TrainID]; exists {
		delete(s.trainsOnSegment, notif.TrainID)
		fmt.Printf("  [Segment %s] Train %s exited (trains remaining: %d)\n",
			s.id, notif.TrainID, len(s.trainsOnSegment))
	}
}
