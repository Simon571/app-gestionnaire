# Architecture Multi-Niveaux de l'Application

## 🏗️ Vue d'ensemble

L'application est structurée en **3 tiers distincts** avec des interfaces et permissions différentes :

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPER ADMIN                              │
│  (Vous - Gestion globale)                                   │
│  - Gestion des assemblées (abonnements, créations)          │
│  - Mises à jour et améliorations                            │
│  - Gestion financière                                       │
│  - Support et tickets                                       │
│  - Statistiques globales                                    │
│  - Configuration système                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼─────────────────┐  ┌────────▼──────────────────┐
│   ADMIN D'ASSEMBLÉE       │  │  APPLICATION MOBILE      │
│   (Clients payants)       │  │  (Utilisateurs/Téléph)   │
│   - Gestion utilisateurs  │  │                          │
│   - Tâches & assignations │  │  - Recevoir tâches       │
│   - Rapports             │  │  - Envoyer rapports      │
│   - Paramètres assemblée │  │  - Notifications         │
│   - Statistiques locales  │  │  - Statut professionnel  │
└──────────────────────────┘  └─────────────────────────┘
```

---

## 📱 Application 1 : Admin d'Assemblée (WEB - Actuelle)

**Localisation** : `src/app/*` (sauf super-admin)

### Rôles & Permissions
- **Admin Principal** : Contrôle total de l'assemblée
- **Assistant** : Gestion des tâches, utilisateurs
- **Utilisateur** : Consultation uniquement

### Modules à développer
1. **Dashboard** - Vue d'ensemble
2. **Tâches** ✅ (existant)
3. **Abonnement** ✅ (existant)
4. **Paramètres** ✅ (existant)
5. **Notifications** (à créer)
6. **Rapports** (à créer)
7. **Gestion Utilisateurs** (à créer)
8. **Statistiques** (à créer)

---

## 🔐 Application 2 : Super Admin (Séparé)

**Localisation** : `/super-admin` ou domaine séparé

### Responsabilités
1. **Gestion des Assemblées**
   - Créer/modifier/suspendre assemblée
   - Gérer les plans d'abonnement
   - Suivre les paiements

2. **Gestion des Utilisateurs (Téléphone)**
   - Lister tous les utilisateurs des téléphones
   - Créer/bloquer/supprimer utilisateurs
   - Réinitialiser mots de passe

3. **Mises à Jour & Déploiement**
   - Gérer les versions
   - Planifier les mises à jour
   - Rollback si nécessaire

4. **Statistiques Globales**
   - Assemblées actives
   - Utilisateurs totaux
   - Revenus/paiements
   - Utilisation de l'API

5. **Configuration Système**
   - Prix des plans
   - Limites de ressources
   - Activation/désactivation de fonctionnalités

6. **Support & Tickets**
   - Voir tous les tickets
   - Répondre aux demandes
   - Historique des incidents

---

## 📲 Application 3 : Mobile (Phase 2)

**Type** : React Native / Flutter

### Responsabilités
- **Recevoir tâches** depuis Admin
- **Envoyer rapports** à Admin
- **Notifications en temps réel**
- **Profil utilisateur**
- **Gestion offline-first**

---

## 🗂️ Structure des répertoires

### Actuelle
```
src/app/
├── moi/
│   ├── taches/ ✅
│   ├── abonnement/ ✅
│   ├── parametres/ ✅
│   ├── notifications/ (à créer)
│   ├── rapports/ (à créer)
│   └── gestion-utilisateurs/ (à créer)
├── layout.tsx
└── ...autres modules
```

### À ajouter
```
super-admin/
├── layout.tsx
├── page.tsx (Dashboard Super Admin)
├── assemblees/
│   ├── page.tsx (Liste assemblées)
│   ├── [id]/page.tsx (Détails assemblée)
│   └── nouveau/page.tsx
├── utilisateurs/
│   ├── page.tsx (Liste utilisateurs téléphone)
│   ├── [id]/page.tsx
│   └── creer/page.tsx
├── mises-a-jour/
│   ├── page.tsx (Gestion versions)
│   └── deployer/page.tsx
├── statistiques/
│   └── page.tsx
├── configuration/
│   └── page.tsx
├── support/
│   └── page.tsx
└── authentification/
    ├── super-login/ (Super Admin login)
    └── gestion-sessions/
```

---

## 🔑 Système de Permissions

### Niveaux
```typescript
ROLES = {
  SUPER_ADMIN: 'super_admin',           // Vous
  ADMIN_ASSEMBLY: 'admin_assembly',     // Admin d'assemblée
  ASSISTANT: 'assistant_assembly',      // Assistant
  USER: 'user_assembly',                // Utilisateur
  PHONE_USER: 'phone_user'              // Utilisateur mobile
}
```

### Permissions par rôle

| Permission | Super Admin | Admin Assem | Assistant | User | Phone |
|-----------|------------|-----------|-----------|------|-------|
| Créer assemblée | ✅ | ❌ | ❌ | ❌ | ❌ |
| Gérer utilisateurs téléphone | ✅ | ❌ | ❌ | ❌ | ❌ |
| Créer utilisateurs assem | ✅ | ✅ | ❌ | ❌ | ❌ |
| Gestion tâches | ❌ | ✅ | ✅ | ❌ | ✅ |
| Voir rapports | ✅ | ✅ | ✅ | ❌ | ❌ |
| Envoyer rapports | ❌ | ❌ | ❌ | ❌ | ✅ |
| Recevoir tâches | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🔐 Authentification

### Flux d'accès

```
1. LOGIN PAGE (/ ou /super-admin/login)
   ↓
2. DÉTECTION DU RÔLE (JWT token avec role)
   ├─→ Super Admin → Redirect /super-admin
   ├─→ Admin Assemblée → Redirect /dashboard
   ├─→ Utilisateur Assem → Redirect /moi
   └─→ Téléphone → Redirect /mobile (Phase 2)

3. PROTECTION DES ROUTES
   - Middleware qui vérifie le rôle
   - Redirection si non autorisé
```

### Token JWT
```json
{
  "sub": "user_id",
  "email": "admin@assembly.com",
  "role": "admin_assembly",
  "assemblyId": "assembly_123",
  "permissions": ["manage_users", "manage_tasks"],
  "iat": 1699000000,
  "exp": 1699086400
}
```

---

## 📊 Base de données (Supabase)

### Tables principales

```sql
-- Assemblées
assemblies (
  id, name, country, address,
  plan_id, status, created_at, expires_at
)

-- Utilisateurs Assemblée
assembly_users (
  id, assembly_id, email, role,
  permissions[], created_at
)

-- Utilisateurs Téléphone
phone_users (
  id, assembly_id, name, phone,
  assigned_tasks[], status, created_at
)

-- Tâches
tasks (
  id, assembly_id, title, description,
  assigned_to, status, due_date, reports[]
)

-- Rapports
reports (
  id, task_id, submitted_by, content,
  submitted_at, status
)

-- Abonnements
subscriptions (
  id, assembly_id, plan_type, price,
  start_date, end_date, status
)

-- Super Admin Logs
admin_logs (
  id, action, performed_by,
  target_entity, changes[], timestamp
)
```

---

## 🚀 Phase de développement

### Phase 1 : Admin d'Assemblée (Actuelle)
- ✅ Tâches
- ✅ Abonnement
- ✅ Paramètres
- ⏳ Notifications
- ⏳ Rapports
- ⏳ Gestion Utilisateurs
- ⏳ Statistiques
- ⏳ Dashboard

### Phase 1B : Super Admin (À créer)
- Gestion Assemblées
- Gestion Utilisateurs Téléphone
- Statistiques Globales
- Mises à Jour
- Support

### Phase 2 : Application Mobile
- Interface React Native
- Synchronisation offline-first
- Notifications push

---

## 🔒 Sécurité Multi-Niveaux

1. **Authentification**
   - Super Admin : Double authentification (2FA)
   - Admin : JWT + Refresh token
   - Mobile : JWT sécurisé

2. **Autorisation**
   - Middleware RBAC sur toutes les routes
   - Audit logging pour Super Admin
   - Isolation des données par assemblée

3. **Communication**
   - HTTPS obligatoire
   - Rate limiting par rôle
   - Validation des requêtes API

---

## 📋 Prochaines étapes

1. **Valider cette architecture** avec vous
2. **Créer les routes de Super Admin**
3. **Implémenter l'authentification multi-rôles**
4. **Ajouter la gestion des utilisateurs**
5. **Développer les notifications**
6. **Créer les rapports**

---

**Confirmez-vous cette architecture avant de commencer l'implémentation ?**
