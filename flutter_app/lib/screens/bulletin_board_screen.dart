import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../services/storage_service.dart';
import '../services/communication_read_state_service.dart';
import '../services/attachment_service.dart';
import '../providers/auth_provider.dart';
import '../providers/bulletin_notifications_provider.dart';
import 'document_viewer_screen.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:open_filex/open_filex.dart';

/// Écran dédié pour afficher les communications d'un tableau spécifique
class BulletinBoardScreen extends ConsumerStatefulWidget {
  final String boardType; // 'assembly', 'elders', 'elders-assistants'
  final String boardLabel;

  const BulletinBoardScreen({
    Key? key,
    required this.boardType,
    required this.boardLabel,
  }) : super(key: key);

  @override
  ConsumerState<BulletinBoardScreen> createState() => _BulletinBoardScreenState();
}

class _BulletinBoardScreenState extends ConsumerState<BulletinBoardScreen> {
  List<Map<String, dynamic>> _communications = [];
  bool _isLoading = true;
  String _filterType = 'all'; // 'all', 'communication', 'document', 'lettre'
  String _filterRead = 'all'; // 'all', 'read', 'unread'
  String _sortBy = 'date'; // 'date', 'title', 'order'
  
  late CommunicationReadStateService _readStateService;
  late AttachmentService _attachmentService;
  Map<String, bool> _readStates = {};
  Map<String, bool> _downloadedStates = {};

