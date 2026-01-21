import 'dart:convert';

/// Représente un rapport d'activité mensuel
class ActivityReport {
  final String month; // YYYY-MM
  final bool participated;
  final int? bibleStudies;
  final bool isAuxiliaryPioneer;
  final double? hours;
  final double? credit;
  final bool isLate;
  final String remarks;

  ActivityReport({
    required this.month,
    required this.participated,
    this.bibleStudies,
    required this.isAuxiliaryPioneer,
    this.hours,
    this.credit,
    required this.isLate,
    required this.remarks,
  });

  factory ActivityReport.fromJson(Map<String, dynamic> json) {
    return ActivityReport(
      month: json['month'] ?? '',
      participated: json['participated'] ?? false,
      bibleStudies: json['bibleStudies'],
      isAuxiliaryPioneer: json['isAuxiliaryPioneer'] ?? false,
      hours: (json['hours'] as num?)?.toDouble(),
      credit: (json['credit'] as num?)?.toDouble(),
      isLate: json['isLate'] ?? false,
      remarks: json['remarks'] ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
    'month': month,
    'participated': participated,
    'bibleStudies': bibleStudies,
    'isAuxiliaryPioneer': isAuxiliaryPioneer,
    'hours': hours,
    'credit': credit,
    'isLate': isLate,
    'remarks': remarks,
  };

  @override
  String toString() => 'ActivityReport($month, participated: $participated)';
}

/// Représente une personne / utilisateur
class Person {
  final String id;
  final String firstName;
  final String middleName;
  final String lastName;
  final String displayName;
  final String pin;
  final String email1;
  final String email2;
  final String mobilePhone;
  final String homePhone;
  final String workPhone;
  final String address;
  final String gender;
  final List<ActivityReport> activity;
  final Assignments assignments;
  final Spiritual spiritual;
  final EmergencyInfo emergency;
  final Map<String, dynamic> meetingParticipation; // date (YYYY-MM-DD) -> bool
  final bool spiritual_active;

  Person({
    required this.id,
    required this.firstName,
    required this.middleName,
    required this.lastName,
    required this.displayName,
    required this.pin,
    this.email1 = '',
    this.email2 = '',
    this.mobilePhone = '',
    this.homePhone = '',
    this.workPhone = '',
    this.address = '',
    this.gender = '',
    this.activity = const [],
    required this.assignments,
    required this.spiritual,
    EmergencyInfo? emergency,
    required this.spiritual_active,
    this.meetingParticipation = const {},
  }) : emergency = emergency ?? EmergencyInfo();

  factory Person.fromJson(Map<String, dynamic> json) {
    return Person(
      id: json['id'] ?? '',
      firstName: json['firstName'] ?? '',
      middleName: json['middleName'] ?? '',
      lastName: json['lastName'] ?? '',
      displayName: json['displayName'] ?? '',
      pin: json['pin'] ?? '',
      email1: json['email1'] ?? '',
      email2: json['email2'] ?? '',
      mobilePhone: json['mobilePhone'] ?? '',
      homePhone: json['homePhone'] ?? '',
      workPhone: json['workPhone'] ?? '',
      address: json['address'] ?? '',
      gender: json['gender'] ?? '',
      activity: (json['activity'] as List?)?.map((e) => ActivityReport.fromJson(Map<String, dynamic>.from(e as Map))).toList() ?? [],
      assignments: Assignments.fromJson(json['assignments'] ?? {}),
      spiritual: Spiritual.fromJson(json['spiritual'] ?? {}),
      emergency: EmergencyInfo.fromJson(json['emergency'] ?? {}),
      spiritual_active: json['spiritual']?['active'] ?? false,
      meetingParticipation: Map<String, dynamic>.from(json['meetingParticipation'] ?? {}),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'firstName': firstName,
    'middleName': middleName,
    'lastName': lastName,
    'displayName': displayName,
    'pin': pin,
    'email1': email1,
    'email2': email2,
    'mobilePhone': mobilePhone,
    'homePhone': homePhone,
    'workPhone': workPhone,
    'address': address,
    'gender': gender,
    'activity': activity.map((e) => e.toJson()).toList(),
    'assignments': assignments.toJson(),
    'spiritual': spiritual.toJson(),
    'emergency': emergency.toJson(),
    'meetingParticipation': meetingParticipation,
  };
}

/// Représente les attributions/assignments
class Assignments {
  final Services services;
  final Ministry ministry;
  final Map<String, dynamic> gems;
  final Map<String, dynamic> christianLife;
  final Map<String, dynamic> weekendMeeting;

  Assignments({
    required this.services,
    required this.ministry,
    this.gems = const {},
    this.christianLife = const {},
    this.weekendMeeting = const {},
  });

