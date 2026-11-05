import type { ProjectTemplate, TemplateConfigOptions, TemplateFile } from "./types";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "my-project";
}

/**
 * Customizes the starter files for web / JS / TS templates using user-specified configuration
 * such as selected dependencies, module type, and app title.
 */
export function customizeTemplateFiles(
  template: ProjectTemplate,
  config?: TemplateConfigOptions,
  projectName?: string
): TemplateFile[] {
  if (template.files.length === 0) return [];
  if (!config && !projectName) return template.files;

  const files: TemplateFile[] = [];
  const selectedDeps = new Set(config?.dependencies ?? template.defaultConfig?.dependencies ?? []);
  const title = projectName || template.name;
  const projectSlug = slugify(title);

  // React TypeScript or React JavaScript
  if (template.id === "react-ts" || template.id === "react-js") {
    for (const f of template.files) {
      if (f.path === "package.json") {
        try {
          const pkg = JSON.parse(f.content);
          pkg.name = projectSlug;
          pkg.dependencies = pkg.dependencies || {};
          if (selectedDeps.has("lucide-react")) pkg.dependencies["lucide-react"] = "^1.16.0";
          if (selectedDeps.has("tailwindcss")) pkg.devDependencies = { ...(pkg.devDependencies || {}), tailwindcss: "^4.0.0" };
          if (selectedDeps.has("axios")) pkg.dependencies["axios"] = "^1.8.0";
          if (selectedDeps.has("zustand")) pkg.dependencies["zustand"] = "^5.0.0";
          if (selectedDeps.has("react-router-dom")) pkg.dependencies["react-router-dom"] = "^7.2.0";
          if (selectedDeps.has("zod")) pkg.dependencies["zod"] = "^3.24.0";
          if (selectedDeps.has("framer-motion")) pkg.dependencies["framer-motion"] = "^12.4.0";
          files.push({ ...f, content: JSON.stringify(pkg, null, 2) });
          continue;
        } catch {
          files.push(f);
          continue;
        }
      }
      if (f.path === "index.html") {
        const html = f.content.replace(/<title>.*<\/title>/, `<title>${title}</title>`);
        files.push({ ...f, content: html });
        continue;
      }
      files.push(f);
    }
    return files;
  }

  // Vue.js
  if (template.id === "vue") {
    for (const f of template.files) {
      if (f.path === "package.json") {
        try {
          const pkg = JSON.parse(f.content);
          pkg.name = projectSlug;
          pkg.dependencies = pkg.dependencies || {};
          if (selectedDeps.has("pinia")) pkg.dependencies["pinia"] = "^2.2.0";
          if (selectedDeps.has("vue-router")) pkg.dependencies["vue-router"] = "^4.4.0";
          if (selectedDeps.has("axios")) pkg.dependencies["axios"] = "^1.8.0";
          if (selectedDeps.has("lucide-vue-next")) pkg.dependencies["lucide-vue-next"] = "^0.469.0";
          files.push({ ...f, content: JSON.stringify(pkg, null, 2) });
          continue;
        } catch {
          files.push(f);
          continue;
        }
      }
      if (f.path === "index.html") {
        const html = f.content.replace(/<title>.*<\/title>/, `<title>${title}</title>`);
        files.push({ ...f, content: html });
        continue;
      }
      files.push(f);
    }
    return files;
  }

  // Svelte
  if (template.id === "svelte") {
    for (const f of template.files) {
      if (f.path === "package.json") {
        try {
          const pkg = JSON.parse(f.content);
          pkg.name = projectSlug;
          files.push({ ...f, content: JSON.stringify(pkg, null, 2) });
          continue;
        } catch {
          files.push(f);
          continue;
        }
      }
      if (f.path === "index.html") {
        const html = f.content.replace(/<title>.*<\/title>/, `<title>${title}</title>`);
        files.push({ ...f, content: html });
        continue;
      }
      files.push(f);
    }
    return files;
  }

  // Solid.js
  if (template.id === "solid") {
    for (const f of template.files) {
      if (f.path === "package.json") {
        try {
          const pkg = JSON.parse(f.content);
          pkg.name = projectSlug;
          files.push({ ...f, content: JSON.stringify(pkg, null, 2) });
          continue;
        } catch {
          files.push(f);
          continue;
        }
      }
      if (f.path === "index.html") {
        const html = f.content.replace(/<title>.*<\/title>/, `<title>${title}</title>`);
        files.push({ ...f, content: html });
        continue;
      }
      files.push(f);
    }
    return files;
  }

  // Angular
  if (template.id === "angular") {
    for (const f of template.files) {
      if (f.path === "package.json") {
        try {
          const pkg = JSON.parse(f.content);
          pkg.name = projectSlug;
          pkg.dependencies = pkg.dependencies || {};
          if (selectedDeps.has("rxjs")) pkg.dependencies["rxjs"] = "^7.8.0";
          if (selectedDeps.has("lucide-angular")) pkg.dependencies["lucide-angular"] = "^0.469.0";
          files.push({ ...f, content: JSON.stringify(pkg, null, 2) });
          continue;
        } catch {
          files.push(f);
          continue;
        }
      }
      if (f.path === "index.html" || f.path === "src/index.html") {
        const html = f.content.replace(/<title>.*<\/title>/, `<title>${title}</title>`);
        files.push({ ...f, content: html });
        continue;
      }
      files.push(f);
    }
    return files;
  }

  // Node.js + Express
  if (template.id === "node-express") {
    for (const f of template.files) {
      if (f.path === "package.json") {
        try {
          const pkg = JSON.parse(f.content);
          pkg.name = projectSlug;
          if (config?.moduleType === "commonjs") {
            delete pkg.type;
          } else {
            pkg.type = "module";
          }
          pkg.dependencies = pkg.dependencies || {};
          if (selectedDeps.has("cors")) pkg.dependencies["cors"] = "^2.8.5";
          if (selectedDeps.has("dotenv")) pkg.dependencies["dotenv"] = "^16.4.5";
          if (selectedDeps.has("morgan")) pkg.dependencies["morgan"] = "^1.10.0";
          if (selectedDeps.has("zod")) pkg.dependencies["zod"] = "^3.23.8";
          if (selectedDeps.has("jsonwebtoken")) pkg.dependencies["jsonwebtoken"] = "^9.0.2";
          if (selectedDeps.has("mongoose")) pkg.dependencies["mongoose"] = "^8.8.0";
          if (selectedDeps.has("bcryptjs")) pkg.dependencies["bcryptjs"] = "^2.4.3";
          if (selectedDeps.has("nodemon")) pkg.devDependencies = { ...(pkg.devDependencies || {}), nodemon: "^3.1.7" };
          files.push({ ...f, content: JSON.stringify(pkg, null, 2) });
          continue;
        } catch {
          files.push(f);
          continue;
        }
      }
      if (f.path === "src/index.js" && config?.port && config.port !== "3000") {
        const updated = f.content.replace(/const PORT = process\.env\.PORT \|\| 3000;/, `const PORT = process.env.PORT || ${config.port};`);
        files.push({ ...f, content: updated });
        continue;
      }
      files.push(f);
    }
    return files;
  }

  // Node.js + TypeScript
  if (template.id === "node-ts") {
    for (const f of template.files) {
      if (f.path === "package.json") {
        try {
          const pkg = JSON.parse(f.content);
          pkg.name = projectSlug;
          files.push({ ...f, content: JSON.stringify(pkg, null, 2) });
          continue;
        } catch {
          files.push(f);
          continue;
        }
      }
      files.push(f);
    }
    return files;
  }

  // HTML + CSS + JS
  if (template.id === "html-css-js") {
    for (const f of template.files) {
      if (f.path === "index.html") {
        let html = f.content.replace(/<title>.*<\/title>/, `<title>${title}</title>`);
        if (selectedDeps.has("tailwind-cdn")) {
          html = html.replace("</head>", `    <script src="https://cdn.tailwindcss.com"></script>\n  </head>`);
        }
        if (selectedDeps.has("font-awesome")) {
          html = html.replace("</head>", `    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />\n  </head>`);
        }
        files.push({ ...f, content: html });
        continue;
      }
      files.push(f);
    }
    return files;
  }

  // Rust
  if (template.id === "rust") {
    for (const f of template.files) {
      if (f.path === "Cargo.toml") {
        const updated = f.content.replace(/name = ".*"/, `name = "${projectSlug}"`);
        files.push({ ...f, content: updated });
        continue;
      }
      files.push(f);
    }
    return files;
  }

  // Default fallback: return template files
  return template.files;
}
