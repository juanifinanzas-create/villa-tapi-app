
ALTER TABLE recepcionistas ADD COLUMN password_hash TEXT;
ALTER TABLE recepcionistas ADD COLUMN role TEXT DEFAULT 'staff';

UPDATE recepcionistas SET role = 'admin' WHERE id = (SELECT MIN(id) FROM recepcionistas);
