import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;
import 'package:pdfx/pdfx.dart';
import 'package:intl/intl.dart';
import '../providers/auth_provider.dart';
import '../providers/preaching_activity_provider.dart';
import '../providers/sync_provider.dart';
import '../providers/assembly_dashboard_provider.dart';
import '../providers/vcm_assignments_provider.dart';
import '../models/person.dart';
import '../utils/helpers.dart';
import '../widgets/preaching_activity_section.dart';
import '../widgets/sync_widgets.dart';
import 'vcm_page.dart';
import 'weekend_meeting_page.dart';
import 'preaching_meeting_page.dart';
import 'public_witness_page.dart';
import 'bulletin_board_screen.dart';
import '../models/vcm_models.dart';
import '../services/vcm_service.dart';
import '../services/storage_service.dart';

const String _envVcmProgramUrl = String.fromEnvironment('VCM_PROGRAM_URL');
void _openPreachingEntrySheet(BuildContext context) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    builder: (sheetContext) {
      return SafeArea(
        child: DraggableScrollableSheet(
          expand: false,
          builder: (context, controller) {
            return SingleChildScrollView(
              controller: controller,
              padding: const EdgeInsets.all(16),
              child: const PreachingActivitySection(),
            );
          },
        ),
      );
    },
  );
}

Future<void> _showSendReportSheet(
  BuildContext context,
  WidgetRef ref,
  PreachingActivityState state,
) async {
  final totals = _PreachingCardTotals.fromState(state);
  final notifier = ref.read(preachingActivityProvider.notifier);
  await showModalBottomSheet(
    context: context,
    isDismissible: true,
    enableDrag: true,
    builder: (sheetContext) {
      bool didPreach = state.didPreach;
      bool isSending = false;
      return StatefulBuilder(
        builder: (context, setModalState) {
          return SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Envoyer le rapport du mois',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: Text('Mois : ${totals.monthLabel}')),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Checkbox(
                            value: didPreach,
                            onChanged: isSending ? null : (value) {
                              if (value == null) return;
                              notifier.setDidPreach(value);
                              setModalState(() => didPreach = value);
                            },
                            visualDensity: VisualDensity.compact,
                          ),
                          const Text('A prêché'),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text('Heures : ${totals.hoursText} (${totals.hoursDecimal})'),
                  Text('Cours bibliques : ${state.totalBibleStudies}'),
                  Text(
                      'Crédit : ${totals.creditText} (${totals.creditDecimal})'),
                  const SizedBox(height: 16),
                  if (isSending)
                    const Center(
                      child: Column(
                        children: [
                          CircularProgressIndicator(),
                          SizedBox(height: 12),
                          Text('Envoi en cours...', style: TextStyle(color: Colors.grey)),
                        ],
                      ),
                    )
                  else
                    FilledButton.icon(
                      onPressed: () async {
                        // Afficher le chargement
                        setModalState(() => isSending = true);
                        
                        // Envoyer le rapport
                        final success = await notifier.submitCurrentMonth();
                        
                        // Si envoi réussi, rafraîchir la liste des proclamateurs ET marquer le mois comme soumis
                        if (success) {
                          // Marquer le mois courant comme soumis dans le provider
                          final monthKey = totals.monthKey;
                          notifier.markMonthAsSubmitted(monthKey);
                          
                          // Rafraîchir la liste des proclamateurs pour mettre à jour les statuts dans MOI
                          ref.invalidate(peopleProvider);
                          await Future.delayed(const Duration(milliseconds: 300));
                          
                          // Rafraîchir depuis le serveur pour sync avec le groupe de prédication
                          await notifier.refreshFromServer();
                        }
                        
                        // Fermer le bottom sheet
                        if (sheetContext.mounted) {
                          Navigator.of(sheetContext).pop();
                        }
                        
                        // Vérifier si le widget est toujours monté avant d'afficher le SnackBar
                        if (!context.mounted) return;
                        
                        // Récupérer l'état mis à jour pour vérifier les erreurs
                        final updatedState = ref.read(preachingActivityProvider);
                        
                        if (updatedState.error != null) {
                          // Afficher un message d'avertissement si erreur
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Row(
                                children: [
                                  const Icon(Icons.warning_amber, color: Colors.orange),
                                  const SizedBox(width: 8),
                                  Expanded(child: Text(updatedState.error!)),
                                ],
                              ),
                            backgroundColor: Colors.orange.shade800,
                            duration: const Duration(seconds: 4),
                          ),
                        );
                      } else {
                        // Afficher le message de succès
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Row(
                              children: [
                                Icon(Icons.check_circle, color: Colors.white),
                                SizedBox(width: 8),
                                Text('✓ Rapport envoyé au secrétariat avec succès !'),
                              ],
                            ),
                            backgroundColor: Colors.green,
                            duration: Duration(seconds: 3),
                          ),
                        );
                      }
                    },
                    icon: const Icon(Icons.check),
                    label: const Text('Confirmer l\'envoi'),
                  ),
                ],
              ),
            ),
          );
        },
      );
    },
  );
}

const String _vcmLocale = 'fr';

class _PreachingCardTotals {
  final String monthLabel;
  final String monthKey;
  final String hoursText;
  final String hoursDecimal;
  final String creditText;
  final String creditDecimal;

  const _PreachingCardTotals({
    required this.monthLabel,
    required this.monthKey,
    required this.hoursText,
    required this.hoursDecimal,
    required this.creditText,
    required this.creditDecimal,
  });

  factory _PreachingCardTotals.fromState(PreachingActivityState state) {
    final label = _formatMonthLabel(state.selectedMonth);
    return _PreachingCardTotals(
      monthLabel: label,
      monthKey: state.selectedMonthKey,
      hoursText: _formatClock(state.totalHours),
      hoursDecimal: state.totalHours.toStringAsFixed(2),
      creditText: _formatClock(state.totalCredit),
      creditDecimal: state.totalCredit.toStringAsFixed(2),
    );
  }

  static String _formatClock(double hours) {
    final minutes = (hours * 60).round();
    final h = (minutes ~/ 60).toString();
    final m = (minutes % 60).toString().padLeft(2, '0');
    return '$h:$m';
  }

  static String _formatMonthLabel(DateTime month) {
    const months = [
      'janv.',
      'févr.',
      'mars',
      'avr.',
      'mai',
      'juin',
      'juil.',
      'août',
      'sept.',
      'oct.',
      'nov.',
      'déc.'
    ];
    return '${months[month.month - 1]} ${month.year}';
  }
}

class _ReportStat extends StatelessWidget {
  final String label;
  final String value;
  final String? secondary;
  const _ReportStat({required this.label, required this.value, this.secondary});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(color: Colors.grey.shade700)),
          Text(value,
              style:
                  const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          if (secondary != null)
            Text(
              secondary!,
              style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
            ),
        ],
      ),
    );
  }
}

String _resolveVcmProgramUrl() {
  if (_envVcmProgramUrl.isNotEmpty) {
    return _envVcmProgramUrl;
  }
  final base = kDebugMode ? 'http://localhost:3000' : 'http://127.0.0.1:1420';
  return '$base/vcm/$_vcmLocale/vcm-program.normalized.json';
}

// Helper: translate french month name to number

