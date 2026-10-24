enum AttendanceStatus {
  present,
  absent,
  od,
  notMarked,
  halfDay,
}

extension AttendanceStatusExtension on AttendanceStatus {
  String get label {
    switch (this) {
      case AttendanceStatus.present:
        return 'PRESENT';
      case AttendanceStatus.absent:
        return 'ABSENT';
      case AttendanceStatus.od:
        return 'OD';
      case AttendanceStatus.halfDay:
        return 'HALF DAY';
      case AttendanceStatus.notMarked:
        return 'NOT MARKED';
    }
  }
}

class AttendanceRecord {
  final String id;
  final String employeeId;
  final String date;
  final AttendanceStatus status;
  final double overtimeHours;
  final String? remarks;
  final String? punchTime;
  final bool isLocked;

  const AttendanceRecord({
    required this.id,
    required this.employeeId,
    required this.date,
    required this.status,
    this.overtimeHours = 0.0,
    this.remarks,
    this.punchTime,
    this.isLocked = false,
  });

  AttendanceRecord copyWith({
    String? id,
    String? employeeId,
    String? date,
    AttendanceStatus? status,
    double? overtimeHours,
    String? remarks,
    String? punchTime,
    bool? isLocked,
  }) {
    return AttendanceRecord(
      id: id ?? this.id,
      employeeId: employeeId ?? this.employeeId,
      date: date ?? this.date,
      status: status ?? this.status,
      overtimeHours: overtimeHours ?? this.overtimeHours,
      remarks: remarks ?? this.remarks,
      punchTime: punchTime ?? this.punchTime,
      isLocked: isLocked ?? this.isLocked,
    );
  }
}
