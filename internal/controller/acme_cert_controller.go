package controller

import (
	"crypto/x509"
	"easyacme/internal/config"
	"easyacme/internal/model"
	"easyacme/internal/service"
	"encoding/pem"
	"errors"
	"fmt"
	"github.com/go-acme/lego/v4/challenge/resolver"
	"github.com/go-acme/lego/v4/log"
	"github.com/go-acme/lego/v4/platform/wait"
	"net"
	"net/http"
	"reflect"
	"strconv"
	"strings"
	"time"
	"unsafe"

	"github.com/cenkalti/backoff/v4"
	"github.com/gin-gonic/gin"
	"github.com/go-acme/lego/v4/acme"
	"github.com/go-acme/lego/v4/acme/api"
	"github.com/go-acme/lego/v4/certcrypto"
	"github.com/go-acme/lego/v4/certificate"
	"github.com/go-acme/lego/v4/challenge"
	"github.com/go-acme/lego/v4/challenge/dns01"
	"github.com/go-acme/lego/v4/lego"
	"github.com/go-acme/lego/v4/providers/dns/alidns"
	"github.com/go-acme/lego/v4/providers/dns/cloudflare"
	"github.com/go-acme/lego/v4/providers/dns/godaddy"
	"github.com/go-acme/lego/v4/providers/dns/tencentcloud"
	"github.com/go-acme/lego/v4/registration"
	"github.com/google/uuid"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type AcmeCertController struct {
	db                 *gorm.DB
	logger             *zap.Logger
	acmeAccountService service.AcmeAccountService
	acmeCertService    service.AcmeCertService
	dnsService         service.DNSService
	cache              config.Cache
}

// NewAcmeCertController .
func NewAcmeCertController(db *gorm.DB, logger *zap.Logger, acmeAccountService service.AcmeAccountService,
	acmeCertService service.AcmeCertService, cache config.Cache, dnsService service.DNSService) *AcmeCertController {
	return &AcmeCertController{
		db:                 db,
		logger:             logger,
		acmeAccountService: acmeAccountService,
		acmeCertService:    acmeCertService,
		cache:              cache,
		dnsService:         dnsService,
	}
}

type NewCertReq struct {
	KeyType   certcrypto.KeyType `json:"key_type"`
	AccountID string             `json:"account_id"`
	Domains   []string           `json:"domains"`
}

func (s *AcmeCertController) NewCert(c *gin.Context) {
	var req NewCertReq

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	account, err := s.acmeAccountService.GetAccount(c.Request.Context(), &service.GetAccountReq{ID: req.AccountID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	block, _ := pem.Decode([]byte(account.KeyPem))
	if block == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid private key"})
		return
	}
	privKey, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Parse private key failed"})
		return
	}

	user := &service.User{
		Email:        account.Email,
		Registration: (*registration.Resource)(account.Registration),
		Key:          privKey,
	}
	conf := lego.NewConfig(user)
	conf.CADirURL = account.Server
	conf.Certificate.KeyType = req.KeyType
	client, err := lego.NewClient(conf)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Create client failed"})
		return
	}

	// 此处 NewCert 为快速测试函数，实际业务逻辑请使用 GenCert
	// 注意: NewCert 未提供 DNSProviderID，无法动态创建 Provider，此处将不再设置
	// 如需测试，请手动指定或修改代码
	// err = client.Challenge.SetDNS01Provider(tencentProvider)
	// if err != nil {
	// 	c.JSON(http.StatusInternalServerError, gin.H{"error": "设置 DNS-01 Provider 失败: " + err.Error()})
	// 	return
	// }

	// 申请证书
	r := certificate.ObtainRequest{Domains: req.Domains, Bundle: true, MustStaple: false}
	certRes, err := client.Certificate.Obtain(r)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	der, err := x509.MarshalPKCS8PrivateKey(certRes.PrivateKey)
	pemBlock := &pem.Block{
		Type:  "EC PRIVATE KEY",
		Bytes: der,
	}
	pemStr := pem.EncodeToMemory(pemBlock)

	id := uuid.New().String()
	// 解析证书信息
	certInfo := s.parseCertInfo(string(certRes.Certificate))

	err = s.db.Create(&model.AcmeCert{Model: model.Model{ID: id, CreatedAt: time.Now(), UpdatedAt: time.Now()},
		Domains:   req.Domains,
		KeyType:   req.KeyType,
		AccountID: req.AccountID, DNSProviderID: "cs", CertType: certInfo.CertType, IssuedAt: certInfo.IssuedAt, ValidityDays: certInfo.ValidityDays,
		CertURL: certRes.CertURL, CertStableURL: certRes.CertStableURL,
		PrivateKey: string(pemStr), Certificate: string(certRes.Certificate), IssuerCertificate: string(certRes.IssuerCertificate),
		CSR: string(certRes.CSR),
	}).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, nil)
}

