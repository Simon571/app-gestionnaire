import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/storage_service.dart';
import 'auth_provider.dart' show storageServiceProvider;

/// Données d'un créneau de témoignage public
class PublicWitnessSlot {
  final String? day;
  final DateTime? date;
  final String? location;
  final String? period;
  final String? time;
  final List<String> publishers;
  final String? notes;

  const PublicWitnessSlot({
    this.day,
    this.date,
    this.location,
    this.period,
    this.time,
    this.publishers = const [],
    this.notes,
  });

  factory PublicWitnessSlot.fromJson(Map<String, dynamic> json) {
    final publishersList = <String>[];
    final rawPublishers = json['publishers'] as List? ?? json['participants'] as List? ?? [];
    for (final p in rawPublishers) {
      if (p is String) {
        publishersList.add(p);
      } else if (p is Map) {
        publishersList.add(p['name']?.toString() ?? p['personName']?.toString() ?? '');
      }
    }

    return PublicWitnessSlot(
      day: json['day']?.toString(),
      date: DateTime.tryParse(json['date']?.toString() ?? ''),
      location: json['location']?.toString() ?? json['lieu']?.toString(),
      period: json['period']?.toString() ?? json['periode']?.toString(),
      time: json['time']?.toString() ?? json['heure']?.toString(),
      publishers: publishersList,
      notes: json['notes']?.toString(),
    );
  }
}

/// État contenant toutes les données du témoignage public
class PublicWitnessState {
  final List<PublicWitnessSlot> slots;
  final bool isLoading;
  final String? error;

  const PublicWitnessState({
    this.slots = const [],
    this.isLoading = false,
    this.error,
  });

  /// Trouve les créneaux pour un jour donné (par index 0-6)
  List<PublicWitnessSlot> getSlotsForDayIndex(int dayIndex) {
    final dayNames = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    final targetDay = dayNames[dayIndex];
    
    return slots.where((slot) {
      // Vérifier par nom de jour
      final slotDay = (slot.day ?? '').toLowerCase();
      if (slotDay == targetDay) return true;
      
      // Vérifier par date
      if (slot.date != null && slot.date!.weekday - 1 == dayIndex) return true;
      
      return false;
    }).toList();
  }

  /// Trouve les créneaux pour une date spécifique
  List<PublicWitnessSlot> getSlotsForDate(DateTime date) {
    return slots.where((slot) {
      if (slot.date != null) {
        return slot.date!.year == date.year && 
               slot.date!.month == date.month && 
               slot.date!.day == date.day;
      }
      // Fallback sur le jour de la semaine
      final dayNames = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
      final targetDay = dayNames[date.weekday - 1];
      return (slot.day ?? '').toLowerCase() == targetDay;
    }).toList();
  }
}

/// Provider pour les données du témoignage public
final publicWitnessProvider = FutureProvider<PublicWitnessState>((ref) async {
  final storage = ref.read(storageServiceProvider);
  
  Map<String, dynamic>? data;
  
  try {
    final jsonString = await rootBundle.loadString('assets/data/temoignage_public.json');
    data = jsonDecode(jsonString) as Map<String, dynamic>?;
  } catch (e) {
    // Fichier pas trouvé
  }
  
  data ??= await storage.getGenericData('temoignage_public');
  
  if (data == null || data.isEmpty) {
    return const PublicWitnessState();
  }
  
  final slots = <PublicWitnessSlot>[];
  final rawSlots = data['slots'] as List? ?? [];
  
  for (final s in rawSlots) {
    if (s is Map<String, dynamic>) {
      slots.add(PublicWitnessSlot.fromJson(s));
    }
  }
  
  return PublicWitnessState(slots: slots);
});

/// Provider pour les créneaux d'un jour spécifique (par index)
final dayWitnessSlotsProvider = Provider.family<List<PublicWitnessSlot>, int>((ref, dayIndex) {
  final state = ref.watch(publicWitnessProvider);
  return state.when(
    data: (s) => s.getSlotsForDayIndex(dayIndex),
    loading: () => [],
    error: (_, __) => [],
  );
});

/// Provider pour les créneaux d'une date spécifique
final dateWitnessSlotsProvider = Provider.family<List<PublicWitnessSlot>, DateTime>((ref, date) {
  final state = ref.watch(publicWitnessProvider);
  return state.when(
    data: (s) => s.getSlotsForDate(date),
    loading: () => [],
    error: (_, __) => [],
  );
});
