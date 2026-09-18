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
  final VoidCallback onRequestCorrection;

  const AttendanceCard({
    super.key,
    required this.employee,
    this.record,
    this.isHistoricalDate = false,
    required this.onStatusSelected,
    required this.onRequestCorrection,
  });

  @override
  Widget build(BuildContext context) {
    final status = record?.status ?? AttendanceStatus.notMarked;
    final isPresent = status == AttendanceStatus.present;
    final isAbsent = status == AttendanceStatus.absent;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 5),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isPresent
              ? AppTheme.successEmerald.withValues(alpha: 0.5)
              : isAbsent
                  ? AppTheme.dangerCrimson.withValues(alpha: 0.5)
                  : AppTheme.slateSubtle,
          width: isPresent || isAbsent ? 1.5 : 1.0,
        ),
        boxShadow: [
          BoxStyle.subtle(),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Name, Designation & Shift
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
                          '(${employee.id})',
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
              if (record?.punchTime != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    record!.punchTime!,
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF475569),
                    ),
                  ),
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
                // Present Button (Large touch target >= 48dp)
                Expanded(
                  child: SizedBox(
                    height: 48,
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
                      ),
                      onPressed: () {
                        HapticFeedback.lightImpact();
                        onStatusSelected(AttendanceStatus.present);
                      },
                      icon: Icon(
                        isPresent ? Icons.check_circle : Icons.check,
                        size: 18,
                      ),
                      label: const Text(
                        'PRESENT',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                // Absent Button (Large touch target >= 48dp)
                Expanded(
                  child: SizedBox(
                    height: 48,
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
                      ),
                      onPressed: () {
                        HapticFeedback.lightImpact();
                        onStatusSelected(AttendanceStatus.absent);
                      },
                      icon: Icon(
                        isAbsent ? Icons.cancel : Icons.close,
                        size: 18,
                      ),
                      label: const Text(
                        'ABSENT',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.5,
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
