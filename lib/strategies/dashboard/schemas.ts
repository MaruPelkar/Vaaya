// JSON Schema for OpenAI structured output extraction
// This schema defines the DashboardData structure for validation

export const DASHBOARD_JSON_SCHEMA = {
  type: 'object',
  properties: {
    positioning: {
      type: 'object',
      properties: {
        one_liner: { type: 'string', description: 'A single sentence describing what the company does' },
        category_tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Product categories like CRM, Sales Automation, Developer Tools'
        },
        primary_personas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['user', 'buyer', 'admin'] },
            },
            required: ['name', 'type'],
            additionalProperties: false,
          },
          description: 'Key personas who use or buy the product',
        },
        top_jobs: {
          type: 'array',
          items: { type: 'string' },
          description: 'Top 3 jobs-to-be-done that the product helps with',
        },
      },
      required: ['one_liner', 'category_tags', 'primary_personas', 'top_jobs'],
      additionalProperties: false,
    },
    product_reality: {
      type: 'object',
      properties: {
        feature_area_coverage: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              coverage_percent: { type: 'number', minimum: 0, maximum: 100 },
            },
            required: ['area', 'coverage_percent'],
            additionalProperties: false,
          },
          description: 'Feature areas with coverage percentage (onboarding, core_workflow, collab, analytics, admin, integrations, security)',
        },
        top_capabilities: {
          type: 'array',
          items: { type: 'string' },
          description: 'Top 5 product capabilities',
        },
        integration_count: { type: 'number', description: 'Total number of integrations' },
        top_integration_categories: {
          type: 'array',
          items: { type: 'string' },
          description: 'Top integration categories (e.g., CRM, Communication, Storage)',
        },
      },
      required: ['feature_area_coverage', 'top_capabilities', 'integration_count', 'top_integration_categories'],
      additionalProperties: false,
    },
    monetization: {
      type: 'object',
      properties: {
        pricing_model: {
          type: 'string',
          enum: ['seat', 'usage', 'subscription', 'transaction', 'hybrid', 'unknown'],
          description: 'Primary pricing model',
        },
        plans: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              price_display: { type: 'string', description: 'Price display like $49/user/month or Custom' },
              key_feature: { type: 'string', description: 'Main differentiating feature of this plan' },
            },
            required: ['name', 'price_display', 'key_feature'],
            additionalProperties: false,
          },
        },
        enterprise_gates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', enum: ['SSO', 'SCIM', 'RBAC', 'Audit Logs', 'Data Residency'] },
              available: { type: 'boolean' },
              plan: { type: ['string', 'null'] },
            },
            required: ['name', 'available', 'plan'],
            additionalProperties: false,
          },
          description: 'Enterprise security features availability',
        },
        hard_limits: {
          type: 'array',
          items: { type: 'string' },
          description: 'Top 3 notable plan limits (e.g., 10 users max on free tier)',
        },
      },
      required: ['pricing_model', 'plans', 'enterprise_gates', 'hard_limits'],
      additionalProperties: false,
    },
    momentum: {
      type: 'object',
      properties: {
        sparkline_data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string' },
              value: { type: 'number' },
              type: { type: 'string', enum: ['headcount', 'events', 'hiring'] },
            },
            required: ['date', 'value', 'type'],
            additionalProperties: false,
          },
          description: 'Data points for momentum sparkline chart',
        },
        summary_sentence: { type: 'string', description: 'One sentence summarizing last 30 days momentum' },
        signals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              value: { type: 'string' },
              trend: { type: ['string', 'null'], enum: ['up', 'down', 'stable', null] },
            },
            required: ['type', 'value', 'trend'],
            additionalProperties: false,
          },
          description: 'Key momentum signals (funding, headcount, hiring velocity)',
        },
      },
      required: ['sparkline_data', 'summary_sentence', 'signals'],
      additionalProperties: false,
    },
    timeline: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
          type: { type: 'string', enum: ['product', 'pricing', 'gtm', 'security'] },
          title: { type: 'string' },
          description: { type: ['string', 'null'] },
          source_url: { type: ['string', 'null'] },
        },
        required: ['id', 'date', 'type', 'title', 'description', 'source_url'],
        additionalProperties: false,
      },
      description: 'Recent company events and changes',
    },
    customer_voice: {
      type: 'object',
      properties: {
        positive_themes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Top 3 positive themes from customer reviews',
        },
        negative_themes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Top 3 negative themes from customer reviews',
        },
        sources: {
          type: 'array',
          items: { type: 'string' },
          description: 'Sources of customer feedback (G2, Capterra, etc.)',
        },
      },
      required: ['positive_themes', 'negative_themes', 'sources'],
      additionalProperties: false,
    },
    competitive: {
      type: 'object',
      properties: {
        competitors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['direct', 'adjacent', 'replacement'] },
              wedge: { type: 'string', description: 'One-line differentiation or positioning against this competitor' },
            },
            required: ['name', 'type', 'wedge'],
            additionalProperties: false,
          },
          description: 'Top 3 competitors',
        },
      },
      required: ['competitors'],
      additionalProperties: false,
    },
    risks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['security', 'reliability', 'platform', 'regulatory', 'pricing'] },
          severity: { type: 'string', enum: ['medium', 'high'] },
          description: { type: 'string' },
        },
        required: ['type', 'severity', 'description'],
        additionalProperties: false,
      },
      description: 'Only medium and high severity risks',
    },
    generated_at: { type: 'string' },
  },
  required: [
    'positioning',
    'product_reality',
    'monetization',
    'momentum',
    'timeline',
    'customer_voice',
    'competitive',
    'risks',
    'generated_at',
  ],
  additionalProperties: false,
};