func (s *AcmeCertController) GetCerts(c *gin.Context) {
	var req service.ListCertReq
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.Page < 1 {
		req.Page = 1
	}
	if req.PageSize < 1 {
		req.PageSize = 20
	}
	resp, err := s.acmeCertService.GetCerts(c.Request.Context(), &req)
	if err != nil {
		s.logger.Error("获取证书列表失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (s *AcmeCertController) GetCert(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID is empty"})
		return
	}
	cert, err := s.acmeCertService.GetCert(c.Request.Context(), &service.GetCertReq{ID: id})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, cert)
}

type AuthReq struct {
	KeyType   certcrypto.KeyType `json:"key_type"`
	AccountID string             `json:"account_id"`
	Domains   []string           `json:"domains"`
}

func (s *AcmeCertController) CreateAuth(c *gin.Context) {
	var req AuthReq
	// 绑定 JSON 请求体到 user 结构体
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	account, err := s.acmeAccountService.GetAccount(c.Request.Context(), &service.GetAccountReq{ID: req.AccountID})
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	// 还原私钥
	block, _ := pem.Decode([]byte(account.KeyPem))
	if block == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid private key"})
		return
	}
	privKey, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Parse private key failed"})
		return
	}

	user := &service.User{
		Email:        account.Email,
		Registration: (*registration.Resource)(account.Registration),
		Key:          privKey,
	}
	conf := lego.NewConfig(user)
	conf.CADirURL = account.Server
	client, err := lego.NewClient(conf)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Create client failed"})
		return
	}
	err = client.Challenge.SetDNS01Provider(&ManualDNSProvider{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "设置 DNS-01 ManualDNSProvider 失败: " + err.Error()})
		return
	}

	core := getCertifierCore(client.Certificate)
	if core == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get core"})
		return
	}

	orderOpts := &api.OrderOptions{
		Profile:        "",
		ReplacesCertID: "",
	}
	order, err := core.Orders.NewWithOptions(req.Domains, orderOpts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to create order: %v", err)})
		return
	}
	var authz []acme.Authorization
	for _, authURL := range order.Authorizations {
		authorization, err := core.Authorizations.Get(authURL)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to get auth: %v", err)})
			return
		}
		authz = append(authz, authorization)
	}
	fmt.Println(authz)

	infoList, err := getInfos(core, authz)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"get info error": err.Error()})
		return
	}
	id := fmt.Sprintf("%s:%s:%s", req.KeyType, req.AccountID, strings.Join(req.Domains, ","))
	val := &Value{Id: id, client: client, core: core, order: order, authz: authz, InfoList: infoList}
	s.cache.Set(id, val, 10*time.Minute)

	c.JSON(http.StatusOK, val)
}

type ManualDNSProvider struct {
}

// Present 方法用于获取验证信息，而不是自动创建记录
func (d *ManualDNSProvider) Present(domain, token, keyAuth string) error {
	// 获取验证信息
	info := dns01.GetChallengeInfo(domain, keyAuth)
	fmt.Println(info)
	return nil
}

// CleanUp 方法为空，因为记录是手动创建的
func (d *ManualDNSProvider) CleanUp(domain, token, keyAuth string) error {
	return nil
}

type GenCertReq struct {
	KeyType       certcrypto.KeyType `json:"key_type"`
	AccountID     string             `json:"account_id"`
	Domains       []string           `json:"domains"`
	DNSProviderID string             `json:"dns_provider_id"`
}

