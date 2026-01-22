# 🚨 STATUT: BUILD MSI CRÉÉ - MAIS PAS ENCORE FONCTIONNEL

## ✅ CE QUI EST FAIT

1. **MSI généré avec succès** 
   - Fichier: `src-tauri\target\release\bundle\msi\Gestionnaire d'Assemblée_1.0.0_x64_en-US.msi`
   - Taille: 35.53 MB
   - Configuration: Frontend statique (export Next.js)

2. **Architecture hybride implémentée**
   - Desktop: Frontend statique local
   - Backend: Doit pointer vers Vercel
   - `.env.tauri` créé avec `NEXT_PUBLIC_API_URL`

3. **API client créé**
   - Nouveau fichier: `src/lib/api-client.ts`
   - Fonction `getApiUrl()`: détecte Tauri et redirige vers Vercel
   - Fonction `apiFetch()`: wrapper autour de fetch

4. **PublisherSyncFetch modifié**
   - Utilise maintenant `getApiUrl()` pour router vers Vercel
   - Dans Tauri: appelle `https://app-gestionnaire.vercel.app/api/...`
   - Sur Web: appelle `/api/...` (relatif)

---

## ❌ CE QUI NE FONCTIONNE PAS ENCORE

### Problème Principal: fetch() Direct

L'application utilise **40+ routes API** avec des appels `fetch('/api/...')` directs:

```typescript
// Exemple dans src/context/people-context.tsx:
await fetch('/api/families')          // ❌ Appelle tauri://localhost/api/families
await fetch('/api/publisher-app/...')  // ❌ Appelle tauri://localhost/api/...
```

**Dans Tauri**, ces chemins relatifs pointent vers `tauri://localhost` au lieu de Vercel.

### Fichiers à Modifier

D'après `grep_search`, voici les fichiers avec `fetch('/api/...') `:

1. **src/context/people-context.tsx** (9 occurrences)
   - `/api/publisher-app/users/export`
   - `/api/families`
   - `/api/preaching-groups`
   - `/api/publisher-app/auto-sync`
   - `/api/sync-activity`
   - `/api/publisher-app/create-sync-job`

2. **src/components/vcm/WeeklyProgramVCM.tsx** (2 occurrences)
   - `/api/vcm/${week.startDate}/assign/clear`
   - `/api/vcm/${week.startDate}`

3. **src/components/vcm/weekly-program.tsx** (2 occurrences)
   - `/api/vcm/${weekId}/assignments`

4. **src/app/reports/page.tsx**
   - `/api/attendance`

5. **src/app/responsabilites/page.tsx** (2 occurrences)
   - `/api/responsibilities`

**Total estimé: 15-20 fichiers avec 40+ appels fetch à modifier**

---

## 🔧 SOLUTIONS

### Option 1: Modifier Tous les fetch() (Recommandée)

**Avantage**: Propre, maintenable, testé
**Inconvénient**: Beaucoup de fichiers à modifier

**Étapes**:
1. Exporter `apiFetch` depuis `src/lib/api-client.ts`
2. Dans chaque fichier:
   ```typescript
   // Avant:
   await fetch('/api/families')
   
   // Après:
   import { apiFetch } from '@/lib/api-client';
   await apiFetch('api/families')
   ```

### Option 2: Polyfill Global fetch (Risqué)

**Avantage**: Un seul changement
**Inconvénient**: Peut casser des fetch externes (images, assets, etc.)

Créer `src/app/layout.tsx` avec:
```typescript
if (typeof window !== 'undefined' && (window as any).__TAURI__) {
  const originalFetch = window.fetch;
  window.fetch = (input, init) => {
    if (typeof input === 'string' && input.startsWith('/api/')) {
      return originalFetch(getApiUrl(input), init);
    }
    return originalFetch(input, init);
  };
}
```

### Option 3: Proxy Tauri (Non recommandé)

Créer un serveur proxy local dans Rust qui redirige vers Vercel.
**Trop complexe pour le bénéfice.**

---

## 📝 PLAN D'ACTION RECOMMANDÉ

### Phase 1: Modifier les fetch (2-3h)

1. **Créer un script de recherche/remplacement**:
   ```powershell
   # Trouver tous les fetch('/api/')
   Select-String -Path "src\**\*.tsx" -Pattern "fetch\('/api/" -CaseSensitive
   ```

2. **Remplacer manuellement** (ou avec script):
   - Import `apiFetch` en haut
   - Remplacer `fetch('/api/...` par `apiFetch('api/...`
   - Remplacer `fetch(\`/api/...` par `apiFetch(\`api/...`

3. **Rebuild**:
   ```powershell
   npm run tauri:build:ci
   ```

### Phase 2: Tester le MSI

1. **Installer le MSI**
2. **Ouvrir DevTools** (F12 dans l'app)
3. **Vérifier les requêtes** dans l'onglet Network:
   - Doivent pointer vers `https://app-gestionnaire.vercel.app/api/...`
   - Pas vers `tauri://localhost/api/...`

4. **Tester les fonctionnalités**:
   - Connexion
   - Liste des proclamateurs
   - Synchronisation mobile
   - Rapports

### Phase 3: Déployer sur Vercel

```powershell
vercel --prod
```

### Phase 4: Publier sur GitHub Release

```powershell
# Calculer SHA-256
Get-FileHash "src-tauri\target\release\bundle\msi\*.msi" -Algorithm SHA256

# Créer release sur GitHub
# Upload MSI
# Ajouter le hash dans la description
```

### Phase 5: Configurer le Download Button

Sur Vercel Dashboard:
```
NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL = https://github.com/USERNAME/REPO/releases/download/v1.0.0/Gestionnaire.dAssemblee_1.0.0_x64_en-US.msi
```

Redéployer:
```powershell
vercel --prod
```

---

## 🚀 COMMANDE RAPIDE POUR CONTINUER

```powershell
# 1. Trouver tous les fetch à modifier
Select-String -Path "src\**\*.{ts,tsx}" -Pattern "fetch\(['\`]/api/" | Select-Object Path, LineNumber, Line

# 2. Compter les occurrences
(Select-String -Path "src\**\*.{ts,tsx}" -Pattern "fetch\(['\`]/api/").Count
```

---

## ⏱️ ESTIMATION

- **Modifier tous les fetch**: 2-3 heures
- **Rebuild + Test**: 30 minutes
- **Deploy Vercel**: 5 minutes
- **GitHub Release**: 10 minutes
- **Test final**: 1 heure

**TOTAL**: ~4-5 heures de travail

---

## 📞 ALTERNATIVE: TEST RAPIDE

Pour tester l'architecture **MAINTENANT** sans modifier tous les fetch:

1. **Tester uniquement PublisherSyncFetch**:
   - Déjà modifié ✅
   - Ouvrir l'app
   - Aller dans "Publisher App"
   - Vérifier que les requêtes vont vers Vercel

2. **Si ça marche** → confirme que l'architecture est bonne
3. **Continuer** avec la modification des autres fetch

---

## 🎯 PROCHAINE ÉTAPE IMMÉDIATE

**CHOIX 1**: Modifier tous les fetch maintenant (recommandé pour finir proprement)
**CHOIX 2**: Tester le MSI actuel pour confirmer l'architecture (rapide mais incomplet)

**JE RECOMMANDE**: Option 1 - Finissons le travail complètement! 💪
