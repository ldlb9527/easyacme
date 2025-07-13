package model

// DNSType 定义DNS提供商类型
type DNSType string

// DNS提供商类型常量
const (
	DNSTypeTencentCloud DNSType = "tencentcloud"
	DNSTypeAliyun       DNSType = "aliyun"
	DNSTypeCloudflare   DNSType = "cloudflare"
	DNSTypeGoDaddy      DNSType = "godaddy"
)

// IsValid 验证DNS类型是否有效
func (d DNSType) IsValid() bool {
	switch d {
	case DNSTypeTencentCloud, DNSTypeAliyun, DNSTypeCloudflare, DNSTypeGoDaddy:
		return true
	default:
		return false
	}
}

// String 返回DNS类型的字符串表示
func (d DNSType) String() string {
	return string(d)
}

// GetDisplayName 获取DNS类型的显示名称
func (d DNSType) GetDisplayName() string {
	switch d {
	case DNSTypeTencentCloud:
		return "腾讯云"
	case DNSTypeAliyun:
		return "阿里云"
	case DNSTypeCloudflare:
		return "Cloudflare"
	case DNSTypeGoDaddy:
		return "GoDaddy"
	default:
		return "未知"
	}
}

type DNSProvider struct {
	Model
	Name      string  `json:"name"`
	Type      DNSType `json:"type"`
	SecretId  string  `json:"secret_id"`
	SecretKey string  `json:"secret_key"` // todo encrypt
	Notes     string  `json:"notes"`
}

func (a DNSProvider) TableName() string {
	return "dns_providers"
}
