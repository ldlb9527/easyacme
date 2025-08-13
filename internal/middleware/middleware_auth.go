package middleware

import (
	"easyacme/internal/common"
	"easyacme/internal/model"
	"encoding/json"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"net/http"
)

type authMiddleware struct {
	auth gin.HandlerFunc
}

var notNeedAuthPath = map[string]struct{}{
	"/api/auth/login":    {},
	"/api/auth/logout":   {},
	"/api/auth/info":     {},
	"/api/ping":          {},
	"/api/init/user":     {},
	"/api/auth/language": {},
}

// isPublicPath 检查路径是否为公开路径
func isNotNeedAuthPath(path string) bool {
	_, ok := notNeedAuthPath[path]
	return ok
}

// newAuthMiddleware auth处理
func newAuthMiddleware() *authMiddleware {
	return &authMiddleware{
		auth: func(ctx *gin.Context) {
			if isNotNeedAuthPath(ctx.Request.URL.Path) {
				ctx.Next()
				return
			}

			session := sessions.Default(ctx)
			userJson := session.Get(common.SessionUser)
			if userJson == nil {
				ctx.JSON(http.StatusUnauthorized, gin.H{"error": "未登录"})
				ctx.Abort()
				return
			}

			if userBytes, ok := userJson.([]byte); ok {
				var user *model.User
				err := json.Unmarshal(userBytes, &user)
				if err != nil {
					ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Unmarshal error"})
					ctx.Abort()
					return
				}
				ctx.Set(common.CurrentUSer, user)
				ctx.Next()
			} else {
				ctx.JSON(http.StatusUnauthorized, gin.H{"error": "type error"})
				ctx.Abort()
				return
			}
		},
	}
}

func (s *authMiddleware) Handler() gin.HandlerFunc {
	return s.auth
}
