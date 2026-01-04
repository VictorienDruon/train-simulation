package trains

import "time"

type trainState interface {
	percept(train *Train, currentTime time.Duration)
	deliberate(train *Train, currentTime time.Duration)
	act(train *Train, currentTime time.Duration)
}
