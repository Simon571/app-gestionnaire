# 📱 Téléchargement et Installation de l'Application Mobile

## 📦 Dernière Version

**Version actuelle** : 1.0.3 (Build 103)  
**Date de sortie** : 7 février 2026  
**Taille** : 53.0 MB  
**Fichier** : `gestionnaire-assemblée-v1.0.3-2026-02-07.apk`

---

## 🌐 Nouveauté de cette Version

✅ **Connexion automatique vers Vercel**  
L'application se connecte maintenant directement à `https://app-gestionnaire.vercel.app` par défaut. Plus besoin de configuration manuelle !

---

## 📥 Installation

### Étape 1 : Télécharger l'APK

**Option A : Depuis GitHub**
1. Aller sur : https://github.com/Simon571/app-gestionnaire
2. Naviguer vers : `releases/gestionnaire-assemblée-v1.0.3-2026-02-07.apk`
3. Télécharger le fichier sur votre téléphone

**Option B : Transfert Direct**
1. Copier le fichier APK depuis le PC vers votre téléphone
2. Via câble USB ou partage Bluetooth/WiFi

### Étape 2 : Autoriser l'Installation

Sur Android, vous devez autoriser l'installation depuis des sources inconnues :

1. **Ouvrir Paramètres** du téléphone
2. **Sécurité** (ou **Confidentialité**)
3. Activer **Sources inconnues** ou **Installer des applications inconnues**
4. Sélectionner votre navigateur ou gestionnaire de fichiers

> 💡 **Note** : Sur Android 8+ (Oreo), l'autorisation est demandée app par app lors de l'installation.

### Étape 3 : Installer l'APK

