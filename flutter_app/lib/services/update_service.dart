import 'dart:io';
import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:dio/dio.dart';
import '../utils/logger.dart';

class UpdateService {
  // URL de votre serveur (à modifier avec votre domaine réel)
  static const String updateCheckUrl = 'http://localhost:3001/api/app/version';
  
  /// Vérifie s'il existe une nouvelle version disponible
  static Future<UpdateInfo?> checkForUpdate() async {
    try {
      // Récupérer la version actuelle de l'app
      final packageInfo = await PackageInfo.fromPlatform();
      final currentVersion = packageInfo.version;
      final currentBuildNumber = int.parse(packageInfo.buildNumber);
      
      AppLogger.log('🔍 Vérification de mise à jour - Version actuelle: $currentVersion ($currentBuildNumber)');
      
      // Appeler le serveur pour vérifier la dernière version
      final dio = Dio();
      final response = await dio.get(updateCheckUrl);
      
      if (response.statusCode == 200 && response.data != null) {
        final serverInfo = UpdateInfo.fromJson(response.data);
        
        // Comparer les versions
        if (serverInfo.buildNumber > currentBuildNumber) {
          AppLogger.log('✨ Nouvelle version disponible: ${serverInfo.version} (build ${serverInfo.buildNumber})');
          return serverInfo;
        } else {
          AppLogger.log('✓ Application à jour');
          return null;
        }
      }
      
      return null;
      
    } catch (e) {
      AppLogger.error('Erreur lors de la vérification de mise à jour', e);
      return null;
    }
  }
  
  /// Affiche un dialogue pour proposer la mise à jour
  static Future<void> showUpdateDialog(BuildContext context, UpdateInfo info) async {
    if (!context.mounted) return;
    
    return showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.system_update, color: Colors.blue.shade700),
            const SizedBox(width: 12),
            const Text('Mise à jour disponible'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Version ${info.version} est disponible',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            if (info.releaseNotes.isNotEmpty) ...[
              const Text('Nouveautés:', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 4),
              Text(info.releaseNotes),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Plus tard'),
          ),
          FilledButton.icon(
            onPressed: () {
              Navigator.of(context).pop();
              _downloadAndInstallUpdate(context, info.downloadUrl);
            },
            icon: const Icon(Icons.download),
            label: const Text('Mettre à jour'),
          ),
        ],
      ),
    );
  }
  
  /// Télécharge et installe la mise à jour
  static Future<void> _downloadAndInstallUpdate(BuildContext context, String downloadUrl) async {
    try {
      // Lancer le navigateur pour télécharger l'APK
      final uri = Uri.parse(downloadUrl);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
        
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Téléchargement en cours... Installez le fichier APK téléchargé.'),
              duration: Duration(seconds: 5),
            ),
          );
        }
      }
    } catch (e) {
      AppLogger.error('Erreur lors du téléchargement de la mise à jour', e);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Erreur lors du téléchargement de la mise à jour'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}

class UpdateInfo {
  final String version;
  final int buildNumber;
  final String downloadUrl;
  final String releaseNotes;
  
  UpdateInfo({
    required this.version,
    required this.buildNumber,
    required this.downloadUrl,
    this.releaseNotes = '',
  });
  
  factory UpdateInfo.fromJson(Map<String, dynamic> json) {
    return UpdateInfo(
      version: json['version'] ?? '',
      buildNumber: json['buildNumber'] ?? 0,
      downloadUrl: json['downloadUrl'] ?? '',
      releaseNotes: json['releaseNotes'] ?? '',
    );
  }
}
