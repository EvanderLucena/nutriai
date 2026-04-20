-- V1: Create initial schema
-- Creates user_role enum type and nutritionist table

CREATE TYPE user_role AS ENUM ('NUTRITIONIST', 'ADMIN');

CREATE TABLE nutritionist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'NUTRITIONIST',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_nutritionist_email ON nutritionist(email);