import { useState, useMemo } from "react";
import * as Y from "yjs";
import {
  Boxes,
  X,
  Plus,
  Check,
  AlertCircle,
  FileCode2,
  Search,
} from "lucide-react";
import { snapshot } from "../workspace/ops";

interface DependencyManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  doc: Y.Doc;
  canEdit: boolean;
}

type ManifestType = "package.json" | "pom.xml" | "requirements.txt";

interface DependencyItem {
  name: string;
  version?: string;
  scope?: string;
  isDev?: boolean;
}

const COMMON_NPM_DEPS = [
  { name: "axios", desc: "Promise based HTTP client", ver: "^1.8.0" },
  { name: "lucide-react", desc: "Clean SVG icons for React", ver: "^1.16.0" },
  { name: "zustand", desc: "Small, fast state management", ver: "^5.0.0" },
  { name: "tailwindcss", desc: "Utility-first CSS framework", ver: "^4.0.0", isDev: true },
  { name: "react-router-dom", desc: "Declarative browser routing", ver: "^7.2.0" },
  { name: "zod", desc: "TypeScript-first schema validation", ver: "^3.24.0" },
  { name: "framer-motion", desc: "Motion library for React", ver: "^12.4.0" },
  { name: "lodash", desc: "Modern utility library", ver: "^4.17.21" },
  { name: "date-fns", desc: "Modern JavaScript date utility", ver: "^4.1.0" },
  { name: "cors", desc: "CORS middleware for Express", ver: "^2.8.5" },
  { name: "dotenv", desc: "Loads .env variables into process.env", ver: "^16.4.5" },
  { name: "express", desc: "Fast minimalist web framework", ver: "^4.21.0" },
  { name: "mongoose", desc: "MongoDB object modeling", ver: "^8.8.0" },
];

const COMMON_MAVEN_DEPS = [
  { name: "spring-boot-starter-web", group: "org.springframework.boot", desc: "RESTful web services with Tomcat" },
  { name: "spring-boot-starter-data-jpa", group: "org.springframework.boot", desc: "Spring Data JPA with Hibernate" },
  { name: "h2", group: "com.h2database", desc: "In-memory SQL database", scope: "runtime" },
  { name: "postgresql", group: "org.postgresql", desc: "PostgreSQL JDBC Driver", scope: "runtime" },
  { name: "mysql-connector-j", group: "com.mysql", desc: "MySQL JDBC Driver", scope: "runtime" },
  { name: "lombok", group: "org.projectlombok", desc: "Reduce boilerplate annotations" },
  { name: "spring-boot-devtools", group: "org.springframework.boot", desc: "LiveReload & fast restarts", scope: "runtime" },
  { name: "spring-boot-starter-security", group: "org.springframework.boot", desc: "Security and authentication" },
  { name: "spring-boot-starter-validation", group: "org.springframework.boot", desc: "Bean Validation support" },
  { name: "spring-boot-starter-actuator", group: "org.springframework.boot", desc: "Production health metrics" },
];

const COMMON_PIP_DEPS = [
  { name: "flask-cors", desc: "CORS extension for Flask", ver: ">=4.0.0" },
  { name: "python-dotenv", desc: "Environment variable loader", ver: ">=1.0.0" },
  { name: "SQLAlchemy", desc: "SQL toolkit and Object Relational Mapper", ver: ">=2.0.0" },
  { name: "requests", desc: "HTTP library for humans", ver: ">=2.31.0" },
  { name: "pydantic", desc: "Data validation using Python type annotations", ver: ">=2.6.0" },
  { name: "pytest", desc: "Testing framework for Python", ver: ">=8.0.0" },
  { name: "fastapi", desc: "Modern, high-performance web framework", ver: ">=0.110.0" },
  { name: "numpy", desc: "Fundamental package for scientific computing", ver: ">=1.26.0" },
  { name: "pandas", desc: "Powerful data analysis and manipulation toolkit", ver: ">=2.2.0" },
];

