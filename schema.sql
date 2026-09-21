-- CMS schema for Cloudflare D1
-- Run with:  npx wrangler d1 execute <DATABASE_NAME> --remote --file=./schema.sql

CREATE TABLE IF NOT EXISTS content (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS media (
  key TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  alt TEXT DEFAULT '',
  size_kb INTEGER DEFAULT 0,
  content_type TEXT DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT NOT NULL,
  attempted_at TEXT NOT NULL,
  success INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time ON login_attempts (ip, attempted_at);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  content TEXT NOT NULL,
  date TEXT NOT NULL,
  is_approved INTEGER NOT NULL DEFAULT 0,
  reply TEXT DEFAULT '',
  ip TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON comments (post_id);
