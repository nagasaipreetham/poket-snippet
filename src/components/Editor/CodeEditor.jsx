import React, { useRef, useEffect } from 'react';
import Editor, { loader } from '@monaco-editor/react';

// Configure Monaco loader if needed (optional)
// loader.config({ paths: { vs: '...' } });

const CodeEditor = ({ language = 'javascript', value, onChange, theme = 'vs-dark', fontSize = 14 }) => {
  const handleEditorChange = (value, event) => {
    onChange(value);
  };

  const handleEditorDidMount = (editor, monaco) => {
    // Define a custom theme matching our app
    monaco.editor.defineTheme('poket-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#191919', // Match app background
        'editor.lineHighlightBackground': '#2F2F2F',
      }
    });
    monaco.editor.setTheme('poket-dark');
  };

  // Map compiler IDs to Monaco-recognized language IDs
  const monacoLanguageMap = {
    'assembly': 'plaintext',
    'bash': 'shell',
    'basic': 'vb',
    'c': 'c',
    'cpp': 'cpp',
    'clojure': 'clojure',
    'csharp': 'csharp',
    'cobol': 'plaintext',
    'lisp': 'clojure', // Clojure is the closest built-in for Lisp
    'd': 'plaintext',
    'elixir': 'elixir',
    'erlang': 'plaintext',
    'fsharp': 'fsharp',
    'fortran': 'plaintext',
    'go': 'go',
    'groovy': 'plaintext',
    'haskell': 'plaintext',
    'java': 'java',
    'javascript': 'javascript',
    'kotlin': 'kotlin',
    'lua': 'lua',
    'objectivec': 'objective-c',
    'ocaml': 'plaintext',
    'octave': 'plaintext',
    'pascal': 'pascal',
    'perl': 'perl',
    'php': 'php',
    'plaintext': 'plaintext',
    'prolog': 'plaintext',
    'python': 'python',
    'r': 'r',
    'ruby': 'ruby',
    'rust': 'rust',
    'scala': 'scala',
    'sql': 'sql',
    'swift': 'swift',
    'typescript': 'typescript',
    'vbnet': 'vb',
  };

  const monacoLanguage = monacoLanguageMap[language] || language;

  return (
    <div className="h-full w-full overflow-hidden rounded-lg border border-border shadow-sm">
      <Editor
        height="100%"
        defaultLanguage="javascript"
        language={monacoLanguage}
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme="vs-dark" // Will be overridden by onMount
        options={{
          minimap: { enabled: false },
          fontSize: fontSize,
          fontFamily: 'Fira Code, monospace',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16 },
          scrollbar: {
            alwaysConsumeMouseWheel: false
          },
          renderValidationDecorations: 'off'
        }}
      />
    </div>
  );
};

export default CodeEditor;
