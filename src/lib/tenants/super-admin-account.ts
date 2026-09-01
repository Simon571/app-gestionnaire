/**
 * super-admin-account.ts
 * Compte unique d'administration de la plateforme.
 *
 * Les identifiants ne vivent que dans l'environnement : `SUPER_ADMIN_EMAIL` et
 * `SUPER_ADMIN_PASSWORD_HASH` (format `pbkdf2$…`, produit par
 * `scripts/hash-password.ts`). Aucun mot de passe n'est stocke en clair, et
 * aucun repli code en dur n'existe : sans configuration, la connexion renvoie
 * 503 plutot que d'accepter une valeur devinable.
 */
import { parseSecret, timingSafeEqualHex, verifySecret } from './credentials';

export interface SuperAdminConfig {
  email: string;
  hash: string;
  salt: string;
}

export function getSuperAdminConfig(): SuperAdminConfig | null {
  const email = (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
  const parsed = parseSecret(process.env.SUPER_ADMIN_PASSWORD_HASH);
  if (!email || !parsed) return null;
  return { email, ...parsed };
}

export function isSuperAdminConfigured(): boolean {
  return getSuperAdminConfig() !== null;
}

/**
 * L'email et le mot de passe sont tous deux verifies avant de conclure : sortir
 * des que l'email differe revelerait par le temps de reponse lequel des deux
 * champs est faux.
 */
export async function verifySuperAdmin(
  email: string,
  password: string
): Promise<boolean> {
  const config = getSuperAdminConfig();
  if (!config) return false;

  const emailOk = timingSafeEqualHex(
    email.trim().toLowerCase(),
    config.email
  );
  const passwordOk = await verifySecret(password, config);
  return emailOk && passwordOk;
}
