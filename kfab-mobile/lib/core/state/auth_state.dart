import 'package:flutter/foundation.dart';

enum UserRole {
  supervisor,
  admin,
  accounts,
  storekeeper,
  superAdmin,
  attendanceUser,
  viewer,
}

extension UserRoleExtension on UserRole {
  String get displayName {
    switch (this) {
      case UserRole.supervisor:
        return 'SUPERVISOR';
      case UserRole.admin:
        return 'ADMIN';
      case UserRole.accounts:
        return 'ACCOUNTS';
      case UserRole.storekeeper:
        return 'STOREKEEPER';
      case UserRole.superAdmin:
        return 'SUPER ADMIN';
      case UserRole.attendanceUser:
        return 'ATTENDANCE USER';
      case UserRole.viewer:
        return 'VIEWER';
    }
  }

  String get shortCode {
    switch (this) {
      case UserRole.supervisor:
        return 'SUP';
      case UserRole.admin:
        return 'ADM';
      case UserRole.accounts:
        return 'ACC';
      case UserRole.storekeeper:
        return 'STR';
      case UserRole.superAdmin:
        return 'SAD';
      case UserRole.attendanceUser:
        return 'ATT';
      case UserRole.viewer:
        return 'VIW';
    }
  }
}

class AuthState extends ChangeNotifier {
  bool _isAuthenticated = true;
  String _userName = 'Prakash Patel';
  String _userEmail = 'supervisor@kfab.in';
  final String _companyName = 'KFAB Infra Projects';
  UserRole _role = UserRole.supervisor;

  bool get isAuthenticated => _isAuthenticated;
  String get userName => _userName;
  String get userEmail => _userEmail;
  String get companyName => _companyName;
  UserRole get role => _role;

  void switchRole(UserRole newRole) {
    _role = newRole;
    switch (newRole) {
      case UserRole.supervisor:
        _userName = 'Prakash Patel';
        _userEmail = 'supervisor@kfab.in';
        break;
      case UserRole.admin:
        _userName = 'Ajay Verma';
        _userEmail = 'admin@kfab.in';
        break;
      case UserRole.accounts:
        _userName = 'Sunil Mehta';
        _userEmail = 'accounts@kfab.in';
        break;
      case UserRole.storekeeper:
        _userName = 'Mahesh Joshi';
        _userEmail = 'stores@kfab.in';
        break;
      case UserRole.superAdmin:
        _userName = 'Ritesh Sharma (Super)';
        _userEmail = 'superadmin@kfab.in';
        break;
      case UserRole.attendanceUser:
        _userName = 'Dinesh Rawat';
        _userEmail = 'muster@kfab.in';
        break;
      case UserRole.viewer:
        _userName = 'Auditor Guest';
        _userEmail = 'viewer@kfab.in';
        break;
    }
    notifyListeners();
  }

  void login({required String email, required String password}) {
    _isAuthenticated = true;
    _userEmail = email;
    notifyListeners();
  }

  void logout() {
    _isAuthenticated = false;
    notifyListeners();
  }
}
