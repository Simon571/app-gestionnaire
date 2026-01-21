# Configuration de l'API et Résolution des Problèmes de Réseau

## Problème : Les Rapports ne s'envoient pas au Serveur

Si vous voyez le message "Le rapport a été enregistré localement mais n'a pas pu être envoyé au serveur", suivez ces étapes :

## 1️⃣ Vérifier l'URL de l'API

### Sur l'Application Mobile Flutter

1. **Ouvrir les Paramètres Serveur**
   - Lancez l'application Flutter
   - Allez dans le menu de navigation (icône hamburger)
   - Cherchez "Paramètres serveur" ou "Developer Settings"
   
2. **Configurer l'URL**
   - Entrez : `http://192.168.169.152:3000`
   - Appuyez sur "Save"
   - L'application devrait afficher "Actuel: http://192.168.169.152:3000"

### Sur le Web (Next.js)

L'application web utilise automatiquement l'URL du serveur sur lequel elle est hébergée.

## 2️⃣ Vérifier la Connexion Réseau

### Pré-requis
- ✅ Téléphone et PC/Serveur sur le **même réseau Wi-Fi**
- ✅ Pas de VPN actif
- ✅ Pare-feu Windows autorise le port 3000

### Test de Connexion depuis le Téléphone

1. **Ouvrir le navigateur du téléphone** (Chrome, Firefox, etc.)
2. **Aller à** : `http://192.168.169.152:3000`
3. **Résultat attendu** : La page d'accueil de l'application web devrait s'afficher

#### Si ça ne fonctionne pas :

**Option A : Vérifier l'adresse IP du serveur**
```powershell
# Sur le PC serveur, ouvrir PowerShell et exécuter :
ipconfig

# Cherchez "Adresse IPv4" sous votre adaptateur Wi-Fi
# Exemple : 192.168.169.152
```

**Option B : Vérifier que le serveur est démarré**
```powershell
# Sur le PC serveur :
cd C:\Users\Public\Documents\app-gestionnaire
npm run dev
```

**Option C : Vérifier le pare-feu Windows**
```powershell
# Ouvrir PowerShell en tant qu'administrateur et exécuter :
New-NetFirewallRule -DisplayName "Next.js Dev Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

## 3️⃣ Déboguer les Logs de l'Application

### Voir les Logs Android

1. **Connecter le téléphone via USB**
2. **Activer le débogage USB**
3. **Exécuter** :
```powershell
cd C:\Users\Public\Documents\app-gestionnaire\flutter_app
flutter run
```

4. **Chercher les messages** :
   - `StorageService: Attempting to send report to: http://...`
   - `StorageService: ✓ preaching report sent` (succès)
   - `StorageService: ✗ preaching report send error` (échec)

### Activer les Logs de Debug

Les logs sont déjà activés dans le code. Vous verrez dans la console :

```
StorageService: Attempting to send report to: http://192.168.169.152:3000
StorageService: Sending POST to http://192.168.169.152:3000/api/publisher-app/activity
StorageService: ✓ preaching report sent for 2026-01
```

Ou en cas d'erreur :
```
StorageService: ✗ preaching report send error: SocketException: Failed host lookup...
StorageService: Error type: SocketException
```

## 4️⃣ Erreurs Courantes et Solutions

### Erreur : "SocketException: Failed host lookup"
**Cause** : Le téléphone ne peut pas résoudre l'adresse IP
**Solution** : 
- Vérifiez que vous êtes sur le même Wi-Fi
- Utilisez l'adresse IP exacte (pas localhost)
- Redémarrez le Wi-Fi du téléphone

### Erreur : "TimeoutException after 10 seconds"
**Cause** : Le serveur ne répond pas
**Solution** :
- Vérifiez que le serveur Next.js est démarré
- Vérifiez le pare-feu Windows
- Essayez d'augmenter le timeout (déjà à 10 secondes)

### Erreur : "Connection refused"
**Cause** : Le port 3000 n'est pas accessible
**Solution** :
- Vérifiez que Next.js écoute sur `0.0.0.0:3000` (pas seulement localhost)
- Ajoutez dans `package.json` :
```json
{
  "scripts": {
    "dev": "next dev -H 0.0.0.0"
  }
}
```

### Erreur : "API base is empty: true"
**Cause** : L'URL de l'API n'est pas configurée
**Solution** :
- Allez dans "Paramètres serveur"
- Entrez l'URL : `http://192.168.169.152:3000`
- Sauvegardez

### Erreur : "PIN is empty: true"
**Cause** : Le PIN de l'utilisateur n'est pas défini
**Solution** :
- Déconnectez-vous de l'application
- Reconnectez-vous en entrant votre PIN

## 5️⃣ Configuration pour Émulateur Android

Si vous utilisez l'émulateur Android Studio :
- **Utilisez** : `http://10.0.2.2:3000` au lieu de `192.168.169.152:3000`
- Cette adresse spéciale redirige vers `localhost` de votre PC

## 6️⃣ Vérification Post-Configuration

1. **Configurer l'URL** dans les paramètres serveur
2. **Redémarrer l'application** Flutter
3. **Envoyer un rapport** de test depuis la carte "Rapport" (Assemblée)
4. **Vérifier** :
   - ✅ Le message indique "Rapport envoyé avec succès"
   - ✅ Le rapport apparaît coché dans MOI > Proclamateurs > Votre groupe
   - ✅ Les logs montrent "✓ preaching report sent"

## 7️⃣ Résumé des Modifications Apportées

### 1. Synchronisation Assembly ↔ MOI
- Quand vous envoyez un rapport depuis la carte "Rapport" (Assemblée), il est maintenant automatiquement marqué comme envoyé dans votre groupe de prédication (MOI)
- Le rafraîchissement est automatique après l'envoi

### 2. Correction du bouton "Envoyer pour lui"
- Le bouton vérifie maintenant que le PIN de l'acteur est valide
- Meilleurs messages d'erreur
- Rafraîchissement automatique de la liste après envoi
- Si vous envoyez pour vous-même, le rapport est marqué dans votre activité

### 3. Amélioration des Logs de Debug
- Messages plus clairs pour identifier les problèmes de connexion
- Affichage de l'URL exacte utilisée
- Type d'erreur affiché pour faciliter le diagnostic

## 🆘 Besoin d'Aide ?

Si le problème persiste après avoir suivi ces étapes :

1. **Collectez les informations** :
   - Logs de la console Flutter
   - Message d'erreur exact
   - Adresse IP de votre serveur
   - Configuration de votre réseau Wi-Fi

2. **Vérifiez** :
   - Le serveur Next.js est accessible depuis le navigateur du téléphone
   - L'URL dans "Paramètres serveur" est correcte
   - Vous êtes bien sur le même réseau Wi-Fi

3. **Testez** :
   - Envoi d'un rapport depuis le web (devrait fonctionner)
   - Envoi d'un rapport depuis le mobile (devrait maintenant fonctionner aussi)
