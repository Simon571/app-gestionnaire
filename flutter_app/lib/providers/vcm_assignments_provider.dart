import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'auth_provider.dart';

/// Une participation au programme VCM
class VcmParticipant {
  final String personId;
  final String personName;
  final String role;
  final DateTime weekStart;

  const VcmParticipant({
    required this.personId,
    required this.personName,
    required this.role,
    required this.weekStart,
  });

  factory VcmParticipant.fromJson(dynamic json) {
    if (json == null) {
      return VcmParticipant(
        personId: '',
        personName: '',
        role: '',
        weekStart: DateTime.now(),
      );
    }
    final Map<String, dynamic> map = json is Map<String, dynamic>
        ? json
        : Map<String, dynamic>.from(json as Map);

    return VcmParticipant(
      personId: map['personId']?.toString() ?? '',
      personName: map['personName']?.toString() ?? '',
      role: map['role']?.toString() ?? '',
      weekStart: DateTime.tryParse(map['date']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}

/// Données d'assignation pour une semaine VCM
class VcmWeekAssignments {
  final DateTime weekStart;
  final DateTime weekEnd;
  final String weekLabel;
  final List<VcmParticipant> participants;
  final Map<String, dynamic> assignments;
  final String? hall;
  final String? meetingType;

  const VcmWeekAssignments({
    required this.weekStart,
    required this.weekEnd,
    required this.weekLabel,
    required this.participants,
    required this.assignments,
    this.hall,
    this.meetingType,
  });

  factory VcmWeekAssignments.fromJson(dynamic json) {
    final participantsList = <VcmParticipant>[];
    final Map<String, dynamic> map = json is Map<String, dynamic>
        ? json
        : Map<String, dynamic>.from(json as Map);

    final rawParticipants = map['participants'] as List? ?? [];
    for (final p in rawParticipants) {
      if (p is Map) {
        participantsList.add(VcmParticipant.fromJson(p));
      }
    }

    return VcmWeekAssignments(
      weekStart: DateTime.tryParse(json['weekStart']?.toString() ?? '') ?? DateTime.now(),
      weekEnd: DateTime.tryParse(json['weekEnd']?.toString() ?? '') ?? DateTime.now(),
      weekLabel: json['weekLabel']?.toString() ?? '',
      participants: participantsList,
        assignments: map['assignments'] is Map
          ? Map<String, dynamic>.from(map['assignments'] as Map)
          : {},
      hall: json['hall']?.toString(),
      meetingType: json['meetingType']?.toString(),
    );
  }

  /// Récupère les participants pour cette semaine, triés par rôle
  List<VcmParticipant> get sortedParticipants {
    final sorted = List<VcmParticipant>.from(participants);

    // Build an ordering from the assignments map (insertion order preserved)
    final roleOrder = <String, int>{};
    int idx = 0;
    try {
      for (final key in assignments.keys) {
        roleOrder[key.toString()] = idx++;
      }
    } catch (_) {
      // ignore - if assignments is not iterable, fallback to alphabetical
    }

    int roleIndex(String role) {
      if (roleOrder.containsKey(role)) return roleOrder[role]!;
      // try to match without hall prefix (e.g., 'hall1:treasures_president' -> 'treasures_president')
      final parts = role.split(':');
      if (parts.length > 1 && roleOrder.containsKey(parts.last)) return roleOrder[parts.last]!;
      return 9999;
    }

    sorted.sort((a, b) {
      final ia = roleIndex(a.role);
      final ib = roleIndex(b.role);
      if (ia != ib) return ia.compareTo(ib);
      return a.personName.toLowerCase().compareTo(b.personName.toLowerCase());
    });

    return sorted;
  }

  /// Vérifie si une personne participe à cette semaine
  bool hasParticipant(String personIdOrName) {
    final lower = personIdOrName.toLowerCase().trim();
    return participants.any((p) => 
      p.personId.toLowerCase() == lower || 
      p.personName.toLowerCase() == lower
    );
  }

  /// Récupère les rôles d'une personne pour cette semaine
  List<String> getRolesForPerson(String personIdOrName) {
    final lower = personIdOrName.toLowerCase().trim();
    return participants
      .where((p) => p.personId.toLowerCase() == lower || p.personName.toLowerCase() == lower)
      .map((p) => _formatRole(p.role))
      .toList();
  }

  static String _formatRole(String role) {
    // Convertir les clés comme "tgw_talk_10min_student" en labels lisibles
    final parts = role.split('_');
    final formatted = parts.map((p) {
      if (p.isEmpty) return '';
      return p[0].toUpperCase() + p.substring(1);
    }).join(' ');
    
    // Traductions courantes
    const translations = {
      'Tgw': 'Trésors',
      'Ayf': 'Améliore',
      'Lac': 'Vie chrétienne',
      'Chairman': 'Président',
      'Prayer': 'Prière',
      'Talk': 'Discours',
      'Gems': 'Joyaux',
      'Reading': 'Lecture',
      'Initial Call': 'Premier contact',
      'Return Visit': 'Nouvelle visite',
      'Bible Study': 'Cours biblique',
      'Cbs': 'Étude biblique cong.',
      'Student': '(Étudiant)',
      'Assistant': '(Assistant)',
    };
    
    String result = formatted;
    for (final entry in translations.entries) {
      result = result.replaceAll(entry.key, entry.value);
    }
    
    return result.trim();
  }
}

/// État contenant toutes les assignations VCM
class VcmAssignmentsState {
  final List<VcmWeekAssignments> weeks;
  final bool isLoading;
  final String? error;

  const VcmAssignmentsState({
    this.weeks = const [],
    this.isLoading = false,
    this.error,
  });

  VcmAssignmentsState copyWith({
    List<VcmWeekAssignments>? weeks,
    bool? isLoading,
    String? error,
  }) {
    return VcmAssignmentsState(
      weeks: weeks ?? this.weeks,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  /// Trouve les assignations pour une semaine donnée
  VcmWeekAssignments? getWeekAssignments(DateTime weekStart) {
    // Normalize to UTC date so comparisons don't break due to local timezone offsets
    String dateOnly(DateTime d) {
      final dt = d.toUtc();
      return "${dt.year.toString().padLeft(4, '0')}-${dt.month.toString().padLeft(2, '0')}-${dt.day.toString().padLeft(2, '0')}";
    }
    final isoDate = dateOnly(weekStart);
    for (final week in weeks) {
      final weekIso = dateOnly(week.weekStart);
      if (weekIso == isoDate) return week;
    }
    return null;
  }

  /// Récupère les participants pour une semaine donnée
  List<VcmParticipant> getParticipantsForWeek(DateTime weekStart) {
    return getWeekAssignments(weekStart)?.sortedParticipants ?? [];
  }
}

/// Provider pour les assignations VCM
final vcmAssignmentsProvider = FutureProvider<VcmAssignmentsState>((ref) async {
  final storage = ref.read(storageServiceProvider);
  
  // Essayer de charger depuis le fichier assets d'abord
  Map<String, dynamic>? data;
  
  try {
    final jsonString = await rootBundle.loadString('assets/data/programme_week.json');
    data = jsonDecode(jsonString) as Map<String, dynamic>?;
  } catch (e) {
    // Fichier pas trouvé, essayer StorageService
  }
  
  // Fallback: charger depuis StorageService
  data ??= await storage.getGenericData('programme_week');
  
  if (data == null || data.isEmpty) {
    return const VcmAssignmentsState();
  }
  
  final weeks = <VcmWeekAssignments>[];
  final rawWeeks = data['weeks'] as List? ?? [];
  
  for (final w in rawWeeks) {
    if (w is Map<String, dynamic>) {
      weeks.add(VcmWeekAssignments.fromJson(w));
    }
  }
  
  // Trier par date
  weeks.sort((a, b) => a.weekStart.compareTo(b.weekStart));
  
  return VcmAssignmentsState(weeks: weeks);
});

/// Provider pour les participants d'une semaine spécifique
final weekParticipantsProvider = Provider.family<List<VcmParticipant>, DateTime>((ref, weekStart) {
  final state = ref.watch(vcmAssignmentsProvider);
  return state.when(
    data: (s) => s.getParticipantsForWeek(weekStart),
    loading: () => [],
    error: (_, __) => [],
  );
});
