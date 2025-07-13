package model

import (
	"github.com/go-acme/lego/v4/certcrypto"
	"github.com/lib/pq"
	"time"
)

// CertType 证书类型
type CertType string

const (
	CertTypeDV CertType = "DV" // Domain Validation 域名验证型证书
	CertTypeOV CertType = "OV" // Organization Validation 组织验证型证书
)

type CertStatus string

const (
	NotIssued CertStatus = "not_issued"
	Issued    CertStatus = "issued"
	Expired   CertStatus = "expired"
	Revoked   CertStatus = "revoked"
)

type AcmeCert struct {
	Model
	Domains           pq.StringArray     `json:"domains" gorm:"type:text[]"`
	KeyType           certcrypto.KeyType `json:"key_type"`
	AccountID         string             `json:"account_id"`
	DNSProviderID     string             `json:"dns_provider_id"`
	CertType          CertType           `json:"cert_type" gorm:"type:text;default:'DV'"`
	CertStatus        CertStatus         `json:"cert_status" gorm:"type:text;default:'not_issued'"`
	IssuedAt          *time.Time         `json:"issued_at" gorm:"type:timestamp"`   // 签发时间
	ValidityDays      int                `json:"validity_days" gorm:"type:integer"` // 有效期（天数）
	CertURL           string             `json:"cert_url"`
	CertStableURL     string             `json:"cert_stable_url"`
	PrivateKey        string             `json:"private_key"` //todo encrypt
	Certificate       string             `json:"certificate"`
	IssuerCertificate string             `json:"issuer_certificate"`
	CSR               string             `json:"csr"`
}

func (a AcmeCert) TableName() string {
	return "acme_certs"
}
