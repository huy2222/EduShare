-- MySQL 8+ migration for LOCAL and GOOGLE authentication identities.
-- Execute this migration with the project's migration runner before enabling Google login.

ALTER TABLE users
    MODIFY COLUMN password VARCHAR(255) NULL;

CREATE TABLE IF NOT EXISTS user_auth_providers (
    id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    provider VARCHAR(30) NOT NULL,
    provider_id VARCHAR(255) NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_auth_provider_identity UNIQUE (provider, provider_id),
    CONSTRAINT uk_user_auth_provider UNIQUE (user_id, provider),
    CONSTRAINT fk_user_auth_provider_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
);

INSERT INTO user_auth_providers (id, user_id, provider, provider_id, created_at)
SELECT UUID(), users.id, 'LOCAL', NULL, COALESCE(users.created_at, CURRENT_TIMESTAMP(6))
FROM users
WHERE users.password IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM user_auth_providers providers
      WHERE providers.user_id = users.id
        AND providers.provider = 'LOCAL'
  );
