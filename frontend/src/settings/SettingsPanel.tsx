import { useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRightLeft,
  Check,
  Code2,
  Eye,
  FileText,
  Laptop,
  LogOut,
  Moon,
  Palette,
  RotateCcw,
  Search,
  Sun,
  Trash2,
  User as UserIcon,
  X,
} from "lucide-react";
import { useInRouterContext, useNavigate } from "react-router";
import {
  listMembers,
  removeMember,
  transferOwnership,
  type ProjectMember,
} from "../api/members";
import { deleteProject } from "../api/projects";
import type { Role } from "../api/types";
import { useSettings } from "./useSettings";
import { THEME_PRESETS } from "./monacoThemes";
import {
  FONT_FAMILY_PRESETS,
  type CursorBlinkingPreference,
  type LineNumbersPreference,
  type ReducedMotionPreference,
  type RenderWhitespacePreference,
  type TabSizePreference,
  type ThemePreference,
  type WordWrapPreference,
} from "./types";
import { AuthContext } from "../auth/context";
import { updateProfile } from "../api/auth";
import UserAvatar from "../components/UserAvatar";

type SettingsCategory = "appearance" | "editor" | "profile" | "files" | "accessibility" | "danger";

export interface SettingsPanelProps {
  projectId?: string;
  projectName?: string;
  projectRole?: Role;
  onRoleChanged?: (newRole: Role) => void;
  onProjectDeleted?: () => void;
}

interface SettingItemDefinition {
  id: string;
  category: SettingsCategory;
  label: string;
  description: string;
  keywords: string[];
}

const SETTING_ITEMS: SettingItemDefinition[] = [
  {
    id: "profile",
    category: "profile",
    label: "Profile & Identity",
    description: "Manage your display name, avatar, and collaborator account information.",
    keywords: ["profile", "name", "account", "user", "avatar", "email"],
  },
  {
    id: "theme",
    category: "appearance",
    label: "Theme",
    description: "Select the visual color theme for Confluo and Monaco Editor.",
    keywords: ["theme", "color", "dark", "light", "system", "appearance", "mode"],
  },
  {
    id: "editorTheme",
    category: "appearance",
    label: "Editor Theme & Palette",
    description: "Choose a syntax and editor color theme (VS Code Dark+, GitHub Dark, One Dark Pro, Dracula, GitHub Light, VS Code Light+).",
    keywords: ["theme", "editor theme", "monaco", "dracula", "github", "one dark", "vs code", "syntax", "colors", "palette"],
  },
  {
    id: "fontSize",
    category: "editor",
    label: "Font Size",
    description: "Controls the font size in pixels (12–24px) for the code editor.",
    keywords: ["font", "size", "editor", "text", "px", "zoom"],
  },
  {
    id: "fontFamily",
    category: "editor",
    label: "Font Family",
    description: "Controls the monospace font family used in the code editor.",
    keywords: ["font", "family", "monospace", "jetbrains", "fira", "consolas", "code"],
  },
  {
    id: "tabSize",
    category: "editor",
    label: "Tab Size",
    description: "The number of spaces equal to a tab character (2, 4, or 8).",
    keywords: ["tab", "size", "spaces", "indent", "indentation"],
  },
  {
    id: "insertSpaces",
    category: "editor",
    label: "Insert Spaces",
    description: "Insert spaces when pressing Tab instead of tab characters.",
    keywords: ["spaces", "tab", "indent", "insert spaces"],
  },
  {
    id: "wordWrap",
    category: "editor",
    label: "Word Wrap",
    description: "Controls how lines wrap in the editor.",
    keywords: ["word", "wrap", "overflow", "line wrap"],
  },
  {
    id: "lineNumbers",
    category: "editor",
    label: "Line Numbers",
    description: "Controls the display of line numbers in the editor margin.",
    keywords: ["line", "numbers", "gutter", "margin"],
  },
  {
    id: "minimap",
    category: "editor",
    label: "Minimap",
    description: "Controls whether the code outline minimap is shown on the side.",
    keywords: ["minimap", "outline", "scroll", "map", "preview"],
  },
  {
    id: "cursorBlinking",
    category: "editor",
    label: "Cursor Blinking",
    description: "Controls the cursor animation style.",
    keywords: ["cursor", "blinking", "animation", "caret", "smooth", "blink"],
  },
  {
    id: "bracketPairColorization",
    category: "editor",
    label: "Bracket Pair Colorization",
    description: "Colorizes matching brackets for easier visual pairing.",
    keywords: ["bracket", "pair", "color", "parentheses", "braces", "rainbow"],
  },
  {
    id: "renderWhitespace",
    category: "editor",
    label: "Render Whitespace",
    description: "Controls how whitespace characters are visually rendered.",
    keywords: ["whitespace", "spaces", "dots", "render whitespace"],
  },
  {
    id: "autosave",
    category: "files",
    label: "File Persistence & Autosave",
    description: "Details regarding workspace synchronization and document persistence.",
    keywords: ["files", "autosave", "save", "sync", "persistence"],
  },
  {
    id: "reducedMotion",
    category: "accessibility",
    label: "Reduced Motion",
    description: "Reduce or disable UI transitions and animations.",
    keywords: ["accessibility", "motion", "animation", "reduced motion", "a11y"],
  },
];

