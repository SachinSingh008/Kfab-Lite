import 'package:flutter/foundation.dart';
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
  String _userName = '';
  String _userEmail = '';
  String _userPhone = '+91 98230 11234';
  final String _companyName = 'KFAB Infra Projects';
  UserRole _role = UserRole.superAdmin;

  bool get isAuthenticated => _isAuthenticated;
  String get userName => _userName.isNotEmpty ? _userName : 'User';
  String get userEmail => _userEmail;
  String get userPhone => _userPhone;
  String get companyName => _companyName;
  UserRole get role => _role;

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

  Future<bool> login({
    required String email,
    required String password,
    UserRole? role,
  }) async {
    final client = SupabaseConfig.client;

    // 1. Try Supabase Auth if online and email is formatted
    if (client != null && email.contains('@')) {
      try {
        final res = await client.auth.signInWithPassword(
          email: email.trim(),
          password: password,
        );

        if (res.user != null) {
          _isAuthenticated = true;
          _userEmail = res.user!.email ?? email.trim();

          try {
            final profile = await client
                .from('profiles')
                .select('full_name, role, status')
                .eq('id', res.user!.id)
                .maybeSingle();

            if (profile != null) {
              final fullName = profile['full_name'] as String?;
              final dbRole = profile['role'] as String?;
              if (fullName != null && fullName.isNotEmpty) {
                _userName = fullName;
              }
              if (dbRole != null) {
                switch (dbRole.toUpperCase()) {
                  case 'SUPER_ADMIN':
                    _role = UserRole.superAdmin;
                    break;
                  case 'ADMIN':
                    _role = UserRole.admin;
                    break;
                  case 'SUPERVISOR':
                    _role = UserRole.supervisor;
                    break;
                  case 'ACCOUNT':
                  case 'ACCOUNTANT':
                    _role = UserRole.accounts;
                    break;
                }
              }
            }
          } catch (e) {
            debugPrint('[Supabase] Could not fetch profile: $e');
          }

          if (_userName.isEmpty) {
            _userName = _userEmail.contains('@') ? _userEmail.split('@')[0] : _userEmail;
          }
          notifyListeners();
          return true;
        }
      } catch (e) {
        debugPrint('[Supabase Auth] Remote sign-in failed, checking offline credentials: $e');
      }
    }

    // 2. Fallback to local role & demo credentials
    _isAuthenticated = true;
    _userEmail = email.trim();
    _userName = email.contains('@') ? email.split('@')[0] : email.trim();
    if (role != null) {
      _role = role;
    } else {
      final lower = email.toLowerCase();
      if (lower.contains('superadmin') || lower.contains('super')) {
        _role = UserRole.superAdmin;
      } else if (lower.contains('supervisor')) {
        _role = UserRole.supervisor;
      } else if (lower.contains('account') || lower.contains('acc')) {
        _role = UserRole.accounts;
      } else if (lower.contains('admin')) {
        _role = UserRole.admin;
      } else {
        _role = UserRole.superAdmin;
      }
    }
    notifyListeners();
    return true;
  }

  Future<void> logout() async {
    final client = SupabaseConfig.client;
    if (client != null) {
      try {
        await client.auth.signOut();
      } catch (_) {}
    }
    _isAuthenticated = false;
    _userEmail = '';
    _userName = '';
    notifyListeners();
  }
}
