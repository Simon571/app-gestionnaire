/**
 * publisher-users-privacy.ts
 * Retrait du PIN des listes d'utilisateurs envoyees aux telephones.
 *
 * POURQUOI CE COMMUTATEUR EXISTE
 * ------------------------------
 * L'APK publie verifie l'identite **hors ligne** : il compare le PIN saisi a
 * celui de la fiche telechargee. Le PIN voyage donc en clair dans la reponse de
 * `/api/publisher-app/mobile-users` et `/api/publisher-app/users/export`, et
 * quiconque appelle ces routes obtient les PIN de toute l'assemblee.
 *
 * Le supprimer tout de suite empecherait chaque telephone deja installe de
 * connecter qui que ce soit : sans fiche portant un PIN,
 * `AuthService.validateUser` echoue. La suppression est donc commandee par une
 * variable d'environnement, a activer **apres** publication d'un APK qui
 * verifie le PIN cote serveur (`POST /api/publisher-app/verify-pin`) :
 *
 *   MOBILE_USERS_INCLUDE_PIN=off
 *
 * Tant qu'elle n'est pas posee, le comportement historique est conserve.
 */
import type { PublisherUserRecord } from '@/lib/publisher-users-store';

/** Champs jamais utiles a un client et retires en meme temps que le PIN. */
const ALWAYS_STRIPPED = ['passwordHash', 'password'] as const;

/** Vrai si les listes destinees aux telephones doivent encore porter le PIN. */
export function mobilePinDeliveryEnabled(): boolean {
  return (process.env.MOBILE_USERS_INCLUDE_PIN || '').trim().toLowerCase() !== 'off';
}

/**
 * Prepare une liste d'utilisateurs pour un client mobile.
 *
 * Le PIN n'est retire que si `MOBILE_USERS_INCLUDE_PIN=off` ; les eventuels
 * hachages de mot de passe le sont toujours, aucun client n'en ayant l'usage.
 */
export function forMobileClients(users: PublisherUserRecord[]): PublisherUserRecord[] {
  const keepPin = mobilePinDeliveryEnabled();

  return users.map((user) => {
    const copy: PublisherUserRecord = { ...user };
    for (const field of ALWAYS_STRIPPED) delete copy[field];
    if (!keepPin) delete copy['pin'];
    return copy;
  });
}
