package service

import (
	"context"
	"crypto"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"easyacme/internal/model"
	"encoding/pem"
	"github.com/go-acme/lego/v4/lego"
	"github.com/go-acme/lego/v4/registration"
	"github.com/google/uuid"
	"github.com/pkg/errors"
	"go.uber.org/zap"
	"gorm.io/gorm"
	"strconv"
	"time"
)

type CreateAcmeAccountReq struct {
	Name       string `json:"name"`
	Server     string `json:"server"`
	Email      string `json:"email"`
	KeyType    string `json:"key_type"`
	EABKID     string `json:"eab_kid"`
	EABHMACKey string `json:"eab_hmac_key"`
}

type DeactivateAcmeAccountReq struct {
	ID string
}

type AccountStats struct {
	Total       int64 `json:"total"`
	Valid       int64 `json:"valid"`
	Deactivated int64 `json:"deactivated"`
	Revoked     int64 `json:"revoked"`
}

type AcmeAccountService interface {
	CreateAcmeAccount(ctx context.Context, req *CreateAcmeAccountReq) error
	GetAccounts(ctx context.Context, req *ListAccountReq) (*ListAccountResp, error)
	GetAccount(ctx context.Context, req *GetAccountReq) (*model.AcmeAccount, error)
	DeleteAcmeAccount(ctx context.Context, req *DeleteAcmeAccountReq) error
	DeactivateAcmeAccount(ctx context.Context, req *DeactivateAcmeAccountReq) error
	GetAccountStats(ctx context.Context) (*AccountStats, error)
}

type AcmeAccountServiceImpl struct {
	db     *gorm.DB
	logger *zap.Logger
}

// NewAcmeAccountService .
func NewAcmeAccountService(db *gorm.DB, logger *zap.Logger) AcmeAccountService {
	return &AcmeAccountServiceImpl{
		db:     db,
		logger: logger,
	}
}

// CreateAcmeAccount .
func (s *AcmeAccountServiceImpl) CreateAcmeAccount(ctx context.Context, req *CreateAcmeAccountReq) error {

	user, err := newUser(req)
	if err != nil {
		return errors.Wrap(err, "failure to new user")
	}
	conf := lego.NewConfig(user)
	conf.CADirURL = req.Server //lego.LEDirectoryStaging //"https://acme-staging-v02.api.letsencrypt.org/directory"
	client, err := lego.NewClient(conf)
	if err != nil {
		return errors.Wrap(err, "failure to create client")
	}

	var result *registration.Resource
	if req.EABKID != "" && req.EABHMACKey != "" {
		result, err = client.Registration.RegisterWithExternalAccountBinding(registration.RegisterEABOptions{
			TermsOfServiceAgreed: true,
			Kid:                  req.EABKID,
			HmacEncoded:          req.EABHMACKey,
		})
	} else {
		result, err = client.Registration.Register(registration.RegisterOptions{TermsOfServiceAgreed: true})
	}
	if err != nil {
		return errors.Wrap(err, "failure to register acme account")
	}

	privateKey := conf.User.GetPrivateKey()
	der, err := x509.MarshalPKCS8PrivateKey(privateKey)
	pemBlock := &pem.Block{
		Type:  "EC PRIVATE KEY",
		Bytes: der,
	}
	pemStr := pem.EncodeToMemory(pemBlock)

	id := uuid.New().String()

	account := model.AcmeAccount{Model: model.Model{ID: id, CreatedAt: time.Now(), UpdatedAt: time.Now()}, Name: req.Name, KeyPem: string(pemStr), KeyType: "RSA2048",
		Uri: result.URI, Email: req.Email, Server: conf.CADirURL, Status: result.Body.Status,
		Registration: (*model.RegistrationResource)(result)}
	if req.EABKID != "" && req.EABHMACKey != "" {
		account.EABKeyID = req.EABKID
		account.EABMacKey = req.EABHMACKey
	}
	err = s.db.Create(&account).Error
	if err != nil {
		return errors.Wrap(err, "failure to create account")
	}
	return nil
}

type ListAccountReq struct {
	Page     int    `form:"page"`
	PageSize int    `form:"page_size"`
	Name     string `form:"name"`
	Status   string `form:"status"`
	BindEAB  *bool  `form:"bind_eab"`
}

// 添加分页查询的响应结构体
type ListAccountResp struct {
	Total int64               `json:"total"`
	List  []model.AcmeAccount `json:"data"`
}

