-- ============================================================================
-- Seed Initial Clients
-- Run this AFTER 004_research_platform.sql
-- ============================================================================

INSERT INTO clients (name, industry, website, notes) VALUES
(
  'Magic Hour AI',
  'Generative AI / Creative Tools',
  'https://magichour.ai',
  'All-in-one virtual studio for creating, editing, and enhancing videos and images with cutting-edge generative AI. Contact: support@magichour.ai'
),
(
  'Rilo',
  'Financial Technology',
  'https://getrilo.io',
  'Finance management platform for freelancers and independent workers.'
),
(
  'SigNoz',
  'Observability / APM',
  'https://signoz.io',
  'Open-source observability tool powered by OpenTelemetry. APM, logs, traces, metrics, exceptions, and alerts in a single tool. Twitter: @SigNozHQ'
),
(
  'FurtherAI',
  'InsurTech',
  'https://furtherai.com',
  'AI-powered platform automating document processing and workflows for commercial insurance underwriting, claims, and operations. Raised $25M Series A led by a]6z.'
)
ON CONFLICT DO NOTHING;
