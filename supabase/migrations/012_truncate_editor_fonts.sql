-- Remove all fonts from image editor (editor_fonts table)
-- Image editor no longer uses database fonts; uses system fonts only.
TRUNCATE TABLE editor_fonts;
