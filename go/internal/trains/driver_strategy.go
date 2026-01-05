package trains

import (
	"time"
)

type DriverCommand struct {
	DesiredSpeed float64
	DesiredAccel float64
	DesiredDecel float64
}

type DriverBehavior interface {
	GetCommand(delay time.Duration) DriverCommand
}

type EcoDriver struct{}

func (d EcoDriver) GetCommand(delay time.Duration) DriverCommand {
	return DriverCommand{
		DesiredSpeed: 0.7,
		DesiredAccel: 0.6,
		DesiredDecel: 0.6,
	}
}

type IntermediateDriver struct{}

func (d IntermediateDriver) GetCommand(delay time.Duration) DriverCommand {
	return DriverCommand{
		DesiredSpeed: 0.7,
		DesiredAccel: 0.8,
		DesiredDecel: 0.8,
	}
}

type CrazyDriver struct{}

func (d CrazyDriver) GetCommand(delay time.Duration) DriverCommand {
	return DriverCommand{
		DesiredSpeed: 1.0,
		DesiredAccel: 0.8,
		DesiredDecel: 0.8,
	}
}

type VeryCrazyDriver struct{}

func (d VeryCrazyDriver) GetCommand(delay time.Duration) DriverCommand {
	return DriverCommand{
		DesiredSpeed: 1.2,
		DesiredAccel: 1.0,
		DesiredDecel: 1.0,
	}
}

type SoigneuxDriver struct{}

func (d SoigneuxDriver) GetCommand(delay time.Duration) DriverCommand {
	return DriverCommand{
		DesiredSpeed: 1.0,
		DesiredAccel: 0.6,
		DesiredDecel: 0.6,
	}
}

func NewDriverBehavior(name string) DriverBehavior {
	switch name {
	case "intermediate":
		return IntermediateDriver{}
	case "crazy":
		return CrazyDriver{}
	case "very_crazy":
		return VeryCrazyDriver{}
	case "soigneux":
		return SoigneuxDriver{}
	default:
		return EcoDriver{}
	}
}
