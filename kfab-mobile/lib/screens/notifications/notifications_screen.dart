import 'package:flutter/material.dart';
import '../../core/config/app_theme.dart';
import '../../core/models/app_notification.dart';
import '../../core/state/notification_store.dart';
import '../../widgets/advanced/notification_tile.dart';

class NotificationsScreen extends StatefulWidget {
  final NotificationStore store;

  const NotificationsScreen({super.key, required this.store});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  String _filter = 'ALL';

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: widget.store,
      builder: (context, _) {
        final notifications = widget.store.notifications.where((n) {
          if (_filter == 'STOCK') {
            return n.type == NotificationType.lowStock || n.type == NotificationType.inwardReceived;
          } else if (_filter == 'APPROVALS') {
            return n.type == NotificationType.correctionRequest ||
                n.type == NotificationType.correctionApproved;
          }
          return true;
        }).toList();

        return Scaffold(
          backgroundColor: Colors.transparent,
          appBar: AppBar(
            backgroundColor: Colors.white.withValues(alpha: 0.9),
            title: const Text('Notifications & Alerts'),
            actions: [
              if (widget.store.unreadCount > 0)
                TextButton(
                  onPressed: () => widget.store.markAllAsRead(),
                  child: const Text(
                    'Mark all read',
                    style: TextStyle(color: Color(0xFF93C5FD), fontSize: 12),
                  ),
                ),
            ],
          ),
          body: Column(
            children: [
              // Filter Chips
              Container(
                color: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                child: Row(
                  children: [
                    'ALL',
                    'STOCK',
                    'APPROVALS',
                  ].map((f) {
                    final isSelected = _filter == f;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: FilterChip(
                        label: Text(f),
                        selected: isSelected,
                        selectedColor: AppTheme.slateDark,
                        backgroundColor: const Color(0xFFF1F5F9),
                        labelStyle: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: isSelected ? Colors.white : AppTheme.slateDark,
                        ),
                        onSelected: (val) {
                          setState(() => _filter = f);
                        },
                      ),
                    );
                  }).toList(),
                ),
              ),

              const Divider(height: 1, color: AppTheme.slateSubtle),

              // Notifications Feed
              Expanded(
                child: notifications.isEmpty
                    ? const Center(
                        child: Text(
                          'No alerts in this category.',
                          style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
                        ),
                      )
                    : ListView.builder(
                        itemCount: notifications.length,
                        itemBuilder: (context, index) {
                          final item = notifications[index];
                          return NotificationTile(
                            notification: item,
                            onTap: () {
                              widget.store.markAsRead(item.id);
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(item.title),
                                  duration: const Duration(seconds: 1),
                                ),
                              );
                            },
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
