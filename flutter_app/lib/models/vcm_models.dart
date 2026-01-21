class VcmItem {
  final String type;
  final String title;
  final String? theme;
  final int? duration;
  final int? songNumber;
  final String? scriptures;
  final List<String>? notes;

  VcmItem({
    required this.type,
    required this.title,
    this.theme,
    this.duration,
    this.songNumber,
    this.scriptures,
    this.notes,
  });

  factory VcmItem.fromJson(Map<String, dynamic> json) {
    return VcmItem(
      type: json['type'] as String? ?? 'autre',
      title: json['title'] as String? ?? '',
      theme: json['theme'] as String?,
      duration: json['duration'] is int ? json['duration'] as int : null,
      songNumber: json['songNumber'] is int ? json['songNumber'] as int : null,
      scriptures: json['scriptures'] as String?,
      notes: (json['notes'] as List?)?.whereType<String>().toList(),
    );
  }
}

class VcmSection {
  final String key;
  final String title;
  final List<VcmItem> items;

  VcmSection({
    required this.key,
    required this.title,
    required this.items,
  });

  factory VcmSection.fromJson(Map<String, dynamic> json) {
    final itemsJson = json['items'] as List? ?? const [];
    return VcmSection(
      key: json['key'] as String? ?? 'autre',
      title: json['title'] as String? ?? '',
      items: itemsJson
          .whereType<Map<String, dynamic>>()
          .map(VcmItem.fromJson)
          .toList(),
    );
  }
}

class VcmWeek {
  final String weekTitle;
  final String? weekTitleLocale;
  final String? startDate; // ISO (yyyy-MM-dd)
  final String? endDate; // ISO (yyyy-MM-dd)
  final String sourceUrl;
  final String? issue;
  final List<VcmSection> sections;

  VcmWeek({
    required this.weekTitle,
    this.weekTitleLocale,
    required this.startDate,
    required this.endDate,
    required this.sourceUrl,
    this.issue,
    required this.sections,
  });

  factory VcmWeek.fromJson(Map<String, dynamic> json) {
    final sectionsJson = json['sections'] as List? ?? const [];
    return VcmWeek(
      weekTitle: json['weekTitle'] as String? ?? '',
      weekTitleLocale: json['weekTitleLocale'] as String?,
      startDate: json['startDate'] as String?,
      endDate: json['endDate'] as String?,
      sourceUrl: json['sourceUrl'] as String? ?? '',
      issue: json['issue'] as String?,
      sections: sectionsJson
          .whereType<Map<String, dynamic>>()
          .map(VcmSection.fromJson)
          .toList(),
    );
  }

  DateTime? get startAsDate =>
      startDate != null && startDate!.isNotEmpty ? DateTime.tryParse(startDate!) : null;

  DateTime? get endAsDate =>
      endDate != null && endDate!.isNotEmpty ? DateTime.tryParse(endDate!) : null;
}

class VcmProgramFile {
  final List<VcmWeek> weeks;

  VcmProgramFile({required this.weeks});

  factory VcmProgramFile.fromJson(Map<String, dynamic> json) {
    final weeksJson = json['weeks'] as List? ?? const [];
    return VcmProgramFile(
      weeks: weeksJson
          .whereType<Map<String, dynamic>>()
          .map(VcmWeek.fromJson)
          .toList(),
    );
  }
}
