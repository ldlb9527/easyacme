package main

import (
	"context"
	"easyacme/internal/common"
	"easyacme/internal/config"
	"easyacme/internal/controller"
	"easyacme/internal/middleware"
	"easyacme/internal/service"
	"fmt"
	"github.com/gin-gonic/gin"
	"go.uber.org/fx"
	"go.uber.org/zap"
	"net/http"
)

func main() {
	app := fx.New(
		fx.Provide(config.NewConfig),
		fx.Provide(config.NewLogger),
		fx.Provide(config.NewDB),
		fx.Provide(config.NewCache),
		fx.Provide(middleware.NewMiddlewareManager),
		fx.Provide(service.NewAccountService),
		fx.Provide(service.NewAcmeAccountService),
		fx.Provide(service.NewAcmeCertService),
		fx.Provide(service.NewDNSService),
		fx.Provide(service.NewStatisticsService),
		fx.Provide(controller.NewAcmeAccountController),
		fx.Provide(controller.NewAcmeCertController),
		fx.Provide(controller.NewDNSController),
		fx.Provide(controller.NewAccountController),
		fx.Provide(controller.NewStatisticsController),
		fx.Provide(NewGinEngine),
		fx.Provide(NewHttpServer),

		fx.Invoke(func(server *http.Server) {}),
	)
	app.Run()
}

// NewGinEngine 创建Gin引擎
func NewGinEngine(cfg *config.Config, logger *zap.Logger, middlewareManager *middleware.MiddlewareManager,
	a *controller.AcmeAccountController,
	b *controller.AcmeCertController,
	c *controller.DNSController,
	d *controller.AccountController,
	statsCtl *controller.StatisticsController) *gin.Engine {
	// 设置Gin模式
	if cfg.GetEnv() == "prod" {
		gin.SetMode(gin.ReleaseMode)
	}

	// 创建引擎
	engine := gin.Default()

	// 应用所有中间件
	middlewareManager.ApplyMiddlewares(engine)

	api := engine.Group("/api")

	// 基础路由（不需要权限）
	api.GET("ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, "pong")
	})

	// 认证相关路由（不需要权限）
	api.POST("/auth/login", d.Login)
	api.POST("/auth/logout", d.Logout)
	api.GET("/auth/info", d.GetMe)

	// 初始化用户接口（不需要权限，只能执行一次）
	api.POST("/init/user", d.InitUser)

	// 看板统计路由 (需要认证)
	api.GET("/stats", common.WithPermission(common.PermDashboardStats, statsCtl.GetStatistics))

	// ACME账户管理路由（需要权限）
	acmeAccountGroup := api.Group("/acme/accounts")
	acmeAccountGroup.POST("", common.WithPermission(common.PermAcmeAccountCreate, a.NewAccount))
	acmeAccountGroup.GET("", common.WithPermission(common.PermAcmeAccountRead, a.GetAccounts))
	acmeAccountGroup.GET("/:id", common.WithPermission(common.PermAcmeAccountRead, a.GetAccount))
	acmeAccountGroup.DELETE("/:id", common.WithPermission(common.PermAcmeAccountDelete, a.DeleteAcmeAccount))
	acmeAccountGroup.POST("/:id/deactivate", common.WithPermission(common.PermAcmeAccountManage, a.DeactivateAcmeAccount))

	// ACME证书管理路由（需要权限）
	acmeCertGroup := api.Group("/acme")
	acmeCertGroup.POST("/certificates", common.WithPermission(common.PermAcmeCertCreate, b.NewCert))
	acmeCertGroup.GET("/certificates", common.WithPermission(common.PermAcmeCertRead, b.GetCerts))
	acmeCertGroup.GET("/certificates/:id", common.WithPermission(common.PermAcmeCertRead, b.GetCert))
	acmeCertGroup.DELETE("/certificates/:id", common.WithPermission(common.PermAcmeCertDelete, b.DeleteAcmeCert))
	acmeCertGroup.POST("/certificates/:id/revoke", common.WithPermission(common.PermAcmeCertManage, b.RevokeCert))
	acmeCertGroup.GET("/certificates/:id/chain", common.WithPermission(common.PermAcmeCertRead, b.DownloadCertChain))
	acmeCertGroup.GET("/certificates/:id/private_key", common.WithPermission(common.PermAcmeCertPrivateKeyRead, b.DownloadPrivateKey))
	acmeCertGroup.GET("/certificates/:id/private-key-content", common.WithPermission(common.PermAcmeCertPrivateKeyRead, b.GetPrivateKey))
	acmeCertGroup.POST("/auth", common.WithPermission(common.PermAcmeCertAuth, b.CreateAuth))
	acmeCertGroup.POST("/auth/cert", common.WithPermission(common.PermAcmeCertAuth, b.GenCert))

	// DNS提供商管理路由（需要权限）
	dnsGroup := api.Group("/dns/provider")
	dnsGroup.POST("", common.WithPermission(common.PermDNSProviderCreate, c.NewDNSProvider))
	dnsGroup.GET("", common.WithPermission(common.PermDNSProviderRead, c.GetDNSProviders))
	dnsGroup.GET("/:id", common.WithPermission(common.PermDNSProviderRead, c.GetDNSProvider))
	dnsGroup.PATCH("/:id", common.WithPermission(common.PermDNSProviderUpdate, c.UpdateDNSProvider))
	dnsGroup.DELETE("/:id", common.WithPermission(common.PermDNSProviderDelete, c.DeleteDNSProvider))
	dnsGroup.GET("/:id/secrets", common.WithPermission(common.PermDNSProviderSecretRead, c.GetDNSProviderSecrets))

	// 用户管理路由（需要权限）
	userGroup := api.Group("/account/users")
	userGroup.POST("", common.WithPermission(common.PermUserCreate, d.CreateUser))
	userGroup.GET("", common.WithPermission(common.PermUserRead, d.GetUsers))
	userGroup.GET("/:id", common.WithPermission(common.PermUserRead, d.GetUser))
	userGroup.PUT("/:id", common.WithPermission(common.PermUserUpdate, d.UpdateUser))
	userGroup.DELETE("/:id", common.WithPermission(common.PermUserDelete, d.DeleteUser))

	// 角色管理路由（需要权限）
	roleGroup := api.Group("/account/roles")
	roleGroup.POST("", common.WithPermission(common.PermRoleCreate, d.CreateRole))
	roleGroup.GET("", common.WithPermission(common.PermRoleRead, d.GetRoles))
	roleGroup.GET("/:id", common.WithPermission(common.PermRoleRead, d.GetRole))
	roleGroup.PUT("/:id", common.WithPermission(common.PermRoleUpdate, d.UpdateRole))
	roleGroup.DELETE("/:id", common.WithPermission(common.PermRoleDelete, d.DeleteRole))

	// 系统权限相关路由
	api.GET("/permissions", common.WithPermission(common.PermSystemPermissionRead, func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"permissions": common.GetAllPermissions(),
		})
	}))

	return engine
}

func NewHttpServer(
	lc fx.Lifecycle,
	router *gin.Engine,
	cfg *config.Config,
	logger *zap.Logger,
) *http.Server {
	server := &http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.GetPort()),
		Handler: router.Handler(),
	}

	lc.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			logger.Info("Starting HTTP server", zap.String("address", server.Addr))
			go func() {
				if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
					logger.Fatal("Failed to start server", zap.Error(err))
				}
			}()
			return nil
		},
		OnStop: func(ctx context.Context) error {
			logger.Info("Stopping HTTP server")
			return server.Shutdown(ctx)
		},
	})

	return server
}