  factory Assignments.fromJson(Map<String, dynamic> json) {
    return Assignments(
      services: Services.fromJson(json['services'] ?? {}),
      ministry: Ministry.fromJson(json['ministry'] ?? {}),
      gems: Map<String, dynamic>.from(json['gems'] ?? {}),
      christianLife: Map<String, dynamic>.from(json['christianLife'] ?? {}),
      weekendMeeting: Map<String, dynamic>.from(json['weekendMeeting'] ?? {}),
    );
  }

  Map<String, dynamic> toJson() => {
    'services': services.toJson(),
    'ministry': ministry.toJson(),
    'gems': gems,
    'christianLife': christianLife,
    'weekendMeeting': weekendMeeting,
  };
}

/// Représente les services
class Services {
  final bool attendanceCount;
  final bool doorAttendant;
  final bool soundSystem;
  final bool rovingMic;
  final bool stageMic;
  final bool sanitary;
  final bool hallAttendant;
  final bool mainDoorAttendant;
  final bool maintenance;

  Services({
    this.attendanceCount = false,
    this.doorAttendant = false,
    this.soundSystem = false,
    this.rovingMic = false,
    this.stageMic = false,
    this.sanitary = false,
    this.hallAttendant = false,
    this.mainDoorAttendant = false,
    this.maintenance = false,
  });

  factory Services.fromJson(Map<String, dynamic> json) {
    return Services(
      attendanceCount: json['attendanceCount'] ?? false,
      doorAttendant: json['doorAttendant'] ?? false,
      soundSystem: json['soundSystem'] ?? false,
      rovingMic: json['rovingMic'] ?? false,
      stageMic: json['stageMic'] ?? false,
      sanitary: json['sanitary'] ?? false,
      hallAttendant: json['hallAttendant'] ?? false,
      mainDoorAttendant: json['mainDoorAttendant'] ?? false,
      maintenance: json['maintenance'] ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
    'attendanceCount': attendanceCount,
    'doorAttendant': doorAttendant,
    'soundSystem': soundSystem,
    'rovingMic': rovingMic,
    'stageMic': stageMic,
    'sanitary': sanitary,
    'hallAttendant': hallAttendant,
    'mainDoorAttendant': mainDoorAttendant,
    'maintenance': maintenance,
  };

  // Retourner les services actifs
  List<String> getActiveServices() {
    List<String> active = [];
    if (attendanceCount) active.add('Comptage Assistance');
    if (doorAttendant) active.add('Accueil à la porte');
    if (soundSystem) active.add('Sonorisation');
    if (rovingMic) active.add('Micros baladeur');
    if (stageMic) active.add('Micros Estrade');
    if (sanitary) active.add('Sanitaire');
    if (hallAttendant) active.add('Accueil salle');
    if (mainDoorAttendant) active.add('Accueil grande porte');
    if (maintenance) active.add('Maintenance');
    return active;
  }
}

/// Représente les attributions de ministère
class Ministry {
  final bool student;
  final bool firstContact;
  final bool returnVisit;
  final bool bibleStudy;
  final bool explainBeliefs;
  final bool discourse;

  Ministry({
    this.student = false,
    this.firstContact = false,
    this.returnVisit = false,
    this.bibleStudy = false,
    this.explainBeliefs = false,
    this.discourse = false,
  });

  factory Ministry.fromJson(Map<String, dynamic> json) {
    return Ministry(
      student: json['student'] ?? false,
      firstContact: json['firstContact'] ?? false,
      returnVisit: json['returnVisit'] ?? false,
      bibleStudy: json['bibleStudy'] ?? false,
      explainBeliefs: json['explainBeliefs'] ?? false,
      discourse: json['discourse'] ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
    'student': student,
    'firstContact': firstContact,
    'returnVisit': returnVisit,
    'bibleStudy': bibleStudy,
    'explainBeliefs': explainBeliefs,
    'discourse': discourse,
  };
}

/// Représente les données spirituelles
class Spiritual {
  final String? function; // elder, servant, publisher, unbaptized
  final bool active;
  final bool regular;
  final String? group;
  final String? groupName;
  final String? roleInGroup; // member, overseer, assistant

  Spiritual({
    this.function,
    this.active = false,
    this.regular = false,
    this.group,
    this.groupName,
    this.roleInGroup,
  });

  factory Spiritual.fromJson(Map<String, dynamic> json) {
    return Spiritual(
      function: json['function'],
      active: json['active'] ?? false,
      regular: json['regular'] ?? false,
      group: json['group'],
      groupName: json['groupName'],
      roleInGroup: json['roleInGroup'],
    );
  }

  Map<String, dynamic> toJson() => {
    'function': function,
    'active': active,
    'regular': regular,
    'group': group,
    'groupName': groupName,
    'roleInGroup': roleInGroup,
  };

  /// Vérifie si la personne est surveillant ou assistant de son groupe
  bool get isGroupOverseerOrAssistant {
    final role = (roleInGroup ?? '').toLowerCase();
    return role == 'overseer' || role == 'assistant';
  }
}

/// Représente une attribution de service par semaine
class WeeklyServiceAssignment {
  final String weekId;
  final String date;
  final String serviceName;
  final String location;
  final String notes;

