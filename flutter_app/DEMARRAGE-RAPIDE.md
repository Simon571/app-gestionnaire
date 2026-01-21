# DÉMARRAGE RAPIDE - Après les Corrections

## 🚀 Lancer l'Application

### 1. Démarrer le Serveur Next.js

```powershell
cd C:\Users\Public\Documents\app-gestionnaire
npm run dev
```

**Vérifiez que vous voyez** :
```
✓ Ready in X.XXs
- Local:        http://localhost:3000
- Network:      http://192.168.169.152:3000
```

> ⚠️ **Important** : Notez l'adresse "Network" - c'est celle que vous utiliserez dans l'app mobile.

### 2. Lancer l'Application Flutter

**Option A : Sur votre téléphone Android (recommandé)**
```powershell
cd C:\Users\Public\Documents\app-gestionnaire\flutter_app
flutter run
```

**Option B : Sur émulateur**
```powershell
cd C:\Users\Public\Documents\app-gestionnaire\flutter_app
flutter run
```

### 3. Configurer l'URL du Serveur

**À faire UNE SEULE FOIS dans l'app mobile :**

1. Ouvrir le **menu** (☰ en haut à gauche)
2. Chercher **"Paramètres serveur"** ou **"Developer Settings"**
3. Entrer l'adresse Network du serveur : `http://192.168.169.152:3000`
4. Cliquer sur **"Save"**
5. Vérifier que "Actuel" affiche la bonne adresse

## ✅ Tests de Validation

### Test 1 : Envoi depuis Assembly

1. **Page Assemblée** (icône 🏠)
2. **Carte "Rapport"**
3. Remplir les données du mois en cours
4. **"Confirmer l'envoi"**
5. ✅ Message de succès attendu
6. **Page MOI** (icône 👤)
7. **Section "Proclamateurs"**
8. Ouvrir votre groupe
9. ✅ Votre ligne doit être **cochée** ☑️

### Test 2 : Envoi pour un autre proclamateur

1. **Page MOI**
2. **Section "Proclamateurs"**
3. Ouvrir un groupe (si vous êtes surveillant)
4. Cliquer sur l'**icône du rapport** d'un membre
5. Remplir les données
6. **"Envoyer pour lui"**
7. ✅ Message de succès
8. ✅ Case cochée pour ce membre

## 🔍 Vérifier que tout fonctionne

### Indicateurs de succès :

**✅ Serveur** :
- Console affiche "Ready"
- Accessible depuis le navigateur du téléphone

**✅ Application** :
- URL configurée dans "Paramètres serveur"
- Connexion réussie (pas de message "enregistré en local")
- Synchronisation Assembly ↔ MOI fonctionne

**✅ Logs (si vous utilisez flutter run)** :
```
StorageService: ✓ preaching report sent for 2026-01
```

## ❌ En cas de problème

### Le rapport ne s'envoie pas (message "enregistré en local")

**Vérifications rapides** :

1. **Connexion réseau** :
   - Téléphone et PC sur le **même Wi-Fi** ?
   - Ouvrir `http://192.168.169.152:3000` dans le navigateur du téléphone
   - La page web doit s'afficher

2. **Configuration** :
   - URL correcte dans "Paramètres serveur" ?
   - Serveur Next.js démarré ?
   - L'adresse IP n'a pas changé ?

3. **Pare-feu Windows** :
   ```powershell
   # Exécuter en tant qu'administrateur
   New-NetFirewallRule -DisplayName "Next.js Dev Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
   ```

### Le bouton "Envoyer pour lui" ne fonctionne pas

**Vérifications** :

1. Vous avez un PIN valide ?
2. Vous êtes connecté ?
3. Vous êtes surveillant du groupe ou ancien ?
4. Le serveur répond ?

### La synchronisation Assembly → MOI ne fonctionne pas

**Vérifications** :

1. L'envoi depuis Assembly a réussi ? (message vert)
2. Attendez 1-2 secondes et rafraîchissez (tirez vers le bas)
3. Vérifiez que c'est bien le mois en cours

## 📖 Documentation Complète

- **Configuration réseau** : [CONFIG-API-RESEAU.md](./CONFIG-API-RESEAU.md)
- **Résumé des corrections** : [CORRECTIONS-RAPPORTS.md](./CORRECTIONS-RAPPORTS.md)

## 🎯 Modifications Principales

### Ce qui a changé :

1. ✅ **Synchronisation automatique** : Envoyer depuis Assembly coche automatiquement dans MOI
2. ✅ **Bouton "Envoyer pour lui"** : Fonctionne correctement avec vérification du PIN
3. ✅ **Logs améliorés** : Messages clairs pour identifier les problèmes
4. ✅ **Serveur réseau** : Écoute sur toutes les interfaces (0.0.0.0)

### Ce qui n'a PAS changé :

- L'interface utilisateur
- La logique métier
- Les données existantes
- Les autres fonctionnalités

## 💡 Conseils

1. **Démarrez toujours le serveur en premier**
2. **Vérifiez l'adresse IP** si elle change (après redémarrage du PC)
3. **Utilisez les logs** (`flutter run`) pour déboguer
4. **Consultez CONFIG-API-RESEAU.md** pour les problèmes réseau

---

✅ **Tout devrait fonctionner maintenant !** 🎉

Si vous avez encore des problèmes, consultez [CONFIG-API-RESEAU.md](./CONFIG-API-RESEAU.md) pour un guide de dépannage complet.
