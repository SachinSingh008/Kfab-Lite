import 'package:flutter_test/flutter_test.dart';
import 'package:kfab_mobile/core/state/auth_state.dart';

void main() {
  group('AuthState & Authentication Validation Tests', () {
    test('resolveEmail correctly maps quick role keywords to database emails', () {
      expect(AuthState.resolveEmail('superadmin'), 'sachinasinghofficial@gmail.com');
      expect(AuthState.resolveEmail('admin'), 'sachin.asingh18@gmail.com');
      expect(AuthState.resolveEmail('supervisor'), 'vikasyadav@gmail.com');
      expect(AuthState.resolveEmail('account'), 'sachinacc@gmail.com');
      expect(AuthState.resolveEmail('accountant'), 'sachinacc@gmail.com');
      expect(AuthState.resolveEmail('custom@example.com'), 'custom@example.com');
      expect(AuthState.resolveEmail('customuser'), 'customuser@kfab.in');
    });

    test('login validates empty email or password', () async {
      final auth = AuthState();
      expect(
        () => auth.login(email: '', password: ''),
        throwsA(isA<Exception>().having(
          (e) => e.toString(),
          'message',
          contains('Please enter both username/email and password'),
        )),
      );

      expect(
        () => auth.login(email: 'superadmin', password: '   '),
        throwsA(isA<Exception>().having(
          (e) => e.toString(),
          'message',
          contains('Please enter both username/email and password'),
        )),
      );
    });

    test('logout resets user identity state', () async {
      final auth = AuthState();
      await auth.login(email: 'superadmin@kfab.in', password: 'pwd', role: UserRole.superAdmin);
      expect(auth.isAuthenticated, isTrue);

      await auth.logout();
      expect(auth.isAuthenticated, isFalse);
      expect(auth.userEmail, isEmpty);
      expect(auth.userName, 'User');
    });
  });
}
