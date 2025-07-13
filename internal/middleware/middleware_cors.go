package middleware

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"time"
)

type corsMiddleware struct {
	cors gin.HandlerFunc
}

// newCorsMiddleware 创建CORS中间件
func newCorsMiddleware() *corsMiddleware {
	return &corsMiddleware{
		cors: cors.New(cors.Config{
			// 不能同时使用 AllowOrigins: ["*"] 和 AllowCredentials: true
			// 使用 AllowOriginFunc 来动态允许所有源
			AllowOriginFunc: func(origin string) bool {
				return true // 允许所有源，生产环境需要更严格的验证
			},
			AllowMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"},
			AllowHeaders: []string{
				"Origin",
				"Content-Length",
				"Content-Type",
				"Authorization",
				"Accept",
				"X-Requested-With",
				"Cache-Control",
				"Cookie",
			},
			ExposeHeaders: []string{
				"Content-Length",
				"Set-Cookie",
			},
			AllowCredentials: true,
			MaxAge:           12 * time.Hour,
		}),
	}
}

func (s *corsMiddleware) Handler() gin.HandlerFunc {
	return s.cors
}