class MainScreen extends ConsumerStatefulWidget {
  const MainScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends ConsumerState<MainScreen> {
  int _selectedIndex = 0;

  ProviderSubscription<SyncStateData>? _syncSubscription;

  final List<MainTab> tabs = [
    MainTab(label: 'Assemblée', icon: Icons.home),
    MainTab(label: 'Programmes', icon: Icons.calendar_today),
    MainTab(label: 'Attributions', icon: Icons.assignment),
    MainTab(label: 'Services', icon: Icons.construction),
    MainTab(label: 'Territoires', icon: Icons.map),
    MainTab(label: 'Moi', icon: Icons.person),
  ];

  @override
  void initState() {
    super.initState();
    // Démarrer la synchronisation automatique et faire une sync initiale
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final syncNotifier = ref.read(syncProvider.notifier);
      // Synchronisation initiale
      syncNotifier.syncNow();
      // Démarrer la synchronisation automatique (toutes les 5 minutes)
      syncNotifier.startAutoSync(interval: const Duration(minutes: 5));
      
      // Rafraîchir les données de prédication depuis le serveur au démarrage
      ref.read(preachingActivityProvider.notifier).refreshFromServer();

      // Listen for sync updates and show a friendly snack when new jobs are processed.
      // NOTE: In Riverpod, ref.listen() is only allowed in build(); use listenManual() in initState.
      _syncSubscription?.close();
      _syncSubscription = ref.listenManual<SyncStateData>(syncProvider, (previous, next) {
        try {
          final prevCount = previous?.recentJobs.length ?? 0;
          final nextCount = next.recentJobs.length;

          if (nextCount > 0 && nextCount != prevCount) {
            final types = next.recentJobs.map((j) => SyncNotifier.getJobTypeLabel(j.type)).toSet().toList();
            final label = types.isEmpty ? 'Nouvelles données' : types.take(3).join(', ');
            final message = nextCount == 1 ? '1 mise à jour synchronisée: $label' : '$nextCount mises à jour synchronisées: $label';
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(message), duration: const Duration(seconds: 3)),
              );
            }
            // Rafraîchir les données de prédication après chaque synchronisation
            ref.read(preachingActivityProvider.notifier).refreshFromServer();
          }
        } catch (e) {
          if (kDebugMode) print('Sync listener error: $e');
        }
      });
    });
  }

  @override
  void dispose() {
    // Arrêter la synchronisation automatique quand l'écran est détruit
    ref.read(syncProvider.notifier).stopAutoSync();
    _syncSubscription?.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue.shade700,
        title: Text(tabs[_selectedIndex].label),
        actions: [
          const SyncIndicator(),
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              _showSettingsMenu();
            },
          ),
        ],
      ),
      body: _buildBody(),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) {
          setState(() => _selectedIndex = index);
        },
        type: BottomNavigationBarType.fixed,
        items: tabs
            .map((tab) => BottomNavigationBarItem(
                  icon: Icon(tab.icon),
                  label: tab.label,
                ))
            .toList(),
      ),
    );
  }

  Widget _buildBody() {
    switch (_selectedIndex) {
      case 0:
        return const AssemblyPage();
      case 1:
        return const ProgrammesPage();
      case 2:
        return const AttributionsPage();
      case 3:
        return const ServicesPage();
      case 4:
        return const TerritoriesPage();
      case 5:
        return const ProfilePage();
      default:
        return const Center(child: Text('Page non trouvée'));
    }
  }

  void _showSettingsMenu() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.logout),
              title: const Text('Déconnexion'),
              onTap: () async {
                await ref.read(authStateProvider.notifier).logout();
                if (mounted) {
                  Navigator.of(context).pop();
                  // Rediriger vers la page de connexion après déconnexion
                  context.go('/login');
                }
              },
            ),
            ListTile(
              leading: const Icon(Icons.info),
              title: const Text('À propos'),
              onTap: () {
                Navigator.of(context).pop();
                _showAboutDialog();
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showAboutDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('À propos'),
        content: const Text('Gestionnaire d\'Assemblée v1.0.0'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }
}

class MainTab {
  final String label;
  final IconData icon;

  MainTab({required this.label, required this.icon});
}

// ===== PAGE 1: ASSEMBLÉE =====
class AssemblyPage extends ConsumerWidget {
  const AssemblyPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authStateProvider);
    final previousReport = ref.watch(previousMonthReportProvider);
    final preachingActivity = ref.watch(preachingActivityProvider);
    final dashboard = ref.watch(assemblyDashboardProvider);
    final dashboardData = dashboard.asData?.value;
    final syncState = ref.watch(syncProvider);
    final syncNotifier = ref.read(syncProvider.notifier);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Carte de synchronisation
          Card(
            elevation: 2,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Icon(
                    syncState.isSyncing ? Icons.sync : Icons.cloud_done,
                    color: syncState.hasError ? Colors.red : Colors.green,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          syncState.isSyncing
                              ? 'Synchronisation en cours...'
                              : syncState.hasError
                                  ? 'Erreur de synchronisation'
                                  : 'Synchronisé',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        if (syncState.lastSyncTime != null)
                          Text(
                            'Dernière synchro: ${DateFormat('HH:mm', 'fr_FR').format(syncState.lastSyncTime!)}',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade600,
                            ),
                          ),
                      ],
                    ),
                  ),
                  FilledButton.icon(
                    onPressed: syncState.isSyncing ? null : () => syncNotifier.syncNow(),
                    icon: syncState.isSyncing
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.sync),
                    label: const Text('Synchroniser'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Carte 1: Rapport
          previousReport
                  .whenData((report) {
                    return _buildReportCard(
                      context: context,
                      ref: ref,
                      report: report,
                      preachingState: preachingActivity,
                    );
                  })
                  .asData
                  ?.value ??
              _buildReportCard(
                context: context,
                ref: ref,
                report: null,
                preachingState: preachingActivity,
              ),
          const SizedBox(height: 16),

          // Tableaux d'affichage (plusieurs cartes selon le rôle)
          ..._buildAllBulletinBoards(
            context,
            ref,
            dashboardData?.allBulletins ?? [],
            isLoading: dashboard.isLoading,
          ),
        ],
      ),
    );
  }

  Widget _buildReportCard({
    required BuildContext context,
    required WidgetRef ref,
    required ActivityReport? report,
    required PreachingActivityState preachingState,
  }) {
    final bool isSubmitted = preachingState.isSubmitted;
    final totals = _PreachingCardTotals.fromState(preachingState);
    final bool hasData = preachingState.totalHours > 0 ||
        preachingState.totalBibleStudies > 0 ||
        preachingState.totalCredit > 0;

    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Rapport',
                      style:
                          TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      totals.monthLabel,
                      style: const TextStyle(color: Colors.grey),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: isSubmitted ? Colors.green : Colors.orange,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    isSubmitted ? Icons.check : Icons.pending,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _ReportStat(
                    label: 'Heures',
                    value: totals.hoursText,
                    secondary: totals.hoursDecimal),
                _ReportStat(
                    label: 'Cours bibliques',
                    value: '${preachingState.totalBibleStudies}'),
                _ReportStat(
                    label: 'Crédit',
                    value: totals.creditText,
                    secondary: totals.creditDecimal),
              ],
            ),
            const SizedBox(height: 12),
            if (report != null)
              Text(
                isSubmitted ? '✓ Rapport transmis' : '✗ Rapport en attente',
                style: TextStyle(
                    color: isSubmitted ? Colors.green : Colors.red,
                    fontWeight: FontWeight.bold),
              )
            else if (!hasData)
              const Text('Aucun rapport saisi pour l\'instant.'),
            const SizedBox(height: 16),
            Wrap(
              spacing: 12,
              runSpacing: 8,
              children: [
                FilledButton.icon(
                  onPressed: () => _openPreachingEntrySheet(context),
                  icon: const Icon(Icons.add),
                  label: const Text('Ajouter / Modifier'),
                ),
                OutlinedButton.icon(
                  onPressed: hasData
                      ? () => _showSendReportSheet(context, ref, preachingState)
                      : null,
                  icon: const Icon(Icons.send),
                  label: const Text('Envoyer le rapport'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNextEventCard(List<NextMeetingInfo> meetings,
      {required bool isLoading}) {
    if (isLoading) {
      return _buildLoadingCard('Prochain');
    }

    if (meetings.isEmpty) {
      return Card(
        elevation: 2,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              Text('Prochain',
                  style:
                      TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              SizedBox(height: 12),
              Text('Aucune réunion planifiée pour l’instant.'),
            ],
          ),
        ),
      );
    }

    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Prochain',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.yellow.shade300,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    meetings.length.toString(),
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ...meetings.take(4).map((meeting) {
              final dateLabel = DateFormat('EEE d MMM', 'fr_FR')
                  .format(meeting.date)
                  .toLowerCase();
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          meeting.participates
                              ? Icons.event_available
                              : Icons.event,
                          color:
                              meeting.participates ? Colors.green : Colors.grey,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${meeting.label} · $dateLabel',
                                style: const TextStyle(fontSize: 16),
                              ),
                              if (meeting.location.isNotEmpty)
                                Text(meeting.location,
                                    style:
                                        TextStyle(color: Colors.grey.shade700)),
                            ],
                          ),
                        ),
                      ],
                    ),
                    if (meeting.services.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(left: 32, top: 6),
                        child: Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: meeting.services
                              .take(3)
                              .map((s) => Chip(
                                    visualDensity: VisualDensity.compact,
                                    label: Text(s,
                                        style:
                                            const TextStyle(fontSize: 12)),
                                  ))
                              .toList(),
                        ),
                      ),
                  ],
                ),
              );
            }),
            if (meetings.length > 4)
              Text('+${meetings.length - 4} autres rencontres'),
          ],
        ),
      ),
    );
  }

  Widget _buildPublicWitnessCard(
    BuildContext context,
    List<PublicWitnessSlot> slots, {
    required bool isLoading,
  }) {
    if (isLoading) {
      return _buildLoadingCard('Témoignage Public');
    }

    final hasData = slots.isNotEmpty;
    final targetDate = hasData ? slots.first.date : DateTime.now();

    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Témoignage Public',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            if (!hasData)
              const Row(
                children: [
                  Icon(Icons.calendar_today, color: Colors.blue),
                  SizedBox(width: 8),
                  Text('Aucune participation planifiée'),
                ],
              )
            else
              ...slots.take(3).map((slot) {
                final label = DateFormat('EEE d MMM', 'fr_FR')
                    .format(slot.date)
                    .toLowerCase();
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Row(
                    children: [
                      Icon(
                        slot.participates
                            ? Icons.check_circle
                            : Icons.schedule,
                        color: slot.participates
                            ? Colors.green
                            : Colors.orange.shade700,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('$label · ${slot.period}'.trim()),
                            if (slot.location.isNotEmpty)
                              Text(
                                slot.location,
                                style: TextStyle(color: Colors.grey.shade700),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              }),
            if (hasData)
              Align(
                alignment: Alignment.centerLeft,
                child: TextButton.icon(
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => PublicWitnessPage(referenceDate: targetDate),
                      ),
                    );
                  },
                  icon: const Icon(Icons.open_in_new),
                  label: const Text('Ouvrir la semaine'),
                ),
              ),
          ],
        ),
      ),
    );
  }

  List<Widget> _buildAllBulletinBoards(
    BuildContext context,
    WidgetRef ref,
    List<BulletinCounts> bulletins, {
    required bool isLoading,
  }) {
    final widgets = <Widget>[];
    
    for (int i = 0; i < bulletins.length; i++) {
      widgets.add(_buildBulletinBoard(
        context,
        ref,
        bulletins[i],
        isLoading: isLoading,
      ));
      
      // Ajouter un espacement entre les cartes sauf après la dernière
      if (i < bulletins.length - 1) {
        widgets.add(const SizedBox(height: 16));
      }
    }
    
    return widgets;
  }

    Widget _buildBulletinBoard(BuildContext context, WidgetRef ref, BulletinCounts? counts,
      {required bool isLoading}) {
    if (isLoading && counts == null) {
      return _buildLoadingCard("Tableau d'affichage");
    }

    final bulletin = counts ?? const BulletinCounts();
    
    // Déterminer le titre selon le type de tableau
    String boardTitle;
    switch (bulletin.boardType) {
      case 'elders':
        boardTitle = "Tableau d'affichage anciens";
        break;
      case 'elders-assistants':
        boardTitle = "Tableau d'affichage anciens et assistants";
        break;
      default:
        boardTitle = "Tableau d'affichage assemblée";
    }
    
    final updatedLabel = bulletin.updatedAt != null
        ? 'MàJ ${DateFormat('dd/MM', 'fr_FR').format(bulletin.updatedAt!)}'
        : null;

    // Formater les dates de visite du CO
    String? coVisitLabel;
    if (bulletin.coVisitStart != null) {
      final startStr = DateFormat('dd/MM').format(bulletin.coVisitStart!);
      if (bulletin.coVisitEnd != null) {
        final endStr = DateFormat('dd/MM').format(bulletin.coVisitEnd!);
        coVisitLabel = '$startStr - $endStr';
      } else {
        coVisitLabel = startStr;
      }
    }

    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    boardTitle,
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ),
                if (updatedLabel != null)
                  Text(updatedLabel,
                      style: TextStyle(color: Colors.grey.shade700)),
              ],
            ),
            const SizedBox(height: 12),
            // Visite du responsable de circonscription
            if (coVisitLabel != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.blue.shade200),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.event, color: Colors.blue.shade700, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          'Visite du responsable de circonscription',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Colors.blue.shade700,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '📅 $coVisitLabel',
                      style: const TextStyle(fontSize: 15),
                    ),
                    if (bulletin.coVisitTheme != null && bulletin.coVisitTheme!.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        '📋 ${bulletin.coVisitTheme}',
                        style: TextStyle(fontSize: 14, color: Colors.grey.shade700),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 12),
            ],
            _buildBulletinItem(context, ref, '📢 Communications', bulletin.communications, bulletin.boardType, bulletin.unreadCount),
            const SizedBox(height: 8),
            _buildBulletinItem(context, ref, '📄 Documents et lettres', bulletin.documents, bulletin.boardType, bulletin.unreadDocuments),
            if (isLoading && counts != null) ...[
              const SizedBox(height: 8),
              const LinearProgressIndicator(minHeight: 4),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildBulletinItem(BuildContext context, WidgetRef ref, String title, int count, String boardType, int unreadCount) {
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: () => _navigateToBulletinBoard(context, boardType),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title),
          Row(
            children: [
              if (count > 0)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.red,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    count.toString(),
                    style: const TextStyle(
                        color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                ),
              if (unreadCount > 0) ...[
                const SizedBox(width: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.blue,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '$unreadCount nouveau${unreadCount > 1 ? 'x' : ''}',
                    style: const TextStyle(
                        color: Colors.white, fontWeight: FontWeight.bold, fontSize: 10),
                  ),
                ),
              ],
              const SizedBox(width: 8),
              Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey.shade600),
            ],
          ),
        ],
      ),
    );
  }

  void _navigateToBulletinBoard(BuildContext context, String boardType) {
    String boardLabel;
    switch (boardType) {
      case 'elders':
        boardLabel = "Tableau d'affichage anciens";
        break;
      case 'elders-assistants':
        boardLabel = "Tableau d'affichage anciens et assistants";
        break;
      default:
        boardLabel = "Tableau d'affichage assemblée";
    }
    
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => BulletinBoardScreen(
          boardType: boardType,
          boardLabel: boardLabel,
        ),
      ),
    );
  }

  Future<void> _showBulletinListDialog(BuildContext context, WidgetRef ref, String title, String boardType) async {
    final storage = ref.read(storageServiceProvider);
    final auth = ref.read(authStateProvider);
    final user = auth.user;
    final isDocs = title.contains('Document');
    final data = await storage.getGenericData('communications');
    final allItems = (data?['items'] as List?) ?? [];
    
    // Filtrer par boardType
    final boardItems = allItems.where((item) {
      if (item is! Map<String, dynamic>) return false;
      final itemBoardType = (item['boardType'] ?? 'assembly').toString().toLowerCase();
      return itemBoardType == boardType.toLowerCase();
    }).toList();
    
    final filtered = isDocs
      ? boardItems.where((e) {
        final a = (e['attachment'] ?? '').toString();
        final attachmentsList = e['attachments'] is List && (e['attachments'] as List).isNotEmpty;
        final docsList = e['documents'] is List && (e['documents'] as List).isNotEmpty;
        final link = (e['link'] ?? e['url'] ?? '').toString();
        return a.isNotEmpty || attachmentsList || docsList || link.isNotEmpty;
        }).toList()
      : boardItems;
      
    if (filtered.isEmpty) {
      showDialog(
        context: context,
        builder: (_) => AlertDialog(
          title: Text(title),
          content: const Text('Aucun élément à afficher.'),
          actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Fermer'))],
        ),
      );
      return;
    }
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(title),
        content: SizedBox(
          width: 350,
          child: ListView.separated(
            shrinkWrap: true,
            itemCount: filtered.length,
            separatorBuilder: (_, __) => const Divider(),
            itemBuilder: (ctx, idx) {
              final item = filtered[idx] as Map<String, dynamic>;
              final titleText = (item['title'] ?? item['label'] ?? 'Document').toString();
              // Build sub-entries for attachments/documents/links
              final attachments = <Map<String, String>>[]; // {label, file, link}
              // Single attachment string
              final attachStr = (item['attachment'] ?? '').toString();
              if (attachStr.isNotEmpty) {
                attachments.add({'label': titleText, 'file': attachStr, 'link': ''});
              }
              // attachments array
              if (item['attachments'] is List) {
                for (final a in (item['attachments'] as List)) {
                  attachments.add({'label': titleText, 'file': a.toString(), 'link': ''});
                }
              }
              // documents array (can contain objects or strings)
              if (item['documents'] is List) {
                for (final d in (item['documents'] as List)) {
                  if (d is String) {
                    attachments.add({'label': titleText, 'file': d, 'link': ''});
                  } else if (d is Map) {
                    final f = (d['file'] ?? d['attachment'] ?? d['name'] ?? '').toString();
                    final l = (d['link'] ?? d['url'] ?? '').toString();
                    if (f.isNotEmpty || l.isNotEmpty) attachments.add({'label': titleText, 'file': f, 'link': l});
                  }
                }
              }
              // If we have a link directly on the item
              final itemLink = (item['link'] ?? item['url'] ?? '').toString();
              if (itemLink.isNotEmpty) {
                attachments.add({'label': titleText, 'file': '', 'link': itemLink});
              }

              // If no attachments found, show at least the item title
              if (attachments.isEmpty) {
                return ListTile(
                  title: Text(titleText),
                  subtitle: (item['content'] ?? '').toString().isNotEmpty
                      ? Text((item['content'] ?? '').toString(), maxLines: 2)
                      : null,
                  onTap: () => _showCommunicationContentDialog(context, ref, item),
                );
              }

              // If there are attachments, show them as sublist
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  InkWell(
                    onTap: () => _showCommunicationContentDialog(context, ref, item),
                    child: Padding(
                      padding: const EdgeInsets.only(left: 6.0, bottom: 6.0),
                      child: Text(titleText, style: const TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                  ...attachments.map((att) {
                    final label = att['file']?.isNotEmpty == true ? att['file']! : att['link'] ?? '';
                    final isLink = (att['link'] ?? '').isNotEmpty && (att['file'] ?? '').isEmpty;
                    final fileName = (att['file'] ?? '').toString();
                    final link = (att['link'] ?? '').toString();
                        return ListTile(
                          dense: true,
                          title: Text(label),
                          subtitle: isLink ? Text(link, style: const TextStyle(fontSize: 12)) : null,
                          trailing: const Icon(Icons.open_in_new),
                          onTap: () => _openDocumentOrShowError(context, ref, fileName, link),
                        );
                  }).toList(),
                ],
              );
            },
          ),
        ),
        actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Fermer'))],
      ),
    );
  }

  Future<void> _openDocumentOrShowError(BuildContext context, WidgetRef ref, String filename, String link) async {
    // Vérifier si le fichier existe dans assets/data
    final possiblePaths = [
      'assets/data/$filename',
      '${Directory.current.path}/assets/data/$filename',
      '${Directory.current.path}/flutter_app/assets/data/$filename',
    ];
    bool exists = false;
    String existingPath = '';
    for (final p in possiblePaths) {
      try {
        final f = File(p);
        if (await f.exists()) {
          exists = true;
          existingPath = p;
          break;
        }
      } catch (_) {}
    }
    // If link provided and no local file, try to open link
    if (!exists && (link.isNotEmpty)) {
      try {
        if (Platform.isWindows) {
          await Process.run('cmd', ['/c', 'start', '', link]);
        } else if (Platform.isMacOS) {
          await Process.run('open', [link]);
        } else {
          await Process.run('xdg-open', [link]);
        }
        return;
      } catch (e) {
        // fallback to message
      }
    }
    if (!exists && filename.isNotEmpty) {
      // Sometimes assets are bundled, try to read via rootBundle
      try {
        final bytes = await rootBundle.load('assets/data/$filename');
        final tmp = await File('${Directory.systemTemp.path}/$filename').writeAsBytes(bytes.buffer.asUint8List());
        exists = await tmp.exists();
        if (exists) existingPath = tmp.path;
      } catch (_) {}
      // If still not present and link is a remote URL, download it
      if (!exists && link.isNotEmpty && (link.startsWith('http://') || link.startsWith('https://'))) {
        try {
          final resp = await http.get(Uri.parse(link)).timeout(const Duration(seconds: 10));
          if (resp.statusCode >= 200 && resp.bodyBytes.isNotEmpty) {
            final tmpDir = Directory.systemTemp.path;
            final tmpFile = File('$tmpDir/$filename');
            await tmpFile.writeAsBytes(resp.bodyBytes);
            if (await tmpFile.exists()) {
              exists = true;
              existingPath = tmpFile.path;
            }
          }
        } catch (_) {}
      }
    }

    if (exists) {
      // Choose in-app preview for images and text files
      final lower = filename.toLowerCase();
      if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.gif')) {
          // Show image in dialog
          showDialog(
            context: context,
            builder: (_) => AlertDialog(
              title: Text(filename),
              content: Image.file(File(existingPath)),
              actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Fermer'))],
            ),
          );
          return;
        } else if (lower.endsWith('.txt') || lower.endsWith('.md') || lower.endsWith('.json')) {
          final content = await File(existingPath).readAsString();
          showDialog(
            context: context,
            builder: (_) => AlertDialog(
              title: Text(filename),
              content: SizedBox(
                width: 600,
                height: 400,
                child: SingleChildScrollView(child: SelectableText(content)),
              ),
              actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Fermer'))],
            ),
          );
          return;
        } else if (lower.endsWith('.pdf')) {
          try {
            final controller = PdfController(document: PdfDocument.openFile(existingPath));
            showDialog(
              context: context,
              builder: (_) => AlertDialog(
                title: Text(filename),
                content: SizedBox(
                  width: 700,
                  height: 800,
                  child: PdfView(controller: controller),
                ),
                actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Fermer'))],
              ),
            );
            return;
          } catch (_) {
            // fallback to system open
          }
        } else {
        // Try open with system default application
        try {
          if (Platform.isWindows) {
            await Process.run('cmd', ['/c', 'start', '', existingPath]);
          } else if (Platform.isMacOS) {
            await Process.run('open', [existingPath]);
          } else {
            await Process.run('xdg-open', [existingPath]);
          }
        } catch (e) {
          // fallback to showing dialog
        }
      }
    }
    if (exists) {
      showDialog(
        context: context,
        builder: (_) => AlertDialog(
          title: const Text('Fichier trouvé'),
          content: Text('Le fichier $filename a été ouvert par l’application par défaut.'),
          actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('OK'))],
        ),
      );
    } else {
      showDialog(
        context: context,
        builder: (_) => AlertDialog(
          title: const Text('Fichier manquant'),
          content: Text('Le fichier $filename est introuvable localement.'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Annuler')),
            TextButton(
              onPressed: () async {
                Navigator.pop(context);
                // Rerun the sync to fetch new communications/attachments metadata
                final syncNotifier = ref.read(syncProvider.notifier);
                final ok = await syncNotifier.syncNow();
                if (!ok) {
                  // show error
                  showDialog(
                    context: context,
                    builder: (_) => AlertDialog(
                      title: const Text('Erreur'),
                      content: const Text('La synchronisation a échoué.'),
                      actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('OK'))],
                    ),
                  );
                } else {
                  // Try opening again
                  await _openDocumentOrShowError(context, ref, filename, link);
                }
              },
              child: const Text('Ressayer la synchronisation'),
            ),
            if (link.isNotEmpty)
              TextButton(
                onPressed: () async {
                  Navigator.pop(context);
                  try {
                    if (Platform.isWindows) {
                      await Process.run('cmd', ['/c', 'start', '', link]);
                    } else if (Platform.isMacOS) {
                      await Process.run('open', [link]);
                    } else {
                      await Process.run('xdg-open', [link]);
                    }
                  } catch (e) {
                    showDialog(
                      context: context,
                      builder: (_) => AlertDialog(
                        title: const Text('Erreur'),
                        content: Text('Impossible d\'ouvrir le lien : $e'),
                        actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('OK'))],
                      ),
                    );
                  }
                },
                child: const Text('Ouvrir le lien'),
              ),
          ],
        ),
      );
    }
  }

  Future<void> _showCommunicationContentDialog(BuildContext context, WidgetRef ref, Map<String, dynamic> item) async {
    final titleText = (item['title'] ?? item['label'] ?? 'Communication').toString();
    final content = (item['content'] ?? item['body'] ?? item['text'] ?? '').toString();
    final attachments = <Map<String, String>>[];
    final attachStr = (item['attachment'] ?? '').toString();
    if (attachStr.isNotEmpty) attachments.add({'label': attachStr, 'file': attachStr, 'link': ''});
    if (item['attachments'] is List) {
      for (final a in (item['attachments'] as List)) {
        attachments.add({'label': a.toString(), 'file': a.toString(), 'link': ''});
      }
    }
    if (item['documents'] is List) {
      for (final d in (item['documents'] as List)) {
        if (d is String) {
          attachments.add({'label': d, 'file': d, 'link': ''});
        } else if (d is Map) {
          final f = (d['file'] ?? d['attachment'] ?? d['name'] ?? '').toString();
          final l = (d['link'] ?? d['url'] ?? '').toString();
          if (f.isNotEmpty || l.isNotEmpty) attachments.add({'label': f.isNotEmpty ? f : (l ?? ''), 'file': f, 'link': l});
        }
      }
    }
    final itemLink = (item['link'] ?? item['url'] ?? '').toString();
    if (itemLink.isNotEmpty) attachments.add({'label': itemLink, 'file': '', 'link': itemLink});

    await showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(titleText),
        content: SizedBox(
          width: 600,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (content.isNotEmpty)
                Flexible(
                  child: SingleChildScrollView(
                    child: SelectableText(content),
                  ),
                ),
              if (attachments.isNotEmpty) ...[
                const SizedBox(height: 12),
                const Divider(),
                const SizedBox(height: 6),
                Text('Pièces jointes', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey.shade700)),
                const SizedBox(height: 6),
                ...attachments.map((att) {
                  final fileName = att['file'] ?? '';
                  final link = att['link'] ?? '';
                  final label = (att['label'] ?? (fileName.isNotEmpty ? fileName : link)).toString();
                  return ListTile(
                    dense: true,
                    title: Text(label),
                    subtitle: link.isNotEmpty ? Text(link, style: const TextStyle(fontSize: 12)) : null,
                    trailing: const Icon(Icons.open_in_new),
                    onTap: () => _openDocumentOrShowError(context, ref, fileName, link),
                  );
                }).toList(),
              ],
            ],
          ),
        ),
        actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Fermer'))],
      ),
    );
  }

  Widget _buildLoadingCard(String title) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title,
                style:
                    const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            const LinearProgressIndicator(minHeight: 4),
          ],
        ),
      ),
    );
  }
}

