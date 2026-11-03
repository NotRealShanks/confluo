import type { ProjectTemplate } from "./types";

export const TEMPLATES: ProjectTemplate[] = [
  {
    id: "blank",
    name: "Blank Project",
    description: "An empty canvas with no predefined starter files. Build your workspace from scratch.",
    category: "general",
    language: "plaintext",
    icon: "code",
    tags: ["Minimal", "Empty"],
    files: [],
  },
  {
    id: "react-ts",
    name: "React + TypeScript",
    description: "Modern component-based UI using React 19, TypeScript, and Vite.",
    category: "frontend",
    language: "typescript",
    icon: "react",
    tags: ["React 19", "TypeScript", "Vite"],
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
            },
            dependencies: {
              react: "^19.0.0",
              "react-dom": "^19.0.0",
              "lucide-react": "^1.0.0",
            },
            devDependencies: {
              typescript: "~5.7.0",
              vite: "^6.0.0",
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

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="container">
      <header>
        <h1>React + TypeScript Starter</h1>
        <p>Real-time collaborative editing in Confluo</p>
      </header>

      <main>
        <button onClick={() => setCount((c) => c + 1)}>
          Count: {count}
        </button>
      </main>
    </div>
  );
}`,
      },
      {
        path: "src/index.css",
        content: `:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  color: #f4f4f5;
  background-color: #09090b;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

button {
  border-radius: 8px;
  border: 1px solid #27272a;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  background-color: #18181b;
  color: #fff;
  cursor: pointer;
  transition: border-color 0.25s;
}

