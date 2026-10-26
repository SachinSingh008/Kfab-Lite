import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/supabase_config.dart';

enum UserRole {
  superAdmin,
  admin,
  supervisor,
  accounts,
}

extension UserRoleExtension on UserRole {
  String get displayName {
    switch (this) {
      case UserRole.superAdmin:
        return 'SUPER_ADMIN';
      case UserRole.admin:
        return 'ADMIN';
      case UserRole.supervisor:
        return 'SUPERVISOR';
      case UserRole.accounts:
        return 'ACCOUNT';
    }
  }

  String get shortCode {
    switch (this) {
      case UserRole.superAdmin:
        return 'SAD';
      case UserRole.admin:
        return 'ADM';
      case UserRole.supervisor:
        return 'SUP';
      case UserRole.accounts:
        return 'ACC';
    }
  }
}

class AuthState extends ChangeNotifier {
  bool _isAuthenticated = false;
  String _userId = '';
  String _userName = '';
  String _userEmail = '';
  String _userPhone = '+91 98230 11234';
  final String _companyName = 'KFAB Infra Projects';
  UserRole _role = UserRole.superAdmin;
  bool _isConnectedToSupabase = false;

  bool get isAuthenticated => _isAuthenticated;
  String get userId => _userId;
  String get userName => _userName.isNotEmpty ? _userName : 'User';
  String get userEmail => _userEmail;
  String get userPhone => _userPhone;
  String get companyName => _companyName;
  UserRole get role => _role;
  bool get isConnectedToSupabase => _isConnectedToSupabase;

  void updateProfile({String? name, String? email, String? phone}) {
    if (name != null && name.trim().isNotEmpty) {
      _userName = name.trim();
    }
    if (email != null && email.trim().isNotEmpty) {
      _userEmail = email.trim();
    }
    if (phone != null && phone.trim().isNotEmpty) {
      _userPhone = phone.trim();
    }
    notifyListeners();
  }

  void setRole(UserRole newRole) {
    _role = newRole;
    notifyListeners();
  }

  void switchRole(UserRole newRole) {
    setRole(newRole);
  }

  static UserRole _parseRole(String? dbRole) {
    if (dbRole == null) return UserRole.supervisor;
    switch (dbRole.toUpperCase()) {
      case 'SUPER_ADMIN':
        return UserRole.superAdmin;
      case 'ADMIN':
        return UserRole.admin;
      case 'SUPERVISOR':
        return UserRole.supervisor;
      case 'ACCOUNT':
      case 'ACCOUNTANT':
        return UserRole.accounts;
      default:
        return UserRole.supervisor;
    }
  }

  /// Resolves usernames or quick-role keywords to authoritative database emails
  static String resolveEmail(String input) {
    final lower = input.trim().toLowerCase();
    switch (lower) {
      case 'superadmin':
      case 'super_admin':
      case 'super':
        return 'sachinasinghofficial@gmail.com';
      case 'admin':
        return 'sachin.asingh18@gmail.com';
      case 'supervisor':
        return 'vikasyadav@gmail.com';
      case 'account':
      case 'accountant':
        return 'sachinacc@gmail.com';
      default:
        if (lower.contains('@')) return lower;
        return '$lower@kfab.in';
    }
  }

  /// Verifies active Supabase session on app startup (Auto-Login verification)
  Future<bool> checkCurrentSession() async {
    final client = SupabaseConfig.client;
    if (client == null) {
      _isConnectedToSupabase = false;
      return false;
    }

    try {
      final session = client.auth.currentSession;
      final user = client.auth.currentUser;

      if (session != null && user != null) {
        // Verify user profile and active status in Supabase profiles
        final profile = await client
            .from('profiles')
            .select('full_name, role, status')
            .eq('id', user.id)
            .maybeSingle();

        if (profile != null) {
          final status = (profile['status'] as String?)?.toUpperCase();
          if (status == 'INACTIVE') {
            await client.auth.signOut();
            _isAuthenticated = false;
            notifyListeners();
            return false;
          }

          final dbRole = profile['role'] as String?;
          _role = _parseRole(dbRole);

          final fullName = profile['full_name'] as String?;
          if (fullName != null && fullName.isNotEmpty) {
            _userName = fullName;
          } else {
            _userName = user.email?.split('@')[0] ?? 'User';
          }

          _userId = user.id;
          _userEmail = user.email ?? '';
          _isAuthenticated = true;
          _isConnectedToSupabase = true;
          notifyListeners();
          return true;
        }
      }
      _isConnectedToSupabase = true;
    } catch (e) {
      debugPrint('[AuthState] checkCurrentSession error: $e');
      _isConnectedToSupabase = false;
    }
    return false;
  }

