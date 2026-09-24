-- Migration 0004: usage-based plan quotas + free-trial gamification.
-- Adds a per-grant message quota and a device-based free-trial counter table.
-- Safe to run on an existing DB (the ALTER may error if the column already
-- exists; run the CREATE TABLE independently in that case).

ALTER TABLE tool_access ADD COLUMN message_quota INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS tool_trials (
  device_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (device_id, product_id)
);
