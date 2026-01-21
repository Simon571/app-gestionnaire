import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/person.dart';
import '../services/storage_service.dart';
import '../services/communication_read_state_service.dart';
import '../utils/helpers.dart';
import 'auth_provider.dart';

class NextMeetingInfo {
  final String label;
  final DateTime date;
  final bool participates;
  final List<String> services;
  final String location;

  const NextMeetingInfo({
    required this.label,
    required this.date,
    this.participates = false,
    this.services = const [],
    this.location = '',
  });
}

class PublicWitnessSlot {
  final DateTime date;
  final String period;
  final String location;
  final bool participates;

  const PublicWitnessSlot({
    required this.date,
    this.period = '',
    this.location = '',
    this.participates = false,
  });
}

class BulletinCounts {
  final int communications;
  final int documents;
  final int unreadCount; // Nombre de communications non lues
  final int unreadDocuments; // Nombre de documents non lus
  final DateTime? updatedAt;
  final DateTime? coVisitStart;
  final DateTime? coVisitEnd;
  final String? coVisitTheme;
  final String boardType; // 'assembly', 'elders', 'elders-assistants'

  const BulletinCounts({
    this.communications = 0,
    this.documents = 0,
    this.unreadCount = 0,
    this.unreadDocuments = 0,
    this.updatedAt,
    this.coVisitStart,
    this.coVisitEnd,
    this.coVisitTheme,
    this.boardType = 'assembly',
  });
}

class AssemblyDashboardData {
  final bool hasAssembly;
  final List<NextMeetingInfo> nextMeetings;
  final List<PublicWitnessSlot> publicWitnessSlots;
  final BulletinCounts bulletin;
  final List<BulletinCounts> allBulletins; // Tous les tableaux d'affichage accessibles

  const AssemblyDashboardData({
    this.hasAssembly = false,
    this.nextMeetings = const [],
    this.publicWitnessSlots = const [],
    this.bulletin = const BulletinCounts(),
    this.allBulletins = const [],
  });
}

final assemblyDashboardProvider = FutureProvider<AssemblyDashboardData>((ref) async {
  final storage = ref.read(storageServiceProvider);
  final auth = ref.watch(authStateProvider);
  final assembly = auth.assembly;
  final user = auth.user;
  final now = DateTime.now();

  final nextMeetings = await _loadUpcomingDuties(storage, assembly, user, now);
  final publicWitness = await _loadPublicWitness(storage, user, now);
  final allBulletins = await _loadAllBulletins(storage, user);
  final bulletin = allBulletins.isNotEmpty ? allBulletins.first : const BulletinCounts();

  return AssemblyDashboardData(
    hasAssembly: assembly != null,
    nextMeetings: nextMeetings,
    publicWitnessSlots: publicWitness,
    bulletin: bulletin,
    allBulletins: allBulletins,
  );
});