// ===== PAGE 2: PROGRAMMES =====
class ProgrammesPage extends ConsumerStatefulWidget {
  const ProgrammesPage({Key? key}) : super(key: key);

  @override
  ConsumerState<ProgrammesPage> createState() => _ProgrammesPageState();
}

class _ProgrammesPageState extends ConsumerState<ProgrammesPage> {
  // keep collapsed by default
  final List<bool> _expanded = [false, false, false, false];

  late final VcmService _vcmService;
  Future<List<VcmWeek>>? _weeksFuture;

  @override
  void initState() {
    super.initState();
    // TODO: rendre cette URL configurable (paramètre, settings...)
    _vcmService = VcmService(
      programUrl: _resolveVcmProgramUrl(),
    );
    _weeksFuture = _loadWeeksWithFallback();
  }

  Future<List<VcmWeek>> _loadWeeksWithFallback() async {
    try {
      return await _vcmService.fetchWeeks();
    } catch (e) {
      debugPrint('Programme: échec HTTP (${e.toString()}), bascule sur le fichier local vcm-program.json');
      try {
        // IMPORTANT: programme_week.json contient les assignations (sync), pas le programme VCM.
        // Sur Android/iOS, l'URL localhost/127.0.0.1 n'est pas accessible, donc on utilise un asset VCM.
        final jsonString = await rootBundle.loadString('assets/data/vcm-program.json');
        final decoded = jsonDecode(jsonString);
        final rawWeeks = decoded is Map<String, dynamic>
            ? (decoded['weeks'] ?? decoded['semaines'])
            : decoded;
        if (rawWeeks is List) {
          return rawWeeks
              .whereType<Map<String, dynamic>>()
              .map(VcmWeek.fromJson)
              .toList();
        }
        throw Exception('Format inattendu dans vcm-program.json');
      } catch (fallbackError) {
        debugPrint('Programme: échec du fallback local (${fallbackError.toString()})');
        rethrow;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authStateProvider);
    final user = auth.user;
    return FutureBuilder<List<VcmWeek>>(
      future: _weeksFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Text('Erreur chargement programme : ${snapshot.error}'),
            ),
          );
        }
        // Ne garder que les semaines à partir d'aujourd'hui, et limiter à 12
        final allWeeks = snapshot.data ?? [];
        final now = DateTime.now();
        final filtered = allWeeks
            .where((w) => w.endAsDate == null || !w.endAsDate!.isBefore(now))
            .toList()
          ..sort((a, b) {
            final sa = a.startAsDate ?? DateTime.now();
            final sb = b.startAsDate ?? DateTime.now();
            return sa.compareTo(sb);
          });
        final weeks = filtered.take(12).toList();
        if (weeks.isEmpty) {
          return const Center(child: Text('Aucun programme trouvé'));
        }

