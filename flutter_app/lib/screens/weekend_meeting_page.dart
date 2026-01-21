import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';
import '../providers/sync_provider.dart';
import '../providers/weekend_meeting_provider.dart';
import '../models/person.dart';
import '../services/sync_service.dart';

/// Écran "Réunion de week-end" (discours public) pour les proclamateurs.
/// Synchronisé avec les données du gestionnaire desktop.
class WeekendMeetingPage extends ConsumerStatefulWidget {
  final DateTime weekEndDate;

  const WeekendMeetingPage({Key? key, required this.weekEndDate}) : super(key: key);

  @override
  ConsumerState<WeekendMeetingPage> createState() => _WeekendMeetingPageState();
}

class _WeekendMeetingPageState extends ConsumerState<WeekendMeetingPage> {
  late final TextEditingController _attendanceInPersonController;
  late final TextEditingController _attendanceOnlineController;
  String? _statusMessage;

  Assembly? get _assembly => ref.watch(authStateProvider).assembly;

  String _formatDateLong(DateTime d) {
    const months = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
    ];
    const weekdays = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    final m = months[d.month - 1];
    final w = weekdays[d.weekday - 1];
    return '$w ${d.day} $m ${d.year}';
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

  @override
  void initState() {
    super.initState();
    _attendanceInPersonController = TextEditingController();
    _attendanceOnlineController = TextEditingController();
  }

  @override
  void dispose() {
    _attendanceInPersonController.dispose();
    _attendanceOnlineController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final dateLabel = _formatDateLong(widget.weekEndDate);
    final weekLabel = _getWeekLabel(widget.weekEndDate);
    
    final weekendDataAsync = ref.watch(weekendMeetingProvider);
    final servicesAsync = ref.watch(servicesProvider);
    
    final weekStart = widget.weekEndDate.subtract(Duration(days: widget.weekEndDate.weekday - 1));
    final participantNames = ref.watch(weekendParticipantNamesProvider(weekStart));

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue.shade700,
        title: const Text('Réunion de week-end'),
      ),
      body: Container(
        color: Colors.white,
        child: ListView(
          padding: const EdgeInsets.all(12),
          children: [
            Center(
              child: Text(
                dateLabel,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(height: 12),

            _sectionHeader('Discours public', color: Colors.blue.shade800),
            const SizedBox(height: 8),
            _buildDiscoursSection(weekendDataAsync, participantNames),

            const SizedBox(height: 14),
            _sectionHeader('Attributions du week-end', color: Colors.blue.shade800),
            const SizedBox(height: 8),
            _buildAttributionsSection(weekendDataAsync, participantNames),

            const SizedBox(height: 18),
            _sectionHeader('SERVICES', color: Colors.green.shade700),
            const SizedBox(height: 8),
            _buildServicesList(servicesAsync, weekLabel),

            const SizedBox(height: 18),
            _sectionHeader('Nettoyage de la salle du Royaume', color: const Color(0xFF1F7A8C)),
            const SizedBox(height: 8),
            _buildNettoyageSection(weekendDataAsync),

            const SizedBox(height: 18),
            _sectionHeader('Zoom', color: Colors.grey.shade800),
            const SizedBox(height: 8),
            _zoomBlock(),

            const SizedBox(height: 18),
            _sectionHeader('Assistance aux réunions', color: Colors.grey.shade800),
            const SizedBox(height: 8),
            _attendanceBlock(),
          ],
        ),
      ),
    );
  }

  Widget _buildDiscoursSection(AsyncValue<WeekendMeetingState> dataAsync, Map<String, String> names) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("Cantique d'introduction", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 8),

        _lineLabel('Thème de discours'),
        dataAsync.when(
          data: (state) {
            final weekStart = widget.weekEndDate.subtract(Duration(days: widget.weekEndDate.weekday - 1));
            final weekData = state.getWeekData(weekStart);
            final discoursNum = weekData?.discoursNumber ?? '';
            final discoursTheme = weekData?.discoursTheme ?? '';
            if (discoursNum.isEmpty && discoursTheme.isEmpty) {
              return _lineName('—');
            }
            // Afficher le numéro et le thème
            final displayText = discoursNum.isNotEmpty && discoursTheme.isNotEmpty
                ? 'n°$discoursNum - $discoursTheme'
                : (discoursNum.isNotEmpty ? 'n°$discoursNum' : discoursTheme);
            return _lineName(displayText);
          },
          loading: () => _lineName('Chargement...'),
          error: (_, __) => _lineName('—'),
        ),
        const SizedBox(height: 6),
        
