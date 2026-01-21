import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/vcm_models.dart';

/// Service pour récupérer les programmes VCM depuis le gestionnaire desktop.
class VcmService {
  /// URL complète vers le JSON normalisé, par ex. :
  /// http://localhost:3000/vcm/fr/vcm-program.normalized.json
  final String programUrl;

  VcmService({required this.programUrl});

  /// Récupère toutes les semaines disponibles à partir du JSON normalisé.
  Future<List<VcmWeek>> fetchWeeks() async {
    final uri = Uri.parse(programUrl);
    final res = await http.get(uri);
    if (res.statusCode != 200) {
      throw Exception('Erreur HTTP ${res.statusCode} lors du chargement du programme VCM');
    }

    final decoded = jsonDecode(res.body);

    // JSON actuel: { "semaines": [ ... ] }
    if (decoded is Map<String, dynamic>) {
      final rawWeeks = decoded['semaines'] ?? decoded['weeks'];
      if (rawWeeks is List) {
        return rawWeeks
            .whereType<Map<String, dynamic>>()
            .map(VcmWeek.fromJson)
            .toList();
      }
    }

    // Fallback: tableau direct
    if (decoded is List) {
      return decoded
          .whereType<Map<String, dynamic>>()
          .map(VcmWeek.fromJson)
          .toList();
    }

    throw Exception('Format de réponse VCM inattendu');
  }

  /// Retourne la semaine correspondant à la date donnée (entre startDate et endDate incluses).
  Future<VcmWeek?> fetchWeekForDate(DateTime date) async {
    final weeks = await fetchWeeks();
    for (final w in weeks) {
      final start = w.startAsDate;
      final end = w.endAsDate;
      if (start == null || end == null) continue;
      if (!date.isBefore(start) && !date.isAfter(end)) {
        return w;
      }
    }
    return null;
  }
}

