import type { ProjectTemplate, TemplateConfigOptions, TemplateFile } from "./types";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "my-project";
}

function sanitizePackageName(pkg: string): string {
  return pkg
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_.]/g, "_")
    .replace(/\.+/g, ".")
    .replace(/^\.+|\.+$/g, "") || "com.example.demo";
}

/**
 * Customizes the starter files for a template using user-specified configuration
 * such as Maven Group/Artifact, Java version, selected dependencies, and app title.
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
  const title = projectName || config?.artifactId || template.name;
  const projectSlug = slugify(title);

  if (template.id === "spring-boot") {
    const groupId = config?.groupId || template.defaultConfig?.groupId || "com.example";
    const artifactId = slugify(config?.artifactId || template.defaultConfig?.artifactId || "demo");
    const javaVersion = config?.javaVersion || template.defaultConfig?.javaVersion || "17";
    const bootVersion = config?.bootVersion || template.defaultConfig?.bootVersion || "3.3.0";
    const packaging = config?.packaging || template.defaultConfig?.packaging || "jar";
    const rawPkg = config?.packageName || `${groupId}.${artifactId}`;
    const packageName = sanitizePackageName(rawPkg);
    const packagePath = packageName.replace(/\./g, "/");

    // Build POM XML dependencies
    const depSnippets: string[] = [];
    if (selectedDeps.has("web")) {
      depSnippets.push(`        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>`);
    }
    if (selectedDeps.has("data-jpa")) {
      depSnippets.push(`        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>`);
    }
    if (selectedDeps.has("h2")) {
      depSnippets.push(`        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
        </dependency>`);
    }
    if (selectedDeps.has("postgresql")) {
      depSnippets.push(`        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>`);
    }
    if (selectedDeps.has("mysql")) {
      depSnippets.push(`        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>`);
    }
    if (selectedDeps.has("devtools")) {
      depSnippets.push(`        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-devtools</artifactId>
            <scope>runtime</scope>
            <optional>true</optional>
        </dependency>`);
    }
    if (selectedDeps.has("lombok")) {
      depSnippets.push(`        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>`);
    }
    if (selectedDeps.has("security")) {
      depSnippets.push(`        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>`);
    }
    if (selectedDeps.has("validation")) {
      depSnippets.push(`        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>`);
    }
    if (selectedDeps.has("actuator")) {
      depSnippets.push(`        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>`);
    }
    // Always include spring-boot-starter-test
    depSnippets.push(`        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>`);

    const pomContent = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>${bootVersion}</version>
        <relativePath/>
    </parent>

    <groupId>${groupId}</groupId>
    <artifactId>${artifactId}</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>${artifactId}</name>
    <description>${title} created with Confluo</description>
    <packaging>${packaging}</packaging>

    <properties>
        <java.version>${javaVersion}</java.version>
    </properties>

    <dependencies>
${depSnippets.join("\n")}
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>`;

    const appContent = `package ${packageName};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}`;

    const controllerContent = `package ${packageName}.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HelloController {

    @GetMapping("/hello")
    public Map<String, Object> hello() {
        return Map.of(
            "status", "online",
            "message", "Hello from ${title} on Confluo!",
            "framework", "Spring Boot ${bootVersion}",
            "java", "${javaVersion}"
        );
    }
}`;

    let propsContent = `spring.application.name=${artifactId}\nserver.port=8080\n`;
    if (selectedDeps.has("h2")) {
      propsContent += `spring.h2.console.enabled=true\nspring.datasource.url=jdbc:h2:mem:testdb\n`;
    }

    files.push(
      { path: "pom.xml", content: pomContent },
      { path: `src/main/java/${packagePath}/Application.java`, content: appContent, isEntrypoint: true },
      { path: `src/main/java/${packagePath}/controller/HelloController.java`, content: controllerContent },
      { path: "src/main/resources/application.properties", content: propsContent },
      {
        path: "README.md",
        content: `# ${title}\n\nSpring Boot ${bootVersion} application with Java ${javaVersion} generated in Confluo.\n\n### Configured Dependencies\n${Array.from(selectedDeps).map((d) => `- ${d}`).join("\n")}\n\n### Running locally\n\`\`\`bash\n./mvnw spring-boot:run\n\`\`\`\n`,
      }
    );

    return files;
  }

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
      files.push(f);
    }
    return files;
  }

  // Flask + Python
  if (template.id === "flask") {
    for (const f of template.files) {
      if (f.path === "requirements.txt") {
        const lines = ["Flask>=3.0.0", "gunicorn>=21.2.0"];
        if (selectedDeps.has("flask-cors")) lines.push("flask-cors>=4.0.0");
        if (selectedDeps.has("python-dotenv")) lines.push("python-dotenv>=1.0.0");
        if (selectedDeps.has("sqlalchemy")) lines.push("SQLAlchemy>=2.0.0");
        if (selectedDeps.has("requests")) lines.push("requests>=2.31.0");
        if (selectedDeps.has("pydantic")) lines.push("pydantic>=2.6.0");
        if (selectedDeps.has("pytest")) lines.push("pytest>=8.0.0");
        files.push({ ...f, content: lines.join("\n") + "\n" });
        continue;
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

  // Default fallback: return template files
  return template.files;
}

