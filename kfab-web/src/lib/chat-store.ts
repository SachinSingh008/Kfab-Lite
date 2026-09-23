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

const STORAGE_GROUPS_KEY = "kfab_chat_groups_v5";
const STORAGE_MESSAGES_KEY = "kfab_chat_messages_v5";

// Sample fabrication & commercial images (base64 SVG data URLs for instant offline display)
export const SAMPLE_CHAT_IMAGES = {
  weldInspection:
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
  steelChallan:
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80",
  craneLift:
    "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=800&q=80",
};

// Initial Demo Group demonstrating the user's exact specification:
// - Admin, Supervisor, Accountant
// - Supervisor's message visible ONLY to Supervisor & Admin (Accountant cannot see)
// - Accountant's message visible ONLY to Accountant & Admin (Supervisor cannot see)
// - Admin can see all and send targeted messages
export const INITIAL_CHAT_GROUPS: ChatGroup[] = [
  {
    id: "grp-bay1-bridge",
    name: "Bay 1 Operations & Accounts Bridge",
    description: "Multi-department bridge for fabrication muster, material receipts, and billing audit",
    avatar: "🏗️",
    createdBy: "usr-superadmin-001",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    members: [
      {
        userId: "usr-superadmin-001",
        name: "Super Administrator",
        username: "superadmin",
        role: "SUPER_ADMIN",
        isGroupLead: true,
        canViewAll: true,
        joinedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        userId: "usr-admin-002",
        name: "Plant Admin",
        username: "admin",
        role: "ADMIN",
        isGroupLead: true,
        canViewAll: true,
        joinedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        userId: "usr-supervisor-003",
        name: "Bay Supervisor (Imran)",
        username: "supervisor",
        role: "SUPERVISOR",
        isGroupLead: false,
        canViewAll: false, // "View only his side"
        joinedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        userId: "usr-supervisor-005",
        name: "Shop Supervisor (Vikram)",
        username: "supervisor2",
        role: "SUPERVISOR",
        isGroupLead: false,
        canViewAll: false, // "View only his side"
        joinedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        userId: "usr-accountant-004",
        name: "Accounts Auditor (Deshmukh)",
        username: "accountant",
        role: "ACCOUNTANT",
        isGroupLead: false,
        canViewAll: false, // "View only his side"
        joinedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        userId: "usr-accountant-006",
        name: "Billing Accountant (Sneha)",
        username: "accountant2",
        role: "ACCOUNTANT",
        isGroupLead: false,
        canViewAll: false, // "View only his side"
        joinedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
    ],
  },
  {
    id: "grp-executive-leads",
    name: "Executive Plant Operations & QA",
    description: "Plant administrative alerts, compliance certificates, and executive approvals",
    avatar: "⚡",
    createdBy: "usr-superadmin-001",
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    members: [
      {
        userId: "usr-superadmin-001",
        name: "Super Administrator",
        username: "superadmin",
        role: "SUPER_ADMIN",
        isGroupLead: true,
        canViewAll: true,
        joinedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      },
      {
        userId: "usr-admin-002",
        name: "Plant Admin",
        username: "admin",
        role: "ADMIN",
        isGroupLead: true,
        canViewAll: true,
        joinedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      },
    ],
  },
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: "msg-1",
    groupId: "grp-bay1-bridge",
    senderId: "usr-admin-002",
    senderName: "Plant Admin",
    senderUsername: "admin",
    senderRole: "ADMIN",
    text: "Welcome to Bay 1 Bridge. Supervisor Imran and Accounts Auditor Deshmukh are connected here. Supervisor operational updates and Accounts commercial notes will follow strict privacy routing.",
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    timeString: "09:30 AM",
    targetScope: "ALL",
    status: "READ",
  },
  {
    id: "msg-2",
    groupId: "grp-bay1-bridge",
    senderId: "usr-supervisor-003",
    senderName: "Bay Supervisor",
    senderUsername: "supervisor",
    senderRole: "SUPERVISOR",
    text: "Bay 1 column splice G1-G6 torque check completed at 750 N·m. Attached is the site inspection photo for QA sign-off.",
    imageUrl: SAMPLE_CHAT_IMAGES.weldInspection,
    caption: "Bay 1 Column Splice Inspection - AWS D1.1 Pass",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    timeString: "10:15 AM",
    targetScope: "LEADS_AND_SENDER",
    status: "READ",
  },
  {
    id: "msg-3",
    groupId: "grp-bay1-bridge",
    senderId: "usr-accountant-004",
    senderName: "Accounts Auditor",
    senderUsername: "accountant",
    senderRole: "ACCOUNTANT",
    text: "Reviewing Inward Challan #TATA-8849 for 28.5 MT MS Plates. Found a billing variance of ₹38,400 against the negotiated purchase order. Attached challan copy for verification.",
    imageUrl: SAMPLE_CHAT_IMAGES.steelChallan,
    caption: "Challan #TATA-8849 Audit Memo & Tare Weight Discrepancy",
    timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    timeString: "11:05 AM",
    targetScope: "LEADS_AND_SENDER",
    status: "READ",
  },
  {
    id: "msg-4",
    groupId: "grp-bay1-bridge",
    senderId: "usr-admin-002",
    senderName: "Plant Admin",
    senderUsername: "admin",
    senderRole: "ADMIN",
    text: "Imran (Supervisor): Heavy crane lift for Bay 1 is authorized for 13:00. Ensure clear path for 25T Hydra crane.",
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
    timeString: "11:45 AM",
    targetScope: "USERS",
    targetUserIds: ["usr-supervisor-003"],
    targetUserNames: ["Bay Supervisor"],
    status: "READ",
  },
  {
    id: "msg-5",
    groupId: "grp-bay1-bridge",
    senderId: "usr-admin-002",
    senderName: "Plant Admin",
    senderUsername: "admin",
    senderRole: "ADMIN",
    text: "Accounts Team: Hold vendor payment voucher for Challan #8849 until procurement confirms unit rate credit note.",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    timeString: "12:10 PM",
    targetScope: "USERS",
    targetUserIds: ["usr-accountant-004"],
    targetUserNames: ["Accounts Auditor"],
    status: "READ",
  },
];

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
