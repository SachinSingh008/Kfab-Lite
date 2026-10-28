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
import '../../screens/employees/employees_list_screen.dart';
import '../../screens/profile/profile_screen.dart';

class KfabNavigationDrawer extends StatefulWidget {
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

  @override
  State<KfabNavigationDrawer> createState() => _KfabNavigationDrawerState();
}

class _KfabNavigationDrawerState extends State<KfabNavigationDrawer> {
  String? _expandedFolderKey;

  @override
  void initState() {
    super.initState();
    _syncActiveFolder();
  }

  @override
  void didUpdateWidget(covariant KfabNavigationDrawer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.currentIndex != widget.currentIndex) {
      _syncActiveFolder();
    }
  }

  void _syncActiveFolder() {
    if (widget.currentIndex == 0) {
      _expandedFolderKey = 'inventory';
    } else if (widget.currentIndex == 1) {
      _expandedFolderKey = 'people';
    } else if (widget.currentIndex == 3) {
      _expandedFolderKey = widget.authState.role == UserRole.accounts ? 'accounts' : 'reports';
    } else {
      _expandedFolderKey = null;
    }
  }

  void _toggleFolder(String key) {
    setState(() {
      _expandedFolderKey = (_expandedFolderKey == key) ? null : key;
    });
  }

  void _openNameChangeDialog(BuildContext context) {
    final nameCtrl = TextEditingController(text: widget.authState.userName);
    final emailCtrl = TextEditingController(text: widget.authState.userEmail);
    final phoneCtrl = TextEditingController(text: widget.authState.userPhone);

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

                    widget.authState.updateProfile(
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
    final role = widget.authState.role;
    final rolePrimary = AppTheme.getPrimaryForRole(role);

    final isSuperAdmin = role == UserRole.superAdmin;
    final isAdmin = role == UserRole.admin;
    final isSupervisor = role == UserRole.supervisor;
    final isAccountant = role == UserRole.accounts;

    // Role-based visibility adhering to the exact specification matrix
    const canSeeDashboard = true;
    const canSeeLogs = true;
    const canSeeInventory = true;
    final canSeeInventorySpreadsheets = isSuperAdmin || isAdmin || isAccountant; // hidden for SUPERVISOR
    final canSeeReports = isSuperAdmin || isAdmin || isSupervisor; // hidden for ACCOUNT
    final canSeeAccounts = isSuperAdmin || isAdmin || isAccountant; // hidden for SUPERVISOR
    final canSeePeople = isSuperAdmin || isAdmin || isAccountant; // hidden for SUPERVISOR
    final canSeeWorkbooks = isSuperAdmin || isAdmin || isAccountant; // hidden for SUPERVISOR
    final canSeeSecurity = isSuperAdmin || isAdmin; // hidden for ACCOUNT and SUPERVISOR

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
                              widget.authState.userName,
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF0F172A),
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              widget.authState.userEmail.isNotEmpty
                                  ? widget.authState.userEmail
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

            // 2. Direct Access Navigation List in Exact Order 1 to 8
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
                children: [
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    child: Text(
                      'NAVIGATION',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF94A3B8),
                        letterSpacing: 0.8,
                      ),
                    ),
                  ),

                  // 1. Dashboard (All roles)
                  if (canSeeDashboard)
                    _buildRootTile(
                      context: context,
                      icon: Icons.dashboard_outlined,
                      activeIcon: Icons.dashboard,
                      title: 'Dashboard',
                      isSelected: widget.currentIndex == 2 && _expandedFolderKey == null,
                      onTap: () {
                        Navigator.pop(context);
                        setState(() => _expandedFolderKey = null);
                        widget.onSelectTab(2);
                      },
                      rolePrimary: rolePrimary,
                    ),

                  // 2. Logs (All roles)
                  if (canSeeLogs)
                    _buildRootTile(
                      context: context,
                      icon: Icons.assignment_outlined,
                      activeIcon: Icons.assignment,
                      title: 'Logs',
                      isSelected: false,
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => LogsScreen(authState: widget.authState),
                          ),
                        );
                      },
                      rolePrimary: rolePrimary,
                    ),

                  // 3. Inventory (All roles - Spreadsheets hidden for SUPERVISOR)
                  if (canSeeInventory)
                    _buildCategory(
                      context: context,
                      label: 'Inventory',
                      icon: Icons.inventory_2_outlined,
                      folderKey: 'inventory',
                      isOpen: _expandedFolderKey == 'inventory',
                      isActiveParent: widget.currentIndex == 0 && _expandedFolderKey == 'inventory',
                      onToggle: () => _toggleFolder('inventory'),
                      rolePrimary: rolePrimary,
                      children: [
                        _buildSubTile(
                          context: context,
                          icon: Icons.inventory_2_outlined,
                          label: 'Materials',
                          isSelected: widget.currentIndex == 0,
                          onTap: () {
                            Navigator.pop(context);
                            widget.onSelectTab(0);
                          },
                          rolePrimary: rolePrimary,
                        ),
                        _buildSubTile(
                          context: context,
                          icon: Icons.layers_outlined,
                          label: 'Raw Material',
                          isSelected: false,
                          onTap: () {
                            Navigator.pop(context);
                            widget.onSelectTab(0);
                          },
                          rolePrimary: rolePrimary,
                        ),
                        if (canSeeInventorySpreadsheets)
                          _buildSubTile(
                            context: context,
                            icon: Icons.table_chart_outlined,
                            label: 'Spreadsheets',
                            isSelected: false,
                            onTap: () {
                              Navigator.pop(context);
                              widget.onSelectTab(0);
                            },
                            rolePrimary: rolePrimary,
                          ),
                      ],
                    ),

                  // 4. Reports (SUPER_ADMIN, ADMIN, SUPERVISOR - Hidden for ACCOUNT)
                  if (canSeeReports)
                    _buildCategory(
                      context: context,
                      label: 'Reports',
                      icon: Icons.bar_chart_outlined,
                      folderKey: 'reports',
                      isOpen: _expandedFolderKey == 'reports',
                      isActiveParent: widget.currentIndex == 3 && role != UserRole.accounts,
                      onToggle: () => _toggleFolder('reports'),
                      rolePrimary: rolePrimary,
                      children: [
                        _buildSubTile(
                          context: context,
                          icon: Icons.trending_up,
                          label: 'Project Progress',
                          isSelected: widget.currentIndex == 3 && role != UserRole.accounts,
                          onTap: () {
                            Navigator.pop(context);
                            widget.onSelectTab(3);
                          },
                          rolePrimary: rolePrimary,
                        ),
                        _buildSubTile(
                          context: context,
                          icon: Icons.view_timeline_outlined,
                          label: 'Project Details',
                          isSelected: false,
                          onTap: () {
                            Navigator.pop(context);
                            widget.onSelectTab(3);
                          },
                          rolePrimary: rolePrimary,
                        ),
                      ],
                    ),

                  // 5. Accounts and Commercial (SUPER_ADMIN, ADMIN, ACCOUNT - Hidden for SUPERVISOR)
                  if (canSeeAccounts)
                    _buildCategory(
                      context: context,
                      label: 'Accounts and Commercial',
                      icon: Icons.account_balance_outlined,
                      folderKey: 'accounts',
                      isOpen: _expandedFolderKey == 'accounts',
                      isActiveParent: widget.currentIndex == 3 && role == UserRole.accounts,
                      onToggle: () => _toggleFolder('accounts'),
                      rolePrimary: rolePrimary,
                      children: [
                        _buildSubTile(
                          context: context,
                          icon: Icons.receipt_long_outlined,
                          label: 'Accounts & 3-Way Match',
                          isSelected: widget.currentIndex == 3 && role == UserRole.accounts,
                          onTap: () {
                            Navigator.pop(context);
                            widget.onSelectTab(3);
                          },
                          rolePrimary: rolePrimary,
                        ),
                        _buildSubTile(
                          context: context,
                          icon: Icons.menu_book_outlined,
                          label: 'Atomic Stock Ledger',
                          isSelected: false,
                          onTap: () {
                            Navigator.pop(context);
                            widget.onSelectTab(0);
                          },
                          rolePrimary: rolePrimary,
                        ),
                        _buildSubTile(
                          context: context,
                          icon: Icons.local_shipping_outlined,
                          label: 'Inward Goods & Challans',
                          isSelected: false,
                          onTap: () {
                            Navigator.pop(context);
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => const ChallanCaptureScreen()),
                            );
                          },
                          rolePrimary: rolePrimary,
                        ),
                      ],
                    ),

                  // 6. People and HR (SUPER_ADMIN, ADMIN, ACCOUNT - Hidden for SUPERVISOR)
                  if (canSeePeople)
                    _buildCategory(
                      context: context,
                      label: 'People and HR',
                      icon: Icons.people_outline,
                      folderKey: 'people',
                      isOpen: _expandedFolderKey == 'people',
                      isActiveParent: widget.currentIndex == 1 && _expandedFolderKey == 'people',
                      onToggle: () => _toggleFolder('people'),
                      rolePrimary: rolePrimary,
                      children: [
                        _buildSubTile(
                          context: context,
                          icon: Icons.badge_outlined,
                          label: 'Personnel Directory',
                          isSelected: false,
                          onTap: () {
                            Navigator.pop(context);
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => EmployeesListScreen(store: widget.store)),
                            );
                          },
                          rolePrimary: rolePrimary,
                        ),
                        _buildSubTile(
                          context: context,
                          icon: Icons.fact_check_outlined,
                          label: 'Attendance Roster',
                          isSelected: widget.currentIndex == 1 && _expandedFolderKey != 'workbooks',
                          onTap: () {
                            Navigator.pop(context);
                            widget.onSelectTab(1);
                          },
                          rolePrimary: rolePrimary,
                        ),
                      ],
                    ),

                  // 7. Workbooks (SUPER_ADMIN, ADMIN, ACCOUNT - Hidden for SUPERVISOR)
                  if (canSeeWorkbooks)
                    _buildCategory(
                      context: context,
                      label: 'Workbooks',
                      icon: Icons.table_chart_outlined,
                      folderKey: 'workbooks',
                      isOpen: _expandedFolderKey == 'workbooks',
                      isActiveParent: _expandedFolderKey == 'workbooks',
                      onToggle: () => _toggleFolder('workbooks'),
                      rolePrimary: rolePrimary,
                      children: [
                        _buildSubTile(
                          context: context,
                          icon: Icons.calendar_month_outlined,
                          label: 'Attendance Workbook',
                          isSelected: widget.currentIndex == 1 && _expandedFolderKey == 'workbooks',
                          onTap: () {
                            Navigator.pop(context);
                            widget.onSelectTab(1);
                          },
                          rolePrimary: rolePrimary,
                        ),
                        _buildSubTile(
                          context: context,
                          icon: Icons.grid_on_outlined,
                          label: 'Inventory Spreadsheet',
                          isSelected: false,
                          onTap: () {
                            Navigator.pop(context);
                            widget.onSelectTab(0);
                          },
                          rolePrimary: rolePrimary,
                        ),
                      ],
                    ),

                  // 8. Admin and Security (SUPER_ADMIN, ADMIN - Hidden for ACCOUNT and SUPERVISOR)
                  if (canSeeSecurity)
                    _buildCategory(
                      context: context,
                      label: 'Admin and Security',
                      icon: Icons.admin_panel_settings_outlined,
                      folderKey: 'security',
                      isOpen: _expandedFolderKey == 'security',
                      isActiveParent: _expandedFolderKey == 'security',
                      onToggle: () => _toggleFolder('security'),
                      rolePrimary: rolePrimary,
                      children: [
                        _buildSubTile(
                          context: context,
                          icon: Icons.manage_accounts_outlined,
                          label: 'User Management',
                          isSelected: false,
                          onTap: () {
                            Navigator.pop(context);
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => ProfileScreen(
                                  authState: widget.authState,
                                  store: widget.store,
                                  syncEngine: widget.syncEngine,
                                ),
                              ),
                            );
                          },
                          rolePrimary: rolePrimary,
                        ),
                        _buildSubTile(
                          context: context,
                          icon: Icons.settings_outlined,
                          label: 'Plant Configuration',
                          isSelected: false,
                          onTap: () {
                            Navigator.pop(context);
                            widget.onSelectTab(2);
                          },
                          rolePrimary: rolePrimary,
                        ),
                      ],
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
                        MaterialPageRoute(builder: (_) => QuickUsageScreen(store: widget.store)),
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
                            store: widget.store,
                            onSelectMaterialForUsage: (code) {
                              widget.onSelectTab(0);
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
                    subtitle: '${widget.store.offlineQueue.length} pending cloud writes',
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => SyncQueueScreen(
                            store: widget.store,
                            syncEngine: widget.syncEngine ?? SyncEngine(mobileStore: widget.store),
                          ),
                        ),
                      );
                    },
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
                  widget.authState.logout();
                  Navigator.pushAndRemoveUntil(
                    context,
                    MaterialPageRoute(builder: (_) => LoginScreen(authState: widget.authState)),
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

  Widget _buildCategory({
    required BuildContext context,
    required String label,
    required IconData icon,
    required String folderKey,
    required bool isOpen,
    required bool isActiveParent,
    required VoidCallback onToggle,
    required Color rolePrimary,
    required List<Widget> children,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 3),
      decoration: BoxDecoration(
        color: isActiveParent
            ? rolePrimary.withValues(alpha: 0.08)
            : (isOpen ? const Color(0xFFF8FAFC) : Colors.transparent),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isActiveParent
              ? rolePrimary.withValues(alpha: 0.25)
              : (isOpen ? const Color(0xFFE2E8F0) : Colors.transparent),
        ),
      ),
      child: Column(
        children: [
          InkWell(
            onTap: onToggle,
            borderRadius: BorderRadius.circular(10),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              child: Row(
                children: [
                  Icon(
                    isOpen ? Icons.expand_more : Icons.chevron_right,
                    size: 20,
                    color: isActiveParent ? rolePrimary : const Color(0xFF64748B),
                  ),
                  const SizedBox(width: 8),
                  Icon(
                    icon,
                    size: 19,
                    color: isActiveParent ? rolePrimary : const Color(0xFF475569),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      label,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: (isActiveParent || isOpen) ? FontWeight.bold : FontWeight.w600,
                        color: isActiveParent ? rolePrimary : const Color(0xFF1E293B),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (isActiveParent)
                    Container(
                      width: 6,
                      height: 6,
                      decoration: BoxDecoration(
                        color: rolePrimary,
                        shape: BoxShape.circle,
                      ),
                    ),
                ],
              ),
            ),
          ),
          if (isOpen)
            Container(
              padding: const EdgeInsets.only(left: 28, right: 6, bottom: 6),
              child: Column(children: children),
            ),
        ],
      ),
    );
  }

  Widget _buildSubTile({
    required BuildContext context,
    required IconData icon,
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
    required Color rolePrimary,
  }) {
    return Container(
      margin: const EdgeInsets.only(top: 2),
      decoration: BoxDecoration(
        color: isSelected ? rolePrimary.withValues(alpha: 0.12) : Colors.transparent,
        borderRadius: BorderRadius.circular(8),
      ),
      child: ListTile(
        dense: true,
        visualDensity: const VisualDensity(horizontal: -2, vertical: -3),
        contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 0),
        onTap: onTap,
        leading: Icon(
          icon,
          size: 17,
          color: isSelected ? rolePrimary : const Color(0xFF64748B),
        ),
        title: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            color: isSelected ? rolePrimary : const Color(0xFF334155),
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ),
    );
  }

  Widget _buildRootTile({
    required BuildContext context,
    required IconData icon,
    required IconData activeIcon,
    required String title,
    required bool isSelected,
    required VoidCallback onTap,
    required Color rolePrimary,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 3),
      decoration: BoxDecoration(
        color: isSelected ? rolePrimary.withValues(alpha: 0.1) : Colors.transparent,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isSelected ? rolePrimary.withValues(alpha: 0.3) : Colors.transparent,
        ),
      ),
      child: ListTile(
        dense: true,
        visualDensity: const VisualDensity(horizontal: -1, vertical: -2),
        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 0),
        onTap: onTap,
        leading: Icon(
          isSelected ? activeIcon : icon,
          color: isSelected ? rolePrimary : const Color(0xFF475569),
          size: 20,
        ),
        title: Text(
          title,
          style: TextStyle(
            fontSize: 13,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
            color: isSelected ? rolePrimary : const Color(0xFF1E293B),
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
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
