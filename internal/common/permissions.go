package common

// 权限常量定义
const (
	PermDashboardStats = "dashboard:stats"
	// ACME账户管理权限
	PermAcmeAccountCreate = "acme:account:create"
	PermAcmeAccountRead   = "acme:account:read"
	PermAcmeAccountDelete = "acme:account:delete"
	PermAcmeAccountManage = "acme:account:manage"

	// ACME证书管理权限
	PermAcmeCertCreate         = "acme:cert:create"
	PermAcmeCertRead           = "acme:cert:read"
	PermAcmeCertDelete         = "acme:cert:delete"
	PermAcmeCertAuth           = "acme:cert:auth"
	PermAcmeCertManage         = "acme:cert:manage"
	PermAcmeCertPrivateKeyRead = "acme:cert:private_key:read"

	// DNS提供商管理权限
	PermDNSProviderCreate     = "dns:provider:create"
	PermDNSProviderRead       = "dns:provider:read"
	PermDNSProviderUpdate     = "dns:provider:update"
	PermDNSProviderDelete     = "dns:provider:delete"
	PermDNSProviderSecretRead = "dns:provider:secret:read"

	// 用户管理权限
	PermUserCreate = "user:create"
	PermUserRead   = "user:read"
	PermUserUpdate = "user:update"
	PermUserDelete = "user:delete"

	// 角色管理权限
	PermRoleCreate = "role:create"
	PermRoleRead   = "role:read"
	PermRoleUpdate = "role:update"
	PermRoleDelete = "role:delete"

	// 系统权限
	PermSystemPermissionRead = "system:permission:read"
)

// GetAllPermissions 获取所有权限点
func GetAllPermissions() []string {
	return []string{
		PermDashboardStats,
		PermAcmeAccountCreate, PermAcmeAccountRead, PermAcmeAccountDelete, PermAcmeAccountManage,
		PermAcmeCertCreate, PermAcmeCertRead, PermAcmeCertDelete, PermAcmeCertAuth, PermAcmeCertManage, PermAcmeCertPrivateKeyRead,
		PermDNSProviderCreate, PermDNSProviderRead, PermDNSProviderUpdate, PermDNSProviderDelete, PermDNSProviderSecretRead,
		PermUserCreate, PermUserRead, PermUserUpdate, PermUserDelete,
		PermRoleCreate, PermRoleRead, PermRoleUpdate, PermRoleDelete,
		PermSystemPermissionRead,
	}
}
