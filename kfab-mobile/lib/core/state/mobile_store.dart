import 'package:flutter/foundation.dart';
import '../models/employee.dart';
import '../models/attendance_record.dart';
import '../models/stock_item.dart';
import '../models/offline_queue_item.dart';
import '../config/supabase_config.dart';

class MobileStore extends ChangeNotifier {
  String activeDate = DateTime.now().toIso8601String().split('T')[0];
  bool isHistoricalDate = false;

  // Initial authoritative workforce roster (with offline resiliency)
  static const List<Employee> authoritativeEmployees = [
    Employee(id: 'e0000000-0000-0000-0000-000000000001', employeeCode: 'EMP-001', name: 'Rajesh Kumar', department: 'Welding', designation: 'Sr. TIG Welder', supervisor: 'Ajay Verma', shift: 'Day Shift (08:00)', phone: '+91-9822011001'),
    Employee(id: 'e0000000-0000-0000-0000-000000000002', employeeCode: 'EMP-002', name: 'Amit Sharma', department: 'Fabrication', designation: 'Fitter Foreman', supervisor: 'Ajay Verma', shift: 'Day Shift (08:00)', phone: '+91-9822011002'),
    Employee(id: 'e0000000-0000-0000-0000-000000000003', employeeCode: 'EMP-003', name: 'Suresh Patil', department: 'Quality', designation: 'NDT Level II Inspector', supervisor: 'Ajay Verma', shift: 'Day Shift (08:00)', phone: '+91-9822011003'),
    Employee(id: 'e0000000-0000-0000-0000-000000000004', employeeCode: 'EMP-004', name: 'Ramesh Pawar', department: 'Machining', designation: 'CNC Operator', supervisor: 'Ajay Verma', shift: 'General (08:00)', phone: '+91-9822011004'),
    Employee(id: 'e0000000-0000-0000-0000-000000000005', employeeCode: 'EMP-005', name: 'Dinesh Yadav', department: 'Assembly', designation: 'Sr. Fitter', supervisor: 'Ajay Verma', shift: 'Day Shift (08:00)', phone: '+91-9822011005'),
    Employee(id: 'e0000000-0000-0000-0000-000000000006', employeeCode: 'EMP-006', name: 'Vikas Jagtap', department: 'Welding', designation: 'SAW Welder', supervisor: 'Ajay Verma', shift: 'Day Shift (08:00)', phone: '+91-9822011006'),
    Employee(id: 'e0000000-0000-0000-0000-000000000007', employeeCode: 'EMP-007', name: 'Mahesh Jadhav', department: 'Maintenance', designation: 'Crane Technician', supervisor: 'Ajay Verma', shift: 'General (08:00)', phone: '+91-9822011007'),
    Employee(id: 'e0000000-0000-0000-0000-000000000008', employeeCode: 'EMP-008', name: 'Ganesh More', department: 'Stores', designation: 'Material Incharge', supervisor: 'Ajay Verma', shift: 'General (08:00)', phone: '+91-9822011008'),
    Employee(id: 'e0000000-0000-0000-0000-000000000009', employeeCode: 'EMP-009', name: 'Sachin Shinde', department: 'Safety', designation: 'Plant Safety Officer', supervisor: 'Ajay Verma', shift: 'General (08:00)', phone: '+91-9822011009'),
    Employee(id: 'e0000000-0000-0000-0000-000000000010', employeeCode: 'EMP-010', name: 'Sunil Bhosale', department: 'Painting', designation: 'Blasting Lead', supervisor: 'Ajay Verma', shift: 'Day Shift (08:00)', phone: '+91-9822011010'),
    Employee(id: 'e0000000-0000-0000-0000-000000000011', employeeCode: 'EMP-011', name: 'Pravin Deshmukh', department: 'Machining', designation: 'Radial Drill Operator', supervisor: 'Ajay Verma', shift: 'General (08:00)', phone: '+91-9822011011'),
    Employee(id: 'e0000000-0000-0000-0000-000000000012', employeeCode: 'EMP-012', name: 'Anil Kadam', department: 'Fabrication', designation: 'Tack Welder', supervisor: 'Ajay Verma', shift: 'Day Shift (08:00)', phone: '+91-9822011012'),
  ];

