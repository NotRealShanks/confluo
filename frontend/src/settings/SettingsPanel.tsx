import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Check,
  Code2,
  Eye,
  FileText,
  Laptop,
  Moon,
  Palette,
  RotateCcw,
  Search,
  Sun,
  X,
} from "lucide-react";
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

type SettingsCategory = "appearance" | "editor" | "files" | "accessibility";

interface SettingItemDefinition {
  id: string;
  category: SettingsCategory;
  label: string;
  description: string;
  keywords: string[];
}

const SETTING_ITEMS: SettingItemDefinition[] = [
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

export function SettingsPanel() {
  const {
    settings,
    resolvedTheme,
    updateSetting,
    resetSettings,
    isSettingsOpen,
    closeSettings,
  } = useSettings();

  const [activeCategory, setActiveCategory] = useState<SettingsCategory>("appearance");
  const [searchQuery, setSearchQuery] = useState("");
  const [resetConfirm, setResetConfirm] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Filter items based on search query
  const filteredItemIds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null; // null means no active filter
    return new Set(
      SETTING_ITEMS.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.keywords.some((k) => k.includes(q)),
      ).map((item) => item.id),
    );
  }, [searchQuery]);

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
    </div>
  );
}
