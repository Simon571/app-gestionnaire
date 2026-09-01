import { NextRequest, NextResponse } from 'next/server';

// Cette route lit `public/app/version.json` a chaque appel et renvoie des
// en-tetes `no-store` : elle doit donc etre dynamique. Avec `force-static` le
// fichier etait lu une seule fois au build et fige dans la reponse, ce qui
// obligeait a redeployer pour publier une mise a jour de l'APK — alors que
// c'est precisement l'endpoint que l'application Android interroge pour
// detecter une nouvelle version.
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const versionFilePath = path.join(process.cwd(), 'public', 'app', 'version.json');
    
    if (!fs.existsSync(versionFilePath)) {
      return NextResponse.json(
        { error: 'Version file not found' },
        { status: 404 }
      );
    }
    
    const versionData = JSON.parse(fs.readFileSync(versionFilePath, 'utf-8'));
    
    return NextResponse.json(versionData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error reading version file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
