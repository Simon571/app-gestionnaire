# 🔌 GUIDE API INTEGRATION - Flutter App

## 📋 Vue d'ensemble

Ce guide explique comment intégrer votre backend (Firebase/Supabase) avec l'application Flutter mobile.

**État Actuel:**
- ✅ App stocke données localement (SharedPreferences)
- ✅ Authentification locale (PIN)
- ⏳ Sync API non implémentée (prête pour intégration)

**Après Intégration:**
- ✅ Synchronisation bidirectionnelle
- ✅ Données centralisées sur serveur
- ✅ Accès multi-device
- ✅ Offline mode avec sync

---

## 🏗️ Architecture d'Intégration

```
┌─────────────────────────────────────────┐
│         Flutter Mobile App              │
│  (SharedPreferences + Local Storage)    │
└────────────┬────────────────────────────┘
             │
             │ (DataImportService)
             │ Import/Export JSON
             │
┌────────────▼────────────────────────────┐
│         API Client (Dio)                 │
│  • Authentication                       │
│  • CRUD Operations                      │
│  • Offline Queue                        │
└────────────┬────────────────────────────┘
             │
             │ HTTPS/REST
             │
┌────────────▼────────────────────────────┐
│      Backend (Firebase/Supabase)        │
│  • Firestore/PostgreSQL                │
│  • Cloud Functions                      │
│  • Authentication Service              │
└─────────────────────────────────────────┘
```

---

## 🔐 Authentification Backend

### Étape 1: Authentifier l'Assemblée

**Requête:**
```http
POST /api/auth/assembly/verify
Content-Type: application/json

{
  "region": "Afrique",
  "assemblyId": "ASM-001",
  "assemblyPin": "1234"
}
```

**Réponse Succès (200):**
```json
{
  "status": "success",
  "data": {
    "assemblyId": "ASM-001",
    "assemblyName": "Congrégation Chrétienne Afrique",
    "region": "Afrique",
    "token": "assembly_token_xyz...",
    "expiresIn": 3600
  }
}
```

**Réponse Erreur (401):**
```json
{
  "status": "error",
  "message": "Invalid assembly credentials"
}
```

### Étape 2: Authentifier l'Utilisateur

**Requête:**
```http
POST /api/auth/user/verify
Content-Type: application/json
Authorization: Bearer assembly_token_xyz...

{
  "firstName": "Jean",
  "personalPin": "1234"
}
```

**Réponse Succès (200):**
```json
{
  "status": "success",
  "data": {
    "userId": "user_abc123",
    "firstName": "Jean",
    "lastName": "Dupont",
    "token": "user_token_jwt...",
    "refreshToken": "refresh_token_xyz...",
    "expiresIn": 86400
  }
}
```

**Implémentation:**
```dart
class ApiClient {
  static const String BASE_URL = 'https://api.your-domain.com';
  
  final Dio _dio = Dio(BaseOptions(
    baseUrl: BASE_URL,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  ));
  
  Future<AuthResponse> verifyAssembly(String region, String assemblyId, String assemblyPin) async {
    try {
      final response = await _dio.post(
        '/api/auth/assembly/verify',
        data: {
          'region': region,
          'assemblyId': assemblyId,
          'assemblyPin': assemblyPin,
        },
      );
      
      if (response.statusCode == 200) {
        return AuthResponse.fromJson(response.data);
      } else {
        throw Exception('Assembly verification failed');
      }
    } catch (e) {
      print('Error: $e');
      rethrow;
    }
  }
}
```

---

## 👥 Endpoints Utilisateurs

### Récupérer tous les utilisateurs

**Requête:**
```http
GET /api/users
Authorization: Bearer user_token_jwt...
```

**Réponse (200):**
```json
{
  "status": "success",
  "data": [
    {
      "id": "user_001",
      "firstName": "Jean",
      "lastName": "Dupont",
      "displayName": "J. Dupont",
      "pin": "1234",
      "spiritual": {
        "function": "Pioneer auxiliaire",
        "active": true,
        "group": 1
      },
      "assignments": {
        "services": ["portier", "son"],
        "ministry": ["visite", "lettre"]
      },
      "activity": [
        {
          "month": "2025-11",
          "participated": 4,
          "bibleStudies": 1,
          "hours": 12.5,
          "isAuxiliaryPioneer": true,
          "isLate": false,
          "remarks": "En forme"
        }
      ]
    }
  ]
}
```

