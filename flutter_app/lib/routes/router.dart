import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';
import '../screens/login_screen.dart';
import '../screens/main_screen.dart';
import '../screens/admin_import_users.dart';
import '../screens/developer_settings.dart';

final goRouterProvider = Provider<GoRouter>((ref) {
  // Ne pas watcher authStateProvider pour éviter les rebuilds constants
  // On lit juste l'état au moment de la redirection
  
  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      // Lire l'état actuel d'authentification sans déclencher de rebuild
      final authState = ref.read(authStateProvider);
      final isAuthenticated = authState.isFullyAuthenticated;
      final isOnLogin = state.matchedLocation == '/login';

      // Allow access to developer settings even before authentication.
      if (state.matchedLocation == '/admin/dev-settings') {
        return null;
      }

      // In debug builds, allow admin import screen without authentication.
      if (kDebugMode && state.matchedLocation == '/admin/import-users') {
        return null;
      }

      if (!isAuthenticated && !isOnLogin) {
        return '/login';
      }

      if (isAuthenticated && isOnLogin) {
        return '/home';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => const MainScreen(),
      ),
      // Admin import users (debug only)
      if (kDebugMode)
        GoRoute(
          path: '/admin/import-users',
          builder: (context, state) => const AdminImportUsers(),
        ),
      // Developer settings (available in release too: used to configure API base)
      GoRoute(
        path: '/admin/dev-settings',
        builder: (context, state) => const DeveloperSettings(),
      ),
      GoRoute(
        path: '/',
        redirect: (context, state) => '/login',
      ),
    ],
  );
});
