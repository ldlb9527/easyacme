package controller

import (
	"easyacme/internal/common"
	"easyacme/internal/config"
	"easyacme/internal/model"
	"easyacme/internal/service"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/goccy/go-json"
	"go.uber.org/zap"
	"gorm.io/gorm"
	"net/http"
	"strconv"
	"sync"
)

// AccountController 用户控制器
type AccountController struct {
	db             *gorm.DB
	logger         *zap.Logger
	accountService service.AccountService
	conf           *config.Config
	initUserMutex  sync.Mutex // 初始化用户的互斥锁
}

// NewAccountController 创建用户控制器
func NewAccountController(db *gorm.DB, logger *zap.Logger, accountService service.AccountService, conf *config.Config) *AccountController {
	return &AccountController{
		db:             db,
		logger:         logger,
		accountService: accountService,
		conf:           conf,
	}
}

// ===== 认证相关接口 =====

// Login 用户登录
func (s *AccountController) Login(ctx *gin.Context) {
	var req service.LoginReq
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := s.accountService.LoginWithSession(ctx.Request.Context(), &req)
	if err != nil {
		s.logger.Error("Login err: " + err.Error())
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// 设置session
	session := sessions.Default(ctx)
	userJson, err := json.Marshal(user)
	if err != nil {
		s.logger.Error("Marshal user err: " + err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "序列化失败"})
		return
	}
	session.Set(common.SessionUser, userJson)
	if err := session.Save(); err != nil {
		s.logger.Error("Save session err: " + err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "保存会话失败"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "登录成功",
		"user":    user,
	})
}

// Logout 用户登出
func (s *AccountController) Logout(ctx *gin.Context) {
	session := sessions.Default(ctx)
	session.Clear()
	if err := session.Save(); err != nil {
		s.logger.Error("Clear session err: " + err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "清除会话失败"})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "登出成功"})
}

// GetMe 获取当前用户信息
func (s *AccountController) GetMe(ctx *gin.Context) {
	session := sessions.Default(ctx)
	userJson := session.Get(common.SessionUser)
	if userJson == nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "未登录"})
		return
	}
	var user *model.User
	userBytes, ok := userJson.([]byte)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "type error"})
		return
	}
	err := json.Unmarshal(userBytes, &user)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Unmarshal error"})
		return
	}

	ctx.JSON(http.StatusOK, user)
}

// ===== 用户相关接口 =====

// CreateUserReq 创建用户请求结构体
type CreateUserReq struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Language string `json:"language"`
	RoleIDs  []int  `json:"role_ids"`
}

// UpdateUserReq 更新用户请求结构体
type UpdateUserReq struct {
	Username string `json:"username"`
	Enabled  *bool  `json:"enabled"`
	Language string `json:"language"`
	RoleIDs  []int  `json:"role_ids"`
}

// CreateUser 创建用户
func (s *AccountController) CreateUser(ctx *gin.Context) {
	var req CreateUserReq
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := s.accountService.CreateUser(ctx.Request.Context(), &service.CreateUserReq{
		Username: req.Username,
		Password: req.Password,
		Language: req.Language,
		RoleIDs:  req.RoleIDs,
	})
	if err != nil {
		s.logger.Error("CreateUser err: " + err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "用户创建成功"})
}

// GetUsers 获取用户列表
func (s *AccountController) GetUsers(ctx *gin.Context) {
	var req service.ListUserReq
	if err := ctx.ShouldBindQuery(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	users, err := s.accountService.GetUsers(ctx.Request.Context(), &req)
	if err != nil {
		s.logger.Error("GetUsers err: " + err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "查询失败:" + err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, users)
}

// GetUser 获取用户详情
func (s *AccountController) GetUser(ctx *gin.Context) {
	idStr := ctx.Param("id")
	if idStr == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "用户ID不能为空"})
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "用户ID格式错误"})
		return
	}

	user, err := s.accountService.GetUser(ctx.Request.Context(), &service.GetUserReq{ID: id})
	if err != nil {
		s.logger.Error("GetUser err: " + err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "查询失败:" + err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, user)
}

// UpdateUser 更新用户
func (s *AccountController) UpdateUser(ctx *gin.Context) {
	idStr := ctx.Param("id")
	if idStr == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "用户ID不能为空"})
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "用户ID格式错误"})
		return
	}

	var req UpdateUserReq
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = s.accountService.UpdateUser(ctx.Request.Context(), &service.UpdateUserReq{
		ID:       id,
		Username: req.Username,
		Enabled:  req.Enabled,
		Language: req.Language,
		RoleIDs:  req.RoleIDs,
	})
	if err != nil {
		s.logger.Error("UpdateUser err: " + err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "用户更新成功"})
}

// DeleteUser 删除用户
func (s *AccountController) DeleteUser(ctx *gin.Context) {
	idStr := ctx.Param("id")
	if idStr == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "用户ID不能为空"})
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "用户ID格式错误"})
		return
	}

	err = s.accountService.DeleteUser(ctx.Request.Context(), &service.DeleteUserReq{ID: id})
	if err != nil {
		s.logger.Error("DeleteUser err: " + err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "用户删除成功"})
}

// ===== 角色相关接口 =====

