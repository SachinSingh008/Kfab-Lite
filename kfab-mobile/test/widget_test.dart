import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kfab_mobile/core/state/auth_state.dart';
import 'package:kfab_mobile/screens/shell/main_shell_screen.dart';

void main() {
  testWidgets('Renders MainShellScreen with Top AppBar and Hamburger Menu', (WidgetTester tester) async {
    final authState = AuthState();
    authState.login(email: 'superadmin@kfab.in', password: 'admin123', role: UserRole.superAdmin);

    await tester.pumpWidget(MaterialApp(home: MainShellScreen(authState: authState)));
    await tester.pumpAndSettle();

    // Verify top hamburger icon is displayed
    expect(find.byIcon(Icons.menu_rounded), findsOneWidget);

    // Verify Top AppBar branding text
    expect(
      find.byWidgetPredicate((w) => w is RichText && w.text.toPlainText().contains('kfabs')),
      findsOneWidget,
    );

    // Verify 5 Bottom Navigation items: [Inventory, Attendance, Home, Report, Chat]
    expect(find.text('Inventory'), findsOneWidget);
    expect(find.text('Attendance'), findsOneWidget);
    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Report'), findsOneWidget);
    expect(find.text('Chat'), findsOneWidget);
  });

  testWidgets('Tapping top-left hamburger menu opens Navigation Drawer', (WidgetTester tester) async {
    final authState = AuthState();
    authState.login(email: 'superadmin@kfab.in', password: 'admin123', role: UserRole.superAdmin);

    await tester.pumpWidget(MaterialApp(home: MainShellScreen(authState: authState)));
    await tester.pumpAndSettle();

    // Find the hamburger icon button
    final hamburgerFinder = find.byIcon(Icons.menu_rounded);
    expect(hamburgerFinder, findsOneWidget);

    // Tap Hamburger icon
    await tester.tap(hamburgerFinder);
    await tester.pumpAndSettle();

    // Verify Navigation Drawer opened and shows navigation sections & profile edit
    expect(find.text('PRIMARY MODULES & TABS'), findsOneWidget);
    expect(find.text('Operations Dashboard'), findsWidgets);
    expect(find.text('Edit Profile & Change Name'), findsOneWidget);
  });

  testWidgets('Can navigate to Attendance muster via bottom bar', (WidgetTester tester) async {
    final authState = AuthState();
    authState.login(email: 'superadmin@kfab.in', password: 'admin123', role: UserRole.superAdmin);

    await tester.pumpWidget(MaterialApp(home: MainShellScreen(authState: authState)));
    await tester.pumpAndSettle();

    // Tap Attendance bottom nav item
    await tester.tap(find.byIcon(Icons.fact_check_outlined));
    await tester.pumpAndSettle();

    // Verify Attendance muster view is displayed
    expect(find.text('Daily Muster Register'), findsOneWidget);
  });
}
