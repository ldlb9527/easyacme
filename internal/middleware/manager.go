package middleware

import (
	"easyacme/internal/config"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type Handler interface {
	Handler() gin.HandlerFunc
}

// MiddlewareManager 中间件管理器
type MiddlewareManager struct {
	handles []Handler
}

// NewMiddlewareManager 创建中间件管理器
func NewMiddlewareManager(cfg *config.Config, logger *zap.Logger) *MiddlewareManager {
	var h []Handler
	h = append(h, newCorsMiddleware())
	h = append(h, newSessionMiddleware(cfg))
	h = append(h, newAuthMiddleware())

	return &MiddlewareManager{handles: h}
}

// ApplyMiddlewares 应用所有中间件到gin引擎
func (m *MiddlewareManager) ApplyMiddlewares(engine *gin.Engine) {
	for i := range m.handles {
		engine.Use(m.handles[i].Handler())
	}
}
