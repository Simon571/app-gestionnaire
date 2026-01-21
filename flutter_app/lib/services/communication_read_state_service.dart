import 'package:flutter/foundation.dart';
import 'storage_service.dart';

/// Service pour gérer l'état de lecture des communications
class CommunicationReadStateService {
  final StorageService _storage;
  final String? _userId;

  CommunicationReadStateService(this._storage, this._userId);

  /// Clé de stockage pour les états de lecture
  String get _storageKey => 'communication_read_states_${_userId ?? "guest"}';

  /// Charge les états de lecture depuis le stockage
  Future<Map<String, DateTime>> _loadReadStates() async {
    try {
      final data = await _storage.getGenericData(_storageKey);
      if (data != null && data['readStates'] is Map) {
        final states = data['readStates'] as Map;
        return states.map((key, value) {
          if (value is String) {
            final date = DateTime.tryParse(value);
            return MapEntry(key.toString(), date ?? DateTime.now());
          }
          return MapEntry(key.toString(), DateTime.now());
        });
      }
    } catch (e) {
      if (kDebugMode) {
        print('❌ Error loading read states: $e');
      }
    }
    return {};
  }

  /// Sauvegarde les états de lecture
  Future<void> _saveReadStates(Map<String, DateTime> states) async {
    try {
      await _storage.saveGenericData(_storageKey, {
        'readStates': states.map((key, value) => MapEntry(key, value.toIso8601String())),
        'updatedAt': DateTime.now().toIso8601String(),
      });
    } catch (e) {
      if (kDebugMode) {
        print('❌ Error saving read states: $e');
      }
    }
  }

  /// Marque une communication comme lue
  Future<void> markAsRead(String communicationId) async {
    final states = await _loadReadStates();
    states[communicationId] = DateTime.now();
    await _saveReadStates(states);
    
    if (kDebugMode) {
      print('✅ Marked communication as read: $communicationId');
    }
  }

  /// Marque plusieurs communications comme lues
  Future<void> markMultipleAsRead(List<String> communicationIds) async {
    final states = await _loadReadStates();
    final now = DateTime.now();
    
    for (final id in communicationIds) {
      states[id] = now;
    }
    
    await _saveReadStates(states);
    
    if (kDebugMode) {
      print('✅ Marked ${communicationIds.length} communications as read');
    }
  }

  /// Vérifie si une communication a été lue
  Future<bool> isRead(String communicationId) async {
    final states = await _loadReadStates();
    return states.containsKey(communicationId);
  }

  /// Récupère la date de lecture d'une communication
  Future<DateTime?> getReadDate(String communicationId) async {
    final states = await _loadReadStates();
    return states[communicationId];
  }

  /// Marque une communication comme non lue
  Future<void> markAsUnread(String communicationId) async {
    final states = await _loadReadStates();
    states.remove(communicationId);
    await _saveReadStates(states);
    
    if (kDebugMode) {
      print('✅ Marked communication as unread: $communicationId');
    }
  }

  /// Compte le nombre de communications non lues
  Future<int> countUnread(List<String> communicationIds) async {
    final states = await _loadReadStates();
    return communicationIds.where((id) => !states.containsKey(id)).length;
  }

  /// Récupère les IDs des communications non lues
  Future<List<String>> getUnreadIds(List<String> communicationIds) async {
    final states = await _loadReadStates();
    return communicationIds.where((id) => !states.containsKey(id)).toList();
  }

  /// Récupère les IDs des communications lues
  Future<List<String>> getReadIds(List<String> communicationIds) async {
    final states = await _loadReadStates();
    return communicationIds.where((id) => states.containsKey(id)).toList();
  }

  /// Supprime les états de lecture pour les communications qui n'existent plus
  Future<void> cleanupOrphanedStates(List<String> existingCommunicationIds) async {
    final states = await _loadReadStates();
    final existingSet = existingCommunicationIds.toSet();
    
    // Garder seulement les états pour les communications existantes
    final cleanedStates = Map<String, DateTime>.fromEntries(
      states.entries.where((entry) => existingSet.contains(entry.key))
    );
    
    if (cleanedStates.length != states.length) {
      await _saveReadStates(cleanedStates);
      
      if (kDebugMode) {
        print('🧹 Cleaned ${states.length - cleanedStates.length} orphaned read states');
      }
    }
  }

  /// Supprime tous les états de lecture
  Future<void> clearAll() async {
    await _saveReadStates({});
    
    if (kDebugMode) {
      print('🧹 Cleared all read states');
    }
  }

  /// Supprime les états de lecture d'un tableau spécifique
  Future<void> clearForBoard(String boardType, List<String> boardCommunicationIds) async {
    final states = await _loadReadStates();
    final boardIdsSet = boardCommunicationIds.toSet();
    
    // Retirer les états pour ce tableau
    final cleanedStates = Map<String, DateTime>.fromEntries(
      states.entries.where((entry) => !boardIdsSet.contains(entry.key))
    );
    
    await _saveReadStates(cleanedStates);
    
    if (kDebugMode) {
      print('🧹 Cleared read states for board: $boardType');
    }
  }

  /// Exporte les états de lecture pour synchronisation
  Future<Map<String, dynamic>> exportReadStates() async {
    final states = await _loadReadStates();
    return {
      'userId': _userId,
      'readStates': states.map((key, value) => MapEntry(key, value.toIso8601String())),
      'exportedAt': DateTime.now().toIso8601String(),
    };
  }

  /// Importe les états de lecture depuis une synchronisation
  Future<void> importReadStates(Map<String, dynamic> data) async {
    try {
      if (data['readStates'] is Map) {
        final importedStates = (data['readStates'] as Map).map((key, value) {
          if (value is String) {
            final date = DateTime.tryParse(value);
            return MapEntry(key.toString(), date ?? DateTime.now());
          }
          return MapEntry(key.toString(), DateTime.now());
        });
        
        // Fusionner avec les états existants (garder la date la plus récente)
        final existingStates = await _loadReadStates();
        for (final entry in importedStates.entries) {
          final existingDate = existingStates[entry.key];
          if (existingDate == null || entry.value.isAfter(existingDate)) {
            existingStates[entry.key] = entry.value;
          }
        }
        
        await _saveReadStates(existingStates);
        
        if (kDebugMode) {
          print('✅ Imported ${importedStates.length} read states');
        }
      }
    } catch (e) {
      if (kDebugMode) {
        print('❌ Error importing read states: $e');
      }
    }
  }

  /// Récupère les statistiques de lecture
  Future<Map<String, dynamic>> getReadStatistics(List<Map<String, dynamic>> communications) async {
    final states = await _loadReadStates();
    
    int totalRead = 0;
    int totalUnread = 0;
    final Map<String, int> readByBoard = {};
    final Map<String, int> unreadByBoard = {};
    
    for (final comm in communications) {
      final id = comm['id']?.toString();
      final boardType = (comm['boardType'] ?? 'assembly').toString();
      
      if (id != null) {
        if (states.containsKey(id)) {
          totalRead++;
          readByBoard[boardType] = (readByBoard[boardType] ?? 0) + 1;
        } else {
          totalUnread++;
          unreadByBoard[boardType] = (unreadByBoard[boardType] ?? 0) + 1;
        }
      }
    }
    
    return {
      'total': communications.length,
      'read': totalRead,
      'unread': totalUnread,
      'readPercentage': communications.isNotEmpty 
          ? (totalRead / communications.length * 100).toStringAsFixed(1)
          : '0.0',
      'readByBoard': readByBoard,
      'unreadByBoard': unreadByBoard,
    };
  }
}
