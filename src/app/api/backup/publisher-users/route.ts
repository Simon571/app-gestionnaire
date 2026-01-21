import { NextResponse } from 'next/server';

export const dynamic = "force-static";
export const revalidate = 0;
import { promises as fs } from 'fs';
import path from 'path';

/**
 * GET /api/backup/publisher-users
 * Crée une sauvegarde horodatée de publisher-users.json
 */
export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    const sourceFile = path.join(dataDir, 'publisher-users.json');
    const backupDir = path.join(dataDir, 'backups');
    
    // Créer le dossier backups s'il n'existe pas
    await fs.mkdir(backupDir, { recursive: true });
    
    // Lire le fichier source
    const content = await fs.readFile(sourceFile, 'utf-8');
    const users = JSON.parse(content);
    
    // Créer le nom de fichier avec timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFile = path.join(backupDir, `publisher-users-${timestamp}.json`);
    
    // Sauvegarder
    await fs.writeFile(backupFile, content, 'utf-8');
    
    return NextResponse.json({
      success: true,
      backupFile: `data/backups/publisher-users-${timestamp}.json`,
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
