// ABOUTME: Configuration management for environment variables
// ABOUTME: Provides centralized access to application settings

package config

import "os"

type Config struct {
	DatabaseURL string
	JWTSecret   string
	Port        string
	GinMode     string
}

func GetConfig() *Config {
	return &Config{
		DatabaseURL: os.Getenv("DATABASE_URL"),
		JWTSecret:   os.Getenv("JWT_SECRET"),
		Port:        os.Getenv("PORT"),
		GinMode:     os.Getenv("GIN_MODE"),
	}
}
