-- Persist per-user notification read-state (replaces Firestore
-- users/{uid}.notificationState.readIds).
ALTER TABLE users
    ADD COLUMN notification_state JSON NULL AFTER status;
