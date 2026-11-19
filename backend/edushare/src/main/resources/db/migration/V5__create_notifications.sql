CREATE TABLE notifications (
    id BINARY(16) NOT NULL,
    recipient_id VARCHAR(255) NOT NULL,
    type VARCHAR(40) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    document_id BINARY(16),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_notification_recipient FOREIGN KEY (recipient_id) REFERENCES users(id)
);

CREATE INDEX idx_notification_recipient_created ON notifications(recipient_id, created_at);
CREATE INDEX idx_notification_recipient_read ON notifications(recipient_id, is_read);
