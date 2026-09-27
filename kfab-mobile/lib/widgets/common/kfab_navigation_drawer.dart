import 'package:flutter/material.dart';
import '../../core/config/app_theme.dart';
import '../../core/state/auth_state.dart';
import '../../core/state/mobile_store.dart';
import '../../core/state/sync_engine.dart';
import '../../screens/auth/login_screen.dart';
import '../../screens/stock/quick_usage_screen.dart';
import '../../screens/challan/challan_capture_screen.dart';
import '../../screens/scanner/qr_scanner_screen.dart';
import '../../screens/sync/sync_queue_screen.dart';
import '../../screens/logs/logs_screen.dart';

class KfabNavigationDrawer extends StatelessWidget {
  final AuthState authState;
  final MobileStore store;
  final SyncEngine? syncEngine;
  final int currentIndex;
  final ValueChanged<int> onSelectTab;

  const KfabNavigationDrawer({
    super.key,
    required this.authState,
    required this.store,
    this.syncEngine,
    required this.currentIndex,
    required this.onSelectTab,
  });

  void _openNameChangeDialog(BuildContext context) {
    final nameCtrl = TextEditingController(text: authState.userName);
    final emailCtrl = TextEditingController(text: authState.userEmail);
    final phoneCtrl = TextEditingController(text: authState.userPhone);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.manage_accounts, color: Color(0xFF16A34A), size: 24),
                      SizedBox(width: 8),
                      Text(
                        'Profile Settings & Name',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 20),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              const Text(
                'Change your display name, registered email, or operator contact info:',
                style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 16),

              // Full Name Field
              TextField(
                controller: nameCtrl,
                style: const TextStyle(fontSize: 13),
                decoration: InputDecoration(
                  labelText: 'Operator Full Name *',
                  hintText: 'e.g. Operator Name',
                  prefixIcon: const Icon(Icons.badge_outlined, size: 20),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  filled: true,
                  fillColor: const Color(0xFFF8FAFC),
                ),
              ),
              const SizedBox(height: 12),

              // Email / Username Field
              TextField(
                controller: emailCtrl,
                style: const TextStyle(fontSize: 13),
                decoration: InputDecoration(
                  labelText: 'Login Email / Username',
                  hintText: 'supervisor@008 or email',
                  prefixIcon: const Icon(Icons.alternate_email, size: 20),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  filled: true,
                  fillColor: const Color(0xFFF8FAFC),
                ),
              ),
              const SizedBox(height: 12),

              // Phone Number Field
              TextField(
                controller: phoneCtrl,
                style: const TextStyle(fontSize: 13),
                keyboardType: TextInputType.phone,
                decoration: InputDecoration(
                  labelText: 'Contact Phone Number',
                  hintText: '+91 98230 11234',
                  prefixIcon: const Icon(Icons.phone_outlined, size: 20),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  filled: true,
                  fillColor: const Color(0xFFF8FAFC),
                ),
              ),
              const SizedBox(height: 20),

