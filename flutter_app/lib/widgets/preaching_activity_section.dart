import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/preaching_activity_provider.dart';

class PreachingActivitySection extends ConsumerWidget {
  final bool compact;
  const PreachingActivitySection({super.key, this.compact = false});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(preachingActivityProvider);
    final notifier = ref.read(preachingActivityProvider.notifier);

    if (state.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.error != null) {
      return Text(state.error!, style: const TextStyle(color: Colors.red));
    }

    final content = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _PreachingTotalsHeader(state: state),
        const SizedBox(height: 16),
        _PreachingCalendar(state: state, notifier: notifier),
        const SizedBox(height: 16),
        _PreachingCounters(state: state, notifier: notifier),
      ],
    );

    if (compact) return content;

    return Card(
      margin: EdgeInsets.zero,
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: content,
      ),
    );
  }
}

class _PreachingTotalsHeader extends StatelessWidget {
  final PreachingActivityState state;
  const _PreachingTotalsHeader({required this.state});

  static const List<String> _months = [
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

  @override
  Widget build(BuildContext context) {
    final label =
        '${_months[state.selectedMonth.month - 1]} ${state.selectedMonth.year}';
    final chips = [
      _TotalsColumn(
        title: 'heures',
        main: _formatClock(state.totalHours),
        secondary: '(${state.totalHours.toStringAsFixed(1)})',
      ),
      _TotalsColumn(
        title: 'Cours bibliques',
        main: state.totalBibleStudies.toString(),
      ),
      _TotalsColumn(
        title: 'Crédit',
        main: _formatClock(state.totalCredit),
        secondary: '(${state.totalCredit.toStringAsFixed(1)})',
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '$label Totaux',
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: chips,
        ),
        if (state.isSubmitted)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Row(
              children: const [
                Icon(Icons.verified, color: Colors.green, size: 18),
                SizedBox(width: 4),
                Text('Rapport envoyé', style: TextStyle(color: Colors.green)),
              ],
            ),
          ),
      ],
    );
  }

  static String _formatClock(double hours) {
    final minutes = (hours * 60).round();
    final h = (minutes ~/ 60).toString();
    final m = (minutes % 60).toString().padLeft(2, '0');
    return '$h:$m';
  }
}

class _TotalsColumn extends StatelessWidget {
  final String title;
  final String main;
  final String? secondary;
  const _TotalsColumn(
      {required this.title, required this.main, this.secondary});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(title, style: TextStyle(color: Colors.grey.shade700)),
          Text(
            main,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          if (secondary != null)
            Text(
              secondary!,
              style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
            ),
        ],
      ),
    );
  }
}

class _PreachingCalendar extends StatelessWidget {
  final PreachingActivityState state;
  final PreachingActivityNotifier notifier;
  const _PreachingCalendar({required this.state, required this.notifier});

