import 'package:uuid/uuid.dart';
import '../models/person.dart';
import 'storage_service.dart';
import '../utils/logger.dart';

/// Service d'authentification 2 étapes
class AuthService {
  final StorageService storageService;
  
  Assembly? _currentAssembly;
  Person? _currentUser;

  AuthService(this.storageService);

  // ===== ETAPE 1: AUTHENTIFICATION ASSEMBLÉE =====
  /// Valide les données de connexion assemblée
  Future<bool> validateAssembly({
    required String region,
    required String assemblyId,
    required String assemblyPin,
  }) async {
    try {
      // Nettoyer les entrées (espaces invisibles, retours à la ligne)
      final cleanRegion = region.trim();
      final cleanId = assemblyId.trim();
      final cleanPin = assemblyPin.trim();

      // Vérifier que les champs ne sont pas vides
      if (cleanRegion.isEmpty || cleanId.isEmpty || cleanPin.isEmpty) {
        AppLogger.error('Erreur: champs vides après nettoyage');
        return false;
      }

      AppLogger.log('Tentative connexion: region=$cleanRegion, id=$cleanId, pin=$cleanPin');

      // Toujours accepter et sauvegarder les identifiants assemblée.
      // L'assemblée ID + PIN sont un "code de rejoindre" (join code),
      // pas un mécanisme de sécurité. La vraie authentification est à
      // l'étape 2 (nom + PIN personnel de l'utilisateur).
      // Cela résout le problème lors de la mise à jour de l'APK quand
      // les anciens identifiants stockés bloquent les nouveaux.
      final assembly = Assembly(
        id: cleanId,
        name: 'Assemblée',
        pin: cleanPin,
        region: cleanRegion,
        country: '',
      );
      _currentAssembly = assembly;
      await storageService.saveAssembly(assembly);
      AppLogger.log('Assemblée enregistrée: id=$cleanId, region=$cleanRegion');
      return true;
    } catch (e, st) {
      AppLogger.error('Erreur validation assembly', e, st);
      return false;
    }
  }

  // ===== ETAPE 2: AUTHENTIFICATION UTILISATEUR =====
  /// Valide les données de connexion utilisateur
  Future<bool> validateUser({
    required String firstName,
    required String personalPin,
  }) async {
    try {
      final name = firstName.trim();
      final pin = personalPin.trim();

      if (name.isEmpty || pin.isEmpty) {
        return false;
      }

      // Récupérer la liste des utilisateurs
      List<Person> people = await storageService.getPeople();

      // Vérifier si des utilisateurs avec PIN existent
      final usersWithPin = people.where((p) => p.pin != null && p.pin!.isNotEmpty).toList();

      // Si aucun utilisateur avec PIN, informer l'utilisateur
      if (usersWithPin.isEmpty) {
        AppLogger.log('⚠️ Aucun utilisateur avec PIN trouvé (${people.length} utilisateurs chargés)');
        AppLogger.log('ℹ️ L\'utilisateur doit d\'abord configurer son assemblée et synchroniser les données');
        return false;
      }

      // Continuer avec la liste (existante ou mise à jour)
      return _findAndAuthenticateUser(people, name, pin);
    } catch (e) {
      AppLogger.error('Erreur validateUser', e);
      rethrow;
    }
  }

  Future<bool> _findAndAuthenticateUser(List<Person> people, String name, String pin) async {
    try {

      // Chercher l'utilisateur par firstName ou displayName et PIN
      Person? user;
      for (final person in people) {
        final personFirst = person.firstName.trim().toLowerCase();
        final personDisplay = person.displayName.trim().toLowerCase();
        final candidate = name.toLowerCase();

        final nameMatches = personFirst == candidate || personDisplay == candidate;

        if (nameMatches && person.pin == pin) {
          user = person;
          break;
        }
      }

      if (user == null) {
        return false;
      }

      _currentUser = user;
      await storageService.setCurrentUser(user);

      // Générer et sauvegarder un token
      final token = _generateToken();
      await storageService.setAuthToken(token);

      return true;
    } catch (e, st) {
      // Important: ne pas masquer l'erreur en "identifiants invalides".
      AppLogger.error('Erreur validation utilisateur', e, st);
      rethrow;
    }
  }

  // ===== GETTERS =====
  Assembly? get currentAssembly => _currentAssembly;
  Person? get currentUser => _currentUser;

  Future<Assembly?> loadCurrentAssembly() async {
    _currentAssembly = await storageService.getAssembly();
    return _currentAssembly;
  }

  Future<Person?> loadCurrentUser() async {
    _currentUser = await storageService.getCurrentUser();
    return _currentUser;
  }

  // ===== LOGOUT =====
  Future<void> logout() async {
    _currentAssembly = null;
    _currentUser = null;
    await storageService.setCurrentUser(null);
    await storageService.clearAuthToken();
  }

  // ===== HELPERS =====
  
  String _generateToken() {
    const uuid = Uuid();
    return uuid.v4();
  }

  bool isAuthenticated() {
    return _currentAssembly != null && _currentUser != null;
  }

  /// Vérifie si l'utilisateur a un statut particulier
  bool hasFunction(String function) {
    return _currentUser?.spiritual.function == function;
  }

  /// Récupère les services actifs de l'utilisateur
  List<String> getActiveServices() {
    return _currentUser?.assignments.services.getActiveServices() ?? [];
  }
}
