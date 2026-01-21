import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../utils/helpers.dart';
import '../providers/public_witness_provider.dart';

/// Écran "Témoignage public" synchronisé avec le gestionnaire desktop.
class PublicWitnessPage extends ConsumerStatefulWidget {
  final DateTime referenceDate;

  const PublicWitnessPage({Key? key, required this.referenceDate}) : super(key: key);

  @override
  ConsumerState<PublicWitnessPage> createState() => _PublicWitnessPageState();
}

class _PublicWitnessPageState extends ConsumerState<PublicWitnessPage> {
  late final DateTime _weekStart;
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    _weekStart = widget.referenceDate.subtract(Duration(days: widget.referenceDate.weekday - 1));
    final now = DateTime.now();
    final weekEnd = _weekStart.add(const Duration(days: 7));
    if (!now.isBefore(_weekStart) && now.isBefore(weekEnd)) {
      _selectedIndex = now.weekday - 1;
    } else {
      _selectedIndex = widget.referenceDate.weekday - 1;
    }
  }

  @override
  Widget build(BuildContext context) {
    final weekLabel = AppDateUtils.formatWeekRange(_weekStart);
    final witnessDataAsync = ref.watch(publicWitnessProvider);

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.teal.shade700,
        title: const Text('Témoignage public'),
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
            _buildSelectedDayDetails(witnessDataAsync),
          ],
        ),
      ),
    );
  }

  Widget _buildDaySelector() {
    final days = List<DateTime>.generate(7, (i) => _weekStart.add(Duration(days: i)));
    final shortLabels = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];

    return Wrap(
      alignment: WrapAlignment.center,
      spacing: 8,
      runSpacing: 8,
      children: List.generate(days.length, (index) {
        final isSelected = index == _selectedIndex;
        
        // Vérifier si ce jour a des créneaux
        final daySlots = ref.watch(dayWitnessSlotsProvider(index));
        final hasSlots = daySlots.isNotEmpty;
        
        return Stack(
          children: [
            ChoiceChip(
              label: Text(shortLabels[index]),
              selected: isSelected,
              onSelected: (_) => setState(() => _selectedIndex = index),
              selectedColor: Colors.teal.shade700,
              labelStyle: TextStyle(color: isSelected ? Colors.white : Colors.black87),
            ),
            if (hasSlots)
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

  Widget _buildSelectedDayDetails(AsyncValue<PublicWitnessState> dataAsync) {
    final selectedDate = _weekStart.add(Duration(days: _selectedIndex));
    final daySlots = ref.watch(dayWitnessSlotsProvider(_selectedIndex));

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
            if (daySlots.isEmpty) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.all(16.0),
                  child: Text(
                    'Pas de témoignage public planifié pour ce jour.',
                    style: TextStyle(fontSize: 16, color: Colors.grey),
                    textAlign: TextAlign.center,
                  ),
                ),
              );
            }
            return Column(
              children: daySlots.map((slot) => _buildSlotCard(slot)).toList(),
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (_, __) => const Center(
            child: Text(
              'Erreur de chargement des données.',
              style: TextStyle(color: Colors.red),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSlotCard(PublicWitnessSlot slot) {
    return Card(
      elevation: 2,
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Lieu et période
            Row(
              children: [
                Icon(Icons.location_on, color: Colors.teal.shade700, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    slot.location ?? 'Lieu non spécifié',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                ),
                if (slot.period != null && slot.period!.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.teal.shade100,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      slot.period!,
                      style: TextStyle(color: Colors.teal.shade800, fontWeight: FontWeight.bold),
                    ),
                  ),
              ],
            ),
            
            // Heure
            if (slot.time != null && slot.time!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.access_time, color: Colors.grey, size: 18),
                  const SizedBox(width: 8),
                  Text(slot.time!, style: const TextStyle(fontSize: 14)),
                ],
              ),
            ],
            
            // Participants
            if (slot.publishers.isNotEmpty) ...[
              const SizedBox(height: 12),
              _lineLabel('Participants'),
              ...slot.publishers.map((p) => _lineName(p)).toList(),
            ],
            
            // Notes
            if (slot.notes != null && slot.notes!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                slot.notes!,
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