export function DependencyManagerModal({
  isOpen,
  onClose,
  doc,
  canEdit,
}: DependencyManagerModalProps) {
  const [activeTab, setActiveTab] = useState<ManifestType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [customName, setCustomName] = useState("");
  const [customVersion, setCustomVersion] = useState("");
  const [customGroupId, setCustomGroupId] = useState("org.springframework.boot");
  const [isDev, setIsDev] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Discover manifests in workspace
  const manifests = useMemo(() => {
    if (!isOpen) return [];
    const snap = snapshot(doc);
    const found: { type: ManifestType; nodeId: string; name: string }[] = [];
    for (const [id, node] of snap.nodes.entries()) {
      if (node.type === "file") {
        if (node.name === "package.json") found.push({ type: "package.json", nodeId: id, name: "package.json" });
        if (node.name === "pom.xml") found.push({ type: "pom.xml", nodeId: id, name: "pom.xml" });
        if (node.name === "requirements.txt") found.push({ type: "requirements.txt", nodeId: id, name: "requirements.txt" });
      }
    }
    return found;
  }, [doc, isOpen]);

  // Set default active tab
  const currentManifest = useMemo(() => {
    if (!manifests.length) return null;
    if (activeTab) {
      const match = manifests.find((m) => m.type === activeTab);
      if (match) return match;
    }
    return manifests[0];
  }, [manifests, activeTab]);

  // Read installed dependencies from current manifest
  const installedDeps = useMemo<DependencyItem[]>(() => {
    if (!currentManifest) return [];
    const contents = doc.getMap("contents");
    const ytext = contents.get(currentManifest.nodeId) as Y.Text | undefined;
    if (!ytext) return [];
    const raw = ytext.toString();

    if (currentManifest.type === "package.json") {
      try {
        const parsed = JSON.parse(raw);
        const list: DependencyItem[] = [];
        if (parsed.dependencies) {
          for (const [k, v] of Object.entries(parsed.dependencies)) {
            list.push({ name: k, version: String(v), isDev: false });
          }
        }
        if (parsed.devDependencies) {
          for (const [k, v] of Object.entries(parsed.devDependencies)) {
            list.push({ name: k, version: String(v), isDev: true });
          }
        }
        return list;
      } catch {
        return [];
      }
    }

    if (currentManifest.type === "pom.xml") {
      const list: DependencyItem[] = [];
      const regex = /<dependency>[\s\S]*?<artifactId>(.*?)<\/artifactId>[\s\S]*?<\/dependency>/g;
      let match;
      while ((match = regex.exec(raw)) !== null) {
        const block = match[0];
        const art = match[1]?.trim();
        const verMatch = block.match(/<version>(.*?)<\/version>/);
        const groupMatch = block.match(/<groupId>(.*?)<\/groupId>/);
        const scopeMatch = block.match(/<scope>(.*?)<\/scope>/);
        if (art) {
          list.push({
            name: art,
            version: verMatch?.[1]?.trim() || "inherited",
            scope: scopeMatch?.[1]?.trim() || groupMatch?.[1]?.trim(),
          });
        }
      }
      return list;
    }

    if (currentManifest.type === "requirements.txt") {
      const lines = raw.split("\n");
      const list: DependencyItem[] = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const parts = trimmed.split(/(>=|==|<=|>|<)/);
        list.push({
          name: parts[0]?.trim() || trimmed,
          version: parts.slice(1).join("").trim() || "latest",
        });
      }
      return list;
    }

    return [];
  }, [currentManifest, doc]);

  if (!isOpen) return null;

  const handleAddDependency = (pkgName: string, ver?: string, group?: string, dev = false) => {
    if (!currentManifest) return;
    const contents = doc.getMap("contents");
    const ytext = contents.get(currentManifest.nodeId) as Y.Text | undefined;
    if (!ytext) return;
    const currentText = ytext.toString();

    doc.transact(() => {
      if (currentManifest.type === "package.json") {
        try {
          const pkg = JSON.parse(currentText);
          const targetKey = dev ? "devDependencies" : "dependencies";
          pkg[targetKey] = pkg[targetKey] || {};
          pkg[targetKey][pkgName.trim()] = ver?.trim() || "^1.0.0";
          const updated = JSON.stringify(pkg, null, 2);
          ytext.delete(0, ytext.length);
          ytext.insert(0, updated);
          setFeedback({ type: "success", text: `Added ${pkgName} to package.json` });
        } catch {
          setFeedback({ type: "error", text: "Failed to parse package.json" });
        }
      } else if (currentManifest.type === "pom.xml") {
        const artifact = pkgName.trim();
        const groupId = group?.trim() || "org.springframework.boot";
        const depXml = `        <dependency>\n            <groupId>${groupId}</groupId>\n            <artifactId>${artifact}</artifactId>${ver ? `\n            <version>${ver.trim()}</version>` : ""}\n        </dependency>\n`;

        const closingIndex = currentText.lastIndexOf("</dependencies>");
        if (closingIndex !== -1) {
          ytext.insert(closingIndex, depXml);
          setFeedback({ type: "success", text: `Added ${artifact} to pom.xml` });
        } else {
          setFeedback({ type: "error", text: "Could not find </dependencies> tag in pom.xml" });
        }
      } else if (currentManifest.type === "requirements.txt") {
        const depLine = `${pkgName.trim()}${ver ? ver.trim() : ">=1.0.0"}\n`;
        ytext.insert(ytext.length, depLine);
        setFeedback({ type: "success", text: `Added ${pkgName} to requirements.txt` });
      }
    });

    setCustomName("");
    setCustomVersion("");
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-[#27272a] bg-[#121214] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#27272a] px-6 py-4 bg-[#18181b]/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 text-white">
              <Boxes size={18} />
            </div>
            <div>
              <h2 className="font-display text-sm font-semibold text-[#f4f4f5]">
                Manage Project Dependencies
              </h2>
              <p className="text-[11px] text-[#a1a1aa] font-mono">
                Realtime package synchronization via CRDTs
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Feedback message banner */}
        {feedback && (
          <div
            className={`px-6 py-2.5 text-xs font-mono flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-emerald-950/60 text-emerald-300 border-b border-emerald-800/50"
                : "bg-red-950/60 text-red-300 border-b border-red-800/50"
            }`}
          >
            {feedback.type === "success" ? <Check size={14} /> : <AlertCircle size={14} />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Body */}
        {manifests.length === 0 ? (
          <div className="p-10 text-center font-mono text-xs text-zinc-400">
            <FileCode2 size={36} className="mx-auto text-zinc-600 mb-3" />
            <p className="font-medium text-zinc-300">No dependency manifest detected.</p>
            <p className="mt-1 text-zinc-500 max-w-sm mx-auto">
              Create a package.json, pom.xml, or requirements.txt file in the workspace to manage project dependencies.
            </p>
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Manifest Tabs if multiple */}
            {manifests.length > 1 && (
              <div className="flex items-center gap-2 px-6 pt-3 border-b border-[#27272a] bg-[#141416]">
                {manifests.map((m) => (
                  <button
                    key={m.type}
                    type="button"
                    onClick={() => setActiveTab(m.type)}
                    className={`px-3 py-1.5 font-mono text-xs border-b-2 transition-all ${
                      (currentManifest?.type === m.type)
                        ? "border-white text-white font-semibold"
                        : "border-transparent text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            )}

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Add Dependency Input Form */}
              {canEdit && (
                <div className="rounded-xl border border-zinc-800 bg-[#161619] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-semibold text-zinc-200">
                      Add New Dependency to {currentManifest?.name}
                    </span>
                    {currentManifest?.type === "package.json" && (
                      <label className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isDev}
                          onChange={(e) => setIsDev(e.target.checked)}
                          className="rounded border-zinc-700 bg-zinc-800"
                        />
                        <span>devDependencies</span>
                      </label>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    {currentManifest?.type === "pom.xml" && (
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          placeholder="Group ID (e.g. org.projectlombok)"
                          value={customGroupId}
                          onChange={(e) => setCustomGroupId(e.target.value)}
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-mono text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none"
                        />
                      </div>
                    )}
                    <div className={currentManifest?.type === "pom.xml" ? "sm:col-span-5" : "sm:col-span-7"}>
                      <input
                        type="text"
                        placeholder={
                          currentManifest?.type === "package.json"
                            ? "Package name (e.g. lodash, axios)"
                            : currentManifest?.type === "pom.xml"
                            ? "Artifact ID (e.g. lombok)"
                            : "Package name (e.g. pandas)"
                        }
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-mono text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        placeholder="Version (opt.)"
                        value={customVersion}
                        onChange={(e) => setCustomVersion(e.target.value)}
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-mono text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        disabled={!customName.trim()}
                        onClick={() =>
                          handleAddDependency(
                            customName,
                            customVersion,
                            currentManifest?.type === "pom.xml" ? customGroupId : undefined,
                            isDev
                          )
                        }
                        className="w-full flex items-center justify-center gap-1 rounded-lg border border-white bg-white px-3 py-1.5 font-mono text-xs font-semibold text-black hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        <Plus size={14} />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Suggestions / Popular Packages */}
                  <div className="mt-3.5 pt-3 border-t border-zinc-800">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-2">
                      Popular Suggestions
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {currentManifest?.type === "package.json" &&
                        COMMON_NPM_DEPS.map((dep) => {
                          const alreadyAdded = installedDeps.some((d) => d.name === dep.name);
                          return (
                            <button
                              key={dep.name}
                              type="button"
                              disabled={alreadyAdded}
                              onClick={() => handleAddDependency(dep.name, dep.ver, undefined, dep.isDev)}
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[11px] border transition-all ${
                                alreadyAdded
                                  ? "border-zinc-800 bg-zinc-900/60 text-zinc-600 cursor-not-allowed"
                                  : "border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:border-zinc-500 hover:text-white"
                              }`}
                              title={dep.desc}
                            >
                              {alreadyAdded ? <Check size={11} className="text-emerald-500" /> : <Plus size={11} />}
                              <span>{dep.name}</span>
                            </button>
                          );
                        })}

                      {currentManifest?.type === "pom.xml" &&
                        COMMON_MAVEN_DEPS.map((dep) => {
                          const alreadyAdded = installedDeps.some((d) => d.name === dep.name);
                          return (
                            <button
                              key={dep.name}
                              type="button"
                              disabled={alreadyAdded}
                              onClick={() => handleAddDependency(dep.name, undefined, dep.group)}
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[11px] border transition-all ${
                                alreadyAdded
                                  ? "border-zinc-800 bg-zinc-900/60 text-zinc-600 cursor-not-allowed"
                                  : "border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:border-zinc-500 hover:text-white"
                              }`}
                              title={dep.desc}
                            >
                              {alreadyAdded ? <Check size={11} className="text-emerald-500" /> : <Plus size={11} />}
                              <span>{dep.name}</span>
                            </button>
                          );
                        })}

                      {currentManifest?.type === "requirements.txt" &&
                        COMMON_PIP_DEPS.map((dep) => {
                          const alreadyAdded = installedDeps.some((d) => d.name.toLowerCase() === dep.name.toLowerCase());
                          return (
                            <button
                              key={dep.name}
                              type="button"
                              disabled={alreadyAdded}
                              onClick={() => handleAddDependency(dep.name, dep.ver)}
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[11px] border transition-all ${
                                alreadyAdded
                                  ? "border-zinc-800 bg-zinc-900/60 text-zinc-600 cursor-not-allowed"
                                  : "border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:border-zinc-500 hover:text-white"
                              }`}
                              title={dep.desc}
                            >
                              {alreadyAdded ? <Check size={11} className="text-emerald-500" /> : <Plus size={11} />}
                              <span>{dep.name}</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}

              {/* Installed Dependencies List */}
              <div>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
                  <span className="font-mono text-xs font-semibold text-zinc-300 flex items-center gap-2">
                    <span>Installed Dependencies</span>
                    <span className="rounded-full bg-zinc-800 px-2 py-0.2 font-mono text-[10px] text-zinc-400">
                      {installedDeps.length}
                    </span>
                  </span>
                  {installedDeps.length > 5 && (
                    <div className="relative">
                      <Search size={12} className="absolute left-2 top-2 text-zinc-500" />
                      <input
                        type="text"
                        placeholder="Filter list..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="rounded border border-zinc-800 bg-zinc-900 pl-6 pr-2 py-1 font-mono text-[11px] text-white focus:border-zinc-600 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {installedDeps.length === 0 ? (
                  <p className="text-center font-mono text-xs text-zinc-500 py-4">
                    No dependencies configured in this file yet.
                  </p>
                ) : (
                  <div className="divide-y divide-zinc-800/60 max-h-56 overflow-y-auto">
                    {installedDeps
                      .filter((d) => !searchQuery.trim() || d.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((dep) => (
                        <div
                          key={dep.name}
                          className="flex items-center justify-between py-2 px-2 hover:bg-zinc-800/30 rounded font-mono text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-zinc-200">{dep.name}</span>
                            {dep.isDev && (
                              <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.2 rounded">
                                dev
                              </span>
                            )}
                            {dep.scope && (
                              <span className="text-[10px] text-zinc-500 bg-zinc-800/60 px-1.5 py-0.2 rounded">
                                {dep.scope}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-zinc-400">{dep.version}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#27272a] px-6 py-3.5 bg-[#18181b]/50">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
            <span>Updating dependencies modifies file in Yjs live room</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-1.5 font-mono text-xs font-medium text-white hover:bg-zinc-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
