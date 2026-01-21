import '../utils/logger.dart';
import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/sync_service.dart';
import '../services/storage_service.dart';
import 'auth_provider.dart' show storageServiceProvider;
import 'vcm_assignments_provider.dart';

/// État de la synchronisation
enum SyncState {
  idle,
  syncing,
  success,
  error,
}

/// État complet de la synchronisation
class SyncStateData {
  final SyncState state;
  final String? lastError;
  final int pendingJobsCount;
  final DateTime? lastSyncTime;
  final List<SyncJob> recentJobs;

  const SyncStateData({
    this.state = SyncState.idle,
    this.lastError,
    this.pendingJobsCount = 0,
    this.lastSyncTime,
    this.recentJobs = const [],
  });

  SyncStateData copyWith({
    SyncState? state,
    String? lastError,
    int? pendingJobsCount,
    DateTime? lastSyncTime,
    List<SyncJob>? recentJobs,
  }) {
    return SyncStateData(
      state: state ?? this.state,
      lastError: lastError,
      pendingJobsCount: pendingJobsCount ?? this.pendingJobsCount,
      lastSyncTime: lastSyncTime ?? this.lastSyncTime,
      recentJobs: recentJobs ?? this.recentJobs,
    );
  }

  bool get isSyncing => state == SyncState.syncing;
  bool get hasError => state == SyncState.error;
}

/// Provider pour le SyncService (utilise storageServiceProvider depuis auth_provider)
final syncServiceProvider = Provider<SyncService>((ref) {
  final storage = ref.watch(storageServiceProvider);
  return SyncService(storage);
});

/// Notifier pour la gestion de la synchronisation
class SyncNotifier extends Notifier<SyncStateData> {
  late final SyncService _syncService;
  Timer? _autoSyncTimer;

  @override
  SyncStateData build() {
    _syncService = ref.read(syncServiceProvider);
    return const SyncStateData();
  }

  /// Lance une synchronisation manuelle
  Future<bool> syncNow() async {
    if (state.isSyncing) {
      return false;
    }

    state = state.copyWith(state: SyncState.syncing, lastError: null);

    try {
      final result = await _syncService.syncAll();

      if (result.success) {
        state = state.copyWith(
          state: SyncState.success,
          lastSyncTime: DateTime.now(),
          recentJobs: result.jobs,
          pendingJobsCount: 0,
        );
        _refreshDataProviders(result.jobs);
        if (kDebugMode) {
          AppLogger.log('SyncNotifier: sync success, \\${result.jobsProcessed} jobs processed');
        }
      } else {
        state = state.copyWith(
          state: SyncState.error,
          lastError: result.errors.isNotEmpty
              ? result.errors.join(' | ')
              : 'Erreur de synchronisation',
        );
        if (kDebugMode) {
          AppLogger.error('SyncNotifier: sync failed', result.errors);
        }
      }
      return result.success;
    } catch (e) {
      state = state.copyWith(
        state: SyncState.error,
        lastError: 'Erreur inattendue: $e',
      );
      if (kDebugMode) {
        AppLogger.error('SyncNotifier: sync exception', e);
      }
      return false;
    }
  }

  /// Vérifie s'il y a des mises à jour sans les traiter
  Future<int> checkForUpdates() async {
    try {
      final result = await _syncService.fetchUpdates();
      if (result.success) {
        state = state.copyWith(pendingJobsCount: result.jobs.length);
        return result.jobs.length;
      }
      return 0;
    } catch (e) {
      if (kDebugMode) {
        AppLogger.error('SyncNotifier: check updates failed', e);
      }
      return 0;
    }
  }

  /// Démarre la synchronisation automatique
  void startAutoSync({Duration interval = const Duration(minutes: 5)}) {
    stopAutoSync();
    _autoSyncTimer = Timer.periodic(interval, (_) async {
      if (!state.isSyncing) {
        await syncNow();
      }
    });
    if (kDebugMode) {
      AppLogger.log('SyncNotifier: auto-sync started (every \\${interval.inMinutes} min)');
    }
  }

  /// Arrête la synchronisation automatique
  void stopAutoSync() {
    _autoSyncTimer?.cancel();
    _autoSyncTimer = null;
    
    if (kDebugMode) {
      AppLogger.log('SyncNotifier: auto-sync stopped');
    }
  }

  /// Réinitialise l'état d'erreur
  void clearError() {
    if (state.hasError) {
      state = state.copyWith(state: SyncState.idle, lastError: null);
    }
  }

  /// Annule tous les jobs en attente
  Future<void> clearPendingJobs() async {
    try {
      await _syncService.clearAllPendingJobs();
      state = state.copyWith(pendingJobsCount: 0);
      if (kDebugMode) {
        AppLogger.log('SyncNotifier: cleared all pending jobs');
      }
    } catch (e) {
      if (kDebugMode) {
        AppLogger.error('SyncNotifier: failed to clear pending jobs', e);
      }
    }
  }

  /// Obtient le label du type de job
  static String getJobTypeLabel(SyncJobType type) {
    switch (type) {
      case SyncJobType.programmeWeek:
        return 'Programme Vie et ministère';
      case SyncJobType.programmeWeekend:
        return 'Programme de week-end';
      case SyncJobType.predication:
        return 'Réunion pour la prédication';
      case SyncJobType.temoignagePublic:
        return 'Témoignage public';
      case SyncJobType.services:
        return 'Services';
      case SyncJobType.rapports:
        return 'Rapports';
      case SyncJobType.assistance:
        return 'Assistance';
      case SyncJobType.communications:
        return 'Communications';
      case SyncJobType.taches:
        return 'Tâches';
      case SyncJobType.territories:
        return 'Territoires';
      case SyncJobType.emergencyContacts:
        return 'Contacts d\'urgence';
    }
  }

  /// Rafraîchit les providers de données après synchronisation
  void _refreshDataProviders(List<SyncJob> jobs) {
    for (final job in jobs) {
      switch (job.type) {
        case SyncJobType.programmeWeek:
          // Invalider le provider VCM pour forcer le rechargement des données
          ref.invalidate(vcmAssignmentsProvider);
          if (kDebugMode) {
            AppLogger.log('SyncNotifier: refreshed vcmAssignmentsProvider');
          }
          break;
        case SyncJobType.programmeWeekend:
        case SyncJobType.predication:
        case SyncJobType.temoignagePublic:
        case SyncJobType.services:
        case SyncJobType.communications:
          // Ces providers seront rafraîchis automatiquement par Riverpod
          break;
        default:
          break;
      }
    }
  }

  @override
  void dispose() {
    stopAutoSync();
  }
}

/// Provider principal pour la synchronisation
final syncProvider = NotifierProvider<SyncNotifier, SyncStateData>(SyncNotifier.new);

