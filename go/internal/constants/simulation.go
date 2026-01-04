package constants

// Unit conversions
const (
	KmHToMPerMin = 1000.0 / 60.0
	KmH_to_MS    = 1000.0 / 3600.0
)

// Acceleration and braking rates (in m/min per minute)
const (
	MaxAcceleration = 0.50  // m/s²
	MaxServiceBrake = -0.50 // m/s²
	EmergencyBrake  = -1.00 // m/s²
)

// Distances (in meters)
const (
	DesiredGap                  = 2000.0
	SafetyDistance              = 4000.0
	StationEntryRequestDistance = 100.0
)

// Speed adjustments
const (
	EmergencySpeedReduction = 10.0
	ApproachSpeedFactor     = 10.0
)
