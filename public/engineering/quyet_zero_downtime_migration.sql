-- quyet_zero_downtime_migration.sql
-- Production Zero-Downtime Security Hardening for DVWA MySQL/MariaDB Schema
-- Includes:
--   1) Dual-Hash Transparent Schema Migration (MD5 Legacy -> Bcrypt/Argon2id Tracking)
--   2) SQL SECURITY DEFINER Stored Procedure for Lazy Password Upgrade
--   3) Column-Level Least Privilege View + REVOKE/GRANT Isolation
--   4) Canary Honeypot Trap Row + Forensic Alert Audit Log

USE dvwa;

-- =====================================================================
-- 1. ZERO-DOWNTIME SCHEMA EVOLUTION (NON-BREAKING COLUMNS)
-- =====================================================================
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS hash_algo ENUM('md5_legacy', 'bcrypt_2y', 'argon2id')
    NOT NULL DEFAULT 'md5_legacy',
  ADD COLUMN IF NOT EXISTS password_v2 VARCHAR(255) NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS migrated_at DATETIME NULL DEFAULT NULL;

-- =====================================================================
-- 2. FORENSIC CANARY ALERT TABLE & HONEYPOT RECORD
-- =====================================================================
CREATE TABLE IF NOT EXISTS security_canary_alerts (
  alert_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
  triggered_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  canary_user   VARCHAR(64) NOT NULL,
  source_query  VARCHAR(512) NOT NULL,
  client_host   VARCHAR(128) NOT NULL,
  severity      ENUM('HIGH', 'CRITICAL') NOT NULL DEFAULT 'CRITICAL'
);

-- Insert synthetic Canary trap account at user_id = 0
-- Normal application lookups query user_id >= 1; full-table dumps (' OR 1=1 / UNION SELECT)
-- sweep row user_id = 0 and immediately reveal unauthorized data exfiltration.
INSERT INTO users (user_id, first_name, last_name, user, password, avatar, last_login, failed_login, hash_algo)
VALUES (
  0,
  'System',
  'Canary',
  'svc_canary_admin',
  'CANARY_TRAP_DO_NOT_AUTH_000000000000',
  '/hackable/users/canary.jpg',
  NOW(),
  0,
  'argon2id'
)
ON DUPLICATE KEY UPDATE
  first_name = VALUES(first_name),
  user = VALUES(user);

-- =====================================================================
-- 3. LEAST-PRIVILEGE VIEW (HIDES PASSWORD & AUTH TELEMETRY COLUMNS)
-- =====================================================================
CREATE OR REPLACE SQL SECURITY DEFINER VIEW v_user_public_profile AS
SELECT
  user_id,
  first_name,
  last_name,
  user AS username,
  avatar
FROM users
WHERE user_id >= 1;

-- Apply Least Privilege: web runtime account queries only the View,
-- never raw password columns on dvwa.users.
-- CREATE USER IF NOT EXISTS 'dvwa_app'@'%' IDENTIFIED BY 'StrongRuntimeSecret!2026';
-- REVOKE ALL PRIVILEGES ON dvwa.users FROM 'dvwa_app'@'%';
-- GRANT SELECT ON dvwa.v_user_public_profile TO 'dvwa_app'@'%';
-- FLUSH PRIVILEGES;

-- =====================================================================
-- 4. DUAL-HASH VERIFY & LAZY UPGRADE STORED PROCEDURE
-- =====================================================================
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_authenticate_and_upgrade $$
CREATE PROCEDURE sp_authenticate_and_upgrade(
  IN  p_username      VARCHAR(64),
  IN  p_md5_input     VARCHAR(64),
  IN  p_new_v2_hash   VARCHAR(255),
  OUT p_auth_status   VARCHAR(32),
  OUT p_algo_used     VARCHAR(32)
)
SQL SECURITY DEFINER
BEGIN
  DECLARE v_uid INT DEFAULT NULL;
  DECLARE v_algo VARCHAR(32) DEFAULT NULL;
  DECLARE v_old_md5 VARCHAR(64) DEFAULT NULL;
  DECLARE v_v2_hash VARCHAR(255) DEFAULT NULL;

  SELECT user_id, hash_algo, password, password_v2
    INTO v_uid, v_algo, v_old_md5, v_v2_hash
    FROM users
   WHERE user = p_username
   LIMIT 1;

  IF v_uid IS NULL THEN
    SET p_auth_status = 'INVALID_USER';
    SET p_algo_used = 'none';
  ELSEIF v_uid = 0 THEN
    INSERT INTO security_canary_alerts (canary_user, source_query, client_host, severity)
    VALUES (p_username, 'Direct auth attempt on Canary row user_id=0', USER(), 'CRITICAL');
    SET p_auth_status = 'CANARY_BLOCKED';
    SET p_algo_used = 'trap';
  ELSEIF v_algo IN ('bcrypt_2y', 'argon2id') AND v_v2_hash IS NOT NULL THEN
    -- Application runtime calls password_verify() against p_new_v2_hash / stored v_v2_hash
    SET p_auth_status = 'VERIFY_V2_IN_APP';
    SET p_algo_used = v_algo;
  ELSEIF v_old_md5 = p_md5_input THEN
    -- Transparent lazy upgrade from legacy MD5 -> bcrypt_2y without locking users out
    UPDATE users
       SET password_v2 = p_new_v2_hash,
           hash_algo   = 'bcrypt_2y',
           password    = CONCAT('MIGRATED_', SHA2(CONCAT(user_id, NOW()), 256)),
           migrated_at = NOW()
     WHERE user_id = v_uid;
    SET p_auth_status = 'UPGRADED_ON_LOGIN';
    SET p_algo_used = 'bcrypt_2y';
  ELSE
    SET p_auth_status = 'WRONG_PASSWORD';
    SET p_algo_used = v_algo;
  END IF;
END $$

DROP PROCEDURE IF EXISTS sp_record_canary_leak $$
CREATE PROCEDURE sp_record_canary_leak(
  IN p_client_host VARCHAR(128),
  IN p_raw_payload VARCHAR(512)
)
SQL SECURITY DEFINER
BEGIN
  INSERT INTO security_canary_alerts (canary_user, source_query, client_host, severity)
  VALUES ('svc_canary_admin', p_raw_payload, p_client_host, 'CRITICAL');
END $$

DELIMITER ;

-- Verification queries after applying migration:
SELECT user_id, user, hash_algo, LEFT(COALESCE(password_v2, '(pending_lazy_upgrade)'), 28) AS v2_state
  FROM users
 ORDER BY user_id ASC;

SELECT * FROM v_user_public_profile ORDER BY user_id ASC;
