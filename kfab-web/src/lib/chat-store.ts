// ============================================================================
// KFAB BASIC / KFAB360 — WhatsApp-Style Team Chat & Granular Visibility Store
// ============================================================================

import { AppRole, AppUser, getStoredUsers } from "./auth-store";

export type TargetScope = "ALL" | "LEADS_AND_SENDER" | "ROLE" | "USERS";

export interface ChatMember {
  userId: string;
  name: string;
  username: string;
  role: AppRole;
  isGroupLead: boolean;
  canViewAll: boolean; // true = can see all messages; false = can only see own side + targeted
  joinedAt: string;
}

export interface ChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderRole: AppRole;
  text: string;
  imageUrl?: string;
  caption?: string;
  timestamp: string; // ISO string
  timeString: string; // e.g. "10:35 AM"
  targetScope: TargetScope;
  targetRole?: AppRole;
  targetUserIds?: string[];
  targetUserNames?: string[];
  status: "SENT" | "DELIVERED" | "READ";
}

export interface ChatGroup {
  id: string;
  name: string;
  description: string;
  avatar: string;
  createdBy: string;
  createdAt: string;
  members: ChatMember[];
}

const STORAGE_GROUPS_KEY = "kfab_chat_groups_v6";
const STORAGE_MESSAGES_KEY = "kfab_chat_messages_v6";

// Sample fabrication & commercial images (base64 SVG data URLs for instant offline display)
export const SAMPLE_CHAT_IMAGES = {
  weldInspection:
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
  steelChallan:
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80",
  craneLift:
    "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=800&q=80",
};

// Clean slate: no pre-seeded chat groups
export const INITIAL_CHAT_GROUPS: ChatGroup[] = [];

// Clean slate: no pre-seeded chat messages
export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [];

// ============================================================================
// Core Visibility Scoping Matrix Function
// ============================================================================
export function canUserSeeMessage(
  message: ChatMessage,
  currentUserId: string,
  currentUserRole: AppRole,
  groupMembers: ChatMember[]
): boolean {
  // 1. Super Admins always have omniscient visibility
  if (currentUserRole === "SUPER_ADMIN") return true;

  // 2. The sender can always see their own message
  if (message.senderId === currentUserId) return true;

  // 3. Find current user's membership configuration in this group
  const currentMember = groupMembers.find((m) => m.userId === currentUserId);
  const isLeadOrFullView =
    currentMember?.isGroupLead || currentMember?.canViewAll || currentUserRole === "ADMIN";

  // 4. Group Leads & Admins ("Can View All") can see all messages in the group
  if (isLeadOrFullView) return true;

  // 5. If message was sent with LEADS_AND_SENDER:
  // Restricted peer (e.g. Supervisor vs Accountant) CANNOT see it.
  if (message.targetScope === "LEADS_AND_SENDER") {
    return false;
  }

  // 6. Broadcast to everyone in group
  if (message.targetScope === "ALL") {
    return true;
  }

  // 7. Targeted to specific role (e.g. all supervisors or all accountants)
  if (message.targetScope === "ROLE") {
    return message.targetRole === currentUserRole;
  }

  // 8. Targeted to specific user IDs
  if (message.targetScope === "USERS") {
    return Boolean(message.targetUserIds?.includes(currentUserId));
  }

  return false;
}

// ============================================================================
// LocalStorage Persistence Helpers
// ============================================================================
export function getStoredChatGroups(): ChatGroup[] {
  if (typeof window === "undefined") return INITIAL_CHAT_GROUPS;
  try {
    const raw = localStorage.getItem(STORAGE_GROUPS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_GROUPS_KEY, JSON.stringify(INITIAL_CHAT_GROUPS));
      return INITIAL_CHAT_GROUPS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CHAT_GROUPS;
  } catch {
    return INITIAL_CHAT_GROUPS;
  }
}

export function saveStoredChatGroups(groups: ChatGroup[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_GROUPS_KEY, JSON.stringify(groups));
  } catch (err) {
    console.error("Failed to save chat groups", err);
  }
}

