-- Neon Postgres 初始化脚本
-- 在 Neon Console → SQL Editor 中执行此脚本

CREATE TABLE IF NOT EXISTS system_config (
    key TEXT PRIMARY KEY,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 可选：插入初始默认配置
-- INSERT INTO system_config (key, config) VALUES ('integrated-system-config-v4', '{}'::jsonb)
-- ON CONFLICT (key) DO NOTHING;
