-- Migration 0002: ISO timestamp for comments (rate limiting)
--
-- The comments.date column stores a PERSIAN locale string for display, so it
-- cannot be compared against ISO windows for the per-IP rate limit.
-- Run ONCE on an existing database:
--   npx wrangler d1 execute <DATABASE_NAME> --remote --file=./migrations/0002_comments_created_at.sql
-- (Fresh databases already get created_at via schema.sql.)
ALTER TABLE comments ADD COLUMN created_at TEXT DEFAULT '';
