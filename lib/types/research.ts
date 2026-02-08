// ============================================================================
// Research Platform Types
// ============================================================================

// Enums matching database types
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';

export type ParticipantStatus =
  | 'discovered'
  | 'queued'
  | 'contacted'
  | 'responded'
  | 'scheduled'
  | 'completed'
  | 'no_response'
  | 'declined'
  | 'disqualified';

export type OutreachChannel = 'email' | 'call' | 'linkedin' | 'sms';

export type OutreachOutcome =
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'replied'
  | 'bounced'
  | 'failed'
  | 'answered'
  | 'voicemail'
  | 'no_answer';

export type SessionType = 'interview' | 'survey' | 'usability_test' | 'focus_group' | 'diary_study';

export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export type ArtifactType =
  | 'video'
  | 'audio'
  | 'screen_recording'
  | 'transcript'
  | 'document'
  | 'survey_response'
  | 'image'
  | 'chat_log';

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type ReportType =
  | 'executive_summary'
  | 'detailed_findings'
  | 'thematic_analysis'
  | 'quantitative_summary'
  | 'highlight_reel'
  | 'presentation';

export type ReportStatus = 'draft' | 'generating' | 'ready' | 'shared';

export type TemplateType = 'email' | 'call_script' | 'report' | 'outreach_sequence';

export type CostCategory =
  | 'discovery'
  | 'outreach_email'
  | 'outreach_call'
  | 'incentive'
  | 'transcription'
  | 'ai_analysis'
  | 'storage'
  | 'other';

export type SeniorityLevel = 'IC' | 'Lead' | 'Manager' | 'Director' | 'VP' | 'C-Suite' | 'Founder';

export type Department =
  | 'Engineering'
  | 'Product'
  | 'Design'
  | 'Marketing'
  | 'Sales'
  | 'Customer Success'
  | 'Operations'
  | 'HR'
  | 'Finance'
  | 'Other';

// ============================================================================
// Core Entities
// ============================================================================

export interface Client {
  id: string;
  name: string;
  logo_url?: string;
  industry?: string;
  website?: string;
  contact_name?: string;
  contact_email?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Computed fields
  campaigns_count?: number;
  active_campaigns_count?: number;
}

export interface Campaign {
  id: string;
  client_id: string;
  name: string;
  description?: string;
  status: CampaignStatus;
  research_goals: string[];
  target_criteria: TargetCriteria;
  outreach_strategy: OutreachStrategy;
  budget_estimated: number;
  budget_spent: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  client?: Client;
  // Computed fields
  participants_count?: number;
  completed_sessions_count?: number;
}

export interface TargetCriteria {
  job_titles: string[];
  seniority_levels: SeniorityLevel[];
  departments: Department[];
  company_sizes: string[];
  industries: string[];
  locations: string[];
  products_used: string[];
  custom_criteria: CustomCriterion[];
}

export interface CustomCriterion {
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'in';
  value: string | string[];
}

export interface OutreachStrategy {
  mode: 'quick_pulse' | 'nurture' | 'high_touch' | 'custom';
  channels: OutreachChannel[];
  sequence_steps: SequenceStep[];
  auto_personalize: boolean;
}

export interface SequenceStep {
  step_number: number;
  channel: OutreachChannel;
  template_id?: string;
  wait_days: number;
  condition?: 'no_response' | 'opened' | 'clicked' | 'always';
  ai_generate: boolean;
}

export interface Participant {
  id: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  job_title?: string;
  seniority_level?: SeniorityLevel;
  department?: Department;
  company_name?: string;
  company_size?: string;
  company_industry?: string;
  company_website?: string;
  city?: string;
  country?: string;
  timezone?: string;
  source?: string;
  source_url?: string;
  total_sessions: number;
  last_contacted_at?: string;
  last_session_at?: string;
  preferred_contact_method?: string;
  preferred_incentive_type?: string;
  notes?: string;
  tags: string[];
  raw_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Computed fields
  campaigns_participated?: number;
}

export interface CampaignParticipant {
  id: string;
  campaign_id: string;
  participant_id: string;
  status: ParticipantStatus;
  status_updated_at: string;
  outreach_attempts: number;
  last_outreach_at?: string;
  next_outreach_at?: string;
  outreach_channel?: OutreachChannel;
  suggested_message?: string;
  suggested_incentive_amount?: number;
  suggested_incentive_reason?: string;
  incentive_amount?: number;
  incentive_type?: string;
  incentive_sent_at?: string;
  incentive_reference?: string;
  notes?: string;
  qualification_notes?: string;
  fit_score?: number;
  fit_reasoning?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  participant?: Participant;
  campaign?: Campaign;
}

export interface OutreachLog {
  id: string;
  campaign_participant_id: string;
  channel: OutreachChannel;
  sequence_step: number;
  subject?: string;
  message_body?: string;
  call_script?: string;
  outcome?: OutreachOutcome;
  outcome_details?: string;
  call_duration_seconds?: number;
  call_recording_url?: string;
  call_transcript?: string;
  call_summary?: string;
  email_opened_at?: string;
  email_clicked_at?: string;
  email_replied_at?: string;
  external_id?: string;
  created_at: string;
}

