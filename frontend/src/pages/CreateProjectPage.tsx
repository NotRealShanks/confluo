import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router";
import {
  ArrowLeft,
  Search,
  Check,
  Plus,
  X,
  Layers,
  Sparkles,
  AlertTriangle,
  FileCode2,
} from "lucide-react";
import AppShell from "../components/AppShell";
import { TEMPLATES, getTemplateById } from "../templates/catalog";
import { TemplateIcon } from "../templates/TemplateIcon";
import type {
  TemplateCategory,
  TemplateConfigOptions,
} from "../templates/types";
import { createProject } from "../api/projects";

const CATEGORIES: { id: TemplateCategory; label: string }[] = [
  { id: "all", label: "All Templates" },
  { id: "frontend", label: "Frontend" },
  { id: "backend", label: "Backend" },
  { id: "vanilla", label: "Vanilla" },
  { id: "general", label: "General & Languages" },
];

export default function CreateProjectPage() {
  const navigate = useNavigate();

  // Template selection state
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>("all");
  const [templateSearch, setTemplateSearch] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("react-ts");

  // Selected template object
  const template = useMemo(
    () => getTemplateById(selectedTemplateId),
    [selectedTemplateId]
  );

  // Common metadata
  const [title, setTitle] = useState("my-react-app");

  // Node/Express specific config
  const [moduleType, setModuleType] = useState("module");
  const [port, setPort] = useState("3000");

  // Dependencies state per template
  const [selectedDeps, setSelectedDeps] = useState<string[]>(() => {
    return template.defaultConfig?.dependencies ?? [];
  });
  const [depSearch, setDepSearch] = useState("");

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When template changes, reset dependencies to template defaults
  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const newTmpl = getTemplateById(id);
    if (newTmpl.defaultConfig?.dependencies) {
      setSelectedDeps(newTmpl.defaultConfig.dependencies);
    } else {
      setSelectedDeps([]);
    }
    // Set appropriate default title
    if (id.includes("react")) {
      setTitle("my-react-app");
    } else if (id === "node-express") {
      setTitle("my-express-api");
    } else if (id === "node-ts") {
      setTitle("my-node-app");
    } else if (id === "vue") {
      setTitle("my-vue-app");
    } else if (id === "svelte") {
      setTitle("my-svelte-app");
    } else if (id === "solid") {
      setTitle("my-solid-app");
    } else if (id === "angular") {
      setTitle("my-angular-app");
    } else if (id === "html-css-js") {
      setTitle("my-web-app");
    } else if (id === "python") {
      setTitle("my-python-app");
    } else if (id === "cpp") {
      setTitle("my-cpp-project");
    } else if (id === "java") {
      setTitle("my-java-app");
    } else if (id === "rust") {
      setTitle("my-rust-app");
    } else if (id === "go") {
      setTitle("my-go-app");
    } else if (id === "blank") {
      setTitle("untitled-project");
    }
  };

  // Filter templates list
  const filteredTemplates = useMemo(() => {
    return TEMPLATES.filter((t) => {
      const matchCat =
        selectedCategory === "all" || t.category === selectedCategory;
      const matchSearch =
        !templateSearch.trim() ||
        t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
        t.tags.some((tag) =>
          tag.toLowerCase().includes(templateSearch.toLowerCase())
        );
      return matchCat && matchSearch;
    });
  }, [selectedCategory, templateSearch]);

  // Toggle dependency
  const toggleDependency = (depId: string) => {
    setSelectedDeps((prev) =>
      prev.includes(depId) ? prev.filter((d) => d !== depId) : [...prev, depId]
    );
  };

  // Filter available dependencies
  const filteredDeps = useMemo(() => {
    if (!template.availableDependencies) return [];
    if (!depSearch.trim()) return template.availableDependencies;
    const q = depSearch.toLowerCase();
    return template.availableDependencies.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
    );
  }, [template, depSearch]);

  // Group dependencies by category
  const depGroups = useMemo(() => {
    const groups: Record<string, typeof filteredDeps> = {};
    for (const dep of filteredDeps) {
      groups[dep.category] = groups[dep.category] || [];
      groups[dep.category].push(dep);
    }
    return groups;
  }, [filteredDeps]);

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please specify a project title.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const config: TemplateConfigOptions = {
      dependencies: selectedDeps,
    };

    if (template.id === "node-express") {
      config.moduleType = moduleType;
      config.port = port;
    }

    try {
      const project = await createProject(
        title.trim(),
        template.id,
        JSON.stringify(config)
      );
      navigate(`/projects/${project.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create project workspace."
      );
      setSubmitting(false);
    }
  };

  return (
    <AppShell wide>
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-[#27272a]">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 font-mono text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </Link>
        <div className="flex items-center gap-2 font-mono text-xs text-zinc-500">
          <Sparkles size={13} className="text-zinc-400" />
          <span>Project Initializer Studio</span>
        </div>
      </div>

      {/* Page Title */}
      <div className="mt-6 mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#f4f4f5]">
          Create New Project Workspace
        </h1>
        <p className="mt-1.5 text-xs text-zinc-400 font-mono">
          Configure project metadata, build tool settings, and select starter dependencies.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-red-500/40 bg-red-950/30 p-4 font-mono text-xs text-red-300 flex items-center gap-3"
        >
          <AlertTriangle size={16} className="text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main 2-Column Responsive Layout */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Template Catalog (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-xl border border-[#27272a] bg-[#121214] p-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
              <span className="font-mono text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <Layers size={14} />
                <span>1. Choose Template</span>
              </span>
              <span className="font-mono text-[11px] text-zinc-500">
                {TEMPLATES.length} available
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="mt-3 flex flex-wrap gap-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-md font-mono text-[11px] transition-all ${
                    selectedCategory === cat.id
                      ? "bg-white text-black font-semibold shadow-sm"
                      : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Template Search Bar */}
            <div className="mt-3 relative">
              <Search size={13} className="absolute left-2.5 top-2.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search frameworks..."
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 pl-8 pr-3 py-1.5 font-mono text-xs text-white placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
              />
            </div>

            {/* Templates List */}
            <div className="mt-3.5 space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {filteredTemplates.map((t) => {
                const isSelected = t.id === selectedTemplateId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectTemplate(t.id)}
                    className={`w-full text-left rounded-xl p-3 border transition-all flex items-start gap-3 ${
                      isSelected
                        ? "border-white bg-[#1a1a1e] shadow-[0_0_20px_rgba(255,255,255,0.06)]"
                        : "border-[#27272a]/80 bg-[#141416] hover:border-zinc-600 hover:bg-[#18181b]"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border shrink-0 mt-0.5 ${
                        isSelected
                          ? "border-white bg-white text-black"
                          : "border-zinc-700 bg-zinc-800 text-zinc-300"
                      }`}
                    >
                      <TemplateIcon icon={t.icon} className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold text-zinc-200 truncate">
                          {t.name}
                        </span>
                        {isSelected && (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-black">
                            <Check size={11} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                        {t.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {t.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-zinc-800/80 px-1.5 py-0.2 font-mono text-[9px] text-zinc-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Configuration & Dependencies Wizard (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Template Header Banner */}
          <div className="rounded-xl border border-[#27272a] bg-[#121214] p-5">
            <div className="flex items-center justify-between pb-4 border-b border-[#27272a]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 text-white shadow-inner">
                  <TemplateIcon icon={template.icon} className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-base font-semibold text-[#f4f4f5]">
                    {template.name}
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    {template.description}
                  </p>
                </div>
              </div>
              <span className="rounded-md border border-zinc-700 bg-zinc-800/90 px-2.5 py-1 font-mono text-[11px] text-zinc-300 uppercase">
                {template.category}
              </span>
            </div>

            {/* General Project Settings */}
            <div className="mt-5 space-y-4">
              <div>
                <label className="block font-mono text-xs font-semibold text-zinc-300 mb-1.5">
                  Project Workspace Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. my-awesome-app"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 font-mono text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none"
                />
              </div>

              {/* Node / Express specific fields */}
              {template.id === "node-express" && (
                <div className="pt-4 border-t border-[#27272a] grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[11px] text-zinc-400 mb-1.5">
                      Module System
                    </label>
                    <div className="flex gap-1.5">
                      {[
                        { id: "module", label: "ESM (import)" },
                        { id: "commonjs", label: "CommonJS (require)" },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setModuleType(m.id)}
                          className={`flex-1 py-1.5 rounded font-mono text-xs border transition-all ${
                            moduleType === m.id
                              ? "border-white bg-white text-black font-semibold"
                              : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white"
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block font-mono text-[11px] text-zinc-400 mb-1.5">
                      Server Port
                    </label>
                    <input
                      type="text"
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-mono text-xs text-white focus:border-white focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dependencies Selection Panel */}
          {template.availableDependencies && template.availableDependencies.length > 0 && (
            <div className="rounded-xl border border-[#27272a] bg-[#121214] p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#27272a]">
                <div>
                  <h3 className="font-mono text-xs font-semibold text-zinc-200">
                    Dependencies & Libraries
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    Select libraries to inject directly into your project manifest.
                  </p>
                </div>
                {/* Search in dependencies */}
                <div className="relative sm:w-64">
                  <Search size={12} className="absolute left-2.5 top-2.5 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Filter dependencies..."
                    value={depSearch}
                    onChange={(e) => setDepSearch(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-8 pr-3 py-1 font-mono text-xs text-white placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Selected Chips Bar */}
              {selectedDeps.length > 0 && (
                <div className="mt-4 pb-3 border-b border-zinc-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">
                      Selected ({selectedDeps.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedDeps([])}
                      className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDeps.map((depId) => {
                      const depObj = template.availableDependencies?.find(
                        (d) => d.id === depId
                      );
                      return (
                        <span
                          key={depId}
                          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800/90 pl-2.5 pr-1.5 py-1 font-mono text-xs text-zinc-200"
                        >
                          <span>{depObj?.name || depId}</span>
                          <button
                            type="button"
                            onClick={() => toggleDependency(depId)}
                            className="rounded p-0.5 hover:bg-zinc-700 text-zinc-400 hover:text-white"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dependency Categories Checklist */}
              <div className="mt-4 space-y-4 max-h-[420px] overflow-y-auto pr-1">
                {Object.entries(depGroups).map(([category, deps]) => (
                  <div key={category}>
                    <span className="block font-mono text-[10px] text-zinc-500 uppercase tracking-wider mb-2">
                      {category}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {deps.map((dep) => {
                        const isChecked = selectedDeps.includes(dep.id);
                        return (
                          <div
                            key={dep.id}
                            onClick={() => toggleDependency(dep.id)}
                            className={`rounded-lg border p-3 cursor-pointer transition-all flex items-start gap-2.5 select-none ${
                              isChecked
                                ? "border-white bg-[#1a1a1e]"
                                : "border-zinc-800/80 bg-[#161619] hover:border-zinc-600 hover:bg-[#1a1a1d]"
                            }`}
                          >
                            <div
                              className={`flex h-4 w-4 items-center justify-center rounded border shrink-0 mt-0.5 transition-colors ${
                                isChecked
                                  ? "border-white bg-white text-black"
                                  : "border-zinc-700 bg-zinc-800"
                              }`}
                            >
                              {isChecked && <Check size={11} strokeWidth={3} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="block font-mono text-xs font-semibold text-zinc-200 truncate">
                                {dep.name}
                              </span>
                              <p className="mt-0.5 text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                                {dep.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submission and Action Buttons */}
          <div className="rounded-xl border border-[#27272a] bg-[#121214] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
              <FileCode2 size={15} className="text-zinc-500" />
              <span>
                Generates {template.files.length} starter files with {selectedDeps.length} dependencies
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 font-mono text-xs font-medium text-white hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={submitting || !title.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white bg-white text-black px-6 py-2 font-mono text-xs font-semibold hover:bg-zinc-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.25)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {submitting ? (
                  <>
                    <span className="h-3 w-3 rounded-full border-2 border-black border-t-transparent animate-spin" />
                    <span>Initializing Workspace…</span>
                  </>
                ) : (
                  <>
                    <Plus size={15} />
                    <span>Create Workspace & Open Studio</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </AppShell>
  );
}

