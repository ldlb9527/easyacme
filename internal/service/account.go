package service

import (
	"context"
	"crypto/rand"
	"easyacme/internal/config"
	"easyacme/internal/model"
	"github.com/golang-jwt/jwt/v5"
	"github.com/pkg/errors"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"math/big"
	"time"
)

// 登录相关请求结构体
type LoginReq struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResp struct {
	Token string      `json:"token"`
	User  *model.User `json:"user"`
}

type RefreshTokenReq struct {
	Token string `json:"token" binding:"required"`
}

// JWT Claims
type JWTClaims struct {
	UserID   int    `json:"user_id"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

// 用户相关请求结构体
type CreateUserReq struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Language string `json:"language"`
	RoleIDs  []int  `json:"role_ids"`
}

type UpdateUserReq struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Enabled  *bool  `json:"enabled"`
	Language string `json:"language"`
	RoleIDs  []int  `json:"role_ids"`
}

type ListUserReq struct {
	Page     int    `form:"page"`
	PageSize int    `form:"page_size"`
	Enabled  *bool  `form:"enabled"`
	RoleID   int    `form:"role_id"`
	Keyword  string `form:"keyword"`
}

type GetUserReq struct {
	ID int
}

type DeleteUserReq struct {
	ID int
}

type ListUserResp struct {
	Total int64        `json:"total"`
	List  []model.User `json:"data"`
}

// 角色相关请求结构体
type CreateRoleReq struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Permissions []string `json:"permissions"`
}

type UpdateRoleReq struct {
	ID          int      `json:"id"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Permissions []string `json:"permissions"`
}

type ListRoleReq struct {
	Page     int    `form:"page"`
	PageSize int    `form:"page_size"`
	Keyword  string `form:"keyword"`
}

type GetRoleReq struct {
	ID int
}

type DeleteRoleReq struct {
	ID int
}

type ListRoleResp struct {
	Total int64        `json:"total"`
	List  []model.Role `json:"data"`
}

type InitUserReq struct {
	Language string `json:"language"`
}

type InitUserResp struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// AccountService 账户服务接口（包含用户和角色管理）
type AccountService interface {
	// 认证相关方法
	Login(ctx context.Context, req *LoginReq) (*LoginResp, error)
	LoginWithSession(ctx context.Context, req *LoginReq) (*model.User, error)
	RefreshToken(ctx context.Context, req *RefreshTokenReq) (*LoginResp, error)
	GetUserByToken(ctx context.Context, token string) (*model.User, error)

	// 用户相关方法
	CreateUser(ctx context.Context, req *CreateUserReq) error
	GetUsers(ctx context.Context, req *ListUserReq) (*ListUserResp, error)
	GetUser(ctx context.Context, req *GetUserReq) (*model.User, error)
	UpdateUser(ctx context.Context, req *UpdateUserReq) error
	DeleteUser(ctx context.Context, req *DeleteUserReq) error

	// 角色相关方法
	CreateRole(ctx context.Context, req *CreateRoleReq) error
	GetRoles(ctx context.Context, req *ListRoleReq) (*ListRoleResp, error)
	GetRole(ctx context.Context, req *GetRoleReq) (*model.Role, error)
	UpdateRole(ctx context.Context, req *UpdateRoleReq) error
	DeleteRole(ctx context.Context, req *DeleteRoleReq) error

	// 初始化用户方法
	InitUser(ctx context.Context, req *InitUserReq) (*InitUserResp, error)
}

// AccountServiceImpl 账户服务实现
type AccountServiceImpl struct {
	db     *gorm.DB
	logger *zap.Logger
	conf   *config.Config
}

// NewAccountService 创建账户服务
func NewAccountService(db *gorm.DB, logger *zap.Logger, conf *config.Config) AccountService {
	return &AccountServiceImpl{
		db:     db,
		logger: logger,
		conf:   conf,
	}
}

// ===== 认证相关方法 =====

// LoginWithSession Session登录方法
func (s *AccountServiceImpl) LoginWithSession(ctx context.Context, req *LoginReq) (*model.User, error) {
	var user model.User
	if err := s.db.Where("username = ?", req.Username).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("用户名或密码错误")
		}
		return nil, errors.Wrap(err, "查询用户失败")
	}

	if !user.Enabled {
		return nil, errors.New("用户已被禁用")
	}

	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		return nil, errors.New("用户名或密码错误")
	}

	// 更新最后登录时间
	now := time.Now()
	user.LastLoginAt = &now
	s.db.Model(&user).Update("last_login_at", now)

	// 预加载角色信息
	if err := s.db.Preload("Roles").Preload("Roles.Role").Preload("Roles.Role.Permissions").First(&user, user.ID).Error; err != nil {
		return nil, errors.Wrap(err, "加载用户角色信息失败")
	}

	return &user, nil
}

