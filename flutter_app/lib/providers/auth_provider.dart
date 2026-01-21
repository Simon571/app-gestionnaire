import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/person.dart';
import '../services/auth_service.dart';
import '../services/storage_service.dart';

// This will be set in main.dart before app runs
late StorageService _sharedStorageService;

/// Initialize the shared storage service (must be called before running the app)
Future<void> initializeSharedServices() async {
  _sharedStorageService = StorageService();
  await _sharedStorageService.init();
}

/// Get the shared storage service (used in main.dart for startup init)
StorageService getSharedStorageService() => _sharedStorageService;

// ===== SERVICES PROVIDERS =====
final storageServiceProvider = Provider<StorageService>((ref) {
  return _sharedStorageService;
});

final authServiceProvider = Provider<AuthService>((ref) {
  final storage = ref.watch(storageServiceProvider);
  return AuthService(storage);
});

// ===== AUTH STATE =====
final authStateProvider = NotifierProvider<AuthStateNotifier, AuthState>(AuthStateNotifier.new);

class AuthState {
  final bool isAssemblyAuthenticated;
  final bool isUserAuthenticated;
  final Assembly? assembly;
  final Person? user;
  final String? error;

  AuthState({
    this.isAssemblyAuthenticated = false,
    this.isUserAuthenticated = false,
    this.assembly,
    this.user,
    this.error,
  });

  bool get isFullyAuthenticated => isAssemblyAuthenticated && isUserAuthenticated;

  AuthState copyWith({
    bool? isAssemblyAuthenticated,
    bool? isUserAuthenticated,
    Assembly? assembly,
    Person? user,
    String? error,
  }) {
    return AuthState(
      isAssemblyAuthenticated: isAssemblyAuthenticated ?? this.isAssemblyAuthenticated,
      isUserAuthenticated: isUserAuthenticated ?? this.isUserAuthenticated,
      assembly: assembly ?? this.assembly,
      user: user ?? this.user,
      error: error,
    );
  }
}

class AuthStateNotifier extends Notifier<AuthState> {
  late final AuthService _authService;

  @override
  AuthState build() {
    _authService = ref.read(authServiceProvider);
    return AuthState();
  }

  Future<void> initAuth() async {
    await _authService.storageService.init();
    final assembly = await _authService.loadCurrentAssembly();
    final user = await _authService.loadCurrentUser();
    state = state.copyWith(
      isAssemblyAuthenticated: assembly != null,
      isUserAuthenticated: user != null,
      assembly: assembly,
      user: user,
    );
  }

  Future<bool> loginAssembly({
    required String region,
    required String assemblyId,
    required String assemblyPin,
  }) async {
    try {
      final success = await _authService.validateAssembly(
        region: region,
        assemblyId: assemblyId,
        assemblyPin: assemblyPin,
      );

      if (success) {
        state = state.copyWith(
          isAssemblyAuthenticated: true,
          assembly: _authService.currentAssembly,
          error: null,
        );
        return true;
      } else {
        state = state.copyWith(
          error: 'Identifiants assemblée invalides',
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(error: 'Erreur: $e');
      return false;
    }
  }

  Future<bool> loginUser({
    required String firstName,
    required String personalPin,
  }) async {
    try {
      final success = await _authService.validateUser(
        firstName: firstName,
        personalPin: personalPin,
      );

      if (success) {
        state = state.copyWith(
          isUserAuthenticated: true,
          user: _authService.currentUser,
          error: null,
        );
        return true;
      } else {
        state = state.copyWith(
          error: 'Identifiants utilisateur invalides',
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(error: 'Erreur: $e');
      return false;
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    state = AuthState();
  }
}

// ===== PEOPLE PROVIDERS =====
final peopleProvider = FutureProvider<List<Person>>((ref) async {
  final storage = ref.watch(storageServiceProvider);
  return storage.getPeople();
});

final currentUserProvider = FutureProvider<Person?>((ref) async {
  final auth = ref.watch(authStateProvider);
  return auth.user;
});

// ===== ACTIVITY REPORTS PROVIDER =====
final userActivityReportsProvider = FutureProvider<List<ActivityReport>>((ref) async {
  final auth = ref.watch(authStateProvider);
  return auth.user?.activity ?? [];
});

// ===== ACTIVE SERVICES PROVIDER =====
final activeServicesProvider = FutureProvider<List<String>>((ref) async {
  final auth = ref.watch(authStateProvider);
  return auth.user?.assignments.services.getActiveServices() ?? [];
});

// ===== MONTHLY REPORTS PROVIDER =====
final monthlyReportsProvider = FutureProvider<Map<String, ActivityReport>>((ref) async {
  final auth = ref.watch(authStateProvider);
  if (auth.user == null) return {};
  
  final reports = <String, ActivityReport>{};
  for (final report in auth.user!.activity) {
    reports[report.month] = report;
  }
  return reports;
});

/// Récupère le rapport du mois précédent
final previousMonthReportProvider = FutureProvider<ActivityReport?>((ref) async {
  final auth = ref.watch(authStateProvider);
  if (auth.user == null) return null;
  
  // Récupérer le dernier rapport (mois précédent)
  if (auth.user!.activity.isEmpty) return null;
  
  // Trier par mois descendant et retourner le premier
  final sorted = auth.user!.activity;
  sorted.sort((a, b) => b.month.compareTo(a.month));
  return sorted.first;
});
