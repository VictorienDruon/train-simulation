package trains

import (
	"ai30-project/internal/navigation"
	"ai30-project/internal/segments"
	"ai30-project/internal/stations"
	"errors"
	"time"
)

func (t *Train) demandingStationEntry(stationID string, fromSegment string, delay time.Duration, requestTime time.Duration) (stations.DemandingEntryResponse, error) {
	inbox, ok := t.stationInboxes[stationID]
	if !ok {
		return stations.DemandingEntryResponse{Validate: false}, errors.New("station inbox not found")
	}

	responseCh := make(chan stations.DemandingEntryResponse)
	inbox <- stations.DemandingEntry{
		TrainID:     t.id,
		FromSegment: fromSegment,
		Delay:       delay,
		RequestTime: requestTime,
		ResponseCh:  responseCh,
	}

	response := <-responseCh
	return response, response.Error
}

func (t *Train) requestStationEntry(stationID string, fromSegment string, entryTime time.Duration) (stations.EntryResponse, error) {
	inbox, ok := t.stationInboxes[stationID]
	if !ok {
		return stations.EntryResponse{Allowed: false}, errors.New("station inbox not found")
	}

	responseCh := make(chan stations.EntryResponse)
	inbox <- stations.EntryRequest{
		TrainID:     t.id,
		FromSegment: fromSegment,
		EntryTime:   entryTime,
		ResponseCh:  responseCh,
	}

	response := <-responseCh
	return response, response.Error
}

func (t *Train) notifyStationDeparture(stationID string) {
	inbox, ok := t.stationInboxes[stationID]
	if !ok {
		return
	}

	inbox <- stations.DepartureNotification{
		TrainID: t.id,
	}
}

func (t *Train) requestSegmentEntry(segmentID string, entryTime time.Duration) (segments.EntryResponse, error) {
	inbox, ok := t.segmentInboxes[segmentID]
	if !ok {
		return segments.EntryResponse{Allowed: false}, errors.New("segment inbox not found")
	}

	responseCh := make(chan segments.EntryResponse)
	inbox <- segments.EntryRequest{
		TrainID:    t.id,
		Time:       entryTime,
		ResponseCh: responseCh,
	}

	response := <-responseCh
	return response, response.Error
}

func (t *Train) getTrainAhead(segmentID string, position float64) (segments.GetTrainAheadResponse, error) {
	inbox, ok := t.segmentInboxes[segmentID]
	if !ok {
		return segments.GetTrainAheadResponse{HasTrainAhead: false}, errors.New("segment inbox not found")
	}

	responseCh := make(chan segments.GetTrainAheadResponse)
	inbox <- segments.GetTrainAheadRequest{
		TrainID:    t.id,
		Position:   position,
		ResponseCh: responseCh,
	}

	response := <-responseCh
	return response, response.Error
}

func (t *Train) notifySegmentPosition(segmentID string, position, speed float64) {
	inbox, ok := t.segmentInboxes[segmentID]
	if !ok {
		return
	}

	inbox <- segments.UpdatePositionNotification{
		TrainID:  t.id,
		Position: position,
		Speed:    speed,
	}
}

func (t *Train) notifySegmentExit(segmentID string) {
	inbox, ok := t.segmentInboxes[segmentID]
	if !ok {
		return
	}

	inbox <- segments.ExitNotification{
		TrainID: t.id,
	}
}

func (t *Train) requestPath(fromStation, toStation string) (navigation.PathResponse, error) {
	if t.navigationInbox == nil {
		return navigation.PathResponse{Segments: nil}, errors.New("navigation inbox not set")
	}

	responseCh := make(chan navigation.PathResponse)
	t.navigationInbox <- navigation.PathRequest{
		FromStation: fromStation,
		ToStation:   toStation,
		ResponseCh:  responseCh,
	}

	response := <-responseCh
	return response, response.Error
}