// Login 用户登录（保留JWT方式）
func (s *AccountServiceImpl) Login(ctx context.Context, req *LoginReq) (*LoginResp, error) {
	var user model.User
	if err := s.db.Where("username = ?", req.Username).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("用户名或密码错误")
		}
		return nil, errors.Wrap(err, "查询用户失败")
	}

	if !user.Enabled {
		return nil, errors.New("用户已被禁用")
	}

	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		return nil, errors.New("用户名或密码错误")
	}

	now := time.Now()
	user.LastLoginAt = &now
	s.db.Model(&user).Update("last_login_at", now)

	// 生成JWT token
	token, err := s.generateToken(&user)
	if err != nil {
		return nil, errors.Wrap(err, "生成token失败")
	}

	return &LoginResp{
		Token: token,
		User:  &user,
	}, nil
}

// RefreshToken 刷新token
func (s *AccountServiceImpl) RefreshToken(ctx context.Context, req *RefreshTokenReq) (*LoginResp, error) {
	user, err := s.GetUserByToken(ctx, req.Token)
	if err != nil {
		return nil, err
	}

	// 生成新的token
	token, err := s.generateToken(user)
	if err != nil {
		return nil, errors.Wrap(err, "生成token失败")
	}

	// 清除密码字段
	user.Password = ""

	return &LoginResp{
		Token: token,
		User:  user,
	}, nil
}

// GetUserByToken 通过token获取用户信息
func (s *AccountServiceImpl) GetUserByToken(ctx context.Context, token string) (*model.User, error) {
	claims, err := s.parseToken(token)
	if err != nil {
		return nil, errors.Wrap(err, "解析token失败")
	}

	var user model.User
	if err := s.db.Preload("Roles").Preload("Roles.Role").First(&user, claims.UserID).Error; err != nil {
		return nil, errors.Wrap(err, "获取用户信息失败")
	}

	if !user.Enabled {
		return nil, errors.New("用户已被禁用")
	}

	return &user, nil
}

// generateToken 生成JWT token
func (s *AccountServiceImpl) generateToken(user *model.User) (string, error) {
	claims := JWTClaims{
		UserID:   user.ID,
		Username: user.Username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)), // 24小时过期
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "easyacme",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.conf.GetSessionSecret()))
}

// parseToken 解析JWT token
func (s *AccountServiceImpl) parseToken(tokenString string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.conf.GetSessionSecret()), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("无效的token")
}

// ===== 用户相关方法 =====

// CreateUser 创建用户
func (s *AccountServiceImpl) CreateUser(ctx context.Context, req *CreateUserReq) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return errors.Wrap(err, "failed to hash password")
	}

	language := req.Language
	if language == "" {
		language = "zh-CN"
	}

	user := model.User{
		Username: req.Username,
		Password: string(hashedPassword),
		Enabled:  true,
		Language: language,
	}

	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&user).Error; err != nil {
			return errors.Wrap(err, "创建用户失败")
		}

		if len(req.RoleIDs) > 0 {
			var count int64
			if err := tx.Model(&model.Role{}).Where("id IN ?", req.RoleIDs).Count(&count).Error; err != nil {
				return errors.Wrap(err, "查询角色失败")
			}
			if count != int64(len(req.RoleIDs)) {
				return errors.New("部分角色不存在")
			}

			var userRoles []model.UserRole
			for _, roleID := range req.RoleIDs {
				userRoles = append(userRoles, model.UserRole{UserID: user.ID, RoleID: roleID})
			}
			err := tx.CreateInBatches(&userRoles, 20).Error
			if err != nil {
				return errors.Wrap(err, "创建用户角色关联失败")
			}
		}
		return nil
	})
}

// GetUsers 获取用户列表
func (s *AccountServiceImpl) GetUsers(ctx context.Context, req *ListUserReq) (*ListUserResp, error) {
	resp := &ListUserResp{}

	// 设置默认分页参数
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = 10
	}

	query := s.db.Model(&model.User{})

	// 添加过滤条件
	if req.Enabled != nil {
		query = query.Where("enabled = ?", *req.Enabled)
	}
	if req.RoleID > 0 {
		// 通过用户角色关联表查询
		query = query.Joins("JOIN user_roles ON users.id = user_roles.user_id").
			Where("user_roles.role_id = ?", req.RoleID)
	}
	if req.Keyword != "" {
		query = query.Where("username LIKE ?", "%"+req.Keyword+"%")
	}

	// 计算总数
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, errors.Wrap(err, "统计用户总数失败")
	}
	resp.Total = total

	// 分页查询
	var users []model.User
	offset := (req.Page - 1) * req.PageSize
	if err := query.Preload("Roles").Preload("Roles.Role").Offset(offset).Limit(req.PageSize).Order("created_at desc").Find(&users).Error; err != nil {
		return nil, errors.Wrap(err, "查询用户列表失败")
	}
	resp.List = users

	return resp, nil
}

