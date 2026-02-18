import '../utils/logger.dart';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/auth_provider.dart';
import '../../models/person.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  int _currentPage = 0;
  ProviderSubscription<AuthState>? _authSubscription;

  @override
  void initState() {
    super.initState();
    // Si l'assemblée est déjà authentifiée, aller directement à la page 2 (connexion utilisateur)
    final authState = ref.read(authStateProvider);
    final initialPage = authState.isAssemblyAuthenticated ? 1 : 0;
    _currentPage = initialPage;
    AppLogger.log('🟣 LoginScreen.initState() - initialPage=$initialPage');
    
    // Si l'assemblée n'est pas authentifiée, vérifier s'il existe une assemblée enregistrée localement
    if (!authState.isAssemblyAuthenticated) {
      _checkStoredAssembly();
    }

    // Riverpod: ref.listen() is only allowed in build(); use listenManual() in initState.
    _authSubscription = ref.listenManual<AuthState>(authStateProvider, (previous, next) {
      if (!mounted) return;
      final prevUser = previous?.isUserAuthenticated ?? false;
      final nextUser = next.isUserAuthenticated;
      if (prevUser == true && nextUser == false && _currentPage != 0) {
        _goToAssemblyPage();
      }
    });
  }
  
  Future<void> _checkStoredAssembly() async {
    try {
      final storage = ref.read(storageServiceProvider);
      final assembly = await storage.getAssembly();
      if (assembly != null && mounted) {
        setState(() {
          _currentPage = 1;
        });
        AppLogger.log('🟣 LoginScreen - Assemblée trouvée localement, passage à la page 2');
      }
    } catch (e) {
      AppLogger.error('🟣 LoginScreen - Erreur lors de la vérification de l\'assemblée locale', e);
    }
  }

  @override
  void dispose() {
    _authSubscription?.close();
    super.dispose();
  }

  void _goToUserPage() {
    AppLogger.log('🔵 _goToUserPage() appelé - currentPage avant: $_currentPage');
    if (!mounted) {
      AppLogger.log('🔵 Widget non monté, abandon');
      return;
    }
    
    setState(() {
      _currentPage = 1;
      AppLogger.log('🔵 setState terminé - currentPage après: $_currentPage');
    });
    
    // Forcer un rebuild après le setState
    WidgetsBinding.instance.addPostFrameCallback((_) {
      AppLogger.log('🔵 PostFrameCallback - Vérification currentPage: $_currentPage');
    });
  }

  void _goToAssemblyPage() {
    AppLogger.log('_goToAssemblyPage() appelé');
    if (!mounted) {
      AppLogger.log('Widget non monté, abandon');
      return;
    }
    
    setState(() {
      _currentPage = 0;
      AppLogger.log('Page changée vers 0 (AssemblyLoginPage)');
    });
  }

  @override
  Widget build(BuildContext context) {
    AppLogger.log('🟢 LoginScreen.build() - currentPage=$_currentPage, mounted=$mounted');
    
    // Utiliser IndexedStack au lieu de PageView pour une navigation plus fiable
    return Scaffold(
      body: IndexedStack(
        index: _currentPage,
        children: [
          AssemblyLoginPage(onNext: _goToUserPage),
          UserLoginPage(onBack: _goToAssemblyPage),
        ],
      ),
    );
  }
}

/// Page 1 - Connexion Assemblée
class AssemblyLoginPage extends ConsumerStatefulWidget {
  final VoidCallback onNext;

  const AssemblyLoginPage({required this.onNext, Key? key}) : super(key: key);

  @override
  ConsumerState<AssemblyLoginPage> createState() => _AssemblyLoginPageState();
}

class _AssemblyLoginPageState extends ConsumerState<AssemblyLoginPage> {
  late TextEditingController _regionController;
  late TextEditingController _assemblyIdController;
  late TextEditingController _assemblyPinController;
  bool _isLoading = false;
  // Empêche les tentatives automatiques répétées lors du build
  bool _autoAttempted = false;

