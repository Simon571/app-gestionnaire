/**
 * portal-mode.ts
 * Qui a le droit de voir l'application a la racine du site.
 *
 * Trois cas, et un seul est explicite :
 *
 *   NEXT_PUBLIC_PORTAL_MODE = '0'  → poste de travail (MSI Tauri). Le build
 *                                     bureau pose cette valeur ; l'application
 *                                     s'ouvre directement.
 *   NEXT_PUBLIC_PORTAL_MODE = '1'  → portail web explicite.
 *   absent                         → portail web.
 *
 * La valeur absente vaut « portail web » parce que c'est le comportement en
 * ligne : un visiteur qui tape l'adresse du site n'a pas de session, il doit
 * voir la page de telechargement et non le tableau de bord. Le seul endroit ou
 * l'application doit s'ouvrir sans detour est le poste installe, et celui-la se
 * declare explicitement avec '0'.
 *
 * `NEXT_PUBLIC_*` est fige dans le JavaScript au moment de la compilation :
 * cette fonction ne change donc pas au redemarrage du serveur, il faut
 * reconstruire. C'est voulu — le mode fait partie de la version livree.
 */
export function isPortalMode(): boolean {
  return process.env.NEXT_PUBLIC_PORTAL_MODE !== '0';
}