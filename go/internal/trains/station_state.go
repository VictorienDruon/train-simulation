package trains

import (
	"ai30-project/internal/events"
	"fmt"
	"time"
)

type atStationState struct {
	// From deliberate
	action string
}

func newAtStationState() *atStationState {
	return &atStationState{}
}

func (s *atStationState) percept(train *Train, currentTime time.Duration) {}

func (s *atStationState) deliberate(train *Train, currentTime time.Duration) {
	currentStop := train.CurrentStop()
	endStop := train.EndStop()

	if currentStop == endStop {
		s.action = "FINISH"
		return
	}

	cancellation, isCancellation := train.event.(events.CancellationEvent)
	if isCancellation && cancellation.IsActive(currentTime) {
		s.action = "CANCEL"
		return
	}

	if currentTime < currentStop.departure {
		s.action = "WAIT"
		return
	}

	delay, isDelay := train.event.(events.DelayEvent)
	if isDelay && delay.IsActive(currentTime) {
		s.action = "DELAYED"
		return
	}

	s.action = "DEPART"
}

func (s *atStationState) act(train *Train, currentTime time.Duration) {
	currentStop := train.CurrentStop()

	switch s.action {
	case "FINISH":
		train.isFinished = true
		train.notifyStationDeparture(currentStop.stationID)
		fmt.Printf("  [Train %s] Reached end of journey at station %s at %v\n", train.id, currentStop.stationID, currentTime)
		return

	case "CANCEL":
		train.isFinished = true
		train.notifyStationDeparture(currentStop.stationID)
		fmt.Printf("  [Train %s] CANCELLED at station %s at %v\n", train.id, currentStop.stationID, currentTime)
		return

	case "WAIT":
		return

	case "DELAYED":
		fmt.Printf("  [Train %s] DELAYED at station %s\n", train.id, currentStop.stationID)
		return

	case "DEPART":
		nextStop := train.NextStop()

		path, err := train.requestPath(currentStop.stationID, nextStop.stationID)
		if err != nil {
			fmt.Printf("  [Train %s] ERROR: Getting path: %v\n", train.id, err)
			return
		}

		if len(path.Segments) == 0 {
			fmt.Printf("  [Train %s] ERROR: No segments found to next stop\n", train.id)
			return
		}

		firstSegment := path.Segments[0]
		response, err := train.requestSegmentEntry(firstSegment.ID, currentTime)
		if err != nil {
			fmt.Printf("  [Train %s] ERROR: Requesting segment entry: %v\n", train.id, err)
			return
		}

		if response.Allowed {
			train.notifyStationDeparture(currentStop.stationID)
			currentStop.SetDepartedAt(currentTime)
			train.state = newOnSegmentState(path.Segments)
			fmt.Printf("  [Train %s] Leaving station %s, entering segment %s (path has %d segments) at %v\n",
				train.id, currentStop.stationID, firstSegment.ID, len(path.Segments), currentTime)
		} else {
			fmt.Printf("  [Train %s] Cannot leave station %s, segment %s not available\n", train.id, currentStop.stationID, firstSegment.ID)
		}
	}
}
