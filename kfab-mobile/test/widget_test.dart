import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kfab_mobile/main.dart';

void main() {
  testWidgets('Renders KFAB Mobile App and displays Supervisor dashboard with Phase 4 tools', (WidgetTester tester) async {
    await tester.pumpWidget(const KfabMobileApp());
    await tester.pumpAndSettle();

    // Verify Supervisor header is displayed
    expect(find.text('SUPERVISOR'), findsOneWidget);

    // Verify Phase 4 quick action buttons
    expect(find.text('SCAN QR CODE'), findsOneWidget);
    expect(find.text('CHALLAN PHOTO'), findsOneWidget);

    // Verify Bottom Navigation active home item exists
    expect(find.byIcon(Icons.dashboard), findsOneWidget);
    expect(find.byIcon(Icons.fact_check_outlined), findsOneWidget);
    expect(find.byIcon(Icons.inventory_2_outlined), findsOneWidget);
    expect(find.byIcon(Icons.notifications_outlined), findsOneWidget);
    expect(find.byIcon(Icons.account_circle_outlined), findsOneWidget);
  });

  testWidgets('Can navigate to Notifications screen and view alerts', (WidgetTester tester) async {
    await tester.pumpWidget(const KfabMobileApp());
    await tester.pumpAndSettle();

    // Tap the Alerts tab icon
    await tester.tap(find.byIcon(Icons.notifications_outlined));
    await tester.pumpAndSettle();

    // Verify Notifications screen is displayed
    expect(find.text('Notifications & Alerts'), findsOneWidget);
    expect(find.text('Critical Low Stock: Argon Shielding Gas'), findsOneWidget);
  });

  testWidgets('Can navigate to Attendance screen and view muster register', (WidgetTester tester) async {
    await tester.pumpWidget(const KfabMobileApp());
    await tester.pumpAndSettle();

    // Tap the Attendance tab icon
    await tester.tap(find.byIcon(Icons.fact_check_outlined));
    await tester.pumpAndSettle();

    // Verify Attendance Muster Register screen is displayed
    expect(find.text('Daily Muster Register'), findsOneWidget);
    expect(find.text('Ramesh Sharma'), findsOneWidget);
    expect(find.text('PRESENT'), findsWidgets);
  });
}
