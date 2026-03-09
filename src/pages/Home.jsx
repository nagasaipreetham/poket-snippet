import React from 'react';
import { Clock, Folder, File, Code } from 'lucide-react';
import { useFileSystem } from '../context/FileSystemContext';
import { Link } from 'react-router-dom';

const Home = () => {
  const { recentFiles, folders } = useFileSystem();

  const displayRecent = recentFiles.slice(0, 6);

  return (
    <div className="max-w-4xl mx-auto p-8 pt-12">
      <h1 className="text-3xl font-bold text-white mb-8">Home</h1>

      {/* Recently Visited */}
      <section className="mb-10">
        <div className="flex items-center space-x-2 text-text-muted mb-4">
          <Clock size={16} />
          <h2 className="text-sm font-semibold uppercase tracking-wider">Recently Visited</h2>
        </div>

        {displayRecent.length === 0 ? (
          <div className="text-text-muted italic bg-surface/50 p-6 rounded-lg text-center border border-dashed border-border">
            No recent files. Create a snippet to get started!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayRecent.map((file) => (
              <Link
                to={`/home/snippet/${file.id}`}
                key={file.id}
                className="bg-surface hover:bg-surface-hover transition-colors p-4 rounded-lg border border-border cursor-pointer group flex flex-col justify-between h-24"
              >
                <div>
                  <div className="font-medium text-text group-hover:text-white mb-1 truncate flex items-center">
                    <File size={16} className="mr-2 text-accent" />
                    {file.name}
                  </div>
                  {/* <div className="text-xs text-text-muted truncate">{file.content.substring(0, 30)}...</div> */}
                </div>
                <div className="text-xs text-text-muted">
                  {new Date(file.updatedAt).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Created Folders */}
      <section>
        <div className="flex items-center space-x-2 text-text-muted mb-4">
          <Folder size={16} />
          <h2 className="text-sm font-semibold uppercase tracking-wider">Created Folders</h2>
        </div>

        {folders.length === 0 ? (
          <div className="text-text-muted italic">No folders created yet.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {folders.map((folder) => (
              <Link to={`/home/folder/${folder.id}`} key={folder.id} className="bg-surface hover:bg-surface-hover transition-colors p-4 rounded-lg border border-border flex items-center space-x-3 cursor-pointer group">
                <Folder className="text-text-muted group-hover:text-amber-400 transition-colors" size={20} />
                <span className="font-medium text-text group-hover:text-white truncate">{folder.name}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
