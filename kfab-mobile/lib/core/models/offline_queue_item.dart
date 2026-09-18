enum SyncStatus {
  pending,
  syncing,
  synced,
  failed,
}

class OfflineQueueItem {
  final String id;
  final String actionType;
  final Map<String, dynamic> payload;
  final DateTime timestamp;
  final SyncStatus status;
  final String? errorMessage;

  const OfflineQueueItem({
    required this.id,
    required this.actionType,
    required this.payload,
    required this.timestamp,
    this.status = SyncStatus.pending,
    this.errorMessage,
  });

  OfflineQueueItem copyWith({
    String? id,
    String? actionType,
    Map<String, dynamic>? payload,
    DateTime? timestamp,
    SyncStatus? status,
    String? errorMessage,
  }) {
    return OfflineQueueItem(
      id: id ?? this.id,
      actionType: actionType ?? this.actionType,
      payload: payload ?? this.payload,
      timestamp: timestamp ?? this.timestamp,
      status: status ?? this.status,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}
