import { SignalType } from '@/lib/types';

export interface RawUserSignal {
  name: string;
  title?: string;
  company?: string;
  signalType: SignalType;
  confidence: number;
  snippet: string;
  url: string;
  date?: string;
  linkedin_url?: string;
}