func (s *AcmeCertController) GenCert(c *gin.Context) {
	var req GenCertReq
	// 绑定 JSON 请求体到 user 结构体
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var cert *certificate.Resource
	// 如果是手动模式，先进行DNS预验证
	if req.DNSProviderID == "" {
		s.logger.Info("手动验证模式，开始DNS预验证")
		id := fmt.Sprintf("%s:%s:%s", req.KeyType, req.AccountID, strings.Join(req.Domains, ","))
		val, exist := s.cache.Get(id)
		if !exist {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "授权信息已过期，请重新创建授权"})
			return
		}
		value := val.(*Value)
		// 对每个域名进行DNS预验证
		for _, info := range value.InfoList {
			if err := s.dnsPreCheck(info.EffectiveFQDN, info.Value); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{
					"error":          fmt.Sprintf("DNS预验证失败: %v", err),
					"domain":         info.EffectiveFQDN,
					"expected_value": info.Value,
					"suggestion":     "请确保已正确设置DNS TXT记录，并等待DNS传播完成",
				})
				return
			}
		}
		s.logger.Info("DNS预验证通过，开始正式验证")
		for _, authorization := range value.authz {
			domain := challenge.GetTargetedDomain(authorization)
			chall := acme.Challenge{}
			for _, ch := range authorization.Challenges {
				if ch.Type == string(challenge.DNS01) {
					chall = ch
				}
			}
			err := validate(value.core, domain, chall)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("域名 %s 验证失败: %v", domain, err)})
				return
			}
		}

		solversManager := resolver.NewSolversManager(value.core)
		err := solversManager.SetDNS01Provider(&ManualDNSProvider{})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "设置 DNS-01 ManualDNSProvider 失败: " + err.Error()})
			return
		}
		prober := resolver.NewProber(solversManager)
		err = prober.Solve(value.authz)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("域名 Solve失败: %v", err)})
			return
		}

		s.logger.Info(strings.Join(req.Domains, ", ") + " acme: Validations succeeded; requesting certificates")
		privateKey, err := certcrypto.GeneratePrivateKey(req.KeyType)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("创建私钥失败: %v", err)})
			return
		}

		csrOptions := certcrypto.CSROptions{
			Domain: req.Domains[0],
			SAN:    req.Domains,
		}

		csr, err := certcrypto.CreateCSR(privateKey, csrOptions)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("创建CSR失败: %v", err)})
			return
		}
		privateKeyPem := certcrypto.PEMEncode(privateKey)
		cert, err = getForCSR(value.core, req.Domains, value.order, true, csr, privateKeyPem, "")
		if err != nil {
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("getForCSR失败: %v", err)})
				return
			}
		}
	} else { //dns自动验证
		account, err := s.acmeAccountService.GetAccount(c.Request.Context(), &service.GetAccountReq{ID: req.AccountID})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		block, _ := pem.Decode([]byte(account.KeyPem))
		if block == nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid private key"})
			return
		}
		privKey, err := x509.ParsePKCS8PrivateKey(block.Bytes)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Parse private key failed"})
			return
		}

		user := &service.User{
			Email:        account.Email,
			Registration: (*registration.Resource)(account.Registration),
			Key:          privKey,
		}
		conf := lego.NewConfig(user)
		conf.CADirURL = account.Server
		conf.Certificate.KeyType = req.KeyType
		client, err := lego.NewClient(conf)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Create client failed"})
			return
		}

		dnsProverInfo, err := s.dnsService.GetDNSProver(c.Request.Context(), &service.GetDNSProviderReq{ID: req.DNSProviderID})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("get provider失败: %v", err)})
			return
		}

		provider, err := s.CreateLegoDNSProvider(dnsProverInfo)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Create provider failed: %v", err)})
			return
		}

		err = client.Challenge.SetDNS01Provider(provider)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "设置 DNS-01 Provider 失败: " + err.Error()})
			return
		}

		// 申请证书
		r := certificate.ObtainRequest{Domains: req.Domains, Bundle: true, MustStaple: false}
		cert, err = client.Certificate.Obtain(r)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// 解析证书信息
	certInfo := s.parseCertInfo(string(cert.Certificate))

	err := s.db.Create(&model.AcmeCert{Model: model.Model{ID: uuid.New().String(), CreatedAt: time.Now(), UpdatedAt: time.Now()},
		Domains:   req.Domains,
		KeyType:   req.KeyType,
		AccountID: req.AccountID, DNSProviderID: "cs", CertType: certInfo.CertType, CertStatus: model.Issued,
		IssuedAt: certInfo.IssuedAt, ValidityDays: certInfo.ValidityDays,
		CertURL: cert.CertURL, CertStableURL: cert.CertStableURL,
		PrivateKey: string(cert.PrivateKey), Certificate: string(cert.Certificate), IssuerCertificate: string(cert.IssuerCertificate),
		CSR: string(cert.CSR),
	}).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, nil)
}