  @override
  void initState() {
    super.initState();
    final storage = ref.read(storageServiceProvider);
    final auth = ref.read(authStateProvider);
    _readStateService = CommunicationReadStateService(storage, auth.user?.id);
    _attachmentService = AttachmentService();
    _loadCommunications();
    
    // Marquer les notifications de ce tableau comme lues
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(bulletinNotificationsProvider.notifier).markAllAsReadForBoard(widget.boardType);
    });
  }

  Future<void> _loadCommunications() async {
    setState(() => _isLoading = true);
    try {
      final storage = ref.read(storageServiceProvider);
      final data = await storage.getGenericData('communications');
      
      if (data != null && data.isNotEmpty) {
        final allItems = (data['items'] as List?) ?? 
                        (data['communications'] as List?) ?? 
                        const <dynamic>[];
        
        // Filtrer par type de tableau
        final filtered = allItems.where((item) {
          if (item is! Map<String, dynamic>) return false;
          final itemBoardType = (item['boardType'] ?? 'assembly').toString().toLowerCase();
          return itemBoardType == widget.boardType.toLowerCase();
        }).map((item) => Map<String, dynamic>.from(item as Map)).toList();
        
        setState(() {
          _communications = filtered;
          _sortCommunications();
        });
        
        // Charger les états de lecture
        await _loadReadStates();
        
        // Charger les états de téléchargement des pièces jointes
        await _loadDownloadedStates();
      }
    } catch (e) {
      print('❌ Error loading communications: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }
  
  Future<void> _loadReadStates() async {
    final states = <String, bool>{};
    for (final comm in _communications) {
      final id = comm['id']?.toString();
      if (id != null) {
        final isRead = await _readStateService.isRead(id);
        states[id] = isRead;
      }
    }
    setState(() => _readStates = states);
  }
  
  Future<void> _loadDownloadedStates() async {
    final states = <String, bool>{};
    for (final comm in _communications) {
      final id = comm['id']?.toString();
      final attachment = comm['attachment']?.toString();
      if (id != null && attachment != null && attachment.isNotEmpty) {
        final isDownloaded = await _attachmentService.isAttachmentDownloaded(
          fileName: attachment,
          boardType: widget.boardType,
          communicationId: id,
        );
        states[id] = isDownloaded;
      }
    }
    setState(() => _downloadedStates = states);
  }

  void _sortCommunications() {
    switch (_sortBy) {
      case 'date':
        _communications.sort((a, b) {
          final dateA = DateTime.tryParse(a['displayAfter'] ?? '') ?? DateTime.now();
          final dateB = DateTime.tryParse(b['displayAfter'] ?? '') ?? DateTime.now();
          return dateB.compareTo(dateA); // Plus récent en premier
        });
        break;
      case 'title':
        _communications.sort((a, b) {
          final titleA = (a['title'] ?? '').toString().toLowerCase();
          final titleB = (b['title'] ?? '').toString().toLowerCase();
          return titleA.compareTo(titleB);
        });
        break;
      case 'order':
        _communications.sort((a, b) {
          final orderA = a['order'] as int? ?? 999;
          final orderB = b['order'] as int? ?? 999;
          return orderA.compareTo(orderB);
        });
        break;
    }
  }

  List<Map<String, dynamic>> get _filteredCommunications {
    var filtered = _communications;
    
    // Filtrer par type
    if (_filterType != 'all') {
      filtered = filtered.where((comm) {
        final type = (comm['type'] ?? 'communication').toString();
        return type == _filterType;
      }).toList();
    }
    
    // Filtrer par état de lecture
    if (_filterRead != 'all') {
      filtered = filtered.where((comm) {
        final id = comm['id']?.toString();
        if (id == null) return false;
        final isRead = _readStates[id] ?? false;
        return _filterRead == 'read' ? isRead : !isRead;
      }).toList();
    }
    
    return filtered;
  }

  @override
  Widget build(BuildContext context) {
    final filteredItems = _filteredCommunications;
    
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.boardLabel),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadCommunications,
            tooltip: 'Actualiser',
          ),
        ],
      ),
      body: Column(
        children: [
          // Filtres et tri
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              border: Border(bottom: BorderSide(color: Colors.grey.shade300)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Filtrer par type:', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  children: [
                    _buildFilterChip('Tout', 'all'),
                    _buildFilterChip('Communications', 'communication'),
                    _buildFilterChip('Documents', 'document'),
                    _buildFilterChip('Lettres', 'lettre'),
                  ],
                ),
                const SizedBox(height: 12),                const Text('Filtrer par état:', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  children: [
                    _buildReadFilterChip('Tout', 'all'),
                    _buildReadFilterChip('Non lues', 'unread'),
                    _buildReadFilterChip('Lues', 'read'),
                  ],
                ),
                const SizedBox(height: 12),                Row(
                  children: [
                    const Text('Trier par:', style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(width: 12),
                    DropdownButton<String>(
                      value: _sortBy,
                      items: const [
                        DropdownMenuItem(value: 'date', child: Text('Date')),
                        DropdownMenuItem(value: 'title', child: Text('Titre')),
                        DropdownMenuItem(value: 'order', child: Text('Ordre')),
                      ],
                      onChanged: (value) {
                        if (value != null) {
                          setState(() {
                            _sortBy = value;
                            _sortCommunications();
                          });
                        }
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
          
          // Liste des communications
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : filteredItems.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.inbox, size: 64, color: Colors.grey.shade400),
                            const SizedBox(height: 16),
                            Text(
                              'Aucune communication',
                              style: TextStyle(fontSize: 18, color: Colors.grey.shade600),
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadCommunications,
                        child: ListView.separated(
                          padding: const EdgeInsets.all(12),
                          itemCount: filteredItems.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final comm = filteredItems[index];
                            return _buildCommunicationCard(comm);
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _filterType == value;
    
    // Compter les messages non lus pour ce type
    int unreadCount = 0;
    if (value != 'all') {
      for (final comm in _communications) {
        final commType = comm['type']?.toString() ?? 'communication';
        final commId = comm['id']?.toString() ?? '';
        final isRead = _readStates[commId] ?? false;
        
        if (value == 'communication' && commType == 'communication' && !isRead) {
          unreadCount++;
        } else if (value == 'document' && (commType == 'document' || commType == 'lettre') && !isRead) {
          unreadCount++;
        } else if (value == 'lettre' && commType == 'lettre' && !isRead) {
          unreadCount++;
        }
      }
    }
    
    return FilterChip(
      label: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label),
          if (unreadCount > 0) ...[
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.red,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                unreadCount.toString(),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ],
      ),
      selected: isSelected,
      onSelected: (selected) {
        setState(() => _filterType = value);
      },
      selectedColor: Theme.of(context).primaryColor.withOpacity(0.3),
    );
  }
  
  Widget _buildReadFilterChip(String label, String value) {
    final isSelected = _filterRead == value;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() => _filterRead = value);
      },
      selectedColor: Colors.green.withOpacity(0.3),
    );
  }

  Widget _buildCommunicationCard(Map<String, dynamic> comm) {
    final id = comm['id']?.toString() ?? '';
    final title = comm['title']?.toString() ?? 'Sans titre';
    final content = comm['content']?.toString() ?? '';
    final type = comm['type']?.toString() ?? 'communication';
    final displayAfter = DateTime.tryParse(comm['displayAfter'] ?? '');
    final expirationDate = DateTime.tryParse(comm['expirationDate'] ?? '');
    final attachment = comm['attachment']?.toString();
    final link = comm['link']?.toString() ?? comm['url']?.toString();
    final order = comm['order'] as int? ?? 0;
    
    final isRead = _readStates[id] ?? false;
    final isDownloaded = _downloadedStates[id] ?? false;
    
    // Déterminer l'icône selon le type
    IconData typeIcon;
    Color typeColor;
    switch (type) {
      case 'document':
        typeIcon = Icons.description;
        typeColor = Colors.blue;
        break;
      case 'lettre':
        typeIcon = Icons.mail;
        typeColor = Colors.purple;
        break;
      default:
        typeIcon = Icons.announcement;
        typeColor = Colors.orange;
    }

    return Card(
      elevation: 2,
      color: isRead ? Colors.grey.shade50 : Colors.white,
      child: InkWell(
        onTap: () => _showDetailDialog(comm),
        onLongPress: () => _showContextMenu(comm),
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // En-tête avec type, ordre et statut de lecture
              Row(
                children: [
                  Icon(typeIcon, color: typeColor, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      title,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: isRead ? FontWeight.normal : FontWeight.bold,
                      ),
                    ),
                  ),
                  if (!isRead)
                    Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: Colors.blue,
                        shape: BoxShape.circle,
                      ),
                    ),
                  const SizedBox(width: 8),
                  if (order > 0)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '#$order',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                    ),
                ],
              ),
              
              const SizedBox(height: 8),
              
              // Contenu (aperçu)
              if (content.isNotEmpty)
                Text(
                  content.length > 120 ? '${content.substring(0, 120)}...' : content,
                  style: TextStyle(
                    color: isRead ? Colors.grey.shade600 : Colors.grey.shade700,
                  ),
                ),
              
              const SizedBox(height: 12),
              
              // Métadonnées
              Wrap(
                spacing: 12,
                runSpacing: 8,
                children: [
                  if (displayAfter != null)
                    _buildInfoChip(
                      Icons.calendar_today,
                      'Affiché: ${DateFormat('dd/MM/yyyy').format(displayAfter)}',
                      Colors.green,
                    ),
                  if (expirationDate != null)
                    _buildInfoChip(
                      Icons.event_busy,
                      'Expire: ${DateFormat('dd/MM/yyyy').format(expirationDate)}',
                      Colors.red,
                    ),
                  if (attachment != null && attachment.isNotEmpty)
                    _buildInfoChip(
                      isDownloaded ? Icons.download_done : Icons.attach_file,
                      attachment,
                      isDownloaded ? Colors.green : Colors.blue,
                    ),
                  if (link != null && link.isNotEmpty)
                    _buildInfoChip(
                      Icons.link,
                      'Lien disponible',
                      Colors.purple,
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoChip(IconData icon, String label, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(width: 4),
        Text(
          label,
          style: TextStyle(fontSize: 12, color: color),
        ),
      ],
    );
  }

  Future<void> _showDetailDialog(Map<String, dynamic> comm) async {
    final id = comm['id']?.toString() ?? '';
    final title = comm['title']?.toString() ?? 'Sans titre';
    final content = comm['content']?.toString() ?? '';
    final type = comm['type']?.toString() ?? 'communication';
    final displayAfter = DateTime.tryParse(comm['displayAfter'] ?? '');
    final expirationDate = DateTime.tryParse(comm['expirationDate'] ?? '');
    final attachment = comm['attachment']?.toString();
    final link = comm['link']?.toString() ?? comm['url']?.toString();
    
    // Marquer comme lu
    if (id.isNotEmpty) {
      await _readStateService.markAsRead(id);
      setState(() {
        _readStates[id] = true;
      });
    }
    
    final isDownloaded = _downloadedStates[id] ?? false;
    
    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Type
              _buildDetailRow('Type', _formatType(type)),
              
              // Dates
              if (displayAfter != null)
                _buildDetailRow(
                  'Date d\'affichage',
                  DateFormat('dd/MM/yyyy HH:mm').format(displayAfter),
                ),
              if (expirationDate != null)
                _buildDetailRow(
                  'Date d\'expiration',
                  DateFormat('dd/MM/yyyy').format(expirationDate),
                ),
              
              const Divider(),
              
              // Contenu
              if (content.isNotEmpty) ...[
                const Text(
                  'Contenu:',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(content),
                const SizedBox(height: 16),
              ],
              
              // Pièce jointe
              if (attachment != null && attachment.isNotEmpty) ...[
                _buildDetailRow('Pièce jointe', attachment),
                const SizedBox(height: 8),
                if (isDownloaded)
                  ElevatedButton.icon(
                    onPressed: () {
                      Navigator.pop(context);
                      _openAttachment(id, attachment);
                    },
                    icon: const Icon(Icons.visibility),
                    label: const Text('Visualiser la pièce jointe'),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                  )
                else
                  ElevatedButton.icon(
                    onPressed: () {
                      Navigator.pop(context);
                      _downloadAttachment(id, attachment, link);
                    },
                    icon: const Icon(Icons.download),
                    label: const Text('Télécharger la pièce jointe'),
                  ),
              ],
              
              // Lien
              if (link != null && link.isNotEmpty) ...[
                const SizedBox(height: 8),
                ElevatedButton.icon(
                  onPressed: () => _openLink(link),
                  icon: const Icon(Icons.open_in_new),
                  label: const Text('Ouvrir le lien'),
                ),
              ],
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Fermer'),
          ),
        ],
      ),
    );
  }
  
  void _showContextMenu(Map<String, dynamic> comm) {
    final id = comm['id']?.toString() ?? '';
    final isRead = _readStates[id] ?? false;
    
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: Icon(isRead ? Icons.mark_email_unread : Icons.mark_email_read),
              title: Text(isRead ? 'Marquer comme non lu' : 'Marquer comme lu'),
              onTap: () {
                Navigator.pop(context);
                _toggleReadState(id);
              },
            ),
            ListTile(
              leading: const Icon(Icons.info),
              title: const Text('Voir les détails'),
              onTap: () {
                Navigator.pop(context);
                _showDetailDialog(comm);
              },
            ),
          ],
        ),
      ),
    );
  }
  
  Future<void> _toggleReadState(String id) async {
    final isRead = _readStates[id] ?? false;
    if (isRead) {
      await _readStateService.markAsUnread(id);
    } else {
      await _readStateService.markAsRead(id);
    }
    setState(() {
      _readStates[id] = !isRead;
    });
  }
  
  Future<void> _downloadAttachment(String commId, String fileName, String? linkUrl) async {
    if (linkUrl == null || linkUrl.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Aucune URL de téléchargement disponible')),
      );
      return;
    }

    // Afficher une boîte de dialogue de progression
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) {
          double progress = 0.0;
          
          // Lancer le téléchargement
          _attachmentService.downloadAttachment(
            url: linkUrl,
            fileName: fileName,
            boardType: widget.boardType,
            communicationId: commId,
            onProgress: (p) {
              setDialogState(() => progress = p);
            },
          ).then((file) {
            Navigator.pop(context);
            if (file != null) {
              setState(() {
                _downloadedStates[commId] = true;
              });
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('✅ Téléchargement terminé')),
              );
            } else {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('❌ Échec du téléchargement')),
              );
            }
          }).catchError((error) {
            Navigator.pop(context);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('❌ Erreur: $error')),
            );
          });
          
          return AlertDialog(
            title: const Text('Téléchargement en cours'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                LinearProgressIndicator(value: progress > 0 ? progress : null),
                const SizedBox(height: 16),
                Text('${(progress * 100).toStringAsFixed(0)}%'),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Téléchargement annulé')),
                  );
                },
                child: const Text('Annuler'),
              ),
            ],
          );
        },
      ),
    );
  }
  
  Future<void> _openAttachment(String commId, String fileName) async {
    final filePath = await _attachmentService.getAttachmentPath(
      fileName: fileName,
      boardType: widget.boardType,
      communicationId: commId,
    );
    
    if (filePath != null) {
      // Détecter le type de fichier pour choisir le bon visualiseur
      final extension = fileName.toLowerCase().split('.').last;
      
      if (extension == 'pdf' || extension == 'jpg' || extension == 'jpeg' || 
          extension == 'png' || extension == 'gif' || extension == 'txt') {
        // Utiliser le visualiseur intégré pour ces types
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => DocumentViewerScreen(
              filePath: filePath,
              title: fileName,
            ),
          ),
        );
      } else {
        // Utiliser l'application externe pour les autres types
        final result = await OpenFilex.open(filePath);
        if (result.type != ResultType.done) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Impossible d\'ouvrir le fichier: ${result.message}')),
          );
        }
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Fichier non trouvé')),
      );
    }
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              '$label:',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(
            child: Text(value),
          ),
        ],
      ),
    );
  }

  String _formatType(String type) {
    switch (type) {
      case 'communication':
        return 'Communication';
      case 'document':
        return 'Document';
      case 'lettre':
        return 'Lettre';
      default:
        return type;
    }
  }

  Future<void> _openLink(String url) async {
    final uri = Uri.tryParse(url);
    if (uri != null && await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Impossible d\'ouvrir le lien')),
      );
    }
  }
}
