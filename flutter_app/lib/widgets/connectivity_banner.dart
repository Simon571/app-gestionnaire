import 'package:flutter/material.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

class ConnectivityBanner extends StatefulWidget {
  const ConnectivityBanner({super.key});

  @override
  State<ConnectivityBanner> createState() => _ConnectivityBannerState();
}

class _ConnectivityBannerState extends State<ConnectivityBanner> {
  late final Connectivity _connectivity;
  late final Stream<dynamic> _stream;
  bool _offline = false;

  @override
  void initState() {
    super.initState();
    _connectivity = Connectivity();
    _stream = _connectivity.onConnectivityChanged;
    _stream.listen((event) {
      // event peut être soit ConnectivityResult, soit List<ConnectivityResult>
      final results = event is List<ConnectivityResult> ? event : [event];
      setState(() {
        _offline = results.every((r) => r == ConnectivityResult.none);
      });
    });
    _connectivity.checkConnectivity().then((result) {
      final results = result is List<ConnectivityResult> ? result : [result];
      setState(() {
        _offline = results.every((r) => r == ConnectivityResult.none);
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_offline) return const SizedBox.shrink();
    return MaterialBanner(
      content: const Text('Aucune connexion Internet'),
      backgroundColor: Colors.red.shade700,
      actions: [
        TextButton(
          onPressed: () => setState(() {}),
          child: const Text('Réessayer', style: TextStyle(color: Colors.white)),
        ),
      ],
    );
  }
}
