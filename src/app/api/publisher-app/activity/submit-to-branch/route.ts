import { NextResponse } from 'next/server';

export const dynamic = "force-static";
export const revalidate = 0;
import { z } from 'zod';
import { markMonthAsSent, cancelMonthSent, listMonthSubmissions, getMonthSubmission } from '@/lib/publisher-preaching-store';

const submitSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  lateUserIds: z.array(z.string()),
});

const cancelSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
});

// GET: List all month submissions or get specific month
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month');
  
  if (month) {
    const submission = await getMonthSubmission(month);
    return NextResponse.json({ submission });
  }
  
  const submissions = await listMonthSubmissions();
  return NextResponse.json({ submissions });
}

// POST: Mark month as sent to branch and mark late users
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = submitSchema.safeParse(body);
  
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  }
  
  const { month, lateUserIds } = parsed.data;
  
  try {
    const submission = await markMonthAsSent(month, lateUserIds);
    return NextResponse.json({ ok: true, submission });
  } catch (error) {
    console.error('Failed to mark month as sent', error);
    return NextResponse.json({ error: 'Failed to mark month as sent' }, { status: 500 });
  }
}

// DELETE: Cancel month submission
export async function DELETE(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = cancelSchema.safeParse(body);
  
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  }
  
  const { month } = parsed.data;
  
  try {
    await cancelMonthSent(month);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to cancel month submission', error);
    return NextResponse.json({ error: 'Failed to cancel submission' }, { status: 500 });
  }
}