  /// Authoritative login with Supabase Auth validation, connection verification,
  /// profile status check, and last_login_at timestamp stamping.
  Future<bool> login({
    required String email,
    required String password,
    UserRole? role,
  }) async {
    final client = SupabaseConfig.client;
    final trimmedInput = email.trim();
    final trimmedPassword = password.trim();

    if (trimmedInput.isEmpty || trimmedPassword.isEmpty) {
      throw Exception('Please enter both username/email and password.');
    }

    // 1. Authoritative Supabase Auth
    if (client != null) {
      final resolvedEmail = resolveEmail(trimmedInput);

      try {
        final res = await client.auth.signInWithPassword(
          email: resolvedEmail,
          password: trimmedPassword,
        );

        if (res.user != null) {
          _userId = res.user!.id;
          _userEmail = res.user!.email ?? resolvedEmail;

          // Fetch verified user profile from Supabase profiles table
          Map<String, dynamic>? profile;
          try {
            profile = await client
                .from('profiles')
                .select('full_name, role, status')
                .eq('id', res.user!.id)
                .maybeSingle();
          } catch (e) {
            debugPrint('[Supabase] Could not fetch profile: $e');
          }

          // Validation: Check if deactivated
          final status = (profile?['status'] as String?)?.toUpperCase();
          if (status == 'INACTIVE') {
            await client.auth.signOut();
            throw Exception('This account has been deactivated. Contact your Super Administrator.');
          }

          // Extract role from profile
          final dbRole = profile?['role'] as String?;
          _role = _parseRole(dbRole);

          final fullName = profile?['full_name'] as String?;
          if (fullName != null && fullName.isNotEmpty) {
            _userName = fullName;
          } else {
            _userName = _userEmail.contains('@') ? _userEmail.split('@')[0] : _userEmail;
          }

          // Stamp last_login_at in database (exact match to Web behavior)
          final nowIso = DateTime.now().toUtc().toIso8601String();
          try {
            await client.from('profiles').update({
              'last_login_at': nowIso,
              'updated_at': nowIso,
            }).eq('id', res.user!.id);
          } catch (_) {
            // non-blocking
          }

          // Record login log into audit_logs (who login when)
          try {
            await client.from('audit_logs').insert({
              'actor_id': res.user!.id,
              'action': 'USER_LOGIN',
              'status': 'SUCCESS',
              'details': {
                'description': 'User "$_userName" (${_role.displayName}) signed in to Mobile App',
                'module': 'Authentication',
                'client': 'Mobile App',
                'user_name': _userName,
                'user_role': _role.displayName,
                'user_email': _userEmail,
                'login_time': nowIso,
              },
              'created_at': nowIso,
            });
          } catch (e) {
            debugPrint('[Audit] Could not record mobile login log: $e');
          }

          _isAuthenticated = true;
          _isConnectedToSupabase = true;
          notifyListeners();
          return true;
        }
      } on AuthException catch (e) {
        debugPrint('[Supabase Auth] AuthException: ${e.message}');
        final msg = e.message.toLowerCase();
        if (msg.contains('invalid login credentials') || msg.contains('invalid grant')) {
          throw Exception('Invalid username/email or password. Please verify your credentials.');
        } else if (msg.contains('email not confirmed')) {
          throw Exception('Email not confirmed. Please check your verification link.');
        }
        throw Exception(e.message);
      } catch (e) {
        debugPrint('[Supabase Auth] Unexpected error: $e');
        if (e.toString().contains('deactivated')) {
          rethrow;
        }
        throw Exception('Authentication failed: ${e.toString().replaceAll('Exception: ', '')}');
      }
    }

    // 2. Fallback only if Supabase client is uninitialized (e.g. in test runner)
    if (role != null) {
      _isAuthenticated = true;
      _userEmail = trimmedInput;
      _userName = trimmedInput.contains('@') ? trimmedInput.split('@')[0] : trimmedInput;
      _role = role;
      notifyListeners();
      return true;
    }

    throw Exception('Database connection unavailable. Please check your network connection.');
  }

  /// Authoritative logout clearing Supabase session
  Future<void> logout() async {
    final client = SupabaseConfig.client;
    if (client != null) {
      try {
        await client.auth.signOut();
      } catch (e) {
        debugPrint('[Supabase Auth] Sign out error: $e');
      }
    }
    _isAuthenticated = false;
    _userId = '';
    _userEmail = '';
    _userName = '';
    notifyListeners();
  }
}