**Implémentation:**
```dart
Future<List<Person>> fetchUsers(String token) async {
  _dio.options.headers['Authorization'] = 'Bearer $token';
  
  final response = await _dio.get('/api/users');
  
  if (response.statusCode == 200) {
    final List data = response.data['data'];
    return data.map((json) => Person.fromJson(json)).toList();
  }
  throw Exception('Failed to fetch users');
}
```

---

### Créer un utilisateur

**Requête:**
```http
POST /api/users
Authorization: Bearer user_token_jwt...
Content-Type: application/json

{
  "firstName": "Marie",
  "lastName": "Martin",
  "pin": "5678",
  "spiritual": {
    "function": "Proclamatrice",
    "active": true,
    "group": 2
  }
}
```

**Réponse (201):**
```json
{
  "status": "success",
  "data": {
    "id": "user_002",
    "firstName": "Marie",
    "lastName": "Martin"
  }
}
```

---

### Mettre à jour un utilisateur

**Requête:**
```http
PUT /api/users/:userId
Authorization: Bearer user_token_jwt...
Content-Type: application/json

{
  "firstName": "Marie",
  "displayName": "M. Martin",
  "spiritual": {
    "function": "Proclamatrice régulière",
    "active": true
  }
}
```

**Réponse (200):**
```json
{
  "status": "success",
  "data": { ... }
}
```

---

## 📊 Endpoints Activité

### Récupérer les rapports de mois

**Requête:**
```http
GET /api/activity/:userId/reports?month=2025-11
Authorization: Bearer user_token_jwt...
```

**Réponse (200):**
```json
{
  "status": "success",
  "data": {
    "2025-11": {
      "month": "2025-11",
      "participated": 4,
      "bibleStudies": 1,
      "hours": 12.5,
      "isAuxiliaryPioneer": true,
      "isLate": false,
      "remarks": "Bon mois"
    }
  }
}
```

---

### Créer/Modifier un rapport

**Requête:**
```http
POST /api/activity/:userId/reports
Authorization: Bearer user_token_jwt...
Content-Type: application/json

{
  "month": "2025-11",
  "participated": 4,
  "bibleStudies": 1,
  "hours": 12.5,
  "isAuxiliaryPioneer": true,
  "remarks": "Bon mois"
}
```

**Réponse (201):**
```json
{
  "status": "success",
  "data": { ... }
}
```

---

## 📝 Endpoints Documents

### Récupérer les programmes

**Requête:**
```http
GET /api/programs?type=reunion
Authorization: Bearer user_token_jwt...
```

**Réponse (200):**
```json
{
  "status": "success",
  "data": [
    {
      "id": "prog_001",
      "title": "Réunion Ministre",
      "date": "2025-11-15",
      "startTime": "14:30",
      "location": "Salle Principale",
      "type": "reunion"
    }
  ]
}
```

---

### Récupérer les communications

**Requête:**
```http
GET /api/communications
Authorization: Bearer user_token_jwt...
```

**Réponse (200):**
```json
{
  "status": "success",
  "data": [
    {
      "id": "comm_001",
      "title": "Nouvelle règle importante",
      "content": "À partir du ...",
      "date": "2025-11-01",
      "priority": "high",
      "type": "announcement"
    }
  ]
}
```

---

## 🔄 Synchronisation

### Sync Model

```dart
class SyncQueue {
  // Queue pour les opérations offline
  List<PendingOperation> pendingOps = [];
  
  void add(PendingOperation op) {
    pendingOps.add(op);
    _saveToDisk();
  }
  
  Future<void> sync() async {
    for (var op in pendingOps) {
      try {
        await _execute(op);
        pendingOps.remove(op);
      } catch (e) {
        print('Sync failed: $e');
        // Réessayer plus tard
      }
    }
    _saveToDisk();
  }
}

class PendingOperation {
  String id;
  String type; // 'CREATE', 'UPDATE', 'DELETE'
  String entity; // 'USER', 'ACTIVITY', etc.
  Map<String, dynamic> data;
  DateTime timestamp;
}
```

