import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/person.dart';
import '../models/vcm_models.dart';
import '../providers/auth_provider.dart';
import '../providers/sync_provider.dart';
import '../providers/vcm_assignments_provider.dart';
import '../providers/weekend_meeting_provider.dart';
import '../services/sync_service.dart';

/// Écran détaillé "Réunion de semaine" pour les proclamateurs.
class VcmPage extends ConsumerStatefulWidget {
  final DateTime weekStart;
  final VcmWeek? vcmWeek;

  const VcmPage({Key? key, required this.weekStart, this.vcmWeek}) : super(key: key);

  @override
  ConsumerState<VcmPage> createState() => _VcmPageState();
}

class _VcmPageState extends ConsumerState<VcmPage> with SingleTickerProviderStateMixin {
  late TabController _tabController;
      Future<Map<String, dynamic>?> _getAssistanceForWeek(DateTime weekStart) async {
        final storage = ref.read(syncServiceProvider).storageService;
        final assistance = await storage.getGenericData('assistance');
        if (assistance == null) return null;
        // Filtrer par semaine
        final weekIso = weekStart.toIso8601String().substring(0, 10);
        if (assistance['weekStart']?.toString().startsWith(weekIso) == true) {
          return assistance;
        }
        return null;
      }
    /// Formate le rôle pour un affichage lisible
    String _formatRole(String role) {
      final parts = role.split('_');
      final formatted = parts.map((p) {
        if (p.isEmpty) return '';
        return p[0].toUpperCase() + p.substring(1);
      }).join(' ');
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
  late final TextEditingController _attendanceInPersonController;
  late final TextEditingController _attendanceOnlineController;
  String? _statusMessage;

  Assembly? get _assembly => ref.watch(authStateProvider).assembly;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _attendanceInPersonController = TextEditingController();
    _attendanceOnlineController = TextEditingController();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _attendanceInPersonController.dispose();
    _attendanceOnlineController.dispose();
    super.dispose();
  }

  String _formatDate(DateTime d) => '${d.day.toString().padLeft(2, "0")} ${_monthFr(d.month)} ${d.year}';

  String _monthFr(int m) {
    const months = [
      'janvier',
      'février',
      'mars',
      'avril',
      'mai',
      'juin',
      'juillet',
      'août',
      'septembre',
      'octobre',
      'novembre',
      'décembre',
    ];
    return months[m - 1];
  }

