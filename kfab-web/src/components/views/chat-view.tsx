"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  MessageSquare,
  Users,
  Search,
  Plus,
  Send,
  Paperclip,
  Image as ImageIcon,
  CheckCheck,
  ShieldCheck,
  Crown,
  Eye,
  EyeOff,
  Lock,
  Globe,
  X,
  Info,
  ChevronDown,
  Sparkles,
  Camera,
  Download,
  Maximize2,
  Check,
  AlertCircle,
  FileText,
  Building2,
} from "lucide-react";
import { AppRole, AppUser, getStoredUsers } from "@/lib/auth-store";
import {
  ChatGroup,
  ChatMessage,
  ChatMember,
  TargetScope,
  getStoredChatGroups,
  saveStoredChatGroups,
  getStoredChatMessages,
  saveStoredChatMessages,
  canUserSeeMessage,
  createChatGroup,
  updateChatGroupMembers,
  markMessagesAsRead,
  SAMPLE_CHAT_IMAGES,
} from "@/lib/chat-store";

interface ChatViewProps {
  currentUser: AppUser;
}

export function ChatView({ currentUser }: ChatViewProps) {
  // Groups and messages state
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchFilter, setSearchFilter] = useState("");

  // Viewing simulator (allows testing how Accountant vs Supervisor vs Admin sees the chat)
  const [simulatedUser, setSimulatedUser] = useState<AppUser>(currentUser);

  // Message input state
  const [inputText, setInputText] = useState("");
  const [targetScope, setTargetScope] = useState<TargetScope>("ALL");
  const [targetRole, setTargetRole] = useState<AppRole | undefined>(undefined);
  const [targetUserId, setTargetUserId] = useState<string>("");

  // Attachment modal state
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [imageCaption, setImageCaption] = useState("");
  const [lightboxImage, setLightboxImage] = useState<{ url: string; caption?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals state
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);

  // New Group Form state
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupAvatar, setNewGroupAvatar] = useState("🏗️");
  const [selectedMemberConfigs, setSelectedMemberConfigs] = useState<
    { userId: string; isGroupLead: boolean; canViewAll: boolean }[]
  >([]);

  // Registered database users
  const [registeredUsers, setRegisteredUsers] = useState<AppUser[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load initial data
  useEffect(() => {
    const loadedGroups = getStoredChatGroups();
    const loadedMessages = getStoredChatMessages();
    const loadedUsers = getStoredUsers();

    setGroups(loadedGroups);
    setMessages(loadedMessages);
    setRegisteredUsers(loadedUsers);

    if (loadedGroups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(loadedGroups[0].id);
    }
  }, [selectedGroupId]);

  // Keep simulated user in sync when currentUser changes
  useEffect(() => {
    setSimulatedUser(currentUser);
  }, [currentUser]);

  // Scroll to bottom when messages update or group changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedGroupId, simulatedUser]);

  const activeGroup = groups.find((g) => g.id === selectedGroupId) || groups[0];

  const isSuperAdmin = simulatedUser.role === "SUPER_ADMIN";
  const isAdmin = simulatedUser.role === "ADMIN" || isSuperAdmin;
  const currentMemberInGroup = activeGroup?.members.find((m) => m.userId === simulatedUser.id);
  const canSendWithTargeting =
    isSuperAdmin || isAdmin || (currentMemberInGroup && (currentMemberInGroup.isGroupLead || currentMemberInGroup.canViewAll));

  const accountantsInGroup = activeGroup?.members.filter((m) => m.role === "ACCOUNTANT") || [];
  const supervisorsInGroup = activeGroup?.members.filter((m) => m.role === "SUPERVISOR") || [];

  // Filter messages for current group and simulated viewer
  const visibleMessages = messages.filter((m) => {
    if (m.groupId !== activeGroup?.id) return false;
    return canUserSeeMessage(m, simulatedUser.id, simulatedUser.role, activeGroup.members);
  });

  // Automatically mark visible messages as read by current user
  useEffect(() => {
    if (visibleMessages.length > 0) {
      const unreadIds = visibleMessages
        .filter((m) => m.senderId !== simulatedUser.id)
        .map((m) => m.id);
      if (unreadIds.length > 0) {
        markMessagesAsRead(simulatedUser.id, unreadIds);
      }
    }
  }, [visibleMessages, simulatedUser.id]);

  // Post-Send Audience Dispatch Modal for Admin
  const [showAdminDispatchModal, setShowAdminDispatchModal] = useState(false);
  const [pendingMessagePayload, setPendingMessagePayload] = useState<{
    text: string;
    image?: string;
    caption?: string;
  } | null>(null);

  // Handle Send Message
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text && !attachedImage) return;

    if (canSendWithTargeting) {
      // User is Admin / Lead: Show recipient selection dialog as requested
      setPendingMessagePayload({
        text,
        image: attachedImage || undefined,
        caption: imageCaption.trim() || undefined,
      });
      setShowAdminDispatchModal(true);
    } else {
      // User is restricted: send directly to Leads & Admin
      dispatchFinalMessage("LEADS_AND_SENDER");
    }
  };

  const dispatchFinalMessage = (
    scope: TargetScope,
    targetRole?: AppRole,
    targetUserId?: string,
    targetUserName?: string
  ) => {
    const text = pendingMessagePayload ? pendingMessagePayload.text : inputText.trim();
    const image = pendingMessagePayload ? pendingMessagePayload.image : attachedImage;
    const caption = pendingMessagePayload ? pendingMessagePayload.caption : imageCaption.trim();

    if (!text && !image) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      groupId: activeGroup.id,
      senderId: simulatedUser.id,
      senderName: simulatedUser.name,
      senderUsername: simulatedUser.username,
      senderRole: simulatedUser.role,
      text,
      imageUrl: image || undefined,
      caption: caption || undefined,
      timestamp: now.toISOString(),
      timeString: timeStr,
      targetScope: scope,
      targetRole,
      targetUserIds: targetUserId ? [targetUserId] : undefined,
      targetUserNames: targetUserName ? [targetUserName] : undefined,
      status: "DELIVERED",
    };

    const updated = [...messages, newMessage];
    setMessages(updated);
    saveStoredChatMessages(updated);

    setInputText("");
    setAttachedImage(null);
    setImageCaption("");
    setPendingMessagePayload(null);
    setShowAdminDispatchModal(false);
  };

  // Handle file attachment
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      setAttachedImage(result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Quick load sample image preset
  const handleLoadSampleImage = (type: "weld" | "challan" | "crane") => {
    if (type === "weld") {
      setAttachedImage(SAMPLE_CHAT_IMAGES.weldInspection);
      setImageCaption("Bay 1 Column Splice Ultrasonic Inspection Check");
    } else if (type === "challan") {
      setAttachedImage(SAMPLE_CHAT_IMAGES.steelChallan);
      setImageCaption("Vendor Gate Pass Tare Weight Challan #8849");
    } else {
      setAttachedImage(SAMPLE_CHAT_IMAGES.craneLift);
      setImageCaption("Bay 2 25T Hydra Crane Girder Position Verification");
    }
  };

  // Open Create Group Modal
  const openCreateGroupModal = () => {
    setNewGroupName("");
    setNewGroupDesc("");
    setNewGroupAvatar("🏭");

    // Pre-populate with registered database users
    const initialConfigs = registeredUsers.map((u) => {
      const isLead = u.role === "SUPER_ADMIN" || u.role === "ADMIN";
      const canViewAll = isLead; // Admins default to view all; others default to "view own side"
      return {
        userId: u.id,
        isGroupLead: isLead,
        canViewAll: canViewAll,
      };
    });

    setSelectedMemberConfigs(initialConfigs);
    setShowCreateGroupModal(true);
  };

  // Submit Create Group
  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const created = createChatGroup({
      name: newGroupName,
      description: newGroupDesc,
      avatar: newGroupAvatar,
      creatorUser: simulatedUser,
      memberConfigurations: selectedMemberConfigs,
    });

    const refreshed = getStoredChatGroups();
    setGroups(refreshed);
    setSelectedGroupId(created.id);
    setShowCreateGroupModal(false);
  };

  // Toggle member lead in create form
  const toggleMemberLead = (userId: string) => {
    setSelectedMemberConfigs((prev) =>
      prev.map((cfg) =>
        cfg.userId === userId
          ? {
              ...cfg,
              isGroupLead: !cfg.isGroupLead,
              canViewAll: !cfg.isGroupLead ? true : cfg.canViewAll,
            }
          : cfg
      )
    );
  };

  // Toggle member view all in create form
  const toggleMemberViewAll = (userId: string) => {
    setSelectedMemberConfigs((prev) =>
      prev.map((cfg) =>
        cfg.userId === userId ? { ...cfg, canViewAll: !cfg.canViewAll } : cfg
      )
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full overflow-hidden bg-[#F1F5F9] font-sans">
      {/* 1. TOP TESTING & SIMULATION TOOLBAR */}
      <div className="bg-[#0F172A] text-white px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
            <Sparkles className="size-3.5" /> Granular Visibility Live Tester
          </span>
          <span className="text-slate-400 hidden sm:inline">
            Switch viewer to test privacy isolation (Supervisor vs Accountant vs Admin):
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {registeredUsers.map((u) => {
            const isSelected = simulatedUser.id === u.id;
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => setSimulatedUser(u)}
                className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/50"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <span>{u.name}</span>
                <span className="text-[10px] opacity-70 uppercase tracking-wider">
                  ({u.role})
                </span>
                {isSelected && <Check className="size-3 ml-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. MAIN WHATSAPP SPLIT PANE */}
      <div className="flex-1 flex overflow-hidden">
        {/* ================================================================ */}
        {/* LEFT SIDEBAR: Groups List & Search */}
        {/* ================================================================ */}
        <div className="w-80 md:w-96 bg-white border-r border-slate-200 flex flex-col shrink-0">
          {/* Header */}
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold shadow-xs">
                <MessageSquare className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-tight">Team Channels</h3>
                <p className="text-[11px] text-slate-500">
                  {groups.length} active workgroups
                </p>
              </div>
            </div>

            {/* Super Admin Create Group Action */}
            {isAdmin && (
              <button
                type="button"
                onClick={openCreateGroupModal}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title="Super Admin: Create New Channel & Configure Member Permissions"
              >
                <Plus className="size-3.5" />
                <span>New Group</span>
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="p-2.5 border-b border-slate-100 bg-white">
            <div className="relative">
              <Search className="size-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search channels or members..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100 rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-slate-800"
              />
            </div>
          </div>

          {/* Groups Scroll List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {groups
              .filter(
                (g) =>
                  g.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                  g.description.toLowerCase().includes(searchFilter.toLowerCase())
              )
              .map((g) => {
                const isSelected = g.id === activeGroup?.id;
                const lastMsg = messages
                  .filter((m) => m.groupId === g.id)
                  .slice(-1)[0];

                return (
                  <div
                    key={g.id}
                    onClick={() => setSelectedGroupId(g.id)}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                      isSelected ? "bg-emerald-50/70 border-l-4 border-emerald-600" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="size-11 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xl shrink-0 shadow-xs">
                      {g.avatar}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {g.name}
                        </h4>
                        {lastMsg && (
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {lastMsg.timeString}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 truncate mb-1">
                        {lastMsg ? (
                          <span>
                            <strong className="text-slate-700">{lastMsg.senderName}: </strong>
                            {lastMsg.imageUrl ? "📷 [Image] " : ""}
                            {lastMsg.text || lastMsg.caption}
                          </span>
                        ) : (
                          g.description
                        )}
                      </p>

                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          <Users className="size-2.5" /> {g.members.length} members
                        </span>
                        {g.members.some((m) => m.userId === simulatedUser.id && m.isGroupLead) && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                            <Crown className="size-2.5" /> Lead
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Current Viewer Footer Badge */}
          <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className="size-7 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[11px]">
                {simulatedUser.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 truncate">{simulatedUser.name}</p>
                <p className="text-[10px] text-slate-500 truncate">
                  {simulatedUser.username} &bull; {simulatedUser.role}
                </p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full">
              Active
            </span>
          </div>
        </div>

        {/* ================================================================ */}
        {/* RIGHT PANE: Active Chat Conversation */}
        {/* ================================================================ */}
        <div className="flex-1 flex flex-col bg-[#EFEAE2] relative overflow-hidden">
          {/* Subtle WhatsApp-style background pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(#0F172A 1px, transparent 1px)`,
              backgroundSize: "20px 20px",
            }}
          />

          {/* Active Chat Top Header */}
          <div className="h-16 px-4 bg-white border-b border-slate-200 flex items-center justify-between z-10 shadow-xs shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl shadow-xs">
                {activeGroup?.avatar}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 truncate flex items-center gap-1.5">
                  {activeGroup?.name}
                  {isSuperAdmin && (
                    <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded border border-purple-200">
                      Super Admin View
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-500 truncate">
                  {activeGroup?.members.map((m) => m.name.split(" ")[0]).join(", ")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowGroupInfoModal(true)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Info className="size-3.5 text-slate-500" />
                <span>Group Permissions</span>
              </button>
            </div>
          </div>

          {/* Messages Timeline */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 z-10">
            {/* Security Notice Pill */}
            <div className="flex justify-center mb-4">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3.5 py-1.5 rounded-lg text-[11px] max-w-lg text-center shadow-xs flex items-center gap-2">
                <Lock className="size-3.5 shrink-0 text-amber-600" />
                <span>
                  <strong>Granular Security Active:</strong> Restricted peer messages are private
                  between the sender and group leads. Supervisor & Accountant messages are isolated.
                </span>
              </div>
            </div>

            {visibleMessages.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                <EyeOff className="size-8 mb-2 opacity-40" />
                <p className="font-semibold text-slate-600">No messages visible to your role</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs text-center">
                  Messages in this group might be restricted between other peers and the plant admin.
                </p>
              </div>
            ) : (
              visibleMessages.map((msg) => {
                const isMe = msg.senderId === simulatedUser.id;

                // Privacy scope badge helper
                let scopeBadge = null;
                if (msg.targetScope === "LEADS_AND_SENDER") {
                  scopeBadge = (
                    <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-amber-700 bg-amber-100/90 px-1.5 py-0.5 rounded border border-amber-200">
                      <Lock className="size-2.5" />
                      Private to Admin & {msg.senderRole}
                    </span>
                  );
                } else if (msg.targetScope === "USERS") {
                  scopeBadge = (
                    <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-indigo-700 bg-indigo-100/90 px-1.5 py-0.5 rounded border border-indigo-200">
                      <Lock className="size-2.5" />
                      Targeted: {msg.targetUserNames?.join(", ") || "Selected User"}
                    </span>
                  );
                } else if (msg.targetScope === "ROLE") {
                  scopeBadge = (
                    <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-blue-700 bg-blue-100/90 px-1.5 py-0.5 rounded border border-blue-200">
                      <Users className="size-2.5" />
                      Only {msg.targetRole}
                    </span>
                  );
                } else {
                  scopeBadge = (
                    <span className="inline-flex items-center gap-1 text-[9.5px] font-medium text-slate-500 bg-slate-100/80 px-1.5 py-0.5 rounded">
                      <Globe className="size-2.5" />
                      Group Wide
                    </span>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 shadow-xs border transition-all ${
                        isMe
                          ? "bg-[#D9FDD3] border-[#B8EBB2] text-slate-900 rounded-tr-xs"
                          : "bg-white border-slate-200 text-slate-900 rounded-tl-xs"
                      }`}
                    >
                      {/* Sender and Scope Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-slate-900">
                            {isMe ? "You" : msg.senderName}
                          </span>
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                              msg.senderRole === "SUPERVISOR"
                                ? "bg-blue-100 text-blue-800"
                                : msg.senderRole === "ACCOUNTANT"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {msg.senderRole}
                          </span>
                        </div>
                        {scopeBadge}
                      </div>

                      {/* Image Attachment (WhatsApp-Style with Lightbox Zoom) */}
                      {msg.imageUrl && (
                        <div className="mb-2 overflow-hidden rounded-xl border border-black/10 bg-slate-900 relative group cursor-pointer">
                          <div
                            onClick={() =>
                              setLightboxImage({
                                url: msg.imageUrl!,
                                caption: msg.caption || msg.text,
                              })
                            }
                            className="relative aspect-video w-full max-h-64 overflow-hidden"
                          >
                            <img
                              src={msg.imageUrl}
                              alt="Attachment"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 font-semibold text-xs">
                              <Maximize2 className="size-4" /> Click to enlarge
                            </div>
                          </div>

                          {msg.caption && (
                            <div className="p-2 bg-black/75 text-white text-[11px] font-medium backdrop-blur-xs">
                              {msg.caption}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Message Text Body */}
                      {msg.text && (
                        <p className="text-xs md:text-[13px] leading-relaxed whitespace-pre-wrap">
                          {msg.text}
                        </p>
                      )}

                      {/* Timestamp and Double Checkmarks */}
                      <div className="flex items-center justify-end gap-1 mt-1.5 text-[10px] text-slate-500">
                        <span>{msg.timeString}</span>
                        {isMe && (
                          <CheckCheck className="size-3.5 text-emerald-600 inline ml-0.5" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 3. ATTACHMENT PREVIEW DRAWER (If user selected an image) */}
          {attachedImage && (
            <div className="bg-white border-t border-slate-200 p-3 flex items-center gap-3 z-20 shadow-md">
              <div className="relative size-16 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                <img src={attachedImage} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setAttachedImage(null)}
                  className="absolute top-0.5 right-0.5 size-5 bg-black/70 hover:bg-black text-white rounded-full flex items-center justify-center cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              </div>

              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Add a photo caption..."
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="button"
                onClick={() => handleSendMessage()}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send className="size-3.5" /> Send Photo
              </button>
            </div>
          )}

          {/* 4. WHATSAPP INPUT COMPOSER BAR */}
          <div className="bg-white border-t border-slate-200 p-3 z-10">
            {/* Recipient Targeting Selector (Only available to Admin / Leads) */}
            {canSendWithTargeting && (
              <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <Lock className="size-3 text-emerald-600" /> Recipient Audience:
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetScope("ALL");
                      setTargetRole(undefined);
                      setTargetUserId("");
                    }}
                    className={`px-2 py-0.5 rounded text-xs font-semibold cursor-pointer transition-colors ${
                      targetScope === "ALL"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    🌐 Everyone
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTargetScope("ROLE");
                      setTargetRole("SUPERVISOR");
                      setTargetUserId("");
                    }}
                    className={`px-2 py-0.5 rounded text-xs font-semibold cursor-pointer transition-colors ${
                      targetScope === "ROLE" && targetRole === "SUPERVISOR"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    👷 Only Supervisors
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTargetScope("ROLE");
                      setTargetRole("ACCOUNTANT");
                      setTargetUserId("");
                    }}
                    className={`px-2 py-0.5 rounded text-xs font-semibold cursor-pointer transition-colors ${
                      targetScope === "ROLE" && targetRole === "ACCOUNTANT"
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    📊 Only Accountants
                  </button>
                </div>

                {/* Specific individual dropdown */}
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-slate-400">Or specific user:</span>
                  <select
                    value={targetUserId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTargetUserId(val);
                      if (val) {
                        setTargetScope("USERS");
                      } else {
                        setTargetScope("ALL");
                      }
                    }}
                    className="text-xs bg-slate-100 border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">-- Choose Member --</option>
                    {activeGroup?.members
                      .filter((m) => m.userId !== simulatedUser.id)
                      .map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {m.name} ({m.role})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}

            {/* Input Row */}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Attach File Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                title="Upload Photo / Inspection Image"
              >
                <Paperclip className="size-5" />
              </button>

              {/* Quick Sample Photos Dropdown */}
              <div className="relative group">
                <button
                  type="button"
                  className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-full transition-colors cursor-pointer flex items-center"
                  title="One-Click Sample Plant Photos"
                >
                  <Camera className="size-5" />
                </button>
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:flex flex-col bg-white border border-slate-200 rounded-lg shadow-lg py-1 w-52 z-30 text-xs">
                  <button
                    type="button"
                    onClick={() => handleLoadSampleImage("weld")}
                    className="px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                  >
                    <span>🏗️</span> Bay 1 Weld Inspection
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadSampleImage("challan")}
                    className="px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                  >
                    <span>📄</span> Tare Weight Challan Slip
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadSampleImage("crane")}
                    className="px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                  >
                    <span>🚜</span> 25T Hydra Crane Lift
                  </button>
                </div>
              </div>

              {/* Text Input */}
              <input
                type="text"
                placeholder={
                  canSendWithTargeting
                    ? `Message ${activeGroup?.name}... (Targeting active)`
                    : `Message ${activeGroup?.name}... (Private to Admin & Leads)`
                }
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 text-xs md:text-sm px-4 py-2 bg-slate-100 rounded-full border-none focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 transition-all"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputText.trim() && !attachedImage}
                className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-full shadow-xs transition-colors cursor-pointer"
              >
                <Send className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 5. MODAL: SUPER ADMIN CREATE GROUP & CONFIGURE PERMISSIONS */}
      {/* ================================================================ */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Crown className="size-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold">Super Admin: Create Workgroup Channel</h3>
                  <p className="text-[11px] text-slate-400">
                    Add members with registered email/username and tick visibility rights
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateGroupModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateGroupSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Group Name & Icon */}
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Channel / Group Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fabrication Bay 2 Operations & Dispatch"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Avatar Emoji
                  </label>
                  <input
                    type="text"
                    value={newGroupAvatar}
                    onChange={(e) => setNewGroupAvatar(e.target.value)}
                    className="w-full text-center text-lg py-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Group Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Purpose / Department Scope
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cross-departmental bridge for supervisors, QA weld checks, and store requisitions"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Member Selection and Granular Visibility Matrix */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-900">
                    Select Database Members & Configure Permissions
                  </label>
                  <span className="text-[11px] text-slate-500">
                    {registeredUsers.length} users registered in DB
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-60 overflow-y-auto bg-slate-50">
                  {registeredUsers.map((user) => {
                    const cfg = selectedMemberConfigs.find((c) => c.userId === user.id);
                    const isLead = cfg?.isGroupLead || false;
                    const canViewAll = cfg?.canViewAll || false;

                    return (
                      <div
                        key={user.id}
                        className="p-3 bg-white flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 flex items-center gap-1.5">
                            {user.name}
                            <span className="text-[10px] font-semibold text-slate-500">
                              (@{user.username})
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                user.role === "SUPER_ADMIN"
                                  ? "bg-purple-100 text-purple-800"
                                  : user.role === "ADMIN"
                                  ? "bg-indigo-100 text-indigo-800"
                                  : user.role === "SUPERVISOR"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {user.role}
                            </span>
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {canViewAll ? (
                              <span className="text-emerald-700 font-medium">
                                ✓ Can view all messages in channel
                              </span>
                            ) : (
                              <span className="text-amber-700 font-medium">
                                🔒 Restricted: Views ONLY his side of messages
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Permission Toggles */}
                        <div className="flex items-center gap-4 shrink-0">
                          {/* Group Lead Toggle */}
                          <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isLead}
                              onChange={() => toggleMemberLead(user.id)}
                              className="size-4 text-amber-600 rounded focus:ring-amber-500"
                            />
                            <span>Lead</span>
                          </label>

                          {/* View All Messages Toggle */}
                          <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={canViewAll}
                              onChange={() => toggleMemberViewAll(user.id)}
                              className="size-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                            <span>View All</span>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* User Guide Box */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-xs space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <AlertCircle className="size-3.5" /> How the Visibility Matrix Works:
                </p>
                <ul className="list-disc pl-4 text-[11px] space-y-0.5 text-blue-900">
                  <li>
                    <strong>"View All" checked:</strong> The user sees all messages in the group
                    (e.g., Plant Admin, Leads).
                  </li>
                  <li>
                    <strong>"View All" unchecked:</strong> The user only sees their own messages and
                    messages explicitly targeted to them. Messages from other restricted peers (like
                    Accountant vs Supervisor) remain completely hidden!
                  </li>
                </ul>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer shadow-xs"
                >
                  Create & Initialize Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 6. MODAL: GROUP INFO & PERMISSIONS INSPECTOR */}
      {/* ================================================================ */}
      {showGroupInfoModal && activeGroup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Info className="size-5 text-emerald-400" />
                <h3 className="text-sm font-bold">Group Security & Member Matrix</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGroupInfoModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="size-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-2xl shadow-xs">
                  {activeGroup.avatar}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{activeGroup.name}</h4>
                  <p className="text-[11px] text-slate-500">{activeGroup.description}</p>
                </div>
              </div>

              <div>
                <h5 className="font-bold text-slate-900 mb-2">
                  Channel Members ({activeGroup.members.length})
                </h5>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl max-h-56 overflow-y-auto">
                  {activeGroup.members.map((m) => (
                    <div key={m.userId} className="p-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800">
                          {m.name}{" "}
                          <span className="text-[10px] text-slate-400 font-normal">
                            (@{m.username})
                          </span>
                        </p>
                        <p className="text-[10px] text-slate-500">{m.role}</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {m.isGroupLead && (
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">
                            Lead
                          </span>
                        )}
                        {m.canViewAll ? (
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                            View All
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-medium rounded">
                            Own Side Only
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowGroupInfoModal(false)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 7. LIGHTBOX MODAL: FULL-SCREEN IMAGE VIEWER */}
      {/* ================================================================ */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4 backdrop-blur-md cursor-zoom-out"
        >
          <div className="absolute top-4 right-4 flex items-center gap-3 text-white">
            <a
              href={lightboxImage.url}
              download="kfab-chat-image.jpg"
              onClick={(e) => e.stopPropagation()}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full cursor-pointer transition-colors"
              title="Download image"
            >
              <Download className="size-5" />
            </a>
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full cursor-pointer transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>

          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl max-h-[85vh] flex flex-col items-center cursor-default"
          >
            <img
              src={lightboxImage.url}
              alt="Full Preview"
              className="max-h-[75vh] w-auto max-w-full rounded-lg shadow-2xl object-contain"
            />
            {lightboxImage.caption && (
              <p className="mt-3 text-white text-sm font-medium bg-black/60 px-4 py-2 rounded-lg backdrop-blur-xs max-w-lg text-center">
                {lightboxImage.caption}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 8. MODAL: ADMIN RECIPIENT DISPATCH SELECTION (UPON CLICKING SEND) */}
      {/* ================================================================ */}
      {showAdminDispatchModal && pendingMessagePayload && (
        <div className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 border border-slate-200">
            {/* Header */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="size-4 text-emerald-400" />
                <h3 className="text-sm font-bold">Choose Who Can See This Message</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminDispatchModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Message Preview */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Dispatching:
              </p>
              {pendingMessagePayload.image && (
                <div className="flex items-center gap-2 mb-1.5">
                  <img
                    src={pendingMessagePayload.image}
                    alt="attachment"
                    className="size-8 object-cover rounded border"
                  />
                  <span className="text-[11px] font-semibold text-slate-700">
                    📷 [Photo] {pendingMessagePayload.caption || "Attached Image"}
                  </span>
                </div>
              )}
              {pendingMessagePayload.text && (
                <p className="text-slate-900 font-medium italic bg-white p-2 rounded border border-slate-200">
                  &ldquo;{pendingMessagePayload.text}&rdquo;
                </p>
              )}
            </div>

            {/* Recipient Choices List */}
            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              <p className="text-[11px] font-bold text-slate-600 mb-1">
                Select target recipient scope:
              </p>

              {/* 1. EVERYONE */}
              <button
                type="button"
                onClick={() => dispatchFinalMessage("ALL")}
                className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/60 flex items-center justify-between text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <Globe className="size-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 group-hover:text-emerald-900">
                      Everyone in Channel
                    </h5>
                    <p className="text-[10px] text-slate-500">
                      All supervisors, accountants, and plant members
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Send All
                </span>
              </button>

              {/* 2. ALL ACCOUNTANTS */}
              <button
                type="button"
                onClick={() => dispatchFinalMessage("ROLE", "ACCOUNTANT")}
                className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/60 flex items-center justify-between text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <Users className="size-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 group-hover:text-emerald-900">
                      All Accountants (Account All)
                    </h5>
                    <p className="text-[10px] text-slate-500">
                      Visible only to Admin and all Accountants ({accountantsInGroup.length})
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  All Accounts
                </span>
              </button>

              {/* 2b. SPECIFIC ACCOUNTANTS */}
              {accountantsInGroup.map((acc) => (
                <button
                  key={acc.userId}
                  type="button"
                  onClick={() => dispatchFinalMessage("USERS", undefined, acc.userId, acc.name)}
                  className="w-full pl-6 pr-3 py-2 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 flex items-center justify-between text-left transition-colors cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-xs">&bull;</span>
                    <div>
                      <span className="font-bold text-slate-800">
                        Accountant: {acc.name}
                      </span>{" "}
                      <span className="text-[10px] text-slate-500">(@{acc.username})</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                    Only Him
                  </span>
                </button>
              ))}

              {/* 3. ALL SUPERVISORS */}
              <button
                type="button"
                onClick={() => dispatchFinalMessage("ROLE", "SUPERVISOR")}
                className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/60 flex items-center justify-between text-left transition-all cursor-pointer group mt-2"
              >
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
                    <Users className="size-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 group-hover:text-amber-900">
                      All Supervisors (Supervisor All)
                    </h5>
                    <p className="text-[10px] text-slate-500">
                      Visible only to Admin and all Supervisors ({supervisorsInGroup.length})
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                  All Supv
                </span>
              </button>

              {/* 3b. SPECIFIC SUPERVISORS */}
              {supervisorsInGroup.map((sup) => (
                <button
                  key={sup.userId}
                  type="button"
                  onClick={() => dispatchFinalMessage("USERS", undefined, sup.userId, sup.name)}
                  className="w-full pl-6 pr-3 py-2 rounded-lg border border-slate-200 hover:border-amber-500 hover:bg-amber-50 flex items-center justify-between text-left transition-colors cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-xs">&bull;</span>
                    <div>
                      <span className="font-bold text-slate-800">
                        Supervisor: {sup.name}
                      </span>{" "}
                      <span className="text-[10px] text-slate-500">(@{sup.username})</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                    Only Him
                  </span>
                </button>
              ))}
            </div>

            <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAdminDispatchModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
