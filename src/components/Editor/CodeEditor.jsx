import React, { useRef, useEffect } from 'react';
import Editor, { loader } from '@monaco-editor/react';

// Configure Monaco loader if needed (optional)
// loader.config({ paths: { vs: '...' } });

const CodeEditor = ({ language = 'javascript', value, onChange, theme = 'vs-dark' }) => {
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

  return (
    <div className="h-full w-full overflow-hidden rounded-lg border border-border shadow-sm">
      <Editor
        height="100%"
        defaultLanguage="javascript"
        language={language}
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme="vs-dark" // Will be overridden by onMount
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: 'Fira Code, monospace',
          scrollBeyondLastLine: false,
          automaticLayout: true, // Re-enabled for reliable rendering (Safe Mode prevents crashes)
          padding: { top: 16 },
          scrollbar: {
            alwaysConsumeMouseWheel: false
          }
        }}
      />
    </div>
  );
};

export default CodeEditor;
