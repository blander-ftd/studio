import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { getSecret } from '@/lib/secret-manager';

// Resolve GOOGLE_API_KEY from Secret Manager at module load so the plugin receives it synchronously.
const GOOGLE_API_KEY = await getSecret('GOOGLE_API_KEY').catch(() => process.env.GOOGLE_API_KEY || '');

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: GOOGLE_API_KEY,
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});
