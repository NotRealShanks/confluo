import type { Monaco } from "@monaco-editor/react";
import type { editor, languages, Position } from "monaco-editor";

let completionsRegistered = false;

interface KeywordDef {
  label: string;
  kind?: languages.CompletionItemKind;
  insertText?: string;
  detail?: string;
  documentation?: string;
}

export function registerMonacoCompletions(monaco: Monaco) {
  if (completionsRegistered) return;
  completionsRegistered = true;

  const CompletionItemKind = monaco.languages.CompletionItemKind;
  const CompletionItemInsertTextRule = monaco.languages.CompletionItemInsertTextRule;

  const pythonKeywords: KeywordDef[] = [
    { label: "def", kind: CompletionItemKind.Snippet, insertText: "def ${1:function_name}(${2:params}):\n\t${0:pass}", detail: "def function snippet" },
    { label: "class", kind: CompletionItemKind.Snippet, insertText: "class ${1:ClassName}:\n\tdef __init__(self${2:, args}):\n\t\t${0:pass}", detail: "class definition snippet" },
    { label: "import", kind: CompletionItemKind.Keyword, insertText: "import ${0:module}", detail: "import statement" },
    { label: "from", kind: CompletionItemKind.Keyword, insertText: "from ${1:module} import ${0:item}", detail: "from ... import" },
    { label: "return", kind: CompletionItemKind.Keyword },
    { label: "if", kind: CompletionItemKind.Snippet, insertText: "if ${1:condition}:\n\t${0:pass}", detail: "if statement" },
    { label: "elif", kind: CompletionItemKind.Snippet, insertText: "elif ${1:condition}:\n\t${0:pass}", detail: "elif statement" },
    { label: "else", kind: CompletionItemKind.Snippet, insertText: "else:\n\t${0:pass}", detail: "else statement" },
    { label: "for", kind: CompletionItemKind.Snippet, insertText: "for ${1:item} in ${2:iterable}:\n\t${0:pass}", detail: "for loop" },
    { label: "while", kind: CompletionItemKind.Snippet, insertText: "while ${1:condition}:\n\t${0:pass}", detail: "while loop" },
    { label: "try", kind: CompletionItemKind.Snippet, insertText: "try:\n\t${1:pass}\nexcept ${2:Exception} as ${3:e}:\n\t${0:pass}", detail: "try-except block" },
    { label: "except", kind: CompletionItemKind.Keyword },
    { label: "finally", kind: CompletionItemKind.Keyword },
    { label: "with", kind: CompletionItemKind.Snippet, insertText: "with ${1:expr} as ${2:var}:\n\t${0:pass}", detail: "context manager" },
    { label: "print", kind: CompletionItemKind.Function, insertText: "print(${0})", detail: "print(value)" },
    { label: "len", kind: CompletionItemKind.Function, insertText: "len(${0})" },
    { label: "range", kind: CompletionItemKind.Function, insertText: "range(${0})" },
    { label: "self", kind: CompletionItemKind.Variable },
    { label: "True", kind: CompletionItemKind.Constant },
    { label: "False", kind: CompletionItemKind.Constant },
    { label: "None", kind: CompletionItemKind.Constant },
    { label: "lambda", kind: CompletionItemKind.Keyword },
    { label: "async", kind: CompletionItemKind.Keyword },
    { label: "await", kind: CompletionItemKind.Keyword },
    { label: "yield", kind: CompletionItemKind.Keyword },
    { label: "raise", kind: CompletionItemKind.Keyword },
    { label: "assert", kind: CompletionItemKind.Keyword },
  ];

  const javaKeywords: KeywordDef[] = [
    { label: "public", kind: CompletionItemKind.Keyword },
    { label: "private", kind: CompletionItemKind.Keyword },
    { label: "protected", kind: CompletionItemKind.Keyword },
    { label: "static", kind: CompletionItemKind.Keyword },
    { label: "final", kind: CompletionItemKind.Keyword },
    { label: "void", kind: CompletionItemKind.Keyword },
    { label: "class", kind: CompletionItemKind.Snippet, insertText: "public class ${1:ClassName} {\n\t${0}\n}", detail: "class declaration" },
    { label: "main", kind: CompletionItemKind.Snippet, insertText: "public static void main(String[] args) {\n\t${0}\n}", detail: "main method" },
    { label: "sout", kind: CompletionItemKind.Snippet, insertText: "System.out.println(${0});", detail: "System.out.println" },
    { label: "System.out.println", kind: CompletionItemKind.Function, insertText: "System.out.println(${0});" },
    { label: "interface", kind: CompletionItemKind.Keyword },
    { label: "extends", kind: CompletionItemKind.Keyword },
    { label: "implements", kind: CompletionItemKind.Keyword },
    { label: "return", kind: CompletionItemKind.Keyword },
    { label: "if", kind: CompletionItemKind.Snippet, insertText: "if (${1:condition}) {\n\t${0}\n}" },
    { label: "else", kind: CompletionItemKind.Snippet, insertText: "else {\n\t${0}\n}" },
    { label: "for", kind: CompletionItemKind.Snippet, insertText: "for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t${0}\n}" },
    { label: "while", kind: CompletionItemKind.Snippet, insertText: "while (${1:condition}) {\n\t${0}\n}" },
    { label: "try", kind: CompletionItemKind.Snippet, insertText: "try {\n\t${1}\n} catch (Exception ${2:e}) {\n\t${0}\n}" },
    { label: "new", kind: CompletionItemKind.Keyword },
    { label: "this", kind: CompletionItemKind.Keyword },
    { label: "super", kind: CompletionItemKind.Keyword },
    { label: "String", kind: CompletionItemKind.Class },
    { label: "Integer", kind: CompletionItemKind.Class },
    { label: "List", kind: CompletionItemKind.Interface },
    { label: "ArrayList", kind: CompletionItemKind.Class },
    { label: "Map", kind: CompletionItemKind.Interface },
    { label: "HashMap", kind: CompletionItemKind.Class },
  ];

  const cppKeywords: KeywordDef[] = [
    { label: "include", kind: CompletionItemKind.Snippet, insertText: "#include <${1:iostream}>", detail: "#include header" },
    { label: "main", kind: CompletionItemKind.Snippet, insertText: "int main() {\n\t${0}\n\treturn 0;\n}", detail: "int main() entrypoint" },
    { label: "cout", kind: CompletionItemKind.Snippet, insertText: "std::cout << ${1:\"\"} << std::endl;", detail: "std::cout stream" },
    { label: "cin", kind: CompletionItemKind.Snippet, insertText: "std::cin >> ${0};", detail: "std::cin stream" },
    { label: "std::vector", kind: CompletionItemKind.Class, insertText: "std::vector<${1:int}> ${0};" },
    { label: "std::string", kind: CompletionItemKind.Class },
    { label: "namespace", kind: CompletionItemKind.Keyword },
    { label: "using namespace std;", kind: CompletionItemKind.Snippet, insertText: "using namespace std;\n" },
    { label: "struct", kind: CompletionItemKind.Snippet, insertText: "struct ${1:Name} {\n\t${0}\n};" },
    { label: "class", kind: CompletionItemKind.Snippet, insertText: "class ${1:Name} {\npublic:\n\t${0}\n};" },
    { label: "template", kind: CompletionItemKind.Snippet, insertText: "template <typename ${1:T}>\n${0}" },
    { label: "const", kind: CompletionItemKind.Keyword },
    { label: "auto", kind: CompletionItemKind.Keyword },
    { label: "return", kind: CompletionItemKind.Keyword },
    { label: "if", kind: CompletionItemKind.Snippet, insertText: "if (${1:condition}) {\n\t${0}\n}" },
    { label: "for", kind: CompletionItemKind.Snippet, insertText: "for (int ${1:i} = 0; ${1:i} < ${2:n}; ++${1:i}) {\n\t${0}\n}" },
    { label: "while", kind: CompletionItemKind.Snippet, insertText: "while (${1:condition}) {\n\t${0}\n}" },
    { label: "nullptr", kind: CompletionItemKind.Constant },
    { label: "printf", kind: CompletionItemKind.Function, insertText: "printf(\"${1:%s}\\n\", ${0});" },
  ];

  const jsKeywords: KeywordDef[] = [
    { label: "const", kind: CompletionItemKind.Keyword, insertText: "const ${1:name} = ${0};" },
    { label: "let", kind: CompletionItemKind.Keyword, insertText: "let ${1:name} = ${0};" },
    { label: "function", kind: CompletionItemKind.Snippet, insertText: "function ${1:name}(${2:params}) {\n\t${0}\n}" },
    { label: "clg", kind: CompletionItemKind.Snippet, insertText: "console.log(${0});", detail: "console.log" },
    { label: "console.log", kind: CompletionItemKind.Function, insertText: "console.log(${0});" },
    { label: "return", kind: CompletionItemKind.Keyword },
    { label: "import", kind: CompletionItemKind.Snippet, insertText: "import { ${1:item} } from \"${2:module}\";" },
    { label: "export", kind: CompletionItemKind.Keyword },
    { label: "export default", kind: CompletionItemKind.Snippet, insertText: "export default ${0};" },
    { label: "async", kind: CompletionItemKind.Keyword },
    { label: "await", kind: CompletionItemKind.Keyword },
    { label: "try", kind: CompletionItemKind.Snippet, insertText: "try {\n\t${1}\n} catch (error) {\n\t${0}\n}" },
    { label: "Promise", kind: CompletionItemKind.Class },
    { label: "if", kind: CompletionItemKind.Snippet, insertText: "if (${1:condition}) {\n\t${0}\n}" },
    { label: "else", kind: CompletionItemKind.Snippet, insertText: "else {\n\t${0}\n}" },
    { label: "for", kind: CompletionItemKind.Snippet, insertText: "for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {\n\t${0}\n}" },
    { label: "arrow", kind: CompletionItemKind.Snippet, insertText: "(${1:params}) => {\n\t${0}\n}", detail: "arrow function" },
  ];

  const shellKeywords: KeywordDef[] = [
    { label: "echo", kind: CompletionItemKind.Function, insertText: "echo \"${0}\"" },
    { label: "if", kind: CompletionItemKind.Snippet, insertText: "if [ ${1:condition} ]; then\n\t${0}\nfi" },
    { label: "for", kind: CompletionItemKind.Snippet, insertText: "for ${1:item} in ${2:list}; do\n\t${0}\ndone" },
    { label: "while", kind: CompletionItemKind.Snippet, insertText: "while [ ${1:condition} ]; do\n\t${0}\ndone" },
    { label: "function", kind: CompletionItemKind.Snippet, insertText: "${1:func_name}() {\n\t${0}\n}" },
    { label: "export", kind: CompletionItemKind.Keyword },
    { label: "grep", kind: CompletionItemKind.Function },
    { label: "cat", kind: CompletionItemKind.Function },
  ];

  const registerForLang = (lang: string, defs: KeywordDef[]) => {
    monaco.languages.registerCompletionItemProvider(lang, {
      provideCompletionItems: (model: editor.ITextModel, position: Position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions: languages.CompletionItem[] = defs.map((d) => ({
          label: d.label,
          kind: d.kind ?? CompletionItemKind.Keyword,
          insertText: d.insertText ?? d.label,
          insertTextRules: d.insertText?.includes("${")
            ? CompletionItemInsertTextRule.InsertAsSnippet
            : undefined,
          detail: d.detail ?? `Keyword (${lang})`,
          documentation: d.documentation,
          range,
        }));

        return { suggestions };
      },
    });
  };

  registerForLang("python", pythonKeywords);
  registerForLang("java", javaKeywords);
  registerForLang("cpp", cppKeywords);
  registerForLang("c", cppKeywords);
  registerForLang("javascript", jsKeywords);
  registerForLang("typescript", jsKeywords);
  registerForLang("shell", shellKeywords);
}
