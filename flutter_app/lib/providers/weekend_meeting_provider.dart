import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/person.dart';
import 'auth_provider.dart' show storageServiceProvider, peopleProvider;

/// Données d'une réunion de week-end (discours public)
class WeekendMeetingData {
  final DateTime weekStart;
  final String weekLabel;
  final String? discoursNumber;
  final String? discoursTheme;
  final String? orateurId;
  final String? orateurAssemblee;
  final String? presidentId;
  final String? lecteurId;
  final String? priereId;
  final String? orateur2Id;
  final String? hospitaliteId;
  final Map<String, List<String>> services;
  final String? groupeNettoyage;
  final bool isCancelled;

  const WeekendMeetingData({
    required this.weekStart,
    required this.weekLabel,
    this.discoursNumber,
    this.discoursTheme,
    this.orateurId,
    this.orateurAssemblee,
    this.presidentId,
    this.lecteurId,
    this.priereId,
    this.orateur2Id,
    this.hospitaliteId,
    this.services = const {},
    this.groupeNettoyage,
    this.isCancelled = false,
  });

  factory WeekendMeetingData.fromScheduleRow(Map<String, dynamic> json) {
    final dateStr = json['date']?.toString() ?? '';
    final date = DateTime.tryParse(dateStr) ?? DateTime.now();
    // Calculer le début de semaine (lundi)
    final weekStart = date.subtract(Duration(days: date.weekday - 1));
    
    // Parse discours field - can be just a number or "number - theme"
    final discoursRaw = json['discours']?.toString() ?? '';
    String? discoursNumber;
    String? discoursTheme;
    
    if (discoursRaw.isNotEmpty) {
      if (discoursRaw.contains(' - ')) {
        final parts = discoursRaw.split(' - ');
        discoursNumber = parts[0].trim();
        discoursTheme = parts.sublist(1).join(' - ').trim();
      } else {
        // Just the number
        discoursNumber = discoursRaw.trim();
        discoursTheme = json['discoursTheme']?.toString();
      }
    }

    return WeekendMeetingData(
      weekStart: weekStart,
      weekLabel: '',
      discoursNumber: discoursNumber,
      discoursTheme: discoursTheme,
      orateurId: json['orateur']?.toString(),
      orateurAssemblee: json['assemblee']?.toString(),
      presidentId: json['president']?.toString(),
      lecteurId: json['lecteur']?.toString(),
      priereId: json['priere']?.toString(),
      orateur2Id: json['orateur2']?.toString(),
      hospitaliteId: json['hospitalite']?.toString(),
      isCancelled: json['isCancelled'] == true,
    );
  }
}

/// État contenant toutes les données des réunions de week-end
class WeekendMeetingState {
  final List<WeekendMeetingData> weeks;
  final bool isLoading;
  final String? error;

  const WeekendMeetingState({
    this.weeks = const [],
    this.isLoading = false,
    this.error,
  });

  /// Trouve les données pour une semaine donnée
  WeekendMeetingData? getWeekData(DateTime weekStart) {
    String dateOnly(DateTime d) {
      return "${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}";
    }
    final isoDate = dateOnly(weekStart);
    for (final week in weeks) {
      final weekIso = dateOnly(week.weekStart);
      if (weekIso == isoDate) return week;
    }
    // Chercher aussi par correspondance de semaine
    for (final week in weeks) {
      final diff = weekStart.difference(week.weekStart).inDays.abs();
      if (diff < 7) return week;
    }
    return null;
  }
}

/// Provider pour les données brutes des réunions de week-end
final weekendMeetingProvider = FutureProvider<WeekendMeetingState>((ref) async {
  final storage = ref.read(storageServiceProvider);
  
  // Charger depuis predication.json (format de l'app web)
  Map<String, dynamic>? data;
  
  try {
    final jsonString = await rootBundle.loadString('assets/data/predication.json');
    data = jsonDecode(jsonString) as Map<String, dynamic>?;
  } catch (e) {
    // Fichier pas trouvé, essayer StorageService
  }
  
  data ??= await storage.getGenericData('predication');
  
  if (data == null || data.isEmpty) {
    return const WeekendMeetingState();
  }
  
  final weeks = <WeekendMeetingData>[];
  final scheduleData = data['scheduleData'] as List? ?? [];
  
  for (final row in scheduleData) {
    if (row is Map<String, dynamic>) {
      weeks.add(WeekendMeetingData.fromScheduleRow(row));
    }
  }
  
  // Trier par date
  weeks.sort((a, b) => a.weekStart.compareTo(b.weekStart));
  
  return WeekendMeetingState(weeks: weeks);
});

