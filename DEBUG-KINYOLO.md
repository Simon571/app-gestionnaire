# Guide de débogage - Assemblée KIN YOLO EST

## Problème observé
Les 3 pages suivantes crashent avec "Application error":
- Partage de l'assemblée (`/partage`)
- Activité de prédication S-1 (`/activite-predication`)
- Groupes et Familles (`/groupes-familles`)

Le crash se produit **sur Vercel ET sur MSI Tauri**.

## Étapes de débogage

### 1. Test sur Vercel avec DevTools (F12)

1. Allez sur: https://app-gestionnaire.vercel.app
2. Connectez-vous avec vos identifiants (assemblyId: "KIN YOLO EST Français")
3. Ouvrez **DevTools** avec **F12**
4. Allez à l'onglet **Console** 
5. Cliquez sur l'une des 3 pages bugguées
6. Cherchez les messages d'erreur rouge dans la console
7. **Copiez et envoyez-moi les erreurs exactes**

### 2. Test des endpoints API directement

Ouvrez votre navigateur et visitez ces URL:

```
https://app-gestionnaire.vercel.app/api/publisher-app/users/export?assemblyId=KIN%20YOLO%20EST%20Fran%C3%A7ais
https://app-gestionnaire.vercel.app/api/families
https://app-gestionnaire.vercel.app/api/preaching-groups
```

**Attendu**: Vous devriez voir du JSON valide (liste d'utilisateurs, de familles, etc.)
**Si erreur**: Vérifiez le statut HTTP et le message d'erreur

### 3. Vérifier votre configuration localStorage

Dans la console (F12 → Console), tapez:
```javascript
console.log(JSON.parse(localStorage.getItem('appSettings')))
```

Vérifiez que `assemblyId` est correct: `KIN YOLO EST Français`

## Causes possibles (par ordre de probabilité)

1. **Données corrompues sur Vercel**: Les fichiers JSON (`publisher-users.json`, etc.) sur Vercel contiennent des données mal formatées pour votre assemblée
2. **AssemblyID mal formaté**: "KIN YOLO EST Français" contient des caractères spéciaux qui pourraient causer un problème de filtrage
3. **Données manquantes**: Vous n'avez pas de données pour cette assemblée sur Vercel
4. **Erreur de synchronisation**: Les données n'ont pas été correctement synchronisées lors de votre dernière utilisation

## Prochaines actions
- [ ] Vous envoyer les erreurs console exactes (étape 1)
- [ ] Vérifier les réponses API (étape 2)
- [ ] Vérifier votre assemblyId (étape 3)
