export const ai = process.env.NEXT_RUNTIME !== 'edge' && process.env.NEXT_PUBLIC_ENABLE_AI === '1'
  ? require('genkit').genkit({
      plugins: [require('@genkit-ai/googleai').googleAI()],
      model: 'googleai/gemini-2.0-flash',
    })
  : undefined;
