# 🔒 Guide de Sécurité - App Gestionnaire

## 📋 Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Architecture de sécurité](#architecture-de-sécurité)
3. [Configuration](#configuration)
4. [GDPR Compliance](#gdpr-compliance)
5. [Bonnes pratiques](#bonnes-pratiques)
6. [Troubleshooting](#troubleshooting)

---

## Vue d'ensemble

**App Gestionnaire** implémente une sécurité complète et conforme GDPR pour protéger les données personnelles de vos utilisateurs.

### Niveaux de protection

| Composant | Niveau | Technologie |
|-----------|--------|------------|
| Données au repos | 🟢 Élevé | AES-256-GCM |
| Transit (HTTPS) | 🟢 Élevé | TLS 1.3 |
| Authentification | 🟢 Élevé | JWT + Supabase Auth |
| Sauvegardes | 🟢 Élevé | Chiffrement local |
| Audit | 🟢 Élevé | Logs immuables |

---

## Architecture de sécurité

### 1. Chiffrement des données (AES-256)

```typescript
import { EncryptionService, SecureStorage } from '@/lib/encryption-service';

// Sauvegarder les données chiffrées
SecureStorage.setItem('people', [
  { name: 'Jean', email: 'jean@example.com' },
  { name: 'Marie', email: 'marie@example.com' }
]);

// Récupérer les données déchiffrées automatiquement
const people = SecureStorage.getItem('people');
```

**Caractéristiques:**
- ✅ Chiffrement AES-256-GCM
- ✅ Clé dérivée par PBKDF2 (1000 itérations)
- ✅ Stockage sécurisé en localStorage
- ✅ Déchiffrement transparent à la lecture

### 2. Authentification sécurisée

```typescript
import { SecureAuthService, useSecureAuth } from '@/lib/secure-auth-service';

// Connexion
const { accessToken } = await SecureAuthService.signIn(
  'user@example.com',
  'Password@123'
);

// Vérification des permissions
const canEdit = await SecureAuthService.hasPermission('elder');

// Hook personnalisé
const { user, isAuthenticated, signOut } = useSecureAuth();
```

**Caractéristiques:**
- ✅ JWT avec signature HMAC-SHA256
- ✅ Tokens avec expiration (24h)
- ✅ Tokens stockés chiffrés
- ✅ Validation des mots de passe forts (12+ caractères)
- ✅ Gestion des sessions sécurisée

### 3. Sauvegardes chiffrées

```typescript
import { useSecureBackupSync } from '@/lib/secure-backup-sync-service';

const { createSecureBackup, restoreFromSecureBackup } = useSecureBackupSync();

// Créer une sauvegarde (chiffrée optionnellement avec mot de passe)
await createSecureBackup('password_optionnel');

// Restaurer la sauvegarde
await restoreFromSecureBackup(file, 'password_optionnel');
```

**Caractéristiques:**
- ✅ Chiffrement AES-256 de tous les fichiers de sauvegarde
- ✅ Protection optionnelle par mot de passe
- ✅ Sauvegarde de sécurité avant restauration
- ✅ Validation de l'intégrité

### 4. Audit Logging

```typescript
import { AuditLog } from '@/lib/encryption-service';

// Chaque action sensible est loggée
AuditLog.log('LOGIN_SUCCESS', user.email, {
  userId: user.id,
  loginTime: new Date()
});

// Récupérer les logs
const logs = AuditLog.getLogs();
```

**Caractéristiques:**
- ✅ Logs immuables et chiffrés
- ✅ Données sensibles masquées (emails, passwords)
- ✅ Timestamps précis
- ✅ Limité à 1000 entrées (rotation automatique)

### 5. Headers de sécurité

```typescript
// middleware-security.ts applique automatiquement
- Strict-Transport-Security (HSTS)
- Content-Security-Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection
- Referrer-Policy: strict-origin-when-cross-origin
```

---

## Configuration

### 1. Générer une clé de chiffrement

```bash
# Générer une clé sécurisée de 256 bits
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Résultat: 3a7f2b9d8e4c1a5f7b2d9e6a3c1f5b8a...
```

### 2. Configurer .env.local

```env
# Copier depuis .env.local.example et remplir les valeurs
NEXT_PUBLIC_ENCRYPTION_KEY=<votre-clé-générée>

# Supabase (public key uniquement)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Service role key (JAMAIS dans le client)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Installation des dépendances

```bash
npm install crypto-js tweetnacl @noble/hashes dotenv
```

### 4. Activer le middleware de sécurité

Le fichier `src/middleware-security.ts` est automatiquement chargé par Next.js.

```typescript
// Vérifie que tous les headers sont appliqués
export const middleware = (request: NextRequest) => {
  const response = NextResponse.next();
  return securityHeaders(response);
};
```

---

## GDPR Compliance

### Droits garantis

#### 1. Droit d'accès (Article 15)
```typescript
// Page: /moi/confidentialite-securite
// Les utilisateurs peuvent télécharger toutes leurs données en JSON
await exportPersonalData();
```

#### 2. Droit à l'oubli (Article 17)
```typescript
// Suppression complète de toutes les données personnelles
await deleteAllPersonalData('DELETE_ALL_DATA_CONFIRM');
```

#### 3. Droit à la portabilité (Article 20)
Les données sont exportées en format JSON standard pour transfert facile.

#### 4. Audit & Consentement
- ✅ Tous les accès aux données sont loggés
- ✅ Pas de traitement sans consentement
- ✅ Logs immuables et auditables

### Implémentation

Page dédiée: **`src/app/moi/confidentialite-securite/page.tsx`**

Fonctionnalités:
- 📥 **Téléchargement des données personnelles**
- 🗑️ **Suppression définitive avec confirmation**
- 📊 **Visualisation des logs d'audit**
- 🔐 **État de la sécurité**

---

## Bonnes pratiques

### Pour les développeurs

1. **Toujours utiliser SecureStorage**
   ```typescript
   // ✅ BON
   SecureStorage.setItem('sensitive', data);
   
   // ❌ MAUVAIS
   localStorage.setItem('sensitive', JSON.stringify(data));
   ```

2. **Logger les actions sensibles**
   ```typescript
   AuditLog.log('ACTION', userId, details);
   ```

3. **Valider les entrées**
   ```typescript
   if (!EncryptionService.validateEmail(email)) {
     throw new Error('Email invalide');
   }
   ```

4. **Utiliser les services sécurisés**
   ```typescript
   // ✅ BON: Utilise authentification sécurisée
   const { user } = useSecureAuth();
   ```

### Pour les administrateurs

1. **Gérer les clés de chiffrement**
   - Stocker `NEXT_PUBLIC_ENCRYPTION_KEY` dans un gestionnaire de secrets (Vault, AWS Secrets Manager)
   - Rotater les clés régulièrement
   - NE JAMAIS commiter dans Git

2. **Surveiller les logs**
   ```typescript
   // Vérifier régulièrement les logs d'audit
   const suspiciousLogs = auditLogs.filter(
     log => log.action === 'LOGIN_FAILED' || 
            log.action === 'UNAUTHORIZED_ACCESS'
   );
   ```

3. **Maintenir les dépendances**
   ```bash
   npm audit
   npm audit fix
   ```

4. **Tester la sécurité**
   ```bash
   npm run typecheck
   npm run build
   ```

### Pour les utilisateurs

1. **Créer un mot de passe fort**
   - ✅ Au minimum 12 caractères
   - ✅ Majuscules, minuscules, chiffres, symboles
   - ✅ Unique pour cette application

2. **Sauvegarder régulièrement**
   ```
   Menu → Confidentialité & Sécurité → Télécharger mes données
   ```

3. **Vérifier les logs**
   ```
   Menu → Confidentialité & Sécurité → Audit Logs
   ```

---

## Troubleshooting

### Erreur: "Impossible de déchiffrer les données"

**Cause:** La clé `NEXT_PUBLIC_ENCRYPTION_KEY` a changé

**Solution:**
```bash
# Régénérer la clé dans .env.local avec la même valeur
NEXT_PUBLIC_ENCRYPTION_KEY=<même-clé-qu'avant>
```

### Erreur: "Token invalide" lors de la connexion

**Cause:** Token expiré ou signature invalide

**Solution:**
1. Se déconnecter
2. Vider le cache du navigateur
3. Se reconnecter

### Données chiffrées non lisibles

**Cause:** localStorage corrompu ou clé différente

**Solution:**
```typescript
// Récupérer depuis le backup chiffré
await restoreFromSecureBackup(backupFile);
```

### Performance lente avec données volumineuses

**Solution:**
- Implémenter la pagination
- Utiliser le Web Workers pour le chiffrement
- Implémenter une mise en cache intelligente

---

## Ressources

- 📖 [RGPD - Guide complet](https://www.cnil.fr/fr/comprendre-le-rgpd)
- 🔐 [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- 💻 [Supabase Security](https://supabase.com/security)
- 🛡️ [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

## Support

Pour toute question de sécurité:
- 📧 **Email:** security@app-gestionnaire.com
- 🐛 **Bug:** GitHub Issues (marquer comme security)
- 💬 **Discussion:** Discussions de sécurité privées

---

**Dernière mise à jour:** 8 novembre 2025
**Version:** 2.0.0-secure
