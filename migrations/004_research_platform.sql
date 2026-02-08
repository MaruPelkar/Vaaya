-- ============================================================================
-- Vaaya Research Platform Schema
-- ============================================================================
-- This migration creates the new research platform tables.
-- Run this in Supabase SQL Editor.
-- This migration is IDEMPOTENT - safe to run multiple times.
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Helper function to create enum types only if they don't exist
CREATE OR REPLACE FUNCTION create_enum_if_not_exists(
  enum_name TEXT,
  enum_values TEXT[]
) RETURNS VOID AS $$
DECLARE
  val TEXT;
  sql TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = enum_name) THEN
    sql := 'CREATE TYPE ' || enum_name || ' AS ENUM (';
    FOR i IN 1..array_length(enum_values, 1) LOOP
      IF i > 1 THEN sql := sql || ', '; END IF;
      sql := sql || '''' || enum_values[i] || '''';
    END LOOP;
    sql := sql || ')';
    EXECUTE sql;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CLIENTS TABLE
-- Companies that hire you for research
-- ============================================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo_url TEXT,
  industry TEXT,
  website TEXT,
  contact_name TEXT,
  contact_email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_created ON clients(created_at DESC);

-- ============================================================================
-- CAMPAIGNS TABLE
-- Research projects for a client
-- ============================================================================
SELECT create_enum_if_not_exists('campaign_status', ARRAY['draft', 'active', 'paused', 'completed', 'archived']);

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status campaign_status DEFAULT 'draft',

  -- Research goals
  research_goals TEXT[],

  -- Target criteria for participant discovery (JSONB for flexibility)
  target_criteria JSONB DEFAULT '{
    "job_titles": [],
    "seniority_levels": [],
    "departments": [],
    "company_sizes": [],
    "industries": [],
    "locations": [],
    "products_used": [],
    "custom_criteria": []
  }',

  -- Outreach strategy configuration
  outreach_strategy JSONB DEFAULT '{
    "mode": "nurture",
    "channels": ["email"],
    "sequence_steps": [],
    "auto_personalize": true
  }',

  -- Budget tracking
  budget_estimated DECIMAL(10, 2) DEFAULT 0,
  budget_spent DECIMAL(10, 2) DEFAULT 0,

  -- Dates
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_client ON campaigns(client_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created ON campaigns(created_at DESC);

-- ============================================================================
-- PARTICIPANTS TABLE (GLOBAL POOL)
-- All research participants across campaigns
-- ============================================================================
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Contact info
  email TEXT UNIQUE,
  phone TEXT,
  linkedin_url TEXT,

  -- Identity
  full_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,

  -- Professional info
  job_title TEXT,
  seniority_level TEXT, -- IC, Lead, Manager, Director, VP, C-Suite, Founder
  department TEXT,
  company_name TEXT,
  company_size TEXT,
  company_industry TEXT,
  company_website TEXT,

  -- Location
  city TEXT,
  country TEXT,
  timezone TEXT,

  -- Discovery metadata
  source TEXT, -- nyne, firecrawl, serpapi, manual, referral
  source_url TEXT,

  -- Research metadata (aggregated across campaigns)
  total_sessions INTEGER DEFAULT 0,
  last_contacted_at TIMESTAMPTZ,
  last_session_at TIMESTAMPTZ,
  preferred_contact_method TEXT, -- email, phone, linkedin
  preferred_incentive_type TEXT, -- gift_card, donation, other

  -- Notes and tags
  notes TEXT,
  tags TEXT[],

  -- Raw data from discovery
  raw_data JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);
CREATE INDEX IF NOT EXISTS idx_participants_name ON participants(full_name);
CREATE INDEX IF NOT EXISTS idx_participants_company ON participants(company_name);
CREATE INDEX IF NOT EXISTS idx_participants_source ON participants(source);
CREATE INDEX IF NOT EXISTS idx_participants_created ON participants(created_at DESC);