// CreateAcmeAccount .
func (s *AcmeAccountServiceImpl) GetAccounts(ctx context.Context, req *ListAccountReq) (*ListAccountResp, error) {
	resp := &ListAccountResp{}

	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = 10
	}

	var total int64
	var accounts []model.AcmeAccount

	query := s.db.Model(&model.AcmeAccount{})

	// 名称筛选
	if req.Name != "" {
		query = query.Where("name ILIKE ?", "%"+req.Name+"%")
	}
	// 状态筛选
	if req.Status != "" {
		query = query.Where("status = ?", req.Status)
	}
	// EAB绑定筛选
	if req.BindEAB != nil {
		if *req.BindEAB {
			query = query.Where("eab_key_id != '' AND eab_key_id IS NOT NULL")
		} else {
			query = query.Where("(eab_key_id = '' OR eab_key_id IS NULL)")
		}
	}

	// 计算总数
	if err := query.Count(&total).Error; err != nil {
		return nil, errors.Wrap(err, "failure to count account")
	}
	resp.Total = total

	// 分页查询
	offset := (req.Page - 1) * req.PageSize
	if err := query.Offset(offset).Limit(req.PageSize).Order("created_at desc").Find(&accounts).Error; err != nil {
		return nil, errors.Wrap(err, "failure to query account")
	}
	resp.List = accounts
	return resp, nil
}

type GetAccountReq struct {
	ID string
}

func (s *AcmeAccountServiceImpl) GetAccount(ctx context.Context, req *GetAccountReq) (*model.AcmeAccount, error) {
	var account model.AcmeAccount
	if err := s.db.First(&account, "id = ?", req.ID).Error; err != nil {
		return nil, errors.Wrap(err, "failure to get account")
	}
	return &account, nil
}

type User struct {
	Email        string
	Registration *registration.Resource
	Key          crypto.PrivateKey
}

func (u *User) GetEmail() string {
	return u.Email
}
func (u *User) GetRegistration() *registration.Resource {
	return u.Registration
}
func (u *User) GetPrivateKey() crypto.PrivateKey {
	return u.Key
}
func newUser(req *CreateAcmeAccountReq) (*User, error) {

	var err error
	var privateKey crypto.PrivateKey
	switch req.KeyType {
	case "P256":
		privateKey, err = ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	case "P384":
		privateKey, err = ecdsa.GenerateKey(elliptic.P384(), rand.Reader)
	case "2048", "3072", "4096", "8192":
		val, _ := strconv.Atoi(req.KeyType)
		privateKey, err = rsa.GenerateKey(rand.Reader, val)
	}
	if err != nil {
		return nil, err
	}

	return &User{
		Email: req.Email,
		Key:   privateKey,
	}, nil
}

type DeleteAcmeAccountReq struct {
	ID string
}

func (a *AcmeAccountServiceImpl) DeleteAcmeAccount(ctx context.Context, req *DeleteAcmeAccountReq) error {
	if err := a.db.Debug().Model(&model.AcmeAccount{}).Where("id = ?", req.ID).Delete(nil).Error; err != nil {
		return errors.Wrap(err, "failure to delete acme account")
	}
	return nil
}

func (a *AcmeAccountServiceImpl) DeactivateAcmeAccount(ctx context.Context, req *DeactivateAcmeAccountReq) error {
	// 获取账户信息
	account, err := a.GetAccount(ctx, &GetAccountReq{ID: req.ID})
	if err != nil {
		return errors.Wrap(err, "failed to get acme account")
	}

	// 解析私钥
	block, _ := pem.Decode([]byte(account.KeyPem))
	if block == nil {
		return errors.New("failed to decode PEM block containing private key")
	}
	privateKey, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return errors.Wrap(err, "failed to parse private key")
	}

	// 创建用户对象
	user := &User{
		Email:        account.Email,
		Key:          privateKey,
		Registration: (*registration.Resource)(account.Registration),
	}

	// 配置 lego 客户端
	conf := lego.NewConfig(user)
	conf.CADirURL = account.Server
	client, err := lego.NewClient(conf)
	if err != nil {
		return errors.Wrap(err, "failed to create lego client")
	}

	// 停用账户
	err = client.Registration.DeleteRegistration()
	if err != nil {
		return errors.Wrap(err, "failed to deactivate acme account")
	}

	updates := make(map[string]interface{})
	updates["status"] = "deactivated"
	updates["update_at"] = time.Now()
	err = a.db.Model(&model.AcmeAccount{}).Where("id = ?", req.ID).Updates(updates).Error
	if err != nil {
		return errors.Wrap(err, "failed to update account status in database")
	}

	return nil
}

func (s *AcmeAccountServiceImpl) GetAccountStats(ctx context.Context) (*AccountStats, error) {
	var stats AccountStats

	// Group by status
	type StatusCount struct {
		Status string
		Count  int64
	}
	var statusCounts []StatusCount
	err := s.db.Model(&model.AcmeAccount{}).Select("status, count(*) as count").Group("status").Find(&statusCounts).Error
	if err != nil {
		return nil, errors.Wrap(err, "failed to count accounts by status")
	}

	for _, sc := range statusCounts {
		stats.Total += sc.Count
		switch sc.Status {
		case "valid":
			stats.Valid = sc.Count
		case "deactivated":
			stats.Deactivated = sc.Count
		case "revoked":
			stats.Revoked = sc.Count
		}
	}

	return &stats, nil
}
