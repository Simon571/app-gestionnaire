import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { readPublisherUsers, writePublisherUsers } from '@/lib/publisher-users-store';
import { PublisherSyncStore } from '@/lib/publisher-sync-store';
import { findPublisher, publisherDisplayName, verifyPublisherPin } from '@/lib/publisher-auth';
import { authenticateDevice } from '@/lib/publisher-sync-auth';
import { runWithTenant } from '@/lib/tenants/tenant-scope';

export const dynamic = 'force-dynamic';

const contactSchema = z.object({
  id: z.string().optional(),
  name: z.string().default(''),
  isCongregationMember: z.boolean().optional().default(false),
  mobile: z.string().default(''),
  phone: z.string().default(''),
  email: z.string().default(''),
  relationship: z.string().default(''),
  notes: z.string().default(''),
});

const bodySchema = z.object({
  userId: z.string().min(1),
  pin: z.string().min(1),
  emergency: z
    .object({
      personName: z.string().default(''),
      notes: z.string().default(''),
      disasterAccommodations: z.boolean().default(false),
      contacts: z.array(contactSchema).default([]),
    })
    .default({ personName: '', notes: '', disasterAccommodations: false, contacts: [] }),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Payload invalide', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const deviceAuth = await authenticateDevice(request, { permissions: ['incoming'] });
  const device = !deviceAuth.response ? deviceAuth.device : undefined;

  return runWithTenant(device?.tenantId, async () => {
    const { userId, pin, emergency } = parsed.data;
    const users = await readPublisherUsers();
    const userIndex = users.findIndex((entry) => String(entry['id'] ?? '') === userId);
    const user = findPublisher(users, userId);

    if (!user || !verifyPublisherPin(user, pin)) {
      return NextResponse.json({ error: 'Utilisateur ou PIN invalide.' }, { status: 401 });
    }

    const normalizedContacts = emergency.contacts.map((contact, index) => ({
      ...contact,
      id:
        contact.id && contact.id.trim().length > 0
          ? contact.id
          : `emg-${randomUUID()}-${index}`,
      isCongregationMember: contact.isCongregationMember ?? false,
      mobile: contact.mobile ?? '',
      phone: contact.phone ?? '',
      email: contact.email ?? '',
      relationship: contact.relationship ?? '',
      notes: contact.notes ?? '',
    }));

    const updatedEmergency = {
      personName: emergency.personName ?? '',
      notes: emergency.notes ?? '',
      disasterAccommodations: emergency.disasterAccommodations ?? false,
      contacts: normalizedContacts,
    };

    const updatedUsers = [...users];
    updatedUsers[userIndex] = {
      ...user,
      emergency: updatedEmergency,
      updatedAt: new Date().toISOString(),
    };

    await writePublisherUsers(updatedUsers);

    const displayName = publisherDisplayName(user, userId);

    try {
      await PublisherSyncStore.addJob({
        type: 'emergency_contacts',
        direction: 'mobile_to_desktop',
        payload: {
          userId,
          displayName,
          emergency: updatedEmergency,
          updatedAt: new Date().toISOString(),
        },
        initiator: displayName,
        notify: true,
      });
    } catch (error) {
      console.error('emergency-contacts: unable to enqueue sync job', error);
    }

    return NextResponse.json({ ok: true, emergency: updatedEmergency });
  });
}
