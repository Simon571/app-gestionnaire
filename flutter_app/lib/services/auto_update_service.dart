import 'dart:io';
import 'package:firebase_app_distribution/firebase_app_distribution.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:flutter/material.dart';

/// Service pour gérer les mises à jour automatiques via Firebase App Distribution
class AutoUpdateService {
  static final FirebaseAppDistribution _appDistribution =
      FirebaseAppDistribution.instance;

  /// Vérifie s'il y a une nouvelle version disponible
  static Future<void> checkForUpdate(BuildContext context) async {
    // Ne fonctionne que sur Android (pas en développement)
    if (!Platform.isAndroid) return;

    try {
      // Vérifier si une mise à jour est disponible
      final newRelease = await _appDistribution.checkForUpdate();

      if (newRelease != null) {
        // ignore: use_build_context_synchronously
        _showUpdateDialog(context, newRelease);
      }
    } catch (e) {
      debugPrint('Erreur lors de la vérification de mise à jour: $e');
      // Ne pas bloquer l'app si la vérification échoue
    }
  }

  /// Affiche une boîte de dialogue pour proposer la mise à jour
  static void _showUpdateDialog(
      BuildContext context, AppDistributionRelease release) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Mise à jour disponible'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Version ${release.displayVersion} est disponible.'),
            const SizedBox(height: 8),
            if (release.releaseNotes != null &&
                release.releaseNotes!.isNotEmpty)
              Text(
                release.releaseNotes!,
                style: const TextStyle(fontSize: 12, color: Colors.grey),
              ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Plus tard'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              _installUpdate();
            },
            child: const Text('Installer'),
          ),
        ],
      ),
    );
  }

  /// Lance le téléchargement et l'installation de la mise à jour
  static Future<void> _installUpdate() async {
    try {
      await _appDistribution.updateApp();
    } catch (e) {
      debugPrint('Erreur lors de l\'installation de la mise à jour: $e');
    }
  }

  /// Active la vérification automatique au démarrage de l'app
  static Future<void> enableAutoUpdate() async {
    if (!Platform.isAndroid) return;

    try {
      await _appDistribution.isTesterSignedIn();
    } catch (e) {
      debugPrint('Firebase App Distribution non configuré: $e');
    }
  }

  /// Récupère la version actuelle de l'application
  static Future<String> getCurrentVersion() async {
    final packageInfo = await PackageInfo.fromPlatform();
    return '${packageInfo.version} (${packageInfo.buildNumber})';
  }
}
