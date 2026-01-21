import 'package:flutter_test/flutter_test.dart';
import 'package:gestionnaire_app/providers/vcm_assignments_provider.dart';

void main() {
  test('getWeekAssignments matches week regardless of UTC offset', () {
    // Simulate a week stored with UTC weekStart
    final jsonWeek = {
      'weekStart': '2025-12-07T23:00:00.000Z',
      'weekEnd': '2025-12-13T23:00:00.000Z',
      'weekLabel': '08 déc. - 14 déc. 2025',
      'participants': [
        {'personId': 'person-1', 'personName': 'Alice', 'role': 'a', 'date': '2025-12-07T23:00:00.000Z'}
      ],
      'assignments': {}
    };

    final week = VcmWeekAssignments.fromJson(jsonWeek);

    final state = VcmAssignmentsState(weeks: [week]);

    // Local Date for 2025-12-08 at midnight should match the stored weekStart
    final query = DateTime(2025, 12, 8);
    final result = state.getWeekAssignments(query);

    expect(result, isNotNull);
    expect(result!.participants.isNotEmpty, isTrue);
    expect(result.participants.first.personName, 'Alice');
  });

  test('meetingType loaded and available from week assignments', () {
    final jsonWeek = {
      'weekStart': '2025-12-07',
      'weekEnd': '2025-12-13',
      'weekLabel': '08 déc. - 14 déc. 2025',
      'meetingType': 'vie_chretienne_ministere',
      'participants': [],
      'assignments': {}
    };
    final week = VcmWeekAssignments.fromJson(jsonWeek);
    final state = VcmAssignmentsState(weeks: [week]);
    final result = state.getWeekAssignments(DateTime(2025, 12, 7));
    expect(result, isNotNull);
    expect(result!.meetingType, 'vie_chretienne_ministere');
  });
}
