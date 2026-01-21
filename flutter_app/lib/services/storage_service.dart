import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import '../models/person.dart';

const String _defaultApiBase = String.fromEnvironment('API_BASE', defaultValue: 'http://192.168.169.152:3000');

String _normalizeApiBase(String raw) {
  final trimmed = raw.trim();
  if (trimmed.isEmpty) return trimmed;

  try {
    final uri = Uri.parse(trimmed);
    final host = uri.host.toLowerCase();
    if ((host == 'localhost' || host == '127.0.0.1') && Platform.isAndroid) {
      return uri.replace(host: '10.0.2.2').toString();
    }
  } catch (_) {
    // Ignore parse errors; return raw.
  }
  return trimmed;
}

/// Retry avec backoff exponentiel
Future<T> _withRetry<T>(
  Future<T> Function() fn, {
  int maxRetries = 3,
  Duration initialDelay = const Duration(seconds: 2),
}) async {
  int attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (e) {
      attempt++;
      if (attempt > maxRetries) rethrow;
      
      final delayMs = initialDelay.inMilliseconds * (1 << (attempt - 1));
      if (kDebugMode) {
        print('⏳ Retry attempt $attempt/$maxRetries après ${delayMs}ms');
      }
      await Future.delayed(Duration(milliseconds: delayMs));
    }
  }
}

/// StorageService: accès simplifié à SharedPreferences avec
/// fallback de développement pour `config/local_users.json`.
class StorageService {
  static const String _peopleKey = 'people';
  static const String _assemblyKey = 'assembly';
  static const String _currentUserKey = 'current_user';
  static const String _authTokenKey = 'auth_token';
  static const String _preachingPrefix = 'preaching_';
  static const String _userOverridesKey = 'user_overrides';

  late SharedPreferences _prefs;

  // For diagnostics (which source provided the people list last)
  String _lastPeopleSource = 'unknown';
  int _lastPeopleCount = 0;

