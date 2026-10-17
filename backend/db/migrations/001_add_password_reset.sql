-- db/migrations/001_add_password_reset.sql
--
-- Adds password-reset support to an EXISTING users table without
-- dropping any data. Run this once against your current database
-- (local and whatever MySQL you're hosting on).
--
-- reset_token_hash stores a HASH of the reset token, never the raw
-- token itself -- same reasoning as password_hash: if the DB ever
-- leaked, the hash alone can't be used to reset anyone's password.

ALTER TABLE `users`
  ADD COLUMN `reset_token_hash` VARCHAR(255) NULL DEFAULT NULL AFTER `password_hash`,
  ADD COLUMN `reset_token_expires` TIMESTAMP NULL DEFAULT NULL AFTER `reset_token_hash`;

CREATE INDEX `idx_users_reset_token_hash` ON `users` (`reset_token_hash`);