1. Ouvrir le **gestionnaire de fichiers** sur votre téléphone
2. Naviguer vers le dossier **Téléchargements** (ou l'emplacement du fichier)
3. Taper sur `gestionnaire-assemblée-v1.0.3-2026-02-07.apk`
4. Appuyer sur **Installer**
5. Attendre la fin de l'installation
6. Appuyer sur **Ouvrir**

### Étape 4 : Première Connexion

1. **Entrer votre code utilisateur** (fourni par l'administrateur)
2. **Entrer votre PIN** (4-6 chiffres personnel)
3. Appuyer sur **Se connecter**

✅ L'application se connectera automatiquement à Vercel !

---

## 🔄 Mise à Jour depuis une Version Précédente

### Option 1 : Installation par-dessus (Recommandé)

1. Installer le nouvel APK comme décrit ci-dessus
2. Android détectera l'application existante
3. Vos données seront préservées
4. Se reconnecter si nécessaire

### Option 2 : Désinstallation puis Installation

1. **Paramètres** → **Applications** → **Gestionnaire Assemblée**
2. Appuyer sur **Désinstaller**
3. Installer le nouvel APK
4. Se connecter à nouveau avec vos identifiants

> ⚠️ **Attention** : Cette méthode supprime les données locales (rapports en attente)

---

## ✅ Vérification Post-Installation

### Test de Connexion

1. Ouvrir l'application
2. Se connecter avec vos identifiants
3. Menu ☰ → **Paramètres serveur** (ou **Developer Settings**)
4. Vérifier que l'URL affichée est : `https://app-gestionnaire.vercel.app`

### Test d'Envoi de Rapport

1. Aller dans **Rapports** ou **Mon Activité**
2. Remplir un rapport de test
3. Appuyer sur **Envoyer**
4. Message attendu : **✅ "Rapport envoyé avec succès"**

### Test de Réception de Données

1. Sur le site web, modifier quelque chose (ex: programme VCM)
2. Dans l'app mobile, tirer vers le bas pour rafraîchir
3. Les nouvelles données devraient apparaître

---

## 🔧 Configuration Avancée (Optionnelle)

Si vous avez besoin de vous connecter à un serveur différent :

1. Menu ☰ → **Paramètres serveur**
2. Modifier l'URL
3. Appuyer sur **Save**

**URLs acceptées :**
- `https://app-gestionnaire.vercel.app` (par défaut, production)
- `http://192.168.x.x:3000` (développement local)
- Toute autre URL de serveur Next.js

---

## 🐛 Dépannage

### L'installation échoue

**Problème** : "L'application n'a pas pu être installée"

**Solutions** :
1. Vérifier que vous avez autorisé les sources inconnues
2. Vérifier qu'il y a assez d'espace (au moins 100 MB libres)
3. Essayer de redémarrer le téléphone

### Impossible de se connecter

**Problème** : "Impossible de joindre le serveur"

**Solutions** :
1. Vérifier votre connexion internet (WiFi ou données mobiles)
2. Aller dans **Paramètres serveur** et vérifier l'URL
3. Essayer d'ouvrir `https://app-gestionnaire.vercel.app` dans le navigateur du téléphone
4. Se déconnecter et se reconnecter

### Erreur "Invalid user or PIN"

**Problème** : Impossible de se connecter avec vos identifiants

**Solutions** :
1. Vérifier que vous entrez le bon code utilisateur
2. Vérifier que votre PIN est correct
3. Contacter l'administrateur pour réinitialiser votre PIN

### L'app plante au démarrage

**Solutions** :
1. **Paramètres** → **Applications** → **Gestionnaire Assemblée**
2. **Stockage** → **Effacer les données**
3. Relancer l'application
4. Se reconnecter

---

## 📱 Compatibilité

### Android

- **Version minimale** : Android 5.0 (Lollipop, API 21)
- **Version recommandée** : Android 8.0+ (Oreo, API 26)
- **Version testée** : Android 11, 12, 13
- **Architectures** : ARM, ARM64, x86, x86_64

### Taille et Permissions

- **Taille APK** : 53 MB
- **Espace requis** : ~150 MB (avec cache et données)
- **Permissions** :
  - Internet (connexion serveur)
  - Stockage (sauvegarde locale)
  - Notifications (alertes optionnelles)

---

## 🔒 Sécurité

### Chiffrement

- ✅ Toutes les communications utilisent **HTTPS** (TLS 1.3)
- ✅ Certificat SSL Vercel valide
- ✅ Pas de données sensibles stockées en clair

### Authentification

- ✅ PIN personnel pour chaque utilisateur
- ✅ PIN hashé côté serveur (SHA-256)
- ✅ Pas de stockage du PIN sur le téléphone

### Données Locales

- 📄 Rapports en attente d'envoi (stockés temporairement)
- ⚙️ Préférences utilisateur
- 🔄 Cache de synchronisation

---

## 📚 Documentation Complète

- **Configuration Mobile** : [../GUIDE-CONFIG-MOBILE-VERCEL.md](../GUIDE-CONFIG-MOBILE-VERCEL.md)
- **Communication Mobile-Web** : [../COMMUNICATION-MOBILE-WEB.md](../COMMUNICATION-MOBILE-WEB.md)
- **Notes de Version** : [NOTES-VERSION-1.0.3.md](NOTES-VERSION-1.0.3.md)

---

## 🆘 Support

### Problème Persistant

Si après tous les dépannages l'application ne fonctionne toujours pas :

1. Noter le **message d'erreur exact** (faire une capture d'écran)
2. Noter la **version Android** de votre téléphone
3. Contacter l'**administrateur système** avec ces informations

### Coordonnées Support

- **Email** : [à configurer]
- **GitHub Issues** : https://github.com/Simon571/app-gestionnaire/issues
- **Documentation** : Voir les fichiers `.md` à la racine du projet

---

## 📊 Historique des Versions

| Version | Date | Taille | Changements Principaux |
|---------|------|--------|------------------------|
| 1.0.3 | 2026-02-07 | 53 MB | URL Vercel par défaut, correction connexion mobile-web |
| 1.0.2 | 2026-01-XX | 52 MB | Améliorations stabilité, nouveaux rapports |
| 1.0.1 | 2025-XX-XX | 51 MB | Corrections bugs, amélioration UI |
| 1.0.0 | 2025-XX-XX | 50 MB | Version initiale |

---

## 🎯 Feuille de Route

### Prochaines Fonctionnalités

- 🔔 Notifications push pour mises à jour programme
- 📴 Mode hors ligne amélioré
- 🗺️ Gestion avancée des territoires
- 🏛️ Support multi-assemblées
- 🎨 Thèmes personnalisables
- 📊 Statistiques personnelles détaillées

---

## ⚖️ Licence

Application propriétaire destinée à l'usage interne de l'assemblée.  
Tous droits réservés.

---

## ✅ Checklist d'Installation Réussie

Après installation, vous devriez avoir :

- [ ] Application installée et visible dans le tiroir d'applications
- [ ] Connexion réussie avec vos identifiants
- [ ] URL Vercel configurée (visible dans Paramètres serveur)
- [ ] Test d'envoi de rapport réussi
- [ ] Réception des données du serveur OK
- [ ] Pas de message d'erreur

🎉 **Si tout est coché, vous êtes prêt à utiliser l'application !**

---

**Dernière mise à jour** : 7 février 2026  
**Version du document** : 1.0  
**Auteur** : GitHub Copilot Agent
