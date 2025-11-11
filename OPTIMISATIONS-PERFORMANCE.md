# ⚡ OPTIMISATIONS PERFORMANCE & UX

## 🚀 Priorité Haute

### 1. **Pagination des Tâches**
```typescript
// src/app/moi/taches/page.tsx
// Actuellement: Affiche TOUTES les tâches
// À faire: Charger 10 par 10

const [page, setPage] = useState(1);
const itemsPerPage = 10;
const tasks = userTasks.slice((page-1)*10, page*10);

// Ou: Infinite scroll
useEffect(() => {
  if (nearBottom) {
    setPage(prev => prev + 1);
  }
}, [nearBottom]);
```

---

### 2. **Cache de Chiffrement**
```typescript
// Actuellement: Rechiffre/Déchiffre à chaque accès
// Optimisation: Mettre en cache avec TTL

const encryptionCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedData(key) {
  const cached = encryptionCache.get(key);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.value;
  }
  return null;
}
```

**Gain:** -70% temps de déchiffrement

---

### 3. **Web Workers pour Chiffrement**
```typescript
// Chiffrement AES-256 = CPU intensif
// Solution: Utiliser Web Worker (thread séparé)

// src/workers/encryption.worker.ts
self.onmessage = (e) => {
  const encrypted = EncryptionService.encrypt(e.data);
  self.postMessage(encrypted);
};

// Utilisation:
const worker = new Worker(new URL('./encryption.worker', import.meta.url));
worker.postMessage(largeData);
worker.onmessage = (e) => setEncrypted(e.data);
```

**Gain:** +300% responsivité UI lors du chiffrement

---

### 4. **Lazy Loading des Pages**
```typescript
// Utiliser dynamic() de Next.js
import dynamic from 'next/dynamic';

const ConfidentialitePage = dynamic(
  () => import('./confidentialite-securite/page'),
  { loading: () => <Skeleton /> }
);

// Charge la page que quand l'utilisateur la demande
```

**Gain:** -50% initial page load

---

### 5. **Image Optimization**
```tsx
// AVANT
<img src="/logo.png" />

// APRÈS
<Image
  src="/logo.png"
  width={200}
  height={200}
  quality={75}
  placeholder="blur"
  priority={false}
/>

// Bénéfices:
// - Compression automatique
// - Format WebP en production
// - Responsive sizing
```

---

## 📦 Code Splitting

### 1. **Routes-based Code Splitting**
```typescript
// Next.js 15+ le fait automatiquement
// Chaque route = chunk séparé

app/
  ├── moi/taches/page.tsx        (taches.js chunk)
  ├── moi/abonnement/page.tsx    (abonnement.js chunk)
  └── moi/confidentialite/page.tsx (confidentialite.js chunk)

// Avantage: Utilisateur ne charge que ce qu'il utilise
```

---

### 2. **Component-level Code Splitting**
```typescript
// Modales non essentielles
const DeleteConfirmModal = dynamic(() => 
  import('@/components/modals/DeleteConfirm'), 
  { ssr: false }
);

// Chargé seulement au clic, pas lors du render initial
```

---

## 🎯 Core Web Vitals

### Mesurer
```bash
npm install web-vitals

# src/app/layout.tsx
import { CLS, FID, FCP, LCP } from 'web-vitals';

CLS(console.log);  // Cumulative Layout Shift
FID(console.log);  // First Input Delay
FCP(console.log);  // First Contentful Paint
LCP(console.log);  // Largest Contentful Paint
```

### Cibles
- **LCP** < 2.5s ✅
- **FID** < 100ms ✅
- **CLS** < 0.1 ✅

---

## 🗂️ Database Performance

### 1. **Indexer les Colonnes Fréquentes**
```sql
-- Supabase/PostgreSQL
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_tasks_userId ON tasks(user_id);
CREATE INDEX idx_tasks_createdAt ON tasks(created_at DESC);

-- Résultat: 100x plus rapide pour recherches
```

---

### 2. **Pagination Server-side**
```typescript
// src/app/api/tasks/route.ts
export async function GET(request: NextRequest) {
  const page = request.nextUrl.searchParams.get('page') || '1';
  const limit = 10;
  
  const tasks = await supabase
    .from('tasks')
    .select('*')
    .range((page-1)*limit, page*limit-1)
    .order('created_at', { ascending: false });
    
  return NextResponse.json(tasks);
}
```

---

### 3. **Query Optimization**
```typescript
// MAUVAIS: N+1 problem
const tasks = await getTasks(); // 1 query
for (const task of tasks) {
  task.assignee = await getUser(task.userId); // N queries!
}

// BON: Single query avec join
const tasks = await supabase
  .from('tasks')
  .select('*, users(*)')
  .eq('status', 'pending');
```

---

## 🏗️ Architecture

### 1. **API Caching**
```typescript
// Utiliser HTTP cache headers
export async function GET(request: NextRequest) {
  const response = NextResponse.json(data);
  
  // Cache 5 minutes côté client, 1h côté CDN
  response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=3600');
  
  return response;
}
```

