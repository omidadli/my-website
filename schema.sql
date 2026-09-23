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

-- Lead capture (contact form + booking calendar)
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'contact',
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  contact TEXT DEFAULT '',
  website TEXT DEFAULT '',
  goal TEXT DEFAULT '',
  service TEXT DEFAULT '',
  details TEXT NOT NULL,
  booking_date TEXT DEFAULT '',
  booking_time TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  ip TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_leads_created ON leads (created_at);
CREATE INDEX IF NOT EXISTS idx_leads_ip_time ON leads (ip, created_at);

-- Media stored inside D1 (free fallback when R2 is not available)
CREATE TABLE IF NOT EXISTS media_files (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_kb INTEGER DEFAULT 0,
  data_b64 TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- AI assistant conversation history (behavior monitoring)
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  ip TEXT DEFAULT '',
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  mode TEXT DEFAULT 'local',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_ip_time ON chat_messages (ip, created_at);
