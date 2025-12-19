import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const MetadataField = ({ title, content, onChange, onDelete, isCustom = false, onTitleChange }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="border border-border rounded-lg bg-surface overflow-hidden mb-4">
      <div
        className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-surface-hover transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-2">
          {isOpen ? <ChevronDown size={16} className="text-text-muted" /> : <ChevronRight size={16} className="text-text-muted" />}
          {isCustom ? (
            <input
              value={title}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onTitleChange(e.target.value)}
              className="bg-transparent border-none outline-none font-semibold text-sm text-white placeholder-text-muted"
              placeholder="Field Title"
            />
          ) : (
            <span className="font-semibold text-sm text-text uppercase tracking-wide">{title}</span>
          )}
        </div>
        {isCustom && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-text-muted hover:text-red-500 p-1"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="p-4 border-t border-border bg-background">
          <textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Content..."
            className="w-full min-h-[100px] bg-transparent text-sm text-text font-mono resize-y outline-none border-none placeholder-text-muted/50"
          />
        </div>
      )}
    </div>
  );
};

const SnippetMetadata = ({ description, expectedOutput, customMetadata = [], onUpdate }) => {

  const handleCustomAdd = () => {
    const newField = { id: uuidv4(), title: 'New Section', content: '' };
    onUpdate({ customMetadata: [...customMetadata, newField] });
  };

  const updateCustomField = (id, updates) => {
    const newMeta = customMetadata.map(m => m.id === id ? { ...m, ...updates } : m);
    onUpdate({ customMetadata: newMeta });
  };

  const deleteCustomField = (id) => {
    const newMeta = customMetadata.filter(m => m.id !== id);
    onUpdate({ customMetadata: newMeta });
  };

  return (
    <div className="space-y-4 pb-10">
      <MetadataField
        title="Description"
        content={description}
        onChange={(val) => onUpdate({ description: val })}
      />

      <MetadataField
        title="Expected Output"
        content={expectedOutput}
        onChange={(val) => onUpdate({ expectedOutput: val })}
      />

      {customMetadata.map(field => (
        <MetadataField
          key={field.id}
          title={field.title}
          content={field.content}
          isCustom={true}
          onChange={(val) => updateCustomField(field.id, { content: val })}
          onTitleChange={(val) => updateCustomField(field.id, { title: val })}
          onDelete={() => deleteCustomField(field.id)}
        />
      ))}

      <button
        onClick={handleCustomAdd}
        className="flex items-center space-x-2 text-accent hover:text-white px-4 py-2 rounded hover:bg-surface-hover transition-colors text-sm font-medium border border-dashed border-border hover:border-accent w-full justify-center"
      >
        <span>Custom +</span>
      </button>
    </div>
  );
};

export default SnippetMetadata;