// GetUser 获取用户详情
func (s *AccountServiceImpl) GetUser(ctx context.Context, req *GetUserReq) (*model.User, error) {
	var user model.User
	if err := s.db.Preload("Roles").First(&user, req.ID).Error; err != nil {
		return nil, errors.Wrap(err, "获取用户详情失败")
	}
	return &user, nil
}

// UpdateUser 更新用户
func (s *AccountServiceImpl) UpdateUser(ctx context.Context, req *UpdateUserReq) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		updates := make(map[string]interface{})

		if req.Username != "" {
			updates["username"] = req.Username
		}
		if req.Enabled != nil {
			updates["enabled"] = *req.Enabled
		}
		if req.Language != "" {
			updates["language"] = req.Language
		}
		updates["updated_at"] = time.Now()

		// 更新用户基本信息
		if err := tx.Model(&model.User{}).Where("id = ?", req.ID).Updates(updates).Error; err != nil {
			return errors.Wrap(err, "更新用户失败")
		}

		// 更新角色关联
		if req.RoleIDs != nil {
			// 删除原有的角色关联
			if err := tx.Where("user_id = ?", req.ID).Delete(&model.UserRole{}).Error; err != nil {
				return errors.Wrap(err, "删除原有角色关联失败")
			}

			// 创建新的角色关联
			if len(req.RoleIDs) > 0 {
				// 验证角色是否存在
				var count int64
				if err := tx.Model(&model.Role{}).Where("id IN ?", req.RoleIDs).Count(&count).Error; err != nil {
					return errors.Wrap(err, "查询角色失败")
				}
				if count != int64(len(req.RoleIDs)) {
					return errors.New("部分角色不存在")
				}

				for _, roleID := range req.RoleIDs {
					userRole := model.UserRole{
						UserID: req.ID,
						RoleID: roleID,
					}
					if err := tx.Create(&userRole).Error; err != nil {
						return errors.Wrap(err, "创建用户角色关联失败")
					}
				}
			}
		}

		return nil
	})
}

// DeleteUser 删除用户
func (s *AccountServiceImpl) DeleteUser(ctx context.Context, req *DeleteUserReq) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		// 删除用户角色关联
		if err := tx.Where("user_id = ?", req.ID).Delete(&model.UserRole{}).Error; err != nil {
			return errors.Wrap(err, "删除用户角色关联失败")
		}

		// 删除用户
		if err := tx.Delete(&model.User{}, req.ID).Error; err != nil {
			return errors.Wrap(err, "删除用户失败")
		}

		return nil
	})
}

// ===== 角色相关方法 =====

// CreateRole 创建角色
func (s *AccountServiceImpl) CreateRole(ctx context.Context, req *CreateRoleReq) error {
	var rolePermissions []model.RolePermission
	for _, permission := range req.Permissions {
		rolePermissions = append(rolePermissions, model.RolePermission{Permission: permission})
	}

	return s.db.Transaction(func(tx *gorm.DB) error {

		role := model.Role{
			Name:        req.Name,
			Description: req.Description,
			Permissions: rolePermissions,
		}
		if err := tx.Create(&role).Error; err != nil {
			return errors.Wrap(err, "创建角色失败")
		}
		return nil
	})
}

// GetRoles 获取角色列表
func (s *AccountServiceImpl) GetRoles(ctx context.Context, req *ListRoleReq) (*ListRoleResp, error) {
	resp := &ListRoleResp{}

	// 设置默认分页参数
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = 10
	}

	query := s.db.Model(&model.Role{})

	if req.Keyword != "" {
		query = query.Where("name LIKE ? OR description LIKE ?", "%"+req.Keyword+"%", "%"+req.Keyword+"%")
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, errors.Wrap(err, "统计角色总数失败")
	}
	resp.Total = total

	// 分页查询
	var roles []model.Role
	offset := (req.Page - 1) * req.PageSize
	if err := query.Preload("Users").Offset(offset).Limit(req.PageSize).Order("created_at desc").Find(&roles).Error; err != nil {
		return nil, errors.Wrap(err, "查询角色列表失败")
	}
	resp.List = roles

	return resp, nil
}