        // Charger les assignations VCM
        final vcmAssignmentsAsync = ref.watch(vcmAssignmentsProvider);
        final vcmAssignments = vcmAssignmentsAsync.when(
          data: (state) => state,
          loading: () => const VcmAssignmentsState(),
          error: (_, __) => const VcmAssignmentsState(),
        );

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _buildProgrammeCard(
                  title: 'Réunion de semaine',
                  weeks: weeks,
                  background: Colors.red.shade50,
                  accent: Colors.red.shade700,
                  user: user,
                  expanded: _expanded[0],
                  onToggle: () => setState(() => _expanded[0] = !_expanded[0]),
                  vcmAssignments: vcmAssignments,
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _buildProgrammeCard(
                  title: 'Réunion de week-end',
                  weeks: weeks,
                  background: Colors.blue.shade50,
                  accent: Colors.blue.shade700,
                  user: user,
                  expanded: _expanded[1],
                  onToggle: () => setState(() => _expanded[1] = !_expanded[1]),
                  vcmAssignments: vcmAssignments,
                  destinationBuilder: (week) {
                    final parsed = week.startAsDate;
                    if (parsed == null) return null;
                    final weekendDate = parsed.add(const Duration(days: 5));
                    return MaterialPageRoute(
                      builder: (_) =>
                          WeekendMeetingPage(weekEndDate: weekendDate),
                    );
                  },
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _buildProgrammeCard(
                  title: 'Réunion pour la prédication',
                  weeks: weeks,
                  background: Colors.orange.shade50,
                  accent: Colors.orange.shade800,
                  user: user,
                  expanded: _expanded[2],
                  onToggle: () => setState(() => _expanded[2] = !_expanded[2]),
                  vcmAssignments: vcmAssignments,
                  destinationBuilder: (week) {
                    final parsed = week.startAsDate;
                    if (parsed == null) return null;
                    return MaterialPageRoute(
                      builder: (_) => PreachingMeetingPage(meetingDate: parsed),
                    );
                  },
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _buildProgrammeCard(
                  title: 'Témoignage public',
                  weeks: weeks,
                  background: Colors.teal.shade50,
                  accent: Colors.teal.shade700,
                  user: user,
                  expanded: _expanded[3],
                  onToggle: () => setState(() => _expanded[3] = !_expanded[3]),
                  vcmAssignments: vcmAssignments,
                  destinationBuilder: (week) {
                    final parsed = week.startAsDate;
                    if (parsed == null) return null;
                    return MaterialPageRoute(
                      builder: (_) => PublicWitnessPage(referenceDate: parsed),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildLoadingCard(String title) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title,
                style:
                    const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            const LinearProgressIndicator(minHeight: 4),
          ],
        ),
      ),
    );
  }

  Widget _buildProgrammeCard({
    required String title,
    required List<VcmWeek> weeks,
    required Color background,
    required Color accent,
    Person? user,
    bool expanded = false,
    VoidCallback? onToggle,
    MaterialPageRoute<void>? Function(VcmWeek week)? destinationBuilder,
    VcmAssignmentsState? vcmAssignments,
  }) {
    // Collapse view limited to three upcoming weeks for quicker scanning.
    final shown = expanded ? weeks : weeks.take(3).toList();

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: background,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding:
                  const EdgeInsets.only(left: 8.0, right: 8.0, bottom: 8.0),
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: accent,
                ),
              ),
            ),

            ...shown.map((week) {
              final start = week.startAsDate;
              String displayText = AppDateUtils.formatWeekRange(start).trim();
              bool participates = false;
              DateTime? parsed = start;
              List<VcmParticipant> weekParticipants = [];

              if (start != null) {
                if (displayText.isEmpty) {
                  displayText = AppDateUtils.formatDateFr(start);
                }
                final isoKey = start.toIso8601String().split('T')[0];
                participates = user?.meetingParticipation[isoKey] == true;
                
                // Récupérer les participants pour cette semaine
                if (vcmAssignments != null) {
                  weekParticipants = vcmAssignments.getParticipantsForWeek(start);
                }
              } else {
                displayText = week.weekTitle;
              }

              return Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 6.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Icône au-dessus si l'utilisateur participe
                        if (participates || weekParticipants.any((p) => 
                            p.personId.toLowerCase() == user?.id.toLowerCase() ||
                            p.personName.toLowerCase() == user?.displayName.toLowerCase()
                        ))
                          const Padding(
                            padding: EdgeInsets.only(bottom: 4.0),
                            child: Icon(Icons.person, color: Colors.green, size: 20),
                          ),
                        // Rendre toute la ligne cliquable
                        Material(
                          color: Colors.transparent,
                          child: InkWell(
                            onTap: parsed == null
                                ? null
                                : () {
                                    final route =
                                        destinationBuilder?.call(week) ??
                                            MaterialPageRoute(
                                              builder: (_) => VcmPage(
                                                weekStart: parsed!,
                                                vcmWeek: week,
                                              ),
                                            );
                                    if (route != null) {
                                      Navigator.of(context).push(route);
                                    }
                                  },
                            child: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 4.0),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      displayText,
                                      style: const TextStyle(fontSize: 16),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  CircleAvatar(
                                    radius: 18,
                                    backgroundColor: accent,
                                    child: const Icon(Icons.arrow_forward,
                                        size: 20, color: Colors.white),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Divider(height: 10, thickness: 1),
                ],
              );
            }).toList(),

            // Expand / collapse control
            Padding(
              padding: const EdgeInsets.only(top: 8.0),
              child: Center(
                child: TextButton.icon(
                  onPressed: onToggle,
                  icon: Icon(expanded ? Icons.expand_less : Icons.expand_more,
                      color: accent),
                  label: Text(expanded ? 'Voir moins' : 'Voir plus',
                      style: TextStyle(color: accent)),
                ),
              ),
            )
          ],
        ),
      ),
    );
  }

  /// Formate le rôle pour un affichage lisible
  String _formatRole(String role) {
    // Convertir les clés comme "tgw_talk_10min_student" en labels lisibles
    final parts = role.split('_');
    final formatted = parts.map((p) {
      if (p.isEmpty) return '';
      return p[0].toUpperCase() + p.substring(1);
    }).join(' ');
    
    // Traductions courantes
    const translations = {
      'Tgw': 'Trésors',
      'Ayf': 'Améliore',
      'Lac': 'Vie chrétienne',
      'Chairman': 'Président',
      'Prayer': 'Prière',
      'Talk': 'Discours',
      'Gems': 'Joyaux',
      'Reading': 'Lecture',
      'Initial Call': '1er contact',
      'Return Visit': 'Nlle visite',
      'Bible Study': 'Cours',
      'Cbs': 'Étude cong.',
      'Student': '(Étud.)',
      'Assistant': '(Assist.)',
    };
    
    String result = formatted;
    for (final entry in translations.entries) {
      result = result.replaceAll(entry.key, entry.value);
    }
    
    return result.trim();
  }
}

// ===== PAGE 3: ATTRIBUTIONS =====
class AttributionsPage extends ConsumerWidget {
  const AttributionsPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.check_circle_outline,
            size: 80,
            color: Colors.grey.shade400,
          ),
          const SizedBox(height: 16),
          const Text(
            'Aucune attribution',
            style: TextStyle(fontSize: 18, color: Colors.grey),
          ),
        ],
      ),
    );
  }
}

// ===== PAGE 4: SERVICES =====
class ServicesPage extends ConsumerWidget {
  const ServicesPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activeServices = ref.watch(activeServicesProvider);

    return activeServices.when(
      data: (services) {
        if (services.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.construction_outlined,
                  size: 80,
                  color: Colors.grey.shade400,
                ),
                const SizedBox(height: 16),
                const Text(
                  'Aucun service assigné',
                  style: TextStyle(fontSize: 18, color: Colors.grey),
                ),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: services.length,
          itemBuilder: (context, index) {
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                leading: const Icon(Icons.check_circle, color: Colors.green),
                title: Text(services[index]),
                subtitle: const Text('Prochaines semaines'),
              ),
            );
          },
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (err, stack) => Center(child: Text('Erreur: $err')),
    );
  }
}

// ===== PAGE 5: TERRITOIRES =====
class TerritoriesPage extends ConsumerWidget {
  const TerritoriesPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final storage = ref.watch(storageServiceProvider);
    return FutureBuilder<Map<String, dynamic>?>(
      future: storage.getGenericData('territories'),
      builder: (context, snapshot) {
        final data = snapshot.data;
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        if (data == null || data.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.map_outlined,
                  size: 80,
                  color: Colors.grey.shade400,
                ),
                const SizedBox(height: 16),
                const Text(
                  'Aucune donnée de territoires',
                  style: TextStyle(fontSize: 18, color: Colors.grey),
                ),
              ],
            ),
          );
        }

        // Try to display a simple list of territories (payload format can vary)
        final items = (data['territories'] as List?) ?? (data['items'] as List?) ?? [];

        if (items.isEmpty) {
          return Center(child: Text('Données présentes mais aucun territoire détecté'));
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: items.length,
          itemBuilder: (context, idx) {
            final item = items[idx];
            final title = (item['name'] ?? item['label'] ?? item['title'] ?? 'Territoire ${idx + 1}').toString();
            final description = (item['notes'] ?? item['description'] ?? '').toString();
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                leading: const Icon(Icons.location_on_outlined, color: Colors.green),
                title: Text(title),
                subtitle: description.isNotEmpty ? Text(description) : null,
              ),
            );
          },
        );
      },
    );
  }
}

// ===== PAGE 6: PROFIL =====
class ProfilePage extends ConsumerStatefulWidget {
  const ProfilePage({Key? key}) : super(key: key);

