class PreachingEntry {
  final double hours;
  final int bibleStudies;
  final double credit;

  const PreachingEntry({
    this.hours = 0,
    this.bibleStudies = 0,
    this.credit = 0,
  });

  PreachingEntry copyWith({
    double? hours,
    int? bibleStudies,
    double? credit,
  }) {
    return PreachingEntry(
      hours: hours ?? this.hours,
      bibleStudies: bibleStudies ?? this.bibleStudies,
      credit: credit ?? this.credit,
    );
  }

  Map<String, dynamic> toJson() => {
        'hours': hours,
        'bibleStudies': bibleStudies,
        'credit': credit,
      };

  factory PreachingEntry.fromJson(Map<String, dynamic> json) {
    return PreachingEntry(
      hours: (json['hours'] as num?)?.toDouble() ?? 0,
      bibleStudies: (json['bibleStudies'] as num?)?.toInt() ?? 0,
      credit: (json['credit'] as num?)?.toDouble() ?? 0,
    );
  }

  bool get hasData => hours > 0 || bibleStudies > 0 || credit > 0;
}
