package model

// DNSType 定义DNS提供商类型
type DNSType string

// DNS提供商类型常量
const (
	DNSTypeTencentCloud DNSType = "tencentcloud"
	DNSTypeAliyun       DNSType = "aliyun"
	DNSTypeHuaweiCloud  DNSType = "huaweicloud"
	DNSTypeBaiduCloud   DNSType = "baiducloud"
	DNSTypeCloudflare   DNSType = "cloudflare"
	DNSTypeGoDaddy      DNSType = "godaddy"
	DNSTypeRoute53      DNSType = "route53"
)

// IsValid 验证DNS类型是否有效
func (d DNSType) IsValid() bool {
	switch d {
	case DNSTypeTencentCloud, DNSTypeAliyun, DNSTypeHuaweiCloud, DNSTypeBaiduCloud, DNSTypeCloudflare, DNSTypeGoDaddy, DNSTypeRoute53:
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
	case DNSTypeHuaweiCloud:
		return "华为云"
	case DNSTypeBaiduCloud:
		return "百度云"
	case DNSTypeCloudflare:
		return "Cloudflare"
	case DNSTypeGoDaddy:
		return "GoDaddy"
	case DNSTypeRoute53:
		return "AWS Route53"
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
