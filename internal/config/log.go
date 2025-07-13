package config

import (
	"go.uber.org/zap"
)

func NewLogger(cfg *Config) *zap.Logger {
	if cfg.GetEnv() == "prod" {
		logger, err := zap.NewProduction()
		if err != nil {
			panic(err)
		}
		return logger
	}

	logger, err := zap.NewDevelopment()
	if err != nil {
		panic(err)
	}
	return logger
}