Future<List<NextMeetingInfo>> _loadUpcomingDuties(
  StorageService storage,
  Assembly? assembly,
  Person? user,
  DateTime now,
) async {
  final out = <NextMeetingInfo>[];

  // 0) Données VCM poussées par le programme de la semaine
  await _loadVCMAssignments(storage, user, now, out);

  // 1) Données poussées par Publisher App (sync "services")
  final servicesData = await storage.getGenericData('services');
  if (servicesData != null && servicesData.isNotEmpty) {
    void addFromMap(Map<String, dynamic> item) {
      final dateStr = item['date'] ?? item['day'] ?? item['scheduledFor'];
      final parsed = dateStr is String ? DateTime.tryParse(dateStr) : null;
      if (parsed == null) return;
      final title = (item['service'] ?? item['serviceName'] ?? item['label'] ?? item['name'] ?? 'Service').toString();
      final location = (item['location'] ?? item['place'] ?? '').toString();
      final rawUsers = item['users'] ?? item['publishers'] ?? item['assignees'] ?? item['team'];
      final participates = _matchesUser(user, rawUsers);
      final tags = <String>[];
      if (location.isNotEmpty) tags.add(location);
      if (item['slot'] != null) tags.add(item['slot'].toString());
      out.add(NextMeetingInfo(
        label: title,
        date: parsed,
        participates: participates,
        services: tags,
        location: location,
      ));
    }

    void tryList(dynamic maybeList) {
      if (maybeList is List) {
        for (final item in maybeList) {
          if (item is Map<String, dynamic>) addFromMap(item);
        }
      }
    }

    tryList(servicesData['items']);
    tryList(servicesData['services']);
    tryList(servicesData['assignments']);
    tryList(servicesData['upcoming']);
  }

  // 2) Fallback: calcul local sur base des jours de réunion + services de l'utilisateur
  if (out.isEmpty && assembly != null) {
    final userServices = user?.assignments.services.getActiveServices() ?? const [];
    void addMeetings(int? weekday, String label) {
      if (weekday == null) return;
      for (final date in AppDateUtils.nextOccurrences(weekday, 2, from: now)) {
        final key = _isoDate(date);
        final participates = user?.meetingParticipation[key] == true;
        out.add(NextMeetingInfo(
          label: label,
          date: date,
          participates: participates,
          services: userServices,
        ));
      }
    }

    addMeetings(assembly.weekdayMeeting, 'Réunion de semaine');
    addMeetings(assembly.weekendMeeting, 'Réunion de week-end');
  }

  final today = DateTime(now.year, now.month, now.day);
  final upcoming = out
      .where((m) => !m.date.isBefore(today))
      .toList()
    ..sort((a, b) => a.date.compareTo(b.date));

  return upcoming.take(8).toList();
}

Future<List<PublicWitnessSlot>> _loadPublicWitness(
  StorageService storage,
  Person? user,
  DateTime now,
) async {
  final data = await storage.getGenericData('temoignage_public');
  if (data == null || data.isEmpty) return const [];

  final slots = <PublicWitnessSlot>[];

  void addFromMap(Map<String, dynamic> m) {
    final dateStr = m['date'] ?? m['day'] ?? m['scheduledFor'];
    final parsed = dateStr is String ? DateTime.tryParse(dateStr) : null;
    if (parsed == null) return;
    final location = (m['location'] ?? m['lieu'] ?? m['place'] ?? '').toString();
    final period = (m['period'] ?? m['slot'] ?? m['time'] ?? '').toString();
    final rawParticipants = m['publishers'] ?? m['participants'] ?? m['assigned'] ?? m['team'];
    final participates = _matchesUser(user, rawParticipants);
    slots.add(PublicWitnessSlot(
      date: parsed,
      location: location,
      period: period,
      participates: participates,
    ));
  }

  void tryList(dynamic maybeList) {
    if (maybeList is List) {
      for (final item in maybeList) {
        if (item is Map<String, dynamic>) {
          addFromMap(item);
        }
      }
    }
  }

  tryList(data['slots']);
  tryList(data['items']);
  tryList(data['entries']);

  if (data['weeks'] is List) {
    for (final week in data['weeks'] as List) {
      if (week is Map<String, dynamic>) {
        tryList(week['slots']);
        tryList(week['items']);
      }
    }
  }

  final today = DateTime(now.year, now.month, now.day);
  final upcoming = slots
      .where((s) => !s.date.isBefore(today) && s.participates) // Only show where user participates
      .toList()
    ..sort((a, b) => a.date.compareTo(b.date));

  return upcoming.take(5).toList();
}