  // Authoritative steel plant stock materials
  static const List<StockItem> sampleStockItems = [
    StockItem(
      code: 'MAT-PL-16',
      name: 'MS Plate 16mm IS 2062 Gr.B',
      category: 'Raw Steel Plates',
      spec: '16mm x 2500 x 6000 mm',
      unit: 'TON',
      currentStock: 18.5,
      minStock: 10.0,
    ),
    StockItem(
      code: 'MAT-PL-25',
      name: 'MS Plate 25mm IS 2062 Gr.B',
      category: 'Raw Steel Plates',
      spec: '25mm x 2000 x 6300 mm',
      unit: 'TON',
      currentStock: 8.2,
      minStock: 12.0,
    ),
    StockItem(
      code: 'MAT-PL-32',
      name: 'Heavy Flange Plate 32mm IS 2062',
      category: 'Raw Steel Plates',
      spec: '32mm x 2500 x 8000 mm',
      unit: 'TON',
      currentStock: 14.3,
      minStock: 8.0,
    ),
    StockItem(
      code: 'MAT-BM-400',
      name: 'ISMB 400 Heavy Steel Joist',
      category: 'Structural Beams',
      spec: '400 x 140 mm @ 61.6 kg/m',
      unit: 'MTR',
      currentStock: 145.0,
      minStock: 80.0,
    ),
    StockItem(
      code: 'MAT-CH-250',
      name: 'ISMC 250 Structural Channel',
      category: 'Structural Channels',
      spec: '250 x 82 mm @ 30.4 kg/m',
      unit: 'MTR',
      currentStock: 32.0,
      minStock: 50.0,
    ),
    StockItem(
      code: 'MAT-EL-7018',
      name: 'E7018 Low Hydrogen Welding Rods',
      category: 'Welding Consumables',
      spec: '3.15mm x 450mm Vacuum Pack',
      unit: 'BOX',
      currentStock: 65.0,
      minStock: 25.0,
    ),
    StockItem(
      code: 'MAT-MIG-70S',
      name: 'ER70S-6 CO2 MIG Wire Spool',
      category: 'Welding Consumables',
      spec: '1.2mm Dia, 15 kg Spool',
      unit: 'NOS',
      currentStock: 14.0,
      minStock: 20.0,
    ),
    StockItem(
      code: 'MAT-GD-4IN',
      name: 'Grinding Wheels 4-inch x 6mm',
      category: 'Shop Consumables',
      spec: '100 x 6 x 16mm Bosch A24R',
      unit: 'NOS',
      currentStock: 180.0,
      minStock: 50.0,
    ),
    StockItem(
      code: 'MAT-PP-150NB',
      name: 'Seamless Steel Pipe 150NB Sch 40',
      category: 'Process Piping',
      spec: 'OD 168.3 x 7.11mm ASTM A106-B',
      unit: 'MTR',
      currentStock: 60.0,
      minStock: 40.0,
    ),
  ];

  final List<Employee> _employees = [];
  final Map<String, AttendanceRecord> _todayAttendance = {};
  final List<StockItem> _stockItems = [];
  final List<OfflineQueueItem> _offlineQueue = [];
  bool _isSampleDataActive = true;

  bool get isSampleDataActive => _isSampleDataActive;

  MobileStore() {
    loadSampleData();
  }

  /// Easily removable: Load full realistic plant demonstration records
  void loadSampleData() {
    _isSampleDataActive = true;
    _stockItems.clear();
    _stockItems.addAll(sampleStockItems);

    _employees.clear();
    _employees.addAll(authoritativeEmployees);

    _todayAttendance.clear();
    for (int i = 0; i < _employees.length; i++) {
      final emp = _employees[i];
      final status = i % 8 == 0
          ? AttendanceStatus.absent
          : i % 5 == 0
              ? AttendanceStatus.od
              : AttendanceStatus.present;
      final ot = i % 2 == 0 ? 2.0 : 0.0;
      final remarks = status == AttendanceStatus.od ? 'Site visit Jejuri' : null;

      _todayAttendance[emp.id] = AttendanceRecord(
        id: 'att-${emp.id}-$activeDate',
        employeeId: emp.id,
        date: activeDate,
        status: status,
        overtimeHours: ot,
        remarks: remarks,
        punchTime: status == AttendanceStatus.present ? '08:15 AM' : null,
      );
    }
    notifyListeners();
  }

  /// Easily removable: 1-click clean slate removal of all sample demo data
  void removeSampleData() {
    _isSampleDataActive = false;
    _stockItems.clear();
    _employees.clear();
    _todayAttendance.clear();
    notifyListeners();
  }

  void toggleSampleData(bool enabled) {
    if (enabled) {
      loadSampleData();
    } else {
      removeSampleData();
    }
  }

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

  int get odCount => _todayAttendance.values
      .where((r) => r.status == AttendanceStatus.od)
      .length;

  int get unmarkedCount => _employees.length - _todayAttendance.length;

  double get totalOvertimeHours => _todayAttendance.values
      .fold(0.0, (acc, curr) => acc + curr.overtimeHours);

  int get lowStockItemsCount => _stockItems.where((s) => s.isLow).length;

  void toggleHistoricalDateMode(bool historical) {
    isHistoricalDate = historical;
    notifyListeners();
  }

  void setActiveDate(String date) {
    activeDate = date;
    notifyListeners();
  }

