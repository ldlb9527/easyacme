package common

import (
	"easyacme/internal/model"
	"github.com/gin-gonic/gin"
	"net/http"
)

// PermissionDecorator 权限装饰器
type PermissionDecorator struct{}

// NewPermissionDecorator 创建权限装饰器
func NewPermissionDecorator() *PermissionDecorator {
	return &PermissionDecorator{}
}

// WithPermission 权限装饰器，包装需要权限验证的处理函数
func (pd *PermissionDecorator) WithPermission(permission string, handler gin.HandlerFunc) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 从context中获取当前用户
		currentUser, exists := c.Get(CurrentUSer)
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "未找到用户信息"})
			c.Abort()
			return
		}

		user, ok := currentUser.(*model.User)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "用户信息格式错误"})
			c.Abort()
			return
		}

		// 检查用户是否有权限
		if !pd.hasPermission(user, permission) {
			c.JSON(http.StatusForbidden, gin.H{"error": "权限不足"})
			c.Abort()
			return
		}

		// 权限验证通过，调用原始处理函数
		handler(c)
	}
}

// hasPermission 检查用户是否有指定权限
func (pd *PermissionDecorator) hasPermission(user *model.User, permission string) bool {
	for _, userRole := range user.Roles {
		if userRole.Role != nil {
			for _, rolePermission := range userRole.Role.Permissions {
				if rolePermission.Permission == "*" || rolePermission.Permission == permission {
					return true
				}
			}
		}
	}
	return false
}

// 便捷函数，直接使用默认装饰器
var defaultDecorator = NewPermissionDecorator()

// WithPermission 全局便捷函数
func WithPermission(permission string, handler gin.HandlerFunc) gin.HandlerFunc {
	return defaultDecorator.WithPermission(permission, handler)
}
