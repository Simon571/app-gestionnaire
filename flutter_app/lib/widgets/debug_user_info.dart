import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';
import '../services/storage_service.dart';

class DebugUserInfo extends ConsumerWidget {
  const DebugUserInfo({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authStateProvider);
    final user = auth.user;

    if (user == null) {
      return const Text('Aucun utilisateur connecté');
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('👤 ${user.displayName}'),
        Text('📧 ID: ${user.id}'),
        Text('🔑 PIN: ${user.pin}'),
        Text('👥 GroupID: ${user.spiritual.group ?? "NULL"}'),
        Text('👥 GroupName: ${user.spiritual.groupName ?? "NULL"}'),
        Text('📋 Function: ${user.spiritual.function ?? "NULL"}'),
        Text('🎯 Role: ${user.spiritual.roleInGroup ?? "NULL"}'),
      ],
    );
  }
}
