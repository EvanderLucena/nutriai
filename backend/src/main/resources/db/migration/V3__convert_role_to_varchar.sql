-- V3: Convert role column from PostgreSQL native enum to varchar for Hibernate compatibility

ALTER TABLE nutritionist ALTER COLUMN role DROP DEFAULT;
ALTER TABLE nutritionist ALTER COLUMN role TYPE VARCHAR(20) USING role::text;
ALTER TABLE nutritionist ALTER COLUMN role SET DEFAULT 'NUTRITIONIST';

DROP TYPE IF EXISTS user_role CASCADE;