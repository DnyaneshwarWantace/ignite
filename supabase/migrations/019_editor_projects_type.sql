-- Separate video and image editor projects by editor_type.
-- Existing rows default to 'video'; new image projects use 'image'.
ALTER TABLE editor_projects
  ADD COLUMN IF NOT EXISTS editor_type TEXT NOT NULL DEFAULT 'video'
  CHECK (editor_type IN ('video', 'image'));

CREATE INDEX IF NOT EXISTS idx_editor_projects_editor_type ON editor_projects(editor_type);
CREATE INDEX IF NOT EXISTS idx_editor_projects_user_editor_type ON editor_projects(user_id, editor_type);