        _lineLabel('Orateur'),
        _lineName(names['orateur'] ?? '—'),
        const SizedBox(height: 6),
        
        _lineLabel('Assemblée'),
        dataAsync.when(
          data: (state) {
            final weekStart = widget.weekEndDate.subtract(Duration(days: widget.weekEndDate.weekday - 1));
            final weekData = state.getWeekData(weekStart);
            return _lineName(weekData?.orateurAssemblee ?? '—');
          },
          loading: () => _lineName('—'),
          error: (_, __) => _lineName('—'),
        ),
      ],
    );
  }

  Widget _buildAttributionsSection(AsyncValue<WeekendMeetingState> dataAsync, Map<String, String> names) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _lineLabel('Président'),
        _lineName(names['president'] ?? '—'),
        const SizedBox(height: 4),
        
        _lineLabel('Lecteur Tour de Garde'),
        _lineName(names['lecteur'] ?? '—'),
        const SizedBox(height: 4),
        
        _lineLabel('Prière de fin'),
        _lineName(names['priere'] ?? '—'),
        const SizedBox(height: 4),
        
        _lineLabel('Orateur 2'),
        _lineName(names['orateur2'] ?? '—'),
      ],
    );
  }

  Widget _buildServicesList(AsyncValue<Map<String, Map<String, List<String>>>> servicesAsync, String weekLabel) {
    final services = [
      'Comptage_Assistance', 'Accueil à la porte', 'Sonorisation', 'Micros baladeur',
      'Micros Estrade', 'Sanitaire', 'Accueil dans la salle', 'Accueil à la grande porte',
    ];

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
                  Text(s.replaceAll('_', ' '), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
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

  Widget _buildNettoyageSection(AsyncValue<WeekendMeetingState> dataAsync) {
    return dataAsync.when(
      data: (state) {
        final weekStart = widget.weekEndDate.subtract(Duration(days: widget.weekEndDate.weekday - 1));
        final weekData = state.getWeekData(weekStart);
        return Text(weekData?.groupeNettoyage ?? '<Groupe n°?>', style: const TextStyle(fontSize: 16));
      },
      loading: () => const Text('Chargement...', style: TextStyle(fontSize: 16, color: Colors.grey)),
      error: (_, __) => const Text('<Groupe n°?>', style: TextStyle(fontSize: 16)),
    );
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
          'meetingType': 'weekend',
          'weekEndDate': widget.weekEndDate.toIso8601String(),
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

  Widget _sectionHeader(String text, {required Color color}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 6),
      color: color,
      child: Center(
        child: Text(
          text.toUpperCase(),
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
        ),
      ),
    );
  }

  Widget _lineLabel(String label) {
    return Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16));
  }

  Widget _lineName(String value) {
    return Padding(
      padding: const EdgeInsets.only(left: 16.0, top: 2.0),
      child: Text(value, style: const TextStyle(fontSize: 15, color: Colors.black87)),
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
        Padding(
          padding: const EdgeInsets.only(left: 16.0),
          child: Text(assembly?.zoomId ?? (hasData ? '' : 'Non renseigné')),
        ),
        const SizedBox(height: 8),
        const Text('Mot de passe', style: TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 2),
        Padding(
          padding: const EdgeInsets.only(left: 16.0),
          child: Text(assembly?.zoomPassword ?? (hasData ? '' : 'Non renseigné')),
        ),
        const SizedBox(height: 8),
        if (assembly?.zoomUrl != null && assembly!.zoomUrl!.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(left: 16.0),
            child: Text(assembly.zoomUrl!, style: const TextStyle(color: Colors.blue)),
          )
        else
          const Padding(
            padding: EdgeInsets.only(left: 16.0),
            child: Text('Lien Zoom non renseigné', style: TextStyle(color: Colors.grey)),
          ),
      ],
    );
  }

  Widget _attendanceBlock() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: const [
            Expanded(child: Text('En présentiel', style: TextStyle(fontWeight: FontWeight.bold))),
            SizedBox(width: 12),
            Expanded(child: Text('En visioconférence', style: TextStyle(fontWeight: FontWeight.bold))),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _attendanceInPersonController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Nombre', border: OutlineInputBorder()),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: TextField(
                controller: _attendanceOnlineController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Nombre', border: OutlineInputBorder()),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(onPressed: _submitAttendance, child: const Text('Envoyer')),
        ),
        if (_statusMessage != null) ...[
          const SizedBox(height: 8),
          Text(_statusMessage!, style: const TextStyle(color: Colors.green)),
        ],
      ],
    );
  }
}
