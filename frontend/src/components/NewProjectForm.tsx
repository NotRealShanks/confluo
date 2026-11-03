import { useState, useMemo, type FormEvent } from "react";
import { createProject } from "../api/projects";
import { ApiError } from "../api/client";
import type { Project } from "../api/types";
import { Plus, AlertCircle, Check, Search, Layers, FileCode } from "lucide-react";
import { TEMPLATES, TemplateIcon, type TemplateCategory } from "../templates";

const CATEGORIES: { id: TemplateCategory; label: string }[] = [
  { id: "all", label: "All Templates" },
  { id: "frontend", label: "Frontend" },
  { id: "backend", label: "Backend" },
  { id: "vanilla", label: "Vanilla Web" },
  { id: "general", label: "General" },
];

export default function NewProjectForm({ onCreated }: { onCreated: (project: Project) => void }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("react-ts");
  const [category, setCategory] = useState<TemplateCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [title, setTitle] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    return TEMPLATES.filter((t) => {
      const matchesCategory = category === "all" || t.category === category;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        t.language.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [category, searchQuery]);

  const selectedTemplate = useMemo(() => {
    return TEMPLATES.find((t) => t.id === selectedTemplateId) || TEMPLATES[0];
  }, [selectedTemplateId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const trimmed = title.trim();
    if (!trimmed) {
      setError("Enter a project title.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      const project = await createProject(trimmed, selectedTemplateId);
      onCreated(project);
      setTitle("");
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.fieldErrors.title ?? e.message);
      } else {
        setError("Could not reach the server. Please try again.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-5">
      {/* Step 1: Select a Starter Template */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <span className="text-xs font-semibold text-[#f4f4f5] flex items-center gap-2">
            <Layers size={14} className="text-zinc-400" />
            <span>1. Select Starter Template</span>
          </span>

          {/* Search Templates */}
          <div className="relative w-full sm:w-60">
            <Search size={13} className="absolute left-2.5 top-2 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full h-7 rounded-md border border-[#27272a] bg-[#09090b] pl-8 pr-2.5 text-xs text-[#f4f4f5] placeholder-zinc-500 focus:border-white focus:outline-none transition-colors font-mono"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors whitespace-nowrap ${
                category === cat.id
                  ? "bg-white text-black font-semibold shadow-sm"
                  : "bg-[#18181b] text-zinc-400 hover:text-zinc-200 border border-[#27272a]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Template Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-1 mt-2.5 scrollbar-thin">
          {filteredTemplates.map((t) => {
            const isSelected = t.id === selectedTemplateId;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTemplateId(t.id)}
                className={`group relative text-left p-3 rounded-lg border transition-all flex flex-col justify-between ${
                  isSelected
                    ? "border-white bg-[#18181b] shadow-[0_0_15px_rgba(255,255,255,0.08)] ring-1 ring-white"
                    : "border-[#27272a] bg-[#09090b] hover:border-zinc-500 hover:bg-[#121214]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded border text-xs shrink-0 transition-colors ${
                          isSelected
                            ? "bg-white text-black border-white"
                            : "bg-[#18181b] border-[#27272a] text-zinc-300 group-hover:border-zinc-500 group-hover:text-white"
                        }`}
                      >
                        <TemplateIcon icon={t.icon} className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-semibold text-xs text-[#f4f4f5] truncate">
                        {t.name}
                      </span>
                    </div>

                    {isSelected && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-black">
                        <Check size={11} strokeWidth={3} />
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                    {t.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#27272a]/70 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                  <div className="flex items-center gap-1">
                    <FileCode size={11} />
                    <span>{t.files.length === 0 ? "Empty canvas" : `${t.files.length} starter files`}</span>
                  </div>
                  <span className="text-zinc-400 font-medium">{t.tags[0]}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Name & Create */}
      <div className="pt-3 border-t border-[#27272a] flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs">
          <label htmlFor="new-project-title" className="font-semibold text-[#f4f4f5]">
            2. Project Workspace Name
          </label>
          <span className="text-zinc-400 font-mono text-[11px]">
            Template: <strong className="text-white">{selectedTemplate.name}</strong>
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <input
              id="new-project-title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setError(null);
              }}
              maxLength={200}
              placeholder={`e.g. my-${selectedTemplate.id === "blank" ? "project" : selectedTemplate.id}`}
              aria-invalid={error ? true : undefined}
              className="block w-full rounded-md border border-[#27272a] bg-[#09090b] px-3.5 py-2 font-mono text-xs text-[#f4f4f5] placeholder-[#71717a] transition-colors focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-white bg-white text-black px-4 py-2 font-mono text-xs font-semibold transition-all hover:bg-zinc-200 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
          >
            <Plus size={14} />
            <span>{pending ? "Creating Workspace…" : "Create Workspace"}</span>
          </button>
        </div>

        {error && (
          <div role="alert" className="mt-1 flex items-center gap-1.5 font-mono text-xs text-[#FF6B6B]">
            <AlertCircle size={13} />
            <span>{error}</span>
          </div>
        )}
      </div>
    </form>
  );
}
