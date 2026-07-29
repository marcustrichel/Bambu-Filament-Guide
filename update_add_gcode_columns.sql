-- Adds the Advanced tab's Filament start/end G-code fields to existing
-- databases. Plain text columns (like `notes`) rather than a JSONB settings
-- group, since these are raw G-code snippets rather than structured settings.
-- IF NOT EXISTS / DEFAULT '' make this safe to run against a table that
-- already has rows — existing filaments just get empty G-code.

ALTER TABLE filaments
  ADD COLUMN IF NOT EXISTS start_gcode text not null default '',
  ADD COLUMN IF NOT EXISTS end_gcode   text not null default '';
