import React from 'react';
import { File, Search } from 'lucide-react';
import { useFileSystem } from '../context/FileSystemContext';
import { Link } from 'react-router-dom';

const AllMiscellaneous = () => {
  const { getRootFiles } = useFileSystem();
  const rootFiles = getRootFiles();

  return (
    <div className="max-w-4xl mx-auto p-8 pt-12">
      <div className="flex items-center space-x-3 mb-8">
        <File size={32} className="text-accent" />
        <h1 className="text-3xl font-bold text-white">All Miscellaneous Files</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rootFiles.length === 0 ? (
          <div className="col-span-full text-center p-12 text-text-muted italic">No miscellaneous files found.</div>
        ) : (
          rootFiles.map((file) => (
            <Link
              to={`/snippet/${file.id}`}
              key={file.id}
              className="bg-surface hover:bg-surface-hover transition-colors p-4 rounded-lg border border-border cursor-pointer group flex flex-col justify-between h-24"
            >
              <div>
                <div className="font-medium text-text group-hover:text-white mb-1 truncate flex items-center">
                  <File size={16} className="mr-2 text-accent" />
                  {file.name}
                </div>
              </div>
              <div className="text-xs text-text-muted">
                {new Date(file.updatedAt).toLocaleDateString()}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default AllMiscellaneous;
