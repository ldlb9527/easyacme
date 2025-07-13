package config

import (
	"easyacme/internal/model"
	"fmt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"go.uber.org/zap"
)

// NewDB 创建数据库连接
func NewDB(cfg *Config, logger *zap.Logger) *gorm.DB {
	tpl := "host=%s user=%s password=%s dbname=%s port=%d sslmode=disable"

	dsn := fmt.Sprintf(tpl, cfg.GetDBHost(), cfg.GetDBUser(), cfg.GetDBPassword(), cfg.GetDBName(), cfg.GetDBPort())

	// 连接到 PostgreSQL 数据库
	var err error
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		logger.Fatal("failed to connect to database: " + err.Error())
		panic(err)
	}

	// 开启全局调试模式，打印所有SQL语句
	db = db.Debug()

	err = db.AutoMigrate(&model.AcmeAccount{})
	if err != nil {
		panic(err)
	}
	err = db.AutoMigrate(&model.AcmeCert{})
	if err != nil {
		panic(err)
	}

	err = db.AutoMigrate(&model.DNSProvider{})
	if err != nil {
		panic(err)
	}

	err = db.AutoMigrate(&model.User{})
	if err != nil {
		panic(err)
	}

	err = db.AutoMigrate(&model.Role{})
	if err != nil {
		panic(err)
	}
	err = db.AutoMigrate(&model.UserRole{})
	if err != nil {
		panic(err)
	}

	err = db.AutoMigrate(&model.RolePermission{})
	if err != nil {
		panic(err)
	}

	return db
}
