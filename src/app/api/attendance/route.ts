import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-static";
export const revalidate = 0;
import { getAttendanceForMonth, readAttendanceRecords } from '@/lib/attendance-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');
    
    if (yearParam && monthParam) {
      const year = parseInt(yearParam, 10);
      const month = parseInt(monthParam, 10);
      
      if (!isNaN(year) && !isNaN(month)) {
        const records = await getAttendanceForMonth(year, month);
        return NextResponse.json({ records });
      }
    }
    
    // Return all records if no filter
    const records = await readAttendanceRecords();
    return NextResponse.json({ records });
  } catch (error) {
    console.error('attendance API error', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
