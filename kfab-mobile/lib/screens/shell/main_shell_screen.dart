import 'package:flutter/material.dart';
import '../../core/config/app_theme.dart';
import '../../core/state/auth_state.dart';
import '../../core/state/mobile_store.dart';
import '../../core/state/sync_engine.dart';
import '../../core/state/notification_store.dart';
import '../dashboard/mobile_dashboard_screen.dart';
import '../attendance/attendance_muster_screen.dart';
import '../stock/quick_usage_screen.dart';
import '../notifications/notifications_screen.dart';
import '../profile/profile_screen.dart';
import '../scanner/qr_scanner_screen.dart';
import '../challan/challan_capture_screen.dart';

class MainShellScreen extends StatefulWidget {
  final AuthState authState;

  const MainShellScreen({super.key, required this.authState});

  @override
  State<MainShellScreen> createState() => _MainShellScreenState();
}

class _MainShellScreenState extends State<MainShellScreen> {
  int _currentIndex = 0;
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
            _onTabSelected(2); // Go to Quick Usage
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

  @override
  Widget build(BuildContext context) {
    final screens = [
      MobileDashboardScreen(
        authState: widget.authState,
        store: _store,
        syncEngine: _syncEngine,
        onNavigateTab: _onTabSelected,
        onOpenScanner: _openQrScanner,
        onOpenChallanCapture: _openChallanCapture,
      ),
      AttendanceMusterScreen(store: _store),
      QuickUsageScreen(store: _store),
      NotificationsScreen(store: _notificationStore),
      ProfileScreen(
        authState: widget.authState,
        store: _store,
        syncEngine: _syncEngine,
      ),
    ];

    return ListenableBuilder(
      listenable: _notificationStore,
      builder: (context, _) {
        final unreadCount = _notificationStore.unreadCount;

        return Scaffold(
          body: IndexedStack(
            index: _currentIndex,
            children: screens,
          ),
          bottomNavigationBar: BottomNavigationBar(
            currentIndex: _currentIndex,
            onTap: _onTabSelected,
            backgroundColor: AppTheme.slateDark,
            selectedItemColor: const Color(0xFF60A5FA),
            unselectedItemColor: const Color(0xFF94A3B8),
            items: [
              const BottomNavigationBarItem(
                icon: Icon(Icons.dashboard_outlined),
                activeIcon: Icon(Icons.dashboard),
                label: 'Home',
              ),
              const BottomNavigationBarItem(
                icon: Icon(Icons.fact_check_outlined),
                activeIcon: Icon(Icons.fact_check),
                label: 'Attendance',
              ),
              const BottomNavigationBarItem(
                icon: Icon(Icons.inventory_2_outlined),
                activeIcon: Icon(Icons.inventory_2),
                label: 'Usage',
              ),
              BottomNavigationBarItem(
                icon: Badge(
                  isLabelVisible: unreadCount > 0,
                  label: Text(
                    unreadCount.toString(),
                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                  child: const Icon(Icons.notifications_outlined),
                ),
                activeIcon: Badge(
                  isLabelVisible: unreadCount > 0,
                  label: Text(
                    unreadCount.toString(),
                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                  child: const Icon(Icons.notifications),
                ),
                label: 'Alerts',
              ),
              const BottomNavigationBarItem(
                icon: Icon(Icons.account_circle_outlined),
                activeIcon: Icon(Icons.account_circle),
                label: 'Profile',
              ),
            ],
          ),
        );
      },
    );
  }
}
