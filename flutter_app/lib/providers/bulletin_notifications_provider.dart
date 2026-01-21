import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/storage_service.dart';
import 'auth_provider.dart';

/// Notification pour les nouveaux contenus des tableaux d'affichage
class BulletinNotification {
  final String id;
  final String boardType; // 'assembly', 'elders', 'elders-assistants'
  final String boardLabel;
  final int newCount;
  final DateTime receivedAt;
  final bool isRead;

  const BulletinNotification({
    required this.id,
    required this.boardType,
    required this.boardLabel,
    required this.newCount,
    required this.receivedAt,
    this.isRead = false,
  });

  BulletinNotification copyWith({
    String? id,
    String? boardType,
    String? boardLabel,
    int? newCount,
    DateTime? receivedAt,
    bool? isRead,
  }) {
    return BulletinNotification(
      id: id ?? this.id,
      boardType: boardType ?? this.boardType,
      boardLabel: boardLabel ?? this.boardLabel,
      newCount: newCount ?? this.newCount,
      receivedAt: receivedAt ?? this.receivedAt,
      isRead: isRead ?? this.isRead,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'boardType': boardType,
      'boardLabel': boardLabel,
      'newCount': newCount,
      'receivedAt': receivedAt.toIso8601String(),
      'isRead': isRead,
    };
  }

  factory BulletinNotification.fromJson(Map<String, dynamic> json) {
    return BulletinNotification(
      id: json['id'] as String,
      boardType: json['boardType'] as String,
      boardLabel: json['boardLabel'] as String,
      newCount: json['newCount'] as int,
      receivedAt: DateTime.parse(json['receivedAt'] as String),
      isRead: json['isRead'] as bool? ?? false,
    );
  }
}

/// State pour gérer les notifications des tableaux d'affichage
class BulletinNotificationsNotifier extends Notifier<List<BulletinNotification>> {
  @override
  List<BulletinNotification> build() {
    _loadNotifications();
    return [];
  }

  /// Charge les notifications depuis le stockage local
  Future<void> _loadNotifications() async {
    try {
      final storage = ref.read(storageServiceProvider);
      final data = await storage.getGenericData('bulletin_notifications');
      if (data != null && data['notifications'] is List) {
        final notifications = (data['notifications'] as List)
            .map((item) {
              if (item is Map<String, dynamic>) {
                return BulletinNotification.fromJson(item);
              }
              return null;
            })
            .whereType<BulletinNotification>()
            .toList();
        
        state = notifications;
      }
    } catch (e) {
      if (kDebugMode) {
        print('❌ Error loading bulletin notifications: $e');
      }
    }
  }

  /// Sauvegarde les notifications dans le stockage local
  Future<void> _saveNotifications() async {
    try {
      final storage = ref.read(storageServiceProvider);
      await storage.saveGenericData('bulletin_notifications', {
        'notifications': state.map((n) => n.toJson()).toList(),
        'updatedAt': DateTime.now().toIso8601String(),
      });
    } catch (e) {
      if (kDebugMode) {
        print('❌ Error saving bulletin notifications: $e');
      }
    }
  }

  /// Ajoute une nouvelle notification
  void addNotification({
    required String boardType,
    required String boardLabel,
    required int newCount,
  }) {
    final notification = BulletinNotification(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      boardType: boardType,
      boardLabel: boardLabel,
      newCount: newCount,
      receivedAt: DateTime.now(),
      isRead: false,
    );

    state = [...state, notification];
    _saveNotifications();
  }

  /// Marque une notification comme lue
  void markAsRead(String notificationId) {
    state = state.map((n) {
      if (n.id == notificationId) {
        return n.copyWith(isRead: true);
      }
      return n;
    }).toList();
    _saveNotifications();
  }

  /// Marque toutes les notifications d'un tableau comme lues
  void markAllAsReadForBoard(String boardType) {
    state = state.map((n) {
      if (n.boardType == boardType) {
        return n.copyWith(isRead: true);
      }
      return n;
    }).toList();
    _saveNotifications();
  }

  /// Supprime une notification
  void removeNotification(String notificationId) {
    state = state.where((n) => n.id != notificationId).toList();
    _saveNotifications();
  }

  /// Supprime toutes les notifications lues
  void clearReadNotifications() {
    state = state.where((n) => !n.isRead).toList();
    _saveNotifications();
  }

  /// Supprime toutes les notifications
  void clearAll() {
    state = [];
    _saveNotifications();
  }

  /// Vérifie s'il y a de nouvelles communications et crée des notifications
  Future<void> checkForNewCommunications() async {
    try {
      final storage = ref.read(storageServiceProvider);
      final data = await storage.getGenericData('communications');
      if (data == null || data.isEmpty) return;

      final lastCheckStr = await storage.getGenericData('last_comm_check');
      final lastCheck = lastCheckStr != null && lastCheckStr['timestamp'] != null
          ? DateTime.tryParse(lastCheckStr['timestamp'] as String)
          : null;

      final allItems = (data['items'] as List?) ?? (data['communications'] as List?) ?? [];
      
      // Grouper par type de tableau et compter les nouveaux
      final Map<String, int> newByBoard = {};
      final Map<String, String> boardLabels = {
        'assembly': "Tableau d'affichage assemblée",
        'elders': "Tableau d'affichage anciens",
        'elders-assistants': "Tableau d'affichage anciens et assistants",
      };

      for (final item in allItems) {
        if (item is! Map<String, dynamic>) continue;
        
        final boardType = (item['boardType'] ?? 'assembly').toString();
        final displayAfter = DateTime.tryParse(item['displayAfter'] ?? '');
        
        // Si c'est une nouvelle communication (affichée après la dernière vérification)
        if (displayAfter != null && (lastCheck == null || displayAfter.isAfter(lastCheck))) {
          newByBoard[boardType] = (newByBoard[boardType] ?? 0) + 1;
        }
      }

      // Créer des notifications pour chaque tableau avec de nouvelles communications
      for (final entry in newByBoard.entries) {
        if (entry.value > 0) {
          addNotification(
            boardType: entry.key,
            boardLabel: boardLabels[entry.key] ?? entry.key,
            newCount: entry.value,
          );
        }
      }

      // Mettre à jour le timestamp de la dernière vérification
      await storage.saveGenericData('last_comm_check', {
        'timestamp': DateTime.now().toIso8601String(),
      });
    } catch (e) {
      if (kDebugMode) {
        print('❌ Error checking for new communications: $e');
      }
    }
  }

  /// Retourne le nombre total de notifications non lues
  int get unreadCount => state.where((n) => !n.isRead).length;

  /// Retourne les notifications non lues pour un tableau spécifique
  List<BulletinNotification> unreadForBoard(String boardType) {
    return state.where((n) => n.boardType == boardType && !n.isRead).toList();
  }
}

/// Provider pour gérer les notifications des tableaux d'affichage
final bulletinNotificationsProvider =
    NotifierProvider<BulletinNotificationsNotifier, List<BulletinNotification>>(BulletinNotificationsNotifier.new);

/// Provider pour le nombre total de notifications non lues
final unreadBulletinCountProvider = Provider<int>((ref) {
  final notifications = ref.watch(bulletinNotificationsProvider);
  return notifications.where((n) => !n.isRead).length;
});
