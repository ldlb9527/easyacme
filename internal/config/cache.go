package config

import (
	"github.com/patrickmn/go-cache"
	"time"
)

type Cache interface {
	Set(key string, val interface{}, d time.Duration)
	Get(key string) (val interface{}, exist bool)
}

type LocalCache struct {
	cache *cache.Cache
}

func (l *LocalCache) Set(key string, val interface{}, d time.Duration) {
	l.cache.Set(key, val, d)
}

func (l *LocalCache) Get(key string) (val interface{}, exist bool) {
	return l.cache.Get(key)
}

func NewCache() Cache {
	localCache := LocalCache{}
	localCache.cache = cache.New(cache.NoExpiration, 15*time.Minute)
	return &localCache
}
