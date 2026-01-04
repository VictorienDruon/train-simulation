package events

import (
	"encoding/json"
	"math"
	"math/rand"
	"time"
)

const (
	proportionDelay        = 0.0960013641401654
	proportionCancellation = 0.03363966841008551

	muDelayed  = 3.477863772291891
	stdDelayed = 0.3791282825460146
)

var delayCauseProbabilities = map[DelayCause]float64{
	DelayCauseExternal:       0.21873635169470653,
	DelayCauseInfrastructure: 0.22102479850910456,
	DelayCauseTraffic:        0.20142373232243163,
	DelayCauseRollingStock:   0.19090507527285972,
	DelayCauseStation:        0.07300637791365844,
	DelayCausePassenger:      0.07681434828215401,
}

type Event interface {
	isEvent()
}

type DelayCause string

const (
	DelayCauseExternal       DelayCause = "external"
	DelayCauseInfrastructure DelayCause = "infrastructure"
	DelayCauseTraffic        DelayCause = "traffic"
	DelayCauseRollingStock   DelayCause = "rolling_stock"
	DelayCauseStation        DelayCause = "station"
	DelayCausePassenger      DelayCause = "passenger"
)

type DelayEvent struct {
	Cause     DelayCause
	Duration  time.Duration
	StartTime time.Duration
}

func (DelayEvent) isEvent() {}

func (e DelayEvent) IsActive(currentTime time.Duration) bool {
	return currentTime >= e.StartTime && currentTime < e.StartTime+e.Duration
}

func (e DelayEvent) MarshalJSON() ([]byte, error) {
	return json.Marshal(map[string]any{
		"kind":      "delay",
		"cause":     e.Cause,
		"duration":  e.Duration,
		"startTime": e.StartTime,
	})
}

type CancellationEvent struct {
	StartTime time.Duration
}

func (CancellationEvent) isEvent() {}

func (e CancellationEvent) IsActive(currentTime time.Duration) bool {
	return currentTime >= e.StartTime
}

func (e CancellationEvent) MarshalJSON() ([]byte, error) {
	return json.Marshal(map[string]any{
		"kind":      "cancellation",
		"startTime": e.StartTime,
	})
}

type NoEvent struct{}

func (NoEvent) isEvent() {}

func (e NoEvent) MarshalJSON() ([]byte, error) {
	return json.Marshal(map[string]any{
		"kind": "none",
	})
}

func GenerateEvent(firstDeparture, lastArrival time.Duration) Event {
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	roll := rng.Float64()

	timeRange := lastArrival - firstDeparture
	if timeRange < 0 {
		timeRange = 0
	}
	randomOffset := time.Duration(float64(timeRange) * rng.Float64())
	startTime := firstDeparture + randomOffset

	if roll < proportionDelay {
		logDelay := rng.NormFloat64()*stdDelayed + muDelayed
		delayMinutes := math.Exp(logDelay)

		causeRoll := rng.Float64()
		cumulative := 0.0
		var selectedCause DelayCause = DelayCauseExternal
		for cause, prob := range delayCauseProbabilities {
			cumulative += prob
			if causeRoll < cumulative {
				selectedCause = cause
				break
			}
		}

		return DelayEvent{
			Cause:     selectedCause,
			Duration:  time.Duration(delayMinutes) * time.Minute,
			StartTime: startTime,
		}
	} else if roll < proportionDelay+proportionCancellation {
		return CancellationEvent{
			StartTime: startTime,
		}
	}

	return NoEvent{}
}
