package trains

import (
	"encoding/json"
	"time"
)

type TrainStop struct {
	stationID  string
	arrival    time.Duration
	arrivedAt  *time.Duration
	departure  time.Duration
	departedAt *time.Duration
}

func NewTrainStop(stationID string, arrival, departure time.Duration) *TrainStop {
	return &TrainStop{
		stationID: stationID,
		arrival:   arrival,
		departure: departure,
	}
}

func (ts *TrainStop) Departure() time.Duration {
	return ts.departure
}

func (ts *TrainStop) SetArrivedAt(arrivedAt time.Duration) {
	ts.arrivedAt = &arrivedAt
}

func (ts *TrainStop) SetDepartedAt(departedAt time.Duration) {
	ts.departedAt = &departedAt
}

func (ts *TrainStop) MarshalJSON() ([]byte, error) {
	return json.Marshal(map[string]any{
		"stationId":  ts.stationID,
		"arrival":    ts.arrival,
		"arrivedAt":  ts.arrivedAt,
		"departure":  ts.departure,
		"departedAt": ts.departedAt,
	})
}
