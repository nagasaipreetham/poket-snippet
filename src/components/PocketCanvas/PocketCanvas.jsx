import React from 'react';
import ExcalidrawApp from '../../lib/excalidraw-app/App';
import '../../lib/excalidraw-app/index.scss';

// Define environment variables expected by the app
if (!window.process) {
  window.process = { env: { NODE_ENV: 'development' } };
}

const PocketCanvas = (props) => {
  return (
    <div style={{ height: "100%", width: "100%" }} className="excalidraw-app">
      <ExcalidrawApp {...props} />
    </div>
  );
};

export default PocketCanvas;