Future<List<BulletinCounts>> _loadAllBulletins(StorageService storage, Person? user) async {
  final data = await storage.getGenericData('communications');
  
  // Charger les données de visite du responsable de circonscription
  final visiteData = await storage.getGenericData('visite_responsable');
  DateTime? coVisitStart;
  DateTime? coVisitEnd;
  String? coVisitTheme;
  
  if (visiteData != null && visiteData.isNotEmpty) {
    coVisitStart = DateTime.tryParse('${visiteData['startDate'] ?? visiteData['dateDebut'] ?? ''}');
    coVisitEnd = DateTime.tryParse('${visiteData['endDate'] ?? visiteData['dateFin'] ?? ''}');
    coVisitTheme = visiteData['theme']?.toString() ?? visiteData['titre']?.toString();
  }

  // Même si aucune donnée n'est disponible, on doit quand même afficher les cartes
  // attendues selon le rôle (avec compteurs à 0).
  final allItems = (data == null || data.isEmpty)
      ? const <dynamic>[]
      : ((data['items'] as List?) ?? (data['communications'] as List?) ?? const <dynamic>[]);
  final updatedAt = (data == null || data.isEmpty)
      ? null
      : DateTime.tryParse('${data['updatedAt'] ?? data['date'] ?? ''}');
  
  // Déterminer le rôle de l'utilisateur
  final userFunction = user?.spiritual.function?.toLowerCase() ?? '';
  final isElder = userFunction.contains('elder') || userFunction.contains('ancien');
  final isServant = userFunction.contains('serv') || userFunction.contains('assistant');
  
  // Créer le service de lecture pour compter les non lus
  final readStateService = CommunicationReadStateService(storage, user?.id);
  
  // Debug log
  if (kDebugMode) {
    print('🔍 _loadAllBulletins - User function: $userFunction (isElder: $isElder, isServant: $isServant)');
    print('🔍 User spiritual data: ${user?.spiritual.toJson()}');
  }
  
  final bulletins = <BulletinCounts>[];
  
  // Fonction helper pour compter les communications d'un type donné
  Future<BulletinCounts> _countForBoardType(String boardType, String label) async {
    final items = allItems.where((item) {
      if (item is! Map<String, dynamic>) return false;
      final itemBoardType = (item['boardType'] ?? 'assembly').toString().toLowerCase();
      return itemBoardType == boardType;
    }).toList();
    
    // Séparer les communications et les documents
    final communicationItems = <Map<String, dynamic>>[];
    final documentItems = <Map<String, dynamic>>[];
    
    for (final item in items) {
      if (item is Map<String, dynamic>) {
        final type = (item['type'] ?? 'communication').toString().toLowerCase();
        if (type == 'document' || type == 'lettre') {
          documentItems.add(item);
        } else {
          communicationItems.add(item);
        }
      }
    }
    
    // Compter les communications non lues
    final commIds = communicationItems
        .where((item) => item['id'] != null)
        .map((item) => item['id'].toString())
        .toList();
    final unreadComms = await readStateService.countUnread(commIds);
    
    // Compter les documents non lus
    final docIds = documentItems
        .where((item) => item['id'] != null)
        .map((item) => item['id'].toString())
        .toList();
    final unreadDocs = await readStateService.countUnread(docIds);
    
    return BulletinCounts(
      communications: communicationItems.length,
      documents: documentItems.length,
      unreadCount: unreadComms,
      unreadDocuments: unreadDocs,
      updatedAt: updatedAt,
      coVisitStart: coVisitStart,
      coVisitEnd: coVisitEnd,
      coVisitTheme: coVisitTheme,
      boardType: boardType,
    );
  }
  
  // Anciens ont accès aux 3 tableaux (dans l'ordre : Anciens, Anciens et Assistants, Assemblée)
  if (isElder) {
    if (kDebugMode) print('🔍 Adding 3 bulletins for Elder');
    // Ordre UI demandé: Assemblée, Anciens, Anciens et Assistants
    bulletins.add(await _countForBoardType('assembly', 'Assemblée'));
    bulletins.add(await _countForBoardType('elders', 'Anciens'));
    bulletins.add(await _countForBoardType('elders-assistants', 'Anciens et Assistants'));
  }
  // Assistants ont accès à 2 tableaux (dans l'ordre : Anciens et Assistants, Assemblée)
  else if (isServant) {
    if (kDebugMode) print('🔍 Adding 2 bulletins for Servant');
    // Ordre UI demandé: Assemblée, Anciens et Assistants
    bulletins.add(await _countForBoardType('assembly', 'Assemblée'));
    bulletins.add(await _countForBoardType('elders-assistants', 'Anciens et Assistants'));
  }
  // Tous les autres ont accès uniquement au tableau Assemblée
  else {
    if (kDebugMode) print('🔍 Adding 1 bulletin for Publisher/Others');
    bulletins.add(await _countForBoardType('assembly', 'Assemblée'));
  }
  
  if (kDebugMode) print('🔍 Total bulletins created: ${bulletins.length}');
  return bulletins;
}

