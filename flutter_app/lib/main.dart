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
import 'providers/auth_provider.dart' show initializeSharedServices, getSharedStorageService, authStateProvider;
import 'providers/sync_provider.dart';
import 'models/person.dart';
import 'widgets/connectivity_banner.dart';
import 'services/update_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialiser les services au démarrage
  await initializeSharedServices();
  
  // Initialiser la locale pour intl (formatage des dates en français)
  await initializeDateFormatting('fr_FR');
  Intl.defaultLocale = 'fr_FR';
  
  // Charger les utilisateurs depuis le serveur de production
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
      print('ℹ️ Aucun utilisateur avec PIN trouvé — l\'utilisateur doit configurer son assemblée');
    } else {
      print('✓ ${usersWithPin.length} utilisateurs avec PIN disponibles');
    }
  } catch (e) {
    print('⚠️ Failed to load users: $e — l\'utilisateur doit se connecter à une assemblée');
  }

  runApp(const ProviderScope(child: MyApp()));
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
