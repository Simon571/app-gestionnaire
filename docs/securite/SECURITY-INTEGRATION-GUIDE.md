/**
 * GUIDE D'INTÉGRATION - Sécurité dans l'application
 * 
 * Ce fichier liste tous les changements et comment les intégrer dans votre app
 */

# 🔒 GUIDE D'INTÉGRATION - SÉCURITÉ COMPLÈTE

## 1. Structure des fichiers créés

```
src/
├── lib/
│   ├── encryption-service.ts          ✨ Nouveau
│   ├── secure-auth-service.ts         ✨ Nouveau
│   ├── secure-backup-sync-service.ts  ✨ Nouveau
│   ├── rate-limiter.ts                ✨ Nouveau
│   └── backup-sync-service.ts         (À REMPLACER)
│
├── middleware-security.ts              ✨ Nouveau
│
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── login/
│   │   │       └── route.ts            ✨ Nouveau
│   │   └── gdpr/
│   │       └── export/
│   │           └── route.ts            ✨ Nouveau
│   └── moi/
│       └── confidentialite-securite/
│           └── page.tsx                ✨ Nouveau
│
├── SECURITY.md                         ✨ Nouveau
├── DEPLOYMENT-SECURITY-CHECKLIST.md    ✨ Nouveau
└── .env.local.example                  ✨ Mis à jour
```

## 2. Installation & Configuration

### Étape 1: Dépendances
```bash
npm install crypto-js tweetnacl @noble/hashes dotenv
```

### Étape 2: Clé de chiffrement
```bash
# Générer une clé
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Ajouter à .env.local
NEXT_PUBLIC_ENCRYPTION_KEY=<clé-générée>
```

### Étape 3: Variables d'environnement
Copier `.env.local.example` vers `.env.local` et remplir les valeurs

```env
NEXT_PUBLIC_ENCRYPTION_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## 3. Migration du stockage

### Avant (NON SÉCURISÉ):
```typescript
import { useBackupSync } from '@/lib/backup-sync-service';

const { createBackup } = useBackupSync();
// Les données sont stockées en clair dans localStorage
```

### Après (SÉCURISÉ):
```typescript
import { useSecureBackupSync } from '@/lib/secure-backup-sync-service';
import { SecureStorage } from '@/lib/encryption-service';

const { createSecureBackup } = useSecureBackupSync();
// Les données sont chiffrées automatiquement
SecureStorage.setItem('people', data); // Chiffré
```

## 4. Migration de l'authentification

### Avant (NON SÉCURISÉ):
```typescript
import { AuthService } from '@/lib/auth';

const { data, error } = await supabase.auth.signInWithPassword({...});
// Tokens stockés sans chiffrement
```

### Après (SÉCURISÉ):
```typescript
import { SecureAuthService, useSecureAuth } from '@/lib/secure-auth-service';

const token = await SecureAuthService.signIn(email, password);
// Tokens chiffrés + JWT signing
// Utiliser le hook: const { user, signOut } = useSecureAuth();
```

## 5. Ajouter la page GDPR

Pour ajouter un lien dans le menu "Moi":

```tsx
// src/app/moi/layout.tsx ou navigation.ts
import { Shield } from 'lucide-react';

export const meiLinks = [
  // ... autres liens
  {
    href: '/moi/confidentialite-securite',
    label: 'Confidentialité & Sécurité',
    icon: Shield
  }
];
```

## 6. Sécuriser les API routes

### Exemple - Route de login:
```typescript
// src/app/api/auth/login/route.ts
import { secureApiRoute } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  return secureApiRoute(request, async (req) => {
    // Votre logique
  }, {
    rateLimit: 5,
    rateLimitId: 'login'
  });
}
```

### Rate limits par défaut:
- Login: 5 tentatives par 15 min
- Signup: 3 par 15 min
- Export GDPR: 2 par 15 min
- Suppression: 1 par 15 min
- API générique: 100 par 15 min

## 7. Utiliser le chiffrement

### Sauvegarder des données sensibles:
```typescript
import { SecureStorage, EncryptionService, AuditLog } from '@/lib/encryption-service';

// Sauvegarder
SecureStorage.setItem('sensitive_data', {
  email: 'user@example.com',
  phone: '+33612345678'
});

// Récupérer
const data = SecureStorage.getItem('sensitive_data');

// Logger une action
AuditLog.log('USER_CREATED', userId, { email, role });
```

## 8. Implémenter le Droit à l'oubli GDPR

```typescript
import { useSecureBackupSync } from '@/lib/secure-backup-sync-service';

const { deleteAllPersonalData } = useSecureBackupSync();

// Supprimer toutes les données (code de confirmation requis)
await deleteAllPersonalData('DELETE_ALL_DATA_CONFIRM');
```

## 9. Audit des données

```typescript
import { AuditLog } from '@/lib/encryption-service';

// Voir tous les logs
const logs = AuditLog.getLogs();

// Chaque log contient:
// - timestamp: quand
// - action: LOGIN_SUCCESS, DATA_MODIFIED, etc.
// - userId: qui
// - details: masqués pour les données sensibles
```

## 10. Certificat SSL/HTTPS

En production, forcer HTTPS:

```env
NEXT_PUBLIC_FORCE_HTTPS=true
```

Les headers `Strict-Transport-Security` seront activés automatiquement.

## 11. Tester la sécurité

```bash
# Vérifier les vulnérabilités
npm audit

# Fixer les problèmes
npm audit fix

# Tester le type
npm run typecheck

# Build de production
npm run build
```

## 12. Checklist de production

Avant le déploiement, vérifier:

- [ ] NEXT_PUBLIC_ENCRYPTION_KEY configué (.env.local)
- [ ] NODE_ENV=production
- [ ] Certificat SSL/TLS actif
- [ ] HSTS activé
- [ ] Rate limiting testé
- [ ] GDPR page accessible
- [ ] Logs d'audit configurés
- [ ] Sauvegardes chiffrées testées
- [ ] Authentification testée
- [ ] npm audit = 0 vulnérabilités critiques

## 13. Documentation utilisateur

Créer une page d'aide pour les utilisateurs:

```
Comment protéger mes données ?

1. Créer un mot de passe fort
   - Min 12 caractères
   - Majuscules, minuscules, chiffres, symboles
   
2. Vérifier les logs d'audit
   Menu → Confidentialité & Sécurité → Audit Logs

3. Télécharger mes données régulièrement
   Menu → Confidentialité & Sécurité → Télécharger mes données

4. Signaler un problème
   security@app-gestionnaire.com
```

## 14. Support & Ressources

- 📖 SECURITY.md - Guide complet de sécurité
- ✅ DEPLOYMENT-SECURITY-CHECKLIST.md - Checklist de prod
- 🔐 src/lib/encryption-service.ts - Code de référence
- 📚 https://owasp.org/www-project-top-ten/
- 🇫🇷 https://www.cnil.fr/fr/comprendre-le-rgpd

---

## Résumé des améliorations

| Aspect | Avant | Après |
|--------|-------|-------|
| Stockage des données | Clair en JSON | **Chiffré AES-256** |
| Authentification | Basique | **JWT + Tokens chiffrés** |
| Sauvegardes | Clair | **Chiffrées** |
| Rate limiting | Aucun | **Intégré** |
| Logs d'audit | Aucun | **Complet avec masquage** |
| GDPR | Non conforme | **Entièrement conforme** |
| API | Non sécurisées | **Validées + ratées** |
| Headers | Basiques | **CSP, HSTS, X-Frame** |

---

**Dernière mise à jour:** 8 novembre 2025  
**Version:** 2.0.0-secure