-- ============================================================================
-- CAMPAIGN_PARTICIPANTS (Junction Table)
-- Links participants to campaigns with campaign-specific data
-- ============================================================================
SELECT create_enum_if_not_exists('participant_status', ARRAY[
  'discovered', 'queued', 'contacted', 'responded', 'scheduled',
  'completed', 'no_response', 'declined', 'disqualified'
]);

CREATE TABLE IF NOT EXISTS campaign_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,

  -- Status tracking
  status participant_status DEFAULT 'discovered',
  status_updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Outreach tracking
  outreach_attempts INTEGER DEFAULT 0,
  last_outreach_at TIMESTAMPTZ,
  next_outreach_at TIMESTAMPTZ,
  outreach_channel TEXT, -- email, call, linkedin
  contacted_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,

  -- AI-generated messaging
  suggested_message TEXT,
  suggested_incentive_amount DECIMAL(10, 2),
  suggested_incentive_reason TEXT,

  -- Actual incentive
  incentive_sent BOOLEAN DEFAULT FALSE,
  incentive_amount DECIMAL(10, 2),
  incentive_type TEXT,
  incentive_sent_at TIMESTAMPTZ,
  incentive_reference TEXT, -- Tremendous order ID, etc.

  -- Campaign-specific notes
  notes TEXT,
  qualification_notes TEXT,

  -- Fit score (AI-calculated)
  fit_score INTEGER, -- 0-100
  fit_reasoning TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(campaign_id, participant_id)
);

CREATE INDEX IF NOT EXISTS idx_cp_campaign ON campaign_participants(campaign_id);
CREATE INDEX IF NOT EXISTS idx_cp_participant ON campaign_participants(participant_id);
CREATE INDEX IF NOT EXISTS idx_cp_status ON campaign_participants(status);
CREATE INDEX IF NOT EXISTS idx_cp_next_outreach ON campaign_participants(next_outreach_at);

