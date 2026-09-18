import 'package:flutter/foundation.dart';
import '../models/app_notification.dart';

class NotificationStore extends ChangeNotifier {
  final List<AppNotification> _notifications = [
    AppNotification(
      id: 'NOTIF-01',
      type: NotificationType.lowStock,
      title: 'Critical Low Stock: Argon Shielding Gas',
      body: 'Current stock is 4 NOS, below reorder point of 8 NOS. Reorder suggested.',
      timestamp: DateTime.now().subtract(const Duration(minutes: 25)),
      isRead: false,
      targetId: 'GAS-ARG-D',
    ),
    AppNotification(
      id: 'NOTIF-02',
      type: NotificationType.inwardReceived,
      title: 'Material Inward Gate Entry',
      body: '24.50 TON MS Plate 20mm received from Tata Steel BSL Ltd (Challan CH-402).',
      timestamp: DateTime.now().subtract(const Duration(hours: 1, minutes: 15)),
      isRead: false,
      targetId: 'STL-PL-20',
    ),
    AppNotification(
      id: 'NOTIF-03',
      type: NotificationType.correctionRequest,
      title: 'Attendance Correction Submitted',
      body: 'Supervisor requested PRESENT for Vikram Singh (KF-0104) on 17 Sep 2026.',
      timestamp: DateTime.now().subtract(const Duration(hours: 3)),
      isRead: true,
      targetId: 'KF-0104',
    ),
    AppNotification(
      id: 'NOTIF-04',
      type: NotificationType.lowStock,
      title: 'Critical Low Stock: MS Plate 12mm',
      body: 'Current stock is 3.50 TON, below reorder minimum of 5.00 TON.',
      timestamp: DateTime.now().subtract(const Duration(hours: 5)),
      isRead: true,
      targetId: 'STL-PL-12',
    ),
  ];

  List<AppNotification> get notifications => List.unmodifiable(_notifications);

  int get unreadCount => _notifications.where((n) => !n.isRead).length;

  void markAsRead(String id) {
    final index = _notifications.indexWhere((n) => n.id == id);
    if (index != -1) {
      _notifications[index] = _notifications[index].copyWith(isRead: true);
      notifyListeners();
    }
  }

  void markAllAsRead() {
    for (int i = 0; i < _notifications.length; i++) {
      _notifications[i] = _notifications[i].copyWith(isRead: true);
    }
    notifyListeners();
  }
}