  @override
  ConsumerState<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends ConsumerState<ProfilePage> {
  // Ouvrir par défaut la section "Mes coordonnées" pour rendre les champs visibles.
  final Set<String> _expandedSections = <String>{'Mes coordonnées'};
  final Set<String> _expandedGroupPanels = <String>{};
  // Etendre d'emblée les tuiles contacts d'urgence pour la saisie directe.
  final Set<String> _expandedContactTiles = <String>{'personal', 'emergency-1', 'emergency-2', 'emergency-3'};
  static const List<String> _monthNames = <String>[
    'janv.',
    'févr.',
    'mars',
    'avr.',
    'mai',
    'juin',
    'juil.',
    'août',
    'sept.',
    'oct.',
    'nov.',
    'déc.'
  ];
  
  // Timer pour rafraîchissement automatique de la liste des proclamateurs
  Timer? _autoRefreshTimer;
  
  @override
  void initState() {
    super.initState();
    // Rafraîchir automatiquement la liste des proclamateurs toutes les 30 secondes
    _autoRefreshTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (mounted) {
        ref.invalidate(peopleProvider);
      }
    });
  }
  
  @override
  void dispose() {
    _autoRefreshTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authStateProvider);
    final user = auth.user;
    final peopleAsync = ref.watch(peopleProvider);
    final allPeople = peopleAsync.asData?.value ?? <Person>[];
    final preachingState = ref.watch(preachingActivityProvider);

    if (user == null) {
      return const Center(child: Text('Utilisateur non trouvé'));
    }

    final sections = _buildSections(
      user: user,
      allPeople: allPeople,
      groupsLoading: peopleAsync.isLoading,
      groupsError: peopleAsync.hasError ? peopleAsync.error?.toString() : null,
      preachingState: preachingState,
    );

    return RefreshIndicator(
      onRefresh: () async {
        final auth = ref.read(authStateProvider);
        final storage = ref.read(storageServiceProvider);
        // Recharger la liste complète depuis le serveur
        final people = await storage.getPeople();
        // Si l'utilisateur actuel existe, resynchroniser sa fiche (PIN identique)
        if (auth.user != null) {
          final updated = people.firstWhere(
            (p) => p.id == auth.user!.id || p.pin == auth.user!.pin,
            orElse: () => auth.user!,
          );
          await storage.setCurrentUser(updated);
          // Recharge l'état auth pour refléter la fiche mise à jour
          await ref.read(authStateProvider.notifier).initAuth();
        }
        ref.invalidate(peopleProvider);
        await ref.read(peopleProvider.future);
      },
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        physics: const AlwaysScrollableScrollPhysics(),
        child: Column(
          children: [
            ...sections.map((section) {
              final isExpanded = _expandedSections.contains(section.title);
              return _buildSectionCard(
                section: section,
                expanded: isExpanded,
                onToggle: () {
                  setState(() {
                    if (isExpanded) {
                      _expandedSections.remove(section.title);
                    } else {
                      _expandedSections.add(section.title);
                    }
                  });
                },
              );
            }),
          ],
        ),
      ),
    );
  }

  List<ProfileSectionData> _buildSections({
    required Person user,
    required List<Person> allPeople,
    required bool groupsLoading,
    String? groupsError,
    required PreachingActivityState preachingState,
  }) {
    return [
      ProfileSectionData(
        title: 'Proclamateurs',
        icon: Icons.groups_2,
        content: _buildProclaimerContent(
          user: user,
          allPeople: allPeople,
          isLoading: groupsLoading,
          errorMessage: groupsError,
          hideEmergency: true,
        ),
      ),
      ProfileSectionData(
        title: 'Activité de prédication',
        icon: Icons.access_time,
        content: _buildPreachingActivityContent(preachingState),
      ),
      ProfileSectionData(
        title: 'Historique de ton activité de prédication',
        icon: Icons.history,
        content: _buildPreachingHistory(user, preachingState),
      ),
      ProfileSectionData(
        title: 'Mes coordonnées',
        icon: Icons.contact_phone,
        content: _buildContactContent(user),
      ),
      ProfileSectionData(
        title: 'Périodes d\'absence',
        icon: Icons.flight_takeoff,
        content: _buildAbsenceContent(),
      ),
      ProfileSectionData(
        title: 'Demandes de territoires',
        icon: Icons.map_outlined,
        content: _buildTerritoryContent(),
      ),
      ProfileSectionData(
        title: 'Demandes de publications',
        icon: Icons.library_books,
        content: _buildPublicationContent(),
      ),
      ProfileSectionData(
        title: 'Délégués',
        icon: Icons.group_work,
        content: _buildDelegatesContent(user),
      ),
    ];
  }

  Widget _buildSectionCard({
    required ProfileSectionData section,
    required bool expanded,
    required VoidCallback onToggle,
  }) {
    final accent = Colors.blue.shade700;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 220),
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: LinearGradient(
          colors: expanded
              ? [Colors.white, Colors.blue.shade50]
              : [Colors.white, Colors.white],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 6),
          ),
        ],
        border: Border.all(color: Colors.blue.shade50),
      ),
      child: Column(
        children: [
          InkWell(
            borderRadius: BorderRadius.circular(20),
            onTap: onToggle,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.blue.shade50,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(section.icon, color: accent),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Text(
                      section.title,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: Colors.blueGrey.shade800,
                      ),
                    ),
                  ),
                  Icon(expanded ? Icons.expand_less : Icons.expand_more,
                      color: accent),
                ],
              ),
            ),
          ),
          if (expanded)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
              child: section.content,
            ),
        ],
      ),
    );
  }

  Widget _buildGroupCard(
    _GroupPanelData panel,
    bool expanded,
    VoidCallback onToggle,
    String currentMonthKey,
    Person currentUser,
    bool canSeeReports,
    WidgetRef ref,
  ) {
    final accent = Colors.blue.shade600;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.blue.shade100),
        color: Colors.white,
      ),
      child: Column(
        children: [
          InkWell(
            borderRadius: BorderRadius.circular(18),
            onTap: onToggle,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  Icon(Icons.people_alt, color: accent),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      panel.title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  Icon(expanded ? Icons.expand_less : Icons.expand_more,
                      color: accent),
                ],
              ),
            ),
          ),
          if (expanded)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: Column(
                children: panel.members
                    .map((member) => _buildGroupMemberRow(member, currentMonthKey, canSeeReports, currentUser, ref))
                    .toList(),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildGroupMemberRow(
    Person person,
    String currentMonthKey,
    bool canSeeReports,
    Person currentUser,
    WidgetRef ref,
  ) {
    final activity = person.activity.firstWhere(
      (a) => a.month == currentMonthKey,
      orElse: () => ActivityReport(
        month: currentMonthKey,
        participated: false,
        bibleStudies: 0,
        isAuxiliaryPioneer: false,
        hours: 0,
        credit: 0,
        isLate: false,
        remarks: '',
      ),
    );
    final bool sent = activity.participated;
    final String monthLabel = DateFormat('MMM y', 'fr').format(DateTime.parse('${currentMonthKey}-01'));
    final bool isOwnProfile = person.id == currentUser.id;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        color: isOwnProfile ? Colors.green.shade50 : Colors.blue.shade50,
        border: isOwnProfile ? Border.all(color: Colors.green.shade300, width: 2) : null,
      ),
      child: Row(
        children: [
          Expanded(
            child: InkWell(
              borderRadius: BorderRadius.circular(10),
              onTap: () => _openMemberProfile(person, monthLabel, activity, canSeeReports, currentUser),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 18,
                    backgroundColor: isOwnProfile ? Colors.green.shade200 : Colors.blue.shade200,
                    child: Text(
                      person.displayName.isNotEmpty
                          ? person.displayName[0].toUpperCase()
                          : '?',
                      style: const TextStyle(color: Colors.white),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                person.displayName,
                                style: const TextStyle(fontWeight: FontWeight.w600),
                              ),
                            ),
                            if (isOwnProfile) ...[
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: Colors.green.shade600,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: const Text(
                                  'Moi',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                        Text(
                          person.spiritual.function ?? 'Proclamateur',
                          style: TextStyle(
                              color: Colors.blueGrey.shade700, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Afficher la section rapport uniquement si l'utilisateur peut voir les rapports
          if (canSeeReports) ...[
            const SizedBox(width: 8),
            Material(
              color: Colors.transparent,
              child: InkWell(
                borderRadius: BorderRadius.circular(10),
                onTap: () => _openDelegateReportSheet(
                      ref,
                      currentUser,
                      person,
                      currentMonthKey,
                      activity,
                    ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Icon(
                        sent ? Icons.check_box : Icons.check_box_outline_blank,
                        color: Colors.pink,
                        size: 22,
                      ),
                      Text(
                        monthLabel,
                        style: TextStyle(
                            color: Colors.pink.shade600,
                            fontWeight: FontWeight.w600,
                            fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _openDelegateReportSheet(
    WidgetRef ref,
    Person actor,
    Person target,
    String monthKey,
    ActivityReport existing,
  ) async {
    if (!mounted) return;
    if (actor.pin.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Ton code PIN est requis pour envoyer.')),
      );
      return;
    }

    final draft = _DelegateReportDraft(
      didPreach: existing.participated,
      bibleStudies: existing.bibleStudies ?? 0,
      hours: existing.hours ?? 0,
      credit: existing.credit ?? 0,
      remarks: existing.remarks,
    );

    String prefillNum(num value) => value == 0 ? '' : value.toString();

    final studiesCtrl = TextEditingController(text: prefillNum(draft.bibleStudies));
    final hoursCtrl = TextEditingController(text: prefillNum(draft.hours));
    final creditCtrl = TextEditingController(text: prefillNum(draft.credit));
    final remarksCtrl = TextEditingController(text: draft.remarks);
    bool isSubmitting = false;
    final monthLabel = DateFormat('MMMM yyyy', 'fr').format(DateTime.parse('$monthKey-01'));

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (sheetContext) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(sheetContext).viewInsets.bottom + 16,
            left: 16,
            right: 16,
            top: 16,
          ),
          child: StatefulBuilder(
            builder: (context, setModalState) {
              return SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            'Rapport $monthLabel\n${target.displayName}',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: () => Navigator.of(sheetContext).pop(),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Envoi en tant que ${actor.displayName}',
                      style: TextStyle(color: Colors.blueGrey.shade600),
                    ),
                    const SizedBox(height: 12),
                    CheckboxListTile(
                      value: draft.didPreach,
                      onChanged: (v) => setModalState(() {
                        draft.didPreach = v ?? false;
                      }),
                      title: const Text('A participé (au moins une fois)'),
                      controlAffinity: ListTileControlAffinity.leading,
                      contentPadding: EdgeInsets.zero,
                    ),
                    TextField(
                      controller: studiesCtrl,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Cours bibliques'),
                      onChanged: (v) => draft.bibleStudies = int.tryParse(v) ?? 0,
                    ),
                    TextField(
                      controller: hoursCtrl,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(labelText: 'Heures (pionniers)'),
                      onChanged: (v) => draft.hours = double.tryParse(v) ?? 0,
                    ),
                    TextField(
                      controller: creditCtrl,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(labelText: 'Crédit d\'heures'),
                      onChanged: (v) => draft.credit = double.tryParse(v) ?? 0,
                    ),
                    TextField(
                      controller: remarksCtrl,
                      decoration: const InputDecoration(labelText: 'Remarques'),
                      onChanged: (v) => draft.remarks = v,
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        icon: isSubmitting
                            ? const SizedBox(
                                height: 16,
                                width: 16,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Icon(Icons.send),
                        label: Text(isSubmitting ? 'Envoi en cours...' : 'Envoyer pour lui'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.pink,
                        ),
                        onPressed: isSubmitting
                            ? null
                            : () async {
                                setModalState(() => isSubmitting = true);
                                final storage = ref.read(storageServiceProvider);
                                
                                // Vérifier que le PIN de l'acteur n'est pas vide
                                if (actor.pin.isEmpty) {
                                  setModalState(() => isSubmitting = false);
                                  if (!context.mounted) return;
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Row(
                                        children: [
                                          Icon(Icons.error, color: Colors.white),
                                          SizedBox(width: 8),
                                          Text('Ton code PIN est requis. Reconnecte-toi.'),
                                        ],
                                      ),
                                      backgroundColor: Colors.red,
                                    ),
                                  );
                                  return;
                                }
                                
                                final success = await storage.sendPreachingReportForUser(
                                  targetUserId: target.id,
                                  month: monthKey,
                                  entries: {
                                    '$monthKey-01': {
                                      'hours': draft.hours,
                                      'bibleStudies': draft.bibleStudies,
                                      'credit': draft.credit,
                                    }
                                  },
                                  totals: {
                                    'hours': draft.hours,
                                    'bibleStudies': draft.bibleStudies,
                                    'credit': draft.credit,
                                  },
                                  didPreach: draft.didPreach,
                                  actorId: actor.id,
                                  actorPin: actor.pin,
                                );

                                if (!mounted) return;

                                if (success) {
                                  // Si l'utilisateur envoie pour lui-même, marquer le mois comme soumis
                                  if (target.id == actor.id) {
                                    ref.read(preachingActivityProvider.notifier).markMonthAsSubmitted(monthKey);
                                  }
                                  
                                  // Fermer le bottom sheet d'abord
                                  Navigator.of(sheetContext).pop();
                                  
                                  // Petit délai pour laisser le serveur mettre à jour
                                  await Future.delayed(const Duration(milliseconds: 500));
                                  
                                  // Rafraîchir la liste des proclamateurs et attendre le résultat
                                  ref.invalidate(peopleProvider);
                                  await ref.read(peopleProvider.future);
                                  
                                  // Rafraîchir aussi le provider d'activité pour mettre à jour le statut
                                  ref.read(preachingActivityProvider.notifier).refreshFromServer();
                                  
                                  if (!context.mounted) return;
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Row(
                                        children: [
                                          Icon(Icons.check_circle, color: Colors.white),
                                          SizedBox(width: 8),
                                          Text('✓ Rapport envoyé pour ce proclamateur.'),
                                        ],
                                      ),
                                      backgroundColor: Colors.green,
                                      duration: Duration(seconds: 3),
                                    ),
                                  );
                                } else {
                                  setModalState(() => isSubmitting = false);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Row(
                                        children: [
                                          Icon(Icons.error, color: Colors.white),
                                          SizedBox(width: 8),
                                          Text('Échec de l\'envoi, réessaie.'),
                                        ],
                                      ),
                                      backgroundColor: Colors.red,
                                    ),
                                  );
                                }
                              },
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        );
      },
    );

    studiesCtrl.dispose();
    hoursCtrl.dispose();
    creditCtrl.dispose();
    remarksCtrl.dispose();
  }

  Widget _buildProclaimerContent({
    required Person user,
    required List<Person> allPeople,
    required bool isLoading,
    String? errorMessage,
    bool hideEmergency = false,
  }) {
    if (isLoading) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 8),
        child: Center(child: CircularProgressIndicator()),
      );
    }

    if (errorMessage != null) {
      return Text(
        'Impossible de charger les proclamateurs : $errorMessage',
        style: TextStyle(color: Colors.red.shade600),
      );
    }

    if (allPeople.isEmpty) {
      return _placeholderText('Aucun proclamateur disponible pour le moment.');
    }

    // Vérifie si l'utilisateur est ancien ou assistant ministériel
    final bool isElderOrServant =
        (user.spiritual.function ?? '').toLowerCase().contains('ancien') ||
            (user.spiritual.function ?? '').toLowerCase().contains('elder') ||
            (user.spiritual.function ?? '').toLowerCase().contains('serv');

    // Vérifie si l'utilisateur est surveillant ou assistant de son groupe de prédication
    final bool isGroupOverseerOrAssistant = user.spiritual.isGroupOverseerOrAssistant;

    final Map<String, List<Person>> groups = {};
    final Map<String, String> groupLabels = {};
    for (final person in allPeople) {
      final rawId = (person.spiritual.group ?? '').trim();
      final rawLabel = (person.spiritual.groupName ?? '').trim();
      // Si l'id est vide mais le libellé existe (ex: "Groupe 5"), on utilise le libellé comme id.
      final groupId = rawId.isNotEmpty
          ? rawId
          : (rawLabel.isNotEmpty ? rawLabel : 'Groupe non défini');
      final label = rawLabel.isNotEmpty ? rawLabel : groupId;
      groupLabels[groupId] = label;
      groups.putIfAbsent(groupId, () => []).add(person);
    }

    List<_GroupPanelData> panels;
    // Afficher tous les groupes pour les anciens, assistants ministériels ET adjoints de groupe de prédication
    if (isElderOrServant || isGroupOverseerOrAssistant) {
      panels = groups.entries
          .map((entry) => _GroupPanelData(
                title: groupLabels[entry.key] ?? entry.key,
                members: entry.value,
                groupId: entry.key,
              ))
          .toList()
        ..sort((a, b) => a.title.compareTo(b.title));
    } else {
      // Pour les autres utilisateurs, afficher uniquement leur groupe
      final groupId = user.spiritual.group ?? 'Groupe non défini';
      final members = groups[groupId] ?? [user];
      panels = [
        _GroupPanelData(
          title: groupLabels[groupId] ?? groupId,
          members: members,
          groupId: groupId,
        )
      ];
    }

    final String currentMonthKey = '${DateTime.now().year.toString().padLeft(4, '0')}-${DateTime.now().month.toString().padLeft(2, '0')}';
    final String userGroupId = user.spiritual.group ?? 'Groupe non défini';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (isElderOrServant || isGroupOverseerOrAssistant)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton.icon(
                  onPressed: () async {
                    try {
                      // Afficher un dialogue de confirmation
                      final confirm = await showDialog<bool>(
                        context: context,
                        builder: (ctx) => AlertDialog(
                          title: const Text('Recharger les données'),
                          content: const Text(
                            'Cette action va recharger toutes les données depuis le serveur. '
                            'Les données locales seront écrasées. Continuer ?',
                          ),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.of(ctx).pop(false),
                              child: const Text('Annuler'),
                            ),
                            ElevatedButton(
                              onPressed: () => Navigator.of(ctx).pop(true),
                              child: const Text('Recharger'),
                            ),
                          ],
                        ),
                      );
                      
                      if (confirm == true && mounted) {
                        // Afficher un indicateur de chargement
                        showDialog(
                          context: context,
                          barrierDismissible: false,
                          builder: (ctx) => const Center(
                            child: CircularProgressIndicator(),
                          ),
                        );
                        
                        // Forcer le rechargement depuis les assets
                        final storage = ref.read(storageServiceProvider);
                        await storage.forceReloadFromAssets();
                        
                        // Invalider le provider pour recharger
                        ref.invalidate(peopleProvider);
                        await ref.read(peopleProvider.future);
                        
                        if (mounted) {
                          Navigator.of(context).pop(); // Fermer le dialogue de chargement
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Row(
                                children: [
                                  Icon(Icons.check_circle, color: Colors.white),
                                  SizedBox(width: 8),
                                  Text('Données rechargées avec succès !'),
                                ],
                              ),
                              backgroundColor: Colors.green,
                              duration: Duration(seconds: 2),
                            ),
                          );
                        }
                      }
                    } catch (e) {
                      if (mounted) {
                        Navigator.of(context).pop(); // Fermer le dialogue de chargement
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Row(
                              children: [
                                const Icon(Icons.error, color: Colors.white),
                                const SizedBox(width: 8),
                                Text('Erreur : $e'),
                              ],
                            ),
                            backgroundColor: Colors.red,
                          ),
                        );
                      }
                    }
                  },
                  icon: const Icon(Icons.cloud_download),
                  label: const Text('Recharger données'),
                ),
                const SizedBox(width: 8),
                TextButton.icon(
                  onPressed: () async {
                    ref.invalidate(peopleProvider);
                    await ref.read(peopleProvider.future);
                  },
                  icon: const Icon(Icons.refresh),
                  label: const Text('Actualiser'),
                ),
              ],
            ),
          ),
        ...panels.map((panel) {
          final panelKey = 'group-${panel.groupId}';
          final expanded = _expandedGroupPanels.contains(panelKey);
          // L'utilisateur peut voir les rapports s'il est ancien/assistant ministériel
          // ET (s'il est surveillant/assistant du groupe OU si c'est son propre groupe)
          final bool canSeeReportsForThisGroup = isElderOrServant && 
              (isGroupOverseerOrAssistant || panel.groupId == userGroupId);
          return _buildGroupCard(
            panel,
            expanded,
            () {
              setState(() {
                if (expanded) {
                  _expandedGroupPanels.remove(panelKey);
                } else {
                  _expandedGroupPanels.add(panelKey);
                }
              });
            },
            currentMonthKey,
            user,
            canSeeReportsForThisGroup,
            ref,
          );
        }),
      ],
    );
  }

  Widget _buildPreachingHistory(
      Person user, PreachingActivityState preachingState) {
    final reports = [...user.activity];
    final currentMonthKey = preachingState.selectedMonthKey;

    if (preachingState.hasRecordedActivity) {
      reports.removeWhere((report) => report.month == currentMonthKey);
      reports.add(
        ActivityReport(
          month: currentMonthKey,
          participated: preachingState.didPreach,
          bibleStudies: preachingState.totalBibleStudies,
          isAuxiliaryPioneer: false,
          hours: preachingState.totalHours,
          credit: preachingState.totalCredit,
          isLate: false,
          remarks: 'Brouillon',
        ),
      );
    }

    final serviceYear = _serviceYearFromDate(preachingState.selectedMonth);

    final filtered = reports.where((report) {
      final date = _parseIsoMonth(report.month);
      if (date == null) return false;
      return _serviceYearFromDate(date) == serviceYear;
    }).toList();

    final reportByMonth = <String, ActivityReport>{};
    for (final report in filtered) {
      reportByMonth[report.month] = report;
    }

    final startOfYear = DateTime(serviceYear, 9, 1);
    final months = List<DateTime>.generate(12,
        (index) => DateTime(startOfYear.year, startOfYear.month + index, 1));

    final rows = months
        .map((date) => _HistoryRowData(
              date: date,
              report: reportByMonth[_isoMonthKey(date)],
            ))
        .toList();

    final totals = _HistoryTotals.fromReports(filtered);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '$serviceYear Année de service',
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        const SizedBox(height: 12),
        _buildHistoryTable(rows, totals),
      ],
    );
  }

  Widget _buildHistoryTable(
    List<_HistoryRowData> rows,
    _HistoryTotals totals,
  ) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.blue.shade50),
        color: Colors.white,
      ),
      child: Table(
        columnWidths: const {
          0: FlexColumnWidth(2.4),
          1: FlexColumnWidth(1),
          2: FlexColumnWidth(1.1),
          3: FlexColumnWidth(1),
          4: FlexColumnWidth(1.2),
        },
        defaultVerticalAlignment: TableCellVerticalAlignment.middle,
        children: [
          TableRow(children: [
            _historyHeaderCell('Mois', align: TextAlign.left),
            _historyHeaderCell('A prêché'),
            _historyHeaderCell('h'),
            _historyHeaderCell('CB'),
            _historyHeaderCell('Crédit'),
          ]),
          ...rows.map((row) {
            final report = row.report;
            final monthLabel = _formatShortMonthLabel(row.date);
            final hasReport = report != null;
            final hoursText = hasReport && report.hours != null
                ? (report.hours!).toStringAsFixed(1)
                : '—';
            final creditText = hasReport && report.credit != null
                ? (report.credit!).toStringAsFixed(1)
                : '—';
            final studies = hasReport && report.bibleStudies != null
                ? report.bibleStudies.toString()
                : '—';
            return TableRow(children: [
              _historyValueCell(monthLabel, align: TextAlign.left, bold: true),
              _historyParticipationCell(report?.participated ?? false,
                  hasReport: hasReport),
              _historyValueCell(hoursText),
              _historyValueCell(studies),
              _historyValueCell(creditText),
            ]);
          }),
          TableRow(children: [
            _historyFooterCell('Total', align: TextAlign.left),
            const SizedBox.shrink(),
            _historyFooterCell(totals.hoursTotal.toStringAsFixed(1)),
            _historyFooterCell(totals.bibleStudiesTotal.toStringAsFixed(0)),
            _historyFooterCell(totals.creditTotal.toStringAsFixed(1)),
          ]),
          TableRow(children: [
            _historyFooterCell('Moy.', align: TextAlign.left),
            const SizedBox.shrink(),
            _historyFooterCell(totals.hoursAverage.toStringAsFixed(1)),
            _historyFooterCell(totals.bibleStudiesAverage.toStringAsFixed(1)),
            _historyFooterCell(totals.creditAverage.toStringAsFixed(1)),
          ]),
        ],
      ),
    );
  }

  Widget _buildContactContent(Person user) {
    return _EditableContactSection(
      user: user,
      expandedContactTiles: _expandedContactTiles,
      onToggleTile: (id) {
        setState(() {
          if (_expandedContactTiles.contains(id)) {
            _expandedContactTiles.remove(id);
          } else {
            _expandedContactTiles.add(id);
          }
        });
      },
      onSave: () async {
        // Rafraîchir l'état depuis le stockage local.
        // IMPORTANT: ne pas écraser l'utilisateur courant avec une liste "people" potentiellement
        // obsolète (remote/asset) juste après un enregistrement.
        await ref.read(authStateProvider.notifier).initAuth();
        ref.invalidate(peopleProvider);
      },
    );
  }

  Widget _buildContactTile(_ContactTileData tile) {
    final expanded = _expandedContactTiles.contains(tile.id);
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: tile.background,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: tile.borderColor),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () {
          setState(() {
            if (expanded) {
              _expandedContactTiles.remove(tile.id);
            } else {
              _expandedContactTiles.add(tile.id);
            }
          });
        },
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(tile.icon, color: Colors.blueGrey.shade700),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      tile.title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  Icon(
                    expanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                    color: Colors.blueGrey.shade700,
                  ),
                ],
              ),
              if (expanded) ...[
                const SizedBox(height: 12),
                tile.content,
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPreachingActivityContent(PreachingActivityState preachingState) {
    final hasData = preachingState.hasRecordedActivity;
    final isSubmitted = preachingState.isSubmitted;
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const PreachingActivitySection(compact: true),
        const SizedBox(height: 16),
        // Statut du rapport
        if (hasData)
          Text(
            isSubmitted ? '✓ Rapport transmis' : '✗ Rapport en attente',
            style: TextStyle(
                color: isSubmitted ? Colors.green : Colors.red,
                fontWeight: FontWeight.bold),
          )
        else
          const Text('Aucun rapport saisi pour l\'instant.'),
        const SizedBox(height: 12),
        // Boutons d'action
        Wrap(
          spacing: 12,
          runSpacing: 8,
          children: [
            FilledButton.icon(
              onPressed: () => _openPreachingEntrySheet(context),
              icon: const Icon(Icons.add),
              label: const Text('Ajouter / Modifier'),
            ),
            OutlinedButton.icon(
              onPressed: hasData
                  ? () => _showSendReportSheet(context, ref, preachingState)
                  : null,
              icon: const Icon(Icons.send),
              label: const Text('Envoyer le rapport'),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildAbsenceContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _placeholderText(
            'Planifie tes absences pour informer automatiquement le secrétariat.'),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: () {},
          icon: const Icon(Icons.add),
          label: const Text('Ajouter une période'),
        ),
      ],
    );
  }

  Widget _buildTerritoryContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _placeholderText(
            'Centralise ici tes demandes de territoires et l\'historique des retours.'),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.outgoing_mail),
                label: const Text('Nouvelle demande'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.history_toggle_off),
                label: const Text('Historique'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildPublicationContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _placeholderText(
            'Synchronisé automatiquement avec la librairie. Demande tes publications et suis leur statut.'),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: () {},
          icon: const Icon(Icons.library_add),
          label: const Text('Demander des publications'),
        ),
      ],
    );
  }

  Widget _buildDelegatesContent(Person user) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _infoRow(Icons.groups, 'Groupe de prédication',
            user.spiritual.group ?? 'Non affecté'),
        _placeholderText(
            'Les délégués seront synchronisés dès que l\'assemblée aura partagé ces informations.'),
      ],
    );
  }

  Widget _infoRow(IconData icon, String label, String value,
      {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, color: Colors.blue.shade600, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontWeight: FontWeight.w600,
              color: valueColor ?? Colors.blueGrey.shade800,
            ),
          ),
        ],
      ),
    );
  }

  Widget _placeholderText(String text) {
    return Text(
      text,
      style: TextStyle(color: Colors.blueGrey.shade600),
    );
  }

  Widget _historyHeaderCell(String label,
      {TextAlign align = TextAlign.center}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Text(
        label,
        textAlign: align,
        style: TextStyle(
          fontWeight: FontWeight.w700,
          color: Colors.blueGrey.shade600,
        ),
      ),
    );
  }

  Widget _historyValueCell(
    String value, {
    TextAlign align = TextAlign.center,
    bool bold = false,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Text(
        value,
        textAlign: align,
        style: TextStyle(
          fontWeight: bold ? FontWeight.w600 : FontWeight.w500,
          color: Colors.blueGrey.shade800,
        ),
      ),
    );
  }

  Widget _historyFooterCell(String value,
      {TextAlign align = TextAlign.center}) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      alignment: _textAlignToAlignment(align),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        value,
        textAlign: align,
        style: const TextStyle(fontWeight: FontWeight.w700),
      ),
    );
  }

  Alignment _textAlignToAlignment(TextAlign align) {
    switch (align) {
      case TextAlign.left:
      case TextAlign.start:
        return Alignment.centerLeft;
      case TextAlign.right:
      case TextAlign.end:
        return Alignment.centerRight;
      case TextAlign.center:
      case TextAlign.justify:
        return Alignment.center;
    }
  }

  Widget _historyParticipationCell(bool participated, {bool hasReport = true}) {
    final color = participated
        ? Colors.green
        : hasReport
            ? Colors.orange
            : Colors.grey;
    final icon = participated
        ? Icons.check_circle
        : hasReport
            ? Icons.hourglass_empty
            : Icons.radio_button_unchecked;
    return Center(
      child: Icon(
        icon,
        color: color,
        size: 18,
      ),
    );
  }

  DateTime? _parseIsoMonth(String isoMonth) {
    if (!isoMonth.contains('-')) return null;
    final parts = isoMonth.split('-');
    if (parts.length < 2) return null;
    final year = int.tryParse(parts[0]);
    final month = int.tryParse(parts[1]);
    if (year == null || month == null) return null;
    return DateTime(year, month, 1);
  }

  int _serviceYearFromDate(DateTime date) =>
      date.month >= 9 ? date.year : date.year - 1;

  String _formatShortMonthLabel(DateTime date) {
    final monthIndex = date.month.clamp(1, 12).toInt();
    final label = _monthNames[monthIndex - 1];
    final shortYear = (date.year % 100).toString().padLeft(2, '0');
    return '$label $shortYear';
  }

  String _isoMonthKey(DateTime date) =>
      '${date.year.toString().padLeft(4, '0')}-${date.month.toString().padLeft(2, '0')}';

  String _valueOrDash(String value) => value.isEmpty ? '—' : value;

  Future<void> _openMemberProfile(
    Person person,
    String monthLabel,
    ActivityReport activity,
    bool canSeeReports,
    Person currentUser,
  ) async {
    if (!mounted) return;

    final groupLabel = (person.spiritual.groupName ?? person.spiritual.group ?? '')
        .trim()
        .isNotEmpty
        ? (person.spiritual.groupName ?? person.spiritual.group)!
        : 'Groupe non défini';

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (sheetContext) {
        return DraggableScrollableSheet(
          initialChildSize: 0.7,
          minChildSize: 0.4,
          maxChildSize: 0.9,
          expand: false,
          builder: (context, scrollController) {
            return _MemberContactSheet(
              person: person,
              currentUser: currentUser,
              storage: ref.read(storageServiceProvider),
              afterSave: () async {
                // Rafraîchir la liste et l'utilisateur courant (sans perdre les edits locaux).
                ref.invalidate(peopleProvider);
                await ref.read(authStateProvider.notifier).initAuth();
              },
              groupLabel: groupLabel,
              monthLabel: monthLabel,
              activity: activity,
              canSeeReports: canSeeReports,
              scrollController: scrollController,
            );
          },
        );
      },
    );
  }
}

