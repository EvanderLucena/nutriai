-- Separate database for Evolution API so it doesn't share schema with NutriAI (Flyway-managed).
-- Prisma (Evolution's ORM) needs its own database to manage migrations safely.
-- Uses the default POSTGRES_USER from compose (defaults to "nutriai").
SELECT 'CREATE DATABASE evolution'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'evolution')\gexec
GRANT ALL PRIVILEGES ON DATABASE evolution TO nutriai;