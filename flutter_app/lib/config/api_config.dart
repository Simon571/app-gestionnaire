/// Adresse du serveur que l'application interroge.
///
/// Elle est fixee au moment de la construction de l'APK, pas dans le code :
///
///   flutter build apk --release \
///     --dart-define=API_BASE=https://assemblee.exemple.org
///
/// C'est ce qui permet de changer d'hebergeur sans modifier une ligne de Dart.
/// Sans ce drapeau, l'application retombe sur l'ancienne adresse Vercel, pour
/// que les installations existantes continuent de fonctionner.
///
/// Ordre de priorite effectif :
///   1. l'adresse saisie par l'utilisateur dans les Parametres, s'il y en a une
///      (choix explicite, on ne l'ecrase pas) ;
///   2. `--dart-define=API_BASE`, ci-dessous ;
///   3. le fichier `assets/data/sync_credentials.json` ;
///   4. l'adresse de secours.
library;

/// Vide si l'APK a ete construit sans `--dart-define=API_BASE`.
const String envApiBase = String.fromEnvironment('API_BASE');

/// Utilisee seulement si rien n'est configure nulle part.
const String fallbackApiBase = 'https://app-gestionnaire.vercel.app';

/// Adresse retenue a la compilation.
///
/// Compare a la chaine vide plutot qu'avec `isNotEmpty` : l'appel d'une
/// propriete n'est pas autorise dans une expression constante.
const String defaultApiBase = envApiBase == '' ? fallbackApiBase : envApiBase;
