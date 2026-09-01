/**
 * GET    /api/super-admin/assemblies/[id] -> details d'une assemblee
 * PATCH  /api/super-admin/assemblies/[id] -> nom, contact, quota de proclamateurs
 * DELETE /api/super-admin/assemblies/[id] -> retire l'assemblee du registre
 *
 * La suppression ne retire que l'entree du registre : les donnees de
 * l'assemblee restent sous `tenants/<id>/` afin qu'une suppression accidentelle
 * ne soit pas destructrice. Preferer la suspension pour couper l'acces.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/tenants/require-super-admin';
import {
  deleteAssembly,
  getAssemblySummary,
  updateAssembly,
} from '@/lib/tenants/assembly-registry';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

const notFound = () =>
  NextResponse.json({ error: 'Assemblee inconnue' }, { status: 404 });

export async function GET(request: NextRequest, { params }: Context) {
  const denied = await requireSuperAdmin(request);
  if (denied) return denied;

  const { id } = await params;
  const assembly = await getAssemblySummary(id);
  return assembly ? NextResponse.json({ assembly }) : notFound();
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const denied = await requireSuperAdmin(request);
  if (denied) return denied;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Corps de requete invalide' }, { status: 400 });
  }

  const maxPublishers = Number(body.maxPublishers);
  const assembly = await updateAssembly(id, {
    name: body.name === undefined ? undefined : String(body.name),
    contactEmail: body.contactEmail === undefined ? undefined : String(body.contactEmail),
    maxPublishers: Number.isFinite(maxPublishers) ? maxPublishers : undefined,
  });

  return assembly ? NextResponse.json({ assembly }) : notFound();
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const denied = await requireSuperAdmin(request);
  if (denied) return denied;

  const { id } = await params;
  const removed = await deleteAssembly(id);
  return removed
    ? NextResponse.json({
        success: true,
        note: 'Entree retiree du registre. Les donnees restent conservees sous tenants/' + id + '/.',
      })
    : notFound();
}