              // Save Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF16A34A),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  icon: const Icon(Icons.check_circle_outline, size: 18),
                  label: const Text('Save Profile Changes', style: TextStyle(fontWeight: FontWeight.bold)),
                  onPressed: () {
                    final newName = nameCtrl.text.trim();
                    if (newName.isEmpty) return;

                    authState.updateProfile(
                      name: newName,
                      email: emailCtrl.text.trim(),
                      phone: phoneCtrl.text.trim(),
                    );

                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Profile updated: Name changed to "$newName"'),
                        backgroundColor: const Color(0xFF16A34A),
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final role = authState.role;
    final rolePrimary = AppTheme.getPrimaryForRole(role);

    return Drawer(
      backgroundColor: Colors.white,
      child: SafeArea(
        child: Column(
          children: [
            // 1. Drawer Header with User Identity and Role Theme
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.getNavBarBgForRole(role),
                border: Border(
                  bottom: BorderSide(
                    color: AppTheme.getLightCardBorderForRole(role),
                  ),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      // Avatar
                      CircleAvatar(
                        radius: 26,
                        backgroundColor: rolePrimary,
                        child: Text(
                          role.shortCode,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),

                      // Name, Role & Email
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              authState.userName,
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF0F172A),
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              authState.userEmail.isNotEmpty
                                  ? authState.userEmail
                                  : '${role.displayName.toLowerCase()}@kfab',
                              style: const TextStyle(
                                fontSize: 11,
                                color: Color(0xFF64748B),
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
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
                                style: TextStyle(
                                  fontSize: 9,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.getBadgeTextForRole(role),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Quick Action: Edit Profile / Change Name Button
                  InkWell(
                    onTap: () => _openNameChangeDialog(context),
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 7, horizontal: 10),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFCBD5E1)),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.edit, size: 14, color: Color(0xFF16A34A)),
                          SizedBox(width: 6),
                          Flexible(
                            child: Text(
                              'Edit Profile & Change Name',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: 11.5,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // 2. Direct Access Navigation List
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
                children: [
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    child: Text(
                      'PRIMARY MODULES & TABS',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF94A3B8),
                        letterSpacing: 0.8,
                      ),
                    ),
                  ),

                  // Tab 2: Dashboard (Home)
                  _buildNavTile(
                    context: context,
                    icon: Icons.dashboard_outlined,
                    activeIcon: Icons.dashboard,
                    title: 'Operations Dashboard',
                    subtitle: 'Plant telemetry & tonnage throughput',
                    isSelected: currentIndex == 2,
                    onTap: () {
                      Navigator.pop(context);
                      onSelectTab(2);
                    },
                    rolePrimary: rolePrimary,
                  ),

                  // Tab 0: Inventory
                  _buildNavTile(
                    context: context,
                    icon: Icons.inventory_2_outlined,
                    activeIcon: Icons.inventory_2,
                    title: 'Raw Material Inventory',
                    subtitle: 'Stock balances & bin locations',
                    isSelected: currentIndex == 0,
                    onTap: () {
                      Navigator.pop(context);
                      onSelectTab(0);
                    },
                    rolePrimary: rolePrimary,
                  ),

                  // Tab 1: Attendance Muster
                  _buildNavTile(
                    context: context,
                    icon: Icons.fact_check_outlined,
                    activeIcon: Icons.fact_check,
                    title: 'Attendance Muster Roll',
                    subtitle: 'Shift allocations & midnight lock',
                    isSelected: currentIndex == 1,
                    onTap: () {
                      Navigator.pop(context);
                      onSelectTab(1);
                    },
                    rolePrimary: rolePrimary,
                  ),

                  // Tab 3: Reports & Bills
                  _buildNavTile(
                    context: context,
                    icon: Icons.description_outlined,
                    activeIcon: Icons.description,
                    title: 'Reports & Commercial Bills',
                    subtitle: 'Muster rolls & ISO Excel audit sheets',
                    isSelected: currentIndex == 3,
                    onTap: () {
                      Navigator.pop(context);
                      onSelectTab(3);
                    },
                    rolePrimary: rolePrimary,
                  ),

                  // Logs Module (Placed immediately ABOVE Team Chat & Channels)
                  _buildNavTile(
                    context: context,
                    icon: Icons.menu_book_outlined,
                    activeIcon: Icons.menu_book,
                    title: 'Logs',
                    subtitle: 'Activity notes & system audit trail',
                    isSelected: false,
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => LogsScreen(authState: authState),
                        ),
                      );
                    },
                    rolePrimary: rolePrimary,
                  ),

                  // Tab 4: Team Chat & Channels
                  _buildNavTile(
                    context: context,
                    icon: Icons.chat_bubble_outline,
                    activeIcon: Icons.chat_bubble,
                    title: 'Team Chat & Channels',
                    subtitle: 'WhatsApp-style photo & role scoped chat',
                    isSelected: currentIndex == 4,
                    badge: 'WhatsApp',
                    badgeColor: const Color(0xFF16A34A),
                    onTap: () {
                      Navigator.pop(context);
                      onSelectTab(4);
                    },
                    rolePrimary: rolePrimary,
                  ),

                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    child: Divider(height: 1),
                  ),

                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    child: Text(
                      'FIELD OPERATIONS TOOLS',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF94A3B8),
                        letterSpacing: 0.8,
                      ),
                    ),
                  ),

                  // Quick Usage
                  _buildActionTile(
                    context: context,
                    icon: Icons.bolt,
                    iconColor: const Color(0xFFF59E0B),
                    title: 'Log Material Usage',
                    subtitle: 'Heat numbers & work bay consumption',
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => QuickUsageScreen(store: store)),
                      );
                    },
                  ),

                  // Challan Capture
                  _buildActionTile(
                    context: context,
                    icon: Icons.document_scanner_outlined,
                    iconColor: const Color(0xFF2563EB),
                    title: 'Scan Inward Challan',
                    subtitle: 'Weighbridge gate receipt verification',
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const ChallanCaptureScreen()),
                      );
                    },
                  ),

                  // QR Scanner
                  _buildActionTile(
                    context: context,
                    icon: Icons.qr_code_scanner,
                    iconColor: const Color(0xFF7C3AED),
                    title: 'Material QR Scanner',
                    subtitle: 'Scan steel tags and bundle barcodes',
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => QrScannerScreen(
                            store: store,
                            onSelectMaterialForUsage: (code) {
                              onSelectTab(0);
                            },
                          ),
                        ),
                      );
                    },
                  ),

                  // Sync Queue
                  _buildActionTile(
                    context: context,
                    icon: Icons.cloud_sync_outlined,
                    iconColor: const Color(0xFF059669),
                    title: 'Offline Sync Queue',
                    subtitle: '${store.offlineQueue.length} pending cloud writes',
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => SyncQueueScreen(
                            store: store,
                            syncEngine: syncEngine ?? SyncEngine(mobileStore: store),
                          ),
                        ),
                      );
                    },
                  ),

                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    child: Divider(height: 1),
                  ),

                  // Quick Role Switcher
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    child: Text(
                      'SWITCH ACTIVE ROLE / SIMULATOR',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF94A3B8),
                        letterSpacing: 0.8,
                      ),
                    ),
                  ),

                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    child: Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: UserRole.values.map((r) {
                        final isCurrent = r == role;
                        return ChoiceChip(
                          label: Text(r.displayName),
                          selected: isCurrent,
                          selectedColor: AppTheme.getPrimaryForRole(r),
                          backgroundColor: const Color(0xFFF1F5F9),
                          labelStyle: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: isCurrent ? Colors.white : const Color(0xFF475569),
                          ),
                          onSelected: (_) {
                            authState.switchRole(r);
                          },
                        );
                      }).toList(),
                    ),
                  ),
                ],
              ),
            ),

            // 3. Drawer Bottom: Logout
            Container(
              padding: const EdgeInsets.all(12),
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
              ),
              child: ListTile(
                dense: true,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                tileColor: const Color(0xFFFEF2F2),
                leading: const Icon(Icons.logout, color: Color(0xFFDC2626), size: 20),
                title: const Text(
                  'Sign Out of Terminal',
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFFDC2626),
                  ),
                ),
                onTap: () {
                  Navigator.pop(context);
                  authState.logout();
                  Navigator.pushAndRemoveUntil(
                    context,
                    MaterialPageRoute(builder: (_) => LoginScreen(authState: authState)),
                    (route) => false,
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNavTile({
    required BuildContext context,
    required IconData icon,
    required IconData activeIcon,
    required String title,
    required String subtitle,
    required bool isSelected,
    required VoidCallback onTap,
    required Color rolePrimary,
    String? badge,
    Color? badgeColor,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      decoration: BoxDecoration(
        color: isSelected ? rolePrimary.withValues(alpha: 0.1) : Colors.transparent,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isSelected ? rolePrimary.withValues(alpha: 0.3) : Colors.transparent,
        ),
      ),
      child: ListTile(
        dense: true,
        onTap: onTap,
        leading: Icon(
          isSelected ? activeIcon : icon,
          color: isSelected ? rolePrimary : const Color(0xFF475569),
          size: 22,
        ),
        title: Row(
          children: [
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 12.5,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                  color: isSelected ? rolePrimary : const Color(0xFF1E293B),
                ),
              ),
            ),
            if (badge != null) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                decoration: BoxDecoration(
                  color: badgeColor ?? rolePrimary,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  badge,
                  style: const TextStyle(fontSize: 8.5, fontWeight: FontWeight.w800, color: Colors.white),
                ),
              ),
            ],
          ],
        ),
        subtitle: Text(
          subtitle,
          style: const TextStyle(fontSize: 10.5, color: Color(0xFF64748B)),
        ),
      ),
    );
  }

  Widget _buildActionTile({
    required BuildContext context,
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return ListTile(
      dense: true,
      onTap: onTap,
      leading: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: iconColor.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: iconColor, size: 18),
      ),
      title: Text(
        title,
        style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: Color(0xFF1E293B)),
      ),
      subtitle: Text(
        subtitle,
        style: const TextStyle(fontSize: 10.5, color: Color(0xFF64748B)),
      ),
      trailing: const Icon(Icons.chevron_right, size: 18, color: Color(0xFF94A3B8)),
    );
  }
}
