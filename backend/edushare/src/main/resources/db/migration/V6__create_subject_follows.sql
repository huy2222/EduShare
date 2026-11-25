CREATE TABLE IF NOT EXISTS subject_follows (
    id BINARY(16) NOT NULL,
    subject_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_subject_follow UNIQUE (subject_id, user_id),
    CONSTRAINT fk_subject_follow_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    CONSTRAINT fk_subject_follow_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_subject_follow_user (user_id)
);