export function getStoredChatMessages(): ChatMessage[] {
  if (typeof window === "undefined") return INITIAL_CHAT_MESSAGES;
  try {
    const raw = localStorage.getItem(STORAGE_MESSAGES_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(INITIAL_CHAT_MESSAGES));
      return INITIAL_CHAT_MESSAGES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CHAT_MESSAGES;
  } catch {
    return INITIAL_CHAT_MESSAGES;
  }
}

export function saveStoredChatMessages(messages: ChatMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(messages));
  } catch (err) {
    console.error("Failed to save chat messages", err);
  }
}

// ============================================================================
// Group Creation / Member Management for Super Admin
// ============================================================================
export function createChatGroup(params: {
  name: string;
  description: string;
  avatar?: string;
  creatorUser: AppUser;
  memberConfigurations: {
    userId: string;
    isGroupLead: boolean;
    canViewAll: boolean;
  }[];
}): ChatGroup {
  const groups = getStoredChatGroups();
  const registeredUsers = getStoredUsers();

  const members: ChatMember[] = [];

  // Always include creator as Lead & Full View if not already present
  let creatorIncluded = false;

  params.memberConfigurations.forEach((cfg) => {
    const u = registeredUsers.find((user) => user.id === cfg.userId);
    if (u) {
      if (u.id === params.creatorUser.id) creatorIncluded = true;
      members.push({
        userId: u.id,
        name: u.name,
        username: u.username,
        role: u.role,
        isGroupLead: cfg.isGroupLead,
        canViewAll: cfg.canViewAll,
        joinedAt: new Date().toISOString(),
      });
    }
  });

  if (!creatorIncluded) {
    members.unshift({
      userId: params.creatorUser.id,
      name: params.creatorUser.name,
      username: params.creatorUser.username,
      role: params.creatorUser.role,
      isGroupLead: true,
      canViewAll: true,
      joinedAt: new Date().toISOString(),
    });
  }

  const newGroup: ChatGroup = {
    id: `grp-${Date.now()}`,
    name: params.name.trim(),
    description: params.description.trim(),
    avatar: params.avatar || "💬",
    createdBy: params.creatorUser.id,
    createdAt: new Date().toISOString(),
    members,
  };

  const updated = [newGroup, ...groups];
  saveStoredChatGroups(updated);
  return newGroup;
}

export function updateChatGroupMembers(
  groupId: string,
  updatedMembers: ChatMember[]
): ChatGroup {
  const groups = getStoredChatGroups();
  const groupIdx = groups.findIndex((g) => g.id === groupId);
  if (groupIdx === -1) throw new Error("Chat group not found");

  groups[groupIdx].members = updatedMembers;
  saveStoredChatGroups([...groups]);
  return groups[groupIdx];
}

const STORAGE_READ_KEY = "kfab_chat_read_ids_v1";

export function getReadMessageIds(userId: string): string[] {
  if (typeof window === "undefined" || !userId) return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_READ_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markMessagesAsRead(userId: string, messageIds: string[]): void {
  if (typeof window === "undefined" || !userId || messageIds.length === 0) return;
  try {
    const current = new Set(getReadMessageIds(userId));
    let hasNew = false;
    for (const id of messageIds) {
      if (!current.has(id)) {
        current.add(id);
        hasNew = true;
      }
    }
    if (hasNew) {
      localStorage.setItem(`${STORAGE_READ_KEY}_${userId}`, JSON.stringify(Array.from(current)));
      window.dispatchEvent(new CustomEvent("kfab_chat_read_updated", { detail: { userId } }));
    }
  } catch (err) {
    console.error("Failed to mark messages as read", err);
  }
}

export function getUnreadMessagesCount(
  userId: string,
  userRole: AppRole,
  groups?: ChatGroup[],
  messages?: ChatMessage[]
): number {
  if (!userId) return 0;
  const allGroups = groups || getStoredChatGroups();
  const allMessages = messages || getStoredChatMessages();
  if (allMessages.length === 0 || allGroups.length === 0) return 0;

  const readIds = new Set(getReadMessageIds(userId));
  let unread = 0;

  for (const m of allMessages) {
    if (m.senderId === userId) continue;
    if (readIds.has(m.id)) continue;

    const group = allGroups.find((g) => g.id === m.groupId);
    if (!group) continue;

    if (canUserSeeMessage(m, userId, userRole, group.members)) {
      unread++;
    }
  }

  return unread;
}

