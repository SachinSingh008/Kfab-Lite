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

class _AttendanceMusterScreenState extends State<AttendanceMusterScreen> {
  String _searchQuery = '';
  String _selectedShift = 'ALL';
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: widget.store,
      builder: (context, _) {
        final filteredEmployees = widget.store.employees.where((emp) {
          final matchesQuery = emp.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
              emp.id.toLowerCase().contains(_searchQuery.toLowerCase()) ||
              emp.department.toLowerCase().contains(_searchQuery.toLowerCase());
          final matchesShift = _selectedShift == 'ALL' || emp.shift.contains(_selectedShift);
          return matchesQuery && matchesShift;
        }).toList();

        final isHistorical = widget.store.isHistoricalDate;

        return Scaffold(
          appBar: AppBar(
            title: const Text('Daily Muster Register'),
            actions: [
              // Date Toggle (Active Today vs Historical Locked)
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: PopupMenuButton<bool>(
                  initialValue: isHistorical,
                  icon: Row(
                    children: [
                      Icon(
                        isHistorical ? Icons.lock : Icons.event_available,
                        size: 16,
                        color: isHistorical ? AppTheme.dangerCrimson : AppTheme.successEmerald,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        isHistorical ? '17 Sep (Locked)' : '18 Sep (Active)',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                      const Icon(Icons.arrow_drop_down, size: 18),
                    ],
                  ),
                  onSelected: (val) {
                    widget.store.toggleHistoricalDateMode(val);
                  },
                  itemBuilder: (context) => [
                    const PopupMenuItem(
                      value: false,
                      child: Text('18 Sep 2026 — Active Business Day'),
                    ),
                    const PopupMenuItem(
                      value: true,
                      child: Text('17 Sep 2026 — Historical (Locked at 23:59)'),
                    ),
                  ],
                ),
              ),
            ],
          ),
          body: Column(
            children: [
              // Sticky Search & Filter Bar
              Container(
                color: Colors.white,
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
                child: Column(
                  children: [
                    SearchBarField(
                      controller: _searchController,
                      hintText: 'Search welder, fitter, ID...',
                      onChanged: (val) => setState(() => _searchQuery = val),
                      onClear: () => setState(() => _searchQuery = ''),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Text(
                          'Filter:',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textMuted,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              children: [
                                'ALL',
                                'Fabrication',
                                'Assembly Bay',
                                'Machine Shop',
                              ].map((f) {
                                final isSelected = _selectedShift == f;
                                return Padding(
                                  padding: const EdgeInsets.only(right: 6),
                                  child: FilterChip(
                                    label: Text(f),
                                    labelStyle: TextStyle(
                                      fontSize: 11,
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
                        if (!isHistorical)
                          TextButton.icon(
                            onPressed: () {
                              widget.store.markAllRemainingPresent();
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('All pending workers marked PRESENT for today.'),
                                  duration: Duration(seconds: 2),
                                ),
                              );
                            },
                            style: TextButton.styleFrom(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                            icon: const Icon(Icons.done_all, size: 16),
                            label: const Text(
                              'All Present',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),

              // Date Lock Status Bar
              if (isHistorical)
                Container(
                  width: double.infinity,
                  color: const Color(0xFFFEF2F2),
                  padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 16),
                  child: const Row(
                    children: [
                      Icon(Icons.lock_clock, size: 14, color: AppTheme.dangerCrimson),
                      SizedBox(width: 6),
                      Text(
                        'Historical Muster Locked. Tapping worker prompts Correction Request.',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF991B1B),
                        ),
                      ),
                    ],
                  ),
                ),

              // Workers List
              Expanded(
                child: filteredEmployees.isEmpty
                    ? const Center(
                        child: Text(
                          'No workers found matching search criteria.',
                          style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(vertical: 8),
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
                              ScaffoldMessenger.of(context).hideCurrentSnackBar();
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    '${emp.name} marked ${status.label}',
                                  ),
                                  duration: const Duration(seconds: 1),
                                ),
                              );
                            },
                            onRequestCorrection: () {
                              showModalBottomSheet(
                                context: context,
                                isScrollControlled: true,
                                shape: const RoundedRectangleBorder(
                                  borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
                                ),
                                builder: (ctx) => RequestCorrectionSheet(
                                  employee: emp,
                                  currentRecord: record,
                                  onSubmit: (reason, requestedStatus) {
                                    widget.store.requestCorrection(
                                      employeeId: emp.id,
                                      reason: reason,
                                      requestedStatus: requestedStatus,
                                    );
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text(
                                          'Correction request queued for ${emp.name} (${requestedStatus.label})',
                                        ),
                                        backgroundColor: AppTheme.primaryBlue,
                                      ),
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
        );
      },
    );
  }
}