Future<BulletinCounts> _loadBulletin(StorageService storage, Person? user) async {
  final allBulletins = await _loadAllBulletins(storage, user);
  return allBulletins.isNotEmpty ? allBulletins.first : const BulletinCounts();
}

bool _matchesUser(Person? user, dynamic raw) {
  if (user == null || raw == null) return false;
  if (raw is List) {
    return raw.any((item) => _matchesUser(user, item));
  }
  final candidate = raw.toString().trim().toLowerCase();
  return candidate == user.id.toLowerCase() ||
      candidate == user.pin.toLowerCase() ||
      candidate == user.displayName.toLowerCase();
}

/// Charge les assignations VCM depuis le fichier programme_week
Future<void> _loadVCMAssignments(
  StorageService storage,
  Person? user,
  DateTime now,
  List<NextMeetingInfo> out,
) async {
  // Essayer de charger depuis le fichier local
  final data = await storage.getGenericData('programme_week');
  if (data == null || data.isEmpty) return;
  
  final weeks = data['weeks'] as List? ?? [];
  
  for (final week in weeks) {
    if (week is! Map<String, dynamic>) continue;
    
    final weekStart = week['weekStart'] as String?;
    if (weekStart == null) continue;
    
    final weekDate = DateTime.tryParse(weekStart);
    if (weekDate == null) continue;
    
    // Ignorer les semaines passées
    final weekEnd = DateTime.tryParse(week['weekEnd'] ?? '') ?? weekDate.add(const Duration(days: 6));
    final today = DateTime(now.year, now.month, now.day);
    if (weekEnd.isBefore(today)) continue;
    
    final assignments = week['assignments'] as Map<String, dynamic>? ?? {};
    final participants = week['participants'] as List? ?? [];
    
    // Parcourir les assignations pour trouver celles de l'utilisateur
    for (final entry in assignments.entries) {
      final key = entry.key;
      final value = entry.value;
      
      // Vérifier si l'utilisateur est assigné
      bool userAssigned = false;
      String assigneeName = '';
      
      if (value is Map<String, dynamic>) {
        final assignee = value['assignee'] ?? value['person'] ?? value['name'];
        if (_matchesUser(user, assignee)) {
          userAssigned = true;
          assigneeName = assignee?.toString() ?? '';
        }
      } else if (value is String) {
        if (_matchesUser(user, value)) {
          userAssigned = true;
          assigneeName = value;
        }
      }
      
      if (userAssigned) {
        // Créer un label lisible pour l'assignation
        String label = _formatVCMAssignmentLabel(key);
        
        out.add(NextMeetingInfo(
          label: label,
          date: weekDate,
          participates: true,
          services: ['Réunion VCM'],
          location: week['hall']?.toString() ?? '',
        ));
      }
    }
    
    // Vérifier aussi dans la liste des participants
    for (final participant in participants) {
      if (participant is! Map<String, dynamic>) continue;
      
      final personName = participant['name'] ?? participant['person'];
      if (!_matchesUser(user, personName)) continue;
      
      final role = participant['role'] ?? participant['assignment'] ?? 'Participation';
      
      out.add(NextMeetingInfo(
        label: role.toString(),
        date: weekDate,
        participates: true,
        services: ['Réunion VCM'],
        location: week['hall']?.toString() ?? '',
      ));
    }
  }
}

/// Formate le label d'une assignation VCM
String _formatVCMAssignmentLabel(String key) {
  // Convertir les clés comme "tgw_talk_10min" en labels lisibles
  final parts = key.split('_');
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
  };
  
  String result = formatted;
  for (final entry in translations.entries) {
    result = result.replaceAll(entry.key, entry.value);
  }
  
  return result.trim();
}

String _isoDate(DateTime date) => date.toIso8601String().split('T').first;
