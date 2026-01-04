package stations

import (
	"sort"
	"time"
)

type StationStrategy interface {
	Sort(demands []demandInfo)
}

// NoSort leaves the slice as-is.
type NoSort struct{}

func (NoSort) Sort(demands []demandInfo) {}

// EntryTimeAsc sorts by entryTime ascending (earlier requests first).
type EntryTimeAsc struct{}

func (EntryTimeAsc) Sort(demands []demandInfo) {
	sort.Slice(demands, func(i, j int) bool {
		return demands[i].entryTime < demands[j].entryTime
	})
}

// DelayAsc sorts by delay ascending (smaller delay first).
type DelayAsc struct{}

func (DelayAsc) Sort(demands []demandInfo) {
	sort.Slice(demands, func(i, j int) bool {
		return demands[i].delay < demands[j].delay
	})
}

// DelayAscWithThreshold sorts by delay ascending but treats trains whose
// delay is greater than 30 minutes as lower priority (they are placed at the end).
type DelayAscWithThreshold struct{}

func (DelayAscWithThreshold) Sort(demands []demandInfo) {
	threshold := 30 * time.Minute
	sort.SliceStable(demands, func(i, j int) bool {
		iOk := demands[i].delay <= threshold
		jOk := demands[j].delay <= threshold
		if iOk != jOk {
			return iOk // true (<=threshold) comes before false
		}
		return demands[i].delay < demands[j].delay
	})
}

func NewStationStrategy(name string) StationStrategy {
	switch name {
	case "entry_time_asc":
		return EntryTimeAsc{}
	case "delay_asc":
		return DelayAsc{}
	case "delay_asc_with_threshold":
		return DelayAscWithThreshold{}
	default:
		return NoSort{}
	}
}
