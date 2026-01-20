/**
 * Configuration des polices avec next/font
 * Optimisé pour un chargement rapide sans connexion à Google Fonts
 */

import { PT_Sans } from 'next/font/google';

// Police PT Sans avec toutes les variantes utilisées dans l'application
export const ptSans = PT_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  display: 'swap', // Affiche le texte immédiatement avec une police de fallback
  variable: '--font-pt-sans', // Variable CSS pour utiliser avec Tailwind
});
