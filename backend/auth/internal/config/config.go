package config

import (
	"flag"
	"os"
	"time"

	"github.com/ilyakaznacheev/cleanenv"
)

type Config struct {
	Env       string        `yaml:"env" env-default:"local"`
	Storage   Storage       `yaml:"storage"`
	TockenTTL time.Duration `yaml:"token_ttl"`
	GRPC      GRPCConfig    `yaml:"grpc"`
}

type Storage struct {
	Host     string `yaml:"host"`
	Port     int    `yaml:"port"`
	User     string `yaml:"user"`
	Password string `yaml:"password"`
	DbName   string `yaml:"db_name"`
	SSLMode  string `yaml:"ssl_mode"`
}

type GRPCConfig struct {
	Port    int           `yaml:"port"`
	Timeout time.Duration `yaml:"timeout"`
}

func MustLoad() *Config {
	path := fetchConfigPath()
	if path == "" {
		panic("config path is empty")
	}

	return MustLoadByPath(path)
}

func MustLoadByPath(configPath string) *Config {
	if configPath == "" {
		panic("config path is empty")
	}
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		panic("config file not found: " + configPath)
	}

	var cfg Config
	if err := cleanenv.ReadConfig(configPath, &cfg); err != nil {
		panic("failed to load config: " + err.Error())
	}

	return &cfg
}

func fetchConfigPath() string {
	var res string

	flag.StringVar(&res, "config", "", "path to config file")
	flag.Parse()
	if res == "" {
		res = os.Getenv("CONFIG_PATH")
	}

	return res
}