  @override
  Widget build(BuildContext context) {
    final start =
        DateTime(state.selectedMonth.year, state.selectedMonth.month, 1);
    final daysInMonth = DateUtils.getDaysInMonth(start.year, start.month);
    final leadingEmpty = (start.weekday + 6) % 7; // Monday-first
    final totalCells = leadingEmpty + daysInMonth;
    final trailingEmpty = (totalCells % 7 == 0) ? 0 : 7 - (totalCells % 7);
    final cellCount = totalCells + trailingEmpty;

    final List<_CalendarCell> cells = [];
    for (int i = 0; i < cellCount; i++) {
      if (i < leadingEmpty || i >= leadingEmpty + daysInMonth) {
        cells.add(_CalendarCell.empty());
        continue;
      }
      final day = i - leadingEmpty + 1;
      final date = DateTime(start.year, start.month, day);
      final key = _dateKey(date);
      final hasEntry = state.activeDateKeys.contains(key);
      final isSelected = _isSameDate(date, state.selectedDate);
      cells.add(_CalendarCell(
          date: date, isSelected: isSelected, hasEntry: hasEntry));
    }

    return Column(
      children: [
        Row(
          children: [
            IconButton(
              icon: const Icon(Icons.chevron_left),
              onPressed: () => notifier.goToPreviousMonth(),
            ),
            Expanded(
              child: Center(
                child: Text(
                  '${_PreachingTotalsHeader._months[state.selectedMonth.month - 1]} ${state.selectedMonth.year}',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ),
            IconButton(
              icon: const Icon(Icons.chevron_right),
              onPressed: () => notifier.goToNextMonth(),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: const [
            _WeekdayLabel('lun.'),
            _WeekdayLabel('mar.'),
            _WeekdayLabel('mer.'),
            _WeekdayLabel('jeu.'),
            _WeekdayLabel('ven.'),
            _WeekdayLabel('sam.'),
            _WeekdayLabel('dim.'),
          ],
        ),
        const SizedBox(height: 4),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 7,
            mainAxisSpacing: 6,
            crossAxisSpacing: 6,
          ),
          itemCount: cells.length,
          itemBuilder: (context, index) {
            final cell = cells[index];
            if (!cell.isActive) {
              return const SizedBox.shrink();
            }
            return GestureDetector(
              onTap: () => notifier.selectDate(cell.date!),
              child: Container(
                decoration: BoxDecoration(
                  color: cell.isSelected
                      ? Colors.blue.shade600
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(10),
                  border: cell.isSelected
                      ? Border.all(color: Colors.blue.shade100, width: 1.5)
                      : null,
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    Text(
                      cell.date!.day.toString(),
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: cell.isSelected
                            ? Colors.white
                            : Colors.blueGrey.shade800,
                      ),
                    ),
                    if (cell.hasEntry)
                      Positioned(
                        bottom: 4,
                        child: Container(
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                            color: Colors.redAccent,
                            borderRadius: BorderRadius.circular(3),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  static bool _isSameDate(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;

  static String _dateKey(DateTime date) =>
      '${date.year.toString().padLeft(4, '0')}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
}

class _PreachingCounters extends StatelessWidget {
  final PreachingActivityState state;
  final PreachingActivityNotifier notifier;
  const _PreachingCounters({required this.state, required this.notifier});

  @override
  Widget build(BuildContext context) {
    final entry = state.entryForDate(state.selectedDate);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          _formatSelectedDate(state.selectedDate),
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
        ),
        const SizedBox(height: 12),
        _CounterCard(
          label: 'Heures',
          mainValue: _PreachingTotalsHeader._formatClock(entry.hours),
          secondaryValue: '(${entry.hours.toStringAsFixed(2)})',
          onIncrement: () => notifier.adjustHours(0.25),
          onDecrement: () => notifier.adjustHours(-0.25),
          onValueChanged: (value) => notifier.setHours(value),
        ),
        const SizedBox(height: 8),
        _CounterCard(
          label: 'Cours bibliques (CB)',
          mainValue: entry.bibleStudies.toString(),
          onIncrement: () => notifier.adjustBibleStudies(1),
          onDecrement: () => notifier.adjustBibleStudies(-1),
          onValueChanged: (value) => notifier.setBibleStudies(value.toInt()),
        ),
        const SizedBox(height: 8),
        _CounterCard(
          label: 'Crédit (Béthel, écoles, LDC, etc.)',
          mainValue: _PreachingTotalsHeader._formatClock(entry.credit),
          secondaryValue: '(${entry.credit.toStringAsFixed(2)})',
          onIncrement: () => notifier.adjustCredit(0.25),
          onDecrement: () => notifier.adjustCredit(-0.25),
          onValueChanged: (value) => notifier.setCredit(value),
        ),
      ],
    );
  }

  static String _formatSelectedDate(DateTime date) {
    const days = [
      'lundi',
      'mardi',
      'mercredi',
      'jeudi',
      'vendredi',
      'samedi',
      'dimanche'
    ];
    final label =
        '${days[(date.weekday + 6) % 7]} ${date.day} ${_PreachingTotalsHeader._months[date.month - 1]} ${date.year}';
    return label;
  }
}

class _CounterCard extends StatefulWidget {
  final String label;
  final String mainValue;
  final String? secondaryValue;
  final VoidCallback onIncrement;
  final VoidCallback onDecrement;
  final Function(double)? onValueChanged;

  const _CounterCard({
    required this.label,
    required this.mainValue,
    required this.onIncrement,
    required this.onDecrement,
    this.secondaryValue,
    this.onValueChanged,
  });

  @override
  State<_CounterCard> createState() => _CounterCardState();
}

class _CounterCardState extends State<_CounterCard> {
  bool _isEditing = false;
  final TextEditingController _controller = TextEditingController();
  final FocusNode _focusNode = FocusNode();

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _startEditing() {
    setState(() {
      _isEditing = true;
      // Extraire le nombre du mainValue
      final numericValue = widget.mainValue.replaceAll(RegExp(r'[^0-9.]'), '');
      _controller.text = numericValue;
    });
    // Focus automatique
    Future.delayed(const Duration(milliseconds: 100), () {
      _focusNode.requestFocus();
      _controller.selection = TextSelection(
        baseOffset: 0,
        extentOffset: _controller.text.length,
      );
    });
  }

  void _finishEditing() {
    if (_controller.text.isNotEmpty) {
      final value = double.tryParse(_controller.text) ?? 0.0;
      widget.onValueChanged?.call(value);
    }
    setState(() {
      _isEditing = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.blue.shade100),
        color: Colors.blue.shade50.withOpacity(0.3),
      ),
      child: Row(
        children: [
          Expanded(
            flex: 3,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.label,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 4),
                if (_isEditing)
                  SizedBox(
                    width: 100,
                    child: TextField(
                      controller: _controller,
                      focusNode: _focusNode,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.blue,
                      ),
                      decoration: const InputDecoration(
                        isDense: true,
                        contentPadding: EdgeInsets.symmetric(vertical: 4),
                        border: UnderlineInputBorder(),
                      ),
                      onSubmitted: (_) => _finishEditing(),
                      onEditingComplete: _finishEditing,
                    ),
                  )
                else
                  GestureDetector(
                    onTap: _startEditing,
                    child: Row(
                      children: [
                        Text(
                          widget.mainValue,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.blue,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Icon(Icons.edit, size: 16, color: Colors.grey.shade600),
                      ],
                    ),
                  ),
                if (widget.secondaryValue != null && !_isEditing)
                  Text(
                    widget.secondaryValue!,
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey.shade600,
                    ),
                  ),
              ],
            ),
          ),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: IconButton(
                  icon: const Icon(Icons.remove, color: Colors.red),
                  onPressed: widget.onDecrement,
                  iconSize: 24,
                  padding: const EdgeInsets.all(8),
                  constraints: const BoxConstraints(minWidth: 40, minHeight: 40),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                decoration: BoxDecoration(
                  color: Colors.green.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: IconButton(
                  icon: const Icon(Icons.add, color: Colors.green),
                  onPressed: widget.onIncrement,
                  iconSize: 24,
                  padding: const EdgeInsets.all(8),
                  constraints: const BoxConstraints(minWidth: 40, minHeight: 40),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CalendarCell {
  final DateTime? date;
  final bool isSelected;
  final bool hasEntry;
  final bool isActive;

  _CalendarCell(
      {required this.date, required this.isSelected, required this.hasEntry})
      : isActive = true;
  _CalendarCell.empty()
      : date = null,
        isSelected = false,
        hasEntry = false,
        isActive = false;
}

class _WeekdayLabel extends StatelessWidget {
  final String label;
  const _WeekdayLabel(this.label);

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Center(
        child: Text(
          label,
          style: TextStyle(
              color: Colors.grey.shade600, fontWeight: FontWeight.w600),
        ),
      ),
    );
  }
}
