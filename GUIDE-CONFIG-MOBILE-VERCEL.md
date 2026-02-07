# 📱 Configuration App Mobile pour Vercel

## 🎯 Problème

L'application mobile envoie les rapports à une adresse locale (`http://192.168.169.152:3000`) qui ne fonctionne pas avec votre site déployé sur Vercel.

## ✅ Solution : Configurer l'URL Vercel

### Étape 1 : Ouvrir les Paramètres

1. **Ouvrir l'application mobile Flutter** sur votre téléphone
2. **Ouvrir le menu** (icône ☰ en haut à gauche)
3. **Chercher et appuyer sur** :
   - "Developer Settings" ou
   - "Paramètres développeur" ou
   - "⚙️ Paramètres" → "Réseau"

### Étape 2 : Configurer l'URL du Serveur

1. **Trouver le champ "API Base URL" ou "URL du serveur"**

2. **Effacer l'URL actuelle** (probablement `http://192.168.169.152:3000`)

3. **Entrer la nouvelle URL** :
   ```
   https://app-gestionnaire.vercel.app
   ```
   
   ⚠️ **IMPORTANT** :
   - Pas de `/` à la fin
   - Commence par `https://` (pas `http://`)
   - Exactement comme ci-dessus

4. **Appuyer sur "Save" ou "Enregistrer"**

5. **Vous devriez voir un message** :
   ```
   ✅ URL configurée : https://app-gestionnaire.vercel.app
   ```

### Étape 3 : Tester la Connexion

1. **Chercher le bouton "Test Connection"** (si disponible)
2. **Appuyer dessus**
3. **Attendre le résultat** :
   - ✅ "Connection successful" = Parfait !
   - ❌ "Connection failed" = voir "Dépannage" ci-dessous

### Étape 4 : Redémarrer l'App (Optionnel)

Pour être sûr que la configuration est prise en compte :

1. **Fermer complètement l'application** (pas seulement revenir en arrière)
2. **Rouvrir l'application**

---

## 📤 Envoyer un Rapport de Test

1. **Allez dans "Rapports" ou "Mon Activité"**
2. **Remplissez un rapport** (même avec des données de test)
3. **Appuyez sur "Envoyer"**
4. **Vérifiez le message** :
   - ✅ "Rapport envoyé avec succès" = Succès !
   - ❌ "Rapport enregistré localement mais pas envoyé" = voir Dépannage

---

##  🔍 Dépannage

### Problème : "Connection failed" ou "Impossible de se connecter"

**Causes possibles** :
1. ❌ L'URL est mal tapée
2. ❌ Pas de connexion internet sur le téléphone
3. ❌ Le site Vercel est en maintenance (rare)

**Solutions** :
1. **Vérifier l'URL** :
   - Ouvrez le navigateur de votre téléphone (Chrome, Safari, etc.)
   - Tapez : `https://app-gestionnaire.vercel.app`
   - La page devrait s'afficher → Si oui, l'URL est correcte
   
2. **Vérifier la connexion internet** :
   - Ouvrez n'importe quel site web
   - Si rien ne marche → Vérifiez votre Wi-Fi ou données mobiles
   
3. **Vérifier les majuscules/minuscules** :
   - Assurez-vous de taper exactement :
     ```
     https://app-gestionnaire.vercel.app
     ```
   - Pas d'espaces avant ou après

### Problème : "Invalid user or PIN"

**Cause** : Le PIN n'est pas configuré ou est incorrect

**Solution** :
1. **Se déconnecter** de l'application mobile
2. **Se reconnecter** en entrant le bon PIN
3. **Réessayer d'envoyer le rapport**

### Problème : "API base is empty"

**Cause** : L'URL n'a pas été sauvegardée

**Solution** :
1. **Retourner dans les paramètres**
2. **Vérifier que l'URL est bien affichée**
3. **Appuyer sur "Save" à nouveau**

### Problème : Les rapports s'enregistrent localement mais ne s'envoient jamais

**Cause** : L'application utilise encore l'ancienne URL

**Solution** :
1. **Supprimer les données de l'application** :
   - Android : Paramètres → Apps → Gestionnaire Assemblée → Stockage → Effacer données
   - iOS : Désinstaller et réinstaller l'app
2. **Rouvrir l'app et reconfigurer l'URL** (étapes ci-dessus)
3. **Se reconnecter avec votre PIN**

---

## 📊 Vérification Finale

Après configuration, votre écran de paramètres devrait afficher :

```
╔════════════════════════════════════════╗
║  PARAMÈTRES SERVEUR                    ║
╠════════════════════════════════════════╣
║                                        ║
║  URL du Serveur:                       ║
║  https://app-gestionnaire.vercel.app   ║
║                                        ║
║  Status: ✅ Connecté                   ║
║                                        ║
║  [Test Connection]  [Save]             ║
║                                        ║
╚════════════════════════════════════════╝
```

---

## 🔗 URLs Utiles

- **Site Web** : https://app-gestionnaire.vercel.app
- **URL pour l'app mobile** : https://app-gestionnaire.vercel.app
- **API (automatique)** : https://app-gestionnaire.vercel.app/api/publisher-app/activity

---

## 📝 Notes Techniques

### Différence Local vs Vercel

| Élément | Développement Local | Production Vercel |
|---------|-------------------|-------------------|
| URL | `http://192.168.169.152:3000` | `https://app-gestionnaire.vercel.app` |
| Protocole | HTTP | HTTPS (sécurisé) |
| Port | :3000 | (aucun, standard 443) |
| Accessible | Même réseau Wi-Fi seulement | Internet mondial |

### Pourquoi HTTPS ?

Vercel impose HTTPS pour la sécurité. Tous les échanges sont chiffrés, y compris les rapports et PINs.

### Authentification

L'application mobile utilise deux méthodes :

1. **PIN Utilisateur** (simple) :
   - Chaque proclamateur a son PIN personnel
   - Envoyé avec chaque rapport
   - Validé côté serveur

2. **Device Auth** (avancé - optionnel) :
   - Pour la synchronisation complète
   - Utilise Device ID + API Key
   - Avec signature HMAC

Pour les rapports simples, seul le PIN est nécessaire ✅

---

## 🆘 Besoin d'Aide ?

Si après toutes ces étapes vos rapports ne s'envoient toujours pas :

1. **Vérifiez les logs** dans l'application (si accessible en mode debug)
2. **Notez le message d'erreur exact**
3. **Vérifiez que votre PIN est configuré dans le système web**
4. **Contactez l'administrateur du système**

---

## ✅ Checklist Rapide

- [ ] URL configurée : `https://app-gestionnaire.vercel.app`
- [ ] Connexion testée et réussie
- [ ] PIN configuré et validé
- [ ] Rapport de test envoyé avec succès
- [ ] Message "Rapport envoyé avec succès" affiché

🎉 **Si tout est coché, vous êtes prêt !**
