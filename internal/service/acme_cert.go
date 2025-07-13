package service

import (
	"context"
	"crypto/x509"
	"easyacme/internal/model"
	"encoding/pem"
	"github.com/go-acme/lego/v4/lego"
	"github.com/go-acme/lego/v4/registration"
	"github.com/pkg/errors"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type MonthlyIssuedCert struct {
	Month string `json:"month"`
	Count int64  `json:"count"`
}

type CertStats struct {
	Total         int64               `json:"total"`
	Valid         int64               `json:"valid"`
	Expired       int64               `json:"expired"`
	Revoked       int64               `json:"revoked"`
	MonthlyIssued []MonthlyIssuedCert `json:"monthlyIssued"`
}

type AcmeCertService interface {
	GetCerts(ctx context.Context, req *ListCertReq) (*ListCertResp, error)
	GetCert(ctx context.Context, req *GetCertReq) (*model.AcmeCert, error)
	DeleteAcmeCert(ctx context.Context, req *DeleteAcmeCertReq) error
	RevokeCert(ctx context.Context, req *RevokeCertReq) error
	GetCertStats(ctx context.Context) (*CertStats, error)
}

type AcmeCertServiceImpl struct {
	db                 *gorm.DB
	logger             *zap.Logger
	acmeAccountService AcmeAccountService
}

// NewAcmeCertService .
func NewAcmeCertService(db *gorm.DB, logger *zap.Logger, acmeAccountService AcmeAccountService) AcmeCertService {
	return &AcmeCertServiceImpl{
		db:                 db,
		logger:             logger,
		acmeAccountService: acmeAccountService,
	}
}

type ListCertReq struct {
	Page       int    `form:"page"`
	PageSize   int    `form:"page_size"`
	Domains    string `form:"domains"`
	CertType   string `form:"cert_type"`
	CertStatus string `form:"cert_status"`
}
type ListCertResp struct {
	Total int64            `json:"total"`
	List  []model.AcmeCert `json:"data"`
}

func (s *AcmeCertServiceImpl) GetCerts(ctx context.Context, req *ListCertReq) (*ListCertResp, error) {
	var total int64
	var certs []model.AcmeCert

	query := s.db.Model(&model.AcmeCert{})

	if req.Domains != "" {
		query = query.Where("domains::text ILIKE ?", "%"+req.Domains+"%")
	}

	if req.CertType != "" {
		query = query.Where("cert_type = ?", req.CertType)
	}

	if req.CertStatus != "" {
		query = query.Where("cert_status = ?", req.CertStatus)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, errors.Wrap(err, "failure to count cert")
	}

	offset := (req.Page - 1) * req.PageSize
	if err := query.Offset(offset).Limit(req.PageSize).Order("created_at desc").Find(&certs).Error; err != nil {
		return nil, errors.Wrap(err, "failure to query cert list")
	}
	resp := &ListCertResp{}
	resp.Total = total
	resp.List = certs
	return resp, nil
}

type GetCertReq struct {
	ID string
}

func (s *AcmeCertServiceImpl) GetCert(ctx context.Context, req *GetCertReq) (*model.AcmeCert, error) {
	var cert model.AcmeCert
	if err := s.db.First(&cert, "id = ?", req.ID).Error; err != nil {
		return nil, errors.Wrap(err, "failure to get cert")
	}
	return &cert, nil
}

type DeleteAcmeCertReq struct {
	ID string
}

func (c *AcmeCertServiceImpl) DeleteAcmeCert(ctx context.Context, req *DeleteAcmeCertReq) error {
	if err := c.db.Debug().Model(&model.AcmeCert{}).Where("id = ?", req.ID).Delete(nil).Error; err != nil {
		return errors.Wrap(err, "failure to delete acme cert")
	}
	return nil
}

type RevokeCertReq struct {
	ID string
}

func (s *AcmeCertServiceImpl) RevokeCert(ctx context.Context, req *RevokeCertReq) error {
	// 获取证书信息以便进行ACME吊销操作
	cert, err := s.GetCert(ctx, &GetCertReq{ID: req.ID})
	if err != nil {
		s.logger.Error("GetCert for revoke err: " + err.Error())
		return errors.Wrap(err, "获取证书信息失败")
	}

	// 检查证书状态
	if cert.CertStatus == model.Revoked {
		return errors.New("证书已被吊销")
	}

	if cert.CertStatus != model.Issued {
		return errors.New("只能吊销已签发的证书")
	}

	// 获取ACME账户信息
	account, err := s.acmeAccountService.GetAccount(ctx, &GetAccountReq{ID: cert.AccountID})
	if err != nil {
		s.logger.Error("GetAccount for revoke err: " + err.Error())
		return errors.Wrap(err, "获取账户信息失败")
	}

	// 还原私钥
	block, _ := pem.Decode([]byte(account.KeyPem))
	if block == nil {
		return errors.New("Invalid private key")
	}
	privKey, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return errors.New("Parse private key failed")
	}

	// 创建ACME客户端
	user := &User{
		Email:        account.Email,
		Registration: (*registration.Resource)(account.Registration),
		Key:          privKey,
	}
	conf := lego.NewConfig(user)
	conf.CADirURL = account.Server
	client, err := lego.NewClient(conf)
	if err != nil {
		s.logger.Error("Create client for revoke err: " + err.Error())
		return errors.Wrap(err, "Create client failed")
	}

	// 执行ACME证书吊销
	err = client.Certificate.Revoke([]byte(cert.Certificate))
	if err != nil {
		s.logger.Error("ACME revoke err: " + err.Error())
		return errors.Wrap(err, "ACME吊销失败")
	}

	// 更新数据库中的证书状态
	if err := s.db.Model(&model.AcmeCert{}).Where("id = ?", req.ID).Update("cert_status", model.Revoked).Error; err != nil {
		return errors.Wrap(err, "failure to revoke cert")
	}

	s.logger.Info("Certificate revoked successfully", zap.String("cert_id", req.ID))
	return nil
}

func (s *AcmeCertServiceImpl) GetCertStats(ctx context.Context) (*CertStats, error) {
	var stats CertStats

	// Optimized query to get all counts in a single DB call.
	countsQuery := `
		SELECT
			COUNT(*) AS total,
			COUNT(*) FILTER (WHERE cert_status = 'issued' AND issued_at IS NOT NULL AND issued_at + (validity_days || ' days')::interval > NOW()) AS valid,
			COUNT(*) FILTER (WHERE cert_status = 'issued' AND issued_at IS NOT NULL AND issued_at + (validity_days || ' days')::interval <= NOW()) AS expired,
			COUNT(*) FILTER (WHERE cert_status = 'revoked') AS revoked
		FROM acme_certs`

	// Use Row().Scan() to map columns to fields directly, avoiding complex GORM struct mapping.
	row := s.db.Raw(countsQuery).Row()
	if err := row.Scan(&stats.Total, &stats.Valid, &stats.Expired, &stats.Revoked); err != nil {
		return nil, errors.Wrap(err, "failed to get certificate stats counts")
	}

	// Monthly issued for the last 6 months (PostgreSQL syntax)
	if err := s.db.Model(&model.AcmeCert{}).
		Select("TO_CHAR(created_at, 'YYYY-MM') as month, count(*) as count").
		Where("created_at > NOW() - INTERVAL '6 months'").
		Group("month").
		Order("month DESC").
		Find(&stats.MonthlyIssued).Error; err != nil {
		// It's not an error if no records are found.
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.Wrap(err, "failed to get monthly issued certs stats")
		}
	}

	return &stats, nil
}