/// Widget pour afficher la fiche contact d'un membre
class _MemberContactSheet extends StatefulWidget {
  final Person person;
  final Person currentUser;
  final StorageService storage;
  final Future<void> Function()? afterSave;
  final String groupLabel;
  final String monthLabel;
  final ActivityReport activity;
  final bool canSeeReports;
  final ScrollController scrollController;

  const _MemberContactSheet({
    required this.person,
    required this.currentUser,
    required this.storage,
    this.afterSave,
    required this.groupLabel,
    required this.monthLabel,
    required this.activity,
    required this.canSeeReports,
    required this.scrollController,
  });

  @override
  State<_MemberContactSheet> createState() => _MemberContactSheetState();
}

class _MemberContactSheetState extends State<_MemberContactSheet> {
  final Set<String> _expandedSections = <String>{'personal'};
  bool _isEditing = false;
  bool _isSaving = false;
  late Person _person;
  late TextEditingController _email1Controller;
  late TextEditingController _email2Controller;
  late TextEditingController _mobilePhoneController;
  late TextEditingController _homePhoneController;
  late TextEditingController _workPhoneController;
  late TextEditingController _addressController;

  @override
  void initState() {
    super.initState();
    _person = widget.person;
    _email1Controller = TextEditingController(text: widget.person.email1 ?? '');
    _email2Controller = TextEditingController(text: widget.person.email2 ?? '');
    _mobilePhoneController = TextEditingController(text: widget.person.mobilePhone ?? '');
    _homePhoneController = TextEditingController(text: widget.person.homePhone ?? '');
    _workPhoneController = TextEditingController(text: widget.person.workPhone ?? '');
    _addressController = TextEditingController(text: widget.person.address ?? '');
  }

