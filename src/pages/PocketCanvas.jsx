import React from 'react';
import { Share2 } from 'lucide-react';

const PocketCanvas = () => {
  return (
    <div className="max-w-4xl mx-auto p-8 pt-12">
      <h1 className="text-3xl font-bold text-white mb-8">Poket Canvas</h1>

      {/* Created Canvas Section */}
      <section className="mb-10">
        <div className="flex items-center space-x-2 text-text-muted mb-4">
          <Share2 size={16} />
          <h2 className="text-sm font-semibold uppercase tracking-wider">Created Canvas</h2>
        </div>

        <div className="text-text-muted italic bg-surface/50 p-6 rounded-lg text-center border border-dashed border-border">
          No canvas created yet.
        </div>
      </section>
    </div>
  );
};

export default PocketCanvas;
