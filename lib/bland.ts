// Bland AI Voice Calling Integration
// Documentation: https://docs.bland.ai

const blandApiKey = process.env.BLAND_API_KEY;
const blandBaseUrl = 'https://api.bland.ai/v1';

if (!blandApiKey) {
  console.warn('BLAND_API_KEY is not set. Voice calling features will be disabled.');
}

export interface CallParams {
  phoneNumber: string;
  task: string; // The script/instructions for the AI
  voice?: string; // Voice ID (e.g., 'nat', 'josh', 'rachel')
  firstSentence?: string; // Opening line
  waitForGreeting?: boolean;
  maxDuration?: number; // Max call length in seconds
  model?: 'base' | 'turbo' | 'enhanced';
  transferPhoneNumber?: string; // Number to transfer to if needed
  metadata?: Record<string, string>; // Custom data to track
  webhookUrl?: string; // URL to receive call completion webhook
  record?: boolean; // Whether to record the call
}

export interface CallResult {
  success: boolean;
  callId?: string;
  status?: string;
  error?: string;
}

export interface CallDetails {
  callId: string;
  status: 'queued' | 'ringing' | 'in-progress' | 'completed' | 'failed' | 'no-answer' | 'busy';
  duration?: number;
  transcript?: string;
  summary?: string;
  recordingUrl?: string;
  answeredBy?: 'human' | 'voicemail' | 'unknown';
  endedReason?: string;
}

/**
 * Initiate a phone call via Bland AI
 */
export async function makeCall(params: CallParams): Promise<CallResult> {
  if (!blandApiKey) {
    return { success: false, error: 'Bland API key not configured' };
  }

  try {
    const response = await fetch(`${blandBaseUrl}/calls`, {
      method: 'POST',
      headers: {
        'Authorization': blandApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_number: params.phoneNumber,
        task: params.task,
        voice: params.voice || 'nat',
        first_sentence: params.firstSentence,
        wait_for_greeting: params.waitForGreeting ?? true,
        max_duration: params.maxDuration || 300, // 5 minute default
        model: params.model || 'enhanced',
        transfer_phone_number: params.transferPhoneNumber,
        metadata: params.metadata,
        webhook: params.webhookUrl,
        record: params.record ?? true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      callId: data.call_id,
      status: data.status,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Bland makeCall error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Get details about a call
 */
export async function getCallDetails(callId: string): Promise<CallDetails | null> {
  if (!blandApiKey) {
    console.error('Bland API key not configured');
    return null;
  }

  try {
    const response = await fetch(`${blandBaseUrl}/calls/${callId}`, {
      method: 'GET',
      headers: {
        'Authorization': blandApiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Bland getCallDetails error: HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();

    return {
      callId: data.call_id,
      status: data.status,
      duration: data.call_length,
      transcript: data.concatenated_transcript,
      summary: data.summary,
      recordingUrl: data.recording_url,
      answeredBy: data.answered_by,
      endedReason: data.end_reason,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Bland getCallDetails error:', errorMessage);
    return null;
  }
}

/**
 * Get transcript from a completed call
 */
export async function getCallTranscript(callId: string): Promise<string | null> {
  const details = await getCallDetails(callId);
  return details?.transcript || null;
}

/**
 * End an ongoing call
 */
export async function endCall(callId: string): Promise<{ success: boolean; error?: string }> {
  if (!blandApiKey) {
    return { success: false, error: 'Bland API key not configured' };
  }

  try {
    const response = await fetch(`${blandBaseUrl}/calls/${callId}/stop`, {
      method: 'POST',
      headers: {
        'Authorization': blandApiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const data = await response.json();
      return {
        success: false,
        error: data.message || `HTTP ${response.status}`,
      };
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Bland endCall error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Build a call script from a template with variable substitution
 */
export function buildCallScript(
  template: string,
  variables: Record<string, string>
): string {
  let script = template;
  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    script = script.replace(pattern, value);
  }
  return script;
}

/**
 * Available voices for Bland AI
 */
export const BLAND_VOICES = [
  { id: 'nat', name: 'Nat', gender: 'female', description: 'Friendly and professional' },
  { id: 'josh', name: 'Josh', gender: 'male', description: 'Calm and conversational' },
  { id: 'rachel', name: 'Rachel', gender: 'female', description: 'Warm and engaging' },
  { id: 'alex', name: 'Alex', gender: 'male', description: 'Energetic and enthusiastic' },
] as const;

export type BlandVoiceId = typeof BLAND_VOICES[number]['id'];
