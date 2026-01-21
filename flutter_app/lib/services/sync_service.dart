import 'dart:convert';
import 'dart:io';
import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:path_provider/path_provider.dart';
import 'storage_service.dart';

const String _defaultApiBase = String.fromEnvironment('API_BASE', defaultValue: 'http://192.168.169.152:3000'); // ✅ URL correcte - Mise à jour Jan 2026

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

/// Credentials pour l'authentification avec le backend
class SyncCredentials {
  final String deviceId;
  final String apiKey;
  final String apiBase;

  SyncCredentials({
    required this.deviceId,
    required this.apiKey,
    required this.apiBase,
  });

  factory SyncCredentials.fromJson(Map<String, dynamic> json) {
    return SyncCredentials(
      deviceId: json['deviceId'] as String? ?? 'mobile-main',
      apiKey: json['apiKey'] as String? ?? '',
      apiBase: _normalizeApiBase(json['apiBase'] as String? ?? _defaultApiBase),
    );
  }

  SyncCredentials copyWith({
    String? deviceId,
    String? apiKey,
    String? apiBase,
  }) {
    return SyncCredentials(
      deviceId: deviceId ?? this.deviceId,
      apiKey: apiKey ?? this.apiKey,
      apiBase: apiBase ?? this.apiBase,
    );
  }

  /// Charge les credentials depuis config/sync_credentials.json ou assets
  static Future<SyncCredentials> load() async {
    // 1) Read optional SharedPreferences override (do not discard apiKey/deviceId)
    String? apiBasePref;
    try {
      final prefs = await SharedPreferences.getInstance();
      final value = prefs.getString('api_base');
      if (value != null && value.trim().isNotEmpty) {
        apiBasePref = value.trim();
      }
    } catch (_) {}

    // 2) Essayer de charger depuis le système de fichiers (desktop/debug)
    SyncCredentials? loaded;
    try {
      final file = File('config/sync_credentials.json');
      if (await file.exists()) {
        final content = await file.readAsString();
        final json = jsonDecode(content) as Map<String, dynamic>;
        if (kDebugMode) {
          print('SyncCredentials: loaded from config/sync_credentials.json');
        }
        loaded = SyncCredentials.fromJson(json);
      }

      // Try application document dir
      if (loaded == null) {
        final docDir = await getApplicationDocumentsDirectory();
        final docFile = File('${docDir.path}/config/sync_credentials.json');
        if (await docFile.exists()) {
          final content = await docFile.readAsString();
          final json = jsonDecode(content) as Map<String, dynamic>;
          if (kDebugMode) {
            print('SyncCredentials: loaded from ${docFile.path}');
          }
          loaded = SyncCredentials.fromJson(json);
        }
      }

      // Try Download folder on Android
      if (loaded == null) {
        final sdFile = File('/sdcard/Download/config/sync_credentials.json');
        if (await sdFile.exists()) {
          final content = await sdFile.readAsString();
          final json = jsonDecode(content) as Map<String, dynamic>;
          if (kDebugMode) {
            print('SyncCredentials: loaded from ${sdFile.path}');
          }
          loaded = SyncCredentials.fromJson(json);
        }
      }
    } catch (e) {
      if (kDebugMode) {
        print('SyncCredentials: file system load failed: $e');
      }
    }
    
    // 3) Essayer de charger depuis les assets Flutter (mobile)
    if (loaded == null) {
      try {
        final content = await rootBundle.loadString('assets/data/sync_credentials.json');
        final json = jsonDecode(content) as Map<String, dynamic>;
        if (kDebugMode) {
          print('SyncCredentials: loaded from assets/data/sync_credentials.json');
        }
        loaded = SyncCredentials.fromJson(json);
      } catch (e) {
        if (kDebugMode) {
          print('SyncCredentials: asset load failed: $e');
        }
      }
    }
    
    // 4) Fallback par défaut
    loaded ??= SyncCredentials(
      deviceId: 'mobile-main',
      apiKey: 'mobile-secret-key-456',
      apiBase: _defaultApiBase,
    );

    // 5) Apply apiBase override from prefs (if any)
    if (apiBasePref != null) {
      if (kDebugMode) print('SyncCredentials: overriding apiBase from prefs: $apiBasePref');
      loaded = loaded.copyWith(apiBase: _normalizeApiBase(apiBasePref));
    }

    return loaded;
  }

