-- ===========================================
-- REPORTS TABLE - Perplexity Report Generation
-- Migration: 002_reports.sql
-- ===========================================

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(42) NOT NULL,
    problem_statement TEXT NOT NULL,
    package VARCHAR(20) NOT NULL DEFAULT 'premium',
    status VARCHAR(20) NOT NULL DEFAULT 'queued',
    progress INTEGER DEFAULT 0,
    
    -- Content (partial results for crash recovery)
    analysis_markdown TEXT,
    figma_prompts JSONB,
    parsed_sections JSONB,
    
    -- Metadata
    perplexity_usage JSONB,
    processing_time_ms INTEGER,
    error_message TEXT,
    
    -- Payment
    tx_hash VARCHAR(66),
    stripe_session_id VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reports_wallet ON reports(wallet_address);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_tx_hash ON reports(tx_hash) WHERE tx_hash IS NOT NULL;

-- Add premium tier to stats if not exists
INSERT INTO stats (key, value) VALUES ('count_premium', '0')
ON CONFLICT (key) DO NOTHING;

-- Comments
COMMENT ON TABLE reports IS 'Perplexity-generated product analysis reports';
COMMENT ON COLUMN reports.package IS 'Report package: premium (analysis only) or premium_figma (with Figma prompts)';
COMMENT ON COLUMN reports.status IS 'Processing status: queued, analysis, validation, figma, completed, failed';
COMMENT ON COLUMN reports.parsed_sections IS 'Parsed sections from the markdown output';
COMMENT ON COLUMN reports.perplexity_usage IS 'Token usage and cost data from Perplexity API';
