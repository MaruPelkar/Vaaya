// JSON Schema for OpenAI structured output extraction
// This schema defines the customer and persona extraction for the People tab

export const CUSTOMER_EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    customers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Customer company name' },
          domain: { type: ['string', 'null'], description: 'Website domain if found (e.g., acme.com)' },
          industry: { type: ['string', 'null'], description: 'Industry or vertical' },
          size: { type: ['string', 'null'], description: 'Company size estimate (startup, SMB, mid-market, enterprise)' },
          confidence: {
            type: 'string',
            enum: ['high', 'medium', 'low'],
            description: 'Confidence that this is actually a customer',
          },
          evidence: { type: 'string', description: 'Quote or text proving they are a customer' },
          source_url: { type: ['string', 'null'], description: 'URL where this customer was mentioned' },
        },
        required: ['name', 'domain', 'industry', 'size', 'confidence', 'evidence', 'source_url'],
        additionalProperties: false,
      },
      description: 'List of discovered customer companies',
    },
    target_personas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Job title to target (e.g., VP Engineering, DevOps Engineer)' },
          persona_type: {
            type: 'string',
            enum: ['user', 'buyer', 'evaluator'],
            description: 'Type of persona: user (daily user), buyer (decision maker), evaluator (involved in evaluation)',
          },
          rationale: { type: 'string', description: 'Why this persona would use or buy this product' },
        },
        required: ['title', 'persona_type', 'rationale'],
        additionalProperties: false,
      },
      description: 'Inferred target personas based on product type',
    },
  },
  required: ['customers', 'target_personas'],
  additionalProperties: false,
};

export const CUSTOMER_EXTRACTION_PROMPT = `You are a B2B research analyst identifying customer companies and target personas.

Your task is to analyze the provided website content (press releases, customer pages, case studies) and extract:
1. Companies that are CONFIRMED customers of the target company
2. Target personas who would use or buy this type of product

## Guidelines for CUSTOMERS:

Only include companies with clear evidence of being a customer:
- Testimonial or quote from the company
- Listed on a "customers" or "trusted by" page
- Case study or success story
- Press release about partnership/adoption
- Mentioned as using the product in an article

Do NOT include:
- Integration partners (companies they integrate WITH, not customers)
- Technology partners or investors
- Companies just mentioned for comparison
- Companies that are prospects or leads

Confidence levels:
- "high": Direct quote, case study, or explicit customer statement
- "medium": Logo on customers page, mentioned as user in article
- "low": Indirect mention, might be using the product

For each customer:
- Extract the company domain if visible (e.g., "acme.com")
- Estimate industry based on context
- Estimate size if mentioned (startup, SMB, mid-market, enterprise)
- Include the evidence text that proves they are a customer

## Guidelines for TARGET PERSONAS:

Based on the product type, infer who would:
1. USE the product daily (users)
2. BUY/authorize the product (buyers)
3. EVALUATE the product (evaluators)

Examples by product type:
- DevOps tool: users=DevOps Engineer, SRE; buyers=VP Engineering, CTO
- Sales tool: users=SDR, Account Executive; buyers=VP Sales, Revenue Ops
- Design tool: users=Product Designer, UX Designer; buyers=Head of Design, VP Product
- HR tool: users=HR Coordinator, Recruiter; buyers=VP HR, Chief People Officer
- Finance tool: users=Accountant, Financial Analyst; buyers=CFO, Controller

Include 3-5 personas total across the types.

## Important:
- Be precise and factual
- Only include what is clearly supported by the content
- Use empty arrays if no customers or personas can be identified
- Do not hallucinate or make up companies`;

export const PEOPLE_CONSOLIDATION_SCHEMA = {
  type: 'object',
  properties: {
    users: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Unique ID in format person_[index]' },
          name: { type: 'string' },
          company: { type: ['string', 'null'] },
          role: { type: ['string', 'null'] },
          type: { type: 'string', enum: ['user', 'buyer', 'evaluator'] },
          linkedin_url: { type: ['string', 'null'] },
          confidence_score: { type: 'number', minimum: 0, maximum: 1 },
          signals: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                source: { type: 'string' },
                text: { type: 'string' },
                url: { type: 'string' },
                date: { type: ['string', 'null'] },
              },
              required: ['source', 'text', 'url', 'date'],
              additionalProperties: false,
            },
          },
        },
        required: ['id', 'name', 'company', 'role', 'type', 'linkedin_url', 'confidence_score', 'signals'],
        additionalProperties: false,
      },
    },
    buyers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Unique ID in format person_[index]' },
          name: { type: 'string' },
          company: { type: ['string', 'null'] },
          role: { type: ['string', 'null'] },
          type: { type: 'string', enum: ['user', 'buyer', 'evaluator'] },
          linkedin_url: { type: ['string', 'null'] },
          confidence_score: { type: 'number', minimum: 0, maximum: 1 },
          signals: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                source: { type: 'string' },
                text: { type: 'string' },
                url: { type: 'string' },
                date: { type: ['string', 'null'] },
              },
              required: ['source', 'text', 'url', 'date'],
              additionalProperties: false,
            },
          },
        },
        required: ['id', 'name', 'company', 'role', 'type', 'linkedin_url', 'confidence_score', 'signals'],
        additionalProperties: false,
      },
    },
    companies_using: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          domain: { type: ['string', 'null'] },
          industry: { type: ['string', 'null'] },
          size: { type: ['string', 'null'] },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
        },
        required: ['name', 'domain', 'industry', 'size', 'confidence'],
        additionalProperties: false,
      },
    },
    generated_at: { type: 'string' },
  },
  required: ['users', 'buyers', 'companies_using', 'generated_at'],
  additionalProperties: false,
};

export const PEOPLE_CONSOLIDATION_PROMPT = `You are consolidating discovered customer companies and LinkedIn profiles into a structured format.

Your task is to:
1. Deduplicate and validate the customer company list
2. Format the people data with appropriate confidence scores
3. Categorize people as users (hands-on daily users) or buyers (decision makers)

## Confidence scores for PEOPLE:
- 0.9-1.0: LinkedIn profile confirmed, job title matches target persona exactly
- 0.7-0.8: Found via company search, title likely matches target persona
- 0.5-0.6: Inferred from company + general role, less certain match
- Below 0.5: Low confidence, may not be relevant

## For each person:
- Generate unique IDs in the format "person_[index]"
- Include the source signal that led to their discovery
- Use the signal to explain why they were identified

## People categorization:
- Users: Day-to-day product users (engineers, designers, analysts, coordinators)
- Buyers: Decision makers and budget holders (VPs, Directors, C-level, Heads of)

Be factual and only include people with actual LinkedIn URLs.`;
