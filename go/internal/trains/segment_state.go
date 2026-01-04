package trains

import (
	"ai30-project/internal/constants"
	"ai30-project/internal/events"
	"ai30-project/internal/navigation"
	"fmt"
	"math"
	"time"
)

type trainAheadInfo struct {
	position float64 // meters
	speed    float64 // m/s
}

type onSegmentState struct {
	segments     []navigation.SegmentInfo
	currentIndex int
	position     float64 // meters
	speed        float64 // m/s
	announced    bool

	// From percept
	delay               time.Duration
	trainAhead          *trainAheadInfo
	destinationDistance float64 // meters
	remainingTime       time.Duration
	isDelayed           bool

	// From deliberate
	targetSpeed float64 // m/s
}

func newOnSegmentState(segments []navigation.SegmentInfo) *onSegmentState {
	return &onSegmentState{
		segments:     segments,
		currentIndex: 0,
	}
}

func (s *onSegmentState) currentSegment() navigation.SegmentInfo {
	return s.segments[s.currentIndex]
}

func (s *onSegmentState) totalLength() float64 {
	total := 0.0
	for _, seg := range s.segments {
		total += seg.Length
	}
	return total
}

func (s *onSegmentState) traveledDistance() float64 {
	traveled := s.position
	for i := range s.currentIndex {
		traveled += s.segments[i].Length
	}
	return traveled
}

func (s *onSegmentState) percept(train *Train, currentTime time.Duration) {
	seg := s.currentSegment()

	trainAheadResp, err := train.getTrainAhead(seg.ID, s.position)
	if err != nil {
		fmt.Printf("  [Train %s] ERROR: Getting train ahead: %v\n", train.id, err)
		s.trainAhead = nil
	} else if trainAheadResp.HasTrainAhead {
		s.trainAhead = &trainAheadInfo{
			position: trainAheadResp.Position,
			speed:    trainAheadResp.Speed,
		}
	} else {
		s.trainAhead = nil
	}

	s.destinationDistance = s.totalLength() - s.traveledDistance()

	var delta time.Duration
	if train.NextStop() == nil || train.LastStop() == nil {
		delta = time.Duration(1.0 * float64(time.Second))
	} else {
		delta = train.NextStop().arrival - train.LastStop().departure
	}

	percentageOfJourney := s.traveledDistance() / s.totalLength()
	theoricalTime := train.LastStop().departure + time.Duration(float64(delta)*percentageOfJourney)
	s.delay = currentTime - theoricalTime

	// Compute remaining time
	s.remainingTime = time.Duration(float64(delta)*(1.0-percentageOfJourney)) - s.delay - time.Duration(2.0*float64(time.Minute))
	if s.remainingTime.Seconds() <= 0 {
		s.remainingTime = time.Duration(1.0 * float64(time.Second))
	}

	// Event
	delay, isDelay := train.event.(events.DelayEvent)
	s.isDelayed = isDelay && delay.IsActive(currentTime)
}

func (s *onSegmentState) deliberate(train *Train, currentTime time.Duration) {
	seg := s.currentSegment()
	dt := time.Duration(60) * time.Second
	acceleration := train.driver.GetCommand(s.delay).DesiredAccel * constants.MaxAcceleration
	service_brake := train.driver.GetCommand(s.delay).DesiredDecel * constants.MaxServiceBrake

	// Calculate normal speed
	normalSpeed := (s.destinationDistance / float64(s.remainingTime.Seconds())) / train.driver.GetCommand(s.delay).DesiredSpeed

	// Calculate safety speed
	safetySpeed := 1e6
	if s.isDelayed {
		safetySpeed = 0.0
	} else if s.trainAhead != nil {
		// No train ahead: set a very large safety speed so it does not constrain
		safetyDistance := s.trainAhead.position - constants.SafetyDistance
		if safetyDistance < 0 {
			safetyDistance = 0
		}
		safetySpeed = math.Sqrt(2 * math.Abs(service_brake) * safetyDistance)
	}

	// Calculate station speed limit
	distNextStation := s.segments[s.currentIndex].Length - s.position
	stationSpeedLimit := math.Sqrt(2 * math.Abs(service_brake) * distNextStation)

	// Determine target speed
	s.targetSpeed = math.Min(normalSpeed, math.Min(safetySpeed, stationSpeedLimit))

	// Ensure target speed does not exceed max speed
	if s.targetSpeed > seg.MaxSpeed {
		s.targetSpeed = seg.MaxSpeed
	}

	driverSpeed := s.targetSpeed * train.driver.GetCommand(s.delay).DesiredSpeed
	fmt.Printf("	[Train %s] Segment %s: pos=%.1f m, speed=%.1f m/s, target=%.1f m/s, driver=%.1f m/s, delay=%v, rem.time=%v, train.ahead=%v\n",
		train.id, seg.ID, s.position, s.speed, s.targetSpeed, driverSpeed, s.delay, s.remainingTime, s.trainAhead)

	if s.isDelayed {
		s.speed += constants.EmergencyBrake * dt.Seconds()
	} else if s.speed < driverSpeed {
		s.speed += acceleration * dt.Seconds()
	} else if s.speed > driverSpeed {
		s.speed += service_brake * dt.Seconds()
	}

	if s.speed > driverSpeed {
		s.speed = driverSpeed
	} else if s.speed < 0 {
		s.speed = 0
	}
}