-- ============================================================================
-- OUTREACH_LOGS TABLE
-- Detailed log of all outreach attempts
-- ============================================================================
SELECT create_enum_if_not_exists('outreach_channel', ARRAY['email', 'call', 'linkedin', 'sms']);
SELECT create_enum_if_not_exists('outreach_outcome', ARRAY['sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'failed', 'answered', 'voicemail', 'no_answer']);

CREATE TABLE IF NOT EXISTS outreach_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_participant_id UUID NOT NULL REFERENCES campaign_participants(id) ON DELETE CASCADE,

  -- Outreach details
  channel outreach_channel NOT NULL,
  sequence_step INTEGER DEFAULT 1,

  -- Content
  subject TEXT,
  message_body TEXT,
  call_script TEXT,

  -- Outcome tracking
  outcome outreach_outcome,
  outcome_details TEXT,

  -- For calls (Bland AI)
  call_duration_seconds INTEGER,
  call_recording_url TEXT,
  call_transcript TEXT,
  call_summary TEXT,

  -- For emails
  email_opened_at TIMESTAMPTZ,
  email_clicked_at TIMESTAMPTZ,
  email_replied_at TIMESTAMPTZ,

  -- External references
  external_id TEXT, -- Resend message ID, Bland call ID, etc.

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outreach_cp ON outreach_logs(campaign_participant_id);
CREATE INDEX IF NOT EXISTS idx_outreach_channel ON outreach_logs(channel);
CREATE INDEX IF NOT EXISTS idx_outreach_created ON outreach_logs(created_at DESC);

-- ============================================================================
-- SESSIONS TABLE
-- Research sessions with participants
-- ============================================================================
SELECT create_enum_if_not_exists('session_type', ARRAY['interview', 'survey', 'usability_test', 'focus_group', 'diary_study']);
SELECT create_enum_if_not_exists('session_status', ARRAY['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show']);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_participant_id UUID NOT NULL REFERENCES campaign_participants(id) ON DELETE CASCADE,

  -- Session details
  type session_type NOT NULL,
  status session_status DEFAULT 'scheduled',

  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,

  -- Meeting details
  meeting_link TEXT,
  meeting_platform TEXT, -- zoom, google_meet, teams

  -- Facilitator (UUID of user who conducted the session, no FK for flexibility)
  facilitator_id UUID,

  -- Notes during session
  live_notes TEXT,

  -- Post-session
  summary TEXT,
  key_insights TEXT[],
  sentiment_score INTEGER, -- -100 to 100

  -- AI analysis
  ai_analysis JSONB DEFAULT '{}',
  themes_extracted TEXT[],
  quotes_extracted JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_cp ON sessions(campaign_participant_id);
CREATE INDEX IF NOT EXISTS idx_sessions_type ON sessions(type);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled ON sessions(scheduled_at);

-- ============================================================================
-- ARTIFACTS TABLE
-- All research data (recordings, transcripts, files, etc.)
-- ============================================================================
SELECT create_enum_if_not_exists('artifact_type', ARRAY['video', 'audio', 'screen_recording', 'transcript', 'document', 'survey_response', 'image', 'chat_log']);
SELECT create_enum_if_not_exists('processing_status', ARRAY['pending', 'processing', 'completed', 'failed']);

CREATE TABLE IF NOT EXISTS artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  campaign_participant_id UUID REFERENCES campaign_participants(id) ON DELETE SET NULL,

  -- At least one of session_id or campaign_participant_id should be set
  -- This allows artifacts to be linked to sessions or directly to participants

  -- File info
  type artifact_type NOT NULL,
  name TEXT NOT NULL,
  file_url TEXT,
  file_size_bytes BIGINT,
  mime_type TEXT,
  duration_seconds INTEGER, -- For audio/video

  -- Processing
  processing_status processing_status DEFAULT 'pending',
  processing_error TEXT,

  -- Transcription (for audio/video)
  transcript TEXT,
  transcript_segments JSONB DEFAULT '[]', -- [{start, end, text, speaker}]

  -- AI analysis
  ai_summary TEXT,
  key_moments JSONB DEFAULT '[]', -- [{timestamp, type, description, importance}]
  sentiment_timeline JSONB DEFAULT '[]', -- [{timestamp, score, text}]
  themes JSONB DEFAULT '[]',

  -- For survey responses
  survey_data JSONB DEFAULT '{}',

  -- Metadata
  source TEXT, -- upload, zoom, loom, typeform, etc.
  source_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_artifacts_session ON artifacts(session_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_cp ON artifacts(campaign_participant_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_type ON artifacts(type);
CREATE INDEX IF NOT EXISTS idx_artifacts_processing ON artifacts(processing_status);

-- ============================================================================
-- REPORTS TABLE
-- Generated research reports
-- ============================================================================
SELECT create_enum_if_not_exists('report_type', ARRAY['executive_summary', 'detailed_findings', 'thematic_analysis', 'quantitative_summary', 'highlight_reel', 'presentation']);
SELECT create_enum_if_not_exists('report_status', ARRAY['draft', 'generating', 'ready', 'shared']);

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,

  -- Report details
  type report_type NOT NULL,
  name TEXT NOT NULL,
  status report_status DEFAULT 'draft',

  -- Content
  content JSONB DEFAULT '{}', -- Structured report content
  content_html TEXT, -- Rendered HTML for display

  -- AI generation
  generation_prompt TEXT,
  generated_at TIMESTAMPTZ,

  -- Sharing
  share_token TEXT UNIQUE,
  share_password_hash TEXT,
  share_expires_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_campaign ON reports(campaign_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_share ON reports(share_token);

-- ============================================================================
-- TEMPLATES TABLE
-- Reusable templates for emails, call scripts, reports
-- ============================================================================
SELECT create_enum_if_not_exists('template_type', ARRAY['email', 'call_script', 'report', 'outreach_sequence']);

CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type template_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,

  -- Content
  subject TEXT, -- For emails
  body TEXT NOT NULL,

  -- Variables available (for AI personalization)
  variables JSONB DEFAULT '[]', -- [{name, description, example}]

  -- Metadata
  is_default BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(type);

-- ============================================================================
-- COST_TRACKING TABLE
-- Track costs for analytics and estimation
-- ============================================================================
SELECT create_enum_if_not_exists('cost_category', ARRAY['discovery', 'outreach_email', 'outreach_call', 'incentive', 'transcription', 'ai_analysis', 'storage', 'other']);

CREATE TABLE IF NOT EXISTS cost_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,

  category cost_category NOT NULL,
  description TEXT,
  amount DECIMAL(10, 4) NOT NULL,
  currency TEXT DEFAULT 'USD',

  -- External reference
  external_service TEXT, -- nyne, bland, resend, tremendous, openai, etc.
  external_reference TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_costs_campaign ON cost_tracking(campaign_id);
CREATE INDEX IF NOT EXISTS idx_costs_category ON cost_tracking(category);
CREATE INDEX IF NOT EXISTS idx_costs_created ON cost_tracking(created_at DESC);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
-- For now, simple RLS - all authenticated users can access all data
-- (since it's a 2-person team)

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_tracking ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Authenticated users can read clients" ON clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert clients" ON clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update clients" ON clients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete clients" ON clients FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read campaigns" ON campaigns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert campaigns" ON campaigns FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update campaigns" ON campaigns FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete campaigns" ON campaigns FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read participants" ON participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert participants" ON participants FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update participants" ON participants FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete participants" ON participants FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read campaign_participants" ON campaign_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert campaign_participants" ON campaign_participants FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update campaign_participants" ON campaign_participants FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete campaign_participants" ON campaign_participants FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read outreach_logs" ON outreach_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert outreach_logs" ON outreach_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can read sessions" ON sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert sessions" ON sessions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update sessions" ON sessions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete sessions" ON sessions FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read artifacts" ON artifacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert artifacts" ON artifacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update artifacts" ON artifacts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete artifacts" ON artifacts FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read reports" ON reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert reports" ON reports FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update reports" ON reports FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete reports" ON reports FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read templates" ON templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert templates" ON templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update templates" ON templates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete templates" ON templates FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read cost_tracking" ON cost_tracking FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert cost_tracking" ON cost_tracking FOR INSERT TO authenticated WITH CHECK (true);

-- Public access for shared reports (via share_token)
CREATE POLICY "Public can read shared reports" ON reports FOR SELECT TO anon
  USING (share_token IS NOT NULL AND status = 'shared' AND (share_expires_at IS NULL OR share_expires_at > NOW()));

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['clients', 'campaigns', 'participants', 'campaign_participants', 'sessions', 'artifacts', 'reports', 'templates'])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON %s', t, t);
    EXECUTE format('CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
  END LOOP;
END;
$$;

-- Function to update participant stats when sessions change
CREATE OR REPLACE FUNCTION update_participant_session_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE participants p
    SET
      total_sessions = (
        SELECT COUNT(*) FROM sessions s
        JOIN campaign_participants cp ON s.campaign_participant_id = cp.id
        WHERE cp.participant_id = (
          SELECT participant_id FROM campaign_participants WHERE id = NEW.campaign_participant_id
        )
        AND s.status = 'completed'
      ),
      last_session_at = (
        SELECT MAX(ended_at) FROM sessions s
        JOIN campaign_participants cp ON s.campaign_participant_id = cp.id
        WHERE cp.participant_id = (
          SELECT participant_id FROM campaign_participants WHERE id = NEW.campaign_participant_id
        )
        AND s.status = 'completed'
      )
    WHERE p.id = (SELECT participant_id FROM campaign_participants WHERE id = NEW.campaign_participant_id);
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_participant_stats_on_session
AFTER INSERT OR UPDATE ON sessions
FOR EACH ROW EXECUTE FUNCTION update_participant_session_stats();

-- Function to update campaign budget spent
CREATE OR REPLACE FUNCTION update_campaign_budget_spent()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.campaign_id IS NOT NULL THEN
    UPDATE campaigns
    SET budget_spent = (
      SELECT COALESCE(SUM(amount), 0)
      FROM cost_tracking
      WHERE campaign_id = NEW.campaign_id
    )
    WHERE id = NEW.campaign_id;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_budget_on_cost
AFTER INSERT ON cost_tracking
FOR EACH ROW EXECUTE FUNCTION update_campaign_budget_spent();

-- ============================================================================
-- RECORD MIGRATION
-- ============================================================================
-- Add unique constraint on version if it doesn't exist (for ON CONFLICT to work)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = '_migrations_version_unique'
  ) THEN
    ALTER TABLE _migrations ADD CONSTRAINT _migrations_version_unique UNIQUE (version);
  END IF;
EXCEPTION WHEN duplicate_table THEN
  -- Constraint already exists, ignore
END;
$$;

INSERT INTO _migrations (version, name)
VALUES (4, 'research_platform_schema')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- SEED DEFAULT TEMPLATES
-- ============================================================================
-- Add unique constraint on (type, name) for templates if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'templates_type_name_unique'
  ) THEN
    ALTER TABLE templates ADD CONSTRAINT templates_type_name_unique UNIQUE (type, name);
  END IF;
EXCEPTION WHEN duplicate_table THEN
  -- Constraint already exists, ignore
END;
$$;

INSERT INTO templates (type, name, description, subject, body, variables, is_default) VALUES
(
  'email',
  'Initial Outreach - Standard',
  'Standard first contact email for research participants',
  'Quick feedback request from {{company_name}}',
  E'Hi {{first_name}},\n\nI''m reaching out on behalf of {{client_name}} who''s looking to learn from {{job_title}}s like yourself about {{research_topic}}.\n\nWould you have 20-30 minutes for a quick chat? As a thank you, we''re offering {{incentive_amount}} {{incentive_type}}.\n\nBest,\n{{sender_name}}',
  '[{"name": "first_name", "description": "Participant first name"}, {"name": "client_name", "description": "Client company name"}, {"name": "job_title", "description": "Participant job title"}, {"name": "research_topic", "description": "What we want to learn about"}, {"name": "incentive_amount", "description": "Gift card amount"}, {"name": "incentive_type", "description": "Type of incentive"}, {"name": "sender_name", "description": "Your name"}]',
  true
),
(
  'email',
  'Follow-up #1',
  'First follow-up for non-responders',
  'Following up: {{research_topic}} research',
  E'Hi {{first_name}},\n\nJust wanted to follow up on my previous email. We''re still looking for {{job_title}}s to share their experience with {{research_topic}}.\n\nIt would be a 20-30 minute conversation, and we''d compensate you {{incentive_amount}} for your time.\n\nWould any time this week or next work for you?\n\nThanks,\n{{sender_name}}',
  '[{"name": "first_name", "description": "Participant first name"}, {"name": "job_title", "description": "Participant job title"}, {"name": "research_topic", "description": "Research topic"}, {"name": "incentive_amount", "description": "Incentive amount"}, {"name": "sender_name", "description": "Your name"}]',
  true
),
(
  'call_script',
  'Quick Pulse Call',
  'Script for brief feedback calls',
  NULL,
  E'Hi, is this {{first_name}}?\n\nGreat! My name is {{sender_name}}, I''m calling on behalf of {{client_name}}. We''re doing some quick research on {{research_topic}} and I was wondering if you have about 5 minutes to share your thoughts?\n\n[If yes, proceed with questions]\n[If no, ask for a better time]\n\nThank you so much for your time! As a thank you, we''ll send you {{incentive_amount}}.',
  '[{"name": "first_name", "description": "Participant first name"}, {"name": "sender_name", "description": "Your name"}, {"name": "client_name", "description": "Client name"}, {"name": "research_topic", "description": "Topic"}, {"name": "incentive_amount", "description": "Incentive"}]',
  true
)
ON CONFLICT (type, name) DO NOTHING;

-- ============================================================================
-- CLEANUP
-- ============================================================================
-- Drop the helper function as it's no longer needed
DROP FUNCTION IF EXISTS create_enum_if_not_exists(TEXT, TEXT[]);

-- ============================================================================
-- Done! Research platform schema is ready.
-- ============================================================================