/// Provider pour résoudre les IDs de personnes en noms
final weekendParticipantNamesProvider = Provider.family<Map<String, String>, DateTime>((ref, weekStart) {
  final weekendState = ref.watch(weekendMeetingProvider);
  final peopleAsync = ref.watch(peopleProvider);
  
  final names = <String, String>{};
  
  final weekData = weekendState.when(
    data: (state) => state.getWeekData(weekStart),
    loading: () => null,
    error: (_, __) => null,
  );
  
  if (weekData == null) return names;
  
  final people = peopleAsync.when(
    data: (list) => list,
    loading: () => <Person>[],
    error: (_, __) => <Person>[],
  );
  
  String? resolveId(String? id) {
    if (id == null || id.isEmpty || id == 'null') return null;
    for (final p in people) {
      if (p.id == id) {
        return p.displayName.isNotEmpty ? p.displayName : '${p.firstName} ${p.lastName}'.trim();
      }
    }
    return null;
  }
  
  if (weekData.presidentId != null) {
    final name = resolveId(weekData.presidentId);
    if (name != null) names['president'] = name;
  }
  if (weekData.lecteurId != null) {
    final name = resolveId(weekData.lecteurId);
    if (name != null) names['lecteur'] = name;
  }
  if (weekData.orateurId != null) {
    final name = resolveId(weekData.orateurId);
    if (name != null) names['orateur'] = name;
  }
  // La prière de fin est l'orateur du jour
  // Si priereId est défini, l'utiliser; sinon utiliser l'orateur
  if (weekData.priereId != null && weekData.priereId!.isNotEmpty && weekData.priereId != 'null') {
    final name = resolveId(weekData.priereId);
    if (name != null) {
      names['priere'] = name;
    } else if (names['orateur'] != null) {
      names['priere'] = names['orateur']!;
    }
  } else if (names['orateur'] != null) {
    // Par défaut, la prière de fin est faite par l'orateur du jour
    names['priere'] = names['orateur']!;
  }
  if (weekData.orateur2Id != null) {
    final name = resolveId(weekData.orateur2Id);
    if (name != null) names['orateur2'] = name;
  }
  
  return names;
});

/// Provider pour les services d'une semaine
final servicesProvider = FutureProvider<Map<String, Map<String, List<String>>>>((ref) async {
  final storage = ref.read(storageServiceProvider);
  
  Map<String, dynamic>? data;
  
  try {
    final jsonString = await rootBundle.loadString('assets/data/services.json');
    data = jsonDecode(jsonString) as Map<String, dynamic>?;
  } catch (e) {
    // Fichier pas trouvé
  }
  
  data ??= await storage.getGenericData('services');
  
  if (data == null) return {};
  
  final result = <String, Map<String, List<String>>>{};
  final serviceData = data['serviceData'] as List? ?? [];
  
  for (final weekData in serviceData) {
    if (weekData is Map<String, dynamic>) {
      final weekLabel = weekData['week']?.toString() ?? '';
      final services = <String, List<String>>{};
      
      for (final entry in weekData.entries) {
        if (entry.key != 'week' && entry.value is List) {
          services[entry.key] = List<String>.from(entry.value.map((e) => e.toString()));
        }
      }
      
      result[weekLabel] = services;
    }
  }
  
  return result;
});

// Ancien provider maintenu pour compatibilité (déprécié)
class WeekendParticipant {
  final String personId;
  final String personName;
  final String role;
  final DateTime date;

  const WeekendParticipant({
    required this.personId,
    required this.personName,
    required this.role,
    required this.date,
  });
}

final weekendParticipantsProvider = Provider.family<List<WeekendParticipant>, DateTime>((ref, weekStart) {
  // Maintenant on utilise weekendParticipantNamesProvider à la place
  return [];
});
