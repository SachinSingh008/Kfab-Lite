import 'package:flutter/material.dart';
import '../../core/config/app_theme.dart';
import '../../core/models/attendance_record.dart';
import '../../core/state/mobile_store.dart';
import '../../widgets/attendance/attendance_card.dart';
import '../../widgets/attendance/request_correction_sheet.dart';
import '../../widgets/common/search_bar_field.dart';

class AttendanceMusterScreen extends StatefulWidget {
  final MobileStore store;

  const AttendanceMusterScreen({super.key, required this.store});

  @override
  State<AttendanceMusterScreen> createState() => _AttendanceMusterScreenState();
}

class _AttendanceMusterScreenState extends State<AttendanceMusterScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  String _searchQuery = '';
  String _selectedShift = 'ALL';
  final String _selectedCompany = 'KFab Infra Project Pvt Ltd';
  final TextEditingController _searchController = TextEditingController();
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _refreshFromSupabase();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _refreshFromSupabase() async {
    setState(() => _isLoading = true);
    await widget.store.loadAttendanceFromSupabase();
    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  void _showClearTodayConfirmDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: AppTheme.dangerCrimson),
            SizedBox(width: 8),
            Text('Clear Today?', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Text(
          'Are you sure you want to clear attendance records for all ${widget.store.employees.length} workers on ${widget.store.activeDate}?\n\nThis removes attendance records (resetting cells to blank) rather than marking them absent.',
          style: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.dangerCrimson,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () {
              Navigator.pop(ctx);
              widget.store.clearTodayAttendance();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Attendance records cleared for today.'),
                  backgroundColor: AppTheme.slateDark,
                ),
              );
            },
            child: const Text('Clear Attendance'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: widget.store,
      builder: (context, _) {
        final filteredEmployees = widget.store.employees.where((emp) {
          final matchesQuery = emp.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
              emp.employeeCode.toLowerCase().contains(_searchQuery.toLowerCase()) ||
              emp.id.toLowerCase().contains(_searchQuery.toLowerCase()) ||
              emp.department.toLowerCase().contains(_searchQuery.toLowerCase());
          final matchesShift = _selectedShift == 'ALL' || emp.shift.contains(_selectedShift);
          return matchesQuery && matchesShift;
        }).toList();

        final isHistorical = widget.store.isHistoricalDate;

        return Scaffold(
          backgroundColor: Colors.transparent,
          body: Column(
            children: [
              // 1. Top Section: Company Selector, 3 Tabs & Date Bar
              Container(
                color: Colors.white,
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                child: Column(
                  children: [
                    // Company Selection Bar
                    Row(
                      children: [
                        const Icon(Icons.business, size: 16, color: AppTheme.primaryBlue),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Daily Muster Register',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.slateDark,
                                ),
                              ),
                              Text(
                                _selectedCompany,
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                  color: AppTheme.textMuted,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                        // Refresh button
                        IconButton(
                          icon: _isLoading
                              ? const SizedBox(
                                  width: 14,
                                  height: 14,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Icon(Icons.refresh, size: 18, color: AppTheme.textMuted),
                          onPressed: _isLoading ? null : _refreshFromSupabase,
                          tooltip: 'Refresh from Supabase',
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                        ),
                      ],
                    ),

                    const SizedBox(height: 10),

                    // 3 Tabs (Tab 1: Attendance, Tab 2: Attendance Ledger, Tab 3: Reserved / Future)
                    Container(
                      height: 38,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: TabBar(
                        controller: _tabController,
                        labelColor: Colors.white,
                        unselectedLabelColor: const Color(0xFF64748B),
                        indicatorSize: TabBarIndicatorSize.tab,
                        indicator: BoxDecoration(
                          color: AppTheme.slateDark,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        labelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                        unselectedLabelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                        tabs: const [
                          Tab(text: 'Attendance'),
                          Tab(text: 'Ledger'),
                          Tab(text: 'Tab 3 (Future)'),
                        ],
                      ),
                    ),

                    const SizedBox(height: 8),

                    // Date & Historical Lock selector
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.calendar_today, size: 13, color: AppTheme.textMuted),
                            const SizedBox(width: 4),
                            Text(
                              widget.store.activeDate,
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                            ),
                          ],
                        ),
                        PopupMenuButton<bool>(
                          initialValue: isHistorical,
                          icon: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                isHistorical ? Icons.lock : Icons.event_available,
                                size: 14,
                                color: isHistorical ? AppTheme.dangerCrimson : AppTheme.successEmerald,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                isHistorical ? 'Historical (Locked)' : 'Active Muster',
                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                              ),
                              const Icon(Icons.arrow_drop_down, size: 16),
                            ],
                          ),
                          onSelected: (val) {
                            widget.store.toggleHistoricalDateMode(val);
                          },
                          itemBuilder: (context) => [
                            const PopupMenuItem(
                              value: false,
                              child: Text('Active Business Day (Editable)'),
                            ),
                            const PopupMenuItem(
                              value: true,
                              child: Text('Historical Date (Locked)'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // 2. Tab Content Views
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    // TAB 1: ATTENDANCE MUSTER
                    Column(
                      children: [
                        // Top KPI Summary Cards (Section 6)
                        Container(
                          color: const Color(0xFFF8FAFC),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          child: Row(
                            children: [
                              _buildKpiCard('Total', '${widget.store.totalWorkersCount}', const Color(0xFF64748B), const Color(0xFFF1F5F9)),
                              const SizedBox(width: 6),
                              _buildKpiCard('Present', '${widget.store.presentCount}', const Color(0xFF16A34A), const Color(0xFFDCFCE7)),
                              const SizedBox(width: 6),
                              _buildKpiCard('Absent', '${widget.store.absentCount}', const Color(0xFFDC2626), const Color(0xFFFEE2E2)),
                              const SizedBox(width: 6),
                              _buildKpiCard('OD', '${widget.store.odCount}', const Color(0xFF7C3AED), const Color(0xFFEDE9FE)),
                              const SizedBox(width: 6),
                              _buildKpiCard('OT', '${widget.store.totalOvertimeHours}h', const Color(0xFFEA580C), const Color(0xFFFFEDD5)),
                            ],
                          ),
                        ),

                        // Search and Quick Actions Bar
                        Container(
                          color: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          child: Column(
                            children: [
                              SearchBarField(
                                controller: _searchController,
                                hintText: 'Search worker name, code, dept...',
                                onChanged: (val) => setState(() => _searchQuery = val),
                                onClear: () => setState(() => _searchQuery = ''),
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  Expanded(
                                    child: SingleChildScrollView(
                                      scrollDirection: Axis.horizontal,
                                      child: Row(
                                        children: [
                                          'ALL',
                                          'Welding',
                                          'Fabrication',
                                          'Quality',
                                          'Machining',
                                        ].map((f) {
                                          final isSelected = _selectedShift == f;
                                          return Padding(
                                            padding: const EdgeInsets.only(right: 6),
                                            child: FilterChip(
                                              label: Text(f),
                                              labelStyle: TextStyle(
                                                fontSize: 10,
                                                fontWeight: FontWeight.bold,
                                                color: isSelected ? Colors.white : AppTheme.slateDark,
                                              ),
                                              selected: isSelected,
                                              selectedColor: AppTheme.slateDark,
                                              backgroundColor: const Color(0xFFF1F5F9),
                                              onSelected: (val) {
                                                setState(() => _selectedShift = f);
                                              },
                                              padding: EdgeInsets.zero,
                                              visualDensity: VisualDensity.compact,
                                            ),
                                          );
                                        }).toList(),
                                      ),
                                    ),
                                  ),
                                  if (!isHistorical) ...[
                                    PopupMenuButton<String>(
                                      icon: const Icon(Icons.more_vert, size: 18, color: AppTheme.slateDark),
                                      onSelected: (action) {
                                        if (action == 'all_present') {
                                          widget.store.markAllRemainingPresent();
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            const SnackBar(content: Text('All pending workers marked PRESENT.')),
                                          );
                                        } else if (action == 'all_absent') {
                                          widget.store.markAllAbsent();
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            const SnackBar(content: Text('All workers marked ABSENT.')),
                                          );
                                        } else if (action == 'clear') {
                                          _showClearTodayConfirmDialog();
                                        }
                                      },
                                      itemBuilder: (ctx) => [
                                        const PopupMenuItem(
                                          value: 'all_present',
                                          child: Text('✓ Mark All Present'),
                                        ),
                                        const PopupMenuItem(
                                          value: 'all_absent',
                                          child: Text('✗ Mark All Absent'),
                                        ),
                                        const PopupMenuItem(
                                          value: 'clear',
                                          child: Text('Clear Today'),
                                        ),
                                      ],
                                    ),
                                  ],
                                ],
                              ),
                            ],
                          ),
                        ),

                        // Workers List
                        Expanded(
                          child: filteredEmployees.isEmpty
                              ? const Center(
                                  child: Text(
                                    'No workers found matching query.',
                                    style: TextStyle(fontSize: 13, color: AppTheme.textMuted),
                                  ),
                                )
                              : ListView.builder(
                                  padding: const EdgeInsets.only(top: 4, bottom: 20),
                                  itemCount: filteredEmployees.length,
                                  itemBuilder: (context, index) {
                                    final emp = filteredEmployees[index];
                                    final record = widget.store.getAttendance(emp.id);

                                    return AttendanceCard(
                                      employee: emp,
                                      record: record,
                                      isHistoricalDate: isHistorical,
                                      onStatusSelected: (status) {
                                        widget.store.markAttendance(emp.id, status);
                                      },
                                      onOvertimeUpdated: (hours, remarks) {
                                        widget.store.updateOvertime(emp.id, hours, remarks);
                                      },
                                      onRequestCorrection: () {
                                        showModalBottomSheet(
                                          context: context,
                                          isScrollControlled: true,
                                          backgroundColor: Colors.transparent,
                                          builder: (_) => RequestCorrectionSheet(
                                            employee: emp,
                                            currentRecord: record,
                                            onSubmit: (reason, requestedStatus) {
                                              widget.store.requestCorrection(
                                                employeeId: emp.id,
                                                reason: reason,
                                                requestedStatus: requestedStatus,
                                              );
                                            },
                                          ),
                                        );
                                      },
                                    );
                                  },
                                ),
                        ),
                      ],
                    ),

                    // TAB 2: ATTENDANCE LEDGER / MONTHLY SUMMARY VIEW
                    Container(
                      color: Colors.white,
                      child: Column(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            color: const Color(0xFFF8FAFC),
                            child: const Row(
                              children: [
                                Icon(Icons.table_chart_outlined, size: 16, color: AppTheme.primaryBlue),
                                SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    'Monthly Attendance Ledger Summary',
                                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Expanded(
                            child: ListView.separated(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                              itemCount: filteredEmployees.length,
                              separatorBuilder: (ctx, idx) => const Divider(height: 1),
                              itemBuilder: (ctx, i) {
                                final emp = filteredEmployees[i];
                                final record = widget.store.getAttendance(emp.id);
                                final isP = record?.status == AttendanceStatus.present;
                                final isA = record?.status == AttendanceStatus.absent;
                                final isOd = record?.status == AttendanceStatus.od;

                                return Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 8),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              emp.name,
                                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                            ),
                                            Text(
                                              '${emp.employeeCode} • ${emp.department}',
                                              style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: isP
                                              ? const Color(0xFFDCFCE7)
                                              : isA
                                                  ? const Color(0xFFFEE2E2)
                                                  : isOd
                                                      ? const Color(0xFFEDE9FE)
                                                      : const Color(0xFFF1F5F9),
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          isP
                                              ? 'P'
                                              : isA
                                                  ? 'A'
                                                  : isOd
                                                      ? 'OD'
                                                      : '-',
                                          style: TextStyle(
                                            fontWeight: FontWeight.w900,
                                            fontSize: 12,
                                            color: isP
                                                ? const Color(0xFF15803D)
                                                : isA
                                                    ? const Color(0xFFB91C1C)
                                                    : isOd
                                                        ? const Color(0xFF6D28D9)
                                                        : const Color(0xFF64748B),
                                          ),
                                        ),
                                      ),
                                      if ((record?.overtimeHours ?? 0) > 0) ...[
                                        const SizedBox(width: 6),
                                        Text(
                                          '${record!.overtimeHours}h',
                                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFFC2410C)),
                                        ),
                                      ],
                                    ],
                                  ),
                                );
                              },
                            ),
                          ),
                        ],
                      ),
                    ),

                    // TAB 3: RESERVED / FUTURE (Section 2)
                    Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: const BoxDecoration(
                                color: Color(0xFFF1F5F9),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.access_time_filled, size: 36, color: Color(0xFF64748B)),
                            ),
                            const SizedBox(height: 16),
                            const Text(
                              'Tab 3 — Reserved / Future Functionality',
                              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              'This tab is architecturally reserved for upcoming biometric hardware synchronization and facial time-clock logging.\nNo invented functionality per Section 2 Specification.',
                              textAlign: TextAlign.center,
                              style: TextStyle(fontSize: 12, color: Color(0xFF64748B), height: 1.4),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildKpiCard(String label, String value, Color textColor, Color bgColor) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: textColor.withValues(alpha: 0.2)),
        ),
        child: Column(
          children: [
            Text(
              label,
              style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: textColor),
            ),
            const SizedBox(height: 2),
            Text(
              value,
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: textColor),
            ),
          ],
        ),
      ),
    );
  }
}
