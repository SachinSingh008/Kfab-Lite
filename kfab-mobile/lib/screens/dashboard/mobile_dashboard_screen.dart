import 'package:flutter/material.dart';
import '../../core/config/app_theme.dart';
import '../../core/state/auth_state.dart';
import '../../core/state/mobile_store.dart';
import '../../core/state/sync_engine.dart';
import '../../widgets/advanced/sync_status_pill.dart';
import '../../widgets/common/stat_summary_card.dart';
import '../../widgets/common/status_chip.dart';
import '../sync/sync_queue_screen.dart';

class MobileDashboardScreen extends StatelessWidget {
  final AuthState authState;
  final MobileStore store;
  final SyncEngine syncEngine;
  final void Function(int tabIndex) onNavigateTab;
  final VoidCallback onOpenScanner;
  final VoidCallback onOpenChallanCapture;

  const MobileDashboardScreen({
    super.key,
    required this.authState,
    required this.store,
    required this.syncEngine,
    required this.onNavigateTab,
    required this.onOpenScanner,
    required this.onOpenChallanCapture,
  });

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: Listenable.merge([store, syncEngine]),
      builder: (context, _) {
        final totalWorkers = store.totalWorkersCount;
        final presentWorkers = store.presentCount;
        final absentWorkers = store.absentCount;
        final unmarkedWorkers = store.unmarkedCount;
        final turnoutPercentage = totalWorkers > 0
            ? ((presentWorkers / totalWorkers) * 100).toStringAsFixed(1)
            : '0.0';

        return Scaffold(
          appBar: AppBar(
            title: Row(
              children: [
                const Icon(Icons.precision_manufacturing, size: 20, color: Color(0xFF60A5FA)),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    authState.role.displayName,
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            actions: [
              // Sync Status Pill in AppBar
              Padding(
                padding: const EdgeInsets.only(right: 12),
                child: Center(
                  child: SyncStatusPill(
                    syncEngine: syncEngine,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => SyncQueueScreen(store: store, syncEngine: syncEngine),
                        ),
                      );
                    },
                  ),
                ),
              ),
            ],
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Welcome Greeting Card
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppTheme.slateDark, Color(0xFF1E293B)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Welcome, ${authState.userName}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          const SizedBox(height: 2),
                          Text(
                            authState.companyName,
                            style: const TextStyle(
                              color: Color(0xFF94A3B8),
                              fontSize: 12,
                            ),
                          ),
                          const SizedBox(height: 10),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFF0F766E).withValues(alpha: 0.4),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: const Color(0xFF14B8A6), width: 0.5),
                            ),
                            child: const Row(
                              children: [
                                Icon(Icons.shield_outlined, size: 12, color: Color(0xFF2DD4BF)),
                                SizedBox(width: 4),
                                Text(
                                  'Date-Lock Active (Asia/Kolkata)',
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: Color(0xFF2DD4BF),
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: AppTheme.primaryBlue.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Center(
                          child: Icon(Icons.badge_outlined, color: Colors.white, size: 24),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // Phase 4 Quick Hardware Tools Action Bar
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF1E293B),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        onPressed: onOpenScanner,
                        icon: const Icon(Icons.qr_code_scanner, size: 18, color: Color(0xFF60A5FA)),
                        label: const Text('SCAN QR CODE', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF1E293B),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        onPressed: onOpenChallanCapture,
                        icon: const Icon(Icons.camera_alt, size: 18, color: Color(0xFF34D399)),
                        label: const Text('CHALLAN PHOTO', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // Quick Action Primary CTA for Supervisors
                if (authState.role == UserRole.supervisor ||
                    authState.role == UserRole.attendanceUser ||
                    authState.role == UserRole.admin) ...[
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryBlue,
                        foregroundColor: Colors.white,
                        elevation: 1,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      onPressed: () => onNavigateTab(1), // Go to Attendance
                      icon: const Icon(Icons.check_circle_outline, size: 20),
                      label: const Text(
                        "OPEN TODAY'S MUSTER REGISTER",
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Two-Column KPI Stat Cards
                Row(
                  children: [
                    Expanded(
                      child: StatSummaryCard(
                        title: 'Muster Turnout',
                        value: '$turnoutPercentage%',
                        subtitle: '$presentWorkers of $totalWorkers on duty',
                        icon: Icons.groups,
                        iconColor: AppTheme.successEmerald,
                        iconBgColor: const Color(0xFFECFDF5),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: StatSummaryCard(
                        title: 'Pending Muster',
                        value: '$unmarkedWorkers',
                        subtitle: '$absentWorkers confirmed absent',
                        icon: Icons.pending_actions,
                        iconColor: AppTheme.warningAmber,
                        iconBgColor: const Color(0xFFFFFBEB),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 12),

                Row(
                  children: [
                    Expanded(
                      child: StatSummaryCard(
                        title: 'Critical Stock',
                        value: '${store.lowStockItemsCount} Items',
                        subtitle: 'Below reorder point',
                        icon: Icons.warning_amber_rounded,
                        iconColor: AppTheme.dangerCrimson,
                        iconBgColor: const Color(0xFFFEF2F2),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: StatSummaryCard(
                        title: 'Offline Queue',
                        value: '${syncEngine.pendingCount} Items',
                        subtitle: syncEngine.isOnline ? 'Online mode' : 'Offline mode',
                        icon: Icons.sync,
                        iconColor: AppTheme.primaryBlue,
                        iconBgColor: const Color(0xFFEFF6FF),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 20),

                // Critical Stock Alert Section
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Material Watchlist',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.slateDark,
                      ),
                    ),
                    TextButton(
                      onPressed: () => onNavigateTab(2), // Go to Stock
                      child: const Text(
                        'View All Stock',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),

                ...store.stockItems.where((s) => s.isLow).map((item) {
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFFECACA)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.name,
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.slateDark,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${item.code} • Min: ${item.minStock} ${item.unit}',
                              style: const TextStyle(
                                fontSize: 11,
                                color: AppTheme.textMuted,
                              ),
                            ),
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              '${item.currentStock} ${item.unit}',
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.dangerCrimson,
                              ),
                            ),
                            const SizedBox(height: 2),
                            const StatusChip(
                              label: 'LOW',
                              tone: ChipTone.danger,
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                }),
              ],
            ),
          ),
        );
      },
    );
  }
}