export interface Session {
  id: string;
  campaign_participant_id: string;
  type: SessionType;
  status: SessionStatus;
  scheduled_at?: string;
  started_at?: string;
  ended_at?: string;
  duration_minutes?: number;
  meeting_link?: string;
  meeting_platform?: string;
  facilitator_id?: string;
  live_notes?: string;
  summary?: string;
  key_insights: string[];
  sentiment_score?: number;
  ai_analysis: Record<string, unknown>;
  themes_extracted: string[];
  quotes_extracted: ExtractedQuote[];
  created_at: string;
  updated_at: string;
  // Joined fields
  campaign_participant?: CampaignParticipant;
  artifacts?: Artifact[];
}

export interface ExtractedQuote {
  text: string;
  timestamp?: string;
  speaker?: string;
  theme?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface Artifact {
  id: string;
  session_id?: string;
  campaign_participant_id?: string;
  type: ArtifactType;
  name: string;
  file_url?: string;
  file_size_bytes?: number;
  mime_type?: string;
  duration_seconds?: number;
  processing_status: ProcessingStatus;
  processing_error?: string;
  transcript?: string;
  transcript_segments: TranscriptSegment[];
  ai_summary?: string;
  key_moments: KeyMoment[];
  sentiment_timeline: SentimentPoint[];
  themes: string[];
  survey_data: Record<string, unknown>;
  source?: string;
  source_url?: string;
  created_at: string;
  updated_at: string;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

export interface KeyMoment {
  timestamp: number;
  type: 'frustration' | 'confusion' | 'delight' | 'insight' | 'feature_request' | 'pain_point';
  description: string;
  importance: 'low' | 'medium' | 'high';
}

export interface SentimentPoint {
  timestamp: number;
  score: number; // -100 to 100
  text?: string;
}

export interface Report {
  id: string;
  campaign_id: string;
  type: ReportType;
  name: string;
  status: ReportStatus;
  content: ReportContent;
  content_html?: string;
  generation_prompt?: string;
  generated_at?: string;
  share_token?: string;
  share_password_hash?: string;
  share_expires_at?: string;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface ReportContent {
  sections: ReportSection[];
  metadata: {
    participants_count: number;
    sessions_count: number;
    artifacts_count: number;
    date_range: { start: string; end: string };
  };
}

export interface ReportSection {
  title: string;
  type: 'text' | 'quotes' | 'chart' | 'video_clips' | 'table';
  content: unknown;
}

export interface Template {
  id: string;
  type: TemplateType;
  name: string;
  description?: string;
  subject?: string;
  body: string;
  variables: TemplateVariable[];
  is_default: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateVariable {
  name: string;
  description: string;
  example?: string;
}

export interface CostTracking {
  id: string;
  campaign_id?: string;
  category: CostCategory;
  description?: string;
  amount: number;
  currency: string;
  external_service?: string;
  external_reference?: string;
  created_at: string;
}

// ============================================================================
// API Types
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface CreateClientInput {
  name: string;
  logo_url?: string;
  industry?: string;
  website?: string;
  contact_name?: string;
  contact_email?: string;
  notes?: string;
}

export interface UpdateClientInput extends Partial<CreateClientInput> {}

export interface CreateCampaignInput {
  client_id: string;
  name: string;
  description?: string;
  research_goals?: string[];
  target_criteria?: Partial<TargetCriteria>;
  outreach_strategy?: Partial<OutreachStrategy>;
  budget_estimated?: number;
  start_date?: string;
  end_date?: string;
}

export interface UpdateCampaignInput extends Partial<CreateCampaignInput> {
  status?: CampaignStatus;
}

export interface CreateParticipantInput {
  email?: string;
  phone?: string;
  linkedin_url?: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  job_title?: string;
  seniority_level?: SeniorityLevel;
  department?: Department;
  company_name?: string;
  company_size?: string;
  company_industry?: string;
  company_website?: string;
  city?: string;
  country?: string;
  timezone?: string;
  source?: string;
  source_url?: string;
  notes?: string;
  tags?: string[];
  raw_data?: Record<string, unknown>;
}

export interface AddParticipantToCampaignInput {
  campaign_id: string;
  participant_id: string;
  fit_score?: number;
  fit_reasoning?: string;
  notes?: string;
}

export interface DiscoverySearchParams {
  job_titles?: string[];
  companies?: string[];
  locations?: string[];
  keywords?: string[];
  limit?: number;
}

export interface OutreachMessageParams {
  participant_id: string;
  campaign_id: string;
  channel: OutreachChannel;
  personalize: boolean;
}

export interface CostEstimate {
  discovery: number;
  outreach_email: number;
  outreach_call: number;
  incentives: number;
  transcription: number;
  ai_analysis: number;
  storage: number;
  total: number;
  buffer: number;
  grand_total: number;
}

// ============================================================================
// Dashboard Stats
// ============================================================================

export interface DashboardStats {
  active_campaigns: number;
  total_participants: number;
  completed_sessions: number;
  pending_outreach: number;
  this_week_sessions: number;
  response_rate: number;
  avg_session_duration: number;
  budget_utilized: number;
}

export interface CampaignStats {
  participants_total: number;
  participants_by_status: Record<ParticipantStatus, number>;
  sessions_completed: number;
  sessions_scheduled: number;
  outreach_sent: number;
  response_rate: number;
  avg_fit_score: number;
  budget_spent: number;
  budget_remaining: number;
}
