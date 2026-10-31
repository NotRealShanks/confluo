import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  Activity,
  AlertCircle,
  MessageSquare,
  Send,
  Users,
  X,
} from "lucide-react";
import { useProjectChat } from "./useProjectChat";
import { useMemberActivity } from "./useMemberActivity";
import { colorFor } from "../lib/color";

export interface ProjectChatPanelProps {
  projectId: string;
  onClose: () => void;
}

function ChatAvatar({
  avatarUrl,
  name,
  userId,
  sizeClass = "w-6 h-6",
}: {
  avatarUrl?: string | null;
  name: string;
  userId: string;
  sizeClass?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (avatarUrl && !failed) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`${sizeClass} rounded-full shrink-0 object-cover mt-0.5`}
      />
    );
  }

  const initial = (name.trim() || "?").charAt(0).toUpperCase();

  return (
    <div
      className={`${sizeClass} rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white mt-0.5 select-none`}
      style={{ backgroundColor: colorFor(userId) }}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}

export function ProjectChatPanel({ projectId, onClose }: ProjectChatPanelProps) {
  const [activeTab, setActiveTab] = useState<"messages" | "activity">("messages");
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    loading,
    loadingMore,
    hasMore,
    error,
    sendError,
    sending,
    isAccessRevoked,
    sendMessage,
    loadMore,
  } = useProjectChat({ projectId });

  const { activities, onlineMembers } = useMemberActivity();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (activeTab === "messages") {
      if (typeof messagesEndRef.current?.scrollIntoView === "function") {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages, activeTab]);

  const handleSend = async () => {
    if (!inputText.trim() || sending || isAccessRevoked) return;
    const textToSend = inputText;
    setInputText("");
    const ok = await sendMessage(textToSend);
    if (!ok) {
      setInputText(textToSend); // Restore if send failed
    } else {
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const formatActivityTime = (date: Date) => {
    try {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div
      className="ide-chat-panel flex flex-col h-full w-full bg-[#1e1e1e] border-r border-[#2d2d2d] overflow-hidden select-text text-[#cccccc]"
      data-testid="project-chat-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2d2d2d] bg-[#252526] shrink-0">
        <div className="flex items-center gap-1.5 font-medium text-xs text-[#e1e1e1]">
          <MessageSquare size={14} className="text-blue-400" />
          <span>Project Communication</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded text-[#858585] hover:text-[#cccccc] hover:bg-[#333333] transition-colors"
          title="Close chat panel"
          aria-label="Close chat panel"
        >
          <X size={14} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#2d2d2d] bg-[#1e1e1e] shrink-0" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "messages"}
          onClick={() => setActiveTab("messages")}
          className={`flex-1 py-1.5 px-3 text-xs font-medium border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === "messages"
              ? "border-blue-500 text-white bg-[#252526]"
              : "border-transparent text-[#858585] hover:text-[#cccccc] hover:bg-[#252526]"
          }`}
        >
          <MessageSquare size={13} />
          <span>Messages</span>
          {messages.length > 0 && (
            <span className="text-[10px] bg-[#333333] px-1.5 py-0.2 rounded-full text-[#aaa]">
              {messages.length}
            </span>
          )}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "activity"}
          onClick={() => setActiveTab("activity")}
          className={`flex-1 py-1.5 px-3 text-xs font-medium border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === "activity"
              ? "border-blue-500 text-white bg-[#252526]"
              : "border-transparent text-[#858585] hover:text-[#cccccc] hover:bg-[#252526]"
          }`}
        >
          <Activity size={13} />
          <span>Activity</span>
          <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.2 rounded-full">
            {onlineMembers.length} online
          </span>
        </button>
      </div>

      {/* Revocation Banner */}
      {isAccessRevoked && (
        <div className="bg-[#441818] border-b border-[#772222] px-3 py-2 text-xs text-[#ff9999] flex items-center gap-2 shrink-0">
          <AlertCircle size={14} className="shrink-0 text-red-400" />
          <span>Access revoked. You are no longer a member of this project.</span>
        </div>
      )}

      {/* Tab Panels */}
      {activeTab === "messages" && (
        <div className="flex-1 flex flex-col min-h-0" role="tabpanel">
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {hasMore && (
              <div className="flex justify-center pb-1">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors"
                >
                  {loadingMore ? "Loading earlier messages…" : "Load earlier messages"}
                </button>
              </div>
            )}

            {loading && (
              <div className="text-center py-6 text-xs text-[#858585]">
                Loading conversation…
              </div>
            )}

            {!loading && error && (
              <div className="text-center py-4 text-xs text-red-400 px-2">
                {error}
              </div>
            )}

            {!loading && !error && messages.length === 0 && (
              <div className="text-center py-12 text-xs text-[#858585] space-y-1">
                <p>No messages yet.</p>
                <p className="text-[11px] text-[#666666]">Send a message to start collaborating.</p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className="flex gap-2.5 text-xs">
                {/* Avatar / Initials */}
                <ChatAvatar
                  avatarUrl={msg.senderAvatarUrl}
                  name={msg.senderName}
                  userId={msg.senderUserId}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-semibold text-[#e1e1e1] truncate">
                      {msg.senderName}
                    </span>
                    <span className="text-[10px] text-[#858585] shrink-0">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[#cccccc] break-words whitespace-pre-wrap leading-relaxed">
                    {msg.message}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Send Error */}
          {sendError && (
            <div className="px-3 py-1 text-[11px] text-red-400 bg-[#331111] border-t border-[#552222]">
              {sendError}
            </div>
          )}

          {/* Input Area */}
          <div className="p-2 border-t border-[#2d2d2d] bg-[#252526] shrink-0">
            <div className="flex items-end gap-1.5 bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2 py-1.5 focus-within:border-blue-500">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending || isAccessRevoked}
                placeholder={isAccessRevoked ? "Access revoked" : "Type message… (Enter to send, Shift+Enter for newline)"}
                className="flex-1 bg-transparent border-0 text-xs text-[#cccccc] placeholder-[#666666] focus:outline-none resize-none max-h-24 min-h-[36px]"
                rows={2}
                maxLength={2000}
                aria-label="Chat message input"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!inputText.trim() || sending || isAccessRevoked}
                className="p-1.5 rounded text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 transition-colors shrink-0"
                title="Send message"
                aria-label="Send message"
              >
                <Send size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === "activity" && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4" role="tabpanel">
          {/* Online Members List */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#e1e1e1] mb-2">
              <Users size={13} className="text-emerald-400" />
              <span>Online Members ({onlineMembers.length})</span>
            </div>
            <div className="space-y-1.5">
              {onlineMembers.map((member) => (
                <div
                  key={`${member.id}-${member.connectionId}`}
                  className="flex items-center justify-between p-1.5 rounded bg-[#252526] text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative shrink-0">
                      <ChatAvatar
                        avatarUrl={member.avatar}
                        name={member.name}
                        userId={member.id}
                        sizeClass="w-5 h-5"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-1 ring-[#252526]" />
                    </div>
                    <span className="truncate text-[#cccccc]">
                      {member.name} {member.isSelf && <span className="text-[#888]">(you)</span>}
                    </span>
                  </div>
                </div>
              ))}
              {onlineMembers.length === 0 && (
                <p className="text-xs text-[#858585] italic">No members currently connected.</p>
              )}
            </div>
          </div>

          {/* Session Join / Leave Activity Notices */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#e1e1e1] mb-2">
              <Activity size={13} className="text-blue-400" />
              <span>Session Activity</span>
            </div>
            <div className="space-y-1.5">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-center justify-between text-[11px] p-1.5 rounded bg-[#252526] border border-[#2d2d2d]"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        act.type === "join" ? "bg-emerald-400" : "bg-gray-500"
                      }`}
                    />
                    <span className="text-[#cccccc]">
                      <strong className="text-white">{act.userName}</strong>{" "}
                      {act.type === "join" ? "joined the session" : "left the session"}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#858585] shrink-0 ml-2">
                    {formatActivityTime(act.timestamp)}
                  </span>
                </div>
              ))}
              {activities.length === 0 && (
                <p className="text-xs text-[#858585] italic">No session join/leave events yet.</p>
              )}
            </div>
            <p className="text-[10px] text-[#666666] mt-3">
              Note: Activity reflects live connection events in this room. Temporary disconnects do not affect project membership.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