function RouterNavigator({
  onNavigateRef,
}: {
  onNavigateRef: React.RefObject<((to: string) => void) | null>;
}) {
  const navigate = useNavigate();
  useEffect(() => {
    onNavigateRef.current = navigate;
  }, [navigate, onNavigateRef]);
  return null;
}

export function SettingsPanel({
  projectId,
  projectName = "Untitled Project",
  projectRole,
  onRoleChanged,
  onProjectDeleted,
}: SettingsPanelProps = {}) {
  const {
    settings,
    resolvedTheme,
    updateSetting,
    resetSettings,
    isSettingsOpen,
    closeSettings,
  } = useSettings();

  const inRouter = useInRouterContext();
  const navigateRef = useRef<((to: string) => void) | null>(null);

  // Danger zone state
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedNewOwnerId, setSelectedNewOwnerId] = useState("");
  const [transferBusy, setTransferBusy] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [leaveBusy, setLeaveBusy] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [dangerNotification, setDangerNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [activeCategory, setActiveCategory] = useState<SettingsCategory>("appearance");
  const [searchQuery, setSearchQuery] = useState("");
  const [resetConfirm, setResetConfirm] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const auth = useContext(AuthContext);
  const user = auth?.user ?? null;
  const updateUser = auth?.updateUser;

  const [displayName, setDisplayName] = useState(user?.name ?? "");
  const [prevUserName, setPrevUserName] = useState(user?.name);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const eligibleMembers = useMemo(() => {
    return projectMembers.filter(
      (m) => m.userId !== user?.id && m.role !== "OWNER",
    );
  }, [projectMembers, user?.id]);

  const loadMembersForDangerZone = async () => {
    if (!projectId) return;
    setLoadingMembers(true);
    try {
      const data = await listMembers(projectId);
      setProjectMembers(data);
    } catch {
      // ignore
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleOpenTransferModal = () => {
    setSelectedNewOwnerId("");
    setTransferError(null);
    setTransferSuccess(null);
    setTransferModalOpen(true);
    void loadMembersForDangerZone();
  };

  const handleTransferOwnership = async () => {
    if (!projectId || !selectedNewOwnerId) return;
    setTransferBusy(true);
    setTransferError(null);
    try {
      await transferOwnership(projectId, selectedNewOwnerId);
      const targetMember = projectMembers.find(
        (m) => m.userId === selectedNewOwnerId,
      );
      const msg = `Ownership transferred successfully to ${targetMember?.name ?? "selected member"}. You are now an Editor.`;
      setTransferSuccess(msg);
      setDangerNotification({ type: "success", text: msg });
      onRoleChanged?.("EDITOR");
      await loadMembersForDangerZone();
      setTimeout(() => {
        setTransferModalOpen(false);
        setTransferSuccess(null);
      }, 1500);
    } catch (err) {
      setTransferError(
        err instanceof Error ? err.message : "Failed to transfer ownership.",
      );
    } finally {
      setTransferBusy(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectId || deleteInput !== projectName) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteProject(projectId);
      setDeleteModalOpen(false);
      closeSettings();
      onProjectDeleted?.();
      if (navigateRef.current) {
        navigateRef.current("/dashboard");
      } else {
        window.location.assign("/dashboard");
      }
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete project.",
      );
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleLeaveProject = async () => {
    if (!projectId || !user?.id) return;
    setLeaveBusy(true);
    setLeaveError(null);
    try {
      await removeMember(projectId, user.id);
      setLeaveModalOpen(false);
      closeSettings();
      if (navigateRef.current) {
        navigateRef.current("/dashboard");
      } else {
        window.location.assign("/dashboard");
      }
    } catch (err) {
      setLeaveError(
        err instanceof Error ? err.message : "Failed to leave project.",
      );
    } finally {
      setLeaveBusy(false);
    }
  };

  if (user?.name !== prevUserName) {
    setPrevUserName(user?.name);
    setDisplayName(user?.name ?? "");
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !user) return;
    setSavingProfile(true);
    setProfileStatus(null);
    try {
      const updated = await updateProfile(displayName.trim());
      if (updateUser) {
        updateUser(updated);
      }
      setProfileStatus({ type: "success", message: "Profile updated successfully!" });
      setTimeout(() => setProfileStatus(null), 3000);
    } catch {
      setProfileStatus({ type: "error", message: "Failed to update profile name. Please try again." });
    } finally {
      setSavingProfile(false);
    }
  };

  const searchInputId = useId();
  const themeFieldId = useId();
  const editorThemeFieldId = useId();
  const fontSizeFieldId = useId();
  const fontFamilyFieldId = useId();
  const tabSizeFieldId = useId();
  const cursorBlinkingFieldId = useId();
  const renderWhitespaceFieldId = useId();
  const reducedMotionFieldId = useId();

  // Focus search input when panel opens
  useEffect(() => {
    if (isSettingsOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isSettingsOpen]);

  // Handle Escape key to close panel
  useEffect(() => {
    if (!isSettingsOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        closeSettings();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeSettings, isSettingsOpen]);

  const allSettingItems = useMemo(() => {
    if (!projectId) return SETTING_ITEMS;
    return [
      ...SETTING_ITEMS,
      {
        id: "transferOwnership",
        category: "danger" as SettingsCategory,
        label: "Transfer Ownership",
        description: "Transfer project ownership to another member.",
        keywords: ["transfer", "owner", "ownership", "danger"],
      },
      {
        id: "leaveProject",
        category: "danger" as SettingsCategory,
        label: "Leave Project",
        description: "Leave this project workspace.",
        keywords: ["leave", "exit", "danger", "project"],
      },
      {
        id: "deleteProject",
        category: "danger" as SettingsCategory,
        label: "Delete Project",
        description: "Permanently delete this project and all collaborative assets.",
        keywords: ["delete", "remove", "danger", "destroy", "project"],
      },
    ];
  }, [projectId]);

  // Filter items based on search query
  const filteredItemIds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null; // null means no active filter
    return new Set(
      allSettingItems.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.keywords.some((k) => k.includes(q)),
      ).map((item) => item.id),
    );
  }, [allSettingItems, searchQuery]);

  if (!isSettingsOpen) {
    return null;
  }

  const matchesFilter = (id: string) => {
    if (!filteredItemIds) return true;
    return filteredItemIds.has(id);
  };

  const handleReset = () => {
    resetSettings();
    setResetConfirm(true);
    setTimeout(() => setResetConfirm(false), 2000);
  };

  return (
    <div
      className="ide-settings-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="IDE Settings"
      ref={panelRef}
    >
      <div className="ide-settings-container">
        {inRouter && <RouterNavigator onNavigateRef={navigateRef} />}
        {/* Header */}
        <header className="ide-settings-header">
          <div className="ide-settings-title-group">
            <h2 className="ide-settings-title">Settings</h2>
            <span className="ide-settings-subtitle">Personalize your Confluo workspace</span>
          </div>

          <div className="ide-settings-search-wrapper">
            <Search size={15} className="ide-settings-search-icon" aria-hidden="true" />
            <input
              ref={searchInputRef}
              id={searchInputId}
              type="search"
              className="ide-settings-search-input"
              placeholder="Search settings (e.g. font, theme, wrap)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search settings"
            />
            {searchQuery && (
              <button
                type="button"
                className="ide-settings-search-clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="ide-settings-header-actions">
            <button
              type="button"
              className="ide-settings-reset-button"
              onClick={handleReset}
              title="Reset all settings to default values"
              aria-label="Reset to default settings"
            >
              <RotateCcw size={14} />
              <span>{resetConfirm ? "Defaults restored!" : "Reset to defaults"}</span>
            </button>
            <button
              type="button"
              className="ide-settings-close-button"
              onClick={closeSettings}
              aria-label="Close settings"
              title="Close settings (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Body: Sidebar navigation + Content */}
        <div className="ide-settings-body">
          {/* Navigation Sidebar */}
          <nav className="ide-settings-nav" aria-label="Settings categories">
            <button
              type="button"
              className={`ide-settings-nav-item ${activeCategory === "appearance" && !searchQuery ? "is-active" : ""}`}
              onClick={() => {
                setActiveCategory("appearance");
                setSearchQuery("");
              }}
            >
              <Palette size={16} />
              <span>Appearance</span>
            </button>

            <button
              type="button"
              className={`ide-settings-nav-item ${activeCategory === "editor" && !searchQuery ? "is-active" : ""}`}
              onClick={() => {
                setActiveCategory("editor");
                setSearchQuery("");
              }}
            >
              <Code2 size={16} />
              <span>Editor</span>
            </button>

            <button
              type="button"
              className={`ide-settings-nav-item ${activeCategory === "profile" && !searchQuery ? "is-active" : ""}`}
              onClick={() => {
                setActiveCategory("profile");
                setSearchQuery("");
              }}
            >
              <UserIcon size={16} />
              <span>Profile</span>
            </button>

            <button
              type="button"
              className={`ide-settings-nav-item ${activeCategory === "files" && !searchQuery ? "is-active" : ""}`}
              onClick={() => {
                setActiveCategory("files");
                setSearchQuery("");
              }}
            >
              <FileText size={16} />
              <span>Files</span>
            </button>

            <button
              type="button"
              className={`ide-settings-nav-item ${activeCategory === "accessibility" && !searchQuery ? "is-active" : ""}`}
              onClick={() => {
                setActiveCategory("accessibility");
                setSearchQuery("");
              }}
            >
              <Eye size={16} />
              <span>Accessibility</span>
            </button>

            {projectId && (
              <button
                type="button"
                className={`ide-settings-nav-item ${activeCategory === "danger" && !searchQuery ? "is-active" : ""}`}
                style={{ color: "#f87171" }}
                onClick={() => {
                  setActiveCategory("danger");
                  setSearchQuery("");
                }}
              >
                <AlertTriangle size={16} style={{ color: "#f87171" }} />
                <span>Danger Zone</span>
              </button>
            )}
          </nav>

          {/* Settings Content Area */}
          <main className="ide-settings-content" tabIndex={0} aria-label="Settings options">
            {/* Appearance Section */}
            {(searchQuery ? matchesFilter("theme") : activeCategory === "appearance") && (
              <section className="ide-settings-section" aria-labelledby="section-appearance">
                <h3 id="section-appearance" className="ide-settings-section-title">
                  <Palette size={18} /> Appearance
                </h3>

                {matchesFilter("theme") && (
                  <div className="ide-setting-row">
                    <div className="ide-setting-info">
                      <label htmlFor={themeFieldId} className="ide-setting-label">Color Theme</label>
                      <p className="ide-setting-description">
                        Select dark, light, or follow your operating system preferences. Applies instantly to both the interface and the Monaco code editor.
                      </p>
                    </div>
                    <div className="ide-setting-control">
                      <div className="ide-theme-options" role="radiogroup" aria-labelledby={themeFieldId}>
                        {(
                          [
                            { value: "dark", label: "Dark", icon: Moon },
                            { value: "light", label: "Light", icon: Sun },
                            { value: "system", label: "System", icon: Laptop },
                          ] as const
                        ).map(({ value, label, icon: Icon }) => (
                          <button
                            key={value}
                            type="button"
                            role="radio"
                            aria-checked={settings.theme === value}
                            className={`ide-theme-card ${settings.theme === value ? "is-active" : ""}`}
                            onClick={() => updateSetting("theme", value as ThemePreference)}
                          >
                            <Icon size={18} />
                            <span>{label}</span>
                            {settings.theme === value && <Check size={14} className="ide-check-icon" />}
                          </button>
                        ))}
                      </div>
                      <span className="ide-setting-hint">
                        Currently resolved: <strong>{resolvedTheme} mode</strong>
                      </span>
                    </div>
                  </div>
                )}

                {matchesFilter("editorTheme") && (
                  <div className="ide-setting-row ide-setting-row-vertical">
                    <div className="ide-setting-info">
                      <label id={editorThemeFieldId} className="ide-setting-label">Editor & Syntax Theme</label>
                      <p className="ide-setting-description">
                        Select a syntax color palette and coordinated styling for the editor and workspace.
                      </p>
                    </div>
                    <div className="ide-setting-control">
                      <div className="ide-editor-theme-grid" role="radiogroup" aria-labelledby={editorThemeFieldId}>
                        {THEME_PRESETS.map((preset) => {
                          const isActive = settings.editorTheme === preset.id;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              role="radio"
                              aria-checked={isActive}
                              className={`ide-editor-theme-card ${isActive ? "is-active" : ""}`}
                              onClick={() => {
                                updateSetting("editorTheme", preset.id);
                                if (preset.type === "dark" && resolvedTheme === "light") {
                                  updateSetting("theme", "dark");
                                } else if (preset.type === "light" && resolvedTheme === "dark") {
                                  updateSetting("theme", "light");
                                }
                              }}
                            >
                              <div
                                className="ide-theme-swatch"
                                style={{ backgroundColor: preset.bg }}
                              >
                                <span className="ide-theme-swatch-dot" style={{ backgroundColor: preset.accent }} />
                              </div>
                              <div className="ide-theme-card-text">
                                <span className="ide-theme-card-title">{preset.name}</span>
                                <span className="ide-theme-card-desc">{preset.description}</span>
                              </div>
                              {isActive && <Check size={16} className="ide-check-icon" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Editor Section */}
            {(searchQuery
              ? [
                  "fontSize",
                  "fontFamily",
                  "tabSize",
                  "insertSpaces",
                  "wordWrap",
                  "lineNumbers",
                  "minimap",
                  "cursorBlinking",
                  "bracketPairColorization",
                  "renderWhitespace",
                ].some((id) => matchesFilter(id))
              : activeCategory === "editor") && (
              <section className="ide-settings-section" aria-labelledby="section-editor">
                <h3 id="section-editor" className="ide-settings-section-title">
                  <Code2 size={18} /> Editor
                </h3>

                {/* Font Size */}
                {matchesFilter("fontSize") && (
                  <div className="ide-setting-row">
                    <div className="ide-setting-info">
                      <label htmlFor={fontSizeFieldId} className="ide-setting-label">Font Size</label>
                      <p className="ide-setting-description">
                        Controls the font size in pixels (12px to 24px).
                      </p>
                    </div>
                    <div className="ide-setting-control ide-range-control">
                      <input
                        id={fontSizeFieldId}
                        type="range"
                        min="12"
                        max="24"
                        step="1"
                        value={settings.fontSize}
                        onChange={(e) => updateSetting("fontSize", Number(e.target.value))}
                        className="ide-settings-range"
                        aria-label="Font size in pixels"
                      />
                      <input
                        type="number"
                        min="12"
                        max="24"
                        value={settings.fontSize}
                        onChange={(e) => updateSetting("fontSize", Number(e.target.value))}
                        className="ide-settings-number-input"
                        aria-label="Font size numerical input"
                      />
                      <span className="ide-control-unit">px</span>
                    </div>
                  </div>
                )}

                {/* Font Family */}
                {matchesFilter("fontFamily") && (
                  <div className="ide-setting-row">
                    <div className="ide-setting-info">
                      <label htmlFor={fontFamilyFieldId} className="ide-setting-label">Font Family</label>
                      <p className="ide-setting-description">
                        Controls the monospace font used in the editor with sensible fallbacks.
                      </p>
                    </div>
                    <div className="ide-setting-control">
                      <select
                        id={fontFamilyFieldId}
                        value={settings.fontFamily}
                        onChange={(e) => updateSetting("fontFamily", e.target.value)}
                        className="ide-settings-select"
                        aria-label="Editor font family preset"
                      >
                        {FONT_FAMILY_PRESETS.map((preset) => (
                          <option key={preset.value} value={preset.value}>
                            {preset.label}
                          </option>
                        ))}
                      </select>
                      <div className="ide-font-preview" style={{ fontFamily: settings.fontFamily }}>
                        const answer = 42; // ABCdef 0123
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab Size */}
                {matchesFilter("tabSize") && (
                  <div className="ide-setting-row">
                    <div className="ide-setting-info">
                      <label htmlFor={tabSizeFieldId} className="ide-setting-label">Tab Size</label>
                      <p className="ide-setting-description">
                        The number of spaces equal to a tab.
                      </p>
                    </div>
                    <div className="ide-setting-control">
                      <div className="ide-segmented-control" role="group" aria-label="Tab size">
                        {([2, 4, 8] as const).map((size) => (
                          <button
                            key={size}
                            type="button"
                            className={`ide-segmented-button ${settings.tabSize === size ? "is-active" : ""}`}
                            onClick={() => updateSetting("tabSize", size as TabSizePreference)}
                            aria-pressed={settings.tabSize === size}
                          >
                            {size} spaces
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Insert Spaces */}
                {matchesFilter("insertSpaces") && (
                  <div className="ide-setting-row">
                    <div className="ide-setting-info">
                      <span className="ide-setting-label">Insert Spaces</span>
                      <p className="ide-setting-description">
                        Insert spaces when pressing Tab instead of tab characters.
                      </p>
                    </div>
                    <div className="ide-setting-control">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={settings.insertSpaces}
                        className={`ide-switch ${settings.insertSpaces ? "is-on" : ""}`}
                        onClick={() => updateSetting("insertSpaces", !settings.insertSpaces)}
                        aria-label="Insert spaces instead of tabs"
                      >
                        <span className="ide-switch-thumb" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Word Wrap */}
                {matchesFilter("wordWrap") && (
                  <div className="ide-setting-row">
                    <div className="ide-setting-info">
                      <span className="ide-setting-label">Word Wrap</span>
                      <p className="ide-setting-description">
                        Lines will wrap at the viewport boundary when enabled.
                      </p>
                    </div>
                    <div className="ide-setting-control">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={settings.wordWrap === "on"}
                        className={`ide-switch ${settings.wordWrap === "on" ? "is-on" : ""}`}
                        onClick={() =>
                          updateSetting("wordWrap", (settings.wordWrap === "on" ? "off" : "on") as WordWrapPreference)
                        }
                        aria-label="Toggle word wrap"
                      >
                        <span className="ide-switch-thumb" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Line Numbers */}
                {matchesFilter("lineNumbers") && (
                  <div className="ide-setting-row">
                    <div className="ide-setting-info">
                      <span className="ide-setting-label">Line Numbers</span>
                      <p className="ide-setting-description">
                        Display line numbers in the editor left gutter.
                      </p>
                    </div>
                    <div className="ide-setting-control">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={settings.lineNumbers === "on"}
                        className={`ide-switch ${settings.lineNumbers === "on" ? "is-on" : ""}`}
                        onClick={() =>
                          updateSetting(
                            "lineNumbers",
                            (settings.lineNumbers === "on" ? "off" : "on") as LineNumbersPreference,
                          )
                        }
                        aria-label="Toggle line numbers"
                      >
                        <span className="ide-switch-thumb" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Minimap */}
                {matchesFilter("minimap") && (
                  <div className="ide-setting-row">
                    <div className="ide-setting-info">
                      <span className="ide-setting-label">Minimap</span>
                      <p className="ide-setting-description">
                        Shows a high-level code overview scrollbar on the right.
                      </p>
                    </div>
                    <div className="ide-setting-control">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={settings.minimap}
                        className={`ide-switch ${settings.minimap ? "is-on" : ""}`}
                        onClick={() => updateSetting("minimap", !settings.minimap)}
                        aria-label="Toggle minimap"
                      >
                        <span className="ide-switch-thumb" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Cursor Blinking */}
                {matchesFilter("cursorBlinking") && (
                  <div className="ide-setting-row">
                    <div className="ide-setting-info">
                      <label htmlFor={cursorBlinkingFieldId} className="ide-setting-label">Cursor Blinking</label>
                      <p className="ide-setting-description">
                        Controls the visual animation of the editor cursor.
                      </p>
                    </div>
                    <div className="ide-setting-control">
                      <select
                        id={cursorBlinkingFieldId}
                        value={settings.cursorBlinking}
                        onChange={(e) =>
                          updateSetting("cursorBlinking", e.target.value as CursorBlinkingPreference)
                        }
                        className="ide-settings-select"
                        aria-label="Cursor blinking style"
                      >
                        <option value="blink">Blink</option>
                        <option value="smooth">Smooth</option>
                        <option value="phase">Phase</option>
                        <option value="expand">Expand</option>
                        <option value="solid">Solid</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Bracket Pair Colorization */}
                {matchesFilter("bracketPairColorization") && (
                  <div className="ide-setting-row">
                    <div className="ide-setting-info">
                      <span className="ide-setting-label">Bracket Pair Colorization</span>
                      <p className="ide-setting-description">
                        Assigns distinct colors to matching pairs of brackets, parentheses, and braces.
                      </p>
                    </div>
                    <div className="ide-setting-control">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={settings.bracketPairColorization}
                        className={`ide-switch ${settings.bracketPairColorization ? "is-on" : ""}`}
                        onClick={() =>
                          updateSetting("bracketPairColorization", !settings.bracketPairColorization)
                        }
                        aria-label="Toggle bracket pair colorization"
                      >
                        <span className="ide-switch-thumb" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Render Whitespace */}
                {matchesFilter("renderWhitespace") && (
                  <div className="ide-setting-row">
                    <div className="ide-setting-info">
                      <label htmlFor={renderWhitespaceFieldId} className="ide-setting-label">Render Whitespace</label>
                      <p className="ide-setting-description">
                        Controls whether space and tab characters are shown visually.
                      </p>
                    </div>
                    <div className="ide-setting-control">
                      <select
                        id={renderWhitespaceFieldId}
                        value={settings.renderWhitespace}
                        onChange={(e) =>
                          updateSetting("renderWhitespace", e.target.value as RenderWhitespacePreference)
                        }
                        className="ide-settings-select"
                        aria-label="Render whitespace option"
                      >
                        <option value="none">None</option>
                        <option value="selection">Selection</option>
                        <option value="all">All</option>
                      </select>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Profile Section */}
            {(searchQuery ? matchesFilter("profile") : activeCategory === "profile") && (
              <section className="ide-settings-section" aria-labelledby="section-profile">
                <h3 id="section-profile" className="ide-settings-section-title">
                  <UserIcon size={18} /> Profile & Identity
                </h3>

                {user ? (
                  <>
                    <div className="ide-setting-row ide-setting-row-vertical">
                      <div className="ide-profile-card">
                        <div className="ide-profile-avatar-wrapper">
                          <UserAvatar user={user} className="h-14 w-14 text-base ring-2 ring-white/10" />
                        </div>
                        <div className="ide-profile-details">
                          <div className="ide-profile-header">
                            <span className="ide-profile-name">{user.name}</span>
                            <span className="ide-profile-badge">{user.provider || "local"}</span>
                          </div>
                          <span className="ide-profile-email">{user.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="ide-setting-row">
                      <div className="ide-setting-info">
                        <label htmlFor="profile-display-name" className="ide-setting-label">
                          Display Name
                        </label>
                        <p className="ide-setting-description">
                          Your name shown to collaborators, on active cursors, comments, and in shared projects.
                        </p>
                      </div>
                      <div className="ide-setting-control">
                        <form onSubmit={handleSaveProfile} className="ide-profile-form">
                          <div className="ide-profile-input-group">
                            <input
                              id="profile-display-name"
                              type="text"
                              value={displayName}
                              onChange={(e) => setDisplayName(e.target.value)}
                              placeholder="Enter your name"
                              className="ide-profile-input"
                              maxLength={60}
                              required
                            />
                            <button
                              type="submit"
                              disabled={savingProfile || !displayName.trim() || displayName.trim() === user.name}
                              className="ide-profile-save-btn"
                            >
                              {savingProfile ? "Saving..." : "Save Name"}
                            </button>
                          </div>
                          {profileStatus && (
                            <span
                              className={`ide-profile-status ${
                                profileStatus.type === "success" ? "is-success" : "is-error"
                              }`}
                            >
                              {profileStatus.message}
                            </span>
                          )}
                        </form>
                      </div>
                    </div>

                    <div className="ide-setting-row">
                      <div className="ide-setting-info">
                        <span className="ide-setting-label">Account Email</span>
                        <p className="ide-setting-description">
                          Email address linked to your account.
                        </p>
                      </div>
                      <div className="ide-setting-control">
                        <span className="ide-profile-static-field">{user.email}</span>
                      </div>
                    </div>

                    <div className="ide-setting-row">
                      <div className="ide-setting-info">
                        <span className="ide-setting-label">Authentication Method</span>
                        <p className="ide-setting-description">
                          Identity provider used to secure and authenticate this session.
                        </p>
                      </div>
                      <div className="ide-setting-control">
                        <span className="ide-profile-provider-pill">
                          {user.provider ? user.provider.toUpperCase() : "PASSWORD"}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="ide-setting-row">
                    <div className="ide-setting-info">
                      <span className="ide-setting-label">Guest Session</span>
                      <p className="ide-setting-description">
                        You are currently in guest or anonymous preview mode. Sign in to edit your profile, personalize avatar settings, and persist configurations across devices.
                      </p>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Files Section */}
            {(searchQuery ? matchesFilter("autosave") : activeCategory === "files") && (
              <section className="ide-settings-section" aria-labelledby="section-files">
                <h3 id="section-files" className="ide-settings-section-title">
                  <FileText size={18} /> Files
                </h3>

                <div className="ide-setting-row">
                  <div className="ide-setting-info">
                    <span className="ide-setting-label">Real-time CRDT Synchronization</span>
                    <p className="ide-setting-description">
                      All workspace modifications, files, and editor keystrokes are synchronized in real-time using Yjs and Liveblocks over WebSockets.
                    </p>
                    <div className="ide-callout-notice">
                      <strong>Note on traditional autosave:</strong> In Confluo, content updates are continuous and persistent through the collaborative room session. Discrete interval autosaving to local disk is not applicable to the live collaborative workspace and is deferred for future offline or export capabilities.
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Accessibility Section */}
            {(searchQuery ? matchesFilter("reducedMotion") : activeCategory === "accessibility") && (
              <section className="ide-settings-section" aria-labelledby="section-accessibility">
                <h3 id="section-accessibility" className="ide-settings-section-title">
                  <Eye size={18} /> Accessibility
                </h3>

                {matchesFilter("reducedMotion") && (
                  <div className="ide-setting-row">
                    <div className="ide-setting-info">
                      <label htmlFor={reducedMotionFieldId} className="ide-setting-label">Reduced Motion</label>
                      <p className="ide-setting-description">
                        Minimize UI transitions and animations across the IDE. By default, Confluo automatically respects your operating system setting.
                      </p>
                    </div>
                    <div className="ide-setting-control">
                      <select
                        id={reducedMotionFieldId}
                        value={settings.reducedMotion}
                        onChange={(e) =>
                          updateSetting("reducedMotion", e.target.value as ReducedMotionPreference)
                        }
                        className="ide-settings-select"
                        aria-label="Reduced motion preference"
                      >
                        <option value="system">Follow System Preference (Default)</option>
                        <option value="reduce">Reduce Motion</option>
                        <option value="no-preference">Allow Full Animations</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="ide-setting-row">
                  <div className="ide-setting-info">
                    <span className="ide-setting-label">Keyboard Navigation & Focus Indicators</span>
                    <p className="ide-setting-description">
                      All settings controls feature high-contrast visible focus rings, aria labels, and can be fully navigated via Tab, Shift+Tab, Arrow keys, and Escape.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Danger Zone Section */}
            {projectId && (searchQuery ? (matchesFilter("transferOwnership") || matchesFilter("leaveProject") || matchesFilter("deleteProject")) : activeCategory === "danger") && (
              <section className="ide-settings-section" aria-labelledby="section-danger">
                <h3 id="section-danger" className="ide-settings-section-title" style={{ color: "#f87171" }}>
                  <AlertTriangle size={18} style={{ color: "#f87171" }} /> Danger Zone
                </h3>

                {dangerNotification && (
                  <div
                    role="status"
                    className={`p-3 rounded-lg border text-xs font-mono flex items-center justify-between ${
                      dangerNotification.type === "success"
                        ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                        : "bg-red-950/40 border-red-800 text-red-300"
                    }`}
                  >
                    <span>{dangerNotification.text}</span>
                    <button
                      type="button"
                      onClick={() => setDangerNotification(null)}
                      className="text-zinc-400 hover:text-white"
                      aria-label="Dismiss message"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Transfer Ownership Card */}
                {matchesFilter("transferOwnership") && (
                  <div className="ide-setting-row" style={{ alignItems: "flex-start" }}>
                    <div className="ide-setting-info">
                      <span className="ide-setting-label">Transfer Project Ownership</span>
                      <p className="ide-setting-description">
                        Transfer project ownership to another existing member. You will automatically become an Editor.
                      </p>
                      {projectRole !== "OWNER" && (
                        <p className="text-xs text-zinc-500 mt-1 italic">
                          Only the project owner can transfer ownership.
                        </p>
                      )}
                    </div>
                    <div className="ide-setting-control">
                      {projectRole === "OWNER" ? (
                        <button
                          type="button"
                          onClick={handleOpenTransferModal}
                          className="px-3 py-1.5 rounded-lg border border-amber-600/50 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40 font-mono text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <ArrowRightLeft size={14} />
                          <span>Transfer Ownership</span>
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 rounded text-[11px] font-mono bg-zinc-800 text-zinc-500 border border-zinc-700">
                          Owner only
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Leave Project Card */}
                {matchesFilter("leaveProject") && (
                  <div className="ide-setting-row" style={{ alignItems: "flex-start" }}>
                    <div className="ide-setting-info">
                      <span className="ide-setting-label">Leave Project</span>
                      <p className="ide-setting-description">
                        Remove yourself from this project workspace.
                      </p>
                      {projectRole === "OWNER" ? (
                        <div className="mt-2 p-2.5 rounded border border-amber-900/40 bg-amber-950/20 text-amber-300/90 text-xs">
                          <strong>Owner Notice:</strong> Transfer ownership before leaving the project. The owner cannot leave without transferring ownership.
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-500 mt-1">
                          You will lose access to all files and discussions in this workspace until re-invited.
                        </p>
                      )}
                    </div>
                    <div className="ide-setting-control">
                      {projectRole === "OWNER" ? (
                        <button
                          type="button"
                          disabled
                          title="Transfer ownership before leaving the project"
                          className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800/50 text-zinc-500 font-mono text-xs cursor-not-allowed flex items-center gap-1.5"
                        >
                          <LogOut size={14} />
                          <span>Leave Project</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setLeaveError(null);
                            setLeaveModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-red-800/50 bg-red-950/30 text-red-300 hover:bg-red-900/40 font-mono text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <LogOut size={14} />
                          <span>Leave Project</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Delete Project Card */}
                {matchesFilter("deleteProject") && (
                  <div className="ide-setting-row" style={{ alignItems: "flex-start" }}>
                    <div className="ide-setting-info">
                      <span className="ide-setting-label" style={{ color: "#f87171" }}>Delete Project</span>
                      <p className="ide-setting-description">
                        Permanently delete this project workspace, files, and collaborative room history. This action cannot be reversed.
                      </p>
                      {projectRole !== "OWNER" && (
                        <p className="text-xs text-zinc-500 mt-1 italic">
                          Only the project owner can delete this project.
                        </p>
                      )}
                    </div>
                    <div className="ide-setting-control">
                      {projectRole === "OWNER" ? (
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteInput("");
                            setDeleteError(null);
                            setDeleteModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-red-600 bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                        >
                          <Trash2 size={14} />
                          <span>Delete Project</span>
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 rounded text-[11px] font-mono bg-zinc-800 text-zinc-500 border border-zinc-700">
                          Owner only
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Empty Search Results */}
            {searchQuery && filteredItemIds && filteredItemIds.size === 0 && (
              <div className="ide-settings-empty">
                <p>No settings matching "{searchQuery}"</p>
                <button
                  type="button"
                  className="ide-settings-clear-search-btn"
                  onClick={() => setSearchQuery("")}
                >
                  Clear search
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
      {/* Transfer Ownership Modal */}
      {transferModalOpen && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => {
            if (!transferBusy) setTransferModalOpen(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#121214] p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-amber-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-950/60 border border-amber-800/60">
                <ArrowRightLeft size={20} />
              </div>
              <div>
                <h3 className="font-display text-sm font-semibold text-white">
                  Transfer Ownership
                </h3>
                <p className="font-mono text-[11px] text-zinc-400">
                  Choose a member to become the new project owner
                </p>
              </div>
            </div>

            {transferError && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 font-mono text-xs">
                {transferError}
              </div>
            )}

            {transferSuccess && (
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 font-mono text-xs">
                {transferSuccess}
              </div>
            )}

            {loadingMembers ? (
              <p className="font-mono text-xs text-zinc-400 py-3">Loading project members…</p>
            ) : eligibleMembers.length === 0 ? (
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 text-center space-y-2">
                <p className="font-mono text-xs text-zinc-300">
                  No eligible members found in this project.
                </p>
                <p className="text-[11px] text-zinc-500">
                  You must first invite a collaborator using the Share menu before transferring ownership.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <label htmlFor="select-new-owner-input" className="block font-mono text-xs text-zinc-300">
                  Select new owner:
                </label>
                <select
                  id="select-new-owner-input"
                  value={selectedNewOwnerId}
                  onChange={(e) => setSelectedNewOwnerId(e.target.value)}
                  disabled={transferBusy}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-xs text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="">-- Choose a collaborator --</option>
                  {eligibleMembers.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.name} ({m.email || "no email"}) · Current role: {m.role}
                    </option>
                  ))}
                </select>

                <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/40 text-amber-300/90 text-xs space-y-1">
                  <p className="font-semibold">Important:</p>
                  <p>• The selected member will become the sole <strong>OWNER</strong>.</p>
                  <p>• Your role will automatically become <strong>EDITOR</strong>.</p>
                  <p>• You will not be removed from the project.</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTransferModalOpen(false)}
                disabled={transferBusy}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 font-mono text-xs text-white hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTransferOwnership}
                disabled={!selectedNewOwnerId || transferBusy}
                className="rounded-lg border border-amber-600 bg-amber-600 px-4 py-2 font-mono text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-40 transition-colors"
              >
                {transferBusy ? "Transferring…" : "Confirm Transfer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Project Modal */}
      {deleteModalOpen && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => {
            if (!deleteBusy) setDeleteModalOpen(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#121214] p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-red-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-950/60 border border-red-800/60">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-display text-sm font-semibold text-white">
                  Delete Project Workspace
                </h3>
                <p className="font-mono text-[11px] text-zinc-400">
                  This action is permanent and cannot be undone
                </p>
              </div>
            </div>

            <p className="font-mono text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-white">"{projectName}"</strong>? All
              collaborative files, CRDT history, and active rooms will be removed.
            </p>

            <div className="space-y-1.5">
              <label htmlFor="confirm-delete-project-field" className="block font-mono text-xs text-zinc-400">
                Please type <strong className="text-white select-all">{projectName}</strong> to confirm:
              </label>
              <input
                id="confirm-delete-project-field"
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder={projectName}
                disabled={deleteBusy}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-xs text-white placeholder-zinc-600 focus:border-red-500 focus:outline-none"
              />
            </div>

            {deleteError && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 font-mono text-xs">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDeleteError(null);
                }}
                disabled={deleteBusy}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 font-mono text-xs text-white hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProject}
                disabled={deleteInput !== projectName || deleteBusy}
                className="rounded-lg border border-red-600 bg-red-600 px-4 py-2 font-mono text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-40 transition-colors"
              >
                {deleteBusy ? "Deleting…" : "Delete Project"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Project Modal */}
      {leaveModalOpen && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => {
            if (!leaveBusy) setLeaveModalOpen(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#121214] p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-red-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-950/60 border border-red-800/60">
                <LogOut size={20} />
              </div>
              <div>
                <h3 className="font-display text-sm font-semibold text-white">
                  Leave Project
                </h3>
                <p className="font-mono text-[11px] text-zinc-400">
                  Confirm leaving this collaborative workspace
                </p>
              </div>
            </div>

            <p className="font-mono text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to leave <strong className="text-white">"{projectName}"</strong>?
              You will lose access to all files and room communications until another member re-invites you.
            </p>

            {leaveError && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 font-mono text-xs">
                {leaveError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setLeaveModalOpen(false);
                  setLeaveError(null);
                }}
                disabled={leaveBusy}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 font-mono text-xs text-white hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLeaveProject}
                disabled={leaveBusy}
                className="rounded-lg border border-red-600 bg-red-600 px-4 py-2 font-mono text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50 transition-colors"
              >
                {leaveBusy ? "Leaving…" : "Leave Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}