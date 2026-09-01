/**
 * assembly-registry.ts
 * Registre des assemblees clientes et de leurs abonnements.
 *
 * Runtime Node uniquement (lit `blob-store`, donc `fs` ou Redis). Le middleware
 * ne doit pas l'importer : il s'appuie sur l'etat embarque dans le cookie de
 * session, et les route handlers re-verifient ici, qui reste la source de
 * verite.
 *
 * Persiste hors cloisonnement (`blobReadGlobal`/`blobWriteGlobal`) : ce fichier
 * est commun a toutes les assemblees.
 */
import path from 'path';
import { blobReadGlobal, blobWriteGlobal } from '@/lib/blob-store';
import {
  generateAssemblyId,
  generatePin,
  hashSecret,
  verifySecret,
  type HashedSecret,
} from './credentials';
import {
  DEFAULT_TRIAL_DAYS,
  computeExpiry,
  evaluateSubscription,
  type Subscription,
  type SubscriptionPlan,
  type SubscriptionState,
  type SubscriptionStatus,
} from './subscription';

const BLOB_PATH = 'platform/assemblies.json';
const LOCAL_PATH = path.join(process.cwd(), 'data', 'platform', 'assemblies.json');

export interface Assembly {
  id: string;
  name: string;
  contactEmail: string;
  /** PIN administrateur, jamais stocke en clair. */
  pinHash: string;
  pinSalt: string;
  createdAt: string;
  subscription: Subscription;
}

interface RegistryFile {
  version: 1;
  assemblies: Assembly[];
}

/**
 * Assemblee d'essai historique. Reprise ici comme amorcage : les installations
 * deja distribuees continuent de se connecter apres la migration. Le PIN est
 * hashe au premier demarrage, puis n'existe plus en clair cote serveur.
 */
const BOOTSTRAP_FALLBACK = {
  id: 'KINYOL-WGHK',
  pin: '136573',
  name: 'KIN YOLO EST Francais (essai)',
};

function emptyRegistry(): RegistryFile {
  return { version: 1, assemblies: [] };
}

async function readRegistryFile(): Promise<RegistryFile> {
  const raw = await blobReadGlobal(BLOB_PATH, LOCAL_PATH);
  if (!raw) return emptyRegistry();
  try {
    const parsed = JSON.parse(raw) as RegistryFile;
    if (!Array.isArray(parsed.assemblies)) return emptyRegistry();
    return { version: 1, assemblies: parsed.assemblies };
  } catch (error) {
    // Ne jamais ecraser un registre illisible : le signaler et refuser.
    console.error('assembly-registry: registre illisible', (error as Error).message);
    throw new Error('Registre des assemblees corrompu');
  }
}

async function writeRegistryFile(registry: RegistryFile): Promise<void> {
  await blobWriteGlobal(BLOB_PATH, LOCAL_PATH, JSON.stringify(registry, null, 2));
}

function newSubscription(
  plan: SubscriptionPlan,
  maxPublishers: number
): Subscription {
  const now = new Date();
  return {
    plan,
    status: plan === 'trial' ? 'trial' : 'active',
    startedAt: now.toISOString(),
    expiresAt: computeExpiry(plan, now),
    maxPublishers,
  };
}

/**
 * Cree l'assemblee d'amorcage si le registre est vide, pour que la plateforme
 * ne demarre jamais sans aucun compte utilisable.
 */
async function ensureBootstrapped(): Promise<RegistryFile> {
  const registry = await readRegistryFile();
  if (registry.assemblies.length > 0) return registry;

  const id = (process.env.ASSEMBLY_ID || '').trim() || BOOTSTRAP_FALLBACK.id;
  const pin = (process.env.ASSEMBLY_PIN || '').trim() || BOOTSTRAP_FALLBACK.pin;
  const name = (process.env.ASSEMBLY_NAME || '').trim() || BOOTSTRAP_FALLBACK.name;

  if (pin === BOOTSTRAP_FALLBACK.pin) {
    console.warn(
      'assembly-registry: amorcage avec le PIN historique, qui a ete publie ' +
        'dans le bundle client. Le regenerer depuis la console super admin.'
    );
  }

  const hashed = await hashSecret(pin);
  const assembly: Assembly = {
    id,
    name,
    contactEmail: '',
    pinHash: hashed.hash,
    pinSalt: hashed.salt,
    createdAt: new Date().toISOString(),
    subscription: newSubscription('trial', 200),
  };

  const seeded: RegistryFile = { version: 1, assemblies: [assembly] };
  await writeRegistryFile(seeded);
  console.warn(
    `assembly-registry: registre amorce avec l'assemblee ${id} ` +
      `(essai de ${DEFAULT_TRIAL_DAYS} jours).`
  );
  return seeded;
}

export interface AssemblySummary extends Omit<Assembly, 'pinHash' | 'pinSalt'> {
  state: SubscriptionState;
}

/** Vue publique : jamais de hash ni de sel vers le client. */
function toSummary(assembly: Assembly, now = Date.now()): AssemblySummary {
  const { pinHash: _pinHash, pinSalt: _pinSalt, ...rest } = assembly;
  return { ...rest, state: evaluateSubscription(assembly.subscription, now) };
}

