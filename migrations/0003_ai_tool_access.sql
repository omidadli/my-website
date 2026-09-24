-- Migration 0003: paid AI tools (محصولات هوشمند)
--
-- Adds per-phone access grants (bound to a limited number of devices to prevent
-- free re-sharing of the access code) and a usage/rate-limit message log.
--
-- The API also creates these tables lazily at runtime (CREATE TABLE IF NOT
-- EXISTS), so applying this migration is optional but recommended. Run ONCE:
--   npx wrangler d1 execute <DATABASE_NAME> --remote --file=./migrations/0003_ai_tool_access.sql

CREATE TABLE IF NOT EXISTS tool_access (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL,
  product_id TEXT NOT NULL DEFAULT 'all',
  code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  max_devices INTEGER NOT NULL DEFAULT 1,
  devices TEXT NOT NULL DEFAULT '[]',
  note TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  expires_at TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_tool_access_phone ON tool_access (phone, product_id);

CREATE TABLE IF NOT EXISTS tool_messages (
  id TEXT PRIMARY KEY,
  phone TEXT DEFAULT '',
  product_id TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tool_messages_phone_time ON tool_messages (phone, created_at);

-- Per-tool AI connection (provider / model / API key). Admin-only; never public.
CREATE TABLE IF NOT EXISTS tool_settings (
  product_id TEXT PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'gemini',
  base_url TEXT DEFAULT '',
  model TEXT DEFAULT '',
  api_key TEXT DEFAULT '',
  updated_at TEXT NOT NULL
);
