import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/preaching_entry.dart';
import '../models/person.dart';
import '../services/storage_service.dart';
import 'auth_provider.dart';

class PreachingActivityState {
  final DateTime selectedMonth;
  final DateTime selectedDate;
  final Map<String, PreachingEntry> entries;
  final bool isSubmitted;
  final bool didPreach;
  final bool isLoading;
  final String? error;

  const PreachingActivityState({
    required this.selectedMonth,
    required this.selectedDate,
    this.entries = const {},
    this.isSubmitted = false,
    this.didPreach = false,
    this.isLoading = false,
    this.error,
  });

  factory PreachingActivityState.initial() => PreachingActivityState(
        selectedMonth: DateTime(DateTime.now().year, DateTime.now().month, 1),
        selectedDate: DateTime.now(),
        entries: const {},
        isSubmitted: false,
        didPreach: false,
        isLoading: true,
      );

  PreachingActivityState copyWith({
    DateTime? selectedMonth,
    DateTime? selectedDate,
    Map<String, PreachingEntry>? entries,
    bool? isSubmitted,
    bool? didPreach,
    bool? isLoading,
    String? error,
  }) {
    return PreachingActivityState(
      selectedMonth: selectedMonth ?? this.selectedMonth,
      selectedDate: selectedDate ?? this.selectedDate,
      entries: entries ?? this.entries,
      isSubmitted: isSubmitted ?? this.isSubmitted,
      didPreach: didPreach ?? this.didPreach,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  String get selectedMonthKey => _monthKey(selectedMonth);

  PreachingEntry entryForDate(DateTime date) {
    final key = _dateKey(date);
    return entries[key] ?? const PreachingEntry();
  }

  Set<String> get activeDateKeys => entries.entries
      .where((entry) => entry.value.hasData)
      .map((entry) => entry.key)
      .toSet();

  bool get hasRecordedActivity => entries.values.any((entry) => entry.hasData);

  double get totalHours =>
      entries.values.fold(0, (prev, entry) => prev + entry.hours);
  int get totalBibleStudies =>
      entries.values.fold(0, (prev, entry) => prev + entry.bibleStudies);
  double get totalCredit =>
      entries.values.fold(0, (prev, entry) => prev + entry.credit);

  static String _monthKey(DateTime date) =>
      '${date.year.toString().padLeft(4, '0')}-${date.month.toString().padLeft(2, '0')}';
  static String _dateKey(DateTime date) =>
      '${date.year.toString().padLeft(4, '0')}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
}

class PreachingActivityNotifier extends Notifier<PreachingActivityState> {
  late final StorageService _storageService;
  Person? _user;
  String? _userId;

  Map<String, Map<String, PreachingEntry>> _entriesByMonth = {};
  final Set<String> _submittedMonths = <String>{};
  final Map<String, bool> _participationByMonth = <String, bool>{};
  final Set<String> _serverSubmittedMonths = <String>{};
  Timer? _autoRefreshTimer;

  @override
  PreachingActivityState build() {
    _storageService = ref.read(storageServiceProvider);
    _user = ref.read(authStateProvider).user;
    _userId = _user?.id;
    _loadServerSubmittedMonths();
    if (_userId == null) {
      return PreachingActivityState.initial().copyWith(isLoading: false);
    } else {
      _loadInitial();
      _startAutoRefresh();
      return PreachingActivityState.initial();
    }
  }
  
  void _startAutoRefresh() {
    _autoRefreshTimer?.cancel();
    _autoRefreshTimer = Timer.periodic(const Duration(seconds: 10), (_) {
      refreshFromServer();
    });
  }
  
  @override
  void dispose() {
    _autoRefreshTimer?.cancel();
  }

  void _loadServerSubmittedMonths() {
    _serverSubmittedMonths.clear();
    if (_user != null) {
      for (final report in _user!.activity) {
        if (report.participated) {
          _serverSubmittedMonths.add(report.month);
        }
      }
    }
  }

  /// Rafraîchir les données du serveur pour mettre à jour le statut des rapports
  Future<void> refreshFromServer() async {
    if (_userId == null) return;
    try {
      // Recharger les données des utilisateurs depuis le serveur
      final people = await _storageService.getPeople();
      final updatedUser = people.firstWhere(
        (p) => p.id == _userId,
        orElse: () => _user!,
      );
      
      // IMPORTANT: Mettre à jour l'utilisateur courant avec les données du serveur
      _user = updatedUser;
      
      // Mettre à jour les mois soumis depuis le serveur
      _serverSubmittedMonths.clear();
      for (final report in updatedUser.activity) {
        if (report.participated) {
          _serverSubmittedMonths.add(report.month);
        }
      }
      
      // Mettre à jour l'état actuel
      final monthKey = state.selectedMonthKey;
      final isMonthSubmitted = _submittedMonths.contains(monthKey) || _serverSubmittedMonths.contains(monthKey);
      state = state.copyWith(isSubmitted: isMonthSubmitted);
    } catch (e) {
      // Ignorer les erreurs de rafraîchissement
    }
  }
  
  /// Marquer un mois comme soumis (utilisé quand un rapport est envoyé par un délégué ou depuis Assembly)
  void markMonthAsSubmitted(String monthKey) {
    _submittedMonths.add(monthKey);
    _serverSubmittedMonths.add(monthKey);
    if (state.selectedMonthKey == monthKey) {
      state = state.copyWith(isSubmitted: true);
    }
    _persist();
  }

  Future<void> _loadInitial() async {
    if (_userId == null) return;
    try {
      // Charger d'abord les données du serveur pour connaître les mois soumis
      await refreshFromServer();
      
      final payload = await _storageService.getPreachingData(_userId!);
      final entriesJson = payload['entries'] as Map<String, dynamic>? ?? {};
      _entriesByMonth = entriesJson.map((monthKey, datesJson) {
        final datesMap = <String, PreachingEntry>{};
        if (datesJson is Map<String, dynamic>) {
          datesJson.forEach((dayKey, entryJson) {
            if (entryJson is Map<String, dynamic>) {
              datesMap[dayKey] = PreachingEntry.fromJson(entryJson);
            }
          });
        }
        return MapEntry(monthKey, datesMap);
      });
      final submitted = payload['submitted'];
      if (submitted is List) {
        for (final value in submitted) {
          if (value is String) {
            _submittedMonths.add(value);
          }
        }
      }
      final participated = payload['participated'];
      if (participated is Map<String, dynamic>) {
        participated.forEach((key, value) {
          if (value is bool) {
            _participationByMonth[key] = value;
          }
        });
      } else if (participated is List) {
        // rétrocompatibilité avec le premier schéma (liste de mois cochés)
        for (final value in participated) {
          if (value is String) {
            _participationByMonth[value] = true;
          }
        }
      }
      await selectMonth(DateTime.now());
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Impossible de charger les rapports: $e',
      );
    }
  }

  Future<void> selectMonth(DateTime date) async {
    if (_userId == null) return;
    final normalized = DateTime(date.year, date.month, 1);
    final monthKey = PreachingActivityState._monthKey(normalized);
    final monthEntries =
        _entriesByMonth[monthKey] ?? <String, PreachingEntry>{};
    final maxDay = DateUtils.getDaysInMonth(normalized.year, normalized.month);
    int fallbackDay = DateTime.now().day;
    fallbackDay = fallbackDay.clamp(1, maxDay).toInt();
    final int targetDay = state.selectedDate.month == normalized.month &&
            state.selectedDate.year == normalized.year
        ? state.selectedDate.day.clamp(1, maxDay).toInt()
        : fallbackDay;
    final selectedDate = DateTime(normalized.year, normalized.month, targetDay);
    // Vérifier si le mois est soumis localement OU sur le serveur
    final isMonthSubmitted = _submittedMonths.contains(monthKey) || _serverSubmittedMonths.contains(monthKey);
    state = state.copyWith(
      selectedMonth: normalized,
      selectedDate: selectedDate,
      entries: Map<String, PreachingEntry>.from(monthEntries),
      isSubmitted: isMonthSubmitted,
      didPreach: _participationByMonth[monthKey] ?? false,
      isLoading: false,
      error: null,
    );
  }

  void goToPreviousMonth() {
    final current = state.selectedMonth;
    selectMonth(DateTime(current.year, current.month - 1, 1));
    // Refresh depuis le serveur pour vérifier si le mois est déjà soumis
    Future.delayed(const Duration(milliseconds: 200), () => refreshFromServer());
  }

  void goToNextMonth() {
    final current = state.selectedMonth;
    selectMonth(DateTime(current.year, current.month + 1, 1));
    // Refresh depuis le serveur pour vérifier si le mois est déjà soumis
    Future.delayed(const Duration(milliseconds: 200), () => refreshFromServer());
  }

  void selectDate(DateTime date) {
    if (date.month != state.selectedMonth.month ||
        date.year != state.selectedMonth.year) {
      selectMonth(date);
    } else {
      state = state.copyWith(selectedDate: date);
    }
  }

  void adjustHours(double delta) => _updateEntry(hoursDelta: delta);
  void adjustBibleStudies(int delta) => _updateEntry(bibleStudiesDelta: delta);
  void adjustCredit(double delta) => _updateEntry(creditDelta: delta);
  
  void setHours(double value) => _updateEntry(hoursAbsolute: value);
  void setBibleStudies(int value) => _updateEntry(bibleStudiesAbsolute: value);
  void setCredit(double value) => _updateEntry(creditAbsolute: value);

  void setDidPreach(bool value) {
    final monthKey = state.selectedMonthKey;
    _participationByMonth[monthKey] = value;
    state = state.copyWith(didPreach: value, error: null);
    _persist();
  }

  void _updateEntry({
      double hoursDelta = 0,
      int bibleStudiesDelta = 0,
      double creditDelta = 0,
      double? hoursAbsolute,
      int? bibleStudiesAbsolute,
      double? creditAbsolute,
  }) {
    final date = state.selectedDate;
    final key = PreachingActivityState._dateKey(date);
    final current = state.entries[key] ?? const PreachingEntry();
    
    double hours = hoursAbsolute ?? (current.hours + hoursDelta);
    int bibleStudies = bibleStudiesAbsolute ?? (current.bibleStudies + bibleStudiesDelta);
    double credit = creditAbsolute ?? (current.credit + creditDelta);
    
    hours = hours.clamp(0, 9999).toDouble();
    bibleStudies = bibleStudies.clamp(0, 999).toInt();
    credit = credit.clamp(0, 9999).toDouble();
    
    if (hours.isNaN) hours = 0;
    if (credit.isNaN) credit = 0;
    final updated = PreachingEntry(
        hours: hours, bibleStudies: bibleStudies, credit: credit);

    final updatedEntries = Map<String, PreachingEntry>.from(state.entries);
    updatedEntries[key] = updated;
    final monthKey = state.selectedMonthKey;
    _entriesByMonth[monthKey] = updatedEntries;

    state = state.copyWith(entries: updatedEntries, error: null);
    _persist();
  }

  /// Soumet le rapport du mois courant. Retourne `true` si l'envoi au serveur a réussi.
  Future<bool> submitCurrentMonth() async {
    final monthKey = state.selectedMonthKey;
    
    // Vérification de l'utilisateur et du PIN
    if (_userId == null || _user?.pin == null || _user!.pin!.isEmpty) {
      state = state.copyWith(
        error: '❌ Impossible d\'envoyer le rapport : utilisateur non connecté ou PIN manquant. Veuillez vous reconnecter.',
      );
      return false;
    }
    
    // 🟡 Marquer comme "en attente d'envoi" pendant l'envoi
    state = state.copyWith(isLoading: true, error: null);
    
    final entriesForMonth = _entriesByMonth[monthKey] ?? <String, PreachingEntry>{};
    final entriesJson = entriesForMonth.map(
        (dateKey, entry) => MapEntry(dateKey, entry.toJson()));
    final totals = {
      'hours': state.totalHours,
      'bibleStudies': state.totalBibleStudies,
      'credit': state.totalCredit,
    };
    final didPreach = _participationByMonth[monthKey] ?? state.hasRecordedActivity;
    
    try {
      // Envoyer au serveur avec retry automatique
      final success = await _storageService.sendPreachingReport(
        userId: _userId!,
        month: monthKey,
        entries: entriesJson,
        totals: totals,
        didPreach: didPreach,
        pin: _user!.pin!,
      );
      
      if (success) {
        // ✅ Envoi réussi
        _submittedMonths.add(monthKey);
        _serverSubmittedMonths.add(monthKey);
        state = state.copyWith(
          isSubmitted: true,
          isLoading: false,
          error: null,
        );
        await _persist();
        
        // Forcer un rafraîchissement pour mettre à jour l'interface
        await Future.delayed(const Duration(milliseconds: 500));
        await refreshFromServer();
        
        return true;
      } else {
        // ❌ Envoi échoué après retry
        state = state.copyWith(
          isLoading: false,
          error: '❌ ERREUR D\'ENVOI\n\n'
              'Le serveur n\'a pas répondu après plusieurs tentatives.\n\n'
              'Vérifiez:\n'
              '• Votre connexion Internet\n'
              '• Que le serveur est accessible\n'
              '• Votre PIN\n\n'
              'Votre rapport a été enregistré localement et sera automatiquement '
              'synchronisé dès que le serveur sera accessible.',
        );
        return false;
      }
    } catch (e) {
      // 🔴 Exception non gérée
      state = state.copyWith(
        isLoading: false,
        error: '🔴 ERREUR INATTENDUE:\n${e.toString()}\n\n'
            'Votre rapport a été enregistré localement. '
            'Contactez le support si le problème persiste.',
      );
      return false;
    }
  }

  Future<void> _persist() async {
    if (_userId == null) return;
    final entriesPayload = _entriesByMonth.map((monthKey, entries) {
      return MapEntry(monthKey,
          entries.map((dateKey, entry) => MapEntry(dateKey, entry.toJson())));
    });
    final payload = {
      'entries': entriesPayload,
      'submitted': _submittedMonths.toList(),
      'participated': _participationByMonth,
    };
    await _storageService.savePreachingData(_userId!, payload);
  }
}

final preachingActivityProvider = NotifierProvider<PreachingActivityNotifier, PreachingActivityState>(PreachingActivityNotifier.new);
