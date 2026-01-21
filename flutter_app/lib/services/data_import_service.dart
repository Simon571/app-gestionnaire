import 'dart:convert';
import '../models/person.dart';
import 'storage_service.dart';
import 'sync_service.dart';

/// Service d'importation de données depuis la version desktop
class DataImportService {
  final StorageService storageService;
  final SyncService syncService;

  DataImportService(this.storageService) 
      : syncService = SyncService(storageService);

  /// Importe les données depuis un fichier JSON (depuis desktop)
  /// Format attendu: liste de Person serialisées en JSON
  Future<bool> importPeopleFromJson(String jsonString) async {
    try {
      final List<dynamic> jsonList = jsonDecode(jsonString);
      final people = jsonList
          .map((e) => Person.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();

      await storageService.savePeople(people);
      return true;
    } catch (e) {
      print('Erreur import JSON: $e');
      return false;
    }
  }

  /// Importe une personne spécifique
  Future<bool> importPersonFromJson(String jsonString) async {
    try {
      final json = jsonDecode(jsonString);
      final person = Person.fromJson(Map<String, dynamic>.from(json as Map));

      final people = await storageService.getPeople();
      
      // Mettre à jour ou ajouter
      final index = people.indexWhere((p) => p.id == person.id);
      if (index >= 0) {
        people[index] = person;
      } else {
        people.add(person);
      }

      await storageService.savePeople(people);
      return true;
    } catch (e) {
      print('Erreur import personne: $e');
      return false;
    }
  }

  /// Importe une assemblée
  Future<bool> importAssemblyFromJson(String jsonString) async {
    try {
      final json = jsonDecode(jsonString);
      final assembly = Assembly.fromJson(Map<String, dynamic>.from(json as Map));
      await storageService.saveAssembly(assembly);
      return true;
    } catch (e) {
      print('Erreur import assemblée: $e');
      return false;
    }
  }

  /// Exporte les données au format JSON
  Future<String> exportPeopleToJson() async {
    final people = await storageService.getPeople();
    return jsonEncode(people.map((p) => p.toJson()).toList());
  }

  /// Exporte l'assemblée au format JSON
  Future<String?> exportAssemblyToJson() async {
    final assembly = await storageService.getAssembly();
    if (assembly == null) return null;
    return jsonEncode(assembly.toJson());
  }

  /// Synchronise les données avec le backend Next.js
  /// Récupère les mises à jour et les traite
  Future<SyncResult> syncWithBackend() async {
    return await syncService.syncAll();
  }

  /// Vérifie s'il y a des mises à jour disponibles
  Future<int> checkForUpdates() async {
    final result = await syncService.fetchUpdates();
    return result.success ? result.jobs.length : 0;
  }
}
