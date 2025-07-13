package service

import (
	"context"
	"easyacme/internal/model"
	"github.com/google/uuid"
	"github.com/pkg/errors"
	//dnspod "github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/dnspod/v20210323"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type DNSProviderStat struct {
	Name  string `json:"name"`
	Count int64  `json:"count"`
}

type DNSService interface {
	CreateDNSProvider(ctx context.Context, req *CreateDNSProviderReq) error
	GetDNSProvers(ctx context.Context, req *ListDNSProviderReq) (*ListDNSProviderResp, error)
	GetDNSProver(ctx context.Context, req *GetDNSProviderReq) (*model.DNSProvider, error)
	UpdateDNSProvider(ctx context.Context, req *UpdateDNSProviderReq) error
	DeleteDNSProver(ctx context.Context, req *DeleteDNSProviderReq) error
	BatchDeleteDNSProvers(ctx context.Context, req *BatchDeleteDNSProviderReq) error
	GetDNSProviderStats(ctx context.Context) ([]DNSProviderStat, error)
	GetDNSProviderSecrets(ctx context.Context, req *GetDNSProviderSecretsReq) (*DNSProviderSecrets, error)
}

type DNSServiceImpl struct {
	db     *gorm.DB
	logger *zap.Logger
}

type ListDNSProviderReq struct {
	Page     int           `form:"page"`
	PageSize int           `form:"page_size"`
	Type     model.DNSType `form:"type"`
	Name     string        `form:"name"`
}

type ListDNSProviderResp struct {
	Total int64               `json:"total"`
	List  []model.DNSProvider `json:"data"`
}

func (d *DNSServiceImpl) GetDNSProvers(ctx context.Context, req *ListDNSProviderReq) (*ListDNSProviderResp, error) {
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = 10
	}

	var total int64
	var providers []model.DNSProvider

	// 构建查询条件
	query := d.db.Model(&model.DNSProvider{})

	// 如果指定了类型，添加过滤条件
	if req.Type != "" && req.Type.IsValid() {
		query = query.Where("type = ?", req.Type)
	}

	// 如果指定了名称，添加模糊搜索条件
	if req.Name != "" {
		query = query.Where("name LIKE ?", "%"+req.Name+"%")
	}

	// 计算总数
	if err := query.Count(&total).Error; err != nil {
		return nil, errors.Wrap(err, "failure to count dns providers")
	}

	// 分页查询
	offset := (req.Page - 1) * req.PageSize
	if err := query.Offset(offset).Limit(req.PageSize).Order("created_at desc").Find(&providers).Error; err != nil {
		return nil, errors.Wrap(err, "failure to query dns provider list")
	}

	for i := range providers {
		providers[i].SecretKey = ""
	}

	resp := &ListDNSProviderResp{}
	resp.Total = total
	resp.List = providers
	return resp, nil
}

type CreateDNSProviderReq struct {
	Name      string        `json:"name"`
	Type      model.DNSType `json:"type"`
	SecretId  string        `json:"secret_id"`
	SecretKey string        `json:"secret_key"`
	Notes     string        `json:"notes"`
}

func (d *DNSServiceImpl) CreateDNSProvider(ctx context.Context, req *CreateDNSProviderReq) error {
	// 验证DNS类型是否有效
	if !req.Type.IsValid() {
		return errors.New("invalid DNS provider type: " + req.Type.String())
	}

	err := d.db.Create(&model.DNSProvider{Model: model.Model{ID: uuid.New().String()}, Name: req.Name, Type: req.Type,
		SecretId: req.SecretId, SecretKey: req.SecretKey, Notes: req.Notes}).Error
	if err != nil {
		return errors.Wrap(err, "create provider fail")
	}
	return nil
}

// NewDNSService .
func NewDNSService(db *gorm.DB, logger *zap.Logger) DNSService {
	return &DNSServiceImpl{
		db:     db,
		logger: logger,
	}
}

type GetDNSProviderReq struct {
	ID string
}

func (d *DNSServiceImpl) GetDNSProver(ctx context.Context, req *GetDNSProviderReq) (*model.DNSProvider, error) {
	var cert model.DNSProvider
	if err := d.db.First(&cert, "id = ?", req.ID).Error; err != nil {
		return nil, errors.Wrap(err, "failure to get cert")
	}
	cert.SecretKey = ""
	return &cert, nil
}

type UpdateDNSProviderReq struct {
	ID        string        `json:"id"`
	Name      string        `json:"name"`
	Type      model.DNSType `json:"type"`
	SecretId  string        `json:"secret_id"`
	SecretKey string        `json:"secret_key"`
	Notes     string        `json:"notes"`
}

func (d *DNSServiceImpl) UpdateDNSProvider(ctx context.Context, req *UpdateDNSProviderReq) error {
	// 验证DNS类型是否有效
	if !req.Type.IsValid() {
		return errors.New("invalid DNS provider type: " + req.Type.String())
	}

	// 更新DNS提供商
	updateData := map[string]interface{}{
		"name":       req.Name,
		"type":       req.Type,
		"secret_id":  req.SecretId,
		"secret_key": req.SecretKey,
		"notes":      req.Notes,
	}

	if err := d.db.Model(&model.DNSProvider{}).Where("id = ?", req.ID).Updates(updateData).Error; err != nil {
		return errors.Wrap(err, "failure to update dns provider")
	}
	return nil
}

type GetDNSProviderSecretsReq struct {
	ID string `json:"id"`
}

type DNSProviderSecrets struct {
	SecretKey string `json:"secret_key"`
}

func (d *DNSServiceImpl) GetDNSProviderSecrets(ctx context.Context, req *GetDNSProviderSecretsReq) (*DNSProviderSecrets, error) {
	var provider model.DNSProvider
	if err := d.db.Select("secret_key").First(&provider, "id = ?", req.ID).Error; err != nil {
		return nil, errors.Wrap(err, "failure to get dns provider")
	}
	return &DNSProviderSecrets{
		SecretKey: provider.SecretKey,
	}, nil
}

type DeleteDNSProviderReq struct {
	ID string
}

func (d *DNSServiceImpl) DeleteDNSProver(ctx context.Context, req *DeleteDNSProviderReq) error {

	if err := d.db.Debug().Model(&model.DNSProvider{}).Where("id = ?", req.ID).Delete(nil).Error; err != nil {
		return errors.Wrap(err, "failure to delete provider")
	}
	return nil
}

type BatchDeleteDNSProviderReq struct {
	IDs []string `json:"ids"`
}

func (d *DNSServiceImpl) BatchDeleteDNSProvers(ctx context.Context, req *BatchDeleteDNSProviderReq) error {
	if len(req.IDs) == 0 {
		return errors.New("IDs are empty")
	}

	if err := d.db.Model(&model.DNSProvider{}).Where("id IN ?", req.IDs).Delete(nil).Error; err != nil {
		return errors.Wrap(err, "failure to batch delete providers")
	}
	return nil
}

func (d *DNSServiceImpl) GetDNSProviderStats(ctx context.Context) ([]DNSProviderStat, error) {
	var stats []DNSProviderStat
	err := d.db.Model(&model.DNSProvider{}).Select("type as name, count(*) as count").Group("type").Find(&stats).Error
	if err != nil {
		return nil, errors.Wrap(err, "failed to get dns provider stats")
	}
	return stats, nil
}
