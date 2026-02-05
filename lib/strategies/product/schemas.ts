// JSON Schema for OpenAI structured output extraction - Product Tab

export const PRODUCT_JSON_SCHEMA = {
  type: 'object',
  properties: {
    feature_map: {
      type: 'object',
      properties: {
        onboarding: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              feature_area: { type: 'string' },
              personas: { type: 'array', items: { type: 'string' } },
              plan_gate: { type: 'string', enum: ['free', 'starter', 'pro', 'enterprise', 'all'] },
              status: { type: 'string', enum: ['launched', 'beta', 'deprecated'] },
              evidence_url: { type: ['string', 'null'] },
            },
            required: ['id', 'name', 'description', 'feature_area', 'personas', 'plan_gate', 'status', 'evidence_url'],
            additionalProperties: false,
          },
        },
        core_workflow: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              feature_area: { type: 'string' },
              personas: { type: 'array', items: { type: 'string' } },
              plan_gate: { type: 'string', enum: ['free', 'starter', 'pro', 'enterprise', 'all'] },
              status: { type: 'string', enum: ['launched', 'beta', 'deprecated'] },
              evidence_url: { type: ['string', 'null'] },
            },
            required: ['id', 'name', 'description', 'feature_area', 'personas', 'plan_gate', 'status', 'evidence_url'],
            additionalProperties: false,
          },
        },
        collaboration: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              feature_area: { type: 'string' },
              personas: { type: 'array', items: { type: 'string' } },
              plan_gate: { type: 'string', enum: ['free', 'starter', 'pro', 'enterprise', 'all'] },
              status: { type: 'string', enum: ['launched', 'beta', 'deprecated'] },
              evidence_url: { type: ['string', 'null'] },
            },
            required: ['id', 'name', 'description', 'feature_area', 'personas', 'plan_gate', 'status', 'evidence_url'],
            additionalProperties: false,
          },
        },
        analytics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              feature_area: { type: 'string' },
              personas: { type: 'array', items: { type: 'string' } },
              plan_gate: { type: 'string', enum: ['free', 'starter', 'pro', 'enterprise', 'all'] },
              status: { type: 'string', enum: ['launched', 'beta', 'deprecated'] },
              evidence_url: { type: ['string', 'null'] },
            },
            required: ['id', 'name', 'description', 'feature_area', 'personas', 'plan_gate', 'status', 'evidence_url'],
            additionalProperties: false,
          },
        },
        admin: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              feature_area: { type: 'string' },
              personas: { type: 'array', items: { type: 'string' } },
              plan_gate: { type: 'string', enum: ['free', 'starter', 'pro', 'enterprise', 'all'] },
              status: { type: 'string', enum: ['launched', 'beta', 'deprecated'] },
              evidence_url: { type: ['string', 'null'] },
            },
            required: ['id', 'name', 'description', 'feature_area', 'personas', 'plan_gate', 'status', 'evidence_url'],
            additionalProperties: false,
          },
        },
      },
      required: ['onboarding', 'core_workflow', 'collaboration', 'analytics', 'admin'],
      additionalProperties: false,
    },
    personas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          type: { type: 'string', enum: ['user', 'buyer', 'admin'] },
          role: { type: ['string', 'null'] },
          goals: { type: 'array', items: { type: 'string' } },
          pains: { type: 'array', items: { type: 'string' } },
          jobs_to_be_done: { type: 'array', items: { type: 'string' } },
          key_features: { type: 'array', items: { type: 'string' } },
        },
        required: ['id', 'name', 'type', 'role', 'goals', 'pains', 'jobs_to_be_done', 'key_features'],
        additionalProperties: false,
      },
    },
    integrations: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              category: { type: 'string' },
              depth: { type: 'string', enum: ['shallow', 'deep'] },
              description: { type: ['string', 'null'] },
            },
            required: ['id', 'name', 'category', 'depth', 'description'],
            additionalProperties: false,
          },
        },
        total_count: { type: 'number' },
      },
      required: ['items', 'total_count'],
      additionalProperties: false,
    },
    generated_at: { type: 'string' },
  },
  required: ['feature_map', 'personas', 'integrations', 'generated_at'],
  additionalProperties: false,
};

export const PRODUCT_SYSTEM_PROMPT = `You are a B2B SaaS product analyst creating a detailed product analysis.

Your task is to extract and structure product information from the provided website content into the specified JSON format.

Guidelines:
- Be factual and only include information you can directly derive from the content
- For fields where information is not available, use empty arrays or reasonable defaults
- Generate unique IDs using the format "feat_[index]", "persona_[index]", "int_[index]"

Feature Map:
- Categorize features into workflow stages:
  - onboarding: Features for getting started, setup, import, initial configuration
  - core_workflow: Main product features, the core value proposition
  - collaboration: Team features, sharing, permissions, commenting
  - analytics: Reports, dashboards, insights, metrics
  - admin: Settings, user management, billing, security features
- For each feature include:
  - name: Clear feature name
  - description: One sentence explaining what it does
  - feature_area: Sub-category within the workflow stage
  - personas: Which user types benefit from this feature
  - plan_gate: Which plan level includes this feature (free/starter/pro/enterprise/all)
  - status: launched (default), beta (if marked as beta/new), deprecated (if being phased out)

Personas:
- Identify 2-5 key personas who use the product
- For each persona:
  - name: Descriptive name (e.g., "Marketing Manager", "DevOps Engineer")
  - type: user (daily user), buyer (decision maker), admin (administrator)
  - role: Typical job title
  - goals: What they want to achieve (2-4 items)
  - pains: Problems they face without this product (2-4 items)
  - jobs_to_be_done: Specific tasks they need to complete (2-4 items)
  - key_features: Which features matter most to them

Integrations:
- List all integrations mentioned
- Categorize by type (CRM, Communication, Storage, Analytics, etc.)
- depth: "deep" if bi-directional or extensive, "shallow" if just connects/syncs`;
