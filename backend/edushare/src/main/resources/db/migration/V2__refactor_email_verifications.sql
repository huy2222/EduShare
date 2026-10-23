-- Proposed non-destructive migration for MySQL 8+.
-- The legacy `used` column is intentionally retained so no existing data is discarded.

ALTER TABLE email_verifications
    ADD COLUMN type VARCHAR(30) NULL AFTER otp_hash,
    ADD COLUMN verified_at DATETIME(6) NULL AFTER expires_at,
    ADD COLUMN resend_count INT NOT NULL DEFAULT 0 AFTER attempts,
    ADD COLUMN last_sent_at DATETIME(6) NULL AFTER resend_count,
    ADD COLUMN status VARCHAR(30) NULL AFTER last_sent_at;

-- Legacy hashes use a different format. Expire every legacy code so it cannot be
-- incorrectly accepted or consume attempts; pending users can request a new HMAC OTP.
UPDATE email_verifications ev
SET ev.type = 'REGISTER',
    ev.last_sent_at = ev.created_at,
    ev.status = 'EXPIRED',
    ev.verified_at = NULL;

ALTER TABLE email_verifications
    MODIFY COLUMN type VARCHAR(30) NOT NULL,
    MODIFY COLUMN last_sent_at DATETIME(6) NOT NULL,
    MODIFY COLUMN status VARCHAR(30) NOT NULL;

CREATE INDEX idx_email_verification_current
    ON email_verifications (user_id, type, created_at);
