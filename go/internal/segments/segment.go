package segments

import (
	"encoding/json"
	"fmt"
	"time"
)

type Segment struct {
	id            string
	fromStationID string
	toStationID   string
	length        float64 // meters
	maxSpeed      float64 // m/min

	trainsOnSegment map[string]*trainInfo

	inbox chan SegmentMessage
}

func NewSegment(id, fromStationID, toStationID string, length, maxSpeed float64) *Segment {
	return &Segment{
		id:              id,
		fromStationID:   fromStationID,
		toStationID:     toStationID,
		length:          length,
		maxSpeed:        maxSpeed,
		trainsOnSegment: make(map[string]*trainInfo),
		inbox:           make(chan SegmentMessage, 100),
	}
}

func (s *Segment) ID() string          { return s.id }
func (s *Segment) ToStationID() string { return s.toStationID }
func (s *Segment) Length() float64     { return s.length }
func (s *Segment) MaxSpeed() float64   { return s.maxSpeed }

func (s *Segment) Inbox() chan SegmentMessage {
	return s.inbox
}

func (s *Segment) Run() {
	for {
		msg, ok := <-s.inbox
		if !ok {
			return
		}

		switch m := msg.(type) {
		case EntryRequest:
			s.handleEntryRequest(m)
		case GetTrainAheadRequest:
			s.handleGetTrainAhead(m)
		case UpdatePositionNotification:
			s.handleUpdatePosition(m)
		case ExitNotification:
			s.handleExit(m)
		default:
			fmt.Printf("  [Segment %s] ERROR: Unknown message type\n", s.ID())
		}
	}
}

func (s *Segment) MarshalJSON() ([]byte, error) {
	return json.Marshal(map[string]any{
		"id":              s.id,
		"fromStationId":   s.fromStationID,
		"toStationId":     s.toStationID,
		"length":          s.length,
		"maxSpeed":        s.maxSpeed,
		"trainsOnSegment": s.trainsOnSegment,
	})
}

type trainInfo struct {
	position  float64 // meters
	speed     float64 // m/min
	entryTime time.Duration
}

func (t *trainInfo) MarshalJSON() ([]byte, error) {
	return json.Marshal(map[string]any{
		"position":  t.position,
		"speed":     t.speed,
		"entryTime": t.entryTime,
	})
}