  @override
  void dispose() {
    _email1Controller.dispose();
    _email2Controller.dispose();
    _mobilePhoneController.dispose();
    _homePhoneController.dispose();
    _workPhoneController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final person = _person;
    final currentUser = widget.currentUser;
    final isOwnProfile = person.id == currentUser.id;
    final isElder = (currentUser.spiritual.function ?? '').toLowerCase().contains('ancien') ||
                    (currentUser.spiritual.function ?? '').toLowerCase().contains('elder');
    // Seuls les anciens peuvent voir les coordonnées des autres utilisateurs
    final canSeeFullContact = isOwnProfile ? true : isElder;
    final canEditContact = isOwnProfile || isElder;
    
    return Container(
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.only(top: 12, bottom: 8),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey.shade400,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          // Header avec titre "Mes coordonnées"
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade100,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(Icons.contact_phone, color: Colors.blue.shade700),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    isOwnProfile ? 'Mes coordonnées' : 'Coordonnées de ${person.displayName}',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.blueGrey.shade800,
                    ),
                  ),
                ),
                if (canEditContact && !_isEditing)
                  IconButton(
                    icon: const Icon(Icons.edit),
                    onPressed: _isSaving ? null : () => setState(() => _isEditing = true),
                  ),
                if (canEditContact && _isEditing)
                  IconButton(
                    icon: const Icon(Icons.check),
                    onPressed: _isSaving ? null : _saveChanges,
                  ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          // Contenu scrollable
          Expanded(
            child: SingleChildScrollView(
              controller: widget.scrollController,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                children: [
                  // Section: Informations personnelles
                  _buildContactSection(
                    id: 'personal',
                    title: 'Informations personnelles',
                    icon: Icons.perm_contact_calendar,
                    backgroundColor: Colors.yellow.shade50,
                    borderColor: Colors.amber.shade300,
                    content: Column(
                      children: [
                        _buildInfoRow(Icons.person, 'Nom complet', _valueOrDash(person.displayName)),
                        _buildInfoRow(Icons.badge, 'Fonction', _valueOrDash(person.spiritual.function)),
                        _buildInfoRow(Icons.groups, 'Groupe', widget.groupLabel),
                        if (canSeeFullContact) ...[
                          if (_isEditing && canEditContact)
                            _buildEditableRow(Icons.email, 'E-mail', _email1Controller)
                          else
                            _buildInfoRow(Icons.email, 'E-mail', _valueOrDash(person.email1)),
                          if (_isEditing && canEditContact)
                            _buildEditableRow(Icons.email_outlined, 'E-mail secondaire', _email2Controller)
                          else
                            _buildInfoRow(Icons.email_outlined, 'E-mail secondaire', _valueOrDash(person.email2)),
                          if (_isEditing && canEditContact)
                            _buildEditableRow(Icons.phone_android, 'Téléphone mobile', _mobilePhoneController)
                          else
                            _buildInfoRow(Icons.phone_android, 'Téléphone mobile', _valueOrDash(person.mobilePhone)),
                          if (_isEditing && canEditContact)
                            _buildEditableRow(Icons.phone, 'Téléphone fixe', _homePhoneController)
                          else
                            _buildInfoRow(Icons.phone, 'Téléphone fixe', _valueOrDash(person.homePhone)),
                          if (_isEditing && canEditContact)
                            _buildEditableRow(Icons.work, 'Téléphone travail', _workPhoneController)
                          else
                            _buildInfoRow(Icons.work, 'Téléphone travail', _valueOrDash(person.workPhone)),
                          if (_isEditing && canEditContact)
                            _buildEditableRow(Icons.location_on, 'Adresse', _addressController)
                          else
                            _buildInfoRow(Icons.location_on, 'Adresse', _valueOrDash(person.address)),
                        ] else ...[
                          _buildInfoRow(Icons.lock, 'Coordonnées', 'Réservé aux anciens'),
                        ],
                      ],
                    ),
                  ),
                  // Section rapport (uniquement si canSeeReports est true)
                  if (widget.canSeeReports) ...[
                    const SizedBox(height: 8),
                    Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.green.shade50,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: Colors.green.shade200),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            widget.activity.participated ? Icons.check_circle : Icons.pending,
                            color: widget.activity.participated ? Colors.green : Colors.orange,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Rapport ${widget.monthLabel}',
                                  style: const TextStyle(fontWeight: FontWeight.w600),
                                ),
                                Text(
                                  widget.activity.participated ? 'Envoyé' : 'Non envoyé',
                                  style: TextStyle(
                                    color: widget.activity.participated 
                                        ? Colors.green.shade700 
                                        : Colors.orange.shade700,
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Text(
                            '${widget.activity.hours?.toStringAsFixed(1) ?? '0'} h • ${widget.activity.bibleStudies ?? 0} CB',
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContactSection({
    required String id,
    required String title,
    required IconData icon,
    required Color backgroundColor,
    required Color borderColor,
    required Widget content,
  }) {
    final expanded = _expandedSections.contains(id);
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () {
          setState(() {
            if (expanded) {
              _expandedSections.remove(id);
            } else {
              _expandedSections.add(id);
            }
          });
        },
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(icon, color: Colors.blueGrey.shade700),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  Icon(
                    expanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                    color: Colors.blueGrey.shade700,
                  ),
                ],
              ),
              if (expanded) ...[
                const SizedBox(height: 12),
                content,
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, color: Colors.blue.shade600, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
          Flexible(
            child: Text(
              value,
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: Colors.blueGrey.shade800,
              ),
              textAlign: TextAlign.end,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEditableRow(IconData icon, String label, TextEditingController controller) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, color: Colors.blue.shade600, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
          const SizedBox(width: 10),
          Flexible(
            flex: 2,
            child: TextField(
              controller: controller,
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: Colors.blueGrey.shade800,
              ),
              textAlign: TextAlign.end,
              decoration: InputDecoration(
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: Colors.blue.shade300),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: Colors.blue.shade600, width: 2),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _saveChanges() async {
    final person = _person;
    final currentUser = widget.currentUser;
    final isOwnProfile = person.id == currentUser.id;
    final isElder = (currentUser.spiritual.function ?? '').toLowerCase().contains('ancien') ||
        (currentUser.spiritual.function ?? '').toLowerCase().contains('elder');
    final canEdit = isOwnProfile || isElder;
    if (!canEdit) return;

    setState(() => _isSaving = true);
    bool success = false;
    try {
      if (isOwnProfile) {
        success = await widget.storage.updatePersonalInfo(
          userId: person.id,
          pin: currentUser.pin,
          email1: _email1Controller.text,
          email2: _email2Controller.text,
          mobilePhone: _mobilePhoneController.text,
          homePhone: _homePhoneController.text,
          workPhone: _workPhoneController.text,
          address: _addressController.text,
        );
      } else {
        success = await widget.storage.updatePersonalInfoForUser(
          targetUserId: person.id,
          actorId: currentUser.id,
          actorPin: currentUser.pin,
          email1: _email1Controller.text,
          email2: _email2Controller.text,
          mobilePhone: _mobilePhoneController.text,
          homePhone: _homePhoneController.text,
          workPhone: _workPhoneController.text,
          address: _addressController.text,
        );
      }
    } catch (_) {
      success = false;
    }

    if (!mounted) return;
    if (success) {
      final updated = Person(
        id: person.id,
        firstName: person.firstName,
        middleName: person.middleName,
        lastName: person.lastName,
        displayName: person.displayName,
        pin: person.pin,
        email1: _email1Controller.text,
        email2: _email2Controller.text,
        mobilePhone: _mobilePhoneController.text,
        homePhone: _homePhoneController.text,
        workPhone: _workPhoneController.text,
        address: _addressController.text,
        gender: person.gender,
        activity: person.activity,
        assignments: person.assignments,
        spiritual: person.spiritual,
        emergency: person.emergency,
        spiritual_active: person.spiritual_active,
        meetingParticipation: person.meetingParticipation,
      );
      setState(() {
        _person = updated;
        _isSaving = false;
        _isEditing = false;
      });
    } else {
      setState(() {
        _isSaving = false;
      });
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(success ? Icons.check_circle : Icons.error, color: Colors.white),
            const SizedBox(width: 8),
            Text(success ? 'Informations enregistrées' : 'Erreur lors de l\'enregistrement'),
          ],
        ),
        backgroundColor: success ? Colors.green : Colors.red,
      ),
    );

    if (success) {
      await widget.afterSave?.call();
    }
  }

  String _valueOrDash(String? value) {
    return (value != null && value.isNotEmpty) ? value : '—';
  }
}

class ProfileSectionData {
  final String title;
  final IconData icon;
  final Widget content;

  const ProfileSectionData({
    required this.title,
    required this.icon,
    required this.content,
  });
}

class _ContactTileData {
  final String id;
  final String title;
  final IconData icon;
  final Color background;
  final Color borderColor;
  final Widget content;

  _ContactTileData({
    required this.id,
    required this.title,
    required this.icon,
    required this.background,
    required this.borderColor,
    required this.content,
  });
}

class _InfoPlaceholder extends StatelessWidget {
  final String label;
  const _InfoPlaceholder({required this.label});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          const Icon(Icons.edit_note, size: 18, color: Colors.black54),
          const SizedBox(width: 8),
          Text(label, style: const TextStyle(color: Colors.black54)),
          const Spacer(),
          Text('—', style: TextStyle(color: Colors.grey.shade500)),
        ],
      ),
    );
  }
}

class _GroupPanelData {
  final String title;
  final List<Person> members;
  final String groupId;

  _GroupPanelData({required this.title, required this.members, required this.groupId});
}

class _DelegateReportDraft {
  bool didPreach;
  int bibleStudies;
  double hours;
  double credit;
  String remarks;

  _DelegateReportDraft({
    this.didPreach = false,
    this.bibleStudies = 0,
    this.hours = 0,
    this.credit = 0,
    this.remarks = '',
  });
}

class _HistoryRowData {
  final DateTime date;
  final ActivityReport? report;

  _HistoryRowData({required this.date, this.report});
}

class _HistoryTotals {
  final double hoursTotal;
  final double creditTotal;
  final double bibleStudiesTotal;
  final int monthsCount;

  const _HistoryTotals({
    required this.hoursTotal,
    required this.creditTotal,
    required this.bibleStudiesTotal,
    required this.monthsCount,
  });

  factory _HistoryTotals.fromReports(List<ActivityReport> reports) {
    double hours = 0;
    double credit = 0;
    double studies = 0;
    for (final report in reports) {
      hours += report.hours ?? 0;
      credit += report.credit ?? 0;
      studies += (report.bibleStudies ?? 0).toDouble();
    }
    return _HistoryTotals(
      hoursTotal: hours,
      creditTotal: credit,
      bibleStudiesTotal: studies,
      monthsCount: reports.length,
    );
  }