  /// Génère les headers d'authentification
  /// Generate authentication headers used by the backend validation.
  ///
  /// Server-side algorithm:
  ///  secret = SHA256(apiKey) (hex)
  ///  payload = "METHOD\n/PATH[?query]\nTIMESTAMP"
  ///  signature = HMAC-SHA256(payload, secret)
  Map<String, String> generateAuthHeaders({String method = 'GET', Uri? uri}) {
    final timestamp = DateTime.now().millisecondsSinceEpoch.toString();

    final pathAndQuery = uri == null
        ? '/'
        : '${uri.path}${uri.hasQuery ? '?${uri.query}' : ''}';

    final payload = '${method.toUpperCase()}\n$pathAndQuery\n$timestamp';

    // The server expects the HMAC key to be the SHA256 hex of the API key
    final hashedKey = sha256.convert(utf8.encode(apiKey)).toString();
    final hmacSha256 = Hmac(sha256, utf8.encode(hashedKey));
    final signature = hmacSha256.convert(utf8.encode(payload)).toString();

    return {
      'x-device-id': deviceId,
      'x-api-key': apiKey,
      'x-timestamp': timestamp,
      'x-signature': signature,
      'Content-Type': 'application/json',
    };
  }
}

/// Types de synchronisation supportés
enum SyncJobType {
  programmeWeek,
  programmeWeekend,
  predication,
  temoignagePublic,
  services,
  rapports,
  assistance,
  communications,
  taches,
  territories,
  emergencyContacts,
}

/// Statut d'un job de synchronisation
enum SyncJobStatus {
  pending,
  sent,
  processed,
  failed,
}

/// Un job de synchronisation reçu du backend
class SyncJob {
  final String id;
  final SyncJobType type;
  final String direction;
  final Map<String, dynamic> payload;
  final SyncJobStatus status;
  final String? initiator;
  final bool notify;
  final DateTime createdAt;
  final DateTime updatedAt;

  SyncJob({
    required this.id,
    required this.type,
    required this.direction,
    required this.payload,
    required this.status,
    this.initiator,
    required this.notify,
    required this.createdAt,
    required this.updatedAt,
  });

