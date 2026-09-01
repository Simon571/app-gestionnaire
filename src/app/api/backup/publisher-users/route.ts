import { NextResponse } from 'next/server';

// Rendu dynamique obligatoire : `force-static` priverait la route des API
// dynamiques (`headers()`), donc de l'identifiant d'assemblee pose par le
// middleware. Toutes les assemblees ecriraient alors dans le meme fichier.
export const dynamic = "force-dynamic";
export const revalidate = 0;

import path from 'path';
import { blobWrite } from '@/lib/blob-store';
import { readPublisherUsers } from '@/lib/publisher-users-store';

/**
 * POST /api/backup/publisher-users
 * Crée une sauvegarde horodatée de la liste des utilisateurs Publisher App.
 *
 * Cette route etait exposee en GET alors qu'elle ecrit un fichier. Le
 * middleware ne verifie l'origine et n'applique le quota de mutation que sur
 * POST/PUT/PATCH/DELETE : n'importe quelle requete GET, y compris un prefetch
 * de navigateur, declenchait donc une ecriture sans controle d'origine. Elle est
 * desormais en POST, ce qui la soumet aussi a la regle « un proclamateur ne
 * modifie que ses propres donnees ».
 *
 * Elle lisait par ailleurs `data/publisher-users.json` directement via `fs`, en
 * contournant `publisher-users-store` : sur Vercel elle ecrivait donc dans un
 * systeme de fichiers ephemere (sauvegarde perdue) et ignorait le cloisonnement
 * par assemblee, contredisant le commentaire ci-dessus. Les deux acces passent
 * maintenant par les stores, qui choisissent Redis ou le disque selon
 * l'environnement et prefixent le chemin par l'assemblee courante.
 */
export async function POST() {
  try {
    const users = await readPublisherUsers();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const relativePath = `data/backups/publisher-users-${timestamp}.json`;

    await blobWrite(
      relativePath,
      path.join(process.cwd(), 'data', 'backups', `publisher-users-${timestamp}.json`),
      JSON.stringify(users, null, 2)
    );

    return NextResponse.json({
      success: true,
      backupFile: relativePath,
      userCount: users.length,
      message: 'Sauvegarde créée avec succès',
    });
  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json(
      { error: 'Backup failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