  void _submitAttendance() async {
    final inPerson = int.tryParse(_attendanceInPersonController.text.trim());
    final online = int.tryParse(_attendanceOnlineController.text.trim());

    if (inPerson == null || online == null) {
      setState(() => _statusMessage = 'Veuillez saisir des nombres valides.');
      return;
    }

    setState(() => _statusMessage = 'Envoi en cours...');

    try {
      final syncService = ref.read(syncServiceProvider);
      final authState = ref.read(authStateProvider);
      
      final success = await syncService.sendJobToBackend(
        type: SyncJobType.assistance,
        payload: {
          'meetingType': 'vcm',
          'weekStart': widget.weekStart.toIso8601String(),
          'date': DateTime.now().toIso8601String(),
          'inPerson': inPerson,
          'online': online,
          'total': inPerson + online,
        },
        initiator: authState.user?.displayName ?? 'Mobile App',
        notify: true,
      );

      if (success) {
        setState(() => _statusMessage = 'Assistance enregistrée (présentiel: $inPerson, visio: $online).');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Assistance envoyée aux administrateurs.'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else {
        setState(() => _statusMessage = 'Erreur lors de l\'envoi. Veuillez réessayer.');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Erreur lors de l\'envoi. Veuillez réessayer.'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      setState(() => _statusMessage = 'Erreur: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final pretty = _formatDate(widget.weekStart);
    final participants = ref.watch(weekParticipantsProvider(widget.weekStart));
    final meetingType = ref.watch(vcmAssignmentsProvider).when(
          data: (s) => s.getWeekAssignments(widget.weekStart)?.meetingType,
          loading: () => null,
          error: (_, __) => null,
        );
    final showChips = (meetingType ?? '').toLowerCase().contains('vie_chretienne') ? false : true;
    // DEBUG: Afficher les participants récupérés
    debugPrint('VCM participants for week ${widget.weekStart}: count=${participants.length}');
    for (final p in participants) {
      debugPrint('Participant: ${p.personName} (${p.personId}) - ${p.role}');
    }

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.red.shade700,
        title: const Text('Réunion de semaine'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Salle principale'),
            Tab(text: 'Salle secondaire'),
          ],
          indicatorColor: Colors.white,
          labelColor: Colors.white,
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Onglet 1: Programme
          Container(
            color: Colors.white,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                children: [
                  const SizedBox(height: 12),
                  Center(
                    child: Column(
                      children: [
                        Text(
                          pretty,
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        if (widget.vcmWeek != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 4.0),
                            child: Text(
                              widget.vcmWeek!.weekTitle,
                              style: const TextStyle(fontSize: 14, color: Colors.grey),
                            ),
                          ),
                        if (participants.isNotEmpty && showChips)
                          Padding(
                            padding: const EdgeInsets.only(top: 8.0, bottom: 4.0),
                            child: Wrap(
                              spacing: 8,
                              runSpacing: 4,
                              children: participants
                                  .map((p) => Chip(
                                        label: Text('${p.personName} • ${_formatRole(p.role)}'),
                                        backgroundColor: Colors.green.shade50,
                                        labelStyle: const TextStyle(fontSize: 13, color: Colors.green),
                                      ))
                                  .toList(),
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Expanded(child: _buildTabContent(isSecondary: false)),
                ],
              ),
            ),
          ),
          // Onglet 2: Services
          Container(
            color: Colors.white,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                children: [
                  const SizedBox(height: 12),
                  Center(
                    child: Text(
                      pretty,
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Expanded(child: _buildTabContent(isSecondary: true)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _getSectionColor(String sectionKey) {
    switch (sectionKey) {
      case 'joyaux':
        return Colors.teal.shade700;
      case 'ministere':
        return Colors.orange.shade700;
      case 'vie_chretienne':
        return Colors.red.shade700;
      default:
        return Colors.blue.shade700;
    }
  }

  Widget _sectionHeader(String text, {required Color color}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 6),
      color: color,
      child: Center(
        child: Text(
          text.toUpperCase(),
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
      ),
    );
  }

  Widget _lineTitle(String title, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          if (value.isNotEmpty)
            Text(
              value,
              style: const TextStyle(color: Colors.grey, fontSize: 14),
            ),
        ],
      ),
    );
  }

  Widget _numberedItem(String title, String duration) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          Text(
            duration,
            style: const TextStyle(color: Colors.grey, fontSize: 14),
          ),
        ],
      ),
    );
  }

  Widget _servicesList() {
    final services = [
      'Comptage_Assistance',
      'Accueil à la porte',
      'Sonorisation',
      'Micros baladeur',
      'Micros Estrade',
      'Sanitaire',
      'Accueil dans la salle',
      'Accueil à la grande porte',
    ];
    
    final weekLabel = _getWeekLabel(widget.weekStart);
    final servicesAsync = ref.watch(servicesProvider);

    return servicesAsync.when(
      data: (servicesData) {
        Map<String, List<String>>? weekServices;
        for (final entry in servicesData.entries) {
          if (weekLabel.contains(entry.key) || entry.key.contains(weekLabel.split('–')[0].trim())) {
            weekServices = entry.value;
            break;
          }
        }
        weekServices ??= servicesData.values.isNotEmpty ? servicesData.values.first : null;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: services.map((s) {
            final names = weekServices?[s] ?? [];
            return Padding(
              padding: const EdgeInsets.only(bottom: 6.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    s.replaceAll('_', ' '),
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const SizedBox(height: 2),
                  if (names.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(left: 16.0),
                      child: Text(names.join(', '), style: const TextStyle(fontSize: 15, color: Colors.black87)),
                    )
                  else
                    const Padding(
                      padding: EdgeInsets.only(left: 16.0),
                      child: Text('—', style: TextStyle(fontSize: 15, color: Colors.grey)),
                    ),
                ],
              ),
            );
          }).toList(),
        );
      },
      loading: () => _buildServicesLoading(services),
      error: (_, __) => _buildServicesLoading(services),
    );
  }
  
  String _getWeekLabel(DateTime d) {
    // Utilise les noms complets des mois pour correspondre au format du fichier services.json
    const months = [
      'janvier',
      'février',
      'mars',
      'avril',
      'mai',
      'juin',
      'juillet',
      'août',
      'septembre',
      'octobre',
      'novembre',
      'décembre',
    ];

    final monday = d.subtract(Duration(days: d.weekday - 1));
    final sunday = monday.add(const Duration(days: 6));
    
    if (monday.month == sunday.month) {
      return '${months[monday.month - 1]} ${monday.day.toString().padLeft(2, '0')}–${sunday.day.toString().padLeft(2, '0')}';
    } else {
      return '${months[monday.month - 1]} ${monday.day.toString().padLeft(2, '0')}–${months[sunday.month - 1]} ${sunday.day.toString().padLeft(2, '0')}';
    }
  }
  
  Widget _buildServicesLoading(List<String> services) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: services.map((s) => Padding(
        padding: const EdgeInsets.only(bottom: 6.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(s.replaceAll('_', ' '), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 2),
            const Padding(
              padding: EdgeInsets.only(left: 16.0),
              child: Text('—', style: TextStyle(fontSize: 15, color: Colors.grey)),
            ),
          ],
        ),
      )).toList(),
    );
  }

  Widget _zoomBlock() {
    final assembly = _assembly;
    final hasData = (assembly?.zoomId?.isNotEmpty ?? false) ||
        (assembly?.zoomPassword?.isNotEmpty ?? false) ||
        (assembly?.zoomUrl?.isNotEmpty ?? false);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('ID de la réunion', style: TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 2),
        Text(assembly?.zoomId ?? (hasData ? '' : 'Non renseigné')),
        const SizedBox(height: 8),
        const Text('Mot de passe', style: TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 2),
        Text(assembly?.zoomPassword ?? (hasData ? '' : 'Non renseigné')),
        const SizedBox(height: 8),
        if (assembly?.zoomUrl != null && assembly!.zoomUrl!.isNotEmpty)
          Text(assembly.zoomUrl!, style: const TextStyle(color: Colors.blue))
        else
          const Text('Lien Zoom non renseigné', style: TextStyle(color: Colors.grey)),
      ],
    );
  }

  Widget _attendanceBlock() {
    return FutureBuilder<Map<String, dynamic>?>(
      future: _getAssistanceForWeek(widget.weekStart),
      builder: (context, snapshot) {
        final assistance = snapshot.data;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: const [
                Expanded(
                  child: Text('En présentiel', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
                SizedBox(width: 12),
                Expanded(
                  child: Text('En visioconférence', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _attendanceInPersonController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Nombre',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextField(
                    controller: _attendanceOnlineController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Nombre',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (assistance != null) ...[
              Text('Assistance synchronisée pour cette semaine :', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blue)),
              Text('Présentiel : ${assistance['inPerson'] ?? '-'}'),
              Text('Visio : ${assistance['online'] ?? '-'}'),
              Text('Total : ${assistance['total'] ?? '-'}'),
              const SizedBox(height: 8),
            ],
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _submitAttendance,
                child: const Text('Envoyer'),
              ),
            ),
            if (_statusMessage != null) ...[
              const SizedBox(height: 8),
              Text(
                _statusMessage!,
                style: const TextStyle(color: Colors.green),
              ),
            ],
          ],
        );
      },
    );
  }

  Widget _buildTabContent({required bool isSecondary}) {
    final vcmWeek = widget.vcmWeek;
    if (vcmWeek == null) {
      return const Center(child: Text('Programme détaillé indisponible pour cette semaine.'));
    }

    // Salle secondaire: on affiche uniquement le programme, avec les rôles de la 2e salle.
    if (isSecondary) {
      return ListView(
        padding: const EdgeInsets.all(12),
        children: [
          _buildDynamicSections(
            vcmWeek,
            isSecondary: true,
            meetingType: ref.watch(vcmAssignmentsProvider).when(
              data: (s) => s.getWeekAssignments(widget.weekStart)?.meetingType,
              loading: () => null,
              error: (_, __) => null,
            ),
          ),
        ],
      );
    }

    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        // Pass meetingType from assignments provider to allow custom ordering for some weeks
        _buildDynamicSections(vcmWeek,
            isSecondary: isSecondary,
            meetingType: ref.watch(vcmAssignmentsProvider).when(
            data: (s) => s.getWeekAssignments(widget.weekStart)?.meetingType,
            loading: () => null,
            error: (_, __) => null,
          )),
        const SizedBox(height: 8),
        _sectionHeader('SERVICES', color: Colors.green.shade700),
        const SizedBox(height: 8),
        _servicesList(),
        const SizedBox(height: 18),
        _sectionHeader('Nettoyage de la salle du Royaume', color: const Color(0xFF1F7A8C)),
        const SizedBox(height: 8),
        const Text('<Groupe n°?>', style: TextStyle(fontSize: 16)),
        const SizedBox(height: 18),
        _sectionHeader('Zoom', color: Colors.grey.shade800),
        const SizedBox(height: 8),
        _zoomBlock(),
        const SizedBox(height: 18),
        _sectionHeader('Assistance aux réunions', color: Colors.grey.shade800),
        const SizedBox(height: 8),
        _attendanceBlock(),
      ],
    );
  }

  Widget _buildDynamicSections(VcmWeek week, {required bool isSecondary, String? meetingType}) {
    // Récupérer les participants synchronisés pour la semaine
    final participants = ref.watch(weekParticipantsProvider(widget.weekStart));

    // Les rôles dans les données d'assignations sont généralement préfixés par "hall1:".
    // Pour la salle secondaire, on utilise "hall2:" quand les données existent.
    final hallPrefix = isSecondary ? 'hall2:' : 'hall1:';

    String hallRole(String roleWithoutHallPrefix) => '$hallPrefix$roleWithoutHallPrefix';

    String? getNameForRole(String roleKey) {
      for (final p in participants) {
        if (p.role == roleKey) {
          final name = p.personName.trim();
          return name.isEmpty ? null : name;
        }
      }
      return null;
    }

    final joyaux = week.sections.firstWhere(
      (s) => s.key == 'joyaux',
      orElse: () => VcmSection(key: 'joyaux', title: 'Joyaux de la Parole de Dieu', items: const []),
    );
    final ministere = week.sections.firstWhere(
      (s) => s.key == 'ministre' || s.key == 'ministere',
      orElse: () => VcmSection(key: 'ministere', title: 'Applique-toi au ministère', items: const []),
    );
    final vieChr = week.sections.firstWhere(
      (s) => s.key == 'vie_chretienne',
      orElse: () => VcmSection(key: 'vie_chretienne', title: 'Vie chrétienne', items: const []),
    );
    final cantiques = week.sections.firstWhere(
      (s) => s.key == 'cantiques',
      orElse: () => VcmSection(key: 'cantiques', title: 'Cantiques', items: const []),
    );

    VcmItem? cantiqueOuverture;
    VcmItem? cantiqueIntermediaire;
    VcmItem? cantiqueConclusion;
    for (final item in cantiques.items) {
      final t = (item.title + ' ' + (item.theme ?? '')).toLowerCase();
      if (cantiqueOuverture == null && t.contains('ouverture')) {
        cantiqueOuverture = item;
      } else if (cantiqueIntermediaire == null && (t.contains('intermédiaire') || t.contains('intermediaire'))) {
        cantiqueIntermediaire = item;
      } else if (cantiqueConclusion == null && t.contains('conclusion')) {
        cantiqueConclusion = item;
      }
    }

    VcmItem? lectureItem;
    for (final item in joyaux.items) {
      final t = (item.title + ' ' + (item.theme ?? '')).toLowerCase();
      if (t.contains('lecture')) {
        lectureItem = item;
        break;
      }
    }

    // En salle principale, les numéros commencent à 1.
    // En salle secondaire, on affiche uniquement la partie à partir de la "Lecture de la Bible" (n°3).
    int numero = isSecondary ? 3 : 1;

    final isVieChretienneMeeting = (meetingType ?? '').toLowerCase().contains('vie_chretienne');

    final children = <Widget>[];

    // --- SALLE SECONDAIRE ---
    // Affichage minimal demandé:
    // Conseiller/Assistance (entêtes) + 3. Lecture de la Bible + bloc "Applique-toi au ministère".
    if (isSecondary) {
      children.addAll([
        Row(
          children: const [
            Expanded(
              child: Text(
                'Conseiller :',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
              ),
            ),
            Expanded(
              child: Text(
                'Assistance :',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
      ]);

      // 3. Lecture de la Bible (salle secondaire)
      children.add(_numberedItem('${numero++}. Lecture de la Bible', ''));
      final bibleReadingName = getNameForRole(hallRole('bible_reading'));
      if (bibleReadingName != null) {
        children.add(Padding(
          padding: const EdgeInsets.only(left: 16.0, top: 2.0),
          child: Text(bibleReadingName, style: const TextStyle(fontSize: 15, color: Colors.black87)),
        ));
      }
      children.add(const SizedBox(height: 12));

      // 4+ Applique-toi au ministère (salle secondaire)
      children.add(_sectionHeader(ministere.title, color: const Color(0xFFE49B0F)));
      children.add(const SizedBox(height: 8));
      for (final entry in ministere.items.asMap().entries) {
        final item = entry.value;
        final studentKey = hallRole('ministry_${entry.key}_student');
        final assistantKey = hallRole('ministry_${entry.key}_assistant');
        final student = getNameForRole(studentKey);
        final assistant = getNameForRole(assistantKey);

        children.add(_numberedItem(
          '${numero++}. ${item.title}',
          item.duration != null ? '(${item.duration} min)' : '',
        ));

        if (student != null || assistant != null) {
          String namesLine = '';
          if (student != null) namesLine += student;
          if (assistant != null) namesLine += ' / $assistant';
          children.add(Padding(
            padding: const EdgeInsets.only(left: 16.0, top: 2.0),
            child: Text(namesLine, style: const TextStyle(fontSize: 15, color: Colors.black87)),
          ));
        }
      }

      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children,
      );
    }

    if (cantiqueOuverture != null) {
      children.addAll([
        _lineTitle('Cantique d\'ouverture', cantiqueOuverture.theme ?? ''),
        const SizedBox(height: 8),
        _lineTitle('Président', getNameForRole(hallRole('treasures_president')) ?? ''),
        const SizedBox(height: 4),
        _lineTitle('Prière d\'ouverture', getNameForRole(hallRole('treasures_opening_prayer')) ?? ''),
        const SizedBox(height: 12),
      ]);
    }

    // Joyaux items
    if (joyaux.items.isNotEmpty) {
      children.addAll([
        _sectionHeader(joyaux.title, color: _getSectionColor('joyaux')),
        const SizedBox(height: 8),
      ]);
    }
    if (joyaux.items.isNotEmpty) {
      children.add(
        _numberedItem(
          '${numero++}. ${joyaux.items.first.title}' + (joyaux.items.first.theme != null ? ' : ' + joyaux.items.first.theme! : ''),
          joyaux.items.first.duration != null ? '(${joyaux.items.first.duration} min)' : '',
        ),
      );
      final discoursName = getNameForRole(hallRole('treasures_discourse'));
      if (discoursName != null) {
        children.add(Padding(
          padding: const EdgeInsets.only(left: 16.0, top: 2.0),
          child: Text(discoursName, style: const TextStyle(fontSize: 15, color: Colors.black87)),
        ));
      }
    }
    if (joyaux.items.length > 1) {
      children.add(const SizedBox(height: 8));
      children.add(
        _numberedItem(
          '${numero++}. ${joyaux.items[1].title}' + (joyaux.items[1].theme != null ? ' : ' + joyaux.items[1].theme! : ''),
          joyaux.items[1].duration != null ? '(${joyaux.items[1].duration} min)' : '',
        ),
      );
      final gemsName = getNameForRole(hallRole('treasures_gems'));
      if (gemsName != null) {
        children.add(Padding(
          padding: const EdgeInsets.only(left: 16.0, top: 2.0),
          child: Text(gemsName, style: const TextStyle(fontSize: 15, color: Colors.black87)),
        ));
      }
    }
    children.add(const SizedBox(height: 12));
    // NOTE: le bloc Conseiller/Assistance est géré dans la branche salle secondaire plus haut.

    final lectureTitle = lectureItem != null
        ? ('${lectureItem!.title}' + (lectureItem!.theme != null ? ' : ${lectureItem!.theme!}' : ''))
        : 'Lecture de la Bible';
    final lectureDuration = lectureItem?.duration != null ? '(${lectureItem!.duration} min)' : '';
    children.add(_numberedItem('${numero++}. $lectureTitle', lectureDuration));
    final bibleReadingName = getNameForRole(hallRole('bible_reading'));
    if (bibleReadingName != null) {
      children.add(Padding(
        padding: const EdgeInsets.only(left: 16.0, top: 2.0),
        child: Text(bibleReadingName, style: const TextStyle(fontSize: 15, color: Colors.black87)),
      ));
    }
    children.add(const SizedBox(height: 12));

    // Build ministere / vie_chretienne ordering depending on meetingType
    void addMinistere() {
      children.add(_sectionHeader(ministere.title, color: const Color(0xFFE49B0F)));
      children.add(const SizedBox(height: 8));
      for (final entry in ministere.items.asMap().entries) {
        final item = entry.value;
        final studentKey = 'hall1:ministry_${entry.key}_student';
        final assistantKey = 'hall1:ministry_${entry.key}_assistant';
        final student = getNameForRole(studentKey);
        final assistant = getNameForRole(assistantKey);
        children.add(_numberedItem(
          '${numero++}. ${item.title}',
          item.duration != null ? '(${item.duration} min)' : '',
        ));
        if (student != null || assistant != null) {
          String namesLine = '';
          if (student != null) namesLine += student;
          if (assistant != null) namesLine += ' / $assistant';
          children.add(Padding(
            padding: const EdgeInsets.only(left: 16.0, top: 2.0),
            child: Text(namesLine, style: const TextStyle(fontSize: 15, color: Colors.black87)),
          ));
        }
      }
      children.add(const SizedBox(height: 12));
    }

    void addVieChretienne() {
      children.add(_sectionHeader(vieChr.title, color: Colors.red.shade700));
      children.add(const SizedBox(height: 8));
      if (cantiqueIntermediaire != null) {
        children.add(_lineTitle('Cantique', cantiqueIntermediaire.theme ?? ''));
        children.add(const SizedBox(height: 8));
      }
      for (final entry in vieChr.items.asMap().entries) {
        final item = entry.value;
        children.add(
          _numberedItem(
            '${numero++}. ${item.title}',
            item.duration != null ? '(${item.duration} min)' : '',
          ),
        );
        final roleKey = hallRole('life_${entry.key}_participant');
        final name = getNameForRole(roleKey);
        if (name != null) {
          children.add(Padding(
            padding: const EdgeInsets.only(left: 16.0, top: 2.0),
            child: Text(name, style: const TextStyle(fontSize: 15, color: Colors.black87)),
          ));
        }
        children.add(const SizedBox(height: 8));
      }
    }

    // Toujours afficher ministère avant vie chrétienne
    addMinistere();
    addVieChretienne();
    children.add(const SizedBox(height: 12));

    if (cantiqueConclusion != null) {
      children.addAll([
        const SizedBox(height: 12),
        _lineTitle('Cantique de conclusion', cantiqueConclusion.theme ?? ''),
        const SizedBox(height: 4),
        _lineTitle('Prière finale', getNameForRole('closing_prayer') ?? ''),
      ]);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: children,
    );


  // Fin de _buildDynamicSections
  }

  // Fin de la classe _VcmPageState
  }

