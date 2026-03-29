-- PostgreSQL does not support removing values from an enum directly.
-- To fully reverse this, you would need to recreate the enum and all
-- dependent columns. For safety, this migration marks 'abandoned' rows
-- as 'finished' instead.
UPDATE rooms SET status = 'finished' WHERE status = 'abandoned';
