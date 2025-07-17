package config

import (
	"fmt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"go.uber.org/zap"
)

// NewDB .
func NewDB(cfg *Config, logger *zap.Logger) *gorm.DB {
	tpl := "host=%s user=%s password=%s dbname=%s port=%d sslmode=disable"

	dsn := fmt.Sprintf(tpl, cfg.GetDBHost(), cfg.GetDBUser(), cfg.GetDBPassword(), cfg.GetDBName(), cfg.GetDBPort())

	var err error
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		logger.Fatal("failed to connect to database: " + err.Error())
		panic(err)
	}

	db = db.Debug()
	return db
}
