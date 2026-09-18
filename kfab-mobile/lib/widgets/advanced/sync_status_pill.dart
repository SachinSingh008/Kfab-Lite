import 'package:flutter/material.dart';
import '../../core/config/app_theme.dart';
import '../../core/state/sync_engine.dart';

class SyncStatusPill extends StatelessWidget {
  final SyncEngine syncEngine;
  final VoidCallback onTap;

  const SyncStatusPill({
    super.key,
    required this.syncEngine,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: syncEngine,
      builder: (context, _) {
        Color bgColor;
        Color fgColor;
        Widget icon;
        String text;

        if (syncEngine.networkStatus == NetworkStatus.offline) {
          bgColor = const Color(0xFFFEF3C7);
          fgColor = const Color(0xFFB45309);
          icon = const Icon(Icons.cloud_off, size: 12, color: Color(0xFFB45309));
          text = 'Offline (${syncEngine.pendingCount})';
        } else if (syncEngine.networkStatus == NetworkStatus.syncing) {
          bgColor = const Color(0xFFEFF6FF);
          fgColor = AppTheme.primaryBlue;
          icon = const SizedBox(
            width: 10,
            height: 10,
            child: CircularProgressIndicator(strokeWidth: 1.5, color: AppTheme.primaryBlue),
          );
          text = 'Syncing...';
        } else {
          bgColor = const Color(0xFFECFDF5);
          fgColor = const Color(0xFF047857);
          icon = const Icon(Icons.cloud_done, size: 12, color: Color(0xFF047857));
          text = syncEngine.pendingCount > 0 ? '${syncEngine.pendingCount} Queued' : 'Synced';
        }

        return InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: fgColor.withValues(alpha: 0.3)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                icon,
                const SizedBox(width: 5),
                Text(
                  text,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: fgColor,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