// GetRole 获取角色详情
func (s *AccountServiceImpl) GetRole(ctx context.Context, req *GetRoleReq) (*model.Role, error) {
	var role model.Role
	if err := s.db.Preload("Users").Preload("Permissions").First(&role, req.ID).Error; err != nil {
		return nil, errors.Wrap(err, "获取角色详情失败")
	}
	return &role, nil
}

// UpdateRole 更新角色
func (s *AccountServiceImpl) UpdateRole(ctx context.Context, req *UpdateRoleReq) error {
	updates := make(map[string]interface{})

	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	updates["updated_at"] = time.Now()

	return s.db.Transaction(func(tx *gorm.DB) error {
		if len(updates) > 0 {
			err := tx.Model(&model.Role{}).Where("id = ?", req.ID).Updates(updates).Error
			if err != nil {
				return errors.Wrap(err, "更新角色失败")
			}

		}
		if len(req.Permissions) > 0 {
			err := tx.Model(&model.RolePermission{}).Where("role_id = ?", req.ID).Delete(nil).Error
			if err != nil {
				return errors.Wrap(err, "删除role permission失败")
			}

			var rolePermissions []model.RolePermission
			for _, permission := range req.Permissions {
				rolePermissions = append(rolePermissions, model.RolePermission{RoleID: req.ID, Permission: permission})
			}

			err = tx.CreateInBatches(&rolePermissions, 100).Error
			if err != nil {
				return errors.Wrap(err, "创建role permission失败")
			}
		}
		return nil
	})
}

// DeleteRole 删除角色
func (s *AccountServiceImpl) DeleteRole(ctx context.Context, req *DeleteRoleReq) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		// 检查是否有用户关联此角色
		var count int64
		if err := tx.Model(&model.UserRole{}).Where("role_id = ?", req.ID).Count(&count).Error; err != nil {
			return errors.Wrap(err, "检查角色关联用户失败")
		}
		if count > 0 {
			return errors.New("该角色下还有用户，无法删除")
		}

		// 删除角色权限关联
		if err := tx.Where("role_id = ?", req.ID).Delete(&model.RolePermission{}).Error; err != nil {
			return errors.Wrap(err, "删除角色权限关联失败")
		}

		// 删除角色
		if err := tx.Delete(&model.Role{}, req.ID).Error; err != nil {
			return errors.Wrap(err, "删除角色失败")
		}

		return nil
	})
}

// ===== 初始化用户方法 =====

// InitUser 初始化用户（只能执行一次）
func (s *AccountServiceImpl) InitUser(ctx context.Context, req *InitUserReq) (*InitUserResp, error) {
	// 检查是否已经存在用户
	var count int64
	if err := s.db.Model(&model.User{}).Count(&count).Error; err != nil {
		return nil, errors.Wrap(err, "检查用户数量失败")
	}

	if count > 0 {
		return nil, errors.New("系统已存在用户，无法重复初始化")
	}

	username := "admin"
	password, err := generateRandomPassword(16)
	if err != nil {
		return nil, errors.Wrap(err, "生成随机密码失败")
	}

	// 加密密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.Wrap(err, "密码加密失败")
	}

	err = s.db.Transaction(func(tx *gorm.DB) error {
		role := model.Role{
			Name:        "超级管理员",
			Description: "拥有系统所有权限的超级管理员角色",
			Permissions: []model.RolePermission{
				{Permission: "*"},
			},
		}
		if err := tx.Create(&role).Error; err != nil {
			return errors.Wrap(err, "创建超级管理员角色失败")
		}

		user := model.User{
			Username: username,
			Password: string(hashedPassword),
			Enabled:  true,
			Language: req.Language,
		}
		if err := tx.Create(&user).Error; err != nil {
			return errors.Wrap(err, "创建初始用户失败")
		}

		userRole := model.UserRole{
			UserID: user.ID,
			RoleID: role.ID,
		}
		if err := tx.Create(&userRole).Error; err != nil {
			return errors.Wrap(err, "关联用户角色失败")
		}

		return nil
	})
	if err != nil {
		return nil, errors.Wrap(err, "init user error")
	}

	return &InitUserResp{Username: username, Password: password}, nil
}

const (
	// 密码字符集
	lowerCase = "abcdefghijklmnopqrstuvwxyz"
	upperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
	digits    = "0123456789"
	symbols   = "!@#$%^&*"
)

func generateRandomPassword(length int) (string, error) {
	if length < 8 {
		length = 8
	}

	charset := lowerCase + upperCase + digits + symbols
	password := make([]byte, length)

	for i := range password {
		randomIndex, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			return "", err
		}
		password[i] = charset[randomIndex.Int64()]
	}

	return string(password), nil
}
