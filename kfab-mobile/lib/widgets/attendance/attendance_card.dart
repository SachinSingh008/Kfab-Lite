import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/config/app_theme.dart';
import '../../core/models/employee.dart';
import '../../core/models/attendance_record.dart';

class AttendanceCard extends StatelessWidget {
  final Employee employee;
  final AttendanceRecord? record;
  final bool isHistoricalDate;
  final void Function(AttendanceStatus) onStatusSelected;
  final void Function(double, String?) onOvertimeUpdated;
  final VoidCallback onRequestCorrection;

  const AttendanceCard({
    super.key,
    required this.employee,
    this.record,
    this.isHistoricalDate = false,
    required this.onStatusSelected,
    required this.onOvertimeUpdated,
    required this.onRequestCorrection,
  });

  void _showOvertimeDialog(BuildContext context) {
    double hours = record?.overtimeHours ?? 0.0;
    String remarks = record?.remarks ?? '';
    final ctrl = TextEditingController(text: hours > 0 ? hours.toString() : '');
    final remCtrl = TextEditingController(text: remarks);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          'Edit Overtime — ${employee.name}',
          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Overtime Hours (e.g. 1.5, 2.0, 4.0)',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textMuted),
            ),
            const SizedBox(height: 6),
            TextField(
              controller: ctrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: InputDecoration(
                hintText: '0.0',
                suffixText: 'hours',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              ),
              onChanged: (val) => hours = double.tryParse(val) ?? 0.0,
            ),
            const SizedBox(height: 12),
            const Text(
              'Remark (Optional)',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textMuted),
            ),
            const SizedBox(height: 6),
            TextField(
              controller: remCtrl,
              decoration: InputDecoration(
                hintText: 'e.g. Urgent fabrication shift',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              ),
              onChanged: (val) => remarks = val,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.slateDark,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () {
              Navigator.pop(ctx);
              onOvertimeUpdated(hours, remarks.trim().isEmpty ? null : remarks.trim());
            },
            child: const Text('Save Overtime'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final status = record?.status ?? AttendanceStatus.notMarked;
    final isPresent = status == AttendanceStatus.present;
    final isAbsent = status == AttendanceStatus.absent;
    final isOd = status == AttendanceStatus.od;
    final otHours = record?.overtimeHours ?? 0.0;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 5),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isPresent
              ? AppTheme.successEmerald.withValues(alpha: 0.6)
              : isAbsent
                  ? AppTheme.dangerCrimson.withValues(alpha: 0.6)
                  : isOd
                      ? const Color(0xFF7C3AED).withValues(alpha: 0.6)
                      : AppTheme.slateSubtle,
          width: isPresent || isAbsent || isOd ? 1.5 : 1.0,
        ),
        boxShadow: [
          BoxStyle.subtle(),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Name, Code & Designation
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: AppTheme.slateDark,
                child: Text(
                  employee.name.isNotEmpty ? employee.name[0] : 'W',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            employee.name,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.slateDark,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          employee.employeeCode.isNotEmpty
                              ? '(${employee.employeeCode})'
                              : '(${employee.id.substring(0, 7)})',
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
                      '${employee.designation} • ${employee.department}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppTheme.textMuted,
                      ),
                    ),
                  ],
                ),
              ),

              // Overtime Tag & Edit Action
              if (otHours > 0)
                GestureDetector(
                  onTap: isHistoricalDate ? null : () => _showOvertimeDialog(context),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFEDD5),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: const Color(0xFFFDBA74)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.access_time_filled, size: 11, color: Color(0xFFC2410C)),
                        const SizedBox(width: 3),
                        Text(
                          '${otHours}h OT',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFFC2410C),
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              else if (!isHistoricalDate)
                IconButton(
                  icon: const Icon(Icons.more_time, size: 18, color: AppTheme.textMuted),
                  tooltip: 'Add Overtime',
                  onPressed: () => _showOvertimeDialog(context),
                  constraints: const BoxConstraints(),
                  padding: EdgeInsets.zero,
                ),
            ],
          ),

          const SizedBox(height: 12),

          // Action Area: Active Toggle vs Locked State
          if (isHistoricalDate)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFFECACA)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.lock, size: 16, color: AppTheme.dangerCrimson),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'Locked at 23:59 IST (${status.label})',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF991B1B),
                      ),
                    ),
                  ),
                  TextButton(
                    onPressed: () {
                      HapticFeedback.lightImpact();
                      onRequestCorrection();
                    },
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: const Text(
                      'Request Edit',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primaryBlue,
                      ),
                    ),
                  ),
                ],
              ),
            )
          else
            Row(
              children: [
                // 1. PRESENT Button (Green)
                Expanded(
                  child: SizedBox(
                    height: 44,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isPresent
                            ? AppTheme.successEmerald
                            : const Color(0xFFF0FDF4),
                        foregroundColor:
                            isPresent ? Colors.white : const Color(0xFF166534),
                        elevation: 0,
                        side: BorderSide(
                          color: isPresent
                              ? AppTheme.successEmerald
                              : const Color(0xFFBBF7D0),
                          width: 1.5,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                      ),
                      onPressed: () {
                        HapticFeedback.lightImpact();
                        onStatusSelected(AttendanceStatus.present);
                      },
                      icon: Icon(
                        isPresent ? Icons.check_circle : Icons.check,
                        size: 16,
                      ),
                      label: const Text(
                        'PRESENT',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 6),

                // 2. ABSENT Button (Red)
                Expanded(
                  child: SizedBox(
                    height: 44,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isAbsent
                            ? AppTheme.dangerCrimson
                            : const Color(0xFFFEF2F2),
                        foregroundColor:
                            isAbsent ? Colors.white : const Color(0xFF991B1B),
                        elevation: 0,
                        side: BorderSide(
                          color: isAbsent
                              ? AppTheme.dangerCrimson
                              : const Color(0xFFFECACA),
                          width: 1.5,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                      ),
                      onPressed: () {
                        HapticFeedback.lightImpact();
                        onStatusSelected(AttendanceStatus.absent);
                      },
                      icon: Icon(
                        isAbsent ? Icons.cancel : Icons.close,
                        size: 16,
                      ),
                      label: const Text(
                        'ABSENT',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 6),

                // 3. OD (On Duty) Button (Purple / Distinct third state)
                Expanded(
                  child: SizedBox(
                    height: 44,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isOd
                            ? const Color(0xFF7C3AED)
                            : const Color(0xFFF5F3FF),
                        foregroundColor:
                            isOd ? Colors.white : const Color(0xFF6D28D9),
                        elevation: 0,
                        side: BorderSide(
                          color: isOd
                              ? const Color(0xFF7C3AED)
                              : const Color(0xFFDDD6FE),
                          width: 1.5,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                      ),
                      onPressed: () {
                        HapticFeedback.lightImpact();
                        onStatusSelected(AttendanceStatus.od);
                      },
                      icon: Icon(
                        isOd ? Icons.business_center : Icons.work_outline,
                        size: 16,
                      ),
                      label: const Text(
                        'OD',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }
}

class BoxStyle {
  static BoxShadow subtle() {
    return BoxShadow(
      color: Colors.black.withValues(alpha: 0.03),
      blurRadius: 4,
      offset: const Offset(0, 2),
    );
  }
}
