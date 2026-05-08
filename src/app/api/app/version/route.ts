import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-static";
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
