export const dynamic = "force-static";
export const revalidate = 0;
import { NextResponse } from 'next/server';
import { readResponsibilities, writeResponsibilities, type ResponsibilitiesData } from '@/lib/responsibilities-store';

export async function GET() {
  try {
    const data = await readResponsibilities();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading responsibilities:', error);
    return NextResponse.json({ error: 'Failed to read responsibilities' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: ResponsibilitiesData = await request.json();
    await writeResponsibilities(body);
    return NextResponse.json({ ok: true, updatedAt: body.updatedAt });
  } catch (error) {
    console.error('Error saving responsibilities:', error);
    return NextResponse.json({ error: 'Failed to save responsibilities' }, { status: 500 });
  }
}
