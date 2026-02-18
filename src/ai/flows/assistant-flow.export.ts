export type AssistantHistoryItem = {
  role: 'user' | 'assistant';
  text: string;
};

export async function askAssistant(_query: string, _history: AssistantHistoryItem[]): Promise<string> {
  throw new Error('Assistant IA indisponible en build export.');
}
