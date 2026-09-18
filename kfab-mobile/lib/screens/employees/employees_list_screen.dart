import 'package:flutter/material.dart';
import '../../core/config/app_theme.dart';
import '../../core/models/attendance_record.dart';
import '../../core/state/mobile_store.dart';
import '../../widgets/common/search_bar_field.dart';
import '../../widgets/common/status_chip.dart';

class EmployeesListScreen extends StatefulWidget {
  final MobileStore store;

  const EmployeesListScreen({super.key, required this.store});

  @override
  State<EmployeesListScreen> createState() => _EmployeesListScreenState();
}

class _EmployeesListScreenState extends State<EmployeesListScreen> {
  String _searchQuery = '';
  final _searchController = TextEditingController();

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
        final filteredWorkers = widget.store.employees.where((emp) {
          return emp.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
              emp.id.toLowerCase().contains(_searchQuery.toLowerCase()) ||
              emp.designation.toLowerCase().contains(_searchQuery.toLowerCase()) ||
              emp.department.toLowerCase().contains(_searchQuery.toLowerCase());
        }).toList();

        return Scaffold(
          appBar: AppBar(
            title: const Text('Workforce Directory'),
          ),
          body: Column(
            children: [
              Container(
                color: Colors.white,
                padding: const EdgeInsets.all(16),
                child: SearchBarField(
                  controller: _searchController,
                  hintText: 'Search by worker name, ID, trade...',
                  onChanged: (val) => setState(() => _searchQuery = val),
                  onClear: () => setState(() => _searchQuery = ''),
                ),
              ),
              Expanded(
                child: filteredWorkers.isEmpty
                    ? const Center(
                        child: Text(
                          'No workers found matching your query.',
                          style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        itemCount: filteredWorkers.length,
                        itemBuilder: (context, index) {
                          final emp = filteredWorkers[index];
                          final attendance = widget.store.getAttendance(emp.id);

                          return Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppTheme.slateSubtle),
                            ),
                            child: Row(
                              children: [
                                CircleAvatar(
                                  radius: 22,
                                  backgroundColor: AppTheme.slateDark,
                                  child: Text(
                                    emp.name.isNotEmpty ? emp.name[0] : 'W',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Text(
                                            emp.name,
                                            style: const TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.bold,
                                              color: AppTheme.slateDark,
                                            ),
                                          ),
                                          const SizedBox(width: 6),
                                          Text(
                                            emp.id,
                                            style: const TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.w600,
                                              color: AppTheme.primaryBlue,
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        emp.designation,
                                        style: const TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w500,
                                          color: AppTheme.slateDark,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        'Dept: ${emp.department} • Sup: ${emp.supervisor}',
                                        style: const TextStyle(
                                          fontSize: 11,
                                          color: AppTheme.textMuted,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Column(
                                  children: [
                                    StatusChip(
                                      label: attendance?.status.label ?? 'NOT MARKED',
                                      tone: attendance?.status.name == 'present'
                                          ? ChipTone.success
                                          : attendance?.status.name == 'absent'
                                              ? ChipTone.danger
                                              : ChipTone.neutral,
                                    ),
                                    const SizedBox(height: 8),
                                    IconButton(
                                      icon: const Icon(Icons.phone_outlined, size: 20),
                                      color: AppTheme.primaryBlue,
                                      onPressed: () {
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(
                                            content: Text('Dialing ${emp.name}: ${emp.phone}'),
                                            duration: const Duration(seconds: 2),
                                          ),
                                        );
                                      },
                                    ),
                                  ],
                                ),
                              ],
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
}
