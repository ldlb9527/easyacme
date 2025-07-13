package controller

import (
	"easyacme/internal/service"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"
	"net/http"
)

type DNSController struct {
	db         *gorm.DB
	logger     *zap.Logger
	dnsService service.DNSService
}

// NewDNSController .
func NewDNSController(db *gorm.DB, logger *zap.Logger, dnsService service.DNSService) *DNSController {
	return &DNSController{
		db:         db,
		logger:     logger,
		dnsService: dnsService,
	}
}

func (s *DNSController) NewDNSProvider(c *gin.Context) {
	var req service.CreateDNSProviderReq
	// 绑定 JSON 请求体到 user 结构体
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	err := s.dnsService.CreateDNSProvider(c.Request.Context(), &req)
	if err != nil {
		s.logger.Error("CreateDNSProvider err: " + err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, nil)
}

func (s *DNSController) GetDNSProviders(c *gin.Context) {
	var req service.ListDNSProviderReq
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	resp, err := s.dnsService.GetDNSProvers(c.Request.Context(), &req)
	if err != nil {
		s.logger.Error("GetDNSProvers err: " + err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (s *DNSController) GetDNSProvider(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID is empty"})
		return
	}
	provider, err := s.dnsService.GetDNSProver(c.Request.Context(), &service.GetDNSProviderReq{ID: id})
	if err != nil {
		s.logger.Error("GetDNSProver err: " + err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, provider)
}

func (s *DNSController) UpdateDNSProvider(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID is empty"})
		return
	}

	var req service.UpdateDNSProviderReq
	// 绑定 JSON 请求体到结构体
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 设置ID从URL参数
	req.ID = id

	err := s.dnsService.UpdateDNSProvider(c.Request.Context(), &req)
	if err != nil {
		s.logger.Error("UpdateDNSProvider err: " + err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, nil)
}

func (s *DNSController) DeleteDNSProvider(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID is empty"})
		return
	}
	err := s.dnsService.DeleteDNSProver(c.Request.Context(), &service.DeleteDNSProviderReq{ID: id})
	if err != nil {
		s.logger.Error("DeleteDNSProver err: " + err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, nil)
}

func (s *DNSController) GetDNSProviderSecrets(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID is empty"})
		return
	}
	secrets, err := s.dnsService.GetDNSProviderSecrets(c.Request.Context(), &service.GetDNSProviderSecretsReq{ID: id})
	if err != nil {
		s.logger.Error("GetDNSProviderSecrets err: " + err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, secrets)
}

func (s *DNSController) BatchDeleteDNSProviders(c *gin.Context) {
	var req service.BatchDeleteDNSProviderReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(req.IDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "IDs are empty"})
		return
	}

	err := s.dnsService.BatchDeleteDNSProvers(c.Request.Context(), &req)
	if err != nil {
		s.logger.Error("BatchDeleteDNSProvers err: " + err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, nil)
}
