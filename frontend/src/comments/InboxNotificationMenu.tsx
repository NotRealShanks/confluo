import { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck, MessageSquare, Trash2, X } from "lucide-react";
import {
  useDeleteInboxNotification,
  useInboxNotifications,
  useMarkAllInboxNotificationsAsRead,
  useMarkInboxNotificationAsRead,
  useThreads,
} from "@liveblocks/react/suspense";
import { extractCommentText, formatCommentTime, type CodeThreadMetadata } from "./types";
import { colorFor } from "../lib/color";

export interface InboxNotificationMenuProps {
  onNavigateToComment?: (fileId: string, lineNumber: number) => void;
}

export function InboxNotificationMenu({ onNavigateToComment }: InboxNotificationMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { inboxNotifications } = useInboxNotifications();
  const { threads } = useThreads();
  const markAsRead = useMarkInboxNotificationAsRead();
  const markAllAsRead = useMarkAllInboxNotificationsAsRead();
  const deleteNotification = useDeleteInboxNotification();

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const unreadCount = inboxNotifications.filter((n) => !n.readAt).length;

  const handleNotificationClick = (notification: any) => {
    if (!notification.readAt) {
      markAsRead(notification.id);
    }

    if (notification.threadId && onNavigateToComment) {
      const thread = (threads as any[]).find((t) => t.id === notification.threadId);
      const meta = thread?.metadata as CodeThreadMetadata | undefined;
      if (meta?.fileId && typeof meta.lineNumber === "number") {
        onNavigateToComment(meta.fileId, meta.lineNumber);
        setIsOpen(false);
      }
    }
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`ide-inbox-bell-btn relative p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors ${
          isOpen ? "bg-white/10 text-white" : ""
        }`}
        title="Inbox notifications"
        aria-label={`Inbox notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="ide-inbox-badge absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="ide-inbox-popover absolute right-0 mt-2 w-80 sm:w-96 rounded-lg shadow-2xl border border-[#333333] bg-[#1e1e1e] text-[#cccccc] z-50 overflow-hidden flex flex-col max-h-[480px]"
          role="dialog"
          aria-label="Inbox notifications"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#2d2d2d] bg-[#252526]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
              <Bell size={13} className="text-blue-400" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-blue-900/60 text-blue-300 border border-blue-700/50 px-1.5 py-0.2 rounded-full font-normal">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllAsRead()}
                  className="text-[11px] text-gray-400 hover:text-blue-400 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/5 transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck size={12} />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close notifications"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#2d2d2d]">
            {inboxNotifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500 flex flex-col items-center gap-2">
                <Bell size={24} className="stroke-[1.5] text-gray-600" />
                <span>You're all caught up!</span>
                <span className="text-[11px] text-gray-600">No new notifications</span>
              </div>
            ) : (
              inboxNotifications.map((notification) => {
                const isUnread = !notification.readAt;
                const thread = (threads as any[]).find((t) => t.id === (notification as any).threadId);
                const meta = thread?.metadata as CodeThreadMetadata | undefined;
                const latestComment = thread?.comments?.[thread.comments.length - 1];
                const snippet = latestComment
                  ? extractCommentText(latestComment.body)
                  : "Comment in project";

                return (
                  <div
                    key={notification.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleNotificationClick(notification)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleNotificationClick(notification);
                      }
                    }}
                    className={`p-3 text-xs cursor-pointer transition-colors flex items-start gap-2.5 ${
                      isUnread
                        ? "bg-[#252830] hover:bg-[#2b303c]"
                        : "bg-[#1e1e1e] hover:bg-[#252526]"
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white mt-0.5"
                      style={{
                        backgroundColor: latestComment
                          ? colorFor(latestComment.userId)
                          : "#2563eb",
                      }}
                    >
                      {latestComment?.userId?.charAt(0).toUpperCase() || "?"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-semibold text-white truncate">
                          {latestComment?.userId || "Collaborator"}
                        </span>
                        <span className="text-[10px] text-gray-500 shrink-0">
                          {formatCommentTime(notification.notifiedAt)}
                        </span>
                      </div>

                      <p className="text-[#a0a0a0] line-clamp-2 text-[11.5px] leading-snug mb-1">
                        {snippet}
                      </p>

                      {meta?.lineNumber && (
                        <div className="flex items-center gap-1.5 text-[10.5px] text-blue-400">
                          <MessageSquare size={10} />
                          <span>Line {meta.lineNumber}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0 self-center">
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-blue-500" title="Unread" />
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-white/10 transition-colors"
                        title="Delete notification"
                        aria-label="Delete notification"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
