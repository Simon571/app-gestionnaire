# Guide pour voir les logs de l'application Flutter sur Android

## Option 1: Utiliser ADB (Android Debug Bridge)

### Installation d'ADB:
1. Télécharger Platform Tools depuis: https://developer.android.com/studio/releases/platform-tools
2. Extraire le fichier ZIP
3. Ajouter le dossier au PATH système

### Voir les logs en temps réel:
```bash
adb logcat | findstr "flutter"
```

### Voir les logs spécifiques de navigation:
```bash
adb logcat | findstr "LoginScreen currentPage _goToUserPage"
```

### Logs complets dans un fichier:
```bash
adb logcat > logs_android.txt
```

## Option 2: Vérifier le fichier de debug sur le téléphone

L'application écrit les logs dans:
```
/sdcard/Download/gestionnaire_debug.txt
```

Pour le lire:
1. Ouvrir l'application "Fichiers" ou "Mes fichiers"
2. Aller dans "Téléchargements" ou "Download"
3. Chercher le fichier `gestionnaire_debug.txt`
4. L'ouvrir avec un éditeur de texte

## Option 3: Depuis Windows (si téléphone connecté en USB)

```powershell
# Vérifier que le téléphone est connecté
adb devices

# Récupérer le fichier de debug
adb pull /sdcard/Download/gestionnaire_debug.txt C:\Users\Public\Documents\

# Voir le contenu
Get-Content C:\Users\Public\Documents\gestionnaire_debug.txt
```

## Logs importants à chercher:

- `🟢 LoginScreen.build() - currentPage=` : Montre quelle page est affichée
- `🔵 _goToUserPage() appelé` : Confirme que la fonction est appelée
- `🟡 loginAssembly - success:` : Montre si l'authentification a réussi
- `StorageService` : Montre le chargement des utilisateurs

## Problèmes connus:

1. **La page ne change pas**: currentPage reste à 0 même après _goToUserPage()
2. **Utilisateurs non chargés**: Chercher "aucun utilisateur" ou "count=0"
3. **Erreur d'authentification**: Chercher "Erreur" ou "failed"
