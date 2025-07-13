package model

import (
	"database/sql/driver"
	"encoding/json"
	"github.com/go-acme/lego/v4/registration"
	"time"
)

type Model struct {
	ID        string    `json:"id" gorm:"primarykey"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type AcmeAccount struct {
	Model
	Name         string                `json:"name"`
	KeyPem       string                `json:"key_pem"`
	KeyType      string                `json:"key_type"`
	Uri          string                `json:"uri"`
	Server       string                `json:"server"`
	Email        string                `json:"email"`
	Status       string                `json:"status"`
	EABKeyID     string                `json:"eab_key_id"`
	EABMacKey    string                `json:"eab_mac_key"`
	Registration *RegistrationResource `json:"registration" gorm:"column:registration;type:jsonb"`
}

type RegistrationResource registration.Resource

func (r *RegistrationResource) Value() (driver.Value, error) {
	if r == nil {
		return nil, nil
	}
	return json.Marshal(r)
}

func (r *RegistrationResource) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, r)
}

func (a AcmeAccount) TableName() string {
	return "acme_accounts"
}