func getForCSR(core *api.Core, domains []string, order acme.ExtendedOrder, bundle bool, csr, privateKeyPem []byte, preferredChain string) (*certificate.Resource, error) {
	respOrder, err := core.Orders.UpdateForCSR(order.Finalize, csr)
	if err != nil {
		return nil, err
	}

	certRes := &certificate.Resource{
		Domain:     domains[0],
		CertURL:    respOrder.Certificate,
		PrivateKey: privateKeyPem,
	}

	if respOrder.Status == acme.StatusValid {
		// if the certificate is available right away, shortcut!
		ok, errR := checkResponse(core, respOrder, certRes, bundle, preferredChain)
		if errR != nil {
			return nil, errR
		}

		if ok {
			return certRes, nil
		}
	}

	timeout := 30 * time.Second

	err = wait.For("certificate", timeout, timeout/60, func() (bool, error) {
		ord, errW := core.Orders.Get(order.Location)
		if errW != nil {
			return false, errW
		}

		done, errW := checkResponse(core, ord, certRes, bundle, preferredChain)
		if errW != nil {
			return false, errW
		}

		return done, nil
	})

	return certRes, err
}

func checkResponse(core *api.Core, order acme.ExtendedOrder, certRes *certificate.Resource, bundle bool, preferredChain string) (bool, error) {
	valid, err := checkOrderStatus(order)
	if err != nil || !valid {
		return valid, err
	}

	certs, err := core.Certificates.GetAll(order.Certificate, bundle)
	if err != nil {
		return false, err
	}

	// Set the default certificate
	certRes.IssuerCertificate = certs[order.Certificate].Issuer
	certRes.Certificate = certs[order.Certificate].Cert
	certRes.CertURL = order.Certificate
	certRes.CertStableURL = order.Certificate

	if preferredChain == "" {
		log.Infof("[%s] Server responded with a certificate.", certRes.Domain)

		return true, nil
	}

	for link, cert := range certs {
		ok, err := hasPreferredChain(cert.Issuer, preferredChain)
		if err != nil {
			return false, err
		}

		if ok {
			log.Infof("[%s] Server responded with a certificate for the preferred certificate chains %q.", certRes.Domain, preferredChain)

			certRes.IssuerCertificate = cert.Issuer
			certRes.Certificate = cert.Cert
			certRes.CertURL = link
			certRes.CertStableURL = link

			return true, nil
		}
	}

	log.Infof("lego has been configured to prefer certificate chains with issuer %q, but no chain from the CA matched this issuer. Using the default certificate chain instead.", preferredChain)

	return true, nil
}

func checkOrderStatus(order acme.ExtendedOrder) (bool, error) {
	switch order.Status {
	case acme.StatusValid:
		return true, nil
	case acme.StatusInvalid:
		return false, fmt.Errorf("invalid order: %w", order.Err())
	default:
		return false, nil
	}
}

func hasPreferredChain(issuer []byte, preferredChain string) (bool, error) {
	certs, err := certcrypto.ParsePEMBundle(issuer)
	if err != nil {
		return false, err
	}

	topCert := certs[len(certs)-1]

	if topCert.Issuer.CommonName == preferredChain {
		return true, nil
	}

	return false, nil
}

