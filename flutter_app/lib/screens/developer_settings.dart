import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/storage_service.dart';
import '../providers/auth_provider.dart' show storageServiceProvider;

class DeveloperSettings extends ConsumerStatefulWidget {
  const DeveloperSettings({Key? key}) : super(key: key);

  @override
  ConsumerState<DeveloperSettings> createState() => _DeveloperSettingsState();
}

class _DeveloperSettingsState extends ConsumerState<DeveloperSettings> {
  final TextEditingController _apiBaseController = TextEditingController();
  bool _loading = false;
  String _message = '';
  String _effectiveApiBase = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final storage = ref.read(storageServiceProvider);
    final effective = await storage.getEffectiveApiBase();
    final overridden = await storage.getApiBase();
    if (mounted) {
      setState(() {
        _effectiveApiBase = effective;
      });
      // Show the actual override when present; otherwise show the effective default.
      _apiBaseController.text = (overridden != null && overridden.trim().isNotEmpty) ? overridden : effective;
    }
  }

  Future<void> _save() async {
    setState(() => _loading = true);
    final storage = ref.read(storageServiceProvider);
    final raw = _apiBaseController.text.trim();
    await storage.setApiBase(raw);

    final effective = await storage.getEffectiveApiBase();
    setState(() {
      _loading = false;
      _effectiveApiBase = effective;
      _message = raw.isEmpty ? 'Effacé (valeur par défaut utilisée)' : 'Sauvegardé';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Paramètres serveur')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            if (!kDebugMode)
              const Padding(
                padding: EdgeInsets.only(bottom: 12.0),
                child: Text(
                  "Option avancée. Utilise l'adresse IP de ton PC (réseau Wi‑Fi) ou 10.0.2.2 sur émulateur Android.",
                ),
              ),
            TextField(
              controller: _apiBaseController,
              decoration: const InputDecoration(labelText: 'API Base (ex: http://192.168.1.5:3000)'),
              keyboardType: TextInputType.url,
            ),
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                _effectiveApiBase.isEmpty ? '' : 'Actuel: $_effectiveApiBase',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey.shade700),
              ),
            ),
            const SizedBox(height: 12),
            ElevatedButton(onPressed: _loading ? null : _save, child: const Text('Save')),
            const SizedBox(height: 12),
            Text(_message),
          ],
        ),
      ),
    );
  }
}
