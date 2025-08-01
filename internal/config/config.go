package config

import (
	"log"

	"github.com/spf13/viper"
)

type Config struct {
	App      AppConfig      `mapstructure:"app"`
	Database DatabaseConfig `mapstructure:"database"`
	Log      LogConfig      `mapstructure:"log"`
}

type AppConfig struct {
	Env           string `mapstructure:"env"`
	Port          int    `mapstructure:"port"`
	SessionSecret string `mapstructure:"session_secret"`
	Language      string `mapstructure:"language"`
}

type DatabaseConfig struct {
	Host     string `mapstructure:"host"`
	Port     int    `mapstructure:"port"`
	User     string `mapstructure:"user"`
	Password string `mapstructure:"password"`
	Name     string `mapstructure:"name"`
}

type LogConfig struct {
	Level string `mapstructure:"level"`
	File  string `mapstructure:"file"`
}

// 为了兼容现有代码，保留这些字段
func (c *Config) GetEnv() string           { return c.App.Env }
func (c *Config) GetPort() int             { return c.App.Port }
func (c *Config) GetSessionSecret() string { return c.App.SessionSecret }
func (c *Config) GetDBHost() string        { return c.Database.Host }
func (c *Config) GetDBPort() int           { return c.Database.Port }
func (c *Config) GetDBUser() string        { return c.Database.User }
func (c *Config) GetDBPassword() string    { return c.Database.Password }
func (c *Config) GetDBName() string        { return c.Database.Name }
func (c *Config) GetLanguage() string      { return c.App.Language }

func NewConfig() *Config {
	// 设置配置文件名称和路径
	viper.SetConfigName("config") // 配置文件名 (不包含扩展名)
	viper.SetConfigType("yaml")   // 配置文件类型
	viper.AddConfigPath(".")      // 在当前目录查找配置文件
	viper.AddConfigPath("./")     // 也在根目录查找

	// 设置环境变量前缀
	viper.SetEnvPrefix("easyacme")
	viper.AutomaticEnv()

	// 读取配置文件
	if err := viper.ReadInConfig(); err != nil {
		log.Printf("无法读取配置文件: %v, 使用默认配置", err)
	} else {
		log.Printf("使用配置文件: %s", viper.ConfigFileUsed())
	}

	var config Config
	if err := viper.Unmarshal(&config); err != nil {
		log.Fatalf("无法解析配置: %v", err)
	}

	return &config
}
