import 'package:flutter/foundation.dart';

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
        return 'SUPER ADMIN';
      case UserRole.admin:
        return 'ADMIN';
      case UserRole.supervisor:
        return 'SUPERVISOR';
      case UserRole.accounts:
        return 'ACCOUNTANT';
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

  void login({required String email, required String password, UserRole? role}) {
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
  }

  void logout() {
    _isAuthenticated = false;
    _userEmail = '';
    _userName = '';
    notifyListeners();
  }
}
