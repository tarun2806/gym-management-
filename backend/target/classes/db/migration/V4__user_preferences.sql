-- Personal settings blob (phone, bio, timezone, notification prefs) replacing
-- the Firestore users/{uid} document fields.
ALTER TABLE users
    ADD COLUMN preferences JSON NULL AFTER notification_state;
