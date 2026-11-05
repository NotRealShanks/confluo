import type { ProjectTemplate } from "./types";

const VITE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 257"><defs><linearGradient id="vite-a" x1="-.8%" x2="57.6%" y1="7.6%" y2="78.4%"><stop offset="0%" stop-color="#41D1FF"/><stop offset="100%" stop-color="#BD34FE"/></linearGradient><linearGradient id="vite-b" x1="43.3%" x2="50.3%" y1="2.2%" y2="89%"><stop offset="0%" stop-color="#FFEA83"/><stop offset="8.3%" stop-color="#FFDD35"/><stop offset="100%" stop-color="#FFA800"/></linearGradient></defs><path fill="url(#vite-a)" d="M255.1 37.9L134.9 253a6.5 6.5 0 0 1-11.4 0L.9 38a6.5 6.5 0 0 1 6.8-9.7l120.4 21.5c.8.2 1.6.2 2.3 0L248.3 28.3a6.5 6.5 0 0 1 6.8 9.6z"/><path fill="url(#vite-b)" d="M185.4.1L96.4 17.5a3.3 3.3 0 0 0-2.6 3l-5.5 92.5a3.3 3.3 0 0 0 4 3.4l24.8-5.7c2.3-.6 4.4 1.5 4 3.8l-7.4 36c-.5 2.5 1.8 4.6 4.2 3.8l15.3-4.6c2.4-.7 4.6 1.3 4.1 3.8l-11.7 56.6c-.7 3.5 4 5.5 6 2.4l1.3-2 72.5-144.7c1.2-2.5-.9-5.2-3.5-4.7l-25.5 5c-2.4.4-4.5-1.8-3.8-4.2l16.7-57.7c.7-2.3-1.4-4.6-3.8-4.1z"/></svg>`;

const REACT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-11.5 -10.23 23 20.46"><title>React Logo</title><circle cx="0" cy="0" r="2.05" fill="#61dafb"/><g stroke="#61dafb" stroke-width="1" fill="none"><ellipse rx="11" ry="4.2"/><ellipse rx="11" ry="4.2" transform="rotate(60)"/><ellipse rx="11" ry="4.2" transform="rotate(120)"/></g></svg>`;

const VUE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 261.76 226.69"><path d="M161.096.001l-30.225 52.351L100.647.001H-.005l130.877 226.688L261.749.001z" fill="#41b883"/><path d="M161.096.001l-30.225 52.351L100.647.001H52.846l78.026 135.145L208.897.001z" fill="#34495e"/></svg>`;

const SVELTE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="#ff3e00" d="M28.4 8.7c-1.3-3.6-5-5.9-8.8-5.3-1.4.2-2.8.9-3.9 1.8l-7.4 6.2c-2.2 1.9-3.4 4.6-3.2 7.5.2 3.6 2.8 6.6 6.3 7.3 1.4.3 2.9 0 4.1-.7l7.5-6.2c1.7-1.4 2.8-3.3 2.9-5.5.1-2-.6-3.9-1.9-5.3-1.2-1.3-2.9-2-4.7-2-1 0-2 .2-2.9.7l-4.1 3.5c-.5.4-.5 1.1 0 1.5.4.4 1.1.4 1.5 0l4.1-3.5c.5-.3 1.1-.4 1.7-.4 1.1 0 2.2.4 2.9 1.2.7.8 1.1 1.9 1 3-.1 1.3-.8 2.4-1.8 3.2l-7.5 6.2c-.8.5-1.7.7-2.6.5-2.2-.4-3.8-2.3-3.9-4.5-.1-1.8.6-3.5 2-4.7l7.4-6.2c.8-.7 1.8-1.1 2.8-1.3 2.5-.4 4.9 1.1 5.8 3.5.7 1.9.4 4-.9 5.5l-4.2 3.5c-.5.4-.5 1.1 0 1.5.4.4 1.1.4 1.5 0l4.2-3.5c1.9-2.1 2.4-5 1.4-7.5z"/></svg>`;

const SOLID_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 166 155.3"><defs><linearGradient id="solid-a" x1="27.5" y1="3" x2="152" y2="133.5" gradientUnits="userSpaceOnUse"><stop offset=".1" stop-color="#76b3e1"/><stop offset=".3" stop-color="#dcf2fd"/><stop offset="1" stop-color="#76b3e1"/></linearGradient><linearGradient id="solid-b" x1="95.8" y1="32.6" x2="74" y2="105.2" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#76b3e1"/><stop offset=".5" stop-color="#4377bb"/><stop offset="1" stop-color="#1f3b77"/></linearGradient></defs><path d="M163 35S117-12 52 5L15 40a10.9 10.9 0 0 0-4 12l17 60a11 11 0 0 0 7 7.5c22.4 8.7 75 22.8 96-7.5l30-41a11.1 11.1 0 0 0 2-8z" fill="url(#solid-a)"/><path d="M52 5c-7 2-13 6-18 10l58 48a11 11 0 0 1 3 13l-19 33 55-21a11.1 11.1 0 0 0 6-7.5l6-29.5a11 11 0 0 0-3-10z" fill="url(#solid-b)"/></svg>`;

const ANGULAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 250"><polygon fill="#DD0031" points="125,30 125,30 125,30 31.9,63.2 46.1,186.3 125,230 125,230 125,230 203.9,186.3 218.1,63.2"/><polygon fill="#C3002F" points="125,30 125,52.2 125,52.1 125,153.4 125,153.4 125,230 125,230 203.9,186.3 218.1,63.2 125,30"/><polygon fill="#FFFFFF" points="125,52.1 66,183.8 88.5,183.8 100.8,153.4 125,153.4 149.2,153.4 161.5,183.8 184,183.8"/><polygon fill="#FFFFFF" points="125,89.5 110.8,124.9 139.2,124.9"/></svg>`;