---

## 🚀 Implémentation Pas à Pas

### Étape 1: Créer API Client

**Fichier: `lib/services/api_client.dart`**

```dart
import 'package:dio/dio.dart';

class ApiClient {
  static const String BASE_URL = 'https://api.your-domain.com';
  static const String API_VERSION = 'v1';
  
  late final Dio _dio;
  String? _assemblyToken;
  String? _userToken;
  String? _refreshToken;
  
  ApiClient() {
    _dio = Dio(BaseOptions(
      baseUrl: '$BASE_URL/api/$API_VERSION',
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      contentType: Headers.jsonContentType,
    ));
    
    // Ajouter interceptor pour tokens
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          if (_userToken != null) {
            options.headers['Authorization'] = 'Bearer $_userToken';
          }
          return handler.next(options);
        },
        onError: (error, handler) {
          if (error.response?.statusCode == 401) {
            // Token expiré, rafraîchir
            _refreshAccessToken();
          }
          return handler.next(error);
        },
      ),
    );
  }
  
  // Authentification
  Future<AuthResponse> verifyAssembly(
    String region,
    String assemblyId,
    String assemblyPin,
  ) async {
    try {
      final response = await _dio.post(
        '/auth/assembly/verify',
        data: {
          'region': region,
          'assemblyId': assemblyId,
          'assemblyPin': assemblyPin,
        },
      );
      
      _assemblyToken = response.data['data']['token'];
      return AuthResponse.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw ApiException(
        e.response?.statusCode ?? 0,
        e.message ?? 'Unknown error',
      );
    }
  }
  
  Future<UserAuthResponse> verifyUser(
    String firstName,
    String personalPin,
  ) async {
    try {
      final response = await _dio.post(
        '/auth/user/verify',
        options: Options(
          headers: {'Authorization': 'Bearer $_assemblyToken'},
        ),
        data: {
          'firstName': firstName,
          'personalPin': personalPin,
        },
      );
      
      _userToken = response.data['data']['token'];
      _refreshToken = response.data['data']['refreshToken'];
      return UserAuthResponse.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw ApiException(
        e.response?.statusCode ?? 0,
        e.message ?? 'Unknown error',
      );
    }
  }
  
  // Utilisateurs
  Future<List<Person>> fetchUsers() async {
    try {
      final response = await _dio.get('/users');
      final List data = response.data['data'];
      return data.map((json) => Person.fromJson(json)).toList();
    } on DioException catch (e) {
      throw ApiException(
        e.response?.statusCode ?? 0,
        e.message ?? 'Failed to fetch users',
      );
    }
  }
  
  Future<Person> createUser(Person person) async {
    try {
      final response = await _dio.post(
        '/users',
        data: person.toJson(),
      );
      return Person.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw ApiException(
        e.response?.statusCode ?? 0,
        e.message ?? 'Failed to create user',
      );
    }
  }
  
  Future<Person> updateUser(String userId, Person person) async {
    try {
      final response = await _dio.put(
        '/users/$userId',
        data: person.toJson(),
      );
      return Person.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw ApiException(
        e.response?.statusCode ?? 0,
        e.message ?? 'Failed to update user',
      );
    }
  }
  
  // Activité
  Future<ActivityReport> fetchActivityReport(String userId, String month) async {
    try {
      final response = await _dio.get(
        '/activity/$userId/reports',
        queryParameters: {'month': month},
      );
      return ActivityReport.fromJson(response.data['data'][month]);
    } on DioException catch (e) {
      throw ApiException(
        e.response?.statusCode ?? 0,
        e.message ?? 'Failed to fetch activity',
      );
    }
  }
  
  Future<ActivityReport> submitActivityReport(
    String userId,
    ActivityReport report,
  ) async {
    try {
      final response = await _dio.post(
        '/activity/$userId/reports',
        data: report.toJson(),
      );
      return ActivityReport.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw ApiException(
        e.response?.statusCode ?? 0,
        e.message ?? 'Failed to submit activity',
      );
    }
  }
  
  // Token Management
  Future<void> _refreshAccessToken() async {
    try {
      final response = await _dio.post(
        '/auth/refresh',
        data: {'refreshToken': _refreshToken},
      );
      _userToken = response.data['data']['token'];
    } catch (e) {
      print('Token refresh failed: $e');
      // Logout
      logout();
    }
  }
  
  void logout() {
    _assemblyToken = null;
    _userToken = null;
    _refreshToken = null;
  }
}

class ApiException implements Exception {
  final int statusCode;
  final String message;
  
  ApiException(this.statusCode, this.message);
  
  @override
  String toString() => 'ApiException($statusCode): $message';
}

class AuthResponse {
  final String assemblyId;
  final String assemblyName;
  final String region;
  final String token;
  final int expiresIn;
  
  AuthResponse({
    required this.assemblyId,
    required this.assemblyName,
    required this.region,
    required this.token,
    required this.expiresIn,
  });
  
  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      assemblyId: json['assemblyId'],
      assemblyName: json['assemblyName'],
      region: json['region'],
      token: json['token'],
      expiresIn: json['expiresIn'],
    );
  }
}

class UserAuthResponse {
  final String userId;
  final String firstName;
  final String lastName;
  final String token;
  final String refreshToken;
  final int expiresIn;
  
  UserAuthResponse({
    required this.userId,
    required this.firstName,
    required this.lastName,
    required this.token,
    required this.refreshToken,
    required this.expiresIn,
  });
  
  factory UserAuthResponse.fromJson(Map<String, dynamic> json) {
    return UserAuthResponse(
      userId: json['userId'],
      firstName: json['firstName'],
      lastName: json['lastName'],
      token: json['token'],
      refreshToken: json['refreshToken'],
      expiresIn: json['expiresIn'],
    );
  }
}
```

