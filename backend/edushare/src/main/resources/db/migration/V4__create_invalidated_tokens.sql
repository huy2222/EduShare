CREATE TABLE invalidated_tokens (
    id VARCHAR(36) NOT NULL,
    expiry_time TIMESTAMP(6) NOT NULL,
    revoked_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_invalidated_token_expiry (expiry_time)
);
