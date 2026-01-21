import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/sync_provider.dart';
import '../services/sync_service.dart';

/// Widget indicateur de synchronisation dans l'AppBar
class SyncIndicator extends ConsumerWidget {
  const SyncIndicator({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final syncState = ref.watch(syncProvider);
    final syncNotifier = ref.read(syncProvider.notifier);

    final isSyncing = syncState.isSyncing;
    final hasError = syncState.hasError;
    final pendingCount = syncState.pendingJobsCount;

    return Stack(
      children: [
        IconButton(
          onPressed: isSyncing ? null : () => syncNotifier.syncNow(),
          icon: isSyncing
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              : Icon(
                  hasError ? Icons.sync_problem : Icons.sync,
                  color: hasError ? Colors.red.shade300 : null,
                ),
          tooltip: isSyncing
              ? 'Synchronisation en cours...'
              : hasError
                  ? 'Erreur de synchronisation - Appuyez pour réessayer'
                  : 'Synchroniser',
        ),
        if (pendingCount > 0 && !isSyncing)
          Positioned(
            right: 8,
            top: 8,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: Colors.red,
                borderRadius: BorderRadius.circular(10),
              ),
              constraints: const BoxConstraints(
                minWidth: 16,
                minHeight: 16,
              ),
              child: Text(
                pendingCount > 9 ? '9+' : '$pendingCount',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
      ],
    );
  }
}

/// Widget carte de synchronisation pour la page d'accueil ou paramètres
class SyncStatusCard extends ConsumerWidget {
  const SyncStatusCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final syncState = ref.watch(syncProvider);
    final syncNotifier = ref.read(syncProvider.notifier);

    final state = syncState.state;
    final lastSync = syncState.lastSyncTime;
    final pendingCount = syncState.pendingJobsCount;
    final recentJobs = syncState.recentJobs;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  _getStateIcon(state),
                  color: _getStateColor(state),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Synchronisation',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      Text(
                        _getStateMessage(state, lastSync),
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey,
                        ),
                      ),
                    ],
                  ),
                ),
                if (state == SyncState.syncing)
                  const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                else
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (pendingCount > 0)
                        TextButton.icon(
                          onPressed: () => syncNotifier.clearPendingJobs(),
                          icon: const Icon(Icons.clear, size: 18),
                          label: const Text('Annuler'),
                          style: TextButton.styleFrom(
                            foregroundColor: Colors.red,
                          ),
                        ),
                      const SizedBox(width: 8),
                      ElevatedButton.icon(
                        onPressed: () => syncNotifier.syncNow(),
                        icon: const Icon(Icons.sync, size: 18),
                        label: Text(pendingCount > 0 ? 'Sync ($pendingCount)' : 'Sync'),
                      ),
                    ],
                  ),
              ],
            ),
            if (state == SyncState.error && syncState.lastError != null) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Row(
                  children: [
                    Icon(Icons.error_outline, color: Colors.red.shade700, size: 16),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        syncState.lastError!,
                        style: TextStyle(
                          color: Colors.red.shade700,
                          fontSize: 12,
                        ),
                      ),
                    ),
                    IconButton(
                      onPressed: () => syncNotifier.clearError(),
                      icon: const Icon(Icons.close, size: 16),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                  ],
                ),
              ),
            ],
            if (recentJobs.isNotEmpty) ...[
              const SizedBox(height: 12),
              const Divider(),
              const SizedBox(height: 8),
              Text(
                'Dernières synchronisations',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              ...recentJobs.take(5).map((job) => _buildJobRow(context, job)),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildJobRow(BuildContext context, SyncJob job) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(
            _getJobIcon(job.type),
            size: 16,
            color: Colors.grey,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              SyncNotifier.getJobTypeLabel(job.type),
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
          Text(
            _formatTime(job.createdAt),
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Colors.grey,
            ),
          ),
        ],
      ),
    );
  }

  IconData _getStateIcon(SyncState state) {
    switch (state) {
      case SyncState.idle:
        return Icons.cloud_done;
      case SyncState.syncing:
        return Icons.sync;
      case SyncState.success:
        return Icons.check_circle;
      case SyncState.error:
        return Icons.error;
    }
  }

  Color _getStateColor(SyncState state) {
    switch (state) {
      case SyncState.idle:
        return Colors.grey;
      case SyncState.syncing:
        return Colors.blue;
      case SyncState.success:
        return Colors.green;
      case SyncState.error:
        return Colors.red;
    }
  }

  String _getStateMessage(SyncState state, DateTime? lastSync) {
    switch (state) {
      case SyncState.idle:
        if (lastSync != null) {
          return 'Dernière sync: ${_formatTime(lastSync)}';
        }
        return 'Jamais synchronisé';
      case SyncState.syncing:
        return 'Synchronisation en cours...';
      case SyncState.success:
        return 'Synchronisation réussie';
      case SyncState.error:
        return 'Erreur de synchronisation';
    }
  }

  IconData _getJobIcon(SyncJobType type) {
    switch (type) {
      case SyncJobType.programmeWeek:
      case SyncJobType.programmeWeekend:
        return Icons.calendar_today;
      case SyncJobType.communications:
        return Icons.announcement;
      case SyncJobType.services:
        return Icons.construction;
      case SyncJobType.predication:
        return Icons.groups;
      case SyncJobType.temoignagePublic:
        return Icons.public;
      case SyncJobType.territories:
        return Icons.map;
      case SyncJobType.rapports:
        return Icons.assessment;
      case SyncJobType.assistance:
        return Icons.people;
      case SyncJobType.taches:
        return Icons.task;
      case SyncJobType.emergencyContacts:
        return Icons.emergency;
    }
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final diff = now.difference(time);

    if (diff.inMinutes < 1) {
      return 'À l\'instant';
    } else if (diff.inMinutes < 60) {
      return 'Il y a ${diff.inMinutes} min';
    } else if (diff.inHours < 24) {
      return 'Il y a ${diff.inHours}h';
    } else {
      return '${time.day}/${time.month}';
    }
  }
}
