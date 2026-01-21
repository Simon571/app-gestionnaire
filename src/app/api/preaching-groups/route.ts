import { NextResponse } from 'next/server';

export const dynamic = "force-static";
export const revalidate = 0;
import { readPreachingGroups, writePreachingGroups, addPreachingGroup, deletePreachingGroup, type PreachingGroup } from '@/lib/preaching-groups-store';

export async function GET() {
  try {
    const groups = await readPreachingGroups();
    return NextResponse.json({ groups });
  } catch (error) {
    console.error('Error reading preaching groups:', error);
    return NextResponse.json({ error: 'Failed to read preaching groups' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Handle bulk update (replace all groups)
    if (Array.isArray(body.groups)) {
      await writePreachingGroups(body.groups);
      return NextResponse.json({ ok: true, count: body.groups.length });
    }
    
    // Handle single group addition
    if (body.id && body.name) {
      const newGroup: PreachingGroup = { id: body.id, name: body.name };
      await addPreachingGroup(newGroup);
      return NextResponse.json({ ok: true, group: newGroup });
    }
    
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  } catch (error) {
    console.error('Error saving preaching groups:', error);
    return NextResponse.json({ error: 'Failed to save preaching groups' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('id');
    
    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }
    
    await deletePreachingGroup(groupId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting preaching group:', error);
    return NextResponse.json({ error: 'Failed to delete preaching group' }, { status: 500 });
  }
}