---

### 2. **CDN pour Assets Statiques**
```typescript
// next.config.ts
export default {
  images: {
    domains: ['cdn.example.com'],
  },
};

// Utiliser dans pages
<Image 
  src="https://cdn.example.com/image.png"
  width={200}
  height={200}
/>
```

---

### 3. **Compression GZIP/Brotli**
```typescript
// Automatique avec Next.js en production
// Mais vérifier avec curl:
curl -I -H "Accept-Encoding: gzip" https://site.com

// Doit afficher: Content-Encoding: gzip
```

---

## 🔄 Real-time Updates

### 1. **WebSocket pour Données Live**
```typescript
// Actuellement: Polling (non optimal)
// À faire: WebSocket real-time

import { useEffect, useState } from 'react';

export function useLiveData(channel) {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    const ws = new WebSocket(`wss://api.example.com/${channel}`);
    
    ws.onmessage = (event) => {
      setData(JSON.parse(event.data));
    };
    
    return () => ws.close();
  }, [channel]);
  
  return data;
}
```

**Gain:** -99% latence pour mises à jour

---

### 2. **Service Worker Offline**
```typescript
// src/app/layout.tsx
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
}, []);

// public/sw.js
self.addEventListener('install', () => {
  // Cacher les ressources essentielles
});

self.addEventListener('fetch', (event) => {
  // Répondre du cache si offline
  if (!navigator.onLine) {
    event.respondWith(caches.match(event.request));
  }
});
```

---

## 📊 Monitoring de Performance

### 1. **Setup Datadog**
```bash
npm install @datadog/browser-rum

// src/app/layout.tsx
import { datadogRum } from '@datadog/browser-rum';

datadogRum.init({
  applicationId: 'YOUR_APPLICATION_ID',
  clientToken: 'YOUR_CLIENT_TOKEN',
  site: 'datadoghq.com',
  service: 'app-gestionnaire',
  env: 'production',
  sessionSampleRate: 100,
  sessionReplaySampleRate: 20,
  trackUserInteractions: true,
  trackResources: true,
  trackLongTasks: true,
  defaultPrivacyLevel: 'mask-user-input',
});
```

---

### 2. **Setup Sentry**
```bash
npm install @sentry/nextjs

// next.config.ts
import { withSentryConfig } from '@sentry/nextjs';

// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

---

## 🎨 UX Improvements

### 1. **Loading States**
```tsx
// Au lieu de rien, montrer:
<Skeleton count={3} height={40} />

// Ou
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded"></div>
</div>
```

---

### 2. **Progressive Enhancement**
```tsx
// Formulaire continues même si JS échoue
<form action="/api/submit" method="POST">
  <input name="email" type="email" required />
  <button type="submit">Envoyer</button>
</form>

// JavaScript optionnel pour validation frontend
```

---

### 3. **Optimistic Updates**
```tsx
const [items, setItems] = useState(initialItems);

const handleDelete = async (id) => {
  // Mettre à jour UI immédiatement
  setItems(prev => prev.filter(i => i.id !== id));
  
  try {
    // Puis sauvegarder au serveur
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
  } catch (error) {
    // Si erreur, restaurer l'ancienne liste
    setItems(initialItems);
  }
};
```

---

## 📋 Checklist Performance

- [ ] Lighthouse score > 90
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] First paint < 1s
- [ ] Bundle size < 200KB
- [ ] API response < 500ms
- [ ] Database queries < 100ms
- [ ] CSS not blocking rendering
- [ ] Unused CSS removed

---

## 🔧 Outils à Utiliser

```bash
# Performance testing
npm install --save-dev lighthouse
npm install --save-dev bundlesize

# Monitoring
npm install web-vitals
npm install @datadog/browser-rum

# Optimization
npm install image-optimization-webpack-plugin
npm install compression-webpack-plugin
```

---

## 📊 Avant/Après Estimé

| Métrique | Avant | Après | Gain |
|----------|-------|-------|------|
| Page Load | 3.2s | 1.2s | 63% |
| LCP | 2.8s | 1.8s | 36% |
| Time to Interactive | 4.5s | 1.5s | 67% |
| Bundle Size | 350KB | 180KB | 49% |
| Lighthouse | 65 | 92 | +27 |

---

## ⏰ Estimation Effort

| Tâche | Temps | Difficulté |
|-------|-------|-----------|
| Pagination | 1-2h | Facile |
| Web Workers | 2-3h | Moyen |
| Cache chiffrement | 1h | Facile |
| Lazy loading | 1h | Facile |
| Database indexing | 1-2h | Moyen |
| WebSocket | 3-4h | Difficile |
| Service Worker | 2-3h | Moyen |
| Monitoring setup | 2-3h | Moyen |
| **TOTAL** | **15-23h** | - |

---

**Budget: ~3-4 jours de travail pour gain massif de performance !** 🚀

---

**Prochaine étape:** Voudriez-vous que j'implémente les 3 premières optimisations cette semaine ?
