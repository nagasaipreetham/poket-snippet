import React from 'react';
import { Heart, File, Folder } from 'lucide-react';
import { useFileSystem } from '../context/FileSystemContext';
import { Link } from 'react-router-dom';

const Favorites = () => {
  const { files, folders } = useFileSystem();

  const favFiles = files.filter(f => f.isFavorite);
  const favFolders = folders.filter(f => f.isFavorite);

  return (
    <div className="max-w-4xl mx-auto p-8 pt-12">
      <div className="flex items-center space-x-3 mb-8">
        <Heart size={32} className="text-pink-500 fill-current" />
        <h1 className="text-3xl font-bold text-white">Favorites</h1>
      </div>

      {favFiles.length === 0 && favFolders.length === 0 ? (
        <div className="text-center p-12 border border-dashed border-border rounded-xl bg-surface/30">
          <Heart size={48} className="mx-auto text-text-muted mb-4 opacity-50" />
          <p className="text-text-muted text-lg">No favorites yet</p>
          <p className="text-text-muted/50 text-sm mt-2">Right-click any file or folder to add it here</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Folders */}
          {favFolders.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-4">Folders</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {favFolders.map((folder) => (
                  <Link to={`/home/folder/${folder.id}`} key={folder.id} className="bg-surface hover:bg-surface-hover transition-colors p-4 rounded-lg border border-border flex items-center space-x-3 cursor-pointer group">
                    <Folder className="text-pink-500 transition-colors" size={20} />
                    <span className="font-medium text-text group-hover:text-white truncate">{folder.name}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Files */}
          {favFiles.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-4">Files</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favFiles.map((file) => (
                  <Link
                    to={`/home/snippet/${file.id}`}
                    key={file.id}
                    className="bg-surface hover:bg-surface-hover transition-colors p-4 rounded-lg border border-border cursor-pointer group flex flex-col justify-between h-24"
                  >
                    <div>
                      <div className="font-medium text-text group-hover:text-white mb-1 truncate flex items-center">
                        <File size={16} className="mr-2 text-pink-500" />
                        {file.name}
                      </div>
                    </div>
                    <div className="text-xs text-text-muted">
                      {new Date(file.updatedAt).toLocaleDateString()}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default Favorites;
