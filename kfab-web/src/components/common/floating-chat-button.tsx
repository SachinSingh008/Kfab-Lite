"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  X,
  Maximize2,
  Send,
  Paperclip,
  Camera,
  Lock,
  Globe,
  Users,
  CheckCheck,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { AppUser, AppRole } from "@/lib/auth-store";
import {
  ChatGroup,
  ChatMessage,
  TargetScope,
  getStoredChatGroups,
  getStoredChatMessages,
  saveStoredChatMessages,
  canUserSeeMessage,
  SAMPLE_CHAT_IMAGES,
} from "@/lib/chat-store";

interface FloatingChatButtonProps {
  currentUser: AppUser;
  onOpenFullChat: () => void;
  isFullChatActive?: boolean;
}

export function FloatingChatButton({
  currentUser,
  onOpenFullChat,
  isFullChatActive = false,
}: FloatingChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [imageCaption, setImageCaption] = useState("");

  // Post-Send Audience Dispatch Modal for Admin
  const [showAdminDispatchModal, setShowAdminDispatchModal] = useState(false);
  const [pendingMessagePayload, setPendingMessagePayload] = useState<{
    text: string;
    image?: string;
    caption?: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load groups & messages
  useEffect(() => {
    const loadedGroups = getStoredChatGroups();
    const loadedMessages = getStoredChatMessages();
    setGroups(loadedGroups);
    setMessages(loadedMessages);
    if (loadedGroups.length > 0 && !activeGroupId) {
      setActiveGroupId(loadedGroups[0].id);
    }
  }, [isOpen, activeGroupId]);

  // Scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, activeGroupId]);

  const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0];
  const isSuperAdmin = currentUser.role === "SUPER_ADMIN";
  const isAdmin = currentUser.role === "ADMIN" || isSuperAdmin;
  const currentMember = activeGroup?.members.find((m) => m.userId === currentUser.id);
  const canSendWithTargeting =
    isAdmin || (currentMember && (currentMember.isGroupLead || currentMember.canViewAll));

  // Filter messages for current user
  const visibleMessages = messages.filter((m) => {
    if (m.groupId !== activeGroup?.id) return false;
    return canUserSeeMessage(m, currentUser.id, currentUser.role, activeGroup.members);
  });

  // Role Theme Color helper for bottom-right circular button:
  // Super Admin: Green/Black (#0F172A)
  // Admin: Red (#DC2626)
  // Supervisor: Yellow/Gold (#CA8A04)
  // Accountant: Green (#15803D)
  const getRoleThemeStyles = (role: AppRole) => {
    switch (role) {
      case "SUPER_ADMIN":
        return {
          bg: "bg-[#0F172A] hover:bg-[#1E293B]",
          text: "text-white",
          border: "border-emerald-500",
          glow: "shadow-[0_4px_20px_rgba(16,185,129,0.35)] ring-2 ring-emerald-400/40",
          badgeBg: "bg-emerald-500",
        };
      case "ADMIN":
        return {
          bg: "bg-[#DC2626] hover:bg-[#B91C1C]",
          text: "text-white",
          border: "border-red-300",
          glow: "shadow-[0_4px_20px_rgba(220,38,38,0.4)] ring-2 ring-red-400/40",
          badgeBg: "bg-white text-red-700",
        };
      case "SUPERVISOR":
        return {
          bg: "bg-[#CA8A04] hover:bg-[#A16207]",
          text: "text-slate-900",
          border: "border-yellow-300",
          glow: "shadow-[0_4px_20px_rgba(202,138,4,0.4)] ring-2 ring-yellow-400/40",
          badgeBg: "bg-slate-900 text-yellow-400",
        };
      case "ACCOUNTANT":
        return {
          bg: "bg-[#15803D] hover:bg-[#166534]",
          text: "text-white",
          border: "border-green-300",
          glow: "shadow-[0_4px_20px_rgba(21,128,61,0.4)] ring-2 ring-green-400/40",
          badgeBg: "bg-emerald-300 text-emerald-950",
        };
    }
  };

  const theme = getRoleThemeStyles(currentUser.role);

  // When user clicks Send
  const handleInitiateSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text && !attachedImage) return;

    if (canSendWithTargeting) {
      // Admin/Lead: Show audience choices modal
      setPendingMessagePayload({
        text,
        image: attachedImage || undefined,
        caption: imageCaption.trim() || undefined,
      });
      setShowAdminDispatchModal(true);
    } else {
      // Restricted member: Send immediately scoped to LEADS_AND_SENDER
      dispatchFinalMessage("LEADS_AND_SENDER");
    }
  };

  // Dispatch final message with chosen scope
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

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      groupId: activeGroup.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderUsername: currentUser.username,
      senderRole: currentUser.role,
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

    const updated = [...messages, newMsg];
    setMessages(updated);
    saveStoredChatMessages(updated);

    // Reset fields
    setInputText("");
    setAttachedImage(null);
    setImageCaption("");
    setPendingMessagePayload(null);
    setShowAdminDispatchModal(false);
  };

  // Attach sample photo
  const attachSample = (url: string, caption: string) => {
    setAttachedImage(url);
    setImageCaption(caption);
  };

  // File upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAttachedImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const accountantsInGroup =
    activeGroup?.members.filter((m) => m.role === "ACCOUNTANT") || [];
  const supervisorsInGroup =
    activeGroup?.members.filter((m) => m.role === "SUPERVISOR") || [];

  return (
    <>
      {/* ============================================================== */}
      {/* 1. FLOATING CHAT WIDGET POPUP WINDOW (WHEN OPEN) */}
      {/* ============================================================== */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-2rem)] h-[540px] max-h-[calc(100vh-8rem)] bg-[#EFEAE2] rounded-2xl shadow-2xl border border-slate-300 z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="h-14 px-3.5 bg-[#075E54] text-white flex items-center justify-between shadow-xs shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="size-8 rounded-full bg-white/20 flex items-center justify-center text-base">
                {activeGroup?.avatar || "💬"}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold leading-tight truncate">
                  {activeGroup?.name || "Team Chat"}
                </h4>
                <p className="text-[10px] text-emerald-100/80 truncate">
                  {activeGroup?.members.length} members &bull; {currentUser.role}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenFullChat();
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-emerald-100 hover:text-white"
                title="Expand to Full Screen View"
              >
                <Maximize2 className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-emerald-100 hover:text-white"
                title="Minimize Chat"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Group Tabs Chip Row */}
          {groups.length > 1 && (
            <div className="bg-emerald-800/90 px-2 py-1 flex items-center gap-1 overflow-x-auto text-[10px]">
              {groups.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setActiveGroupId(g.id)}
                  className={`px-2 py-0.5 rounded-full font-bold whitespace-nowrap cursor-pointer transition-colors ${
                    g.id === activeGroup?.id
                      ? "bg-white text-emerald-950 shadow-xs"
                      : "text-emerald-100 hover:bg-white/10"
                  }`}
                >
                  {g.avatar} {g.name.split(" ")[0]}
                </button>
              ))}
            </div>
          )}

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {visibleMessages.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-xs text-center p-4">
                <Lock className="size-6 mb-1 text-slate-400 opacity-60" />
                <p className="font-semibold">No messages visible</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Restricted peer messages are isolated.
                </p>
              </div>
            ) : (
              visibleMessages.map((msg) => {
                const isMe = msg.senderId === currentUser.id;

                let scopePill = null;
                if (msg.targetScope === "LEADS_AND_SENDER") {
                  scopePill = (
                    <span className="text-[8.5px] font-bold text-amber-800 bg-amber-100 px-1 py-0.2 rounded">
                      🔒 Admin & {msg.senderRole}
                    </span>
                  );
                } else if (msg.targetScope === "ROLE") {
                  scopePill = (
                    <span className="text-[8.5px] font-bold text-blue-800 bg-blue-100 px-1 py-0.2 rounded">
                      🔒 {msg.targetRole} only
                    </span>
                  );
                } else if (msg.targetScope === "USERS") {
                  scopePill = (
                    <span className="text-[8.5px] font-bold text-purple-800 bg-purple-100 px-1 py-0.2 rounded">
                      🔒 {msg.targetUserNames?.[0] || "Targeted"}
                    </span>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl p-2.5 shadow-xs border text-xs ${
                        isMe
                          ? "bg-[#D9FDD3] border-[#B8EBB2] text-slate-900 rounded-tr-xs"
                          : "bg-white border-slate-200 text-slate-900 rounded-tl-xs"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5 mb-1">
                        <span className="font-bold text-[10.5px]">
                          {isMe ? "You" : msg.senderName}
                        </span>
                        {scopePill}
                      </div>

                      {msg.imageUrl && (
                        <div className="mb-1.5 rounded-lg overflow-hidden border border-black/10">
                          <img
                            src={msg.imageUrl}
                            alt="Attachment"
                            className="w-full h-32 object-cover"
                          />
                          {msg.caption && (
                            <p className="p-1.5 bg-black/75 text-white text-[10px]">
                              {msg.caption}
                            </p>
                          )}
                        </div>
                      )}

                      {msg.text && <p className="leading-tight">{msg.text}</p>}

                      <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-500">
                        <span>{msg.timeString}</span>
                        {isMe && <CheckCheck className="size-3 text-emerald-600 inline" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Pending Photo Attachment Bar */}
          {attachedImage && (
            <div className="p-2 bg-white border-t border-slate-200 flex items-center gap-2">
              <img
                src={attachedImage}
                alt="preview"
                className="size-10 object-cover rounded border"
              />
              <input
                type="text"
                placeholder="Caption..."
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                className="flex-1 text-xs px-2 py-1 bg-slate-50 border rounded"
              />
              <button
                type="button"
                onClick={() => setAttachedImage(null)}
                className="text-slate-400 hover:text-red-500 p-1"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          {/* Composer Bar */}
          <form
            onSubmit={handleInitiateSend}
            className="p-2 bg-white border-t border-slate-200 flex items-center gap-1.5"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-full"
              title="Upload photo"
            >
              <Paperclip className="size-4" />
            </button>

            {/* Quick Sample Photo Preset */}
            <button
              type="button"
              onClick={() =>
                attachSample(
                  SAMPLE_CHAT_IMAGES.weldInspection,
                  "Bay 1 Column Splice Inspection Photo"
                )
              }
              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-full"
              title="Attach Sample Inspection Photo"
            >
              <Camera className="size-4" />
            </button>

            <input
              type="text"
              placeholder={
                canSendWithTargeting ? "Type message (Targeting on Send)..." : "Type message..."
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 text-xs px-3 py-1.5 bg-slate-100 rounded-full border-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />

            <button
              type="submit"
              disabled={!inputText.trim() && !attachedImage}
              className="p-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-full transition-colors cursor-pointer"
            >
              <Send className="size-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. ADMIN RECIPIENT DISPATCH SELECTION MODAL (UPON CLICKING SEND) */}
      {/* ============================================================== */}
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
                className="text-slate-400 hover:text-white"
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
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. FLOATING CIRCULAR CHAT BUTTON (BOTTOM RIGHT) */}
      {/* Role Theme Colors: */}
      {/* Super Admin: Green/Black (#0F172A) */}
      {/* Admin: Red (#DC2626) */}
      {/* Supervisor: Yellow/Gold (#CA8A04) */}
      {/* Accountant: Green (#15803D) */}
      {/* ============================================================== */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (isFullChatActive) {
              setIsOpen((prev) => !prev);
            } else {
              setIsOpen((prev) => !prev);
            }
          }}
          className={`size-14 md:size-16 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 transform hover:scale-105 active:scale-95 ${theme.bg} ${theme.text} ${theme.border} border-2 ${theme.glow} relative group`}
          title={`Open Team Chat (${currentUser.role.replace("_", " ")})`}
        >
          {/* Animated pulse indicator badge */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span
              className={`relative inline-flex rounded-full h-4 w-4 text-[9px] font-extrabold items-center justify-center ${theme.badgeBg}`}
            >
              1
            </span>
          </span>

          {isOpen ? (
            <X className="size-7 transition-transform group-hover:rotate-90 duration-200" />
          ) : (
            <MessageSquare className="size-7" />
          )}

          {/* Quick Tooltip */}
          <span className="absolute right-full mr-3 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-bold rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            💬 Quick Chat ({currentUser.role.replace("_", " ")})
          </span>
        </button>
      </div>
    </>
  );
}
