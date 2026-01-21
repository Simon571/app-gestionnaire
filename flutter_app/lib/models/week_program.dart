class WeekProgram {
  final DateTime weekStart;

  WeekProgram({required this.weekStart});

  String get formattedDate => '${weekStart.day.toString().padLeft(2, '0')}/${weekStart.month.toString().padLeft(2, '0')}/${weekStart.year}';
}
