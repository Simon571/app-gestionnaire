import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/storage_service.dart';
import 'auth_provider.dart' show storageServiceProvider;

/// Données d'une réunion pour la prédication
class PreachingMeetingData {
  final DateTime date;
  final String? location;
  final String? time;
  final String? conductor;
  final String? theme;
  final List<String> participants;
  final String? notes;

  const PreachingMeetingData({
    required this.date,
    this.location,
    this.time,
    this.conductor,
    this.theme,
    this.participants = const [],
    this.notes,
  });

  factory PreachingMeetingData.fromJson(Map<String, dynamic> json) {
    final participantsList = <String>[];
    final rawParticipants = json['participants'] as List? ?? [];
    for (final p in rawParticipants) {
      if (p is String) {
        participantsList.add(p);
      } else if (p is Map) {
        participantsList.add(p['name']?.toString() ?? p['personName']?.toString() ?? '');
      }
    }

    return PreachingMeetingData(
      date: DateTime.tryParse(json['date']?.toString() ?? '') ?? DateTime.now(),
      location: json['location']?.toString() ?? json['lieu']?.toString(),
      time: json['time']?.toString() ?? json['heure']?.toString(),
      conductor: json['conductor']?.toString() ?? json['conducteur']?.toString(),
      theme: json['theme']?.toString(),
      participants: participantsList,
      notes: json['notes']?.toString(),
    );
  }
}

/// État contenant toutes les données des réunions pour la prédication
class PreachingMeetingState {
  final List<PreachingMeetingData> meetings;
  final bool isLoading;
  final String? error;

  const PreachingMeetingState({
    this.meetings = const [],
    this.isLoading = false,
    this.error,
  });

  /// Trouve les réunions pour un jour donné
  List<PreachingMeetingData> getMeetingsForDay(DateTime day) {
    return meetings.where((m) {
      return m.date.year == day.year && 
             m.date.month == day.month && 
             m.date.day == day.day;
    }).toList();
  }

  /// Trouve les réunions pour une semaine donnée
  List<PreachingMeetingData> getMeetingsForWeek(DateTime weekStart) {
    final weekEnd = weekStart.add(const Duration(days: 7));
    return meetings.where((m) {
      return !m.date.isBefore(weekStart) && m.date.isBefore(weekEnd);
    }).toList();
  }
}

/// Provider pour les données des réunions pour la prédication
final preachingMeetingProvider = FutureProvider<PreachingMeetingState>((ref) async {
  final storage = ref.read(storageServiceProvider);
  
  Map<String, dynamic>? data;
  
  try {
    final jsonString = await rootBundle.loadString('assets/data/predication.json');
    data = jsonDecode(jsonString) as Map<String, dynamic>?;
  } catch (e) {
    // Fichier pas trouvé
  }
  
  data ??= await storage.getGenericData('predication');
  
  if (data == null || data.isEmpty) {
    return const PreachingMeetingState();
  }
  
  final meetings = <PreachingMeetingData>[];
  final rawMeetings = data['meetings'] as List? ?? data['reunions'] as List? ?? [];
  
  for (final m in rawMeetings) {
    if (m is Map<String, dynamic>) {
      meetings.add(PreachingMeetingData.fromJson(m));
    }
  }
  
  meetings.sort((a, b) => a.date.compareTo(b.date));
  
  return PreachingMeetingState(meetings: meetings);
});

/// Provider pour les réunions d'un jour spécifique
final dayPreachingMeetingsProvider = Provider.family<List<PreachingMeetingData>, DateTime>((ref, day) {
  final state = ref.watch(preachingMeetingProvider);
  return state.when(
    data: (s) => s.getMeetingsForDay(day),
    loading: () => [],
    error: (_, __) => [],
  );
});
