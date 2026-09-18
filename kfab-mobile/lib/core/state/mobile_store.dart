import 'package:flutter/foundation.dart';
import '../models/employee.dart';
import '../models/attendance_record.dart';
import '../models/stock_item.dart';
import '../models/offline_queue_item.dart';

class MobileStore extends ChangeNotifier {
  final String activeDate = '18 Sep 2026';
  bool isHistoricalDate = false;

  final List<Employee> _employees = [
    const Employee(
      id: 'KF-0101',
      name: 'Ramesh Sharma',
      designation: 'Welder Grade 1',
      department: 'Fabrication',
      supervisor: 'Ajay Verma',
      phone: '+91 98234 11001',
    ),
    const Employee(
      id: 'KF-0102',
      name: 'Sunil Kumar',
      designation: 'Fitter Senior',
      department: 'Assembly Bay',
      supervisor: 'Ajay Verma',
      phone: '+91 98234 11002',
    ),
    const Employee(
      id: 'KF-0103',
      name: 'Mahesh Yadav',
      designation: 'CNC Operator',
      department: 'Machine Shop',
      supervisor: 'Prakash Patel',
      phone: '+91 98234 11003',
    ),
    const Employee(
      id: 'KF-0104',
      name: 'Vikram Singh',
      designation: 'Welder Grade 2',
      department: 'Fabrication',
      supervisor: 'Ajay Verma',
      phone: '+91 98234 11004',
    ),
    const Employee(
      id: 'KF-0105',
      name: 'Deepak Rawat',
      designation: 'Grinder & Helper',
      department: 'Finishing Bay',
      supervisor: 'Prakash Patel',
      phone: '+91 98234 11005',
    ),
    const Employee(
      id: 'KF-0106',
      name: 'Amit Tiwari',
      designation: 'Rigger',
      department: 'Yard & Logistics',
      supervisor: 'Ajay Verma',
      phone: '+91 98234 11006',
    ),
    const Employee(
      id: 'KF-0107',
      name: 'Santosh Naik',
      designation: 'Gas Cutter',
      department: 'Fabrication',
      supervisor: 'Ajay Verma',
      phone: '+91 98234 11007',
    ),
  ];

  final Map<String, AttendanceRecord> _todayAttendance = {
    'KF-0101': const AttendanceRecord(
      id: 'ATT-101',
      employeeId: 'KF-0101',
      date: '18 Sep 2026',
      status: AttendanceStatus.present,
      punchTime: '08:04 AM',
    ),
    'KF-0102': const AttendanceRecord(
      id: 'ATT-102',
      employeeId: 'KF-0102',
      date: '18 Sep 2026',
      status: AttendanceStatus.present,
      punchTime: '08:12 AM',
    ),
    'KF-0103': const AttendanceRecord(
      id: 'ATT-103',
      employeeId: 'KF-0103',
      date: '18 Sep 2026',
      status: AttendanceStatus.present,
      punchTime: '07:55 AM',
    ),
    'KF-0104': const AttendanceRecord(
      id: 'ATT-104',
      employeeId: 'KF-0104',
      date: '18 Sep 2026',
      status: AttendanceStatus.absent,
    ),
    'KF-0105': const AttendanceRecord(
      id: 'ATT-105',
      employeeId: 'KF-0105',
      date: '18 Sep 2026',
      status: AttendanceStatus.present,
      punchTime: '08:00 AM',
    ),
    'KF-0106': const AttendanceRecord(
      id: 'ATT-106',
      employeeId: 'KF-0106',
      date: '18 Sep 2026',
      status: AttendanceStatus.notMarked,
    ),
    'KF-0107': const AttendanceRecord(
      id: 'ATT-107',
      employeeId: 'KF-0107',
      date: '18 Sep 2026',
      status: AttendanceStatus.notMarked,
    ),
  };