export async function listAssemblies(): Promise<AssemblySummary[]> {
  const registry = await ensureBootstrapped();
  const now = Date.now();
  return registry.assemblies
    .map((assembly) => toSummary(assembly, now))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

export async function getAssembly(id: string): Promise<Assembly | null> {
  const registry = await ensureBootstrapped();
  return registry.assemblies.find((assembly) => assembly.id === id) ?? null;
}

export async function getAssemblySummary(id: string): Promise<AssemblySummary | null> {
  const assembly = await getAssembly(id);
  return assembly ? toSummary(assembly) : null;
}

export interface CreateAssemblyInput {
  name: string;
  contactEmail?: string;
  plan?: SubscriptionPlan;
  maxPublishers?: number;
}

/**
 * Cree une assemblee et retourne le PIN **en clair une seule fois** : il n'est
 * stocke que sous forme de hash et ne pourra plus etre relu.
 */
export async function createAssembly(
  input: CreateAssemblyInput
): Promise<{ assembly: AssemblySummary; pin: string }> {
  const name = input.name.trim();
  if (name.length < 3) throw new Error('Le nom de l\'assemblee est trop court');

  const registry = await ensureBootstrapped();

  let id = generateAssemblyId(name);
  let attempts = 0;
  while (registry.assemblies.some((assembly) => assembly.id === id)) {
    if (attempts > 10) throw new Error('Impossible de generer un identifiant unique');
    id = generateAssemblyId(name);
    attempts += 1;
  }

  const pin = generatePin();
  const hashed = await hashSecret(pin);
  const assembly: Assembly = {
    id,
    name,
    contactEmail: (input.contactEmail || '').trim(),
    pinHash: hashed.hash,
    pinSalt: hashed.salt,
    createdAt: new Date().toISOString(),
    subscription: newSubscription(input.plan ?? 'trial', input.maxPublishers ?? 200),
  };

  registry.assemblies.push(assembly);
  await writeRegistryFile(registry);
  return { assembly: toSummary(assembly), pin };
}

async function mutate(
  id: string,
  apply: (assembly: Assembly) => void | Promise<void>
): Promise<AssemblySummary | null> {
  const registry = await ensureBootstrapped();
  const assembly = registry.assemblies.find((candidate) => candidate.id === id);
  if (!assembly) return null;
  await apply(assembly);
  await writeRegistryFile(registry);
  return toSummary(assembly);
}

export async function updateAssembly(
  id: string,
  patch: { name?: string; contactEmail?: string; maxPublishers?: number }
): Promise<AssemblySummary | null> {
  return mutate(id, (assembly) => {
    if (patch.name !== undefined && patch.name.trim().length >= 3) {
      assembly.name = patch.name.trim();
    }
    if (patch.contactEmail !== undefined) {
      assembly.contactEmail = patch.contactEmail.trim();
    }
    if (patch.maxPublishers !== undefined && patch.maxPublishers > 0) {
      assembly.subscription.maxPublishers = Math.floor(patch.maxPublishers);
    }
  });
}

export interface SubscriptionPatch {
  plan?: SubscriptionPlan;
  status?: SubscriptionStatus;
  /** ISO 8601, ou `null` pour un abonnement sans echeance. */
  expiresAt?: string | null;
  notes?: string;
}

export async function setSubscription(
  id: string,
  patch: SubscriptionPatch
): Promise<AssemblySummary | null> {
  return mutate(id, (assembly) => {
    const subscription = assembly.subscription;
    if (patch.plan) subscription.plan = patch.plan;
    if (patch.status) subscription.status = patch.status;
    if (patch.expiresAt !== undefined) subscription.expiresAt = patch.expiresAt;
    if (patch.notes !== undefined) subscription.notes = patch.notes;
  });
}

/** Renouvellement : repart de maintenant, ou de l'echeance si elle est future. */
export async function renewSubscription(
  id: string,
  plan: SubscriptionPlan
): Promise<AssemblySummary | null> {
  return mutate(id, (assembly) => {
    const current = assembly.subscription.expiresAt
      ? Date.parse(assembly.subscription.expiresAt)
      : NaN;
    const from =
      !Number.isNaN(current) && current > Date.now() ? new Date(current) : new Date();

    assembly.subscription.plan = plan;
    assembly.subscription.status = plan === 'trial' ? 'trial' : 'active';
    assembly.subscription.expiresAt = computeExpiry(plan, from);
  });
}

/** Nouveau PIN, retourne en clair une seule fois. */
export async function rotatePin(
  id: string
): Promise<{ assembly: AssemblySummary; pin: string } | null> {
  const pin = generatePin();
  const hashed = await hashSecret(pin);
  const assembly = await mutate(id, (target) => {
    target.pinHash = hashed.hash;
    target.pinSalt = hashed.salt;
  });
  return assembly ? { assembly, pin } : null;
}

export async function deleteAssembly(id: string): Promise<boolean> {
  const registry = await ensureBootstrapped();
  const next = registry.assemblies.filter((assembly) => assembly.id !== id);
  if (next.length === registry.assemblies.length) return false;
  await writeRegistryFile({ version: 1, assemblies: next });
  return true;
}

/**
 * Verifie un couple (identifiant, PIN). Une derivation PBKDF2 est effectuee
 * meme quand l'assemblee est inconnue, afin que le temps de reponse ne revele
 * pas l'existence d'un identifiant.
 */
export async function verifyAssemblyPin(
  id: string,
  pin: string
): Promise<{ assembly: Assembly; state: SubscriptionState } | null> {
  const assembly = await getAssembly(id.trim());
  const stored: HashedSecret | null = assembly
    ? { hash: assembly.pinHash, salt: assembly.pinSalt }
    : null;

  const decoy: HashedSecret = {
    hash: '0'.repeat(64),
    salt: '0'.repeat(32),
  };
  const ok = await verifySecret(pin, stored ?? decoy);

  if (!assembly || !ok) return null;
  return { assembly, state: evaluateSubscription(assembly.subscription) };
}

export { evaluateSubscription };