  double get hoursAverage => monthsCount == 0 ? 0 : hoursTotal / monthsCount;
  double get creditAverage => monthsCount == 0 ? 0 : creditTotal / monthsCount;
  double get bibleStudiesAverage =>
      monthsCount == 0 ? 0 : bibleStudiesTotal / monthsCount;
}

/// Widget pour les informations de contact avec édition des contacts d'urgence uniquement
class _EditableContactSection extends ConsumerStatefulWidget {
  final Person user;
  final Set<String> expandedContactTiles;
  final Function(String) onToggleTile;
  final VoidCallback onSave;

  const _EditableContactSection({
    required this.user,
    required this.expandedContactTiles,
    required this.onToggleTile,
    required this.onSave,
  });

  @override
  ConsumerState<_EditableContactSection> createState() => _EditableContactSectionState();
}

class _EditableContactSectionState extends ConsumerState<_EditableContactSection> {
  // Toujours en mode édition pour rendre la saisie immédiate.
  bool _isEditingEmergency = true;
  bool _isSaving = false;
  bool _isSavingPersonal = false;

  // Contrôleurs pour les informations personnelles
  late TextEditingController _email1Controller;
  late TextEditingController _email2Controller;
  late TextEditingController _mobilePhoneController;
  late TextEditingController _homePhoneController;
  late TextEditingController _workPhoneController;
  late TextEditingController _addressController;

  // Contrôleurs pour les contacts d'urgence (3 max)
  late List<_EmergencyContactControllers> _emergencyControllers;

  @override
  void initState() {
    super.initState();
    _initControllers();
    _expandEmergencyTiles();
  }

  void _initControllers() {
    final user = widget.user;
    
    // Initialiser les contrôleurs des informations personnelles
    _email1Controller = TextEditingController(text: user.email1 ?? '');
    _email2Controller = TextEditingController(text: user.email2 ?? '');
    _mobilePhoneController = TextEditingController(text: user.mobilePhone ?? '');
    _homePhoneController = TextEditingController(text: user.homePhone ?? '');
    _workPhoneController = TextEditingController(text: user.workPhone ?? '');
    _addressController = TextEditingController(text: user.address ?? '');
    
    _emergencyControllers = List.generate(3, (index) {
      final contact = index < user.emergency.contacts.length
          ? user.emergency.contacts[index]
          : null;
      return _EmergencyContactControllers(
        nameController: TextEditingController(text: contact?.name ?? ''),
        phoneController: TextEditingController(text: contact?.phone ?? ''),
        relationshipController: TextEditingController(text: contact?.relationship ?? ''),
        addressController: TextEditingController(text: contact?.address ?? ''),
      );
    });
  }

  void _expandEmergencyTiles() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      for (final id in const ['emergency-1', 'emergency-2', 'emergency-3']) {
        if (!widget.expandedContactTiles.contains(id)) {
          widget.onToggleTile(id);
        }
      }
    });
  }

  @override
  void dispose() {
    _email1Controller.dispose();
    _email2Controller.dispose();
    _mobilePhoneController.dispose();
    _homePhoneController.dispose();
    _workPhoneController.dispose();
    _addressController.dispose();
    for (final ctrl in _emergencyControllers) {
      ctrl.dispose();
    }
    super.dispose();
  }

  Future<void> _saveEmergencyContacts() async {
    setState(() => _isSaving = true);

    final storage = ref.read(storageServiceProvider);
    final emergencyContacts = _emergencyControllers
        .where((ctrl) => ctrl.nameController.text.isNotEmpty || ctrl.phoneController.text.isNotEmpty)
        .map((ctrl) => EmergencyContact(
              name: ctrl.nameController.text,
              phone: ctrl.phoneController.text,
              relationship: ctrl.relationshipController.text,
              address: ctrl.addressController.text,
            ))
        .toList();

    final success = await storage.updateEmergencyContacts(
      userId: widget.user.id,
      pin: widget.user.pin,
      emergencyContacts: emergencyContacts,
    );

    setState(() {
      _isSaving = false;
      // Rester en mode édition pour garder les champs visibles
      _isEditingEmergency = true;
    });

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(success
              ? 'Contacts d\'urgence enregistrés'
              : 'Erreur lors de l\'enregistrement'),
          backgroundColor: success ? Colors.green : Colors.red,
        ),
      );
      if (success) {
        widget.onSave();
      }
    }
  }

  Future<void> _savePersonalInfo() async {
    setState(() => _isSavingPersonal = true);

    final storage = ref.read(storageServiceProvider);
    final success = await storage.updatePersonalInfo(
      userId: widget.user.id,
      pin: widget.user.pin,
      email1: _email1Controller.text,
      email2: _email2Controller.text,
      mobilePhone: _mobilePhoneController.text,
      homePhone: _homePhoneController.text,
      workPhone: _workPhoneController.text,
      address: _addressController.text,
    );

    setState(() => _isSavingPersonal = false);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(success
              ? 'Informations personnelles enregistrées'
              : 'Erreur lors de l\'enregistrement'),
          backgroundColor: success ? Colors.green : Colors.red,
        ),
      );
      if (success) {
        widget.onSave();
      }
    }
  }

  void _cancelEditing() {
    _initControllers();
    setState(() {
      _isEditingEmergency = true;
    });
  }

  String _valueOrDash(String? value) {
    return (value != null && value.isNotEmpty) ? value : '—';
  }

  @override
  Widget build(BuildContext context) {
    final user = widget.user;
    
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.blue.shade100),
      ),
      padding: const EdgeInsets.all(12),
      child: Column(
        children: [
          // Section Informations personnelles (éditable)
          Container(
            margin: const EdgeInsets.only(bottom: 10),
            decoration: BoxDecoration(
              color: Colors.yellow.shade50,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.amber.shade300),
            ),
            child: Column(
              children: [
                InkWell(
                  borderRadius: BorderRadius.circular(14),
                  onTap: () => widget.onToggleTile('personal'),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    child: Row(
                      children: [
                        Icon(Icons.perm_contact_calendar, color: Colors.blueGrey.shade700),
                        const SizedBox(width: 10),
                        const Expanded(
                          child: Text(
                            'Informations personnelles',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        Icon(
                          widget.expandedContactTiles.contains('personal')
                              ? Icons.keyboard_arrow_up
                              : Icons.keyboard_arrow_down,
                          color: Colors.blueGrey.shade700,
                        ),
                      ],
                    ),
                  ),
                ),
                if (widget.expandedContactTiles.contains('personal'))
                  Padding(
                    padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
                    child: Column(
                      children: [
                        _buildInfoRow(Icons.person, 'Nom complet', _valueOrDash(user.displayName)),
                        _buildEditableField(
                          icon: Icons.email,
                          label: 'E-mail principal',
                          controller: _email1Controller,
                          keyboardType: TextInputType.emailAddress,
                        ),
                        _buildEditableField(
                          icon: Icons.email_outlined,
                          label: 'E-mail secondaire',
                          controller: _email2Controller,
                          keyboardType: TextInputType.emailAddress,
                        ),
                        _buildEditableField(
                          icon: Icons.phone_android,
                          label: 'Téléphone mobile',
                          controller: _mobilePhoneController,
                          keyboardType: TextInputType.phone,
                        ),
                        _buildEditableField(
                          icon: Icons.phone,
                          label: 'Téléphone fixe',
                          controller: _homePhoneController,
                          keyboardType: TextInputType.phone,
                        ),
                        _buildEditableField(
                          icon: Icons.work,
                          label: 'Téléphone travail',
                          controller: _workPhoneController,
                          keyboardType: TextInputType.phone,
                        ),
                        _buildEditableField(
                          icon: Icons.location_on,
                          label: 'Adresse',
                          controller: _addressController,
                          keyboardType: TextInputType.streetAddress,
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            TextButton(
                              onPressed: _isSavingPersonal ? null : () {
                                _initControllers();
                                setState(() {});
                              },
                              child: const Text('Réinitialiser'),
                            ),
                            const SizedBox(width: 8),
                            ElevatedButton.icon(
                              onPressed: _isSavingPersonal ? null : _savePersonalInfo,
                              icon: _isSavingPersonal
                                  ? const SizedBox(
                                      height: 14,
                                      width: 14,
                                      child: CircularProgressIndicator(strokeWidth: 2),
                                    )
                                  : const Icon(Icons.save, size: 16),
                              label: Text(
                                _isSavingPersonal ? 'Enregistrement...' : 'Enregistrer',
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.green,
                                foregroundColor: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
          // Titre section contacts d'urgence avec bouton d'édition
          Padding(
            padding: const EdgeInsets.only(top: 8, bottom: 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Contacts d\'urgence',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.blueGrey.shade700,
                  ),
                ),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextButton.icon(
                      onPressed: _isSaving ? null : _cancelEditing,
                      icon: const Icon(Icons.close, size: 16),
                      label: const Text('Réinitialiser', style: TextStyle(fontSize: 12)),
                      style: TextButton.styleFrom(
                        foregroundColor: Colors.grey,
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                      ),
                    ),
                    const SizedBox(width: 4),
                    ElevatedButton.icon(
                      onPressed: _isSaving ? null : _saveEmergencyContacts,
                      icon: _isSaving
                          ? const SizedBox(
                              height: 14,
                              width: 14,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.save, size: 16),
                      label: Text(
                        _isSaving ? 'Enregistrement...' : 'Enregistrer',
                        style: const TextStyle(fontSize: 12),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Sections Contact d'urgence (éditables)
          ...List.generate(3, (index) {
            final id = 'emergency-${index + 1}';
            final ctrl = _emergencyControllers[index];
            final contact = index < user.emergency.contacts.length
                ? user.emergency.contacts[index]
                : null;
            return _buildEmergencyTile(
              id: id,
              title: 'Contact d\'urgence ${index + 1}',
              controllers: ctrl,
              existingContact: contact,
            );
          }),
        ],
      ),
    );
  }

  Widget _buildReadOnlyTile({
    required String id,
    required String title,
    required IconData icon,
    required Color backgroundColor,
    required Color borderColor,
    required Widget content,
  }) {
    final expanded = widget.expandedContactTiles.contains(id);
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        children: [
          InkWell(
            borderRadius: BorderRadius.circular(14),
            onTap: () => widget.onToggleTile(id),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              child: Row(
                children: [
                  Icon(icon, color: Colors.blueGrey.shade700),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  Icon(
                    expanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                    color: Colors.blueGrey.shade700,
                  ),
                ],
              ),
            ),
          ),
          if (expanded)
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
              child: content,
            ),
        ],
      ),
    );
  }

  Widget _buildEmergencyTile({
    required String id,
    required String title,
    required _EmergencyContactControllers controllers,
    EmergencyContact? existingContact,
  }) {
    final expanded = widget.expandedContactTiles.contains(id);
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.red.shade200),
      ),
      child: Column(
        children: [
          InkWell(
            borderRadius: BorderRadius.circular(14),
            onTap: () => widget.onToggleTile(id),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              child: Row(
                children: [
                  Icon(Icons.local_hospital_outlined, color: Colors.blueGrey.shade700),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  Icon(
                    expanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                    color: Colors.blueGrey.shade700,
                  ),
                ],
              ),
            ),
          ),
          if (expanded)
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
              child: _isEditingEmergency
                  ? Column(
                      children: [
                        _buildEditableField(
                          icon: Icons.person,
                          label: 'Nom',
                          controller: controllers.nameController,
                        ),
                        _buildEditableField(
                          icon: Icons.phone,
                          label: 'Téléphone',
                          controller: controllers.phoneController,
                          keyboardType: TextInputType.phone,
                        ),
                        _buildEditableField(
                          icon: Icons.family_restroom,
                          label: 'Lien (famille, ami...)',
                          controller: controllers.relationshipController,
                        ),
                        _buildEditableField(
                          icon: Icons.location_on,
                          label: 'Adresse',
                          controller: controllers.addressController,
                          keyboardType: TextInputType.streetAddress,
                        ),
                      ],
                    )
                  : Column(
                      children: [
                        _buildInfoRow(Icons.person, 'Nom', _valueOrDash(existingContact?.name)),
                        _buildInfoRow(Icons.phone, 'Téléphone', _valueOrDash(existingContact?.phone)),
                        _buildInfoRow(Icons.family_restroom, 'Lien', _valueOrDash(existingContact?.relationship)),
                        _buildInfoRow(Icons.location_on, 'Adresse', _valueOrDash(existingContact?.address)),
                      ],
                    ),
            ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, color: Colors.blue.shade600, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontWeight: FontWeight.w600,
              color: Colors.blueGrey.shade800,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEditableField({
    required IconData icon,
    required String label,
    required TextEditingController controller,
    TextInputType? keyboardType,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, color: Colors.blue.shade600, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: TextField(
              controller: controller,
              keyboardType: keyboardType,
              decoration: InputDecoration(
                labelText: label,
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                filled: true,
                fillColor: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmergencyContactControllers {
  final TextEditingController nameController;
  final TextEditingController phoneController;
  final TextEditingController relationshipController;
  final TextEditingController addressController;

  _EmergencyContactControllers({
    required this.nameController,
    required this.phoneController,
    required this.relationshipController,
    required this.addressController,
  });

  void dispose() {
    nameController.dispose();
    phoneController.dispose();
    relationshipController.dispose();
    addressController.dispose();
  }
}
