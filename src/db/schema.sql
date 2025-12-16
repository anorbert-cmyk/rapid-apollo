-- ===========================================
-- AETHER LOGIC - PostgreSQL Schema
-- ===========================================

-- Solutions table: stores all user solutions
CREATE TABLE IF NOT EXISTS solutions (
    id SERIAL PRIMARY KEY,
    tx_hash VARCHAR(66) UNIQUE NOT NULL,
    wallet_address VARCHAR(42) NOT NULL,
    tier VARCHAR(10) NOT NULL CHECK (tier IN ('standard', 'medium', 'full')),
    problem_statement TEXT NOT NULL,
    sections JSONB NOT NULL,
    raw_markdown TEXT,
    provider VARCHAR(20) DEFAULT 'openai-o3',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast wallet-based lookups
CREATE INDEX IF NOT EXISTS idx_solutions_wallet ON solutions(wallet_address);
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
-- ===========================================

CREATE TABLE IF NOT EXISTS magic_links (
    id SERIAL PRIMARY KEY,
    token VARCHAR(64) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    solution_id VARCHAR(100) NOT NULL,
    tier VARCHAR(10) NOT NULL,
    problem_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE,
    is_valid BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token);
CREATE INDEX IF NOT EXISTS idx_magic_links_email ON magic_links(email);
CREATE INDEX IF NOT EXISTS idx_magic_links_solution ON magic_links(solution_id);
