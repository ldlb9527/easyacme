package migration

import (
	"easyacme/internal/common"
	"easyacme/internal/model"
	"gorm.io/gorm"
)

var AllMigration = make([]*common.Migration, 0)

func init() {
	AllMigration = append(AllMigration, initTable)
}

var initTable = &common.Migration{
	ID: "initTable",
	Action: func(tx *gorm.DB) error {

		err := tx.AutoMigrate(&model.AcmeAccount{})
		if err != nil {
			return err
		}
		err = tx.AutoMigrate(&model.AcmeCert{})
		if err != nil {
			return err
		}

		err = tx.AutoMigrate(&model.DNSProvider{})
		if err != nil {
			return err
		}

		err = tx.AutoMigrate(&model.User{})
		if err != nil {
			return err
		}

		err = tx.AutoMigrate(&model.Role{})
		if err != nil {
			return err
		}
		err = tx.AutoMigrate(&model.UserRole{})
		if err != nil {
			return err
		}

		err = tx.AutoMigrate(&model.RolePermission{})
		if err != nil {
			return err
		}
		return nil
	},
}
