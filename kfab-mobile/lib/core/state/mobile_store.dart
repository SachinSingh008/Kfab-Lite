import 'package:flutter/foundation.dart';
import '../models/employee.dart';
import '../models/attendance_record.dart';
import '../models/stock_item.dart';
import '../models/offline_queue_item.dart';

class MobileStore extends ChangeNotifier {
  final String activeDate = 'Today';
  bool isHistoricalDate = false;

  // Clean Slate: Zero fake mock data
  final List<Employee> _employees = [];
  final Map<String, AttendanceRecord> _todayAttendance = {};
  final List<StockItem> _stockItems = [];
  final List<OfflineQueueItem> _offlineQueue = [];

  // Getters
  List<Employee> get employees => List.unmodifiable(_employees);
  List<StockItem> get stockItems => List.unmodifiable(_stockItems);
  List<OfflineQueueItem> get offlineQueue => List.unmodifiable(_offlineQueue);

  AttendanceRecord? getAttendance(String employeeId) => _todayAttendance[employeeId];

  int get totalWorkersCount => _employees.length;

  int get presentCount => _todayAttendance.values
      .where((r) => r.status == AttendanceStatus.present)
      .length;

  int get absentCount => _todayAttendance.values
      .where((r) => r.status == AttendanceStatus.absent)
      .length;

  int get unmarkedCount => _todayAttendance.values
      .where((r) => r.status == AttendanceStatus.notMarked)
      .length;

  int get lowStockItemsCount => _stockItems.where((s) => s.isLow).length;

  void toggleHistoricalDateMode(bool historical) {
    isHistoricalDate = historical;
    notifyListeners();
  }

  void markAttendance(String employeeId, AttendanceStatus status) {
    final existing = _todayAttendance[employeeId];
    _todayAttendance[employeeId] = AttendanceRecord(
      id: existing?.id ?? 'ATT-${DateTime.now().millisecondsSinceEpoch}',
      employeeId: employeeId,
      date: activeDate,
      status: status,
      punchTime: status == AttendanceStatus.present ? '08:30 AM' : null,
      isLocked: isHistoricalDate,
    );

    _offlineQueue.add(
      OfflineQueueItem(
        id: 'QUEUE-${DateTime.now().millisecondsSinceEpoch}',
        actionType: 'ATTENDANCE_UPSERT',
        payload: {
          'table': 'daily_muster_attendance',
          'employee_id': employeeId,
          'status': status.name.toUpperCase(),
          'date': activeDate,
        },
        timestamp: DateTime.now(),
      ),
    );

    notifyListeners();
  }

  void markAllRemainingPresent() {
    for (final emp in _employees) {
      if (!_todayAttendance.containsKey(emp.id) ||
          _todayAttendance[emp.id]?.status == AttendanceStatus.notMarked) {
        markAttendance(emp.id, AttendanceStatus.present);
      }
    }
    notifyListeners();
  }

  bool logUsage({
    required String materialCode,
    required double quantity,
    required String workBay,
    String? remarks,
  }) {
    final idx = _stockItems.indexWhere((s) => s.code == materialCode);
    if (idx != -1) {
      final current = _stockItems[idx];
      final updatedQty = (current.currentStock - quantity).clamp(0.0, 99999.0);
      _stockItems[idx] = current.copyWith(currentStock: updatedQty);
    }

    _offlineQueue.add(
      OfflineQueueItem(
        id: 'QUEUE-${DateTime.now().millisecondsSinceEpoch}',
        actionType: 'STOCK_USAGE',
        payload: {
          'table': 'stock_ledger_entries',
          'material_code': materialCode,
          'type': 'USAGE',
          'quantity': quantity,
          'bay': workBay,
          'remarks': remarks,
          'timestamp': DateTime.now().toIso8601String(),
        },
        timestamp: DateTime.now(),
      ),
    );

    notifyListeners();
    return true;
  }

  void recordMaterialUsage({
    required String materialCode,
    required double quantity,
    required String bay,
    String? remarks,
  }) {
    logUsage(
      materialCode: materialCode,
      quantity: quantity,
      workBay: bay,
      remarks: remarks,
    );
  }

  void requestCorrection({
    required String employeeId,
    required String reason,
    required AttendanceStatus requestedStatus,
  }) {
    _offlineQueue.add(
      OfflineQueueItem(
        id: 'QUEUE-${DateTime.now().millisecondsSinceEpoch}',
        actionType: 'CORRECTION_REQUEST',
        payload: {
          'table': 'daily_muster_attendance',
          'employee_id': employeeId,
          'requested_status': requestedStatus.name.toUpperCase(),
          'reason': reason,
        },
        timestamp: DateTime.now(),
      ),
    );
    notifyListeners();
  }

  void clearOfflineQueue() {
    _offlineQueue.clear();
    notifyListeners();
  }
}
