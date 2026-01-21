export const dynamic = "force-static";
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Chemin vers notre fichier de stockage JSON
const dataFilePath = path.join(process.cwd(), 'export', 'vcm-program.json');

/**
 * Gère les requêtes POST pour mettre à jour les données du programme.
 * C'est le point d'entrée pour notre script de scraping.
 */
export async function POST(request: Request) {
  // 1. Sécuriser l'API
  const apiKey = request.headers.get('x-api-key');
  // Le script de scraping doit fournir une clé API valide.
  // Les requêtes depuis le client n'ont pas de clé et sont autorisées.
  // Pour une application en production, il faudrait vérifier la session de l'utilisateur ici.
  if (apiKey && apiKey !== process.env.AUTOMATION_API_KEY) {
    return NextResponse.json({ message: 'Erreur: Clé API non valide.' }, { status: 401 });
  }
  // Si aucune clé n'est fournie, on suppose que c'est une requête légitime du client.

  try {
    // 2. Récupérer et valider les données envoyées par le script
    const workbookData = await request.json();
    if (!workbookData || Object.keys(workbookData).length === 0) {
      throw new Error('Aucune donnée reçue.');
    }

    // 3. Écrire les données dans notre fichier JSON
    await fs.writeFile(dataFilePath, JSON.stringify(workbookData, null, 2), 'utf8');

    console.log(`Mise à jour réussie: ${dataFilePath}`);
    return NextResponse.json({ message: 'Programme mis à jour avec succès.' }, { status: 200 });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du programme:', error);
    const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
    return NextResponse.json({ message: 'Erreur Interne du Serveur', error: errorMessage }, { status: 500 });
  }
}

/**
 * Gère les requêtes GET pour récupérer les données du programme.
 * C'est ce que le composant de la page "Réunion Vie chrétienne" utilisera.
 */
export async function GET() {
  try {
    // 1. Lire les données depuis notre fichier JSON
    const fileContents = await fs.readFile(dataFilePath, 'utf8');
    const data = JSON.parse(fileContents);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    // Si le fichier n'existe pas encore, retourner un objet vide.
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return NextResponse.json({}, { status: 200 });
    }
    console.error('Erreur lors de la lecture du programme:', error);
    const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
    return NextResponse.json({ message: 'Erreur Interne du Serveur', error: errorMessage }, { status: 500 });
  }
}
