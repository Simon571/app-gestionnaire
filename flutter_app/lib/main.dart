import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'utils/logger.dart';
import 'package:intl/intl.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'routes/router.dart';
import 'providers/auth_provider.dart';
import 'providers/sync_provider.dart';
import 'models/person.dart';
import 'widgets/connectivity_banner.dart';
import 'services/update_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialiser les services au démarrage
  await initializeSharedServices();
  
  // Charger les données de test au démarrage
  // Initialiser la locale pour intl (formatage des dates en français)
  await initializeDateFormatting('fr_FR');
  Intl.defaultLocale = 'fr_FR';
  
  // Initialiser au minimum l'assemblée (nécessaire pour le fonctionnement)
  await _initializeAssemblyData();
  
  // Charger les vrais utilisateurs du publisher-app, sinon fallback test data
  try {
    final storage = getSharedStorageService();
    final prefs = await SharedPreferences.getInstance();
    
    // Nettoyer les prefs corrompues
    try {
      final existing = prefs.getString('people');
      if (existing != null) {
        jsonDecode(existing);
      }
    } catch (e) {
      print('⚠️ Prefs corrupted, removing: $e');
      await prefs.remove('people');
    }
    
    // Charger les utilisateurs (API, asset ou local)
    final people = await storage.getPeople();
    print('✓ Users loaded at startup: count=${storage.lastPeopleCount}, source=${storage.lastPeopleSource}');
    
    // Vérifier si au moins un utilisateur a un PIN
    final usersWithPin = people.where((p) => p.pin != null && p.pin!.isNotEmpty).toList();
    if (usersWithPin.isEmpty) {
      if (kDebugMode) {
        print('⚠️ Aucun utilisateur avec PIN trouvé (source: ${storage.lastPeopleSource})');
      }
      // Ne pas charger les données de test automatiquement - attendre que l'utilisateur configure l'API
    } else {
      print('✓ ${usersWithPin.length} utilisateurs avec PIN disponibles');
    }
  } catch (e) {
    print('⚠️ Failed to load publisher-app users: $e - falling back to test data');
    // Si les vrais utilisateurs ne se chargent pas, utiliser les données de test
    await _initializeTestData();
  }
  
  runApp(const ProviderScope(child: MyApp()));
}

// Initialiser uniquement les données d'assemblée (nécessaire pour le démarrage)
Future<void> _initializeAssemblyData() async {
  final prefs = await SharedPreferences.getInstance();
  
  // Sauvegarder l'assemblée par défaut
  final assemblyData = {
    'id': 'ASM-001',
    'name': 'Congrégation Chrétienne Afrique',
    'region': 'Afrique',
    'pin': '1234',
    'weekdayMeeting': 4,
    'weekendMeeting': 7,
    'country': 'RDC'
  };
  
  // Sauvegarder seulement si pas déjà présente
  if (!prefs.containsKey('assembly')) {
    await prefs.setString('assembly', jsonEncode(assemblyData));
    AppLogger.log('✓ Assemblée par défaut initialisée');
  }
}

