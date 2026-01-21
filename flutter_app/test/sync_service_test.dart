import 'dart:convert';

import 'package:crypto/crypto.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gestionnaire_app/services/sync_service.dart';

void main() {
  test('SyncCredentials.generateAuthHeaders produces server-compatible signature', () {
    final creds = SyncCredentials(
      deviceId: 'mobile-main',
      apiKey: 'mobile-secret-key-456',
      apiBase: 'http://localhost:3000',
    );

    final uri = Uri.parse('/api/publisher-app/updates');
    final headers = creds.generateAuthHeaders(method: 'GET', uri: uri);

    // Recompute expected signature using server algorithm
    final timestamp = headers['x-timestamp']!;
    final pathAndQuery = '${uri.path}${uri.hasQuery ? '?${uri.query}' : ''}';
    final payload = 'GET\n$pathAndQuery\n$timestamp';

    final hashedKey = sha256.convert(utf8.encode(creds.apiKey)).toString();
    final expectedSignature = Hmac(sha256, utf8.encode(hashedKey))
        .convert(utf8.encode(payload))
        .toString();

    expect(headers.containsKey('x-signature'), isTrue);
    expect(headers['x-signature'], expectedSignature);
  });
}
