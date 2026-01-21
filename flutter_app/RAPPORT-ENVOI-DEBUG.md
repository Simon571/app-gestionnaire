# Configuration de l'envoi des rapports - App Flutter

## 🔍 Problème rencontré

Lorsque vous cliquez sur **"Envoyer le rapport"** dans l'application Flutter, le bouton ne semble pas réagir ou affiche un message d'erreur.

## ✅ Solutions apportées

### 1. Indicateur de chargement ajouté
- Un **spinner** s'affiche maintenant pendant l'envoi
- Le bouton est désactivé pendant le traitement
- Feedback visuel clair pour l'utilisateur

### 2. Messages d'erreur améliorés
L'application affiche maintenant des messages clairs :

- **✅ Succès** : "Rapport envoyé au secrétariat avec succès !"
- **⚠️ Avertissement** : Explique pourquoi l'envoi n'a pas fonctionné
- **💾 Sauvegarde locale** : Le rapport est TOUJOURS enregistré localement, même si l'envoi échoue

### 3. Causes possibles d'échec d'envoi

#### A. Serveur Next.js non démarré ⭐ **Cause la plus probable**
L'application Flutter envoie les rapports à votre application web Next.js.

**Solution** :
```powershell
# Démarrer le serveur Next.js
cd C:\Users\Public\Documents\app-gestionnaire
npm run dev
# Le serveur démarre sur http://localhost:3000
```

#### B. Configuration API manquante
L'app Flutter ne sait pas où envoyer les données.

**Vérifier** :
1. Ouvrez l'app Flutter
2. Menu → Paramètres
3. Vérifiez que **"URL de l'API"** est remplie :
   - Pour émulateur : `http://10.0.2.2:3000`
   - Pour téléphone réel : `http://VOTRE_IP:3000` (ex: `http://192.168.1.10:3000`)

**Trouver votre IP locale** :
```powershell
ipconfig
# Cherchez "IPv4 Address" dans la section de votre réseau Wi-Fi
```

#### C. Pas de connexion Internet
L'application nécessite une connexion pour envoyer au serveur.

**Vérifier** :
- Le téléphone/émulateur a accès à Internet
- Le serveur Next.js est accessible depuis le téléphone

#### D. PIN manquant
L'utilisateur n'a pas de PIN configuré.

**Solution** :
1. Allez dans l'application web (Next.js)
2. Section **Utilisateurs**
3. Modifiez l'utilisateur pour ajouter un PIN

## 🎯 Workflow normal d'envoi de rapport

### Étape 1 : Utilisateur mobile
1. Ouvre l'app Flutter
2. Va dans **"Activité de prédication"**
3. Ajoute ses heures, CB, crédit
4. Clique **"Envoyer le rapport"**

### Étape 2 : Application Flutter
1. Affiche le spinner de chargement
2. **Sauvegarde localement** les données (toujours réussi)
3. Tente d'envoyer au serveur Next.js via API

### Étape 3 : Serveur Next.js
1. Reçoit le rapport à `/api/publisher-app/activity`
2. Vérifie le PIN de l'utilisateur
3. Enregistre dans `data/publisher-preaching.json`
4. Retourne succès ou erreur

### Étape 4 : Feedback utilisateur
- ✅ Si serveur répond : "Rapport envoyé avec succès"
- ⚠️ Si serveur inaccessible : Message d'avertissement + données sauvegardées localement
- 🔄 Synchronisation automatique : L'app réessaiera automatiquement toutes les 30 secondes

## 📋 Checklist de dépannage

Quand l'envoi ne fonctionne pas, vérifiez dans l'ordre :

1. ✅ Le serveur Next.js est-il démarré ?
   ```powershell
   cd C:\Users\Public\Documents\app-gestionnaire
   npm run dev
   ```

2. ✅ L'URL de l'API est-elle configurée dans l'app Flutter ?
   - Menu → Paramètres → URL de l'API

3. ✅ Le téléphone peut-il accéder au serveur ?
   - Ouvrez un navigateur sur le téléphone
   - Allez à `http://VOTRE_IP:3000`
   - Vous devriez voir l'application web

4. ✅ L'utilisateur a-t-il un PIN ?
   - Vérifiez dans l'app web → Utilisateurs

5. ✅ Y a-t-il une connexion Internet ?

## 🔧 Configuration recommandée

### Pour le développement / tests
```
Application Web Next.js : http://localhost:3000
Application Flutter (émulateur) : http://10.0.2.2:3000
Application Flutter (téléphone réel) : http://192.168.1.X:3000
```

### Pour la production
Déployez le serveur Next.js sur :
- Railway (gratuit)
- Vercel (gratuit)
- Votre propre serveur

Puis configurez l'URL dans l'app Flutter :
```
https://votre-app.railway.app
```

## 💡 Astuce

**Le rapport est TOUJOURS sauvegardé localement**, même si l'envoi au serveur échoue. Cela signifie :
- L'utilisateur ne perd jamais ses données
- Quand le serveur redevient accessible, la synchronisation automatique enverra les rapports en attente
- Pas besoin de ressaisir les données

## ❓ Questions fréquentes

### Q: "Le bouton ne fait rien quand je clique"
**R:** Avec les modifications, vous devriez maintenant voir :
1. Un spinner qui apparaît
2. Puis soit un message de succès, soit un message d'erreur explicite

### Q: "Message : serveur indisponible"
**R:** Démarrez le serveur Next.js avec `npm run dev`

### Q: "L'envoi réussit mais je ne vois rien dans l'app web"
**R:** Vérifiez le fichier `data/publisher-preaching.json` - les données y sont stockées

### Q: "Comment savoir si mon rapport est bien envoyé ?"
**R:** 
- L'icône dans la carte du rapport passe de 🟠 (orange) à 🟢 (vert)
- Message de confirmation affiché
- Dans l'app web : le rapport apparaît dans "Activité de prédication"

## 🚀 Test rapide

Pour tester immédiatement :

```powershell
# Terminal 1 : Démarrer le serveur
cd C:\Users\Public\Documents\app-gestionnaire
npm run dev

# Terminal 2 : Lancer l'app Flutter
cd C:\Users\Public\Documents\app-gestionnaire\flutter_app
flutter run
```

Puis dans l'app :
1. Connectez-vous avec un utilisateur qui a un PIN (ex: Simon, PIN 6003)
2. Ajoutez des heures dans "Activité de prédication"
3. Cliquez "Envoyer le rapport"
4. Vous devriez voir le spinner, puis le message de succès

## 📞 Support

Si le problème persiste, vérifiez :
- Les logs du serveur Next.js (dans le terminal où vous avez fait `npm run dev`)
- Les logs de l'app Flutter (dans le terminal ou Android Studio)
- Le fichier de debug : `/sdcard/Download/gestionnaire_debug.txt` (sur Android)
