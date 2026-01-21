import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/storage_service.dart';
import '../models/person.dart';
import '../providers/auth_provider.dart' show storageServiceProvider;

class AdminImportUsers extends ConsumerStatefulWidget {
  const AdminImportUsers({Key? key}) : super(key: key);

  @override
  ConsumerState<AdminImportUsers> createState() => _AdminImportUsersState();
}

class _AdminImportUsersState extends ConsumerState<AdminImportUsers> {
  final TextEditingController _controller = TextEditingController();
  bool _isLoading = false;
  String _message = '';

  Future<void> _import() async {
    setState(() {
      _isLoading = true;
      _message = '';
    });

    try {
      final jsonString = _controller.text.trim();
      if (jsonString.isEmpty) throw 'JSON vide';
      final List<dynamic> parsed = jsonDecode(jsonString) as List<dynamic>;
      final people = parsed.map((e) => Person.fromJson(Map<String, dynamic>.from(e as Map))).toList();
      final storage = ref.read(storageServiceProvider);
      await storage.savePeople(people);
      setState(() => _message = 'Import réussi : ${people.length} utilisateurs');
    } catch (e) {
      setState(() => _message = 'Erreur import : $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _showCurrent() async {
    final storage = ref.read(storageServiceProvider);
    final people = await storage.getPeople();
    setState(() => _message = 'Actuellement ${people.length} utilisateurs (ex: ${people.isNotEmpty ? people.first.displayName : 'aucun'})');
  }

  Future<void> _clear() async {
    final storage = ref.read(storageServiceProvider);
    await storage.savePeople([]);
    setState(() => _message = 'Liste effacée');
  }

  @override
  Widget build(BuildContext context) {
    if (!kDebugMode) {
      return const Scaffold(
        body: Center(child: Text('Admin disponible uniquement en debug')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin — Import Users'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            const Text('Collez ici le JSON de la liste d\'utilisateurs (format array)'),
            const SizedBox(height: 8),
            Expanded(
              child: TextField(
                controller: _controller,
                maxLines: null,
                expands: true,
                decoration: const InputDecoration(
                  border: OutlineInputBorder(),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                ElevatedButton(
                  onPressed: _isLoading ? null : _import,
                  child: _isLoading ? const CircularProgressIndicator() : const Text('Importer'),
                ),
                const SizedBox(width: 8),
                OutlinedButton(onPressed: _showCurrent, child: const Text('Afficher')), 
                const SizedBox(width: 8),
                TextButton(onPressed: _clear, child: const Text('Effacer')),
              ],
            ),
            const SizedBox(height: 8),
            Text(_message),
          ],
        ),
      ),
    );
  }
}
