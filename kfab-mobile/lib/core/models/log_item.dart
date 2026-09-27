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
    return UserLogItem(
      id: json['id']?.toString() ?? '',
      createdBy: json['created_by']?.toString() ?? '',
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
      event: json['event']?.toString() ?? '',
      remarks: json['remarks']?.toString(),
      userName: json['user_name']?.toString() ??
          (json['profiles'] is Map ? json['profiles']['full_name']?.toString() : null),
      userRole: json['user_role']?.toString() ??
          (json['profiles'] is Map ? json['profiles']['role']?.toString() : null),
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
    return SystemLogItem(
      id: json['id']?.toString() ?? '',
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
      actorId: json['actor_id']?.toString(),
      action: json['action']?.toString() ?? 'SYSTEM_EVENT',
      module: json['module']?.toString() ?? 'GENERAL',
      resourceType: json['resource_type']?.toString(),
      resourceId: json['resource_id']?.toString(),
      description: json['description']?.toString() ?? '',
      oldValues: json['old_values'] is Map<String, dynamic>
          ? json['old_values'] as Map<String, dynamic>
          : null,
      newValues: json['new_values'] is Map<String, dynamic>
          ? json['new_values'] as Map<String, dynamic>
          : null,
      ipAddress: json['ip_address']?.toString(),
      userAgent: json['user_agent']?.toString(),
      correlationId: json['correlation_id']?.toString(),
      actorName: json['actor_name']?.toString() ??
          (json['profiles'] is Map ? json['profiles']['full_name']?.toString() : null),
      actorRole: json['actor_role']?.toString() ??
          (json['profiles'] is Map ? json['profiles']['role']?.toString() : null),
    );
  }
}