button:hover {
  border-color: #ffffff;
}`,
      },
    ],
  },
  {
    id: "react-js",
    name: "React + JavaScript",
    description: "Lightweight React setup using standard JSX and Vite for rapid development.",
    category: "frontend",
    language: "javascript",
    icon: "react",
    tags: ["React 19", "JavaScript", "JSX"],
    availableDependencies: [
      { id: 'lucide-react', name: 'Lucide React', description: 'Clean, lightweight SVG icons library.', category: 'UI & Icons', defaultSelected: true },
      { id: 'tailwindcss', name: 'Tailwind CSS', description: 'Utility-first modern CSS framework.', category: 'Styling', defaultSelected: true },
      { id: 'axios', name: 'Axios', description: 'Promise based HTTP client for REST APIs.', category: 'Networking', defaultSelected: true },
      { id: 'zustand', name: 'Zustand', description: 'Lightweight, scalable global state management.', category: 'State Management' },
      { id: 'react-router-dom', name: 'React Router', description: 'Standard declarative client-side routing.', category: 'Routing' },
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
            name: "react-js-project",
            private: true,
            version: "0.0.0",
            type: "module",
            scripts: { dev: "vite" },
            dependencies: { react: "^19.0.0", "react-dom": "^19.0.0" },
            devDependencies: { vite: "^6.0.0" },
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
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
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

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="card">
      <h1>Hello React!</h1>
      <p>Click below to test reactive state updates:</p>
      <button onClick={() => setCount(count + 1)}>
        Clicks: {count}
      </button>
    </div>
  );
}`,
      },
      {
        path: "src/index.css",
        content: `body {
  margin: 0;
  background: #121214;
  color: #f4f4f5;
  font-family: sans-serif;
  display: grid;
  place-items: center;
  height: 100vh;
}
.card {
  padding: 24px;
  border: 1px solid #27272a;
  border-radius: 8px;
  background: #18181b;
  text-align: center;
}`,
      },
    ],
  },
  {
    id: "angular",
    name: "Angular",
    description: "Modern Angular standalone component starter with TypeScript and clean routing.",
    category: "frontend",
    language: "typescript",
    icon: "angular",
    tags: ["Angular", "TypeScript", "Standalone"],
    availableDependencies: [
      { id: 'rxjs', name: 'RxJS', description: 'Reactive Extensions for asynchronous data streams.', category: 'Core', defaultSelected: true },
      { id: 'lucide-angular', name: 'Lucide Angular', description: 'Lucide icon set component for Angular.', category: 'UI & Icons' },
    ],
    defaultConfig: {
      dependencies: ['rxjs'],
    },
    files: [
      {
        path: "package.json",
        content: JSON.stringify(
          {
            name: "angular-starter",
            version: "0.0.0",
            scripts: { ng: "ng", start: "ng serve", build: "ng build" },
            dependencies: { "@angular/core": "^19.0.0", "@angular/common": "^19.0.0" },
          },
          null,
          2
        ),
      },
      {
        path: "angular.json",
        content: JSON.stringify(
          {
            $schema: "./node_modules/@angular/cli/lib/config/schema.json",
            version: 1,
            projects: {
              "angular-starter": {
                projectType: "application",
                root: "",
                sourceRoot: "src",
              },
            },
          },
          null,
          2
        ),
      },
      {
        path: "src/index.html",
        content: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Angular Starter</title>
</head>
<body>
  <app-root></app-root>
</body>
</html>`,
      },
      {
        path: "src/main.ts",
        content: `import { bootstrapApplication } from '@angular/platform-browser';
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
}`,
      },
      {
        path: "src/app/app.component.html",
        content: `<div class="container">
  <h1>{{ title }}</h1>
  <p>Collaborative Angular development in Confluo.</p>
</div>`,
      },
      {
        path: "src/app/app.component.css",
        content: `.container {
  padding: 2rem;
  font-family: system-ui, sans-serif;
  color: #f4f4f5;
}`,
      },
    ],
  },
  {
    id: "vue",
    name: "Vue.js",
    description: "Vue 3 Single File Component starter utilizing Vite and the Composition API.",
    category: "frontend",
    language: "vue",
    icon: "vue",
    tags: ["Vue 3", "Composition API", "Vite"],
    availableDependencies: [
      { id: 'pinia', name: 'Pinia', description: 'The intuitive, type-safe store for Vue.', category: 'State Management', defaultSelected: true },
      { id: 'vue-router', name: 'Vue Router', description: 'Official Vue router for single-page applications.', category: 'Routing' },
      { id: 'axios', name: 'Axios', description: 'Promise-based HTTP client for requests.', category: 'Networking', defaultSelected: true },
      { id: 'lucide-vue-next', name: 'Lucide Vue', description: 'Clean SVG icon library for Vue 3.', category: 'UI & Icons' },
    ],
    defaultConfig: {
      dependencies: ['pinia', 'axios'],
    },
    files: [
      {
        path: "package.json",
        content: JSON.stringify(
          {
            name: "vue-project",
            version: "0.0.0",
            type: "module",
            scripts: { dev: "vite", build: "vite build" },
            dependencies: { vue: "^3.5.0" },
            devDependencies: { vite: "^6.0.0", "@vitejs/plugin-vue": "^5.0.0" },
          },
          null,
          2
        ),
      },
      {
        path: "index.html",
        content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Vue 3 App</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>`,
      },
      {
        path: "src/main.js",
        content: `import { createApp } from 'vue';
import App from './App.vue';
import './style.css';

createApp(App).mount('#app');`,
      },
      {
        path: "src/App.vue",
        isEntrypoint: true,
        content: `<script setup>
import { ref } from 'vue'

const message = ref('Welcome to Vue 3!')
const count = ref(0)
</script>

<template>
  <main class="wrapper">
    <h1>{{ message }}</h1>
    <button @click="count++">Count is: {{ count }}</button>
  </main>
</template>

<style scoped>
.wrapper {
  text-align: center;
  padding: 2rem;
}
button {
  background: #42b883;
  color: #000;
  font-weight: 600;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}
</style>`,
      },
      {
        path: "src/style.css",
        content: `body {
  margin: 0;
  background: #09090b;
  color: #f4f4f5;
  font-family: Inter, sans-serif;
}`,
      },
    ],
  },
  {
    id: "spring-boot",
    name: "Spring Boot + Java",
    description: "Enterprise Java REST API with Maven pom.xml and sample controller.",
    category: "backend",
    language: "java",
    icon: "spring",
    tags: ["Java 21", "Spring Boot", "Maven"],
    availableDependencies: [
      { id: 'web', name: 'Spring Web', description: 'Build RESTful APIs with Spring MVC & embedded Tomcat server.', category: 'Web', defaultSelected: true },
      { id: 'data-jpa', name: 'Spring Data JPA', description: 'Persist data in SQL stores with JPA and Hibernate ORM.', category: 'SQL & Persistence', defaultSelected: true },
      { id: 'h2', name: 'H2 Database', description: 'Fast in-memory database that supports JDBC APIs and SQL.', category: 'SQL & Persistence', defaultSelected: true },
      { id: 'postgresql', name: 'PostgreSQL Driver', description: 'PostgreSQL JDBC driver.', category: 'SQL & Persistence' },
      { id: 'mysql', name: 'MySQL Driver', description: 'MySQL JDBC driver.', category: 'SQL & Persistence' },
      { id: 'devtools', name: 'Spring Boot DevTools', description: 'Fast application restarts and LiveReload for rapid iteration.', category: 'Developer Tools', defaultSelected: true },
      { id: 'lombok', name: 'Lombok', description: 'Java annotation library to reduce boilerplate getters/setters.', category: 'Developer Tools', defaultSelected: true },
      { id: 'security', name: 'Spring Security', description: 'Authentication and access-control framework.', category: 'Security' },
      { id: 'validation', name: 'Validation', description: 'Bean Validation with Hibernate Validator.', category: 'Validation' },
      { id: 'actuator', name: 'Spring Boot Actuator', description: 'Production-ready health checks and metrics.', category: 'Operations' },
    ],
    defaultConfig: {
      groupId: 'com.example',
      artifactId: 'demo',
      packageName: 'com.example.demo',
      javaVersion: '17',
      packaging: 'jar',
      bootVersion: '3.3.0',
      dependencies: ['web', 'data-jpa', 'h2', 'devtools', 'lombok'],
    },
    files: [
      {
        path: "pom.xml",
        content: `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.3.0</version>
        <relativePath/>
    </parent>
    <groupId>com.example</groupId>
    <artifactId>demo</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>demo</name>
    <properties>
        <java.version>21</java.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
    </dependencies>
</project>`,
      },
      {
        path: "src/main/resources/application.properties",
        content: `server.port=8080
spring.application.name=demo-service`,
      },
      {
        path: "src/main/java/com/example/demo/DemoApplication.java",
        content: `package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}`,
      },
      {
        path: "src/main/java/com/example/demo/HelloController.java",
        isEntrypoint: true,
        content: `package com.example.demo;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
public class HelloController {

    @GetMapping("/api/hello")
    public Map<String, Object> hello() {
        return Map.of(
            "status", "ok",
            "message", "Hello from Confluo Spring Boot workspace!"
        );
    }
}`,
      },
    ],
  },
  {
    id: "flask",
    name: "Flask + Python",
    description: "Lightweight Python Flask web server with JSON routing and templates.",
    category: "backend",
    language: "python",
    icon: "python",
    tags: ["Python 3", "Flask", "Microframework"],
    availableDependencies: [
      { id: 'flask-cors', name: 'Flask-CORS', description: 'Enables Cross-Origin Resource Sharing for API routes.', category: 'Middleware', defaultSelected: true },
      { id: 'python-dotenv', name: 'python-dotenv', description: 'Loads environment variables from .env file.', category: 'Config', defaultSelected: true },
      { id: 'sqlalchemy', name: 'SQLAlchemy', description: 'Python SQL toolkit and Object Relational Mapper.', category: 'Database' },
      { id: 'requests', name: 'Requests', description: 'Elegant and simple HTTP library for Python.', category: 'Networking' },
      { id: 'pydantic', name: 'Pydantic', description: 'Data validation using Python type hints.', category: 'Validation' },
      { id: 'pytest', name: 'pytest', description: 'Simple and scalable test framework.', category: 'Testing' },
    ],
    defaultConfig: {
      dependencies: ['flask-cors', 'python-dotenv'],
    },
    files: [
      {
        path: "app.py",
        isEntrypoint: true,
        content: `from flask import Flask, jsonify, render_template

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/status")
def status():
    return jsonify({
        "status": "online",
        "service": "Flask Collaborative Workspace"
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)`,
      },
      {
        path: "requirements.txt",
        content: `flask>=3.0.0
gunicorn>=21.2.0`,
      },
      {
        path: "templates/index.html",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Flask App</title>
    <link rel="stylesheet" href="/static/style.css">
</head>
<body>
    <h1>Flask Application</h1>
    <p>Running from your collaborative cloud workspace.</p>
</body>
</html>`,
      },
      {
        path: "static/style.css",
        content: `body {
    font-family: system-ui, sans-serif;
    background: #09090b;
    color: #f4f4f5;
    padding: 2rem;
}`,
      },
    ],
  },
  {
    id: "node-express",
    name: "Node.js + Express",
    description: "Modular Express.js backend server with REST endpoints and middleware.",
    category: "backend",
    language: "javascript",
    icon: "node",
    tags: ["Node.js", "Express", "REST API"],
    availableDependencies: [
      { id: 'cors', name: 'CORS', description: 'Enable Cross-Origin Resource Sharing middleware.', category: 'Middleware', defaultSelected: true },
      { id: 'dotenv', name: 'dotenv', description: 'Loads environment variables from .env file.', category: 'Config', defaultSelected: true },
      { id: 'nodemon', name: 'nodemon', description: 'Automatically restarts node application on file changes.', category: 'Developer Tools', defaultSelected: true },
      { id: 'morgan', name: 'Morgan', description: 'HTTP request logger middleware for node.js.', category: 'Logging', defaultSelected: true },
      { id: 'zod', name: 'Zod', description: 'TypeScript/JavaScript schema validation.', category: 'Validation' },
      { id: 'jsonwebtoken', name: 'JSON Web Token', description: 'JWT authentication token support.', category: 'Security' },
      { id: 'mongoose', name: 'Mongoose', description: 'MongoDB object modeling for Node.js.', category: 'Database' },
      { id: 'bcryptjs', name: 'Bcrypt.js', description: 'Password hashing library with zero native bindings.', category: 'Security' },
    ],
    defaultConfig: {
      moduleType: 'module',
      port: '3000',
      dependencies: ['cors', 'dotenv', 'nodemon', 'morgan'],
    },
    files: [
      {
        path: "package.json",
        content: JSON.stringify(
          {
            name: "express-api",
            version: "1.0.0",
            type: "module",
            scripts: { start: "node src/index.js" },
            dependencies: { express: "^4.21.0" },
          },
          null,
          2
        ),
      },
      {
        path: "src/index.js",
        isEntrypoint: true,
        content: `import express from 'express';
import { apiRouter } from './routes/api.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api', apiRouter);

app.get('/', (req, res) => {
  res.json({ message: 'Confluo Express Server Running' });
});

app.listen(PORT, () => {
  console.log(\`Server listening on http://localhost:\${PORT}\`);
});`,
      },
      {
        path: "src/routes/api.js",
        content: `import { Router } from 'express';

export const apiRouter = Router();

apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

apiRouter.get('/items', (req, res) => {
  res.json([
    { id: 1, name: 'Sample Item A' },
    { id: 2, name: 'Sample Item B' }
  ]);
});`,
      },
      {
        path: "README.md",
        content: `# Express.js REST API
Starter Express template for Confluo.
Run via terminal: \`node src/index.js\`.`,
      },
    ],
  },
  {
    id: "html-css-js",
    name: "HTML5 + CSS3 + JavaScript",
    description: "Classic web starter with instant live preview in Confluo's inbuilt browser.",
    category: "vanilla",
    language: "html",
    icon: "html",
    tags: ["HTML5", "CSS3", "JavaScript"],
    availableDependencies: [
      { id: 'tailwind-cdn', name: 'Tailwind CSS (CDN)', description: 'Fast styling with Tailwind CSS via CDN script.', category: 'Styling', defaultSelected: true },
      { id: 'font-awesome', name: 'Font Awesome', description: 'Font Awesome 6 icon library via CDN.', category: 'Icons' },
      { id: 'canvas-confetti', name: 'Canvas Confetti', description: 'Delightful interactive confetti animations.', category: 'Effects' },
    ],
    defaultConfig: {
      dependencies: ['tailwind-cdn'],
    },
    files: [
      {
        path: "index.html",
        isEntrypoint: true,
        content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Web Starter Project</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <div class="card">
      <h1 id="title">HTML5 Web Starter</h1>
      <p>Instant live preview inside Confluo's built-in browser previewer.</p>
      <button id="btn">Click me!</button>
      <div id="counter">0 clicks</div>
    </div>
    <script src="script.js"></script>
  </body>
</html>`,
      },
      {
        path: "style.css",
        content: `* {
  box-sizing: border-box;
}

body {
  margin: 0;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #09090b;
  color: #f4f4f5;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.card {
  border: 1px solid #27272a;
  background-color: #121214;
  padding: 32px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

button {
  background: #ffffff;
  color: #09090b;
  border: none;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 12px;
}

button:hover {
  background: #e4e4e7;
}

#counter {
  font-size: 13px;
  color: #a1a1aa;
}`,
      },
      {
        path: "script.js",
        content: `let count = 0;
const btn = document.getElementById('btn');
const counter = document.getElementById('counter');

btn.addEventListener('click', () => {
  count++;
  counter.textContent = \`\${count} click\${count === 1 ? '' : 's'}\`;
});`,
      },
      {
        path: "README.md",
        content: `# Vanilla Web Starter
Click the **Preview** button in the project toolbar to open the sandboxed web browser view.`,
      },
    ],
  },
];

export function getTemplateById(id?: string | null): ProjectTemplate {
  if (!id) return TEMPLATES[0]; // blank
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
}

