import 'package:flutter/material.dart';
import '../../core/config/app_theme.dart';
import '../../core/state/mobile_store.dart';
import '../../core/state/sync_engine.dart';
import '../../widgets/common/kfab_button.dart';

class SyncQueueScreen extends StatelessWidget {
  final MobileStore store;
  final SyncEngine syncEngine;

  const SyncQueueScreen({
    super.key,
    required this.store,
    required this.syncEngine,
  });

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: Listenable.merge([store, syncEngine]),
      builder: (context, _) {
        final queue = store.offlineQueue;
        final isOffline = syncEngine.networkStatus == NetworkStatus.offline;
        final isSyncing = syncEngine.networkStatus == NetworkStatus.syncing;

        return Scaffold(
          appBar: AppBar(
            title: const Text('Offline Sync Manager'),
          ),
          body: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Connectivity Mode Toggle Card
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.slateSubtle),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            isOffline ? 'Network: OFFLINE (Simulated)' : 'Network: ONLINE (Connected)',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: isOffline ? AppTheme.warningAmber : AppTheme.successEmerald,
                            ),
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            'Toggle to test factory dead zone offline queuing',
                            style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
                          ),
                        ],
                      ),
                      Switch(
                        value: !isOffline,
                        activeThumbColor: AppTheme.successEmerald,
                        onChanged: (online) {
                          syncEngine.setOfflineMode(!online);
                        },
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // Sync Trigger Action
                SizedBox(
                  width: double.infinity,
                  child: KfabButton(
                    text: isSyncing
                        ? 'SYNCING QUEUE TO SERVER...'
                        : 'SYNC LOCAL QUEUE NOW (${queue.length} PENDING)',
                    isLoading: isSyncing,
                    icon: Icons.sync,
                    onPressed: isOffline || queue.isEmpty
                        ? null
                        : () async {
                            await syncEngine.syncNow();
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('All pending actions synced with server successfully.'),
                                  backgroundColor: AppTheme.successEmerald,
                                ),
                              );
                            }
                          },
                  ),
                ),

                const SizedBox(height: 20),

                // Queued Items List
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Queued Actions',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.slateDark),
                    ),
                    Text(
                      '${queue.length} Total',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textMuted),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                Expanded(
                  child: queue.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: const [
                              Icon(Icons.cloud_done_outlined, size: 44, color: AppTheme.successEmerald),
                              SizedBox(height: 8),
                              Text(
                                'Local queue is completely synced.',
                                style: TextStyle(fontSize: 13, color: AppTheme.textMuted),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          itemCount: queue.length,
                          itemBuilder: (context, index) {
                            final item = queue[index];
                            return Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: AppTheme.slateSubtle),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        item.actionType,
                                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        item.id,
                                        style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                                      ),
                                    ],
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFEFF6FF),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: const Text(
                                      'READY',
                                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.primaryBlue),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
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
