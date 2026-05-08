import 'dart:io';
import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../providers/settings_provider.dart';

class QRScannerScreen extends ConsumerStatefulWidget {
  const QRScannerScreen({super.key});

  @override
  ConsumerState<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends ConsumerState<QRScannerScreen> {
  MobileScannerController cameraController = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
  );

  bool _isProcessing = false;

  @override
  void dispose() {
    cameraController.dispose();
    super.dispose();
  }

  Future<void> _handleScan(String scannedUrl) async {
    if (_isProcessing) return;
    _isProcessing = true;

    try {
      // Extraire l'URL de l'API depuis le QR code
      String apiUrl = scannedUrl;
      
      // Si le QR code contient juste l'IP (ex: 192.168.1.50:3000)
      if (!apiUrl.startsWith('http')) {
        apiUrl = 'http://$apiUrl';
      }
      
      // Si c'est une URL complète, extraire l'origine
      try {
        final uri = Uri.parse(apiUrl);
        if (uri.host.isNotEmpty) {
          apiUrl = '${uri.scheme}://${uri.host}:${uri.port}';
        }
      } catch (_) {}

      // Sauvegarder l'URL dans les préférences
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('api_base', apiUrl);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Serveur configuré avec succès!'),
            backgroundColor: Colors.green,
          ),
        );
        
        // Retourner à l'écran précédent avec succès
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e')),
        );
      }
    } finally {
      _isProcessing = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scanner le QR Code'),
        actions: [
          IconButton(
            icon: const Icon(Icons.flash_on),
            onPressed: () => cameraController.toggleTorch(),
          ),
        ],
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.blue.shade50,
            child: const Row(
              children: [
                Icon(Icons.info, color: Colors.blue),
                SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Scannez le QR code affiché sur l\'application Windows.\n'
                    'L\'URL du serveur sera configurée automatiquement.',
                    style: TextStyle(fontSize: 14),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: MobileScanner(
              controller: cameraController,
              onDetect: (capture) {
                final List<Barcode> barcodes = capture.barcodes;
                for (final barcode in barcodes) {
                  if (barcode.rawValue != null) {
                    _handleScan(barcode.rawValue!);
                    break;
                  }
                }
              },
              errorBuilder: (context, error, child) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error, size: 64, color: Colors.red),
                      const SizedBox(height: 16),
                      Text('Erreur caméra: ${error.errorDetails?.message ?? error.errorCode.name}'),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () => cameraController.stop(),
                        child: const Text('Réessayer'),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