// Initialiser les données de test
Future<void> _initializeTestData() async {
  final prefs = await SharedPreferences.getInstance();
  final storage = getSharedStorageService();
  
  AppLogger.log('⏳ Ajout des utilisateurs de test avec PIN...');
  
  // Charger les utilisateurs existants
  List<Map<String, dynamic>> existingUsers = [];
  try {
    final people = await storage.getPeople();
    existingUsers = people.map((p) => p.toJson()).toList();
    AppLogger.log('✓ ${existingUsers.length} utilisateurs existants chargés');
  } catch (e) {
    AppLogger.log('⚠️ Impossible de charger les utilisateurs existants: $e');
  }
  
  // Données de test avec PIN
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
        'services': ['portier', 'son', 'micro roulant'],
        'ministry': ['visite', 'lettre']
      },
      'activity': [
        {
          'month': '2025-11',
          'participated': true,
          'bibleStudies': 1,
          'hours': 12.5,
          'isAuxiliaryPioneer': true,
          'isLate': false,
          'remarks': 'En forme'
        }
      ],
      'meetingParticipation': {
        '2025-11-27': true,
        '2025-11-30': false,
      }
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
        'services': ['santé', 'hôtesse'],
        'ministry': ['visite']
      },
      'activity': [
        {
          'month': '2025-11',
          'participated': true,
          'bibleStudies': 0,
          'hours': 8.0,
          'isAuxiliaryPioneer': false,
          'isLate': false,
          'remarks': 'Bien'
        }
      ]
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
        'services': ['son', 'micro roulant', 'portier principal'],
        'ministry': ['visite', 'lettre', 'témoignage']
      },
      'activity': [
        {
          'month': '2025-11',
          'participated': true,
          'bibleStudies': 2,
          'hours': 18.5,
          'isAuxiliaryPioneer': false,
          'isLate': false,
          'remarks': 'Excellent'
        }
      ]
    }
  ];
  
  // Fusionner les utilisateurs de test avec les utilisateurs existants
  // Éviter les doublons basés sur l'ID
  final Set<String> existingIds = existingUsers.map((u) => u['id'] as String? ?? '').toSet();
  for (final testUser in testUsers) {
    final testId = testUser['id'] as String;
    if (!existingIds.contains(testId)) {
      existingUsers.add(testUser);
      AppLogger.log('✓ Ajout utilisateur de test: ${testUser['firstName']}');
    }
  }
  
  // Sauvegarder tous les utilisateurs (existants + test)
  await prefs.setString('people', jsonEncode(existingUsers));
  AppLogger.log('✓ ${existingUsers.length} utilisateurs sauvegardés (dont ${testUsers.length} avec PIN de test)');
  AppLogger.log('  - Utilisateurs de test: Jean (1234), Marie (5678), Paul (9012)');
}

class MyApp extends ConsumerStatefulWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  ConsumerState<MyApp> createState() => _MyAppState();
}

class _MyAppState extends ConsumerState<MyApp> {
  @override
  void initState() {
    super.initState();
    // Initialiser l'état d'authentification et lancer la synchronisation
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initializeApp();
    });
  }

  Future<void> _initializeApp() async {
    // Initialiser l'état d'authentification en chargeant les données sauvegardées
    await ref.read(authStateProvider.notifier).initAuth();
    
    // Vérifier les mises à jour disponibles (Android uniquement) - Temporairement désactivé
    /*
    if (Platform.isAndroid && mounted) {
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) {
          AutoUpdateService.checkForUpdate(context);
        }
      });
    }
    */
    
    // Lancer la synchronisation automatique au démarrage
    final syncNotifier = ref.read(syncProvider.notifier);
    await syncNotifier.syncNow();
    
    // Démarrer la synchronisation automatique toutes les 2 minutes
    syncNotifier.startAutoSync(interval: const Duration(minutes: 2));
    
    AppLogger.log('✓ Application initialisée - Authentification et synchronisation activées');
    
    // Vérifier les mises à jour au démarrage (après un délai)
    Future.delayed(const Duration(seconds: 3), () async {
      final updateInfo = await UpdateService.checkForUpdate();
      if (updateInfo != null && mounted) {
        UpdateService.showUpdateDialog(context, updateInfo);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final goRouter = ref.watch(goRouterProvider);

    return MaterialApp.router(
      title: 'Gestionnaire d\'Assemblee',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
        fontFamily: 'Roboto',
        brightness: Brightness.light,
      ),
      darkTheme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blueGrey, brightness: Brightness.dark),
        useMaterial3: true,
        fontFamily: 'Roboto',
        brightness: Brightness.dark,
      ),
      themeMode: ThemeMode.system,
      routerConfig: goRouter,
      debugShowCheckedModeBanner: false,
      builder: (context, child) {
        return Stack(
          children: [
            if (child != null) child,
            const Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: ConnectivityBanner(),
            ),
          ],
        );
      },
    );
  }
}