// CreateRoleReq 创建角色请求结构体
type CreateRoleReq struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Permissions []string `json:"permissions"`
}

// UpdateRoleReq 更新角色请求结构体
type UpdateRoleReq struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Permissions []string `json:"permissions"`
}

// CreateRole 创建角色
func (s *AccountController) CreateRole(ctx *gin.Context) {
	var req CreateRoleReq
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := s.accountService.CreateRole(ctx.Request.Context(), &service.CreateRoleReq{
		Name:        req.Name,
		Description: req.Description,
		Permissions: req.Permissions,
	})
	if err != nil {
		s.logger.Error("CreateRole err: " + err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "角色创建成功"})
}

// GetRoles 获取角色列表
func (s *AccountController) GetRoles(ctx *gin.Context) {
	var req service.ListRoleReq
	if err := ctx.ShouldBindQuery(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	roles, err := s.accountService.GetRoles(ctx.Request.Context(), &req)
	if err != nil {
		s.logger.Error("GetRoles err: " + err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "查询失败:" + err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, roles)
}

// GetRole 获取角色详情
func (s *AccountController) GetRole(ctx *gin.Context) {
	idStr := ctx.Param("id")
	if idStr == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "角色ID不能为空"})
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "角色ID格式错误"})
		return
	}

	role, err := s.accountService.GetRole(ctx.Request.Context(), &service.GetRoleReq{ID: id})
	if err != nil {
		s.logger.Error("GetRole err: " + err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "查询失败:" + err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, role)
}

// UpdateRole 更新角色
func (s *AccountController) UpdateRole(ctx *gin.Context) {
	idStr := ctx.Param("id")
	if idStr == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "角色ID不能为空"})
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "角色ID格式错误"})
		return
	}

	var req UpdateRoleReq
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = s.accountService.UpdateRole(ctx.Request.Context(), &service.UpdateRoleReq{
		ID:          id,
		Name:        req.Name,
		Description: req.Description,
		Permissions: req.Permissions,
	})
	if err != nil {
		s.logger.Error("UpdateRole err: " + err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "角色更新成功"})
}

// DeleteRole 删除角色
func (s *AccountController) DeleteRole(ctx *gin.Context) {
	idStr := ctx.Param("id")
	if idStr == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "角色ID不能为空"})
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "角色ID格式错误"})
		return
	}

	err = s.accountService.DeleteRole(ctx.Request.Context(), &service.DeleteRoleReq{ID: id})
	if err != nil {
		s.logger.Error("DeleteRole err: " + err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "角色删除成功"})
}

// ===== 语言接口 =====

// GetLanguage 获取当前语言
func (s *AccountController) GetLanguage(ctx *gin.Context) {
	// 尝试从会话中获取用户语言
	var language string
	session := sessions.Default(ctx)
	userJson := session.Get(common.SessionUser)
	if userJson != nil {
		userBytes, ok := userJson.([]byte)
		if ok {
			var user *model.User
			err := json.Unmarshal(userBytes, &user)
			if err == nil && user != nil && user.Language != "" {
				language = user.Language
			}
		}
	}

	// 如果未获取到用户语言，使用配置中的默认语言
	if language == "" {
		language = s.conf.GetLanguage()
	}

	ctx.JSON(http.StatusOK, gin.H{
		"language": language,
	})
}

// UpdateLanguageReq 更新语言请求
type UpdateLanguageReq struct {
	Language string `json:"language" binding:"required"`
}

// UpdateLanguage 更新当前用户的语言设置
func (s *AccountController) UpdateLanguage(ctx *gin.Context) {
	// 从 context 中获取当前用户
	currentUserObj, exists := ctx.Get(common.CurrentUSer)
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "未登录"})
		return
	}

	user, ok := currentUserObj.(*model.User)
	if !ok {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "用户数据类型错误"})
		return
	}

	// 解析请求
	var req UpdateLanguageReq
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 更新用户语言
	err := s.accountService.UpdateUser(ctx.Request.Context(), &service.UpdateUserReq{
		ID:       user.ID,
		Language: req.Language,
	})

	if err != nil {
		s.logger.Error("UpdateLanguage err: " + err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 更新会话中的用户数据
	user.Language = req.Language

	// 更新session中的用户数据
	session := sessions.Default(ctx)
	updatedUserJson, err := json.Marshal(user)
	if err != nil {
		s.logger.Error("Marshal updated user err: " + err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "序列化用户数据失败"})
		return
	}

	session.Set(common.SessionUser, updatedUserJson)
	if err := session.Save(); err != nil {
		s.logger.Error("Save session err: " + err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "保存会话失败"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message":  "语言更新成功",
		"language": req.Language,
	})
}

// ===== 初始化用户接口 =====

// InitUser 初始化用户（只能执行一次）
func (s *AccountController) InitUser(ctx *gin.Context) {
	s.initUserMutex.Lock()
	defer s.initUserMutex.Unlock()

	language := s.conf.GetLanguage()
	req := service.InitUserReq{
		Language: language,
	}

	resp, err := s.accountService.InitUser(ctx.Request.Context(), &req)
	if err != nil {
		s.logger.Error("InitUser err: " + err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"username": resp.Username,
		"password": resp.Password,
	})
}
