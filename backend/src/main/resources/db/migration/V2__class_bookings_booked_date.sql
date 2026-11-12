-- Add booked_date to class_bookings (entity field added in M3) and the
-- duplicate-booking guard index.
ALTER TABLE class_bookings
    ADD COLUMN booked_date DATE NULL AFTER booked_at;

CREATE INDEX idx_bookings_dedup ON class_bookings (class_id, member_id, booked_date, status);
