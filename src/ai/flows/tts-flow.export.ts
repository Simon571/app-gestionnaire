export type TextToSpeechOutput = {
  media: string;
};

export async function textToSpeech(_text: string): Promise<TextToSpeechOutput> {
  throw new Error('Synthese vocale indisponible en build export.');
}
