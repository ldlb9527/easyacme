package common

import (
	"fmt"
	"go.uber.org/zap"
	"strings"
	"time"

	"gorm.io/gorm"
)

// Migration 数据库迁移结构体
type Migration struct {
	ID           string                  `json:"id" gorm:"primarykey"`
	CreatedAt    time.Time               `json:"created_at"`
	Dependencies []string                `gorm:"-"`
	Action       func(tx *gorm.DB) error `gorm:"-"`
}

// MigrationManager 迁移管理器
type MigrationManager struct {
	db           *gorm.DB
	logger       *zap.Logger
	migrations   map[string]*Migration
	migrationIDs []string
}

// NewMigrationManager 创建新的迁移管理器
func NewMigrationManager(db *gorm.DB, logger *zap.Logger) *MigrationManager {
	return &MigrationManager{
		db:           db,
		logger:       logger,
		migrations:   make(map[string]*Migration),
		migrationIDs: make([]string, 0),
	}
}

// AddMigration 注册新的迁移
func (m *MigrationManager) AddMigration(migration *Migration) error {
	if _, ok := m.migrations[migration.ID]; ok {
		return fmt.Errorf("duplicate migration id %s", migration.ID)
	}
	m.migrations[migration.ID] = migration
	m.migrationIDs = append(m.migrationIDs, migration.ID)
	return nil
}

// Migrate 执行迁移
func (m *MigrationManager) Migrate() error {
	// 检查循环依赖
	if err := m.check(); err != nil {
		return fmt.Errorf("migration check error: %w", err)
	}

	if !m.db.Migrator().HasTable(&Migration{}) {
		if err := m.db.Migrator().CreateTable(&Migration{}); err != nil {
			return fmt.Errorf("failed to create migration table: %w", err)
		}
	}

	var executedMigrations []Migration
	if err := m.db.Find(&executedMigrations).Error; err != nil {
		return fmt.Errorf("failed to get executed migrations: %w", err)
	}

	executedMap := make(map[string]bool)
	for _, executed := range executedMigrations {
		executedMap[executed.ID] = true
	}

	for _, migrationID := range m.migrationIDs {
		if err := m.executeMigration(migrationID, executedMap); err != nil {
			return err
		}
	}

	return nil
}

// executeMigration 执行单个迁移
func (m *MigrationManager) executeMigration(migrationID string, executedMap map[string]bool) error {
	migration, ok := m.migrations[migrationID]
	if !ok {
		return fmt.Errorf("migration %s not found", migrationID)
	}

	if executedMap[migrationID] {
		m.logger.Info(fmt.Sprintf("migration %s already executed", migrationID))
		return nil
	}

	for _, depID := range migration.Dependencies {
		if err := m.executeMigration(depID, executedMap); err != nil {
			return err
		}
	}

	tx := m.db.Begin()
	if tx.Error != nil {
		return fmt.Errorf("failed to begin transaction for migration %s: %w", migrationID, tx.Error)
	}

	if err := migration.Action(tx); err != nil {
		tx.Rollback()
		return fmt.Errorf("migration %s failed: %w", migrationID, err)
	}

	migrationRecord := &Migration{
		ID:        migrationID,
		CreatedAt: time.Now(),
	}
	if err := tx.Create(migrationRecord).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to create migration record %s: %w", migrationID, err)
	}

	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit migration %s: %w", migrationID, err)
	}

	executedMap[migrationID] = true
	m.logger.Info(fmt.Sprintf("migration %s successfully executed", migrationID))
	return nil
}

func (m *MigrationManager) check() error {
	visited := make(map[string]bool)
	recStack := make(map[string]bool)

	for _, migrationID := range m.migrationIDs {
		if err := m.checkCycleDependency(migrationID, visited, recStack, []string{migrationID}); err != nil {
			return err
		}
	}
	return nil
}

// checkCycleDependency
func (m *MigrationManager) checkCycleDependency(migrationID string, visited, recStack map[string]bool, path []string) error {
	if recStack[migrationID] {
		pathStr := m.formatPath(path, migrationID)
		return fmt.Errorf("cycle detected: Migration %s is part of the cycle. Path: %s", migrationID, pathStr)
	}
	if visited[migrationID] {
		return nil
	}

	visited[migrationID] = true
	recStack[migrationID] = true

	migration, ok := m.migrations[migrationID]
	if !ok {
		return fmt.Errorf("migration %s not found", migrationID)
	}

	for _, dependency := range migration.Dependencies {
		newPath := append(path, dependency)
		if err := m.checkCycleDependency(dependency, visited, recStack, newPath); err != nil {
			return err
		}
	}

	recStack[migrationID] = false
	return nil
}

// formatPath 格式化路径为可读字符串
func (m *MigrationManager) formatPath(path []string, start string) string {
	startIndex := 0
	for i, p := range path {
		if p == start {
			startIndex = i
			break
		}
	}
	return "\n" + strings.Join(path[startIndex:], " -> \n") + "\n"
}
