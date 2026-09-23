import 'package:flutter/material.dart';
import '../../core/config/app_theme.dart';
import '../../core/state/auth_state.dart';
import '../../core/state/mobile_store.dart';
import '../../core/state/sync_engine.dart';
import '../../core/state/notification_store.dart';
import '../../widgets/common/kfab_top_app_bar.dart';
import '../dashboard/mobile_dashboard_screen.dart';
import '../attendance/attendance_muster_screen.dart';
import '../stock/inventory_screen.dart';
import '../reports/reports_bills_screen.dart';
import '../chat/team_chat_screen.dart';
import '../notifications/notifications_screen.dart';
import '../profile/profile_screen.dart';
import '../scanner/qr_scanner_screen.dart';
import '../challan/challan_capture_screen.dart';
import '../../widgets/common/kfab_navigation_drawer.dart';

class MainShellScreen extends StatefulWidget {
  final AuthState authState;

  const MainShellScreen({super.key, required this.authState});

  @override
  State<MainShellScreen> createState() => _MainShellScreenState();
}

class _MainShellScreenState extends State<MainShellScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  // Start on Tab 2 (Home)
  int _currentIndex = 2;
  late final MobileStore _store;
  late final SyncEngine _syncEngine;
  late final NotificationStore _notificationStore;

  @override
  void initState() {
    super.initState();
    _store = MobileStore();
    _syncEngine = SyncEngine(mobileStore: _store);
    _notificationStore = NotificationStore();
  }

  @override
  void dispose() {
    _store.dispose();
    _syncEngine.dispose();
    _notificationStore.dispose();
    super.dispose();
  }

  void _onTabSelected(int index) {
    setState(() => _currentIndex = index);
  }

  void _openQrScanner() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => QrScannerScreen(
          store: _store,
          onSelectMaterialForUsage: (code) {
            _onTabSelected(0); // Jump to Inventory
          },
        ),
      ),
    );
  }

  void _openChallanCapture() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => const ChallanCaptureScreen(),
      ),
    );
  }

  void _openSearchModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _SearchBottomSheet(
        role: widget.authState.role,
        onSelectTab: (index) {
          Navigator.pop(ctx);
          _onTabSelected(index);
        },
      ),
    );
  }

  void _openNotifications() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => NotificationsScreen(store: _notificationStore),
      ),
    );
  }

  void _openProfile() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ProfileScreen(
          authState: widget.authState,
          store: _store,
          syncEngine: _syncEngine,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final role = widget.authState.role;
    final isAccountant = role == UserRole.accounts;

    // 5 Primary Bottom Tabs in requested order:
    // [0: Inventory, 1: Attendance, 2: Home, 3: Report/Bills, 4: Chat]
    final screens = [
      InventoryScreen(
        store: _store,
        onOpenScanner: _openQrScanner,
      ),
      AttendanceMusterScreen(store: _store),
      MobileDashboardScreen(
        authState: widget.authState,
        store: _store,
        syncEngine: _syncEngine,
        onNavigateTab: _onTabSelected,
        onOpenScanner: _openQrScanner,
        onOpenChallanCapture: _openChallanCapture,
      ),
      ReportsBillsScreen(authState: widget.authState),
      TeamChatScreen(authState: widget.authState),
    ];

    return ListenableBuilder(
      listenable: Listenable.merge([_notificationStore, widget.authState]),
      builder: (context, _) {
        final unreadCount = _notificationStore.unreadCount;

        return Scaffold(
          key: _scaffoldKey,
          drawerEnableOpenDragGesture: true,
          // Top AppBar with Left: Hamburger menu, "kfabs" logo & role badge, Right: Search, Notification, Profile
          appBar: KfabTopAppBar(
            authState: widget.authState,
            unreadCount: unreadCount,
            onOpenDrawer: () {
              if (_scaffoldKey.currentState != null && !_scaffoldKey.currentState!.isDrawerOpen) {
                _scaffoldKey.currentState!.openDrawer();
              }
            },
            onOpenSearch: _openSearchModal,
            onOpenNotifications: _openNotifications,
            onOpenProfile: _openProfile,
          ),
          // Navigation Drawer with direct tab access & profile/name change
          drawer: KfabNavigationDrawer(
            authState: widget.authState,
            store: _store,
            syncEngine: _syncEngine,
            currentIndex: _currentIndex,
            onSelectTab: _onTabSelected,
          ),
          body: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: AppTheme.getLightBgGradientForRole(role),
              ),
            ),
            child: IndexedStack(
              index: _currentIndex,
              children: screens,
            ),
          ),
          bottomNavigationBar: Container(
            decoration: BoxDecoration(
              color: AppTheme.getNavBarBgForRole(role),
              border: Border(
                top: BorderSide(
                  color: AppTheme.getLightCardBorderForRole(role),
                  width: 1,
                ),
              ),
            ),
            child: BottomNavigationBar(
              currentIndex: _currentIndex,
              onTap: _onTabSelected,
              backgroundColor: Colors.transparent,
              elevation: 0,
              type: BottomNavigationBarType.fixed,
              selectedItemColor: AppTheme.getPrimaryForRole(role),
              unselectedItemColor: const Color(0xFF64748B),
              selectedFontSize: 11,
              unselectedFontSize: 11,
              selectedLabelStyle: const TextStyle(fontWeight: FontWeight.w700),
              unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500),
              items: [
                const BottomNavigationBarItem(
                  icon: Icon(Icons.inventory_2_outlined),
                  activeIcon: Icon(Icons.inventory_2),
                  label: 'Inventory',
                ),
                const BottomNavigationBarItem(
                  icon: Icon(Icons.fact_check_outlined),
                  activeIcon: Icon(Icons.fact_check),
                  label: 'Attendance',
                ),
                const BottomNavigationBarItem(
                  icon: Icon(Icons.home_outlined),
                  activeIcon: Icon(Icons.home),
                  label: 'Home',
                ),
                BottomNavigationBarItem(
                  icon: Icon(
                    isAccountant ? Icons.receipt_long_outlined : Icons.analytics_outlined,
                  ),
                  activeIcon: Icon(
                    isAccountant ? Icons.receipt_long : Icons.analytics,
                  ),
                  label: isAccountant ? 'Bills' : 'Report',
                ),
                const BottomNavigationBarItem(
                  icon: Icon(Icons.chat_bubble_outline),
                  activeIcon: Icon(Icons.chat_bubble),
                  label: 'Chat',
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _SearchBottomSheet extends StatefulWidget {
  final UserRole role;
  final ValueChanged<int> onSelectTab;

  const _SearchBottomSheet({
    required this.role,
    required this.onSelectTab,
  });

  @override
  State<_SearchBottomSheet> createState() => _SearchBottomSheetState();
}

class _SearchBottomSheetState extends State<_SearchBottomSheet> {
  final _searchController = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final rolePrimary = AppTheme.getPrimaryForRole(widget.role);
    final isAccountant = widget.role == UserRole.accounts;

    final quickShortcuts = [
      {
        'title': 'Steel Inventory',
        'subtitle': 'Raw plates, ISMB Beams, Channels, Electrodes',
        'tabIndex': 0,
        'icon': Icons.inventory_2_outlined,
        'color': const Color(0xFF2563EB),
      },
      {
        'title': 'Worker Attendance',
        'subtitle': 'Welders, fitters, grinders & daily muster',
        'tabIndex': 1,
        'icon': Icons.fact_check_outlined,
        'color': const Color(0xFF059669),
      },
      {
        'title': 'Plant Dashboard',
        'subtitle': 'Real-time production, dispatch & sync queue',
        'tabIndex': 2,
        'icon': Icons.dashboard_outlined,
        'color': const Color(0xFFD97706),
      },
      {
        'title': isAccountant ? 'Vendor Bills & Invoices' : 'Production Reports',
        'subtitle': isAccountant
            ? '3-Way matching, POs, GST invoices & Tally sync'
            : 'Tonnage outputs, Bay efficiency & machine uptime',
        'tabIndex': 3,
        'icon': isAccountant ? Icons.receipt_long_outlined : Icons.analytics_outlined,
        'color': isAccountant ? const Color(0xFF059669) : const Color(0xFF4F46E5),
      },
      {
        'title': 'Team Chat & Channels',
        'subtitle': '#all-plant-alerts, #bay-1-fitup, #welding-qa',
        'tabIndex': 4,
        'icon': Icons.chat_bubble_outline,
        'color': const Color(0xFF7C3AED),
      },
    ];

    final filtered = quickShortcuts.where((item) {
      if (_query.trim().isEmpty) return true;
      final q = _query.toLowerCase();
      final title = (item['title'] as String).toLowerCase();
      final subtitle = (item['subtitle'] as String).toLowerCase();
      return title.contains(q) || subtitle.contains(q);
    }).toList();

    return Container(
      padding: EdgeInsets.only(
        top: 16,
        left: 16,
        right: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Handle bar
          Center(
            child: Container(
              width: 38,
              height: 4,
              decoration: BoxDecoration(
                color: const Color(0xFFCBD5E1),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Search Field
          TextField(
            controller: _searchController,
            autofocus: true,
            onChanged: (val) => setState(() => _query = val),
            decoration: InputDecoration(
              hintText: 'Search inventory, workers, bills, chats...',
              hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
              prefixIcon: Icon(Icons.search, color: rolePrimary, size: 20),
              suffixIcon: _query.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear, size: 18),
                      onPressed: () {
                        _searchController.clear();
                        setState(() => _query = '');
                      },
                    )
                  : null,
              contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
              filled: true,
              fillColor: const Color(0xFFF8FAFC),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: rolePrimary, width: 1.5),
              ),
            ),
          ),
          const SizedBox(height: 16),

          const Text(
            'QUICK SHORTCUTS & SECTIONS',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w800,
              color: Color(0xFF64748B),
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 10),

          // List of shortcuts
          ConstrainedBox(
            constraints: const BoxConstraints(maxHeight: 280),
            child: ListView.separated(
              shrinkWrap: true,
              itemCount: filtered.length,
              separatorBuilder: (context, index) => const Divider(height: 1, color: Color(0xFFF1F5F9)),
              itemBuilder: (context, i) {
                final item = filtered[i];
                final color = item['color'] as Color;
                final icon = item['icon'] as IconData;
                final tabIndex = item['tabIndex'] as int;

                return ListTile(
                  dense: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                  leading: Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(icon, color: color, size: 18),
                  ),
                  title: Text(
                    item['title'] as String,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  subtitle: Text(
                    item['subtitle'] as String,
                    style: const TextStyle(
                      fontSize: 11,
                      color: Color(0xFF64748B),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 12, color: Color(0xFF94A3B8)),
                  onTap: () => widget.onSelectTab(tabIndex),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