const CODE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`;

export const TEMPLATES: ProjectTemplate[] = [
  {
    id: "blank",
    name: "Blank Project",
    description: "An empty canvas with no predefined starter files. Build your workspace from scratch.",
    category: "general",
    language: "plaintext",
    icon: "code",
    tags: ["Minimal", "Empty Canvas"],
    files: [],
  },
  {
    id: "react-ts",
    name: "React + TypeScript",
    description: "Modern component-based UI using React 19, TypeScript, Vite, SVG assets, and Lucide.",
    category: "frontend",
    language: "typescript",
    icon: "react",
    tags: ["React 19", "TypeScript", "Vite", "Tailwind"],
    availableDependencies: [
      { id: 'lucide-react', name: 'Lucide React', description: 'Clean, lightweight SVG icons library.', category: 'UI & Icons', defaultSelected: true },
      { id: 'tailwindcss', name: 'Tailwind CSS', description: 'Utility-first modern CSS framework.', category: 'Styling', defaultSelected: true },
      { id: 'axios', name: 'Axios', description: 'Promise based HTTP client for REST APIs.', category: 'Networking', defaultSelected: true },
      { id: 'zustand', name: 'Zustand', description: 'Lightweight, scalable global state management.', category: 'State Management' },
      { id: 'react-router-dom', name: 'React Router', description: 'Standard declarative client-side routing.', category: 'Routing' },
      { id: 'zod', name: 'Zod', description: 'TypeScript-first schema validation with type inference.', category: 'Validation' },
      { id: 'framer-motion', name: 'Framer Motion', description: 'Production-ready motion library for React.', category: 'Animation' },
    ],
    defaultConfig: {
      dependencies: ['lucide-react', 'tailwindcss', 'axios'],
    },
    files: [
      {
        path: "package.json",
        content: JSON.stringify(
          {
            name: "react-ts-project",
            private: true,
            version: "0.0.0",
            type: "module",
            scripts: {
              dev: "vite",
              build: "tsc -b && vite build",
              preview: "vite preview",
            },
            dependencies: {
              react: "^19.0.0",
              "react-dom": "^19.0.0",
              "lucide-react": "^1.0.0",
            },
            devDependencies: {
              "@vitejs/plugin-react": "^4.3.4",
              typescript: "~5.7.0",
              vite: "^6.0.0",
            },
          },
          null,
          2
        ),
      },
      {
        path: "vite.config.ts",
        content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`,
      },
      {
        path: "tsconfig.json",
        content: JSON.stringify(
          {
            compilerOptions: {
              target: "ES2022",
              useDefineForClassFields: true,
              lib: ["ES2023", "DOM", "DOM.Iterable"],
              module: "ESNext",
              skipLibCheck: true,
              moduleResolution: "bundler",
              allowImportingTsExtensions: true,
              isolatedModules: true,
              moduleDetection: "force",
              noEmit: true,
              jsx: "react-jsx",
              strict: true,
            },
            include: ["src"],
          },
          null,
          2
        ),
      },
      {
        path: "index.html",
        content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React + TypeScript App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
      },
      {
        path: "public/vite.svg",
        content: VITE_SVG,
      },
      {
        path: "src/assets/react.svg",
        content: REACT_SVG,
      },
      {
        path: "src/main.tsx",
        content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
      },
      {
        path: "src/App.tsx",
        isEntrypoint: true,
        content: `import { useState } from 'react';
import reactLogo from './assets/react.svg';
import { FeatureCard } from './components/FeatureCard';
import './App.css';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="container">
      <div className="logos">
        <a href="https://vite.dev" target="_blank" rel="noreferrer">
          <img src="/vite.svg" className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>

      <h1>React 19 + TypeScript</h1>
      <p className="subtitle">Real-time collaborative editing on Confluo</p>

      <div className="card">
        <button onClick={() => setCount((c) => c + 1)}>
          Count is {count}
        </button>
        <p>Edit <code>src/App.tsx</code> to test instant hot reloading.</p>
      </div>

      <div className="grid">
        <FeatureCard title="Live Collaboration" desc="Real-time multi-cursor editing backed by Yjs and Liveblocks." />
        <FeatureCard title="Integrated Git" desc="Branching, staging, diffing, and external push/pull to GitHub." />
        <FeatureCard title="In-Browser Preview" desc="Instant interactive preview with live console logging." />
      </div>
    </div>
  );
}`,
      },
      {
        path: "src/components/FeatureCard.tsx",
        content: `interface FeatureCardProps {
  title: string;
  desc: string;
}

export function FeatureCard({ title, desc }: FeatureCardProps) {
  return (
    <div className="feature-card">
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}`,
      },
      {
        path: "src/App.css",
        content: `.container {
  max-width: 960px;
  margin: 0 auto;
  padding: 3rem 1.5rem;
  text-align: center;
}

.logos {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.logo {
  height: 4.5rem;
  padding: 0.5rem;
  will-change: filter;
  transition: filter 300ms, transform 200ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
  transform: scale(1.05);
}

.logo.react:hover {
  filter: drop-shadow(0 0 2em #61dafbaa);
}

h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0.5rem 0;
  color: #fff;
}

.subtitle {
  color: #a1a1aa;
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.card {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
}

button {
  background: #10b981;
  color: #000;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

button:hover {
  background: #34d399;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
  text-align: left;
}

.feature-card {
  background: #121215;
  border: 1px solid #27272a;
  border-radius: 10px;
  padding: 1.25rem;
}

.feature-card h3 {
  color: #f4f4f5;
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
}

.feature-card p {
  color: #71717a;
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.4;
}`,
      },
      {
        path: "src/index.css",
        content: `:root {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.5;
  color: #f4f4f5;
  background-color: #09090b;
}

body {
  margin: 0;
  min-height: 100vh;
}

code {
  font-family: monospace;
  background: #27272a;
  padding: 0.2em 0.4em;
  border-radius: 4px;
}`,
      },
      {
        path: "README.md",
        content: `# React 19 + TypeScript Starter

Ready-made collaborative web project running with Vite on Confluo.

## Features Included
- **React 19 & TypeScript**: Fully typed component tree.
- **Vite & Hot Reload**: Instant updates in preview.
- **SVG Assets**: Framework and tool logos in \`src/assets/\` and \`public/\`.
- **Reusable Component**: \`src/components/FeatureCard.tsx\`.
`,
      },
    ],
  },
  {
    id: "react-js",
    name: "React + JavaScript",
    description: "Lightweight React setup using standard JSX, Vite, and modular components.",
    category: "frontend",
    language: "javascript",
    icon: "react",
    tags: ["React 19", "JavaScript", "JSX", "Vite"],
    availableDependencies: [
      { id: 'lucide-react', name: 'Lucide React', description: 'Clean, lightweight SVG icons library.', category: 'UI & Icons', defaultSelected: true },
      { id: 'tailwindcss', name: 'Tailwind CSS', description: 'Utility-first modern CSS framework.', category: 'Styling', defaultSelected: true },
      { id: 'axios', name: 'Axios', description: 'Promise based HTTP client for REST APIs.', category: 'Networking', defaultSelected: true },
    ],
    defaultConfig: {
      dependencies: ['lucide-react', 'tailwindcss', 'axios'],
    },
    files: [
      {
        path: "package.json",
        content: JSON.stringify(
          {
            name: "react-js-project",
            private: true,
            version: "0.0.0",
            type: "module",
            scripts: { dev: "vite", build: "vite build" },
            dependencies: { react: "^19.0.0", "react-dom": "^19.0.0", "lucide-react": "^1.0.0" },
            devDependencies: { "@vitejs/plugin-react": "^4.3.4", vite: "^6.0.0" },
          },
          null,
          2
        ),
      },
      {
        path: "vite.config.js",
        content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`,
      },
      {
        path: "index.html",
        content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React JavaScript App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
      },
      {
        path: "public/vite.svg",
        content: VITE_SVG,
      },
      {
        path: "src/assets/react.svg",
        content: REACT_SVG,
      },
      {
        path: "src/main.jsx",
        content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
      },
      {
        path: "src/App.jsx",
        isEntrypoint: true,
        content: `import { useState } from 'react';
import reactLogo from './assets/react.svg';
import { Header } from './components/Header';
import './App.css';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="container">
      <Header />
      <div className="logos">
        <img src="/vite.svg" className="logo" alt="Vite logo" />
        <img src={reactLogo} className="logo react" alt="React logo" />
      </div>
      <div className="card">
        <button onClick={() => setCount((c) => c + 1)}>
          Count is {count}
        </button>
        <p>Edit <code>src/App.jsx</code> and observe real-time preview updates.</p>
      </div>
    </div>
  );
}`,
      },
      {
        path: "src/components/Header.jsx",
        content: `export function Header() {
  return (
    <header className="header">
      <h1>React 19 JavaScript Starter</h1>
      <p>Instant workspace with collaborative editing</p>
    </header>
  );
}`,
      },
      {
        path: "src/App.css",
        content: `.container { max-width: 800px; margin: 0 auto; padding: 3rem 1rem; text-align: center; }
.logos { display: flex; justify-content: center; gap: 2rem; margin: 2rem 0; }
.logo { height: 4rem; transition: transform 0.2s; }
.logo:hover { transform: scale(1.1); }
.card { background: #18181b; border: 1px solid #27272a; border-radius: 10px; padding: 2rem; }
button { background: #10b981; color: #000; font-weight: 600; border: none; border-radius: 8px; padding: 0.75rem 1.5rem; cursor: pointer; }`,
      },
      {
        path: "src/index.css",
        content: `body { margin: 0; background-color: #09090b; color: #f4f4f5; font-family: sans-serif; }`,
      },
      {
        path: "README.md",
        content: `# React + JavaScript Starter\n\nClean JSX starter project for Confluo.`,
      },
    ],
  },
  {
    id: "vue",
    name: "Vue 3 + TypeScript",
    description: "Progressive Vue 3 Single-File Components with Vite, Pinia, and reactive setup.",
    category: "frontend",
    language: "typescript",
    icon: "vue",
    tags: ["Vue 3", "TypeScript", "Vite", "SFC"],
    availableDependencies: [
      { id: 'pinia', name: 'Pinia', description: 'Intuitive, type-safe store for Vue.', category: 'State Management', defaultSelected: true },
      { id: 'vue-router', name: 'Vue Router', description: 'Official client-side router for Vue 3.', category: 'Routing', defaultSelected: true },
      { id: 'axios', name: 'Axios', description: 'Promise based HTTP client.', category: 'Networking' },
    ],
    defaultConfig: {
      dependencies: ['pinia', 'vue-router'],
    },
    files: [
      {
        path: "package.json",
        content: JSON.stringify(
          {
            name: "vue-ts-project",
            private: true,
            version: "0.0.0",
            type: "module",
            scripts: { dev: "vite", build: "vue-tsc && vite build" },
            dependencies: { vue: "^3.5.0", pinia: "^2.2.0" },
            devDependencies: { "@vitejs/plugin-vue": "^5.2.0", typescript: "~5.7.0", vite: "^6.0.0" },
          },
          null,
          2
        ),
      },
      {
        path: "vite.config.ts",
        content: `import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
});
`,
      },
      {
        path: "tsconfig.json",
        content: JSON.stringify(
          {
            compilerOptions: {
              target: "ES2022",
              module: "ESNext",
              moduleResolution: "bundler",
              strict: true,
              jsx: "preserve",
            },
            include: ["src/**/*.ts", "src/**/*.vue"],
          },
          null,
          2
        ),
      },
      {
        path: "index.html",
        content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vue 3 App</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`,
      },
      {
        path: "public/favicon.svg",
        content: VUE_SVG,
      },
      {
        path: "src/assets/vue.svg",
        content: VUE_SVG,
      },
      {
        path: "src/main.ts",
        content: `import { createApp } from 'vue';
import App from './App.vue';
import './style.css';

createApp(App).mount('#app');`,
      },
      {
        path: "src/App.vue",
        isEntrypoint: true,
        content: `<script setup lang="ts">
import { ref } from 'vue';
import Counter from './components/Counter.vue';

const message = ref('Vue 3 + TypeScript Starter');
</script>

<template>
  <div class="vue-container">
    <div class="logos">
      <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
    </div>
    <h1>{{ message }}</h1>
    <p class="subtitle">Reactive Single File Components in Confluo</p>

    <Counter />
  </div>
</template>

<style scoped>
.vue-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 3rem 1rem;
  text-align: center;
}
.logos {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}
.logo.vue {
  height: 5rem;
  transition: transform 0.25s ease;
}
.logo.vue:hover {
  transform: scale(1.1);
}
h1 {
  font-size: 2.2rem;
  color: #42b883;
}
.subtitle {
  color: #a1a1aa;
}
</style>`,
      },
      {
        path: "src/components/Counter.vue",
        content: `<script setup lang="ts">
import { ref } from 'vue';

const count = ref(0);
const increment = () => count.value++;
const reset = () => count.value = 0;
</script>

<template>
  <div class="counter-box">
    <p class="count-display">Current Count: <strong>{{ count }}</strong></p>
    <div class="btn-group">
      <button class="primary" @click="increment">Increment +1</button>
      <button class="secondary" @click="reset">Reset</button>
    </div>
  </div>
</template>

<style scoped>
.counter-box {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 12px;
  padding: 2rem;
  margin-top: 1.5rem;
}
.count-display {
  font-size: 1.25rem;
  color: #fff;
}
.btn-group {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
}
button {
  padding: 0.6rem 1.4rem;
  font-size: 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  border: none;
}
button.primary { background: #42b883; color: #000; }
button.secondary { background: #27272a; color: #fff; }
</style>`,
      },
      {
        path: "src/style.css",
        content: `body { margin: 0; background-color: #09090b; color: #f4f4f5; font-family: Inter, system-ui, sans-serif; }`,
      },
      {
        path: "README.md",
        content: `# Vue 3 + TypeScript Starter\n\nFull SFC Vue 3 application on Confluo.`,
      },
    ],
  },
  {
    id: "svelte",
    name: "Svelte 5 + TypeScript",
    description: "Ultra-fast, zero-virtual-DOM UI with Svelte 5 runes, TypeScript, and Vite.",
    category: "frontend",
    language: "typescript",
    icon: "svelte",
    tags: ["Svelte 5", "TypeScript", "Vite", "Runes"],
    files: [
      {
        path: "package.json",
        content: JSON.stringify(
          {
            name: "svelte-project",
            private: true,
            version: "0.0.0",
            type: "module",
            scripts: { dev: "vite", build: "vite build" },
            dependencies: { svelte: "^5.0.0" },
            devDependencies: { "@sveltejs/vite-plugin-svelte": "^4.0.0", typescript: "~5.7.0", vite: "^6.0.0" },
          },
          null,
          2
        ),
      },
      {
        path: "vite.config.ts",
        content: `import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
});
`,
      },
      {
        path: "tsconfig.json",
        content: JSON.stringify(
          {
            compilerOptions: {
              target: "ES2022",
              module: "ESNext",
              moduleResolution: "bundler",
              strict: true,
            },
            include: ["src/**/*.ts", "src/**/*.svelte"],
          },
          null,
          2
        ),
      },
      {
        path: "index.html",
        content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Svelte 5 App</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`,
      },
      {
        path: "public/favicon.svg",
        content: SVELTE_SVG,
      },
      {
        path: "src/assets/svelte.svg",
        content: SVELTE_SVG,
      },
      {
        path: "src/main.ts",
        content: `import { mount } from 'svelte';
import App from './App.svelte';
import './app.css';

const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;`,
      },
      {
        path: "src/App.svelte",
        isEntrypoint: true,
        content: `<script lang="ts">
  import Badge from './components/Badge.svelte';

  let count = $state(0);
</script>

<main class="svelte-container">
  <div class="logo-wrap">
    <img src="/favicon.svg" alt="Svelte Logo" class="logo" />
  </div>

  <h1>Svelte 5 + TypeScript</h1>
  <p class="subtitle">Reactive Runes & Compile-Time Architecture</p>

  <div class="card">
    <button onclick={() => count++}>Clicks: {count}</button>
    <p>Using <code>$state()</code> reactive runes.</p>
  </div>

  <Badge label="Zero Virtual DOM" />
</main>

<style>
  .svelte-container {
    max-width: 720px;
    margin: 0 auto;
    padding: 3rem 1rem;
    text-align: center;
  }
  .logo {
    height: 5rem;
    transition: transform 0.2s;
  }
  .logo:hover {
    transform: scale(1.1);
  }
  h1 {
    color: #ff3e00;
    margin: 1rem 0 0.5rem;
  }
  .subtitle {
    color: #a1a1aa;
    margin-bottom: 2rem;
  }
  .card {
    background: #18181b;
    border: 1px solid #27272a;
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 1.5rem;
  }
  button {
    background: #ff3e00;
    color: white;
    border: none;
    font-weight: 600;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
  }
</style>`,
      },
      {
        path: "src/components/Badge.svelte",
        content: `<script lang="ts">
  interface Props {
    label: string;
  }
  let { label }: Props = $props();
</script>

<div class="badge">⚡ {label}</div>

<style>
  .badge {
    display: inline-block;
    background: #27272a;
    color: #e4e4e7;
    font-family: monospace;
    font-size: 0.875rem;
    padding: 0.35rem 0.75rem;
    border-radius: 9999px;
  }
</style>`,
      },
      {
        path: "src/app.css",
        content: `body { margin: 0; background: #09090b; color: #f4f4f5; font-family: sans-serif; }`,
      },
      {
        path: "README.md",
        content: `# Svelte 5 Starter\n\nBuilt with Svelte 5 and Vite.`,
      },
    ],
  },
  {
    id: "solid",
    name: "Solid.js + TypeScript",
    description: "Simple, performant reactivity with JSX and fine-grained updates via Solid.js.",
    category: "frontend",
    language: "typescript",
    icon: "solid",
    tags: ["Solid.js", "TypeScript", "Vite", "Reactivity"],
    files: [
      {
        path: "package.json",
        content: JSON.stringify(
          {
            name: "solid-project",
            private: true,
            version: "0.0.0",
            type: "module",
            scripts: { dev: "vite", build: "vite build" },
            dependencies: { "solid-js": "^1.9.0" },
            devDependencies: { "vite-plugin-solid": "^2.11.0", typescript: "~5.7.0", vite: "^6.0.0" },
          },
          null,
          2
        ),
      },
      {
        path: "vite.config.ts",
        content: `import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solid()],
});
`,
      },
      {
        path: "tsconfig.json",
        content: JSON.stringify(
          {
            compilerOptions: {
              target: "ES2022",
              module: "ESNext",
              moduleResolution: "bundler",
              jsx: "preserve",
              jsxImportSource: "solid-js",
              strict: true,
            },
            include: ["src"],
          },
          null,
          2
        ),
      },
      {
        path: "index.html",
        content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Solid.js App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/index.tsx"></script>
  </body>
</html>`,
      },
      {
        path: "public/favicon.svg",
        content: SOLID_SVG,
      },
      {
        path: "src/index.tsx",
        content: `import { render } from 'solid-js/web';
import App from './App';
import './index.css';

render(() => <App />, document.getElementById('root')!);`,
      },
      {
        path: "src/App.tsx",
        isEntrypoint: true,
        content: `import { createSignal } from 'solid-js';

export default function App() {
  const [count, setCount] = createSignal(0);

  return (
    <div class="solid-container">
      <img src="/favicon.svg" alt="Solid Logo" class="logo" />
      <h1>Solid.js + TypeScript</h1>
      <p class="subtitle">Fine-grained reactivity without a virtual DOM</p>

      <div class="card">
        <button onClick={() => setCount((c) => c + 1)}>
          Count is {count()}
        </button>
        <p>Edit <code>src/App.tsx</code> to test fine-grained signals.</p>
      </div>
    </div>
  );
}`,
      },
      {
        path: "src/index.css",
        content: `body { margin: 0; background: #09090b; color: #f4f4f5; font-family: sans-serif; text-align: center; }
.solid-container { max-width: 720px; margin: 0 auto; padding: 3rem 1rem; }
.logo { height: 5rem; margin-bottom: 1rem; }
h1 { color: #4488ee; }
.subtitle { color: #a1a1aa; }
.card { background: #18181b; border: 1px solid #27272a; border-radius: 10px; padding: 2rem; margin-top: 1.5rem; }
button { background: #4488ee; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; }`,
      },
      {
        path: "README.md",
        content: `# Solid.js Starter\n\nHigh-performance reactive starter with Solid.js.`,
      },
    ],
  },
  {
    id: "angular",
    name: "Angular 18+ (Standalone)",
    description: "Enterprise modular web app using modern Standalone Components and TypeScript.",
    category: "frontend",
    language: "typescript",
    icon: "angular",
    tags: ["Angular 18", "Standalone", "TypeScript", "RxJS"],
    availableDependencies: [
      { id: 'rxjs', name: 'RxJS', description: 'Reactive extensions for asynchronous programming.', category: 'Async', defaultSelected: true },
      { id: 'lucide-angular', name: 'Lucide Angular', description: 'Modern SVG icons for Angular.', category: 'UI & Icons' },
    ],
    defaultConfig: {
      dependencies: ['rxjs'],
    },
    files: [
      {
        path: "package.json",
        content: JSON.stringify(
          {
            name: "angular-standalone-project",
            private: true,
            version: "0.0.0",
            type: "module",
            scripts: { dev: "vite", build: "vite build" },
            dependencies: {
              "@angular/core": "^18.0.0",
              "@angular/common": "^18.0.0",
              rxjs: "^7.8.0",
              "zone.js": "^0.14.0",
            },
            devDependencies: { typescript: "~5.7.0", vite: "^6.0.0" },
          },
          null,
          2
        ),
      },
      {
        path: "tsconfig.json",
        content: JSON.stringify(
          {
            compilerOptions: {
              target: "ES2022",
              module: "ESNext",
              moduleResolution: "bundler",
              experimentalDecorators: true,
              strict: true,
            },
            include: ["src"],
          },
          null,
          2
        ),
      },
      {
        path: "index.html",
        content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Angular Standalone App</title>
  </head>
  <body>
    <app-root></app-root>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`,
      },
      {
        path: "public/favicon.svg",
        content: ANGULAR_SVG,
      },
      {
        path: "src/assets/angular.svg",
        content: ANGULAR_SVG,
      },
      {
        path: "src/main.ts",
        content: `import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent).catch((err) => console.error(err));`,
      },
      {
        path: "src/app/app.component.ts",
        isEntrypoint: true,
        content: `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Angular Standalone Starter';
  count = 0;

  increment() {
    this.count++;
  }
}`,
      },
      {
        path: "src/app/app.component.html",
        content: `<div class="container">
  <div class="logo-box">
    <img src="/favicon.svg" alt="Angular Logo" class="logo" />
  </div>
  <h1>{{ title }}</h1>
  <p class="subtitle">Clean Standalone Component Architecture</p>

  <div class="card">
    <button (click)="increment()">Clicked {{ count }} times</button>
  </div>
</div>`,
      },
      {
        path: "src/app/app.component.css",
        content: `.container { max-width: 800px; margin: 0 auto; padding: 3rem 1rem; text-align: center; }
.logo { height: 5rem; }
h1 { color: #dd0031; }
.subtitle { color: #a1a1aa; }
.card { background: #18181b; border: 1px solid #27272a; border-radius: 10px; padding: 2rem; margin-top: 1.5rem; }
button { background: #dd0031; color: white; border: none; font-weight: 600; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; }`,
      },
      {
        path: "src/styles.css",
        content: `body { margin: 0; background: #09090b; color: #f4f4f5; font-family: sans-serif; }`,
      },
      {
        path: "README.md",
        content: `# Angular 18 Standalone Starter\n\nAngular with modern standalone component architecture.`,
      },
    ],
  },
  {
    id: "node-express",
    name: "Node.js Express REST API",
    description: "Backend REST service with Express, CORS, environment variables, and modular routes.",
    category: "backend",
    language: "javascript",
    icon: "node",
    tags: ["Node.js", "Express", "REST API", "CORS"],
    availableDependencies: [
      { id: 'cors', name: 'CORS', description: 'Enable cross-origin requests for clients.', category: 'Middleware', defaultSelected: true },
      { id: 'dotenv', name: 'Dotenv', description: 'Load environment variables from .env.', category: 'Configuration', defaultSelected: true },
      { id: 'morgan', name: 'Morgan', description: 'HTTP request logger middleware.', category: 'Logging', defaultSelected: true },
      { id: 'zod', name: 'Zod', description: 'Schema validation for request payloads.', category: 'Validation' },
      { id: 'jsonwebtoken', name: 'JWT', description: 'Token-based authentication.', category: 'Auth' },
      { id: 'nodemon', name: 'Nodemon', description: 'Hot reload tool for development.', category: 'DevTools' },
    ],
    defaultConfig: {
      dependencies: ['cors', 'dotenv', 'morgan'],
      moduleType: 'module',
      port: '3000',
    },
    files: [
      {
        path: "package.json",
        content: JSON.stringify(
          {
            name: "express-api-starter",
            version: "1.0.0",
            type: "module",
            scripts: {
              start: "node src/index.js",
              dev: "nodemon src/index.js",
            },
            dependencies: {
              express: "^4.21.0",
              cors: "^2.8.5",
              dotenv: "^16.4.5",
              morgan: "^1.10.0",
            },
            devDependencies: {
              nodemon: "^3.1.7",
            },
          },
          null,
          2
        ),
      },
      {
        path: "src/index.js",
        isEntrypoint: true,
        content: `import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { itemsRouter } from './routes/items.js';
import { logger } from './middleware/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(logger);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Modular resource route
app.use('/api/items', itemsRouter);

app.listen(PORT, () => {
  console.log(\`Server listening at http://localhost:\${PORT}\`);
});
`,
      },
      {
        path: "src/routes/items.js",
        content: `import { Router } from 'express';

export const itemsRouter = Router();

const items = [
  { id: 1, name: 'Setup Confluo Workspace', completed: true },
  { id: 2, name: 'Write collaborative code', completed: false },
  { id: 3, name: 'Push to Remote Git', completed: false },
];

itemsRouter.get('/', (req, res) => {
  res.json({ success: true, count: items.length, data: items });
});

itemsRouter.post('/', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const newItem = { id: items.length + 1, name, completed: false };
  items.push(newItem);
  res.status(201).json(newItem);
});
`,
      },
      {
        path: "src/middleware/logger.js",
        content: `export function logger(req, res, next) {
  console.log(\`[\${new Date().toLocaleTimeString()}] \${req.method} \${req.url}\`);
  next();
}
`,
      },
      {
        path: ".env.example",
        content: `PORT=3000
NODE_ENV=development
`,
      },
      {
        path: "README.md",
        content: `# Node.js Express REST API\n\nModular backend template with routers and CORS.`,
      },
    ],
  },
  {
    id: "node-ts",
    name: "Node.js + TypeScript",
    description: "Clean Node.js application configured with TypeScript, ES modules, and async helpers.",
    category: "backend",
    language: "typescript",
    icon: "node",
    tags: ["Node.js", "TypeScript", "Async", "CLI"],
    files: [
      {
        path: "package.json",
        content: JSON.stringify(
          {
            name: "node-ts-starter",
            version: "1.0.0",
            type: "module",
            scripts: {
              build: "tsc",
              start: "node dist/index.js",
            },
            devDependencies: {
              "@types/node": "^22.0.0",
              typescript: "~5.7.0",
            },
          },
          null,
          2
        ),
      },
      {
        path: "tsconfig.json",
        content: JSON.stringify(
          {
            compilerOptions: {
              target: "ES2022",
              module: "NodeNext",
              moduleResolution: "NodeNext",
              outDir: "./dist",
              rootDir: "./src",
              strict: true,
            },
            include: ["src"],
          },
          null,
          2
        ),
      },
      {
        path: "src/index.ts",
        isEntrypoint: true,
        content: `import { fibonacci, formatGreeting } from './utils/math';

console.log(formatGreeting('Developer'));

const numbers = [1, 2, 3, 4, 5, 6, 7, 8];
console.log('Fibonacci sequence demo:');
numbers.forEach((n) => {
  console.log(\`  fib(\${n}) = \${fibonacci(n)}\`);
});
`,
      },
      {
        path: "src/utils/math.ts",
        content: `export function fibonacci(n: number): number {
  if (n <= 1) return n;
  let prev = 0, curr = 1;
  for (let i = 2; i <= n; i++) {
    const next = prev + curr;
    prev = curr;
    curr = next;
  }
  return curr;
}

export function formatGreeting(name: string): string {
  return \`🚀 Welcome to Node.js + TypeScript on Confluo, \${name}!\`;
}
`,
      },
      {
        path: "README.md",
        content: `# Node.js + TypeScript\n\nClean TypeScript backend environment.`,
      },
    ],
  },
  {
    id: "html-css-js",
    name: "Vanilla Web + Canvas",
    description: "Pure HTML5, Modern CSS, interactive JavaScript, and SVG assets without a build step.",
    category: "vanilla",
    language: "html",
    icon: "html",
    tags: ["HTML5", "CSS3", "JavaScript", "Canvas"],
    files: [
      {
        path: "index.html",
        isEntrypoint: true,
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="/public/icon.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vanilla Web App</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="card">
    <div class="icon-wrap">
      <img src="public/icon.svg" alt="App Icon" class="app-icon" />
    </div>
    <h1>Vanilla Web Starter</h1>
    <p class="subtitle">HTML5, Modern CSS, and interactive Canvas</p>

    <div class="stats">
      <button id="counter-btn">Clicks: <span id="count">0</span></button>
      <button id="color-btn">Toggle Theme</button>
    </div>

    <canvas id="visualizer" width="400" height="160"></canvas>
  </div>
  <script src="main.js"></script>
</body>
</html>`,
      },
      {
        path: "public/icon.svg",
        content: CODE_SVG,
      },
      {
        path: "style.css",
        content: `* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #09090b;
  color: #f4f4f5;
  font-family: system-ui, -apple-system, sans-serif;
}
.card {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 14px;
  padding: 2.5rem;
  max-width: 480px;
  width: 90%;
  text-align: center;
}
.app-icon { height: 3.5rem; margin-bottom: 0.5rem; }
h1 { margin: 0.5rem 0; font-size: 1.8rem; }
.subtitle { color: #a1a1aa; margin-bottom: 1.5rem; }
.stats { display: flex; justify-content: center; gap: 1rem; margin-bottom: 1.5rem; }
button {
  background: #10b981;
  color: #000;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  padding: 0.6rem 1.2rem;
  cursor: pointer;
}
canvas {
  background: #121215;
  border: 1px solid #27272a;
  border-radius: 8px;
  width: 100%;
}`,
      },
      {
        path: "main.js",
        content: `let count = 0;
const countEl = document.getElementById('count');
const btn = document.getElementById('counter-btn');

btn.addEventListener('click', () => {
  count++;
  countEl.textContent = count;
});

// Canvas particle visualizer
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
let t = 0;

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#10b981';

  for (let i = 0; i < 20; i++) {
    const x = (i * 20) + 10;
    const h = 40 + Math.sin(t + i * 0.3) * 30;
    const y = canvas.height - h - 20;
    ctx.fillRect(x, y, 12, h);
  }

  t += 0.05;
  requestAnimationFrame(draw);
}
draw();
`,
      },
      {
        path: "README.md",
        content: `# Vanilla Web App\n\nPure HTML5, CSS3, and JavaScript project.`,
      },
    ],
  },
  {
    id: "python",
    name: "Python 3 Starter",
    description: "Standard Python 3 programming environment with modular helper functions and runner support.",
    category: "general",
    language: "python",
    icon: "python",
    tags: ["Python 3", "Algorithms", "Runner", "CLI"],
    files: [
      {
        path: "main.py",
        isEntrypoint: true,
        content: `from utils import calculate_stats, print_banner

def main():
    print_banner("Python 3 Starter on Confluo")

    dataset = [14, 28, 42, 56, 70, 84, 98, 112]
    mean, total, maximum = calculate_stats(dataset)

    print(f"Data: {dataset}")
    print(f"Total: {total}")
    print(f"Mean:  {mean:.2f}")
    print(f"Max:   {maximum}")
    print("\\nExecution completed successfully.")

if __name__ == "__main__":
    main()
`,
      },
      {
        path: "utils.py",
        content: `def print_banner(text: str):
    line = "=" * (len(text) + 8)
    print(line)
    print(f"=== {text} ===")
    print(line)

def calculate_stats(numbers):
    if not numbers:
        return 0, 0, 0
    total = sum(numbers)
    mean = total / len(numbers)
    maximum = max(numbers)
    return mean, total, maximum
`,
      },
      {
        path: "requirements.txt",
        content: `# Add any external packages below (e.g. requests, numpy)
`,
      },
      {
        path: "README.md",
        content: `# Python 3 Starter\n\nRun with the interactive bottom panel terminal or runner.`,
      },
    ],
  },
  {
    id: "cpp",
    name: "C++20 Starter",
    description: "Modern C++ with STL containers, algorithms, and console runner integration.",
    category: "general",
    language: "cpp",
    icon: "cpp",
    tags: ["C++20", "STL", "Runner", "High Performance"],
    files: [
      {
        path: "main.cpp",
        isEntrypoint: true,
        content: `#include <iostream>
#include <vector>
#include <numeric>
#include <algorithm>

int main() {
    std::cout << "=== C++20 Starter on Confluo ===" << std::endl;

    std::vector<int> numbers = {5, 12, 19, 26, 33, 40};
    int sum = std::accumulate(numbers.begin(), numbers.end(), 0);

    std::cout << "Vector elements: ";
    for (int n : numbers) {
        std::cout << n << " ";
    }
    std::cout << std::endl;

    std::cout << "Sum: " << sum << std::endl;
    std::cout << "Average: " << static_cast<double>(sum) / numbers.size() << std::endl;

    return 0;
}
`,
      },
      {
        path: "README.md",
        content: `# C++20 Starter\n\nCompile and run directly using Confluo's runner execution panel.`,
      },
    ],
  },
  {
    id: "java",
    name: "Java 21 Starter",
    description: "Standard Java 21 console application ready for compilation and instant execution.",
    category: "general",
    language: "java",
    icon: "java",
    tags: ["Java 21", "Standard JDK", "Runner"],
    files: [
      {
        path: "src/Main.java",
        isEntrypoint: true,
        content: `package src;

import java.util.List;

public class Main {
    public static void main(String[] args) {
        System.out.println("=== Java 21 Console Application ===");
        System.out.println("Running collaborative project in Confluo\\n");

        List<String> frameworks = List.of("React", "Vue", "Angular", "Node.js", "Java");
        System.out.println("Supported Starter Stacks:");
        frameworks.forEach(f -> System.out.println(" - " + f));
    }
}
`,
      },
      {
        path: "README.md",
        content: `# Java 21 Starter\n\nReady to compile and run using \`javac\` and \`java\` in Confluo.`,
      },
    ],
  },
  {
    id: "rust",
    name: "Rust Starter",
    description: "Memory-safe systems programming with Rust and Cargo manifest.",
    category: "general",
    language: "rust",
    icon: "rust",
    tags: ["Rust", "Cargo", "Memory Safe", "Runner"],
    files: [
      {
        path: "Cargo.toml",
        content: `[package]
name = "rust-starter"
version = "0.1.0"
edition = "2021"

[dependencies]
`,
      },
      {
        path: "src/main.rs",
        isEntrypoint: true,
        content: `fn main() {
    println!("=== Rust Starter on Confluo ===");
    let numbers = vec![1, 2, 3, 4, 5, 6, 7, 8];
    let sum: i32 = numbers.iter().sum();
    println!("Numbers: {:?}", numbers);
    println!("Sum: {}", sum);
}
`,
      },
      {
        path: "README.md",
        content: `# Rust Starter\n\nCompile and execute with Cargo on Confluo.`,
      },
    ],
  },
  {
    id: "go",
    name: "Go Starter",
    description: "Fast, concurrent, compiled programming starter with Go modules.",
    category: "general",
    language: "go",
    icon: "go",
    tags: ["Go", "Go Modules", "Concurrency", "Runner"],
    files: [
      {
        path: "go.mod",
        content: `module confluo/starter

go 1.22
`,
      },
      {
        path: "main.go",
        isEntrypoint: true,
        content: `package main

import (
	"fmt"
	"time"
)

func main() {
	fmt.Println("=== Go Starter on Confluo ===")
	fmt.Printf("Current Time: %s\\n", time.Now().Format(time.RFC1123))

	items := []string{"Fast Compilation", "Garbage Collected", "Built-in Concurrency"}
	for i, item := range items {
		fmt.Printf(" [%d] %s\\n", i+1, item)
	}
}
`,
      },
      {
        path: "README.md",
        content: `# Go Starter\n\nRun Go programs in Confluo.`,
      },
    ],
  },
];

export function getTemplateById(id?: string | null): ProjectTemplate {
  if (!id) return TEMPLATES[0]; // blank
  const found = TEMPLATES.find((t) => t.id === id);
  if (found) return found;

  // Graceful fallback for legacy templates
  if (id === "spring-boot") {
    return {
      id: "spring-boot",
      name: "Java Spring Boot (Legacy)",
      description: "Legacy Spring Boot template (use Java 21 Console starter instead).",
      category: "backend",
      language: "java",
      icon: "spring",
      tags: ["Legacy"],
      files: [],
    };
  }
  if (id === "flask") {
    return {
      id: "flask",
      name: "Python Flask (Legacy)",
      description: "Legacy Flask template (use Python 3 Starter instead).",
      category: "backend",
      language: "python",
      icon: "flask",
      tags: ["Legacy"],
      files: [],
    };
  }

  return TEMPLATES[0];
}
