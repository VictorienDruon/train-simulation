package navigation

import (
	"ai30-project/internal/segments"
	"fmt"
)

type Paths map[string]map[string]string

type NavigationService struct {
	paths    Paths
	segments map[string]*segments.Segment
	inbox    chan NavigationMessage
}

func NewNavigationService(paths Paths, segments map[string]*segments.Segment) *NavigationService {
	return &NavigationService{
		paths:    paths,
		segments: segments,
		inbox:    make(chan NavigationMessage, 100),
	}
}

func (n *NavigationService) Inbox() chan NavigationMessage {
	return n.inbox
}

func (n *NavigationService) Run() {
	for {
		msg, ok := <-n.inbox
		if !ok {
			return
		}

		switch m := msg.(type) {
		case PathRequest:
			n.handlePathRequest(m)
		default:
			fmt.Printf("  [Navigation] ERROR: Unknown message type\n")
		}
	}
}