  WeeklyServiceAssignment({
    required this.weekId,
    required this.date,
    required this.serviceName,
    required this.location,
    required this.notes,
  });

  factory WeeklyServiceAssignment.fromJson(Map<String, dynamic> json) {
    return WeeklyServiceAssignment(
      weekId: json['weekId'] ?? '',
      date: json['date'] ?? '',
      serviceName: json['serviceName'] ?? '',
      location: json['location'] ?? '',
      notes: json['notes'] ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
    'weekId': weekId,
    'date': date,
    'serviceName': serviceName,
    'location': location,
    'notes': notes,
  };
}

/// Représente un témoignage public par semaine
class PublicWitness {
  final String weekId;
  final String date;
  final String day;
  final String period; // AM / PM
  final String location;
  final String notes;

  PublicWitness({
    required this.weekId,
    required this.date,
    required this.day,
    required this.period,
    required this.location,
    required this.notes,
  });

  factory PublicWitness.fromJson(Map<String, dynamic> json) {
    return PublicWitness(
      weekId: json['weekId'] ?? '',
      date: json['date'] ?? '',
      day: json['day'] ?? '',
      period: json['period'] ?? 'AM',
      location: json['location'] ?? '',
      notes: json['notes'] ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
    'weekId': weekId,
    'date': date,
    'day': day,
    'period': period,
    'location': location,
    'notes': notes,
  };
}

/// Représente une assemblée
class Assembly {
  final String id;
  final String name;
  final String pin;
  final String region;
  final String country;
  final String? zoomId;
  final String? zoomPassword;
  final String? zoomUrl;
  // Jour de la réunion de semaine (1=Monday .. 7=Sunday) — par défaut null
  final int? weekdayMeeting;
  // Jour de la réunion de week-end (1=Monday .. 7=Sunday) — par défaut null
  final int? weekendMeeting;

  Assembly({
    required this.id,
    required this.name,
    required this.pin,
    required this.region,
    required this.country,
    this.zoomId,
    this.zoomPassword,
    this.zoomUrl,
    this.weekdayMeeting,
    this.weekendMeeting,
  });

  factory Assembly.fromJson(Map<String, dynamic> json) {
    return Assembly(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      pin: json['pin'] ?? '',
      region: json['region'] ?? '',
      country: json['country'] ?? '',
      zoomId: json['zoomId']?.toString(),
      zoomPassword: json['zoomPassword']?.toString(),
      zoomUrl: json['zoomUrl']?.toString(),
      weekdayMeeting: json['weekdayMeeting'] is int ? json['weekdayMeeting'] as int : (json['weekdayMeeting'] is String ? int.tryParse(json['weekdayMeeting']) : null),
      weekendMeeting: json['weekendMeeting'] is int ? json['weekendMeeting'] as int : (json['weekendMeeting'] is String ? int.tryParse(json['weekendMeeting']) : null),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'pin': pin,
    'region': region,
    'country': country,
    'zoomId': zoomId,
    'zoomPassword': zoomPassword,
    'zoomUrl': zoomUrl,
    'weekdayMeeting': weekdayMeeting,
    'weekendMeeting': weekendMeeting,
  };
}

/// Représente un contact d'urgence
class EmergencyContact {
  final String name;
  final String phone;
  final String relationship;
  final String address;

  EmergencyContact({
    this.name = '',
    this.phone = '',
    this.relationship = '',
    this.address = '',
  });

  factory EmergencyContact.fromJson(Map<String, dynamic> json) {
    return EmergencyContact(
      name: json['name'] ?? '',
      phone: json['phone'] ?? '',
      relationship: json['relationship'] ?? '',
      address: json['address'] ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
    'name': name,
    'phone': phone,
    'relationship': relationship,
    'address': address,
  };
}

/// Représente les informations d'urgence
class EmergencyInfo {
  final String personName;
  final String notes;
  final bool disasterAccommodations;
  final List<EmergencyContact> contacts;

  EmergencyInfo({
    this.personName = '',
    this.notes = '',
    this.disasterAccommodations = false,
    this.contacts = const [],
  });

  factory EmergencyInfo.fromJson(Map<String, dynamic> json) {
    return EmergencyInfo(
      personName: json['personName'] ?? '',
      notes: json['notes'] ?? '',
      disasterAccommodations: json['disasterAccommodations'] ?? false,
      contacts: (json['contacts'] as List?)
              ?.map((e) => EmergencyContact.fromJson(Map<String, dynamic>.from(e as Map)))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() => {
    'personName': personName,
    'notes': notes,
    'disasterAccommodations': disasterAccommodations,
    'contacts': contacts.map((e) => e.toJson()).toList(),
  };
}
