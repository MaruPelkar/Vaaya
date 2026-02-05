// JSON Schema for OpenAI structured output extraction - Business Tab

export const BUSINESS_JSON_SCHEMA = {
  type: 'object',
  properties: {
    gtm: {
      type: 'object',
      properties: {
        motion: { type: 'string', enum: ['plg', 'sales_led', 'hybrid'] },
        primary_buyer_roles: { type: 'array', items: { type: 'string' } },
        acquisition_channels: { type: 'array', items: { type: 'string' } },
        implementation_model: { type: 'string', enum: ['self_serve', 'assisted', 'ps_heavy'] },
        expansion_levers: { type: 'array', items: { type: 'string' } },
      },
      required: ['motion', 'primary_buyer_roles', 'acquisition_channels', 'implementation_model', 'expansion_levers'],
      additionalProperties: false,
    },
    pricing: {
      type: 'object',
      properties: {
        plans: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              price_display: { type: 'string' },
              billing_terms: { type: 'array', items: { type: 'string' } },
              limits: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    value: { type: 'string' },
                  },
                  required: ['name', 'value'],
                  additionalProperties: false,
                },
              },
              key_features: { type: 'array', items: { type: 'string' } },
              enterprise_gates: { type: 'array', items: { type: 'string' } },
            },
            required: ['name', 'price_display', 'billing_terms', 'limits', 'key_features', 'enterprise_gates'],
            additionalProperties: false,
          },
        },
        pricing_history: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string' },
              change_type: { type: 'string', enum: ['new_plan', 'price_change', 'feature_change', 'limit_change'] },
              description: { type: 'string' },
            },
            required: ['date', 'change_type', 'description'],
            additionalProperties: false,
          },
        },
      },
      required: ['plans', 'pricing_history'],
      additionalProperties: false,
    },
    competition: {
      type: 'object',
      properties: {
        competitors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              domain: { type: ['string', 'null'] },
              type: { type: 'string', enum: ['direct', 'adjacent', 'replacement'] },
              overlap_jobs: { type: 'array', items: { type: 'string' } },
              win_reasons: { type: 'array', items: { type: 'string' } },
              lose_reasons: { type: 'array', items: { type: 'string' } },
            },
            required: ['name', 'domain', 'type', 'overlap_jobs', 'win_reasons', 'lose_reasons'],
            additionalProperties: false,
          },
        },
        feature_parity_summary: { type: 'string' },
        differentiation_durability: { type: 'string', enum: ['easy_to_copy', 'moderate', 'hard_to_copy'] },
      },
      required: ['competitors', 'feature_parity_summary', 'differentiation_durability'],
      additionalProperties: false,
    },
    signals: {
      type: 'object',
      properties: {
        funding: {
          type: ['object', 'null'],
          properties: {
            stage: { type: 'string' },
            total_raised: { type: 'string' },
            last_round_date: { type: ['string', 'null'] },
            investors: { type: 'array', items: { type: 'string' } },
          },
          required: ['stage', 'total_raised', 'last_round_date', 'investors'],
          additionalProperties: false,
        },
        hiring: {
          type: ['object', 'null'],
          properties: {
            total_open_roles: { type: 'number' },
            velocity: { type: 'string', enum: ['accelerating', 'stable', 'slowing'] },
            focus_areas: { type: 'array', items: { type: 'string' } },
          },
          required: ['total_open_roles', 'velocity', 'focus_areas'],
          additionalProperties: false,
        },
        web_footprint: {
          type: ['object', 'null'],
          properties: {
            traffic_estimate: { type: 'string' },
            trend: { type: 'string', enum: ['up', 'stable', 'down'] },
          },
          required: ['traffic_estimate', 'trend'],
          additionalProperties: false,
        },
        reliability: {
          type: ['object', 'null'],
          properties: {
            incidents_30d: { type: 'number' },
            uptime_percent: { type: ['number', 'null'] },
          },
          required: ['incidents_30d', 'uptime_percent'],
          additionalProperties: false,
        },
      },
      required: ['funding', 'hiring', 'web_footprint', 'reliability'],
      additionalProperties: false,
    },
    generated_at: { type: 'string' },
  },
  required: ['gtm', 'pricing', 'competition', 'signals', 'generated_at'],
  additionalProperties: false,
};

export const BUSINESS_SYSTEM_PROMPT = `You are a B2B SaaS business analyst creating strategic and competitive intelligence.

Your task is to extract and structure business information from the provided website content into the specified JSON format.

Guidelines:
- Be factual and only include information you can directly derive from the content
- For fields where information is not available, use empty arrays or null for optional objects
- Make reasonable inferences about GTM motion based on pricing and product positioning

GTM Profile:
- motion: 
  - "plg" = Product-Led Growth (free tier, self-serve signup, product drives adoption)
  - "sales_led" = Sales-Led (demo required, contact sales, enterprise focus)
  - "hybrid" = Mix of both approaches
- primary_buyer_roles: Job titles of typical buyers (e.g., "VP Engineering", "CFO", "IT Director")
- acquisition_channels: How they acquire customers (content marketing, paid ads, partnerships, etc.)
- implementation_model:
  - "self_serve" = Users can set up and use without help
  - "assisted" = Some onboarding support provided
  - "ps_heavy" = Professional services required for implementation
- expansion_levers: How they grow within accounts (more seats, usage, features, new teams)

Pricing & Packaging:
- Extract ALL pricing plans visible on the pricing page
- For each plan:
  - name: Plan name
  - price_display: Exact price shown (e.g., "$49/user/month", "Custom pricing", "Free")
  - billing_terms: Monthly, annual, usage-based, etc.
  - limits: Notable restrictions (users, storage, API calls, etc.)
  - key_features: 3-5 most important features in this tier
  - enterprise_gates: Enterprise features in this plan (SSO, SCIM, etc.)
- pricing_history: Any mentioned price changes, new plans, or removed features (often found in blogs/changelogs)

Competition:
- Identify 3-5 competitors
- type:
  - "direct" = Same market, similar product
  - "adjacent" = Nearby market, partial overlap
  - "replacement" = Different approach to same problem
- overlap_jobs: What jobs/tasks both products help with
- win_reasons: Why customers choose this company over the competitor
- lose_reasons: Why customers might choose the competitor instead
- feature_parity_summary: Overall assessment of how features compare
- differentiation_durability: How hard is their advantage to copy

Signals:
- funding: If mentioned, extract stage (Seed, Series A, etc.), total raised, investors
- hiring: Extract from careers page - number of open roles, which teams are hiring
- web_footprint: Any traffic/growth indicators mentioned
- reliability: Any status page info, uptime claims, recent incidents`;