  final List<StockItem> _stockItems = [
    const StockItem(
      code: 'STL-PL-12',
      name: 'MS Plate 12mm IS 2062',
      category: 'Raw Steel',
      spec: 'E250 Gr A, 2500x12000',
      unit: 'TON',
      currentStock: 3.50,
      minStock: 5.00,
    ),
    const StockItem(
      code: 'STL-PL-20',
      name: 'MS Plate 20mm IS 2062',
      category: 'Raw Steel',
      spec: 'E250 Gr BR, 2500x6000',
      unit: 'TON',
      currentStock: 29.50,
      minStock: 10.00,
    ),
    const StockItem(
      code: 'STL-BEAM-250',
      name: 'ISMB 250 Heavy Beam',
      category: 'Structural',
      spec: 'Standard 12m length',
      unit: 'TON',
      currentStock: 10.50,
      minStock: 8.00,
    ),
    const StockItem(
      code: 'GAS-ARG-D',
      name: 'Argon Shielding Gas Cyl',
      category: 'Gases',
      spec: 'High Purity 7m3 D-Type',
      unit: 'NOS',
      currentStock: 4.0,
      minStock: 8.0,
    ),
    const StockItem(
      code: 'WLD-E7018',
      name: 'Low Hydrogen Electrode 7018',
      category: 'Consumables',
      spec: '4.00mm x 450mm',
      unit: 'BOX',
      currentStock: 56.0,
      minStock: 25.0,
    ),
    const StockItem(
      code: 'BLT-M20-75',
      name: 'HT Structural Bolts M20x75',
      category: 'Hardware',
      spec: 'Grade 8.8 with Nut & Washer',
      unit: 'NOS',
      currentStock: 550.0,
      minStock: 200.0,
    ),
  ];

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
      date: isHistoricalDate ? '17 Sep 2026' : activeDate,
      status: status,
      punchTime: status == AttendanceStatus.present ? '08:30 AM' : null,
      isLocked: isHistoricalDate,
    );

    // Add to offline queue
    _offlineQueue.add(
      OfflineQueueItem(
        id: 'QUEUE-${DateTime.now().millisecondsSinceEpoch}',
        actionType: 'MARK_ATTENDANCE',
        payload: {'employeeId': employeeId, 'status': status.name},
        timestamp: DateTime.now(),
      ),
    );

    notifyListeners();
  }

  void markAllRemainingPresent() {
    for (final emp in _employees) {
      final current = _todayAttendance[emp.id];
      if (current == null || current.status == AttendanceStatus.notMarked) {
        _todayAttendance[emp.id] = AttendanceRecord(
          id: current?.id ?? 'ATT-${DateTime.now().millisecondsSinceEpoch}',
          employeeId: emp.id,
          date: activeDate,
          status: AttendanceStatus.present,
          punchTime: '08:30 AM',
        );
      }
    }
    notifyListeners();
  }

  bool logUsage({
    required String materialCode,
    required double quantity,
    required String workBay,
  }) {
    final index = _stockItems.indexWhere((s) => s.code == materialCode);
    if (index == -1) return false;

    final current = _stockItems[index];
    if (current.currentStock < quantity) {
      return false; // Insufficient stock
    }

    _stockItems[index] = current.copyWith(
      currentStock: current.currentStock - quantity,
    );

    _offlineQueue.add(
      OfflineQueueItem(
        id: 'QUEUE-${DateTime.now().millisecondsSinceEpoch}',
        actionType: 'LOG_USAGE',
        payload: {
          'materialCode': materialCode,
          'quantity': quantity,
          'workBay': workBay,
        },
        timestamp: DateTime.now(),
      ),
    );

    notifyListeners();
    return true;
  }

  void requestCorrection({
    required String employeeId,
    required String reason,
    required AttendanceStatus requestedStatus,
  }) {
    _offlineQueue.add(
      OfflineQueueItem(
        id: 'QUEUE-${DateTime.now().millisecondsSinceEpoch}',
        actionType: 'REQUEST_CORRECTION',
        payload: {
          'employeeId': employeeId,
          'reason': reason,
          'requestedStatus': requestedStatus.name,
          'targetDate': '17 Sep 2026',
        },
        timestamp: DateTime.now(),
      ),
    );
    notifyListeners();
  }
}