---

### Étape 2: Intégrer dans AuthService

**Modifier: `lib/services/auth_service.dart`**

```dart
class AuthService {
  final ApiClient apiClient;
  final StorageService storageService;
  
  AuthService({
    required this.apiClient,
    required this.storageService,
  });
  
  // Avec API
  Future<bool> validateAssemblyWithApi(
    String region,
    String assemblyId,
    String assemblyPin,
  ) async {
    try {
      final response = await apiClient.verifyAssembly(
        region,
        assemblyId,
        assemblyPin,
      );
      
      // Sauvegarder localement
      await storageService.saveAssembly(Assembly(
        id: response.assemblyId,
        name: response.assemblyName,
        region: region,
      ));
      
      return true;
    } catch (e) {
      print('Assembly validation failed: $e');
      return false;
    }
  }
  
  // Avec API
  Future<bool> validateUserWithApi(
    String firstName,
    String personalPin,
  ) async {
    try {
      final response = await apiClient.verifyUser(firstName, personalPin);
      
      // Récupérer l'utilisateur complet du serveur
      final users = await apiClient.fetchUsers();
      final user = users.firstWhere(
        (u) => u.firstName == firstName,
      );
      
      // Sauvegarder localement
      await storageService.setCurrentUser(user);
      await storageService.setAuthToken(response.token);
      
      return true;
    } catch (e) {
      print('User validation failed: $e');
      return false;
    }
  }
}
```

---

### Étape 3: Ajouter Sync Service

**Fichier: `lib/services/sync_service.dart`**

```dart
class SyncService {
  final ApiClient apiClient;
  final StorageService storageService;
  
  SyncService({
    required this.apiClient,
    required this.storageService,
  });
  
  Future<void> syncAll() async {
    try {
      // 1. Sync utilisateurs
      final users = await apiClient.fetchUsers();
      await storageService.savePeople(users);
      
      // 2. Sync rapports d'activité
      final currentUser = await storageService.getCurrentUser();
      if (currentUser != null) {
        final thisMonth = DateUtils.getCurrentMonthId();
        final report = await apiClient.fetchActivityReport(
          currentUser.id,
          thisMonth,
        );
        // Sauvegarder localement
      }
      
      print('✓ Sync completed successfully');
    } catch (e) {
      print('✗ Sync failed: $e');
      rethrow;
    }
  }
  
  Future<void> syncUser(Person person) async {
    try {
      final updated = await apiClient.updateUser(person.id, person);
      await storageService.savePeople([updated]);
    } catch (e) {
      print('User sync failed: $e');
      rethrow;
    }
  }
  
  Future<void> syncActivityReport(String userId, ActivityReport report) async {
    try {
      await apiClient.submitActivityReport(userId, report);
    } catch (e) {
      print('Activity sync failed: $e');
      rethrow;
    }
  }
}
```