  String get lastPeopleSource => _lastPeopleSource;
  int get lastPeopleCount => _lastPeopleCount;

  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
    // Retenter d'envoyer les rapports en attente au démarrage
    await retryPendingReports();
  }

  Future<String> getEffectiveApiBase() async {
    final fromPrefs = _prefs.getString('api_base');
    return _normalizeApiBase(fromPrefs ?? _defaultApiBase);
  }

  // Append a small timestamped debug line into /sdcard/Download/gestionnaire_debug.txt
  Future<void> _appendDebug(String tag, String message) async {
    final timestamp = DateTime.now().toIso8601String();
    final line = '[$timestamp] $tag: $message\n';
    try {
      final file = File('/sdcard/Download/gestionnaire_debug.txt');
      await file.create(recursive: true);
      await file.writeAsString(line, mode: FileMode.append);
    } catch (e) {
      if (kDebugMode) print('StorageService: failed to write debug file: $e');
    }
  }

  // ===== PEOPLE =====
  Future<List<Person>> getPeople() async {
    await _appendDebug('getPeople', 'start');
    // 1) Essayer l'API distante (liste à jour avec PIN du web)
    try {
      final apiBase = await getEffectiveApiBase();
      final uri = Uri.parse('$apiBase/api/publisher-app/users/export');
      final resp = await http.get(uri).timeout(const Duration(seconds: 8));
      if (resp.statusCode == 200) {
        final decoded = jsonDecode(utf8.decode(resp.bodyBytes));
        if (decoded is Map && decoded['users'] is List) {
          final List<dynamic> list = decoded['users'] as List<dynamic>;
          final people = _applyOverridesToPeople(list.map((e) => Person.fromJson(Map<String, dynamic>.from(e as Map))).toList());
          if (kDebugMode) {
            print('StorageService: loaded people from remote API (${people.length})');
          }
          _lastPeopleSource = 'remote_api';
          _lastPeopleCount = people.length;
          try { await savePeople(people); } catch (_) {}
          await _appendDebug('getPeople', 'remote success count=${people.length}');
          return people;
        }
      }
    } catch (e) {
      if (kDebugMode) {
        print('StorageService: remote users fetch failed, fallback local. $e');
      }
      await _appendDebug('getPeople', 'remote failed: $e');
    }

    // Always prefer a local file when present (useful for dev/QA to sync from web list)
    try {
      // Try project-relative path (useful for desktop)
      final file = File('config/local_users.json');
      if (await file.exists()) {
        final content = await file.readAsString();
        final List<dynamic> jsonList = jsonDecode(content);
        final people = _applyOverridesToPeople(jsonList.map((e) => Person.fromJson(Map<String, dynamic>.from(e as Map))).toList());
        if (kDebugMode) {
          print('StorageService: loaded people from config/local_users.json');
        }
        _lastPeopleSource = 'local_config';
        _lastPeopleCount = people.length;
        try { await savePeople(people); } catch (_) {}
        await _appendDebug('getPeople', 'local_config count=${people.length}');
        return people;
      }

      // Try application documents directory (mobile)
      final docDir = await getApplicationDocumentsDirectory();
      final docFile = File('${docDir.path}/config/local_users.json');
      if (await docFile.exists()) {
        final content = await docFile.readAsString();
        final List<dynamic> jsonList = jsonDecode(content);
        final people = _applyOverridesToPeople(jsonList.map((e) => Person.fromJson(Map<String, dynamic>.from(e as Map))).toList());
        if (kDebugMode) {
          print('StorageService: loaded people from ${docFile.path}');
        }
        _lastPeopleSource = 'app_documents';
        _lastPeopleCount = people.length;
        try { await savePeople(people); } catch (_) {}
        await _appendDebug('getPeople', 'app_documents count=${people.length} path=${docFile.path}');
        return people;
      }

      // Try common Download folder on Android (/sdcard/Download/config)
      final sdFile = File('/sdcard/Download/config/local_users.json');
      if (await sdFile.exists()) {
        final content = await sdFile.readAsString();
        final List<dynamic> jsonList = jsonDecode(content);
        final people = _applyOverridesToPeople(jsonList.map((e) => Person.fromJson(Map<String, dynamic>.from(e as Map))).toList());
        if (kDebugMode) {
          print('StorageService: loaded people from ${sdFile.path}');
        }
        _lastPeopleSource = 'sdcard';
        _lastPeopleCount = people.length;
        try { await savePeople(people); } catch (_) {}
        await _appendDebug('getPeople', 'sdcard count=${people.length} path=${sdFile.path}');
        return people;
      }
    } catch (e) {
      if (kDebugMode) {
        print('StorageService: failed to read local_users.json: $e');
      }
    }

    // Try parent directory publisher-users.json (useful for Windows dev where app runs from flutter_app/)
    try {
      final parentFile = File('../data/publisher-users.json');
      if (await parentFile.exists()) {
        final content = await parentFile.readAsString();
        final List<dynamic> jsonList = jsonDecode(content);
        final people = _applyOverridesToPeople(jsonList.map((e) => Person.fromJson(Map<String, dynamic>.from(e as Map))).toList());
        if (kDebugMode) {
          print('StorageService: loaded people from parent ../data/publisher-users.json (${people.length})');
        }
        _lastPeopleSource = 'parent_data';
        _lastPeopleCount = people.length;
        try { await savePeople(people); } catch (_) {}
        await _appendDebug('getPeople', 'parent_data count=${people.length}');
        return people;
      }
    } catch (e) {
      if (kDebugMode) {
        print('StorageService: failed to read parent ../data/publisher-users.json: $e');
      }
    }

    // Next fallback: packaged asset (useful for release builds where no local file exists)
    try {
      await _appendDebug('getPeople', 'trying asset assets/data/publisher-users.json');
      // Import via rootBundle so this works in release mode
      final content = await rootBundle.loadString('assets/data/publisher-users.json');
      await _appendDebug('getPeople', 'asset loaded, decoding...');
      final List<dynamic> jsonList = jsonDecode(content);
      final people = _applyOverridesToPeople(jsonList.map((e) => Person.fromJson(Map<String, dynamic>.from(e as Map))).toList());
      if (kDebugMode) {
        print('StorageService: loaded people from asset assets/data/publisher-users.json (${people.length})');
      }
      _lastPeopleSource = 'asset';
      _lastPeopleCount = people.length;
      // Persist to SharedPreferences so subsequent runs pick it up reliably
      try {
        await savePeople(people);
        if (kDebugMode) print('StorageService: saved people to SharedPreferences from asset');
        await _appendDebug('getPeople', 'asset loaded and saved count=${people.length}');
      } catch (e) {
        if (kDebugMode) print('StorageService: failed to save people to prefs: $e');
        await _appendDebug('getPeople', 'asset loaded but save failed: $e');
      }
      return people;
    } catch (e) {
      if (kDebugMode) {
        print('StorageService: failed to read asset publisher-users.json: $e');
      }
      await _appendDebug('getPeople', 'asset load failed: $e');
    }

    // Fallback to SharedPreferences
    final jsonString = _prefs.getString(_peopleKey);
    if (jsonString == null) {
      _lastPeopleSource = 'none';
      _lastPeopleCount = 0;
      await _appendDebug('getPeople', 'prefs empty - returning 0');
      return [];
    }

    try {
      final List<dynamic> jsonList = jsonDecode(jsonString);
      final people = _applyOverridesToPeople(jsonList.map((e) => Person.fromJson(Map<String, dynamic>.from(e as Map))).toList());
      _lastPeopleSource = 'prefs';
      _lastPeopleCount = people.length;
      await _appendDebug('getPeople', 'prefs count=${people.length}');
      return people;
    } catch (e) {
      if (kDebugMode) print('StorageService: error decoding people: $e');
      _lastPeopleSource = 'prefs_corrupt';
      _lastPeopleCount = 0;
      await _appendDebug('getPeople', 'prefs corrupt: $e - falling back to asset');
      
      // Prefs corrupted, try to load from asset as fallback
      try {
        await _appendDebug('getPeople', 'trying asset as fallback after corrupt prefs');
        final content = await rootBundle.loadString('assets/data/publisher-users.json');
        final List<dynamic> jsonList = jsonDecode(content);
        final people = _applyOverridesToPeople(jsonList.map((e) => Person.fromJson(Map<String, dynamic>.from(e as Map))).toList());
        if (kDebugMode) {
          print('StorageService: loaded people from asset (fallback after corrupt prefs) (${people.length})');
        }
        _lastPeopleSource = 'asset_fallback';
        _lastPeopleCount = people.length;
        await _appendDebug('getPeople', 'asset fallback loaded count=${people.length}');
        return people;
      } catch (assetError) {
        if (kDebugMode) print('StorageService: asset fallback also failed: $assetError');
        await _appendDebug('getPeople', 'asset fallback also failed: $assetError');
      }
      return [];
    }
  }

  Future<void> savePeople(List<Person> people) async {
    final jsonString = jsonEncode(people.map((p) => p.toJson()).toList());
    await _prefs.setString(_peopleKey, jsonString);
    await _appendDebug('savePeople', 'saved count=${people.length}');
  }

  Map<String, dynamic> _loadUserOverrides() {
    final raw = _prefs.getString(_userOverridesKey);
    if (raw == null || raw.isEmpty) return <String, dynamic>{};
    try {
      final decoded = jsonDecode(raw);
      if (decoded is Map<String, dynamic>) return decoded;
    } catch (_) {}
    return <String, dynamic>{};
  }

  Future<void> _saveUserOverrides(Map<String, dynamic> overrides) async {
    await _prefs.setString(_userOverridesKey, jsonEncode(overrides));
  }

  Future<void> _upsertUserOverride(String userId, Map<String, dynamic> fields) async {
    final overrides = _loadUserOverrides();
    final existing = overrides[userId];
    final merged = <String, dynamic>{};
    if (existing is Map) {
      merged.addAll(existing.map((k, v) => MapEntry(k.toString(), v)));
    }
    merged.addAll(fields);
    overrides[userId] = merged;
    await _saveUserOverrides(overrides);
  }

  List<Person> _applyOverridesToPeople(List<Person> people) {
    final overrides = _loadUserOverrides();
    if (overrides.isEmpty) return people;

    Person apply(Person p) {
      final entry = overrides[p.id];
      if (entry is! Map) return p;
      final m = entry.map((k, v) => MapEntry(k.toString(), v));

      final email1 = (m['email1'] ?? p.email1).toString();
      final email2 = (m['email2'] ?? p.email2).toString();
      final mobilePhone = (m['mobilePhone'] ?? p.mobilePhone).toString();
      final homePhone = (m['homePhone'] ?? p.homePhone).toString();
      final workPhone = (m['workPhone'] ?? p.workPhone).toString();
      final address = (m['address'] ?? p.address).toString();

      EmergencyInfo emergency = p.emergency;
      final emergencyOverride = m['emergency'];
      if (emergencyOverride is Map) {
        final rawContacts = emergencyOverride['contacts'];
        if (rawContacts is List) {
          final contacts = rawContacts
              .whereType<Map>()
              .map((e) => EmergencyContact.fromJson(Map<String, dynamic>.from(e)))
              .toList();
          emergency = EmergencyInfo(
            personName: emergency.personName,
            notes: emergency.notes,
            disasterAccommodations: emergency.disasterAccommodations,
            contacts: contacts,
          );
        }
      }

      return Person(
        id: p.id,
        firstName: p.firstName,
        middleName: p.middleName,
        lastName: p.lastName,
        displayName: p.displayName,
        pin: p.pin,
        email1: email1,
        email2: email2,
        mobilePhone: mobilePhone,
        homePhone: homePhone,
        workPhone: workPhone,
        address: address,
        gender: p.gender,
        activity: p.activity,
        assignments: p.assignments,
        spiritual: p.spiritual,
        emergency: emergency,
        spiritual_active: p.spiritual_active,
        meetingParticipation: p.meetingParticipation,
      );
    }

    return people.map(apply).toList();
  }

  Future<void> _upsertPersonInPeopleCache(Person updated) async {
    final raw = _prefs.getString(_peopleKey);
    if (raw == null || raw.isEmpty) return;
    try {
      final decoded = jsonDecode(raw);
      if (decoded is! List) return;
      final list = decoded
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList();
      bool replaced = false;
      for (int i = 0; i < list.length; i++) {
        final id = (list[i]['id'] ?? '').toString();
        final pin = (list[i]['pin'] ?? '').toString();
        if (id == updated.id || (updated.pin.isNotEmpty && pin == updated.pin)) {
          list[i] = updated.toJson();
          replaced = true;
          break;
        }
      }
      if (!replaced) {
        list.add(updated.toJson());
      }
      await _prefs.setString(_peopleKey, jsonEncode(list));
    } catch (_) {}
  }

  /// Force le rechargement des données depuis les assets
  /// Utile pour mettre à jour les données après une synchronisation
  Future<List<Person>> forceReloadFromAssets() async {
    try {
      if (kDebugMode) print('StorageService: Force reload from assets...');
      await _appendDebug('forceReloadFromAssets', 'starting...');
      
      // Supprimer le cache SharedPreferences
      await _prefs.remove(_peopleKey);
      if (kDebugMode) print('StorageService: Cache cleared');
      
      // Charger depuis les assets
      final content = await rootBundle.loadString('assets/data/publisher-users.json');
      final List<dynamic> jsonList = jsonDecode(content);
      final people = jsonList.map((e) => Person.fromJson(Map<String, dynamic>.from(e as Map))).toList();
      
      if (kDebugMode) {
        print('StorageService: Loaded ${people.length} people from assets');
      }
      
      // Sauvegarder dans SharedPreferences pour les prochains chargements
      await savePeople(people);
      
      _lastPeopleSource = 'asset_forced';
      _lastPeopleCount = people.length;
      await _appendDebug('forceReloadFromAssets', 'completed count=${people.length}');
      
      return people;
    } catch (e) {
      if (kDebugMode) print('StorageService: Force reload failed: $e');
      await _appendDebug('forceReloadFromAssets', 'failed: $e');
      rethrow;
    }
  }

  Future<Person?> getPersonById(String id) async {
    final people = await getPeople();
    for (final p in people) {
      if (p.id == id) return p;
    }
    return null;
  }

  Future<Person?> getPersonByPin(String pin) async {
    final people = await getPeople();
    for (final p in people) {
      if (p.pin == pin) return p;
    }
    return null;
  }

  // ===== ASSEMBLY =====
  Future<Assembly?> getAssembly() async {
    // D'abord essayer SharedPreferences
    final jsonString = _prefs.getString(_assemblyKey);
    if (jsonString != null) {
      try {
        return Assembly.fromJson(Map<String, dynamic>.from(jsonDecode(jsonString) as Map));
      } catch (e) {
        if (kDebugMode) print('StorageService: error decoding assembly from prefs: $e');
      }
    }

    // Fallback: charger depuis config/local_assembly.json (dev/QA)
    try {
      final file = File('config/local_assembly.json');
      if (await file.exists()) {
        final content = await file.readAsString();
        final json = jsonDecode(content) as Map<String, dynamic>;
        final assembly = Assembly.fromJson(json);
        // Sauvegarder dans prefs pour les prochaines fois
        await saveAssembly(assembly);
        if (kDebugMode) {
          print('StorageService: loaded assembly from config/local_assembly.json');
        }
        return assembly;
      }
    } catch (e) {
      if (kDebugMode) {
        print('StorageService: failed to read local_assembly.json: $e');
      }
    }

    return null;
  }

  Future<void> saveAssembly(Assembly assembly) async {
    final jsonString = jsonEncode(assembly.toJson());
    await _prefs.setString(_assemblyKey, jsonString);
  }

  // ===== CURRENT USER =====
  Future<Person?> getCurrentUser() async {
    final jsonString = _prefs.getString(_currentUserKey);
    if (jsonString == null) return null;

    try {
      return Person.fromJson(Map<String, dynamic>.from(jsonDecode(jsonString) as Map));
    } catch (e) {
      if (kDebugMode) print('StorageService: error decoding current user: $e');
      return null;
    }
  }

  Future<void> setCurrentUser(Person? user) async {
    if (user == null) {
      await _prefs.remove(_currentUserKey);
    } else {
      final jsonString = jsonEncode(user.toJson());
      await _prefs.setString(_currentUserKey, jsonString);
    }
  }

  // ===== AUTH =====
  Future<String?> getAuthToken() async => _prefs.getString(_authTokenKey);

  Future<void> setAuthToken(String token) async {
    await _prefs.setString(_authTokenKey, token);
  }

  Future<void> clearAuthToken() async {
    await _prefs.remove(_authTokenKey);
  }

  // ===== API BASE =====
  Future<String?> getApiBase() async => _prefs.getString('api_base');

  Future<void> setApiBase(String apiBase) async {
    final normalized = _normalizeApiBase(apiBase);
    if (normalized.isEmpty) {
      await _prefs.remove('api_base');
      return;
    }
    await _prefs.setString('api_base', normalized);
  }

  // ===== PREACHING ACTIVITY =====
  Future<Map<String, dynamic>> getPreachingData(String userId) async {
    final key = '$_preachingPrefix$userId';
    final jsonString = _prefs.getString(key);
    if (jsonString == null) {
      return {
        'entries': <String, dynamic>{},
        'submitted': <String>[],
        'participated': <String, dynamic>{},
      };
    }
    try {
      final decoded = jsonDecode(jsonString);
      if (decoded is Map<String, dynamic>) {
        decoded['entries'] ??= <String, dynamic>{};
        decoded['submitted'] ??= <String>[];
        decoded['participated'] ??= <String, dynamic>{};
        return decoded;
      }
      return {
        'entries': <String, dynamic>{},
        'submitted': <String>[],
        'participated': <String, dynamic>{},
      };
    } catch (e) {
      if (kDebugMode) {
        print('StorageService: error decoding preaching data: $e');
      }
      return {
        'entries': <String, dynamic>{},
        'submitted': <String>[],
        'participated': <String, dynamic>{},
      };
    }
  }

  Future<void> savePreachingData(
      String userId, Map<String, dynamic> payload) async {
    final key = '$_preachingPrefix$userId';
    final jsonString = jsonEncode(payload);
    await _prefs.setString(key, jsonString);
  }

  /// Envoie le rapport de prédication au backend (optionnel selon la config).
  Future<bool> sendPreachingReport({
    required String userId,
    required String month,
    required Map<String, dynamic> entries,
    required Map<String, dynamic> totals,
    required bool didPreach,
    required String? pin,
  }) async {
    final apiBase = await getEffectiveApiBase();
    if (kDebugMode) {
      print('📤 StorageService: Attempting to send report to: $apiBase');
      print('📤 StorageService: API base is empty: ${apiBase.isEmpty}');
      print('📤 StorageService: PIN is empty: ${pin == null || pin.isEmpty}');
    }
    if (apiBase.isEmpty || pin == null || pin.isEmpty) {
      if (kDebugMode) print('❌ StorageService: Missing API base or PIN');
      return false;
    }
    
    try {
      final uri = Uri.parse('$apiBase/api/publisher-app/activity');
      final body = {
        'userId': userId,
        'pin': pin,
        'month': month,
        'didPreach': didPreach,
        'submitted': true,
        'entries': entries,
        'totals': totals,
      };

      if (kDebugMode) {
        print('📤 StorageService: Sending POST to $uri');
        print('📤 StorageService: Body keys: ${body.keys.join(", ")}');
      }

      // 🔄 Retry AGRESSIF: 5 tentatives avec backoff plus long (3s→6s→12s→24s→48s)
      final resp = await _withRetry(
        () => http
            .post(uri,
                headers: {'content-type': 'application/json'},
                body: jsonEncode(body))
            .timeout(const Duration(seconds: 30)), // 30s timeout pour connexions lentes
        maxRetries: 5,
        initialDelay: const Duration(seconds: 3), // Plus de délai initial
      );

      if (resp.statusCode >= 200 && resp.statusCode < 300) {
        if (kDebugMode) {
          print('✅ StorageService: ✓ preaching report sent successfully for $month');
          print('   Response: ${resp.body}');
        }
        // Supprimer du file d'attente s'il existe
        await _removePendingReport(userId, month);
        return true;
      }
      if (kDebugMode) {
        print('❌ StorageService: ✗ preaching report send failed');
        print('   Status: ${resp.statusCode}');
        print('   Body: ${resp.body}');
      }
      // Persister le rapport non envoyé pour retry plus tard
      await _savePendingReport(userId, month, body);
      return false;
    } catch (e) {
      if (kDebugMode) {
        print('❌ StorageService: ✗ preaching report send error: $e');
        print('   Type: ${e.runtimeType}');
      }
      // Persister le rapport en attente pour retry plus tard
      await _savePendingReport(userId, month, {
        'userId': userId,
        'pin': pin,
        'month': month,
        'didPreach': didPreach,
        'submitted': true,
        'entries': entries,
        'totals': totals,
      });
      return false;
    }
  }

  /// Persiste un rapport qui n'a pas pu être envoyé pour retry plus tard
  Future<void> _savePendingReport(String userId, String month, Map<String, dynamic> body) async {
    try {
      final pending = _prefs.getStringList('pending_reports') ?? [];
      final reportKey = '$userId:$month';
      // Éviter les doublons
      final filtered = pending.where((r) => !r.startsWith('$userId:$month:')).toList();
      filtered.add('$reportKey:${jsonEncode(body)}');
      await _prefs.setStringList('pending_reports', filtered);
      if (kDebugMode) print('💾 StorageService: Saved pending report for retry: $reportKey');
    } catch (e) {
      if (kDebugMode) print('⚠️ StorageService: Failed to save pending report: $e');
    }
  }

  /// Supprime un rapport de la file d'attente après envoi réussi
  Future<void> _removePendingReport(String userId, String month) async {
    try {
      final pending = _prefs.getStringList('pending_reports') ?? [];
      final filtered = pending.where((r) => !r.startsWith('$userId:$month:')).toList();
      if (filtered.length < pending.length) {
        await _prefs.setStringList('pending_reports', filtered);
        if (kDebugMode) print('🗑️ StorageService: Removed pending report from queue: $userId:$month');
      }
    } catch (e) {
      if (kDebugMode) print('⚠️ StorageService: Failed to remove pending report: $e');
    }
  }

  /// Retente d'envoyer tous les rapports en attente (appelé au démarrage de l'app)
  Future<void> retryPendingReports() async {
    try {
      final pending = _prefs.getStringList('pending_reports') ?? [];
      if (pending.isEmpty) return;
      
      if (kDebugMode) print('🔄 StorageService: Retrying ${pending.length} pending report(s)');
      
      for (final item in pending) {
        final parts = item.split(':');
        if (parts.length >= 3) {
          final userId = parts[0];
          final month = parts[1];
          try {
            final bodyJson = jsonDecode(item.substring(item.indexOf(':') + 1 + month.length + 1));
            await sendPreachingReport(
              userId: userId,
              month: month,
              entries: bodyJson['entries'] ?? {},
              totals: bodyJson['totals'] ?? {},
              didPreach: bodyJson['didPreach'] ?? false,
              pin: bodyJson['pin'],
            );
          } catch (e) {
            if (kDebugMode) print('⚠️ StorageService: Retry failed for $userId:$month - $e');
          }
        }
      }
    } catch (e) {
      if (kDebugMode) print('⚠️ StorageService: Error during pending reports retry: $e');
    }
  }

  /// Envoi admin (ancien/assistant) pour un autre proclamateur via override.
  Future<bool> sendPreachingReportForUser({
    required String targetUserId,
    required String month,
    required Map<String, dynamic> entries,
    required Map<String, dynamic> totals,
    required bool didPreach,
    required String actorId,
    required String actorPin,
  }) async {
    final apiBase = await getEffectiveApiBase();
    if (kDebugMode) {
      print('📤 StorageService: Attempting to send delegate report to: $apiBase');
      print('📤 StorageService: Actor: $actorId, Target: $targetUserId, Month: $month');
      print('📤 StorageService: API base is empty: ${apiBase.isEmpty}');
      print('📤 StorageService: Actor PIN is empty: ${actorPin.isEmpty}');
    }
    if (apiBase.isEmpty || actorPin.isEmpty) return false;
    
    try {
      final uri = Uri.parse('$apiBase/api/publisher-app/activity');
      if (kDebugMode) {
        print('📤 StorageService: Sending POST to $uri');
      }
      final body = {
        'userId': targetUserId,
        'month': month,
        'didPreach': didPreach,
        'submitted': true,
        'entries': entries,
        'totals': totals,
        'adminOverride': {
          'actorId': actorId,
          'actorPin': actorPin,
        },
      };

      // 🔄 Retry AGRESSIF: 5 tentatives avec backoff plus long
      final resp = await _withRetry(
        () => http
            .post(uri,
                headers: {'content-type': 'application/json'},
                body: jsonEncode(body))
            .timeout(const Duration(seconds: 30)), // 30s timeout pour connexions lentes
        maxRetries: 5,
        initialDelay: const Duration(seconds: 3),
      );

      if (resp.statusCode >= 200 && resp.statusCode < 300) {
        if (kDebugMode) {
          print('✅ StorageService: ✓ admin preaching report sent for $targetUserId / $month');
        }
        await _removePendingReport(targetUserId, month);
        return true;
      }
      if (kDebugMode) {
        print('❌ StorageService: ✗ admin send failed');
        print('   Status: ${resp.statusCode}');
        print('   Body: ${resp.body}');
      }
      return false;
    } catch (e) {
      if (kDebugMode) {
        print('❌ StorageService: ✗ admin send error: $e');
        print('   Type: ${e.runtimeType}');
      }
      return false;
    }
  }

  // ===== CLEAR ALL =====
  Future<void> clearAll() async {
    await _prefs.clear();
  }

  // ===== SAUVEGARDE DANS LES FICHIERS ASSETS =====
  /// Sauvegarde les données dans un fichier assets pour persistance permanente
  Future<bool> saveToAssetsFile(String filename, Map<String, dynamic> data) async {
    try {
      // Sur mobile, utiliser le répertoire de l'application
      if (Platform.isAndroid || Platform.isIOS) {
        final directory = await getApplicationDocumentsDirectory();
        final file = File('${directory.path}/$filename');
        await file.writeAsString(jsonEncode(data));
        if (kDebugMode) {
          print('StorageService: saved to ${file.path}');
        }
        return true;
      }
      
      // Sur desktop (Windows, etc.), écrire directement dans assets/data
      final file = File('assets/data/$filename');
      await file.writeAsString(const JsonEncoder.withIndent('  ').convert(data));
      if (kDebugMode) {
        print('StorageService: saved to assets/data/$filename');
      }
      return true;
    } catch (e) {
      if (kDebugMode) {
        print('StorageService: failed to save to assets file: $e');
      }
      return false;
    }
  }

  /// Charge les données depuis un fichier assets
  Future<Map<String, dynamic>?> loadFromAssetsFile(String filename) async {
    try {
      // Sur mobile, utiliser le répertoire de l'application
      if (Platform.isAndroid || Platform.isIOS) {
        final directory = await getApplicationDocumentsDirectory();
        final file = File('${directory.path}/$filename');
        if (await file.exists()) {
          final content = await file.readAsString();
          return jsonDecode(content) as Map<String, dynamic>;
        }
      } else {
        // Sur desktop
        final file = File('assets/data/$filename');
        if (await file.exists()) {
          final content = await file.readAsString();
          return jsonDecode(content) as Map<String, dynamic>;
        }
      }
    } catch (e) {
      if (kDebugMode) {
        print('StorageService: failed to load from assets file: $e');
      }
    }
    return null;
  }

  // ===== UPDATE USER EMERGENCY CONTACTS =====
  /// Met à jour uniquement les contacts d'urgence de l'utilisateur connecté
  Future<bool> updateEmergencyContacts({
    required String userId,
    required String pin,
    required List<EmergencyContact> emergencyContacts,
  }) async {
    // Récupérer l'utilisateur actuel
    final currentUser = await getCurrentUser();
    if (currentUser == null || currentUser.id != userId) return false;

    // Envoyer au backend via SyncService pour synchronisation avec Publisher App
    final apiBase = await getEffectiveApiBase();
    if (apiBase.isNotEmpty && pin.isNotEmpty) {
      try {
        final uri = Uri.parse('$apiBase/api/publisher-app/incoming');
        
        // Charger les credentials pour l'authentification
        String? deviceId;
        String? apiKey;
        try {
          final prefs = await SharedPreferences.getInstance();
          deviceId = prefs.getString('sync_device_id') ?? 'mobile-main';
          apiKey = prefs.getString('sync_api_key') ?? 'mobile-secret-key-456';
        } catch (e) {
          deviceId = 'mobile-main';
          apiKey = 'mobile-secret-key-456';
        }
        
        final body = {
          'type': 'emergency_contacts',
          'payload': {
            'userId': userId,
            'emergency': {
              'personName': currentUser.emergency.personName,
              'notes': currentUser.emergency.notes,
              'disasterAccommodations': currentUser.emergency.disasterAccommodations,
              'contacts': emergencyContacts.map((c) => c.toJson()).toList(),
            },
          },
          'initiator': currentUser.displayName,
          'notify': true,
        };
        
        final headers = {
          'Content-Type': 'application/json',
          'X-Device-Id': deviceId,
          'X-Api-Key': apiKey,
        };
        
        final resp = await http
            .post(uri,
                headers: headers,
                body: jsonEncode(body))
            .timeout(const Duration(seconds: 15));
            
        if (resp.statusCode >= 200 && resp.statusCode < 300) {
          if (kDebugMode) {
            print('✅ StorageService: emergency contacts sent to Publisher App for $userId');
          }
          return true;
        } else {
          if (kDebugMode) {
            print('❌ StorageService: emergency contacts sync failed (${resp.statusCode}) ${resp.body}');
          }
        }
      } catch (e) {
        if (kDebugMode) {
          print('❌ StorageService: emergency contacts sync error: $e');
        }
      }
    }

    // Sauvegarder localement
    final updatedUser = Person(
      id: currentUser.id,
      firstName: currentUser.firstName,
      middleName: currentUser.middleName,
      lastName: currentUser.lastName,
      displayName: currentUser.displayName,
      pin: currentUser.pin,
      email1: currentUser.email1,
      email2: currentUser.email2,
      mobilePhone: currentUser.mobilePhone,
      homePhone: currentUser.homePhone,
      workPhone: currentUser.workPhone,
      address: currentUser.address,
      gender: currentUser.gender,
      activity: currentUser.activity,
      assignments: currentUser.assignments,
      spiritual: currentUser.spiritual,
      emergency: EmergencyInfo(
        personName: currentUser.emergency.personName,
        notes: currentUser.emergency.notes,
        disasterAccommodations: currentUser.emergency.disasterAccommodations,
        contacts: emergencyContacts,
      ),
      spiritual_active: currentUser.spiritual_active,
      meetingParticipation: currentUser.meetingParticipation,
    );

    await setCurrentUser(updatedUser);
    await _upsertUserOverride(userId, {
      'emergency': {
        'contacts': emergencyContacts.map((c) => c.toJson()).toList(),
      },
    });
    await _upsertPersonInPeopleCache(updatedUser);
    return true;
  }

  Future<bool> updatePersonalInfo({
    required String userId,
    required String pin,
    required String email1,
    required String email2,
    required String mobilePhone,
    required String homePhone,
    required String workPhone,
    required String address,
  }) async {
    // Récupérer l'utilisateur actuel
    final currentUser = await getCurrentUser();
    if (currentUser == null || currentUser.id != userId) return false;

    // Envoyer au backend si disponible
    final apiBase = await getEffectiveApiBase();
    if (apiBase.isNotEmpty && pin.isNotEmpty) {
      try {
        final uri = Uri.parse('$apiBase/api/publisher-app/personal-info');
        final body = {
          'userId': userId,
          'pin': pin,
          'email1': email1,
          'email2': email2,
          'mobilePhone': mobilePhone,
          'homePhone': homePhone,
          'workPhone': workPhone,
          'address': address,
        };
        final resp = await http
            .post(uri,
                headers: {'content-type': 'application/json'},
                body: jsonEncode(body))
            .timeout(const Duration(seconds: 10));
        if (resp.statusCode >= 200 && resp.statusCode < 300) {
          if (kDebugMode) {
            print('StorageService: personal info updated on server for $userId');
          }
        } else {
          if (kDebugMode) {
            print('StorageService: personal info update failed (${resp.statusCode}) ${resp.body}');
          }
        }
      } catch (e) {
        if (kDebugMode) {
          print('StorageService: personal info update error (will save locally): $e');
        }
      }
    }

    // Sauvegarder localement
    final updatedUser = Person(
      id: currentUser.id,
      firstName: currentUser.firstName,
      middleName: currentUser.middleName,
      lastName: currentUser.lastName,
      displayName: currentUser.displayName,
      pin: currentUser.pin,
      email1: email1,
      email2: email2,
      mobilePhone: mobilePhone,
      homePhone: homePhone,
      workPhone: workPhone,
      address: address,
      gender: currentUser.gender,
      activity: currentUser.activity,
      assignments: currentUser.assignments,
      spiritual: currentUser.spiritual,
      emergency: currentUser.emergency,
      spiritual_active: currentUser.spiritual_active,
      meetingParticipation: currentUser.meetingParticipation,
    );

    await setCurrentUser(updatedUser);
    await _upsertUserOverride(userId, {
      'email1': email1,
      'email2': email2,
      'mobilePhone': mobilePhone,
      'homePhone': homePhone,
      'workPhone': workPhone,
      'address': address,
    });
    await _upsertPersonInPeopleCache(updatedUser);
    return true;
  }

  /// Mise à jour des informations personnelles pour un autre utilisateur (par un ancien).
  /// - Envoi au backend avec `adminOverride` si possible.
  /// - Persistance locale via overrides + cache people.
  Future<bool> updatePersonalInfoForUser({
    required String targetUserId,
    required String actorId,
    required String actorPin,
    required String email1,
    required String email2,
    required String mobilePhone,
    required String homePhone,
    required String workPhone,
    required String address,
  }) async {
    // Try sending to backend (best effort)
    final apiBase = await getEffectiveApiBase();
    if (apiBase.isNotEmpty && actorPin.isNotEmpty) {
      try {
        final uri = Uri.parse('$apiBase/api/publisher-app/personal-info');
        final body = {
          'userId': targetUserId,
          // Some backends still expect a pin field; we provide actorPin for admin override.
          'pin': actorPin,
          'email1': email1,
          'email2': email2,
          'mobilePhone': mobilePhone,
          'homePhone': homePhone,
          'workPhone': workPhone,
          'address': address,
          'adminOverride': {
            'actorId': actorId,
            'actorPin': actorPin,
          },
        };
        final resp = await http
            .post(uri,
                headers: {'content-type': 'application/json'},
                body: jsonEncode(body))
            .timeout(const Duration(seconds: 10));
        if (kDebugMode) {
          print('StorageService: admin personal info update status=${resp.statusCode}');
        }
      } catch (e) {
        if (kDebugMode) {
          print('StorageService: admin personal info update error (will save locally): $e');
        }
      }
    }

    await _upsertUserOverride(targetUserId, {
      'email1': email1,
      'email2': email2,
      'mobilePhone': mobilePhone,
      'homePhone': homePhone,
      'workPhone': workPhone,
      'address': address,
    });

    // Update people cache if we can find the person in cache
    final person = await getPersonById(targetUserId);
    if (person != null) {
      final updatedUser = Person(
        id: person.id,
        firstName: person.firstName,
        middleName: person.middleName,
        lastName: person.lastName,
        displayName: person.displayName,
        pin: person.pin,
        email1: email1,
        email2: email2,
        mobilePhone: mobilePhone,
        homePhone: homePhone,
        workPhone: workPhone,
        address: address,
        gender: person.gender,
        activity: person.activity,
        assignments: person.assignments,
        spiritual: person.spiritual,
        emergency: person.emergency,
        spiritual_active: person.spiritual_active,
        meetingParticipation: person.meetingParticipation,
      );
      await _upsertPersonInPeopleCache(updatedUser);
      final current = await getCurrentUser();
      if (current != null && current.id == targetUserId) {
        await setCurrentUser(updatedUser);
      }
    }

    return true;
  }

  // ===== WEEKLY DATA =====
  Future<Map<String, dynamic>> getWeeklyData(String weekId) async {
    final key = 'week_$weekId';
    final jsonString = _prefs.getString(key);
    if (jsonString == null) return {};

    try {
      final decoded = jsonDecode(jsonString);
      if (decoded is Map<String, dynamic>) return decoded;
      return {};
    } catch (e) {
      if (kDebugMode) print('StorageService: error decoding weekly data: $e');
      return {};
    }
  }

  Future<void> saveWeeklyData(String weekId, Map<String, dynamic> data) async {
    final key = 'week_$weekId';
    final jsonString = jsonEncode(data);
    await _prefs.setString(key, jsonString);
  }

  // ===== GENERIC DATA (for sync) =====
  /// Sauvegarde des données génériques par clé (utilisé par SyncService)
  Future<void> saveGenericData(String key, Map<String, dynamic> data) async {
    final prefixedKey = 'sync_$key';
    final jsonString = jsonEncode(data);
    await _prefs.setString(prefixedKey, jsonString);
    if (kDebugMode) {
      print('StorageService: saved generic data to $prefixedKey');
    }
  }

  /// Récupère des données génériques par clé
  /// Cherche d'abord dans les fichiers locaux, puis dans SharedPreferences
  Future<Map<String, dynamic>?> getGenericData(String key) async {
    // Try loading from local file first (for desktop/dev mode)
    final possiblePaths = [
      'assets/data/$key.json',
      '${Directory.current.path}/assets/data/$key.json',
      '${Directory.current.path}/flutter_app/assets/data/$key.json',
    ];
    
    for (final filePath in possiblePaths) {
      try {
        final file = File(filePath);
        if (await file.exists()) {
          final content = await file.readAsString();
          final decoded = jsonDecode(content);
          if (decoded is Map<String, dynamic>) {
            if (kDebugMode) {
              print('StorageService: loaded $key from file: $filePath');
            }
            return decoded;
          }
        }
      } catch (e) {
        // Continue to next path
      }
    }
    
    // Fallback to SharedPreferences
    final prefixedKey = 'sync_$key';
    final jsonString = _prefs.getString(prefixedKey);
    if (jsonString == null) return null;

    try {
      final decoded = jsonDecode(jsonString);
      if (decoded is Map<String, dynamic>) {
        if (kDebugMode) {
          print('StorageService: loaded $key from SharedPreferences');
        }
        return decoded;
      }
      return null;
    } catch (e) {
      if (kDebugMode) {
        print('StorageService: error decoding generic data $key: $e');
      }
      return null;
    }
  }

  /// Liste toutes les clés de données synchronisées
  Future<List<String>> listSyncKeys() async {
    final keys = _prefs.getKeys();
    return keys
        .where((k) => k.startsWith('sync_'))
        .map((k) => k.substring(5)) // Remove 'sync_' prefix
        .toList();
  }

  /// Supprime des données synchronisées par clé
  Future<void> removeGenericData(String key) async {
    final prefixedKey = 'sync_$key';
    await _prefs.remove(prefixedKey);
  }
}