func validate(core *api.Core, domain string, chlg acme.Challenge) error {
	chlng, err := core.Challenges.New(chlg.URL)
	if err != nil {
		return fmt.Errorf("failed to initiate challenge: %w", err)
	}

	valid, err := checkChallengeStatus(chlng)
	if err != nil {
		return err
	}

	if valid {

		return nil
	}

	ra, err := strconv.Atoi(chlng.RetryAfter)
	if err != nil {
		// The ACME server MUST return a Retry-After.
		// If it doesn't, we'll just poll hard.
		// Boulder does not implement the ability to retry challenges or the Retry-After header.
		// https://github.com/letsencrypt/boulder/blob/master/docs/acme-divergences.md#section-82
		ra = 5
	}
	initialInterval := time.Duration(ra) * time.Second

	bo := backoff.NewExponentialBackOff()
	bo.InitialInterval = initialInterval
	bo.MaxInterval = 10 * initialInterval
	bo.MaxElapsedTime = 100 * initialInterval

	// After the path is sent, the ACME server will access our server.
	// Repeatedly check the server for an updated status on our request.
	operation := func() error {
		authz, err := core.Authorizations.Get(chlng.AuthorizationURL)
		if err != nil {
			return backoff.Permanent(err)
		}

		valid, err := checkAuthorizationStatus(authz)
		if err != nil {
			return backoff.Permanent(err)
		}

		if valid {

			return nil
		}

		return fmt.Errorf("the server didn't respond to our request (status=%s)", authz.Status)
	}

	return backoff.Retry(operation, bo)
}

func checkChallengeStatus(chlng acme.ExtendedChallenge) (bool, error) {
	switch chlng.Status {
	case acme.StatusValid:
		return true, nil
	case acme.StatusPending, acme.StatusProcessing:
		return false, nil
	case acme.StatusInvalid:
		return false, fmt.Errorf("invalid challenge: %w", chlng.Err())
	default:
		return false, fmt.Errorf("the server returned an unexpected challenge status: %s", chlng.Status)
	}
}

func checkAuthorizationStatus(authz acme.Authorization) (bool, error) {
	switch authz.Status {
	case acme.StatusValid:
		return true, nil
	case acme.StatusPending, acme.StatusProcessing:
		return false, nil
	case acme.StatusDeactivated, acme.StatusExpired, acme.StatusRevoked:
		return false, fmt.Errorf("the authorization state %s", authz.Status)
	case acme.StatusInvalid:
		for _, chlg := range authz.Challenges {
			if chlg.Status == acme.StatusInvalid && chlg.Error != nil {
				return false, fmt.Errorf("invalid authorization: %w", chlg.Err())
			}
		}
		return false, errors.New("invalid authorization")
	default:
		return false, fmt.Errorf("the server returned an unexpected authorization status: %s", authz.Status)
	}
}

type Value struct {
	Id       string `json:"id"`
	client   *lego.Client
	core     *api.Core
	order    acme.ExtendedOrder
	authz    []acme.Authorization
	InfoList []dns01.ChallengeInfo `json:"info_list"`
}

func getCertifierCore(certifier *certificate.Certifier) *api.Core {
	v := reflect.ValueOf(certifier).Elem()
	coreField := v.FieldByName("core")
	corePtr := unsafe.Pointer(coreField.UnsafeAddr())
	coreValue := reflect.NewAt(coreField.Type(), corePtr)
	return coreValue.Elem().Interface().(*api.Core)
}

func getInfos(core *api.Core, authz []acme.Authorization) ([]dns01.ChallengeInfo, error) {
	var challengeInfo []dns01.ChallengeInfo
	for _, authorization := range authz {
		//domain := challenge.GetTargetedDomain(authorization)

		chlng, err := challenge.FindChallenge(challenge.DNS01, authorization)
		if err != nil {
			return nil, err
		}

		// Generate the Key Authorization for the challenge
		keyAuth, err := core.GetKeyAuthorization(chlng.Token)
		if err != nil {
			return nil, err
		}

		info := dns01.GetChallengeInfo(authorization.Identifier.Value, keyAuth)
		challengeInfo = append(challengeInfo, info)
	}
	return challengeInfo, nil
}

