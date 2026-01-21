import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;

/// Service pour gérer le téléchargement et le stockage des pièces jointes
class AttachmentService {
  /// Répertoire de base pour stocker les pièces jointes
  Future<Directory> get _attachmentsDir async {
    final appDir = await getApplicationDocumentsDirectory();
    final attachmentsDir = Directory(path.join(appDir.path, 'bulletin_attachments'));
    if (!await attachmentsDir.exists()) {
      await attachmentsDir.create(recursive: true);
    }
    return attachmentsDir;
  }

  /// Télécharge une pièce jointe depuis une URL
  Future<File?> downloadAttachment({
    required String url,
    required String fileName,
    required String boardType,
    required String communicationId,
    Function(double)? onProgress,
  }) async {
    try {
      // Créer un sous-répertoire pour le type de tableau
      final baseDir = await _attachmentsDir;
      final boardDir = Directory(path.join(baseDir.path, boardType));
      if (!await boardDir.exists()) {
        await boardDir.create(recursive: true);
      }

      // Nettoyer le nom de fichier
      final cleanFileName = _sanitizeFileName(fileName);
      final filePath = path.join(boardDir.path, '${communicationId}_$cleanFileName');
      final file = File(filePath);

      // Si le fichier existe déjà, le retourner
      if (await file.exists()) {
        if (kDebugMode) {
          print('📎 Attachment already exists: $filePath');
        }
        return file;
      }

      if (kDebugMode) {
        print('📥 Downloading attachment from: $url');
      }

      // Télécharger le fichier avec support de progression
      final response = await http.Client().send(http.Request('GET', Uri.parse(url)));
      
      if (response.statusCode == 200) {
        final contentLength = response.contentLength ?? 0;
        var downloadedBytes = 0;
        final bytes = <int>[];
        
        await for (var chunk in response.stream) {
          bytes.addAll(chunk);
          downloadedBytes += chunk.length;
          
          if (contentLength > 0 && onProgress != null) {
            final progress = downloadedBytes / contentLength;
            onProgress(progress);
          }
        }
        
        await file.writeAsBytes(bytes);
        
        if (kDebugMode) {
          print('✅ Attachment downloaded: $filePath (${formatBytes(bytes.length)})');
        }
        
        return file;
      } else {
        if (kDebugMode) {
          print('❌ Failed to download attachment: ${response.statusCode}');
        }
        return null;
      }
    } catch (e) {
      if (kDebugMode) {
        print('❌ Error downloading attachment: $e');
      }
      return null;
    }
  }

  /// Vérifie si une pièce jointe est déjà téléchargée
  Future<bool> isAttachmentDownloaded({
    required String fileName,
    required String boardType,
    required String communicationId,
  }) async {
    try {
      final baseDir = await _attachmentsDir;
      final cleanFileName = _sanitizeFileName(fileName);
      final filePath = path.join(baseDir.path, boardType, '${communicationId}_$cleanFileName');
      final file = File(filePath);
      return await file.exists();
    } catch (e) {
      return false;
    }
  }

  /// Récupère le chemin local d'une pièce jointe
  Future<String?> getAttachmentPath({
    required String fileName,
    required String boardType,
    required String communicationId,
  }) async {
    try {
      final baseDir = await _attachmentsDir;
      final cleanFileName = _sanitizeFileName(fileName);
      final filePath = path.join(baseDir.path, boardType, '${communicationId}_$cleanFileName');
      final file = File(filePath);
      
      if (await file.exists()) {
        return filePath;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /// Supprime une pièce jointe
  Future<bool> deleteAttachment({
    required String fileName,
    required String boardType,
    required String communicationId,
  }) async {
    try {
      final baseDir = await _attachmentsDir;
      final cleanFileName = _sanitizeFileName(fileName);
      final filePath = path.join(baseDir.path, boardType, '${communicationId}_$cleanFileName');
      final file = File(filePath);
      
      if (await file.exists()) {
        await file.delete();
        if (kDebugMode) {
          print('🗑️ Attachment deleted: $filePath');
        }
        return true;
      }
      return false;
    } catch (e) {
      if (kDebugMode) {
        print('❌ Error deleting attachment: $e');
      }
      return false;
    }
  }

  /// Supprime toutes les pièces jointes d'un tableau
  Future<int> deleteAllAttachmentsForBoard(String boardType) async {
    try {
      final baseDir = await _attachmentsDir;
      final boardDir = Directory(path.join(baseDir.path, boardType));
      
      if (await boardDir.exists()) {
        final files = await boardDir.list().toList();
        int count = 0;
        
        for (final file in files) {
          if (file is File) {
            await file.delete();
            count++;
          }
        }
        
        if (kDebugMode) {
          print('🗑️ Deleted $count attachments for board: $boardType');
        }
        
        return count;
      }
      return 0;
    } catch (e) {
      if (kDebugMode) {
        print('❌ Error deleting attachments for board: $e');
      }
      return 0;
    }
  }

  /// Calcule la taille totale des pièces jointes
  Future<int> getTotalAttachmentsSize() async {
    try {
      final baseDir = await _attachmentsDir;
      int totalSize = 0;
      
      await for (final entity in baseDir.list(recursive: true)) {
        if (entity is File) {
          final stat = await entity.stat();
          totalSize += stat.size;
        }
      }
      
      return totalSize;
    } catch (e) {
      if (kDebugMode) {
        print('❌ Error calculating attachments size: $e');
      }
      return 0;
    }
  }

  /// Formate la taille en octets en format lisible
  String formatBytes(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    if (bytes < 1024 * 1024 * 1024) return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
  }

  /// Nettoie un nom de fichier pour le système de fichiers
  String _sanitizeFileName(String fileName) {
    // Remplacer les caractères invalides
    return fileName
        .replaceAll(RegExp(r'[<>:"/\\|?*]'), '_')
        .replaceAll(RegExp(r'\s+'), '_')
        .trim();
  }

  /// Liste toutes les pièces jointes téléchargées
  Future<List<Map<String, dynamic>>> listAllAttachments() async {
    try {
      final baseDir = await _attachmentsDir;
      final attachments = <Map<String, dynamic>>[];
      
      await for (final entity in baseDir.list(recursive: true)) {
        if (entity is File) {
          final stat = await entity.stat();
          final relativePath = path.relative(entity.path, from: baseDir.path);
          final parts = relativePath.split(path.separator);
          
          attachments.add({
            'path': entity.path,
            'boardType': parts.isNotEmpty ? parts[0] : 'unknown',
            'fileName': path.basename(entity.path),
            'size': stat.size,
            'modified': stat.modified,
          });
        }
      }
      
      return attachments;
    } catch (e) {
      if (kDebugMode) {
        print('❌ Error listing attachments: $e');
      }
      return [];
    }
  }
}
