import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../utils/helpers.dart';
import '../providers/preaching_meeting_provider.dart';

/// Écran "Réunion pour la prédication".
/// Synchronisé avec les données du gestionnaire desktop.
class PreachingMeetingPage extends ConsumerStatefulWidget {
  final DateTime meetingDate;

  const PreachingMeetingPage({Key? key, required this.meetingDate}) : super(key: key);

  @override
  ConsumerState<PreachingMeetingPage> createState() => _PreachingMeetingPageState();
}

class _PreachingMeetingPageState extends ConsumerState<PreachingMeetingPage> {
  late final DateTime _weekStart;
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    _weekStart = widget.meetingDate.subtract(Duration(days: widget.meetingDate.weekday - 1));
    final now = DateTime.now();
    final weekEnd = _weekStart.add(const Duration(days: 7));
    if (!now.isBefore(_weekStart) && now.isBefore(weekEnd)) {
      _selectedIndex = now.weekday - 1;
    } else {
      _selectedIndex = widget.meetingDate.weekday - 1;
    }
  }

  @override
  Widget build(BuildContext context) {
    final weekLabel = AppDateUtils.formatWeekRange(_weekStart);
    final preachingDataAsync = ref.watch(preachingMeetingProvider);

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.orange.shade700,
        title: const Text('Réunion pour la prédication'),
      ),
      body: Container(
        color: Colors.white,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Center(
              child: Text(
                weekLabel,
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(height: 12),
            _buildDaySelector(),
            const SizedBox(height: 16),
            _buildSelectedDayDetails(preachingDataAsync),
          ],
        ),
      ),
    );
  }

  Widget _buildDaySelector() {
    final days = List<DateTime>.generate(7, (i) => _weekStart.add(Duration(days: i)));
    return Wrap(
      alignment: WrapAlignment.center,
      spacing: 8,
      runSpacing: 8,
      children: List.generate(days.length, (index) {
        final date = days[index];
        final shortLabel = DateFormat('EEE', 'fr_FR').format(date);
        final isSelected = index == _selectedIndex;
        
        // Vérifier si ce jour a des réunions
        final dayMeetings = ref.watch(dayPreachingMeetingsProvider(date));
        final hasMeetings = dayMeetings.isNotEmpty;
        
        return Stack(
          children: [
            ChoiceChip(
              label: Text(shortLabel.toLowerCase()),
              selected: isSelected,
              onSelected: (_) => setState(() => _selectedIndex = index),
              selectedColor: Colors.orange.shade700,
              labelStyle: TextStyle(color: isSelected ? Colors.white : Colors.black87),
            ),
            if (hasMeetings)
              Positioned(
                right: 0,
                top: 0,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: Colors.green,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
          ],
        );
      }),
    );
  }

  Widget _buildSelectedDayDetails(AsyncValue<PreachingMeetingState> dataAsync) {
    final selectedDate = _weekStart.add(Duration(days: _selectedIndex));
    final dayMeetings = ref.watch(dayPreachingMeetingsProvider(selectedDate));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Center(
          child: Text(
            AppDateUtils.formatDateFr(selectedDate),
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
        ),
        const SizedBox(height: 12),
        
        dataAsync.when(
          data: (state) {
            if (dayMeetings.isEmpty) {
              return _buildNoMeetingCard();
            }
            return Column(
              children: dayMeetings.map((meeting) => _buildMeetingCard(meeting)).toList(),
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (_, __) => _buildNoMeetingCard(),
        ),
      ],
    );
  }

  Widget _buildNoMeetingCard() {
    return Column(
      children: [
        const Text(
          'Pas de réunion pour la prédication',
          style: TextStyle(fontSize: 16, color: Colors.grey),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 12),
        Card(
          elevation: 1,
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text('Programme à venir', style: TextStyle(fontWeight: FontWeight.bold)),
                SizedBox(height: 6),
                Text(
                  'Les détails seront synchronisés automatiquement depuis le gestionnaire desktop.',
                  style: TextStyle(color: Colors.grey),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMeetingCard(PreachingMeetingData meeting) {
    return Card(
      elevation: 2,
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Lieu et heure
            Row(
              children: [
                Icon(Icons.location_on, color: Colors.orange.shade700, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    meeting.location ?? 'Lieu non spécifié',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                ),
                if (meeting.time != null && meeting.time!.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.orange.shade100,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      meeting.time!,
                      style: TextStyle(color: Colors.orange.shade800, fontWeight: FontWeight.bold),
                    ),
                  ),
              ],
            ),
            
            // Conducteur
            if (meeting.conductor != null && meeting.conductor!.isNotEmpty) ...[
              const SizedBox(height: 12),
              _lineLabel('Conducteur'),
              _lineName(meeting.conductor!),
            ],
            
            // Thème
            if (meeting.theme != null && meeting.theme!.isNotEmpty) ...[
              const SizedBox(height: 8),
              _lineLabel('Thème'),
              _lineName(meeting.theme!),
            ],
            
            // Participants
            if (meeting.participants.isNotEmpty) ...[
              const SizedBox(height: 12),
              _lineLabel('Participants'),
              ...meeting.participants.map((p) => _lineName(p)).toList(),
            ],
            
            // Notes
            if (meeting.notes != null && meeting.notes!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                meeting.notes!,
                style: const TextStyle(fontSize: 13, fontStyle: FontStyle.italic, color: Colors.grey),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _lineLabel(String label) {
    return Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15));
  }

  Widget _lineName(String value) {
    return Padding(
      padding: const EdgeInsets.only(left: 16.0, top: 2.0),
      child: Text(value, style: const TextStyle(fontSize: 15, color: Colors.black87)),
    );
  }
}
