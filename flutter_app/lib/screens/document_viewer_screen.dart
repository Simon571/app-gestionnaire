import 'dart:io';
import 'package:flutter/material.dart';
import 'package:pdfx/pdfx.dart';
import 'package:path/path.dart' as path;
import 'package:open_filex/open_filex.dart';

/// Écran pour visualiser différents types de documents
class DocumentViewerScreen extends StatefulWidget {
  final String filePath;
  final String title;

  const DocumentViewerScreen({
    Key? key,
    required this.filePath,
    required this.title,
  }) : super(key: key);

  @override
  State<DocumentViewerScreen> createState() => _DocumentViewerScreenState();
}

class _DocumentViewerScreenState extends State<DocumentViewerScreen> {
  late String _fileExtension;
  bool _isLoading = true;
  String? _errorMessage;
  PdfController? _pdfController;

  @override
  void initState() {
    super.initState();
    _fileExtension = path.extension(widget.filePath).toLowerCase();
    _loadDocument();
  }

  @override
  void dispose() {
    _pdfController?.dispose();
    super.dispose();
  }

  Future<void> _loadDocument() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final file = File(widget.filePath);
      
      if (!await file.exists()) {
        throw Exception('Le fichier n\'existe pas');
      }

      // Pour les PDF, initialiser le contrôleur
      if (_fileExtension == '.pdf') {
        _pdfController = PdfController(
          document: PdfDocument.openFile(widget.filePath),
        );
      }

      setState(() => _isLoading = false);
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Erreur lors du chargement: $e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
        actions: [
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: _shareDocument,
            tooltip: 'Partager',
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Chargement du document...'),
          ],
        ),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red.shade300),
            const SizedBox(height: 16),
            Text(
              _errorMessage!,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 16),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadDocument,
              child: const Text('Réessayer'),
            ),
          ],
        ),
      );
    }

    // Afficher selon le type de fichier
    switch (_fileExtension) {
      case '.pdf':
        return _buildPdfViewer();
      case '.jpg':
      case '.jpeg':
      case '.png':
      case '.gif':
      case '.webp':
        return _buildImageViewer();
      case '.txt':
      case '.md':
        return _buildTextViewer();
      default:
        return _buildUnsupportedViewer();
    }
  }

  Widget _buildPdfViewer() {
    if (_pdfController == null) {
      return const Center(child: Text('Erreur d\'initialisation du PDF'));
    }

    return Column(
      children: [
        // Barre de navigation PDF
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.grey.shade200,
            border: Border(bottom: BorderSide(color: Colors.grey.shade400)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.first_page),
                onPressed: () {
                  _pdfController?.animateToPage(
                    1,
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeInOut,
                  );
                },
              ),
              IconButton(
                icon: const Icon(Icons.chevron_left),
                onPressed: () {
                  _pdfController?.previousPage(
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeInOut,
                  );
                },
              ),
              PdfPageNumber(
                controller: _pdfController!,
                builder: (context, loadingState, page, pagesCount) {
                  return Text(
                    'Page $page / $pagesCount',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  );
                },
              ),
              IconButton(
                icon: const Icon(Icons.chevron_right),
                onPressed: () {
                  _pdfController?.nextPage(
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeInOut,
                  );
                },
              ),
              IconButton(
                icon: const Icon(Icons.last_page),
                onPressed: () async {
                  final pagesCount = _pdfController!.pagesCount;
                  if (pagesCount != null) {
                    _pdfController?.animateToPage(
                      pagesCount,
                      duration: const Duration(milliseconds: 300),
                      curve: Curves.easeInOut,
                    );
                  }
                },
              ),
            ],
          ),
        ),
        // Visualiseur PDF
        Expanded(
          child: PdfView(
            controller: _pdfController!,
            scrollDirection: Axis.vertical,
            builders: PdfViewBuilders<DefaultBuilderOptions>(
              options: const DefaultBuilderOptions(),
              documentLoaderBuilder: (_) => const Center(
                child: CircularProgressIndicator(),
              ),
              pageLoaderBuilder: (_) => const Center(
                child: CircularProgressIndicator(),
              ),
              errorBuilder: (_, error) => Center(
                child: Text('Erreur: $error'),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildImageViewer() {
    return InteractiveViewer(
      minScale: 0.5,
      maxScale: 4.0,
      child: Center(
        child: Image.file(
          File(widget.filePath),
          errorBuilder: (context, error, stackTrace) {
            return Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.broken_image, size: 64, color: Colors.red.shade300),
                const SizedBox(height: 16),
                Text('Impossible de charger l\'image'),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildTextViewer() {
    return FutureBuilder<String>(
      future: File(widget.filePath).readAsString(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        if (snapshot.hasError) {
          return Center(
            child: Text('Erreur: ${snapshot.error}'),
          );
        }

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: SelectableText(
            snapshot.data ?? '',
            style: const TextStyle(fontSize: 14, fontFamily: 'monospace'),
          ),
        );
      },
    );
  }

  Widget _buildUnsupportedViewer() {
    final fileName = path.basename(widget.filePath);
    final fileSize = File(widget.filePath).lengthSync();
    final formattedSize = _formatBytes(fileSize);

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.insert_drive_file, size: 80, color: Colors.grey.shade400),
            const SizedBox(height: 24),
            Text(
              fileName,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Type: $_fileExtension',
              style: TextStyle(color: Colors.grey.shade600),
            ),
            Text(
              'Taille: $formattedSize',
              style: TextStyle(color: Colors.grey.shade600),
            ),
            const SizedBox(height: 24),
            const Text(
              'Aperçu non disponible pour ce type de fichier',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 16),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _openWithExternalApp,
              icon: const Icon(Icons.open_in_new),
              label: const Text('Ouvrir avec une autre application'),
            ),
          ],
        ),
      ),
    );
  }

  String _formatBytes(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    if (bytes < 1024 * 1024 * 1024) return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
  }

  Future<void> _openWithExternalApp() async {
    try {
      // Utiliser open_filex pour ouvrir avec l'application par défaut
      final result = await OpenFilex.open(widget.filePath);
      
      if (result.type != ResultType.done && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Impossible d\'ouvrir: ${result.message}')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e')),
        );
      }
    }
  }

  Future<void> _shareDocument() async {
    // TODO: Implémenter le partage avec share_plus
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Fonction de partage à venir')),
    );
  }
}
