import 'package:flutter/material.dart';
import '../../core/config/app_theme.dart';
import '../../core/models/employee.dart';
import '../../core/models/attendance_record.dart';
import '../common/kfab_button.dart';

class RequestCorrectionSheet extends StatefulWidget {
  final Employee employee;
  final AttendanceRecord? currentRecord;
  final void Function(String reason, AttendanceStatus requestedStatus) onSubmit;

  const RequestCorrectionSheet({
    super.key,
    required this.employee,
    this.currentRecord,
    required this.onSubmit,
  });

  @override
  State<RequestCorrectionSheet> createState() => _RequestCorrectionSheetState();
}

class _RequestCorrectionSheetState extends State<RequestCorrectionSheet> {
  AttendanceStatus _requestedStatus = AttendanceStatus.present;
  final TextEditingController _reasonController = TextEditingController();

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Bar
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Attendance Correction Request',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.slateDark,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${widget.employee.name} (${widget.employee.id})',
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppTheme.textMuted,
                    ),
                  ),
                ],
              ),
              IconButton(
                icon: const Icon(Icons.close, size: 20),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Date-lock Notice
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFFDBEAFE)),
            ),
            child: const Row(
              children: [
                Icon(Icons.shield, size: 16, color: AppTheme.primaryBlue),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Historical record is locked. Correction requires Admin review.',
                    style: TextStyle(fontSize: 11, color: Color(0xFF1E40AF)),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Requested Status Selector
          const Text(
            'Requested Status',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: AppTheme.slateDark,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: ChoiceChip(
                  label: const Center(child: Text('PRESENT')),
                  selected: _requestedStatus == AttendanceStatus.present,
                  onSelected: (val) {
                    if (val) setState(() => _requestedStatus = AttendanceStatus.present);
                  },
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ChoiceChip(
                  label: const Center(child: Text('ABSENT')),
                  selected: _requestedStatus == AttendanceStatus.absent,
                  onSelected: (val) {
                    if (val) setState(() => _requestedStatus = AttendanceStatus.absent);
                  },
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ChoiceChip(
                  label: const Center(child: Text('HALF DAY')),
                  selected: _requestedStatus == AttendanceStatus.halfDay,
                  onSelected: (val) {
                    if (val) setState(() => _requestedStatus = AttendanceStatus.halfDay);
                  },
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Justification Reason
          const Text(
            'Reason / Justification (Mandatory)',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: AppTheme.slateDark,
            ),
          ),
          const SizedBox(height: 6),
          TextField(
            controller: _reasonController,
            maxLines: 2,
            style: const TextStyle(fontSize: 13),
            decoration: InputDecoration(
              hintText: 'e.g. Worker was deployed to Bay 3 bridge girder fabrication...',
              hintStyle: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: const BorderSide(color: AppTheme.slateSubtle),
              ),
              contentPadding: const EdgeInsets.all(10),
            ),
          ),

          const SizedBox(height: 20),

          // Submit Button
          SizedBox(
            width: double.infinity,
            child: KfabButton(
              text: 'SUBMIT CORRECTION REQUEST',
              onPressed: () {
                final reason = _reasonController.text.trim();
                if (reason.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Please enter a reason for correction.')),
                  );
                  return;
                }
                widget.onSubmit(reason, _requestedStatus);
                Navigator.pop(context);
              },
            ),
          ),
        ],
      ),
    );
  }
}
