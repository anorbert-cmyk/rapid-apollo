-- ===========================================
-- AETHER LOGIC - PostgreSQL Schema
-- ===========================================

-- Solutions table: stores all user solutions
-- Note: wallet_address, problem_statement, sections, raw_markdown are encrypted when DB_ENCRYPTION_KEY is set
CREATE TABLE IF NOT EXISTS solutions (
    id SERIAL PRIMARY KEY,
    tx_hash VARCHAR(66) UNIQUE NOT NULL,
    wallet_address TEXT NOT NULL,  -- Encrypted, so TEXT for variable length
    wallet_hash VARCHAR(64),       -- SHA-256 hash for searchable lookups
    tier VARCHAR(10) NOT NULL CHECK (tier IN ('standard', 'medium', 'full')),
    problem_statement TEXT NOT NULL,  -- Encrypted
    sections TEXT NOT NULL,           -- Encrypted JSON, so TEXT not JSONB
    raw_markdown TEXT,                -- Encrypted
    provider VARCHAR(50) DEFAULT 'openai-o3',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_solutions_wallet ON solutions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_solutions_wallet_hash ON solutions(wallet_hash);
CREATE INDEX IF NOT EXISTS idx_solutions_created ON solutions(created_at DESC);

-- Used transaction hashes (double-spend prevention)
CREATE TABLE IF NOT EXISTS used_tx_hashes (
    tx_hash VARCHAR(66) PRIMARY KEY,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin statistics
CREATE TABLE IF NOT EXISTS stats (
    key VARCHAR(50) PRIMARY KEY,
    value NUMERIC DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transaction log for admin dashboard
CREATE TABLE IF NOT EXISTS transaction_log (
    id SERIAL PRIMARY KEY,
    tx_hash VARCHAR(66) NOT NULL,
    wallet_address VARCHAR(42) NOT NULL,
    tier VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tx_log_created ON transaction_log(created_at DESC);

-- Insert default stats
INSERT INTO stats (key, value) VALUES 
    ('total_solves', 0),
    ('total_revenue_eth', 0),
    ('count_standard', 0),
    ('count_medium', 0),
    ('count_full', 0)
ON CONFLICT (key) DO NOTHING;

-- ===========================================
-- MAGIC LINKS - Email-based authentication
-- Note: email and problem_summary are encrypted when DB_ENCRYPTION_KEY is set
-- ===========================================

CREATE TABLE IF NOT EXISTS magic_links (
    id SERIAL PRIMARY KEY,
    token VARCHAR(64) UNIQUE NOT NULL,
    email TEXT NOT NULL,              -- Encrypted
    email_hash VARCHAR(64),           -- SHA-256 hash for searchable lookups
    solution_id VARCHAR(100) NOT NULL,
    tier VARCHAR(10) NOT NULL,
    problem_summary TEXT,             -- Encrypted
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE,
    is_valid BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token);
CREATE INDEX IF NOT EXISTS idx_magic_links_email ON magic_links(email);
CREATE INDEX IF NOT EXISTS idx_magic_links_email_hash ON magic_links(email_hash);
CREATE INDEX IF NOT EXISTS idx_magic_links_solution ON magic_links(solution_id);
