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
      // Vérifier que les champs ne sont pas vides
      if (region.isEmpty || assemblyId.isEmpty || assemblyPin.isEmpty) {
        AppLogger.error('Erreur: champs vides');
        return false;
      }

      AppLogger.log('Tentative connexion: region=$region, id=$assemblyId, pin=$assemblyPin');

      // Récupérer l'assemblée stockée pour vérification
      final storedAssembly = await storageService.getAssembly();
      AppLogger.log('Assemblée stockée: $storedAssembly');
      
      if (storedAssembly == null) {
        // Première utilisation (mobile/émulateur): aucune assemblée n'est encore enregistrée.
        // On considère les identifiants saisis comme une configuration initiale.
        final bootstrap = Assembly(
          id: assemblyId,
          name: 'Assemblée',
          pin: assemblyPin,
          region: region,
          country: '',
        );
        _currentAssembly = bootstrap;
        await storageService.saveAssembly(bootstrap);
        AppLogger.log('Assemblé bootstrap enregistrée (première utilisation)');
        return true;
      }

      AppLogger.log('Vérification: stored.region=${storedAssembly.region} vs input=$region');
      AppLogger.log('Vérification: stored.id=${storedAssembly.id} vs input=$assemblyId');
      AppLogger.log('Vérification: stored.pin=${storedAssembly.pin} vs input=$assemblyPin');

      // Vérifier les identifiants exactement
      final regionMatch = storedAssembly.region.toLowerCase() == region.toLowerCase();
      final idMatch = storedAssembly.id == assemblyId;
      final pinMatch = storedAssembly.pin == assemblyPin;

      AppLogger.log('Résultats: region=$regionMatch, id=$idMatch, pin=$pinMatch');

      if (!regionMatch || !idMatch || !pinMatch) {
        AppLogger.error('Validation échouée');
        return false;
      }
      
      _currentAssembly = storedAssembly;
      await storageService.saveAssembly(_currentAssembly!);
      AppLogger.log('Validation réussie!');
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

      // Si aucun utilisateur avec PIN, ajouter les données de test
      if (usersWithPin.isEmpty) {
        AppLogger.log('⚠️ Aucun utilisateur avec PIN trouvé (${people.length} utilisateurs chargés)');
        AppLogger.log('⏳ Ajout automatique des utilisateurs de test...');
        
        await _addTestUsers();
        
        // Recharger la liste complète après ajout
        people = await storageService.getPeople();
        AppLogger.log('✓ Liste rechargée: ${people.length} utilisateurs');
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
  
  Future<void> _addTestUsers() async {
    AppLogger.log('⏳ Ajout des utilisateurs de test avec PIN dans auth_service...');
    final testUsers = [
      {
        'id': 'test_001',
        'firstName': 'Jean',
        'lastName': 'Dupont',
        'displayName': 'J. Dupont',
        'pin': '1234',
        'gender': 'male',
        'spiritual': {
          'function': 'Pioneer auxiliaire',
          'active': true,
          'group': 1
        },
        'assignments': {
          'services': {
            'doorAttendant': true,
            'soundSystem': true,
            'rovingMic': true,
          },
          'ministry': {
            'returnVisit': true,
            'firstContact': true,
          },
          'gems': {},
          'christianLife': {},
          'weekendMeeting': {},
        },
      },
      {
        'id': 'test_002',
        'firstName': 'Marie',
        'lastName': 'Martin',
        'displayName': 'M. Martin',
        'pin': '5678',
        'gender': 'female',
        'spiritual': {
          'function': 'Proclamatrice',
          'active': true,
          'group': 2
        },
        'assignments': {
          'services': {},
          'ministry': {
            'returnVisit': true,
          },
          'gems': {},
          'christianLife': {},
          'weekendMeeting': {},
        },
      },
      {
        'id': 'test_003',
        'firstName': 'Paul',
        'lastName': 'Leblanc',
        'displayName': 'P. Leblanc',
        'pin': '9012',
        'gender': 'male',
        'spiritual': {
          'function': 'Proclamateur régulier',
          'active': true,
          'group': 1
        },
        'assignments': {
          'services': {
            'attendanceCount': true,
          },
          'ministry': {
            'returnVisit': true,
            'bibleStudy': true,
          },
          'gems': {},
          'christianLife': {},
          'weekendMeeting': {},
        },
      }
    ];
    
    await storageService.savePeople(
      testUsers.map((json) => Person.fromJson(json)).toList()
    );
    AppLogger.log('✓ 3 utilisateurs de test ajoutés');
  }
  
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
