import 'package:flutter/material.dart';
import '../../core/config/app_theme.dart';
import '../../core/models/app_notification.dart';

class NotificationTile extends StatelessWidget {
  final AppNotification notification;
  final VoidCallback onTap;

  const NotificationTile({
    super.key,
    required this.notification,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    IconData icon;
    Color iconColor;
    Color iconBg;

    switch (notification.type) {
      case NotificationType.lowStock:
        icon = Icons.warning_amber_rounded;
        iconColor = AppTheme.dangerCrimson;
        iconBg = const Color(0xFFFEF2F2);
        break;
      case NotificationType.inwardReceived:
        icon = Icons.local_shipping_outlined;
        iconColor = AppTheme.primaryBlue;
        iconBg = const Color(0xFFEFF6FF);
        break;
      case NotificationType.correctionRequest:
      case NotificationType.correctionApproved:
        icon = Icons.shield_outlined;
        iconColor = AppTheme.warningAmber;
        iconBg = const Color(0xFFFFFBEB);
        break;
      case NotificationType.systemAlert:
        icon = Icons.info_outline;
        iconColor = AppTheme.slateDark;
        iconBg = const Color(0xFFF1F5F9);
        break;
    }

    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: notification.isRead ? Colors.white : const Color(0xFFF8FAFC),
          border: Border(
            bottom: const BorderSide(color: AppTheme.slateSubtle, width: 0.8),
            left: notification.isRead
                ? BorderSide.none
                : const BorderSide(color: AppTheme.primaryBlue, width: 3.5),
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: iconBg,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, size: 20, color: iconColor),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Flexible(
                        child: Text(
                          notification.title,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: notification.isRead ? FontWeight.w600 : FontWeight.bold,
                            color: AppTheme.slateDark,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Text(
                        _formatTime(notification.timestamp),
                        style: const TextStyle(fontSize: 10, color: AppTheme.textMuted),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    notification.body,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF475569),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime time) {
    final diff = DateTime.now().difference(time);
    if (diff.inMinutes < 60) {
      return '${diff.inMinutes}m ago';
    } else if (diff.inHours < 24) {
      return '${diff.inHours}h ago';
    } else {
      return '${diff.inDays}d ago';
    }
  }
}
