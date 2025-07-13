package middleware

import (
	"easyacme/internal/config"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/memstore"
	"github.com/gin-gonic/gin"
	"net/http"
)

// sessionMiddleware session中间件结构体
type sessionMiddleware struct {
	store sessions.Store
}

// newSessionMiddleware 创建session中间件
func newSessionMiddleware(cfg *config.Config) *sessionMiddleware {
	// 创建内存存储
	store := memstore.NewStore([]byte(cfg.GetSessionSecret()))

	// 配置session选项
	store.Options(sessions.Options{
		Path:     "/",                  // Cookie路径
		Domain:   "",                   // Cookie域名，空字符串表示当前域名
		MaxAge:   86400 * 7,            // 7天
		HttpOnly: false,                // 允许前端JavaScript访问，便于调试
		Secure:   false,                // 开发环境设为false，生产环境应设为true
		SameSite: http.SameSiteLaxMode, // Lax模式，允许跨站请求但更安全
	})

	return &sessionMiddleware{
		store: store,
	}
}

// Handler 返回gin中间件处理函数
func (s *sessionMiddleware) Handler() gin.HandlerFunc {
	return sessions.Sessions("easyacme-session", s.store)
}

// GetStore 获取session存储实例（如果需要的话）
func (s *sessionMiddleware) GetStore() sessions.Store {
	return s.store
}