  factory SyncJob.fromJson(Map<String, dynamic> json) {
    return SyncJob(
      id: json['id'] as String,
      type: _parseJobType(json['type'] as String),
      direction: json['direction'] as String,
      payload: json['payload'] is Map<String, dynamic>
          ? json['payload'] as Map<String, dynamic>
          : {},
      status: _parseJobStatus(json['status'] as String),
      initiator: json['initiator'] as String?,
      notify: json['notify'] == true,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  static SyncJobType _parseJobType(String type) {
    switch (type) {
      case 'programme_week':
        return SyncJobType.programmeWeek;
      case 'programme_weekend':
        return SyncJobType.programmeWeekend;
      case 'predication':
        return SyncJobType.predication;
      case 'temoignage_public':
        return SyncJobType.temoignagePublic;
      case 'services':
        return SyncJobType.services;
      case 'rapports':
        return SyncJobType.rapports;
      case 'assistance':
        return SyncJobType.assistance;
      case 'communications':
        return SyncJobType.communications;
      case 'taches':
        return SyncJobType.taches;
      case 'territories':
        return SyncJobType.territories;
      case 'emergency_contacts':
        return SyncJobType.emergencyContacts;
      default:
        return SyncJobType.communications;
    }
  }

  static SyncJobStatus _parseJobStatus(String status) {
    switch (status) {
      case 'pending':
        return SyncJobStatus.pending;
      case 'sent':
        return SyncJobStatus.sent;
      case 'processed':
        return SyncJobStatus.processed;
      case 'failed':
        return SyncJobStatus.failed;
      default:
        return SyncJobStatus.pending;
    }
  }

  static String _jobTypeToString(SyncJobType type) {
    switch (type) {
      case SyncJobType.programmeWeek:
        return 'programme_week';
      case SyncJobType.programmeWeekend:
        return 'programme_weekend';
      case SyncJobType.predication:
        return 'predication';
      case SyncJobType.temoignagePublic:
        return 'temoignage_public';
      case SyncJobType.services:
        return 'services';
      case SyncJobType.rapports:
        return 'rapports';
      case SyncJobType.assistance:
        return 'assistance';
      case SyncJobType.communications:
        return 'communications';
      case SyncJobType.taches:
        return 'taches';
      case SyncJobType.territories:
        return 'territories';
      case SyncJobType.emergencyContacts:
        return 'emergency_contacts';
    }
  }
}

/// Résultat d'une synchronisation
class SyncResult {
  final bool success;
  final int jobsProcessed;
  final List<String> errors;
  final List<SyncJob> jobs;

  SyncResult({
    required this.success,
    required this.jobsProcessed,
    this.errors = const [],
    this.jobs = const [],
  });
}

/// Service de synchronisation avec le backend Next.js
class SyncService {
  final StorageService storageService;
  SyncCredentials? _credentials;
  
  DateTime? _lastSyncTime;
  bool _isSyncing = false;
  bool _initialized = false;

  SyncService(this.storageService);

  /// Initialise le service avec les credentials
  Future<void> init() async {
    if (_initialized) return;
    _credentials = await SyncCredentials.load();
    _initialized = true;
    if (kDebugMode) {
      print('SyncService: initialized with device ${_credentials?.deviceId}');
    }
  }

  String get _apiBase => _normalizeApiBase(_credentials?.apiBase ?? _defaultApiBase);

  /// Vérifie si une synchronisation est en cours
  bool get isSyncing => _isSyncing;

  /// Dernière synchronisation réussie
  DateTime? get lastSyncTime => _lastSyncTime;

  /// Récupère les mises à jour depuis le backend
  Future<SyncResult> fetchUpdates({
    List<SyncJobType>? types,
    DateTime? since,
  }) async {
    await init();
    
    if (_isSyncing) {
      return SyncResult(
        success: false,
        jobsProcessed: 0,
        errors: ['Synchronisation déjà en cours'],
      );
    }

    _isSyncing = true;
    final errors = <String>[];
    final jobs = <SyncJob>[];

    try {
      // Construire l'URL avec les paramètres
      final uri = Uri.parse('$_apiBase/api/publisher-app/updates').replace(
        queryParameters: {
          if (types != null && types.isNotEmpty)
            'type': types.map((t) => SyncJob._jobTypeToString(t)).join(','),
          if (since != null) 'since': since.toIso8601String(),
        },
      );

      if (kDebugMode) {
        print('SyncService: fetching updates from $uri');
      }

      // Générer les headers d'authentification
      final headers = _credentials?.generateAuthHeaders(method: 'GET', uri: uri) ?? {};
      
      final response = await http.get(uri, headers: headers).timeout(const Duration(seconds: 15));

      if (response.statusCode != 200) {
        final body = utf8.decode(response.bodyBytes);
        if (kDebugMode) {
          print('SyncService: server error ${response.statusCode} - $body');
        }
        return SyncResult(
          success: false,
          jobsProcessed: 0,
          errors: [
            'Serveur ${response.statusCode} sur ${uri.path}: ${body.isEmpty ? '(vide)' : body}',
            'API Base: $_apiBase',
          ],
        );
      }

      final data = jsonDecode(utf8.decode(response.bodyBytes));
      
      if (data is Map && data['jobs'] is List) {
        for (final jobJson in data['jobs'] as List) {
          try {
            final job = SyncJob.fromJson(Map<String, dynamic>.from(jobJson as Map));
            jobs.add(job);
          } catch (e) {
            if (kDebugMode) {
              print('SyncService: failed to parse job: $e');
            }
            errors.add('Erreur parsing job: $e');
          }
        }
      }

      if (kDebugMode) {
        print('SyncService: fetched ${jobs.length} jobs');
      }

      return SyncResult(
        success: true,
        jobsProcessed: jobs.length,
        errors: errors,
        jobs: jobs,
      );
    } catch (e) {
      if (kDebugMode) {
        print('SyncService: fetch updates failed: $e');
      }
      return SyncResult(
        success: false,
        jobsProcessed: 0,
        errors: ['Erreur de synchronisation (API: $_apiBase): $e'],
      );
    } finally {
      _isSyncing = false;
    }
  }

  /// Annule tous les jobs en attente
  Future<void> clearAllPendingJobs() async {
    await init();
    
    try {
      // Récupérer tous les jobs en attente
      final result = await fetchUpdates();
      
      // Acknowledger chaque job pour le marquer comme traité
      for (final job in result.jobs) {
        await acknowledgeJob(job.id);
      }
      
      if (kDebugMode) {
        print('SyncService: cleared ${result.jobs.length} pending jobs');
      }
    } catch (e) {
      if (kDebugMode) {
        print('SyncService: failed to clear pending jobs: $e');
      }
    }
  }

  /// Confirme la réception d'un job (le marque comme processed)
  Future<bool> acknowledgeJob(String jobId) async {
    await init();
    
    try {
      final uri = Uri.parse('$_apiBase/api/publisher-app/ack');
      final body = jsonEncode({
        'jobId': jobId,
        'status': 'processed',
      });
      
      // Générer les headers d'authentification avec le body
        final headers = _credentials?.generateAuthHeaders(method: 'POST', uri: uri) ?? 
          {'Content-Type': 'application/json'};
      
      final response = await http.post(
        uri,
        headers: headers,
        body: body,
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        if (kDebugMode) {
          print('SyncService: job $jobId acknowledged');
        }
        return true;
      }

      if (kDebugMode) {
        print('SyncService: ack failed with status ${response.statusCode} - ${response.body}');
      }
      return false;
    } catch (e) {
      if (kDebugMode) {
        print('SyncService: ack failed: $e');
      }
      return false;
    }
  }

  /// Envoie un job au backend (mobile vers desktop)
  /// 
  /// Cette méthode permet d'envoyer des données depuis l'application mobile
  /// vers le serveur desktop via l'endpoint /api/publisher-app/incoming
  Future<bool> sendJobToBackend({
    required SyncJobType type,
    required Map<String, dynamic> payload,
    String? initiator,
    String? deviceTarget,
    bool notify = false,
  }) async {
    await init();
    
    try {
      final uri = Uri.parse('$_apiBase/api/publisher-app/incoming');
      final body = jsonEncode({
        'type': SyncJob._jobTypeToString(type),
        'payload': payload,
        if (initiator != null) 'initiator': initiator,
        if (deviceTarget != null) 'deviceTarget': deviceTarget,
        'notify': notify,
      });
      
      final headers = _credentials?.generateAuthHeaders(method: 'POST', uri: uri) ?? 
          {'Content-Type': 'application/json'};
      
      if (kDebugMode) {
        print('SyncService: sending ${SyncJob._jobTypeToString(type)} to backend');
        print('SyncService: payload: $payload');
      }
      
      final response = await http.post(
        uri,
        headers: headers,
        body: body,
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 201 || response.statusCode == 200) {
        if (kDebugMode) {
          print('SyncService: job sent successfully');
        }
        return true;
      }

      final respBody = utf8.decode(response.bodyBytes);
      if (kDebugMode) {
        print('SyncService: send failed with status ${response.statusCode} - $respBody');
      }

      throw Exception(
        'Serveur ${response.statusCode} sur ${uri.path}: ${respBody.isEmpty ? '(vide)' : respBody} (API: $_apiBase)',
      );
    } catch (e) {
      if (kDebugMode) {
        print('SyncService: send failed: $e');
      }
      // Bubble up a useful error so the UI can display it.
      throw Exception('Envoi impossible (API: $_apiBase): $e');
    }
  }

  /// Traite un job selon son type
  Future<bool> processJob(SyncJob job) async {
    try {
      switch (job.type) {
        case SyncJobType.programmeWeek:
          return await _processProgrammeWeek(job);
        case SyncJobType.programmeWeekend:
          return await _processProgrammeWeekend(job);
        case SyncJobType.communications:
          return await _processCommunications(job);
        case SyncJobType.services:
          return await _processServices(job);
        case SyncJobType.predication:
          return await _processPredication(job);
        case SyncJobType.temoignagePublic:
          return await _processTemoignagePublic(job);
        case SyncJobType.rapports:
          return await _processRapports(job);
        case SyncJobType.assistance:
          return await _processAssistance(job);
        case SyncJobType.taches:
          return await _processTaches(job);
        case SyncJobType.emergencyContacts:
          return await _processEmergencyContacts(job);
        case SyncJobType.territories:
          return await _processTerritories(job);
      }
    } catch (e) {
      if (kDebugMode) {
        print('SyncService: failed to process job ${job.id}: $e');
      }
      return false;
    }
  }

  /// Synchronise et traite toutes les mises à jour
  Future<SyncResult> syncAll() async {
    final result = await fetchUpdates(since: _lastSyncTime);
    
    if (!result.success) {
      return result;
    }

    int processed = 0;
    final errors = <String>[];

    for (final job in result.jobs) {
      final success = await processJob(job);
      
      if (success) {
        // Confirmer au backend que le job a été traité
        final ackSuccess = await acknowledgeJob(job.id);
        if (ackSuccess) {
          processed++;
        } else {
          errors.add('Échec confirmation job ${job.id}');
        }
      } else {
        errors.add('Échec traitement job ${job.id} (${job.type})');
      }
    }

    if (processed > 0) {
      _lastSyncTime = DateTime.now();
    }

    return SyncResult(
      success: errors.isEmpty,
      jobsProcessed: processed,
      errors: errors,
      jobs: result.jobs,
    );
  }

  // ===== TRAITEMENT PAR TYPE =====

  Future<bool> _processProgrammeWeek(SyncJob job) async {
    // Stocker le programme de la semaine (VCM)
    // For backward compatibility and to make sure UI code that expects the
    // aggregated `programme_week` key (or the assets file) can find the data,
    // we save the incoming payload under a per-week key as before AND merge
    // it into the canonical `programme_week` shared key. This mirrors the
    // server writer behaviour which keeps a `weeks: []` array in
    // assets/data/programme_week.json.
    final perWeekKey = 'vcm_programme_${job.payload['weekStart'] ?? 'latest'}';
    await storageService.saveGenericData(perWeekKey, job.payload);

    try {
      // Load the canonical programme_week data if present (from SharedPrefs / file)
      Map<String, dynamic>? existing = await storageService.getGenericData('programme_week');

      // Normalize incoming payload to an array of weeks
      final incomingWeeks = <Map<String, dynamic>>[];
      if (job.payload is Map && job.payload['weeks'] is List) {
        for (final w in job.payload['weeks']) {
          if (w is Map<String, dynamic>) incomingWeeks.add(w);
        }
      } else if (job.payload is Map) {
        // treat the payload as a single week object
        incomingWeeks.add(Map<String, dynamic>.from(job.payload));
      }

      existing ??= <String, dynamic>{'weeks': []};
      final existingWeeks = (existing['weeks'] as List? ?? []).cast<Map<String, dynamic>>();

      // Replace or append incoming weeks according to weekStart
      for (final week in incomingWeeks) {
        final weekStart = week['weekStart']?.toString();
        if (weekStart == null) continue;
        final idx = existingWeeks.indexWhere((w) => w['weekStart']?.toString() == weekStart);
        if (idx >= 0) {
          // Merge incoming week into existing week to avoid overwriting the
          // canonical programme (songs, assignments, etc.) when publisher
          // sends only participants. We prefer to update participants only.
          final existingWeek = Map<String, dynamic>.from(existingWeeks[idx]);

          // Merge participants: index by role (or personId) so incoming
          // participant entries overwrite or add to the existing list.
          final existingParts = (existingWeek['participants'] as List?)?.cast<Map<String, dynamic>>() ?? [];
          final incomingParts = (week['participants'] as List?)?.cast<Map<String, dynamic>>() ?? [];

          final Map<String, Map<String, dynamic>> byRole = {};
          for (final p in existingParts) {
            final role = p['role']?.toString() ?? p['personId']?.toString() ?? '';
            byRole[role] = Map<String, dynamic>.from(p);
          }
          for (final p in incomingParts) {
            final role = p['role']?.toString() ?? p['personId']?.toString() ?? '';
            byRole[role] = Map<String, dynamic>.from(p);
          }

          // Build merged participants list
          final mergedParts = byRole.values.toList();

          // Sort merged participants according to assignments order if present
          final assignmentsMap = existingWeek['assignments'] as Map<String, dynamic>? ?? {};
          final assignmentKeys = assignmentsMap.keys.toList();
          mergedParts.sort((a, b) {
            final ra = a['role']?.toString() ?? '';
            final rb = b['role']?.toString() ?? '';
            final ia = assignmentKeys.indexOf(ra);
            final ib = assignmentKeys.indexOf(rb);
            final aIdx = ia < 0 ? 9999 : ia;
            final bIdx = ib < 0 ? 9999 : ib;
            if (aIdx != bIdx) return aIdx.compareTo(bIdx);
            return (a['personName']?.toString() ?? '').compareTo((b['personName']?.toString() ?? ''));
          });

          existingWeek['participants'] = mergedParts;

          // Merge other top-level fields conservatively (do not remove existing)
          for (final entry in week.entries) {
            if (entry.key == 'participants') continue;
            existingWeek[entry.key] = entry.value;
          }

          existingWeeks[idx] = existingWeek;
        } else {
          existingWeeks.add(week);
        }
      }

      // Sort weeks ascending
      existingWeeks.sort((a, b) {
        final aDate = DateTime.tryParse(a['weekStart']?.toString() ?? '') ?? DateTime(1970);
        final bDate = DateTime.tryParse(b['weekStart']?.toString() ?? '') ?? DateTime(1970);
        return aDate.compareTo(bDate);
      });

      existing['weeks'] = existingWeeks;

      await storageService.saveGenericData('programme_week', existing);
      
      // Sauvegarder aussi dans le fichier assets pour persistance permanente
      await storageService.saveToAssetsFile('programme_week.json', existing);

      if (kDebugMode) {
        print('SyncService: saved programme_week (merged) to SharedPrefs and assets file');
      }
    } catch (e) {
      if (kDebugMode) {
        print('SyncService: failed to merge programme_week: $e');
      }
    }
    return true;
  }

  Future<bool> _processProgrammeWeekend(SyncJob job) async {
    final key = 'weekend_programme_${job.payload['weekStart'] ?? 'latest'}';
    await storageService.saveGenericData(key, job.payload);
    
    if (kDebugMode) {
      print('SyncService: saved programme_weekend to $key');
    }
    return true;
  }

  Future<bool> _processCommunications(SyncJob job) async {
    // Stocker les communications
    final communications = job.payload['communications'] as List? ?? [];
    await storageService.saveGenericData('communications', {
      'updatedAt': DateTime.now().toIso8601String(),
      'items': communications,
    });
    
    if (kDebugMode) {
      print('SyncService: saved ${communications.length} communications');
    }
    return true;
  }

  Future<bool> _processServices(SyncJob job) async {
    await storageService.saveGenericData('services', job.payload);
    
    if (kDebugMode) {
      print('SyncService: saved services');
    }
    return true;
  }

  Future<bool> _processPredication(SyncJob job) async {
    await storageService.saveGenericData('predication', job.payload);
    
    if (kDebugMode) {
      print('SyncService: saved predication');
    }
    return true;
  }

  Future<bool> _processTemoignagePublic(SyncJob job) async {
    await storageService.saveGenericData('temoignage_public', job.payload);
    
    if (kDebugMode) {
      print('SyncService: saved temoignage_public');
    }
    return true;
  }

  Future<bool> _processRapports(SyncJob job) async {
    await storageService.saveGenericData('rapports', job.payload);
    
    if (kDebugMode) {
      print('SyncService: saved rapports');
    }
    return true;
  }

  Future<bool> _processAssistance(SyncJob job) async {
    await storageService.saveGenericData('assistance', job.payload);
    
    if (kDebugMode) {
      print('SyncService: saved assistance');
    }
    return true;
  }

  Future<bool> _processTaches(SyncJob job) async {
    await storageService.saveGenericData('taches', job.payload);
    
    if (kDebugMode) {
      print('SyncService: saved taches');
    }
    return true;
  }

  Future<bool> _processEmergencyContacts(SyncJob job) async {
    await storageService.saveGenericData('emergency_contacts', job.payload);
    
    if (kDebugMode) {
      print('SyncService: saved emergency_contacts');
    }
    return true;
  }

  Future<bool> _processTerritories(SyncJob job) async {
    await storageService.saveGenericData('territories', job.payload);

    if (kDebugMode) {
      print('SyncService: saved territories');
    }
    return true;
  }
}
