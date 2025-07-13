package model

import (
	"time"
)

type IncrModel struct {
	ID        int       `json:"id" gorm:"primarykey;autoIncrement"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type User struct {
	IncrModel
	Username    string     `json:"username" gorm:"column:username;type:varchar(255);not null;uniqueIndex"`
	Password    string     `json:"-" gorm:"column:password;type:varchar(128);not null"`
	Enabled     bool       `json:"enabled" gorm:"column:enabled;not null;default:true"`
	LastLoginAt *time.Time `json:"last_login_at" gorm:"column:last_login_at"`
	Language    string     `json:"language" gorm:"column:language;type:varchar(64);not null;default:'zh-CN'"`

	Roles []UserRole `json:"roles,omitempty" gorm:"foreignKey:UserID"`
}

func (User) TableName() string {
	return "users"
}

type Role struct {
	IncrModel
	Name        string           `json:"name" gorm:"column:name;type:varchar(100);not null;uniqueIndex"`
	Description string           `json:"description" gorm:"column:description;type:varchar(255)"`
	Users       []UserRole       `json:"users,omitempty" gorm:"foreignKey:RoleID"`
	Permissions []RolePermission `json:"permissions,omitempty" gorm:"foreignKey:RoleID"`
}

func (Role) TableName() string {
	return "roles"
}

// UserRole 用户角色关联表
type UserRole struct {
	IncrModel
	UserID int `json:"user_id" gorm:"column:user_id;type:integer;not null"`
	RoleID int `json:"role_id" gorm:"column:role_id;type:integer;not null"`

	User *User `json:"user,omitempty" gorm:"foreignKey:UserID;references:ID"`
	Role *Role `json:"role,omitempty" gorm:"foreignKey:RoleID;references:ID"`
}

func (UserRole) TableName() string {
	return "user_roles"
}

// RolePermission 角色权限关联表
type RolePermission struct {
	IncrModel
	RoleID     int    `json:"role_id" gorm:"column:role_id;type:integer;not null"`
	Permission string `json:"permission" gorm:"column:permission;type:varchar(36);not null"`

	Role *Role `json:"role,omitempty" gorm:"foreignKey:RoleID;references:ID"`
}

func (RolePermission) TableName() string {
	return "role_permissions"
}
