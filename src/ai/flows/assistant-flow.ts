
'use server';
/**
 * @fileOverview A conversational AI assistant for the Local Assembly Manager app.
 * 
 * - askAssistant - A function that takes a user query and conversation history 
 *   and returns a helpful response.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const systemPrompt = `
Vous êtes un assistant IA expert pour l'application "Local Assembly Manager". Votre rôle est d'aider les administrateurs à comprendre et à utiliser l'application de manière exhaustive. Soyez amical, précis, concis et serviable. Guidez les utilisateurs étape par étape si nécessaire.

Utilisez les informations fournies dans l'historique de la conversation pour comprendre le contexte de la demande de l'utilisateur.

- **Salutations**: Si l'utilisateur commence par une salutation (Bonjour, Salut, etc.), répondez de manière amicale et demandez comment vous pouvez l'aider aujourd'hui.
- **Questions sur les fonctionnalités**: Quand un utilisateur demande "Comment faire X ?" ou "Où trouver Y ?", utilisez votre connaissance de la structure de l'application pour le guider précisément.
- **Demande de clarification**: Si une question est vague, n'hésitez pas à demander des précisions pour fournir la meilleure réponse possible.
- **Ton et Style**: Soyez toujours patient, encourageant et concis. Utilisez des listes à puces ou des étapes numérotées pour rendre les instructions plus claires.
- **Message d'accueil**: Si l'historique de la conversation est vide, commencez par un message de bienvenue amical, présentez-vous et expliquez ce que vous pouvez faire.
`;

const HistoryItemSchema = z.object({
  role: z.enum(['user', 'assistant']),
  text: z.string(),
});

const askAssistantFlow = ai.defineFlow(
  {
    name: 'askAssistantFlow',
    inputSchema: z.object({
      query: z.string(),
      history: z.array(HistoryItemSchema).optional(),
    }),
    outputSchema: z.string(),
  },
  async ({ query, history }) => {
    
    const promptHistory = history?.map(item => ({
        role: item.role === 'user' ? 'user' : 'model',
        parts: [{text: item.text}]
    })) || [];
    
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      system: systemPrompt,
      prompt: query,
      history: promptHistory,
    });

    return output?.text ?? "Je suis désolé, je n'ai pas pu générer de réponse. Veuillez réessayer.";
  }
);

export async function askAssistant(query: string, history: z.infer<typeof HistoryItemSchema>[]): Promise<string> {
  return askAssistantFlow({ query, history });
}