func (s *AcmeCertController) DeleteAcmeCert(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID is empty"})
		return
	}
	err := s.acmeCertService.DeleteAcmeCert(c.Request.Context(), &service.DeleteAcmeCertReq{ID: id})
	if err != nil {
		s.logger.Error("DeleteAcmeCert err: " + err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, nil)
}

func (s *AcmeCertController) RevokeCert(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID is empty"})
		return
	}

	err := s.acmeCertService.RevokeCert(c.Request.Context(), &service.RevokeCertReq{ID: id})
	if err != nil {
		s.logger.Error("RevokeCert err: " + err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "证书吊销成功"})
}

func (s *AcmeCertController) DownloadCertChain(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID is empty"})
		return
	}

	cert, err := s.acmeCertService.GetCert(c.Request.Context(), &service.GetCertReq{ID: id})
	if err != nil {
		s.logger.Error("DownloadCertChain GetCert err: " + err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s_chain.pem\"", cert.Domains[0]))
	c.Header("Content-Type", "application/x-pem-file")
	c.String(http.StatusOK, cert.Certificate)
}

func (s *AcmeCertController) DownloadPrivateKey(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID is empty"})
		return
	}

	cert, err := s.acmeCertService.GetCert(c.Request.Context(), &service.GetCertReq{ID: id})
	if err != nil {
		s.logger.Error("DownloadPrivateKey GetCert err: " + err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s_private.pem\"", cert.Domains[0]))
	c.Header("Content-Type", "application/octet-stream")
	c.String(http.StatusOK, cert.PrivateKey)
}

func (s *AcmeCertController) GetPrivateKey(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID is empty"})
		return
	}

	cert, err := s.acmeCertService.GetCert(c.Request.Context(), &service.GetCertReq{ID: id})
	if err != nil {
		s.logger.Error("GetPrivateKey GetCert err: " + err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"private_key": cert.PrivateKey})
}

// dnsPreCheck 执行DNS预验证，检查TXT记录是否已正确设置
func (s *AcmeCertController) dnsPreCheck(fqdn, expectedValue string) error {
	// 简化版DNS预验证，使用标准库的net包
	s.logger.Info("开始DNS预验证", zap.String("fqdn", fqdn), zap.String("expected", expectedValue))

	// 使用Go标准库查询TXT记录
	txtRecords, err := net.LookupTXT(fqdn)
	if err != nil {
		return fmt.Errorf("DNS查询失败: %w", err)
	}

	// 检查是否包含期望的值
	for _, record := range txtRecords {
		if record == expectedValue {
			s.logger.Info("DNS预验证成功", zap.String("fqdn", fqdn), zap.String("value", expectedValue))
			return nil
		}
	}

	// 如果没有找到，等待一段时间后再试一次
	s.logger.Info("首次DNS查询未找到记录，等待30秒后重试...")
	time.Sleep(30 * time.Second)

	txtRecords, err = net.LookupTXT(fqdn)
	if err != nil {
		return fmt.Errorf("DNS重试查询失败: %w", err)
	}

	for _, record := range txtRecords {
		if record == expectedValue {
			s.logger.Info("DNS预验证重试成功", zap.String("fqdn", fqdn), zap.String("value", expectedValue))
			return nil
		}
	}

	return fmt.Errorf("DNS预验证失败: 未找到期望的TXT记录值 '%s'，当前记录: %v", expectedValue, txtRecords)
}

// findAuthoritativeServers 简化版本，不使用复杂的DNS查询
func (s *AcmeCertController) findAuthoritativeServers(fqdn string) ([]string, error) {
	// 简化实现，返回常用的公共DNS服务器
	return []string{"8.8.8.8:53", "1.1.1.1:53"}, nil
}

// checkTXTRecord 简化版本，使用标准库
func (s *AcmeCertController) checkTXTRecord(fqdn, expectedValue, server string) error {
	// 使用标准库的简化实现
	txtRecords, err := net.LookupTXT(fqdn)
	if err != nil {
		return fmt.Errorf("DNS查询失败: %w", err)
	}

	for _, record := range txtRecords {
		if record == expectedValue {
			return nil
		}
	}

	return fmt.Errorf("未找到期望的TXT记录值: %s", expectedValue)
}

