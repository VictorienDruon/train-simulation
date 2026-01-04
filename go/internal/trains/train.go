package trains

import (
	"ai30-project/internal/events"
	"ai30-project/internal/navigation"
	"ai30-project/internal/segments"
	"ai30-project/internal/stations"
	"encoding/json"
	"time"
)

type Train struct {
	id    string
	stops []*TrainStop
	event events.Event

	state      trainState
	driver     DriverBehavior
	isFinished bool

	tickChan        <-chan time.Duration
	doneChan        chan<- bool
	stationInboxes  map[string]chan stations.StationMessage
	segmentInboxes  map[string]chan segments.SegmentMessage
	navigationInbox chan navigation.NavigationMessage
}

func NewTrain(id string, stops []*TrainStop) *Train {
	stops[0].SetArrivedAt(stops[0].arrival)
	return &Train{
		id:    id,
		stops: stops,
		event: events.GenerateEvent(stops[0].departure, stops[len(stops)-1].arrival),
		state: newAtStationState(),
	}
}

func (t *Train) ID() string {
	return t.id
}

func (t *Train) StartStop() *TrainStop {
	return t.stops[0]
}

func (t *Train) EndStop() *TrainStop {
	return t.stops[len(t.stops)-1]
}

func (t *Train) CurrentStop() *TrainStop {
	for _, stop := range t.stops {
		if stop.arrivedAt != nil && stop.departedAt == nil {
			return stop
		}
	}
	return nil
}

func (t *Train) LastStop() *TrainStop {
	var last *TrainStop
	for _, stop := range t.stops {
		if stop.departedAt != nil {
			last = stop
		}
	}
	return last
}

func (t *Train) NextStop() *TrainStop {
	for _, stop := range t.stops {
		if stop.arrivedAt == nil {
			return stop
		}
	}
	return nil
}

func (t *Train) SetDriver(driver DriverBehavior) {
	t.driver = driver
}

func (t *Train) SetChannels(
	tickChan <-chan time.Duration,
	doneChan chan<- bool,
	stationInboxes map[string]chan stations.StationMessage,
	segmentInboxes map[string]chan segments.SegmentMessage,
	navigationInbox chan navigation.NavigationMessage,
) {
	t.tickChan = tickChan
	t.doneChan = doneChan
	t.stationInboxes = stationInboxes
	t.segmentInboxes = segmentInboxes
	t.navigationInbox = navigationInbox
}

func (t *Train) Run() {
	for {
		// Phase 1: percept + deliberate
		currentTime, ok := <-t.tickChan
		if !ok {
			return
		}

		t.state.percept(t, currentTime)
		t.state.deliberate(t, currentTime)
		t.doneChan <- false

		// Phase 2: act
		currentTime, ok = <-t.tickChan
		if !ok {
			return
		}

		t.state.act(t, currentTime)

		if t.isFinished {
			t.doneChan <- true
			return
		}

		t.doneChan <- false
	}
}

func (t *Train) MarshalJSON() ([]byte, error) {
	return json.Marshal(map[string]any{
		"id":    t.id,
		"stops": t.stops,
		"event": t.event,
	})
}
