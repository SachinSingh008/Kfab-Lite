import 'package:flutter/material.dart';
import '../state/auth_state.dart';

class AppTheme {
  // Master KFAB360 Palette (Derived directly from the Login Screen)
  static const Color slateDark = Color(0xFF0F172A);
  static const Color slateHover = Color(0xFF1E293B);
  static const Color slateCard = Color(0xFFFFFFFF);
  static const Color slateBorder = Color(0xFFE2E8F0);
  static const Color slateBorderStrong = Color(0xFFCBD5E1);
  static const Color slateSurface = Color(0xFFF8FAFC);
  static const Color slateSubtle = Color(0xFFF1F5F9);

  // KFAB Master Brand Primary & Accent Tones
  static const Color primary = Color(0xFF0F172A);
  static const Color primaryBlue = Color(0xFF0F172A);
  static const Color primaryDarkBlue = Color(0xFF020617);
  static const Color primaryLightBlue = Color(0xFFF1F5F9);
  static const Color industrialAmber = Color(0xFFF59E0B);
  static const Color warningAmber = Color(0xFFF59E0B);
  static const Color successEmerald = Color(0xFF16A34A);
  static const Color dangerCrimson = Color(0xFFDC2626);
  static const Color textPrimary = Color(0xFF0F172A);
  static const Color textMuted = Color(0xFF64748B);

  // ============================================================
  // ROLE PALETTES
  // ============================================================
  // 1. Super Admin: Monochromatic Obsidian Black & Platinum Gray (B/W Theme)
  static const Color superAdminPrimary = Color(0xFF09090B);
  static const Color superAdminAccent = Color(0xFF27272A);

  // 2. Admin: KFAB Logo Royal Blue #00288A + Electric Blue #2563EB
  static const Color adminPrimary = Color(0xFF00288A);
  static const Color adminAccent = Color(0xFF2563EB);

  // 3. Supervisor: Crimson Red #DC2626
  static const Color supervisorPrimary = Color(0xFFDC2626);
  static const Color supervisorAccent = Color(0xFFEF4444);

  // 4. Accountant: Fresh Lime & Mint Green (Image 3 Palette)
  static const Color accountantPrimary = Color(0xFF15803D);
  static const Color accountantAccent = Color(0xFF65C728);

  static Color getPrimaryForRole(UserRole role) {
    switch (role) {
      case UserRole.superAdmin:
        return superAdminPrimary;
      case UserRole.admin:
        return adminPrimary;
      case UserRole.supervisor:
        return supervisorPrimary;
      case UserRole.accounts:
        return accountantPrimary;
    }
  }

  static Color getAccentForRole(UserRole role) {
    switch (role) {
      case UserRole.superAdmin:
        return superAdminAccent;
      case UserRole.admin:
        return adminAccent;
      case UserRole.supervisor:
        return supervisorAccent;
      case UserRole.accounts:
        return accountantAccent;
    }
  }

  static List<Color> getGradientForRole(UserRole role) {
    switch (role) {
      case UserRole.superAdmin:
        return const [Color(0xFF09090B), Color(0xFF18181B)];
      case UserRole.admin:
        return const [Color(0xFF001F6D), Color(0xFF00288A)];
      case UserRole.supervisor:
        return const [Color(0xFF991B1B), Color(0xFFDC2626)];
      case UserRole.accounts:
        return const [Color(0xFF14532D), Color(0xFF15803D)];
    }
  }

  /// Very light smooth background gradient blending role tint with white
  static List<Color> getLightBgGradientForRole(UserRole role) {
    switch (role) {
      case UserRole.superAdmin:
        return const [Color(0xFFF8F9FA), Color(0xFFFFFFFF)];
      case UserRole.admin:
        return const [Color(0xFFF0F7FF), Color(0xFFFFFFFF)];
      case UserRole.supervisor:
        return const [Color(0xFFFFF5F5), Color(0xFFFFFFFF)];
      case UserRole.accounts:
        return const [Color(0xFFF7FCF2), Color(0xFFFFFFFF)];
    }
  }

  /// Single base background color for role
  static Color getLightBgColorForRole(UserRole role) {
    switch (role) {
      case UserRole.superAdmin:
        return const Color(0xFFF8F9FA);
      case UserRole.admin:
        return const Color(0xFFF0F7FF);
      case UserRole.supervisor:
        return const Color(0xFFFFF5F5);
      case UserRole.accounts:
        return const Color(0xFFF7FCF2);
    }
  }

  /// Subtle card border color tailored for role
  static Color getLightCardBorderForRole(UserRole role) {
    switch (role) {
      case UserRole.superAdmin:
        return const Color(0xFFE2E8F0);
      case UserRole.admin:
        return const Color(0xFFFECACA);
      case UserRole.supervisor:
        return const Color(0xFFFEF08A);
      case UserRole.accounts:
        return const Color(0xFFBBF7D0);
    }
  }

  /// Bottom Navigation Bar background tinted with role color
  static Color getNavBarBgForRole(UserRole role) {
    switch (role) {
      case UserRole.superAdmin:
        return Colors.white;
      case UserRole.admin:
        return const Color(0xFFFFF5F5);
      case UserRole.supervisor:
        return const Color(0xFFFFFDEB);
      case UserRole.accounts:
        return const Color(0xFFF5FDF7);
    }
  }

  static Color getBadgeBgForRole(UserRole role) {
    switch (role) {
      case UserRole.superAdmin:
        return const Color(0xFFF1F5F9);
      case UserRole.admin:
        return const Color(0xFFFEF2F2);
      case UserRole.supervisor:
        return const Color(0xFFFEF9C3);
      case UserRole.accounts:
        return const Color(0xFFDCFCE7);
    }
  }

  static Color getBadgeTextForRole(UserRole role) {
    switch (role) {
      case UserRole.superAdmin:
        return const Color(0xFF0F172A);
      case UserRole.admin:
        return const Color(0xFFDC2626);
      case UserRole.supervisor:
        return const Color(0xFF854D0E);
      case UserRole.accounts:
        return const Color(0xFF15803D);
    }
  }

  static ThemeData getThemeForRole(UserRole role) {
    final rolePrimary = getPrimaryForRole(role);
    final roleAccent = getAccentForRole(role);
    final lightBg = getLightBgColorForRole(role);
    final navBg = getNavBarBgForRole(role);
    final cardBorder = getLightCardBorderForRole(role);

    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: rolePrimary,
        primary: rolePrimary,
        secondary: roleAccent,
        surface: lightBg,
      ),
      scaffoldBackgroundColor: lightBg,
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: rolePrimary,
        elevation: 0.5,
        centerTitle: false,
        iconTheme: IconThemeData(color: rolePrimary),
        titleTextStyle: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: rolePrimary,
          letterSpacing: 0.5,
        ),
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: cardBorder, width: 1),
        ),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: navBg,
        selectedItemColor: rolePrimary,
        unselectedItemColor: const Color(0xFF64748B),
        selectedLabelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
        unselectedLabelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500),
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
    );
  }

  static ThemeData get lightTheme => getThemeForRole(UserRole.superAdmin);
}
