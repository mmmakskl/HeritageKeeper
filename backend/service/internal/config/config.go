package config

import (
	"flag"
	"os"
	"time"

	"github.com/ilyakaznacheev/cleanenv"
)

type Config struct {
	ENV        string        `yaml:"env" env-default:"development"`
	Storage    Storage       `yaml:"storage" env-required:"true"`
	HTTPServer HTTPServer    `yaml:"http_server" env-required:"true"`
	Clients    ClientsConfig `yaml:"clients" env-required:"true"`
	AppSecret  string        `yaml:"app_secret" env-required:"true" env:"APP_SECRET"`
}

type ClientsConfig struct {
	SSO Client `yaml:"sso"`
}

type Storage struct {
	Host     string `yaml:"host"`
	Port     int    `yaml:"port"`
	User     string `yaml:"user"`
	Password string `yaml:"password"`
	DbName   string `yaml:"db_name"`
	SSLMode  string `yaml:"ssl_mode"`
}

type HTTPServer struct {
	Address     string        `yaml:"address" env-default:"0.0.0.0:8080"`
	Timeout     time.Duration `yaml:"timeout" env-default:"5s"`
	IdleTimeout time.Duration `yaml:"idle_timeout" env-default:"60s"`
}

type Client struct {
	Address      string        `yaml:"address"`
	Timeout      time.Duration `yaml:"timeout" env-default:"5s"`
	RetriesCount int           `yaml:"retries_count" env-default:"3"`
}

//TODO: errors

func MustLoad() *Config {
	configPath := fetchConfigPath()
	if configPath == "" {
		panic("config path is empty")
	}

	if _, err := os.Stat(configPath); err != nil {

		panic(err)
	}

	var cfg Config

	err := cleanenv.ReadConfig(configPath, &cfg)
	if err != nil {
		panic(err)
	}

	return &cfg
}

func fetchConfigPath() string {
	var res string

	flag.StringVar(&res, "config", "", "Path to config file")
	flag.Parse()
	if res == "" {
		res = os.Getenv("CONFIG_PATH")
	}

	return res
}
