class UserLogItem {
  final String id;
  final String createdBy;
  final DateTime createdAt;
  final String event;
  final String? remarks;
  final String? userName;
  final String? userRole;

  UserLogItem({
    required this.id,
    required this.createdBy,
    required this.createdAt,
    required this.event,
    this.remarks,
    this.userName,
    this.userRole,
  });

  factory UserLogItem.fromJson(Map<String, dynamic> json) {
    final details = json['details'] is Map<String, dynamic>
        ? json['details'] as Map<String, dynamic>
        : (json['details'] is Map ? Map<String, dynamic>.from(json['details'] as Map) : null);

    final event = json['event']?.toString() ??
        details?['event']?.toString() ??
        details?['description']?.toString() ??
        json['action']?.toString() ??
        'Activity';

    final remarks = json['remarks']?.toString() ??
        details?['remarks']?.toString() ??
        (json['action'] != null && json['action'] != 'USER_LOG'
            ? 'Action: ${json['action']}'
            : null);

    final userName = json['user_name']?.toString() ??
        details?['user_name']?.toString() ??
        (json['profiles'] is Map ? json['profiles']['full_name']?.toString() : null);

    final userRole = json['user_role']?.toString() ??
        details?['user_role']?.toString() ??
        (json['profiles'] is Map ? json['profiles']['role']?.toString() : null);

    final createdBy = json['created_by']?.toString() ??
        json['actor_id']?.toString() ??
        details?['created_by']?.toString() ??
        '';

    return UserLogItem(
      id: json['id']?.toString() ?? '',
      createdBy: createdBy,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
      event: event,
      remarks: remarks,
      userName: userName,
      userRole: userRole,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'created_by': createdBy,
    'created_at': createdAt.toIso8601String(),
    'event': event,
    'remarks': remarks,
  };
}

class SystemLogItem {
  final String id;
  final DateTime createdAt;
  final String? actorId;
  final String action;
  final String module;
  final String? resourceType;
  final String? resourceId;
  final String description;
  final Map<String, dynamic>? oldValues;
  final Map<String, dynamic>? newValues;
  final String? ipAddress;
  final String? userAgent;
  final String? correlationId;
  final String? actorName;
  final String? actorRole;

  SystemLogItem({
    required this.id,
    required this.createdAt,
    this.actorId,
    required this.action,
    required this.module,
    this.resourceType,
    this.resourceId,
    required this.description,
    this.oldValues,
    this.newValues,
    this.ipAddress,
    this.userAgent,
    this.correlationId,
    this.actorName,
    this.actorRole,
  });

  factory SystemLogItem.fromJson(Map<String, dynamic> json) {
    final details = json['details'] is Map<String, dynamic>
        ? json['details'] as Map<String, dynamic>
        : (json['details'] is Map ? Map<String, dynamic>.from(json['details'] as Map) : null);

    final description = json['description']?.toString() ??
        details?['description']?.toString() ??
        details?['event']?.toString() ??
        json['action']?.toString() ??
        '';

    final module = json['module']?.toString() ??
        details?['module']?.toString() ??
        'SYSTEM';

    final oldValues = json['old_values'] is Map<String, dynamic>
        ? json['old_values'] as Map<String, dynamic>
        : (details?['old_values'] is Map<String, dynamic>
            ? details!['old_values'] as Map<String, dynamic>
            : null);

    final newValues = json['new_values'] is Map<String, dynamic>
        ? json['new_values'] as Map<String, dynamic>
        : (details?['new_values'] is Map<String, dynamic>
            ? details!['new_values'] as Map<String, dynamic>
            : null);

    final actorName = json['actor_name']?.toString() ??
        details?['user_name']?.toString() ??
        (json['profiles'] is Map ? json['profiles']['full_name']?.toString() : null);

    final actorRole = json['actor_role']?.toString() ??
        details?['user_role']?.toString() ??
        (json['profiles'] is Map ? json['profiles']['role']?.toString() : null);

    return SystemLogItem(
      id: json['id']?.toString() ?? '',
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
      actorId: json['actor_id']?.toString() ?? details?['created_by']?.toString(),
      action: json['action']?.toString() ?? 'SYSTEM_EVENT',
      module: module,
      resourceType: json['resource_type']?.toString() ?? details?['resource_type']?.toString(),
      resourceId: json['resource_id']?.toString() ?? details?['resource_id']?.toString(),
      description: description,
      oldValues: oldValues,
      newValues: newValues,
      ipAddress: json['ip_address']?.toString(),
      userAgent: json['user_agent']?.toString(),
      correlationId: json['correlation_id']?.toString(),
      actorName: actorName,
      actorRole: actorRole,
    );
  }
}
