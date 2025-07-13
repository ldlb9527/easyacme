package controller

import (
	"easyacme/internal/service"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"
	"net/http"
)

type AcmeAccountController struct {
	db                 *gorm.DB
	logger             *zap.Logger
	acmeAccountService service.AcmeAccountService
}

// NewAcmeAccountController .
func NewAcmeAccountController(db *gorm.DB, logger *zap.Logger, acmeAccountService service.AcmeAccountService) *AcmeAccountController {
	return &AcmeAccountController{
		db:                 db,
		logger:             logger,
		acmeAccountService: acmeAccountService,
	}
}

type NewAccountReq struct {
	Name       string `json:"name"`
	Server     string `json:"server"`
	Email      string `json:"email"`
	KeyType    string `json:"key_type"`
	EABKID     string `json:"eab_kid"`
	EABHMACKey string `json:"eab_hmac_key"`
}

func (s *AcmeAccountController) NewAccount(c *gin.Context) {
	var req NewAccountReq
	// 绑定 JSON 请求体到 user 结构体
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	err := s.acmeAccountService.CreateAcmeAccount(c.Request.Context(), &service.CreateAcmeAccountReq{Name: req.Name,
		Server: req.Server, Email: req.Email, KeyType: req.KeyType, EABKID: req.EABKID, EABHMACKey: req.EABHMACKey})
	if err != nil {
		s.logger.Error("CreateAcmeAccount err: " + err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, nil)
}

func (s *AcmeAccountController) GetAccounts(c *gin.Context) {
	var req service.ListAccountReq
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	accounts, err := s.acmeAccountService.GetAccounts(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "query err:" + err.Error()})
		return
	}
	c.JSON(http.StatusOK, accounts)
}

func (s *AcmeAccountController) GetAccount(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID is empty"})
		return
	}

	account, err := s.acmeAccountService.GetAccount(c.Request.Context(), &service.GetAccountReq{ID: id})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "query err:" + err.Error()})
		return
	}
	c.JSON(http.StatusOK, account)
}

func (s *AcmeAccountController) DeactivateAcmeAccount(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID is empty"})
		return
	}
	err := s.acmeAccountService.DeactivateAcmeAccount(c.Request.Context(), &service.DeactivateAcmeAccountReq{ID: id})
	if err != nil {
		s.logger.Error("DeactivateAcmeAccount err: " + err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, nil)
}

func (s *AcmeAccountController) DeleteAcmeAccount(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID is empty"})
		return
	}
	err := s.acmeAccountService.DeleteAcmeAccount(c.Request.Context(), &service.DeleteAcmeAccountReq{ID: id})
	if err != nil {
		s.logger.Error("DeleteAcmeAccount err: " + err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, nil)
}