---

## 🛡️ Sécurité

### Token Management
```dart
// Stocker les tokens de manière sécurisée
class SecureStorageService {
  static const platform = MethodChannel('com.example.app/secure_storage');
  
  Future<void> saveToken(String token) async {
    await platform.invokeMethod('saveToken', {'token': token});
  }
  
  Future<String?> getToken() async {
    return await platform.invokeMethod('getToken');
  }
  
  Future<void> deleteToken() async {
    await platform.invokeMethod('deleteToken');
  }
}
```

### HTTPS Only
```dart
// S'assurer que seul HTTPS est utilisé
final dio = Dio(BaseOptions(
  baseUrl: 'https://api.your-domain.com', // HTTPS!
));
```

### Certificat Pinning
```dart
import 'package:dio/dio.dart';
import 'package:package_info/package_info.dart';

class CertificatePinning {
  static Future<HttpClient> createHttpClient() async {
    SecurityContext context = SecurityContext.defaultContext;
    
    // Charger le certificat public
    List<int> bytes = await rootBundle.load('assets/certificate.pem').then(
      (data) => data.buffer.asUint8List(),
    );
    
    context.setTrustedCertificates(bytes);
    
    HttpClient httpClient = HttpClient(context: context);
    return httpClient;
  }
}
```

---

## 📊 Monitoring et Logging

### Logger les requêtes API
```dart
class LoggingInterceptor extends InterceptorsWrapper {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    print('--> ${options.method} ${options.path}');
    print('Headers: ${options.headers}');
    super.onRequest(options, handler);
  }
  
  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    print('<-- ${response.statusCode} ${response.requestOptions.path}');
    super.onResponse(response, handler);
  }
  
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    print('<-- ERROR ${err.response?.statusCode} ${err.requestOptions.path}');
    print('Error: ${err.message}');
    super.onError(err, handler);
  }
}
```

---

## 🧪 Testing

### Tester l'API Client
```dart
import 'package:mockito/mockito.dart';
import 'package:test/test.dart';

void main() {
  group('ApiClient', () {
    late ApiClient apiClient;
    late MockDio mockDio;
    
    setUp(() {
      mockDio = MockDio();
      apiClient = ApiClient();
    });
    
    test('verifyAssembly returns auth response', () async {
      when(mockDio.post(
        '/auth/assembly/verify',
        data: anyNamed('data'),
      )).thenAnswer((_) async => Response(
        statusCode: 200,
        data: {
          'data': {
            'assemblyId': 'ASM-001',
            'token': 'test_token',
            'expiresIn': 3600,
          }
        },
      ));
      
      final result = await apiClient.verifyAssembly(
        'Afrique',
        'ASM-001',
        '1234',
      );
      
      expect(result.assemblyId, equals('ASM-001'));
    });
  });
}
```

---

## 📈 Roadmap Intégration

**Phase 1 (Semaine 1):**
- [ ] Implémenter ApiClient
- [ ] Tester endpoints authentification
- [ ] Intégrer dans AuthService
- [ ] Tester login avec API

**Phase 2 (Semaine 2):**
- [ ] Implémenter SyncService
- [ ] Ajouter sync automatique
- [ ] Tester sync utilisateurs
- [ ] Tester sync activité

**Phase 3 (Semaine 3):**
- [ ] Offline mode avec queue
- [ ] Retry logic
- [ ] Error handling complet
- [ ] Testing complet

**Phase 4 (Semaine 4):**
- [ ] Security (cert pinning)
- [ ] Monitoring et logging
- [ ] Performance optimization
- [ ] Documentation API

---

**Version:** 1.0.0  
**Prêt pour:** Phase 2 (API Integration)

🔌 **Prêt à synchroniser vos données!**
