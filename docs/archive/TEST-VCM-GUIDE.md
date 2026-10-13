# Test du nouveau système VCM

## Instructions de test

### 1. Démarrer l'application
```bash
npm run dev
```

### 2. Naviguer vers la page VCM
- Aller à `/programme/reunion-vie-ministere`
- L'interface moderne VCM devrait s'afficher par défaut

### 3. Tester l'importation de programme
1. **Sélectionner une semaine** dans le sélecteur de gauche
2. **Cliquer sur "Importer"** dans la section programme
3. **Choisir "Importer depuis un fichier texte"**
4. **Sélectionner le fichier** `example-vcm-week.txt`
5. **Vérifier** que le programme s'affiche avec les 3 sections :
   - Joyaux de la Parole de Dieu (3 parties)
   - Applique-toi au Ministère (3 parties)  
   - Vie Chrétienne (3 parties)

### 4. Tester les assignations
1. **Pour chaque partie du programme**, utiliser la liste déroulante pour assigner une personne
2. **Vérifier** que le badge "Assigné" apparaît
3. **Changer de semaine** et revenir pour vérifier la persistance

### 5. Tester l'importation automatique (simulation)
1. **Cliquer sur "Importer depuis jw.org"**
2. **Attendre** la simulation de 2 secondes
3. **Vérifier** que les données de test sont chargées

### 6. Basculer vers la vue classique
1. **Cliquer sur "Vue classique"**
2. **Vérifier** que l'ancienne interface s'affiche
3. **Revenir à "Nouvelle interface VCM"**

## Fonctionnalités testées

✅ **Parsing du format VCM** - Analyse automatique du texte structuré
✅ **Classification automatique** - Types de parties détectés automatiquement  
✅ **Persistence des données** - Sauvegarde locale des programmes et assignations
✅ **Interface moderne** - Design card-based avec statuts visuels
✅ **Sélection de semaine** - Calendrier avec indicateurs de statut
✅ **Assignation de personnes** - Listes déroulantes filtrées par statut actif
✅ **Compatibilité** - Bascule entre nouvelle et ancienne interface

## Améliorations futures

🔄 **Importation jw.org réelle** - Scraping automatique du site officiel
📱 **Application mobile** - Interface Tauri pour desktop et mobile
🔄 **Synchronisation cloud** - Backup et partage entre appareils
📊 **Statistiques d'assignation** - Suivi des participations
🎨 **Thèmes personnalisés** - Couleurs et styles configurables
🔔 **Notifications** - Rappels automatiques avant les réunions

## Structure des données VCM

Le parser reconnaît automatiquement :

### Types de parties Joyaux :
- `discours_principal` - Discours d'ouverture
- `perles_spirituelles` - Perles spirituelles  
- `lecture_bible` - Lecture de la Bible

### Types de parties Ministère :
- `engage_conversation` - Engagement de conversation
- `entretiens_interet` - Entretiens l'intérêt
- `premiere_visite` - Première visite
- `nouvelle_visite` - Nouvelle visite
- `cours_biblique` - Cours biblique

### Types de parties Vie Chrétienne :
- `partie_vie_chretienne` - Parties génériques
- `besoins_assemblee` - Besoins de l'assemblée
- `etude_biblique` - Étude biblique
- `discussion` - Discussion

Le système extrait automatiquement :
- **Durée** (en minutes)
- **Références bibliques** (ex: Pr 31:10-31)
- **Leçons** (ex: th leçon 10)
- **Catégories** (TÉMOIGNAGE INFORMEL, DE MAISON EN MAISON)
- **Descriptions** détaillées