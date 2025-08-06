import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: "AIzaSyBEdwmk2KRdTA_iT9RWpFD8FDHXegJHwuw",
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});
