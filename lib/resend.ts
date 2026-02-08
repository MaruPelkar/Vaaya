import { Resend } from 'resend';

// Initialize Resend client
const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn('RESEND_API_KEY is not set. Email features will be disabled.');
}

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface EmailParams {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
}

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Send an email via Resend
 */
export async function sendEmail(params: EmailParams): Promise<EmailResult> {
  if (!resend) {
    return { success: false, error: 'Resend client not initialized' };
  }

  if (!params.html && !params.text) {
    return { success: false, error: 'Either html or text body is required' };
  }

  try {
    // Build the email options - Resend requires either html or text
    const emailOptions: Parameters<typeof resend.emails.send>[0] = {
      from: params.from || process.env.RESEND_FROM_EMAIL || 'research@vaaya.app',
      to: params.to,
      subject: params.subject,
      ...(params.html ? { html: params.html } : { text: params.text! }),
      ...(params.text && params.html ? { text: params.text } : {}),
      ...(params.replyTo ? { replyTo: params.replyTo } : {}),
      ...(params.tags ? { tags: params.tags } : {}),
    };

    const { data, error } = await resend.emails.send(emailOptions);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Resend sendEmail error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send multiple emails in batch
 */
export async function sendBatchEmails(
  emails: EmailParams[]
): Promise<{ success: boolean; results: EmailResult[]; error?: string }> {
  if (!resend) {
    return {
      success: false,
      results: [],
      error: 'Resend client not initialized'
    };
  }

  try {
    const results: EmailResult[] = [];

    // Resend supports batch sending up to 100 at a time
    const batchSize = 100;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const batchPromises = batch.map(email => sendEmail(email));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    const allSuccessful = results.every(r => r.success);
    return {
      success: allSuccessful,
      results,
      error: allSuccessful ? undefined : 'Some emails failed to send'
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Resend batch error:', errorMessage);
    return { success: false, results: [], error: errorMessage };
  }
}

/**
 * Create an HTML email from a template with variable substitution
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    // Replace both {{key}} and {{ key }} patterns
    const patterns = [
      new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'),
    ];
    for (const pattern of patterns) {
      rendered = rendered.replace(pattern, value);
    }
  }
  return rendered;
}

/**
 * Wrap plain text email body in simple HTML template
 */
export function wrapInHtml(text: string): string {
  const htmlContent = text
    .split('\n')
    .map(line => line.trim() === '' ? '<br>' : `<p>${line}</p>`)
    .join('\n');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    p { margin: 0 0 1em 0; }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`.trim();
}

export { resend };