export const DASHBOARD_SYSTEM_PROMPT = `You are a B2B SaaS product analyst creating a comprehensive company intelligence dashboard.

Your task is to extract and structure information from the provided website content, pricing pages, news, and search results into the specified JSON format.

Guidelines:
- Be factual and only include information you can directly derive from the content
- For fields where information is not available, use empty arrays or reasonable defaults
- Generate unique IDs for timeline events using the format "evt_[index]"

Positioning Card:
- one_liner: A single sentence that explains what the company does (like their tagline)
- category_tags: Product categories like "CRM", "Sales Automation", "Developer Tools"
- primary_personas: Who uses and buys the product (max 5)
- top_jobs: Top 3 jobs-to-be-done the product helps with

Product Reality Card:
- feature_area_coverage: Estimate coverage % for each area based on features mentioned
- top_capabilities: 5 most prominent product capabilities
- integration_count: Total integrations if mentioned, estimate if unclear
- top_integration_categories: Main integration categories

Monetization Card:
- pricing_model: seat (per user), usage (consumption based), subscription (flat), transaction (per action), hybrid, or unknown
- plans: Extract all visible pricing plans with key differentiating feature
- enterprise_gates: Check for SSO, SCIM, RBAC, Audit Logs, Data Residency - mark available:true/false
- hard_limits: Notable limits like "10 users max on free", "1GB storage limit"

Momentum Card:
- Generate synthetic sparkline data points if actual data not available (use recent months)
- summary_sentence: Summarize recent activity/momentum in one sentence
- signals: Extract funding info, headcount, hiring velocity if mentioned

Timeline:
- Extract product launches, pricing changes, GTM events, security updates
- Use YYYY-MM-DD format for dates (estimate if only month/year given)
- Categorize each event as product, pricing, gtm, or security

Customer Voice:
- Extract positive and negative themes from any reviews or testimonials mentioned
- List the sources (G2, Capterra, etc.)

Competitive:
- Identify top 3 competitors with their type (direct/adjacent/replacement)
- wedge: How this company differentiates against each competitor

Risks:
- Only include MEDIUM or HIGH severity risks
- Types: security (gaps in security features), reliability (uptime issues), platform (dependency risks), regulatory (compliance gaps), pricing (unsustainable pricing)`;