// CertInfo 证书信息结构体
type CertInfo struct {
	CertType     model.CertType
	IssuedAt     *time.Time
	ValidityDays int
}

// determineCertType 根据证书内容判断证书类型
func (s *AcmeCertController) determineCertType(certPEM string) model.CertType {
	// 解析证书
	block, _ := pem.Decode([]byte(certPEM))
	if block == nil {
		s.logger.Warn("无法解析证书PEM，默认设置为DV类型")
		return model.CertTypeDV
	}

	cert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		s.logger.Error("解析证书失败，默认设置为DV类型", zap.Error(err))
		return model.CertTypeDV
	}

	if len(cert.Subject.Organization) > 0 {
		s.logger.Info("检测到组织信息，判断为OV证书",
			zap.Strings("organization", cert.Subject.Organization))
		return model.CertTypeOV
	}

	if len(cert.Subject.OrganizationalUnit) > 0 {
		s.logger.Info("检测到组织单位信息，判断为OV证书",
			zap.Strings("organizational_unit", cert.Subject.OrganizationalUnit))
		return model.CertTypeOV
	}

	return model.CertTypeDV
}

// parseCertInfo 解析证书信息，包括类型、签发时间和有效期
func (s *AcmeCertController) parseCertInfo(certPEM string) *CertInfo {
	// 解析证书
	block, _ := pem.Decode([]byte(certPEM))
	if block == nil {
		s.logger.Warn("无法解析证书PEM，使用默认值")
		return &CertInfo{
			CertType:     model.CertTypeDV,
			IssuedAt:     nil,
			ValidityDays: 0,
		}
	}

	cert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		s.logger.Error("解析证书失败，使用默认值", zap.Error(err))
		return &CertInfo{
			CertType:     model.CertTypeDV,
			IssuedAt:     nil,
			ValidityDays: 0,
		}
	}

	certType := model.CertTypeDV
	if len(cert.Subject.Organization) > 0 || len(cert.Subject.OrganizationalUnit) > 0 {
		certType = model.CertTypeOV
		s.logger.Info("检测到组织信息，判断为OV证书")
	} else {
		s.logger.Info("未检测到组织信息，判断为DV证书")
	}

	// 获取签发时间（NotBefore）
	issuedAt := cert.NotBefore

	// 计算有效期天数
	validityDuration := cert.NotAfter.Sub(cert.NotBefore)
	validityDays := int(validityDuration.Hours() / 24)

	s.logger.Info("解析证书信息成功",
		zap.String("cert_type", string(certType)),
		zap.Time("issued_at", issuedAt),
		zap.Int("validity_days", validityDays),
		zap.Time("expires_at", cert.NotAfter))

	return &CertInfo{
		CertType:     certType,
		IssuedAt:     &issuedAt,
		ValidityDays: validityDays,
	}
}

// CreateLegoDNSProvider is a factory function that creates a DNS provider instance.
func (s *AcmeCertController) CreateLegoDNSProvider(provider *model.DNSProvider) (challenge.Provider, error) {
	switch provider.Type {
	case model.DNSTypeTencentCloud:
		cf := tencentcloud.NewDefaultConfig()
		cf.SecretID = provider.SecretId
		cf.SecretKey = provider.SecretKey
		return tencentcloud.NewDNSProviderConfig(cf)
	case model.DNSTypeAliyun:
		cf := alidns.NewDefaultConfig()
		cf.APIKey = provider.SecretId
		cf.SecretKey = provider.SecretKey
		return alidns.NewDNSProviderConfig(cf)
	case model.DNSTypeCloudflare:
		cf := cloudflare.NewDefaultConfig()
		cf.AuthToken = provider.SecretKey
		return cloudflare.NewDNSProviderConfig(cf)
	case model.DNSTypeGoDaddy:
		cf := godaddy.NewDefaultConfig()
		cf.APIKey = provider.SecretId
		cf.APISecret = provider.SecretKey
		return godaddy.NewDNSProviderConfig(cf)
	default:
		return nil, fmt.Errorf("unsupported DNS provider type: %s", provider.Type)
	}
}
