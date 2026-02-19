import { NextResponse } from 'next/server';
// force-dynamic: Vercel lit families.json en temps réel.
// Pour le build Tauri, build-tauri.ps1 patche en 'force-static'.
export const dynamic = 'force-dynamic';
import { readFamilies, writeFamilies, addFamily, deleteFamily, type Family } from '@/lib/families-store';

const noCacheHeaders = { 'Cache-Control': 'no-store, no-cache, must-revalidate' };

export async function GET() {
  try {
    const families = await readFamilies();
    return NextResponse.json({ families }, { headers: noCacheHeaders });
  } catch (error) {
    console.error('Error reading families:', error);
    return NextResponse.json({ error: 'Failed to read families' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Handle bulk update (replace all families)
    if (Array.isArray(body.families)) {
      await writeFamilies(body.families);
      return NextResponse.json({ ok: true, count: body.families.length });
    }
    
    // Handle single family addition
    if (body.id && body.name) {
      const newFamily: Family = { id: body.id, name: body.name };
      await addFamily(newFamily);
      return NextResponse.json({ ok: true, family: newFamily });
    }
    
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  } catch (error) {
    console.error('Error saving families:', error);
    return NextResponse.json({ error: 'Failed to save families' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get('id');
    
    if (!familyId) {
      return NextResponse.json({ error: 'Family ID is required' }, { status: 400 });
    }
    
    await deleteFamily(familyId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting family:', error);
    return NextResponse.json({ error: 'Failed to delete family' }, { status: 500 });
  }
}