  void markAttendance(
    String employeeId,
    AttendanceStatus status, {
    double overtimeHours = 0.0,
    String? remarks,
  }) {
    final existing = _todayAttendance[employeeId];
    _todayAttendance[employeeId] = AttendanceRecord(
      id: existing?.id ?? 'ATT-${DateTime.now().millisecondsSinceEpoch}',
      employeeId: employeeId,
      date: activeDate,
      status: status,
      overtimeHours: overtimeHours > 0 ? overtimeHours : (existing?.overtimeHours ?? 0.0),
      remarks: remarks ?? existing?.remarks,
      punchTime: status == AttendanceStatus.present ? '08:15 AM' : null,
      isLocked: isHistoricalDate,
    );

    _offlineQueue.add(
      OfflineQueueItem(
        id: 'QUEUE-${DateTime.now().millisecondsSinceEpoch}',
        actionType: 'ATTENDANCE_UPSERT',
        payload: {
          'table': 'attendance_records',
          'employee_id': employeeId,
          'status': status.name.toUpperCase(),
          'overtime_hours': overtimeHours,
          'remarks': remarks,
          'date': activeDate,
        },
        timestamp: DateTime.now(),
      ),
    );

    // Write to Supabase if connected
    _syncAttendanceToSupabase(employeeId, status, overtimeHours, remarks);

    notifyListeners();
  }

  void updateOvertime(String employeeId, double hours, String? remarks) {
    final existing = _todayAttendance[employeeId];
    if (existing != null) {
      _todayAttendance[employeeId] = existing.copyWith(
        overtimeHours: hours,
        remarks: remarks,
      );
      _syncAttendanceToSupabase(employeeId, existing.status, hours, remarks);
      notifyListeners();
    }
  }

  void markAllRemainingPresent() {
    for (final emp in _employees) {
      final existing = _todayAttendance[emp.id];
      if (existing == null || existing.status != AttendanceStatus.present) {
        markAttendance(emp.id, AttendanceStatus.present);
      }
    }
    notifyListeners();
  }

  void markAllAbsent() {
    for (final emp in _employees) {
      markAttendance(emp.id, AttendanceStatus.absent);
    }
    notifyListeners();
  }

  void clearTodayAttendance() {
    _todayAttendance.clear();
    notifyListeners();
  }

  Future<void> _syncAttendanceToSupabase(
    String employeeId,
    AttendanceStatus status,
    double overtimeHours,
    String? remarks,
  ) async {
    try {
      final client = SupabaseConfig.client;
      if (client != null) {
        final statusStr = status == AttendanceStatus.od ? 'OD' : status.name.toUpperCase();
        await client.from('attendance_records').upsert({
          'company_id': 'c0000000-0000-0000-0000-000000000001',
          'employee_id': employeeId,
          'attendance_date': activeDate,
          'status': statusStr,
          'overtime_hours': overtimeHours,
          'remarks': remarks,
        }, onConflict: 'employee_id,attendance_date');
      }
    } catch (e) {
      debugPrint('[Supabase Attendance Sync] Stored offline: $e');
    }
  }

  Future<void> loadAttendanceFromSupabase() async {
    try {
      final client = SupabaseConfig.client;
      if (client == null) return;

      // 1. Fetch live employees
      final empRes = await client.from('employees').select('*').order('employee_code');
      if (empRes.isNotEmpty) {
        _employees.clear();
        for (final item in empRes) {
          _employees.add(Employee.fromJson(item));
        }
      }

      // 2. Fetch live attendance for activeDate
      final attRes = await client
          .from('attendance_records')
          .select('*')
          .eq('attendance_date', activeDate);

      if (attRes.isNotEmpty) {
        _todayAttendance.clear();
        for (final item in attRes) {
          final empId = item['employee_id']?.toString() ?? '';
          final stRaw = item['status']?.toString().toUpperCase() ?? 'PRESENT';
          AttendanceStatus st = AttendanceStatus.present;
          if (stRaw == 'ABSENT') {
            st = AttendanceStatus.absent;
          } else if (stRaw == 'OD') {
            st = AttendanceStatus.od;
          }

          final ot = (item['overtime_hours'] as num?)?.toDouble() ?? 0.0;
          final rem = item['remarks']?.toString();

          _todayAttendance[empId] = AttendanceRecord(
            id: item['id']?.toString() ?? '',
            employeeId: empId,
            date: activeDate,
            status: st,
            overtimeHours: ot,
            remarks: rem,
            punchTime: st == AttendanceStatus.present ? '08:15 AM' : null,
          );
        }
      }
      notifyListeners();
    } catch (e) {
      debugPrint('[Supabase Load Attendance] Offline fallback: $e');
    }
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
          'table': 'inventory_transactions',
          'material_code': materialCode,
          'type': 'ISSUE',
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
          'table': 'attendance_records',
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
