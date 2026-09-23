import 'package:flutter/material.dart';
import '../../core/config/app_theme.dart';
import '../../core/state/auth_state.dart';

class KfabTopAppBar extends StatelessWidget implements PreferredSizeWidget {
  final AuthState authState;
  final int unreadCount;
  final VoidCallback onOpenSearch;
  final VoidCallback onOpenNotifications;
  final VoidCallback onOpenProfile;
  final VoidCallback? onOpenDrawer;
  final String? subtitle;

  const KfabTopAppBar({
    super.key,
    required this.authState,
    required this.unreadCount,
    required this.onOpenSearch,
    required this.onOpenNotifications,
    required this.onOpenProfile,
    this.onOpenDrawer,
    this.subtitle,
  });

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    final role = authState.role;
    final rolePrimary = AppTheme.getPrimaryForRole(role);

    return AppBar(
      backgroundColor: AppTheme.getNavBarBgForRole(role).withValues(alpha: 0.94),
      elevation: 0.5,
      leading: Builder(
        builder: (appBarContext) => IconButton(
          icon: const Icon(Icons.menu_rounded, size: 24),
          color: const Color(0xFF0F172A),
          tooltip: 'Menu & Tabs',
          splashRadius: 22,
          onPressed: () {
            if (onOpenDrawer != null) {
              onOpenDrawer!();
            }
            // Direct descendant context lookup guarantees finding the enclosing Scaffold
            final scaffold = Scaffold.maybeOf(appBarContext);
            if (scaffold != null && scaffold.hasDrawer && !scaffold.isDrawerOpen) {
              scaffold.openDrawer();
            }
          },
        ),
      ),
      title: Row(
        children: [
          // 1. Left Top Logo Image
          Image.asset(
            'assets/images/kfab_logo.png',
            width: 28,
            height: 28,
            fit: BoxFit.contain,
            errorBuilder: (context, error, stackTrace) {
              return Image.asset(
                'assets/logo.png',
                width: 28,
                height: 28,
                fit: BoxFit.contain,
                errorBuilder: (context, error, stackTrace) => Icon(
                  Icons.precision_manufacturing,
                  color: rolePrimary,
                  size: 24,
                ),
              );
            },
          ),
          const SizedBox(width: 8),

          // 2. Left Top Logo Text: "kfabs" + Role Badge
          Row(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              RichText(
                text: TextSpan(
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: const Color(0xFF0F172A),
                    letterSpacing: -0.4,
                  ),
                  children: const [
                    TextSpan(text: 'kfabs'),
                    TextSpan(
                      text: '.',
                      style: TextStyle(color: Color(0xFFF59E0B)),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 6),
              Flexible(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppTheme.getBadgeBgForRole(role),
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(
                      color: rolePrimary.withValues(alpha: 0.35),
                      width: 0.8,
                    ),
                  ),
                  child: Text(
                    role.displayName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 8.5,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.getBadgeTextForRole(role),
                      letterSpacing: 0.3,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
      actions: [
        // 3. Search Icon (Next to Notification)
        IconButton(
          onPressed: onOpenSearch,
          icon: const Icon(Icons.search, size: 22),
          color: const Color(0xFF334155),
          tooltip: 'Search Workspace',
          splashRadius: 20,
        ),

        // 4. Notification Icon (Just next to Profile) with unread badge
        IconButton(
          onPressed: onOpenNotifications,
          icon: Badge(
            isLabelVisible: unreadCount > 0,
            backgroundColor: const Color(0xFFDC2626),
            label: Text(
              unreadCount.toString(),
              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            child: const Icon(Icons.notifications_outlined, size: 22),
          ),
          color: const Color(0xFF334155),
          tooltip: 'Plant Alerts',
          splashRadius: 20,
        ),

        // 5. Top Right Corner: Profile Avatar Button
        Padding(
          padding: const EdgeInsets.only(right: 14, left: 4),
          child: Center(
            child: InkWell(
              onTap: onOpenProfile,
              borderRadius: BorderRadius.circular(18),
              child: Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: rolePrimary,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AppTheme.getAccentForRole(role),
                    width: 1.5,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: rolePrimary.withValues(alpha: 0.3),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    role.shortCode,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 11.5,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
