import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gestionnaire_app/screens/vcm_page.dart';
import 'package:gestionnaire_app/models/vcm_models.dart';
import 'package:gestionnaire_app/providers/vcm_assignments_provider.dart';
import 'package:gestionnaire_app/providers/auth_provider.dart';
import 'package:gestionnaire_app/services/auth_service.dart';
import 'package:gestionnaire_app/services/storage_service.dart';

void main() {
  // Minimal Auth StateNotifier for tests
  testWidgets('Vie chrétienne meeting hides top participant chips and shows names in items', (WidgetTester tester) async {
    // Build a minimal week assignments state with meetingType = vie_chretienne_ministere
    final weekStart = DateTime(2025, 12, 7);
    final participant = VcmParticipant(
      personId: 'person-1764632007249',
      personName: 'Simon Nzamba Malongi',
      role: 'hall1:treasures_president',
      weekStart: weekStart,
    );
    final assignments = VcmWeekAssignments(
      weekStart: weekStart,
      weekEnd: weekStart.add(Duration(days: 6)),
      weekLabel: '08 déc. - 14 déc. 2025',
      participants: [participant],
      assignments: {},
      meetingType: 'vie_chretienne_ministere',
    );

    // Override provider to return our state
    final state = VcmAssignmentsState(weeks: [assignments]);

    await tester.pumpWidget(
      ProviderScope(overrides: [
        vcmAssignmentsProvider.overrideWith((ref) => Future.value(state)),
        // Skip auth override for now - use default
      ], child: MaterialApp(home: VcmPage(weekStart: weekStart, vcmWeek: null))),
    );

    // Advance until provider & widgets are built
    await tester.pumpAndSettle();

    // There should be no top chips showing the participant name
    expect(find.byType(Chip), findsNothing);

    // Because vcmWeek is null in this minimal test, we skip checking labels inside the cahier.
    // Another integration test would provide a full VcmWeek and check for a Text widget with participant name.
  });

  testWidgets('Names appear inline in cahier for vie_chretienne meeting', (WidgetTester tester) async {
    final weekStart = DateTime(2025, 12, 7);
    final participant = VcmParticipant(
      personId: 'person-1764632007249',
      personName: 'Simon Nzamba Malongi',
      role: 'hall1:life_0_participant',
      weekStart: weekStart,
    );

    final assignments = VcmWeekAssignments(
      weekStart: weekStart,
      weekEnd: weekStart.add(Duration(days: 6)),
      weekLabel: '08 déc. - 14 déc. 2025',
      participants: [participant],
      assignments: {},
      meetingType: 'vie_chretienne_ministere',
    );

    final vieSection = VcmSection(
      key: 'vie_chretienne',
      title: 'Vie chrétienne',
      items: [
        VcmItem(type: 'discours', title: 'Besoins de l\'assemblée', theme: 'Besoins de l\'assemblée', duration: 15),
      ],
    );
    final vcmWeek = VcmWeek(
      weekTitle: '08 déc. - 14 déc. 2025',
      startDate: '2025-12-07',
      endDate: '2025-12-13',
      sourceUrl: '',
      issue: '',
      sections: [
        VcmSection(key: 'joyaux', title: 'Joyaux de la Parole de Dieu', items: const []),
        VcmSection(key: 'ministere', title: 'Applique-toi au ministère', items: const []),
        vieSection,
        VcmSection(key: 'cantiques', title: 'Cantiques', items: const []),
      ],
    );

    final state = VcmAssignmentsState(weeks: [assignments]);

    await tester.pumpWidget(
      ProviderScope(overrides: [
        vcmAssignmentsProvider.overrideWith((ref) => Future.value(state)),
        // Skip auth override for now - use default
      ], child: MaterialApp(home: VcmPage(weekStart: weekStart, vcmWeek: vcmWeek))),
    );
    await tester.pumpAndSettle();

    // There should be no top chips
    expect(find.byType(Chip), findsNothing);

    // The cahier should show the name inline for the vie_chretienne item
    expect(find.byWidgetPredicate((w) => w is Text && (w.data ?? '').contains('Simon Nzamba Malongi')), findsWidgets);
  });
}

// Minimal Auth Notifier for tests - no longer needed for this test
// class TestAuthNotifier extends AuthStateNotifier {
//   TestAuthNotifier() : super(AuthService(StorageService()));
// }
