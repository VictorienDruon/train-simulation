package navigation

import "fmt"

type NavigationMessage interface {
	isMessage()
}

type PathRequest struct {
	FromStation string
	ToStation   string
	ResponseCh  chan PathResponse
}

func (PathRequest) isMessage() {}

type SegmentInfo struct {
	ID       string
	Length   float64
	MaxSpeed float64
}

type PathResponse struct {
	Segments []SegmentInfo
	Error    error
}

func (n *NavigationService) handlePathRequest(req PathRequest) {
	var segments []SegmentInfo
	currentStation := req.FromStation

	// Track visited stations to detect infinite loops (cycles) immediately
	visited := make(map[string]bool)

	// 100 is usually enough for any train path, but we can make it safer
	maxIterations := 100

	for range maxIterations {
		if currentStation == req.ToStation {
			req.ResponseCh <- PathResponse{
				Segments: segments,
				Error:    nil,
			}
			return
		}

		// 1. Cycle Detection: If we've been here before, we are in a loop
		if visited[currentStation] {
			req.ResponseCh <- PathResponse{
				Segments: nil,
				Error:    fmt.Errorf("infinite loop detected at station %s while routing to %s", currentStation, req.ToStation),
			}
			return
		}
		visited[currentStation] = true

		toMap, exists := n.paths[currentStation]
		if !exists {
			req.ResponseCh <- PathResponse{
				Segments: nil,
				Error:    fmt.Errorf("dead end: no outgoing paths found from station %s", currentStation),
			}
			return
		}

		segmentID, exists := toMap[req.ToStation]
		if !exists {
			req.ResponseCh <- PathResponse{
				Segments: nil,
				Error:    fmt.Errorf("routing error: no path from %s knows how to reach %s", currentStation, req.ToStation),
			}
			return
		}

		segment, exists := n.segments[segmentID]
		if !exists {
			req.ResponseCh <- PathResponse{
				Segments: nil,
				Error:    fmt.Errorf("data integrity error: segment %s (from %s to %s) is missing from segment database", segmentID, currentStation, req.ToStation),
			}
			return
		}

		segments = append(segments, SegmentInfo{
			ID:       segment.ID(),
			Length:   segment.Length(),
			MaxSpeed: segment.MaxSpeed(),
		})

		// Move to the next station in the chain
		currentStation = segment.ToStationID()
	}

	req.ResponseCh <- PathResponse{
		Segments: nil,
		Error:    fmt.Errorf("path too long: exceeded %d segments from %s to %s", maxIterations, req.FromStation, req.ToStation),
	}
}