func (s *onSegmentState) act(train *Train, currentTime time.Duration) {
	// fixed timestep and current segment
	dt := time.Duration(60) * time.Second
	seg := s.currentSegment()

	// advance position and notify controller
	s.position += s.speed * dt.Seconds()
	train.notifySegmentPosition(seg.ID, s.position, s.speed)

	// Helper to clamp position to the last meter of the segment when waiting
	setWaitingAtSegmentEnd := func() {
		s.position = seg.Length - 1
	}

	// Prepare for entering the station: when near the end of final segment and not yet announced
	isApproachingStation := s.position >= 0.9*seg.Length && s.currentIndex+1 >= len(s.segments) && !s.announced
	if isApproachingStation {
		nextStop := train.NextStop()
		// defensive check: if there's no next stop, nothing to demand
		if nextStop == nil {
			return
		}

		// demand station entry with the same timing as before
		response, err := train.demandingStationEntry(nextStop.stationID, seg.ID, s.delay, currentTime+s.delay-s.remainingTime)

		if err != nil {
			fmt.Printf("  [Train %s] ERROR: Demanding station entry: %v\n", train.id, err)
			return
		}

		if response.Validate {
			fmt.Printf("  [Train %s] Station %s entry DEMANDED successfully at %v\n", train.id, nextStop.stationID, currentTime)
			s.announced = true
		} else {
			fmt.Printf("  [Train %s] Station %s entry DEMAND failed at %v\n", train.id, nextStop.stationID, currentTime)
		}
		return
	}

	// If we crossed the segment end, handle overflow and next resource entry
	if s.position < seg.Length {
		// still inside the segment, nothing more to do
		return
	}

	overflow := s.position - seg.Length

	// If not the final segment in the route, try to enter the next segment
	if s.currentIndex+1 < len(s.segments) {
		// attempt to advance index and request entry
		s.currentIndex++
		nextSeg := s.currentSegment()

		response, err := train.requestSegmentEntry(nextSeg.ID, currentTime)
		if err != nil {
			fmt.Printf("  [Train %s] ERROR: Requesting segment entry: %v\n", train.id, err)
			// rollback index and wait at end of current segment
			s.currentIndex--
			setWaitingAtSegmentEnd()
			return
		}

		if !response.Allowed {
			fmt.Printf("  [Train %s] Cannot enter segment %s, waiting\n", train.id, nextSeg.ID)
			// rollback index and wait
			s.currentIndex--
			setWaitingAtSegmentEnd()
			return
		}

		// successful entry into next segment
		s.position = overflow
		train.notifySegmentExit(seg.ID)
		fmt.Printf("  [Train %s] Entered segment %s at %v\n", train.id, nextSeg.ID, currentTime)
		return
	}

	// final segment: request station entry
	nextStop := train.NextStop()
	if nextStop == nil {
		return
	}

	response, err := train.requestStationEntry(nextStop.stationID, seg.ID, currentTime)
	if err != nil {
		fmt.Printf("  [Train %s] ERROR: Requesting station entry: %v\n", train.id, err)
		return
	}

	if response.Allowed {
		s.announced = false
		train.notifySegmentExit(seg.ID)
		nextStop.SetArrivedAt(currentTime)
		train.state = newAtStationState()
		fmt.Printf("  [Train %s] Entered station %s at %v\n", train.id, nextStop.stationID, currentTime)
	} else {
		fmt.Printf("  [Train %s] Cannot enter station %s (capacity full)\n", train.id, nextStop.stationID)
		setWaitingAtSegmentEnd()
	}
}
