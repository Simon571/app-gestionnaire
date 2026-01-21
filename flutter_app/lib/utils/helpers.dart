import 'package:intl/intl.dart';

/// Classe utilitaire pour les opérations sur les dates
class AppDateUtils {
  /// Obtient la semaine actuelle en format ISO
  static String getCurrentWeekId() {
    final now = DateTime.now();
    final weekStart = _getMonday(now);
    return weekStart.toIso8601String().split('T')[0];
  }

  /// Obtient le lundi de la semaine
  static DateTime _getMonday(DateTime date) {
    final weekDay = date.weekday;
    final daysToSubtract = weekDay - 1; // Lundi = 1, dimanche = 7
    return date.subtract(Duration(days: daysToSubtract));
  }

  /// Formate une date au format français
  static String formatDateFr(DateTime? date) {
    if (date == null) return '';
    final formatter = DateFormat('dd MMMM yyyy', 'fr_FR');
    return formatter.format(date);
  }

  /// Formate une date au format court français
  static String formatDateShortFr(DateTime? date) {
    if (date == null) return '';
    final formatter = DateFormat('dd/MM/yyyy', 'fr_FR');
    return formatter.format(date);
  }

  /// Formate une plage hebdomadaire "1-7 décembre 2025"
  static String formatWeekRange(DateTime? startDate) {
    if (startDate == null) return '';
    final start = DateTime(startDate.year, startDate.month, startDate.day);
    final end = start.add(const Duration(days: 6));
    final dayFormatter = DateFormat('d', 'fr_FR');
    final monthFormatter = DateFormat('MMMM', 'fr_FR');
    final startDay = dayFormatter.format(start);
    final endDay = dayFormatter.format(end);
    final startMonth = monthFormatter.format(start);
    final endMonth = monthFormatter.format(end);

    if (start.month == end.month && start.year == end.year) {
      return '$startDay-$endDay $startMonth ${start.year}';
    }

    final startLabel = '$startDay $startMonth ${start.year}';
    final endLabel = '$endDay $endMonth ${end.year}';
    return '$startLabel - $endLabel';
  }

  /// Formate un mois au format YYYY-MM
  static String formatMonthId(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}';
  }

  /// Parse un mois au format YYYY-MM
  static DateTime? parseMonthId(String monthId) {
    try {
      final parts = monthId.split('-');
      return DateTime(int.parse(parts[0]), int.parse(parts[1]));
    } catch (e) {
      return null;
    }
  }

  /// Retourne le mois précédent au format YYYY-MM
  static String getPreviousMonthId() {
    final now = DateTime.now();
    final previous = DateTime(now.year, now.month - 1);
    return formatMonthId(previous);
  }

  /// Retourne le mois courant au format YYYY-MM
  static String getCurrentMonthId() {
    return formatMonthId(DateTime.now());
  }

  /// Retourne le prochain mois au format YYYY-MM
  static String getNextMonthId() {
    final now = DateTime.now();
    final next = DateTime(now.year, now.month + 1);
    return formatMonthId(next);
  }

  /// Vérifie si une date est dans le mois courant
  static bool isCurrentMonth(String monthId) {
    return monthId == getCurrentMonthId();
  }

  /// Vérifie si une date est dans le mois précédent
  static bool isPreviousMonth(String monthId) {
    return monthId == getPreviousMonthId();
  }

  /// Obtient le libellé du jour de la semaine
  static String getDayLabel(int weekday) {
    const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    return days[weekday - 1];
  }

  /// Obtient les jours de la semaine à partir du lundi
  static List<String> getWeekDays() {
    return ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  }

  /// Retourne les prochaines `count` occurrences d'un jour de la semaine donné
  /// `weekday` suit la convention DateTime.weekday (1=Monday ... 7=Sunday).
  /// Commence à partir d'aujourd'hui (inclut aujourd'hui si même jour).
  static List<DateTime> nextOccurrences(int weekday, int count, {DateTime? from}) {
    final start = from ?? DateTime.now();
    // find first occurrence (including today)
    int daysToAdd = (weekday - start.weekday) % 7;
    if (daysToAdd < 0) daysToAdd += 7; // ensure positive
    final first = DateTime(start.year, start.month, start.day).add(Duration(days: daysToAdd));
    final out = <DateTime>[];
    for (int i = 0; i < count; i++) {
      out.add(first.add(Duration(days: i * 7)));
    }
    return out;
  }
}

/// Classe utilitaire pour les formats
class FormatUtils {
  /// Formate les heures en format lisible
  static String formatHours(double? hours) {
    if (hours == null) return 'N/A';
    return '${hours.toStringAsFixed(1)}h';
  }

  /// Formate le PIN en masquant les chiffres
  static String maskPin(String pin) {
    if (pin.length < 4) return '****';
    return '****${pin.substring(pin.length - 2)}';
  }

  /// Obtient l'initiale du nom
  static String getInitial(String name) {
    return name.isNotEmpty ? name[0].toUpperCase() : '?';
  }

  /// Formate un nom complet
  static String formatName(String firstName, String lastName) {
    return '$firstName $lastName'.trim();
  }

  /// Tronque un texte avec ellipse
  static String truncate(String text, int length) {
    return text.length > length ? '${text.substring(0, length)}...' : text;
  }
}

/// Classe utilitaire pour les validations
class ValidationUtils {
  /// Valide un PIN (doit être numérique et au moins 4 chiffres)
  static bool isValidPin(String pin) {
    return RegExp(r'^\d{4,}$').hasMatch(pin);
  }

  /// Valide un email
  static bool isValidEmail(String email) {
    return RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$').hasMatch(email);
  }

  /// Valide un ID d'assemblée
  static bool isValidAssemblyId(String id) {
    return id.isNotEmpty && id.length >= 3;
  }

  /// Valide un prénom
  static bool isValidFirstName(String name) {
    return name.isNotEmpty && name.length >= 2;
  }
}