  final List<String> regions = [
    'Afrique',
    'Amérique du Nord',
    'Amérique du Sud',
    'Asie',
    'Europe',
    'Océanie',
  ];

  @override
  void initState() {
    super.initState();
    _regionController = TextEditingController();
    _assemblyIdController = TextEditingController();
    _assemblyPinController = TextEditingController();
    // Essayer de charger un fichier local de configuration d'assemblée
    // pour faciliter les tests en développement. Le fichier attendu est
    // `config/local_assembly.json` à la racine du projet Flutter.
    _tryLoadLocalAssembly();
    
    // Ensure users are loaded on this page init
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _ensureUsersLoaded();
    });
  }
  
  Future<void> _ensureUsersLoaded() async {
    try {
      final storage = ref.read(storageServiceProvider);
      await storage.init();
      await storage.getPeople();
      // Users should be loaded and cached now
    } catch (e) {
      if (kDebugMode) print('⚠️ Failed to preload users: $e');
    }
  }

  Future<void> _tryLoadLocalAssembly() async {
    try {
      if (_autoAttempted) return;

      final file = File('config/local_assembly.json');
      if (!await file.exists()) return;

      final content = await file.readAsString();
      final Map<String, dynamic> cfg = json.decode(content);

      // Support both formats: id/pin and assemblyId/assemblyPin
      final assemblyId = cfg['assemblyId']?.toString() ?? cfg['id']?.toString() ?? '';
      final assemblyPin = cfg['assemblyPin']?.toString() ?? cfg['pin']?.toString() ?? '';
      final region = cfg['region']?.toString() ?? '';
      final assemblyName = cfg['assemblyName']?.toString() ?? cfg['name']?.toString() ?? 'Assemblée locale';
      final zoomId = cfg['zoomId']?.toString();
      final zoomPassword = cfg['zoomPassword']?.toString();
      final zoomUrl = cfg['zoomUrl']?.toString();
      final autoLogin = cfg['autoLogin'] == true;

      if (assemblyId.isEmpty || assemblyPin.isEmpty) return;

      // Marquer immédiatement comme tenté pour éviter les boucles
      _autoAttempted = true;

      // Remplir les champs
      if (mounted) {
        setState(() {
          _assemblyIdController.text = assemblyId;
          _assemblyPinController.text = assemblyPin;
          if (region.isNotEmpty) _regionController.text = region;
        });
      }

      // Enregistrer les infos de l'assemblée
      final assembly = Assembly(
        id: assemblyId,
        name: assemblyName,
        pin: assemblyPin,
        region: region,
        country: cfg['country']?.toString() ?? '',
        zoomId: zoomId,
        zoomPassword: zoomPassword,
        zoomUrl: zoomUrl,
        weekdayMeeting: cfg['weekdayMeeting'] is int ? cfg['weekdayMeeting'] : null,
        weekendMeeting: cfg['weekendMeeting'] is int ? cfg['weekendMeeting'] : null,
      );
      final storage = ref.read(storageServiceProvider);
      await storage.saveAssembly(assembly);

      // Si autoLogin est activé, connecter automatiquement et passer à la page suivante
      // DÉSACTIVÉ sur Windows pour éviter les boucles infinies
      if (autoLogin && mounted && !Platform.isWindows) {
        if (kDebugMode) AppLogger.log('Auto-login assemblée activé');
        // Petit délai pour laisser le widget se construire
        await Future.delayed(const Duration(milliseconds: 100));
        if (mounted) {
          final success = await ref.read(authStateProvider.notifier).loginAssembly(
            region: region,
            assemblyId: assemblyId,
            assemblyPin: assemblyPin,
          );
          if (success && mounted) {
            widget.onNext();
          }
        }
      }
    } catch (e) {
      if (kDebugMode) AppLogger.error('Impossible de charger local_assembly.json', e);
    }
  }

  @override
  void dispose() {
    _regionController.dispose();
    _assemblyIdController.dispose();
    _assemblyPinController.dispose();
    super.dispose();
  }

  Future<void> _handleNext() async {
    AppLogger.log('🟡 _handleNext() appelé');
    
    if (_regionController.text.isEmpty ||
        _assemblyIdController.text.isEmpty ||
        _assemblyPinController.text.isEmpty) {
      AppLogger.log('🟡 Champs vides, affichage d\'un SnackBar');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez remplir tous les champs')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      AppLogger.log('🟡 Appel loginAssembly avec region=${_regionController.text}, assemblyId=${_assemblyIdController.text}');
      final success = await ref.read(authStateProvider.notifier).loginAssembly(
        region: _regionController.text,
        assemblyId: _assemblyIdController.text,
        assemblyPin: _assemblyPinController.text,
      );

      AppLogger.log('🟡 loginAssembly - success: $success');

      if (success) {
        AppLogger.log('🟡 ✓ Authentification assemblée réussie, appel widget.onNext()');
        widget.onNext();
      } else {
        final error = ref.read(authStateProvider).error;
        AppLogger.error('🟡 ✗ Erreur authentification', error);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error ?? 'Erreur de connexion')),
        );
      }
    } catch (e) {
      AppLogger.error('🟡 Exception dans _handleNext', e);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Container(
        height: MediaQuery.of(context).size.height,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Colors.blue.shade700, Colors.blue.shade900],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                GestureDetector(
                  onLongPress: () {
                    if (kDebugMode) {
                      try {
                        context.go('/admin/import-users');
                      } catch (_) {}
                    }
                  },
                  child: const Icon(
                    Icons.group,
                    size: 80,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 24),
                const Text(
                  'Connexion Assemblée',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Étape 1 sur 2',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.white70,
                  ),
                ),
                const SizedBox(height: 48),
                DropdownButtonFormField<String>(
                  decoration: InputDecoration(
                    labelText: 'Région',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    filled: true,
                    fillColor: Colors.white,
                  ),
                  items: regions
                      .map((r) => DropdownMenuItem(value: r, child: Text(r)))
                      .toList(),
                  onChanged: (value) {
                    _regionController.text = value ?? '';
                  },
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _assemblyIdController,
                  decoration: InputDecoration(
                    labelText: 'ID de l\'assemblée',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    filled: true,
                    fillColor: Colors.white,
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _assemblyPinController,
                  decoration: InputDecoration(
                    labelText: 'PIN assemblée',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    filled: true,
                    fillColor: Colors.white,
                  ),
                  obscureText: true,
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _handleNext,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.orange,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: _isLoading
                        ? const CircularProgressIndicator(color: Colors.white)
                        : const Text(
                            'Suivant',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Page 2 - Connexion Utilisateur
class UserLoginPage extends ConsumerStatefulWidget {
  final VoidCallback onBack;

  const UserLoginPage({required this.onBack, Key? key}) : super(key: key);

  @override
  ConsumerState<UserLoginPage> createState() => _UserLoginPageState();
}

class _UserLoginPageState extends ConsumerState<UserLoginPage> {
  // We'll use the TextEditingController supplied by Autocomplete for the
  // first name field (we keep a reference but don't dispose it). We create
  // our own controller for the personal PIN and manage its lifecycle.
  TextEditingController? _firstNameController;
  late TextEditingController _personalPinController;
  bool _isLoading = false;
  List<String> _suggestionNames = [];

  @override
  void initState() {
    super.initState();
    AppLogger.log('🔴 UserLoginPage.initState() - page 2');
    _personalPinController = TextEditingController();
  }
  
  void _loadSuggestions(List<Person> people) {
    // Charger les noms des utilisateurs
    if (mounted) {
      setState(() {
        _suggestionNames = people.map((p) => p.firstName).toList();
      });
    }
  }

  Future<void> _showLoginDiagnostics(String firstName) async {
    try {
      final storage = ref.read(storageServiceProvider);
      final people = await storage.getPeople();
      if (!mounted) return;
      final matches = people.where((p) => p.firstName.toLowerCase().contains(firstName.toLowerCase())).toList();
      final count = storage.lastPeopleCount;
      final source = storage.lastPeopleSource;

      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Diagnostics de connexion'),
          content: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Utilisateurs chargés: $count'),
                Text('Source: $source'),
                const SizedBox(height: 8),
                Text('Correspondances pour "$firstName":', style: const TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                if (matches.isEmpty) const Text('Aucune correspondance trouvée'),
                for (final p in matches.take(20)) Text('- ${p.firstName} ${p.lastName ?? ''} (PIN: ${p.pin ?? '—'})'),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('Fermer')),
          ],
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur diagnostics: $e')),
      );
    }
  }

  @override
  void dispose() {
    // Do NOT dispose _firstNameController as it is provided/managed by
    // the Autocomplete widget; disposing it here produced use-after-dispose
    // crashes previously. We only dispose the PIN controller.
    _personalPinController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    final firstName = _firstNameController?.text ?? '';
    final pin = _personalPinController.text;

    if (firstName.isEmpty || pin.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez remplir tous les champs')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final success = await ref.read(authStateProvider.notifier).loginUser(
        firstName: firstName,
        personalPin: pin,
      );

      if (success) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Connexion réussie')),
          );

          // Naviguer directement vers /home pour s'assurer que la
          // transition se fait immédiatement après l'authentification.
          try {
            context.go('/home');
          } catch (e) {
            // Si GoRouter n'est pas disponible, laisser la redirection
            // globale du provider de router gérer la navigation.
            if (kDebugMode) AppLogger.error('Navigation /home failed', e);
          }
        }
      } else {
        if (mounted) {
          setState(() => _isLoading = false);
          final error = ref.read(authStateProvider).error;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(error ?? 'Erreur de connexion')),
          );
          // Show an optional diagnostic dialog to help the user see why login failed
          _showLoginDiagnostics(firstName);
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e')),
        );
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Container(
        height: MediaQuery.of(context).size.height,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Colors.green.shade700, Colors.green.shade900],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.person,
                  size: 80,
                  color: Colors.white,
                ),
                const SizedBox(height: 24),
                const Text(
                  'Connexion Utilisateur',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Étape 2 sur 2',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.white70,
                  ),
                ),
                const SizedBox(height: 48),
                FutureBuilder<List<Person>>(
                  future: ref.read(storageServiceProvider).getPeople(),
                  builder: (context, snapshot) {
                    // Load suggestions if available
                    if (snapshot.hasData && snapshot.data != null) {
                      _suggestionNames = snapshot.data!.map((p) => p.firstName).toList();
                    }
                    
                    return Autocomplete<String>(
                      optionsBuilder: (TextEditingValue textEditingValue) {
                        if (textEditingValue.text.isEmpty) {
                          return const Iterable<String>.empty();
                        }
                        return _suggestionNames.where((String name) =>
                            name.toLowerCase().contains(textEditingValue.text.toLowerCase()));
                      },
                      onSelected: (String selection) {
                        _firstNameController?.text = selection;
                      },
                      fieldViewBuilder: (BuildContext context,
                          TextEditingController textEditingController,
                          FocusNode focusNode,
                          VoidCallback onFieldSubmitted) {
                        _firstNameController = textEditingController;
                        return TextField(
                          controller: _firstNameController,
                          focusNode: focusNode,
                          decoration: InputDecoration(
                            labelText: 'Prénom',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                            filled: true,
                            fillColor: Colors.white,
                          ),
                        );
                      },
                    );
                  },
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _personalPinController,
                  decoration: InputDecoration(
                    labelText: 'PIN personnel',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    filled: true,
                    fillColor: Colors.white,
                  ),
                  obscureText: true,
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _handleLogin,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.orange,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: _isLoading
                        ? const CircularProgressIndicator(color: Colors.white)
                        : const Text(
                            'Connexion',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                  ),
                ),
                const SizedBox(height: 16),
                TextButton(
                  onPressed: _isLoading ? null : widget.onBack,
                  child: const Text(
                    'Retour',
                    style: TextStyle(color: Colors.white),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
