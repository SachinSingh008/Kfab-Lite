import '../state/auth_state.dart';

enum TargetScope {
  all,
  leadsAndSender,
  role,
  users,
}

class ChatGroupMemberModel {
  final String userId;
  final String name;
  final String username;
  final UserRole role;
  final bool isGroupLead;
  final bool canViewAll; // true = can see all messages; false = can only see own side + targeted

  const ChatGroupMemberModel({
    required this.userId,
    required this.name,
    required this.username,
    required this.role,
    required this.isGroupLead,
    required this.canViewAll,
  });

  ChatGroupMemberModel copyWith({
    String? userId,
    String? name,
    String? username,
    UserRole? role,
    bool? isGroupLead,
    bool? canViewAll,
  }) {
    return ChatGroupMemberModel(
      userId: userId ?? this.userId,
      name: name ?? this.name,
      username: username ?? this.username,
      role: role ?? this.role,
      isGroupLead: isGroupLead ?? this.isGroupLead,
      canViewAll: canViewAll ?? this.canViewAll,
    );
  }
}

class ChatMessageModel {
  final String id;
  final String groupId;
  final String senderId;
  final String senderName;
  final String senderUsername;
  final UserRole senderRole;
  final String text;
  final String? imageUrl;
  final String? caption;
  final String time;
  final TargetScope targetScope;
  final UserRole? targetRole;
  final List<String>? targetUserIds;
  final List<String>? targetUserNames;
  final bool isRead;

  const ChatMessageModel({
    required this.id,
    required this.groupId,
    required this.senderId,
    required this.senderName,
    required this.senderUsername,
    required this.senderRole,
    required this.text,
    this.imageUrl,
    this.caption,
    required this.time,
    this.targetScope = TargetScope.all,
    this.targetRole,
    this.targetUserIds,
    this.targetUserNames,
    this.isRead = true,
  });
}

class ChatGroupModel {
  final String id;
  final String name;
  final String description;
  final String avatar;
  final String createdBy;
  final List<ChatGroupMemberModel> members;

  const ChatGroupModel({
    required this.id,
    required this.name,
    required this.description,
    required this.avatar,
    required this.createdBy,
    required this.members,
  });
}

// Visibility scoping calculation function matching user specifications
bool canUserSeeChatMessage({
  required ChatMessageModel message,
  required String currentUserId,
  required UserRole currentRole,
  required List<ChatGroupMemberModel> members,
}) {
  // 1. Super Admin always has full visibility
  if (currentRole == UserRole.superAdmin) return true;

  // 2. Sender can always see their own message
  if (message.senderId == currentUserId ||
      message.senderRole == currentRole) {
    return true;
  }

  // 3. Find current member's permissions in group
  final member = members.firstWhere(
    (m) => m.userId == currentUserId || m.role == currentRole,
    orElse: () => ChatGroupMemberModel(
      userId: currentUserId,
      name: 'User',
      username: 'user',
      role: currentRole,
      isGroupLead: currentRole == UserRole.admin,
      canViewAll: currentRole == UserRole.admin,
    ),
  );

  final isLeadOrFullView = member.isGroupLead || member.canViewAll || currentRole == UserRole.admin;

  // 4. Group Leads & Admins can see all messages
  if (isLeadOrFullView) return true;

  // 5. If sent as LEADS_AND_SENDER, restricted peer cannot see it
  if (message.targetScope == TargetScope.leadsAndSender) {
    return false;
  }

  // 6. Broadcast to everyone
  if (message.targetScope == TargetScope.all) {
    return true;
  }

  // 7. Targeted to specific role
  if (message.targetScope == TargetScope.role) {
    return message.targetRole == currentRole;
  }

  // 8. Targeted to specific user IDs
  if (message.targetScope == TargetScope.users) {
    return message.targetUserIds != null &&
        (message.targetUserIds!.contains(currentUserId) ||
         message.targetUserIds!.contains(currentRole.name));
  }

  return false;
}
