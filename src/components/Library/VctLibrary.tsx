import { useState, useEffect } from 'react';
import { useVctStore } from '../../store/vctStore';

interface VctFile {
  name: string;
  path: string;
  sha: string;
  download_url: string;
}

interface VctLibraryProps {
  isOpen: boolean;
  onClose: () => void;
}

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5174';

export default function VctLibrary({ isOpen, onClose }: VctLibraryProps) {
  const [files, setFiles] = useState<VctFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const importVct = useVctStore((state) => state.importVct);

  useEffect(() => {
    if (isOpen) {
      fetchLibrary();
    }
  }, [isOpen]);

  const fetchLibrary = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/github/vct-library`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch library');
      }
      const data = await response.json();
      setFiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load library');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadVct = async (filename: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/github/vct/${filename}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to load VCT file');
      }
      const data = await response.json();
      importVct(JSON.stringify(data.content));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load VCT');
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[500px] max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">VCT Library</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <input
            type="text"
            placeholder="Search VCT files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              Loading...
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-2">{error}</p>
              <button
                onClick={fetchLibrary}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Try again
              </button>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {files.length === 0 ? (
                <>
                  <p className="mb-2">No VCT files in the library yet.</p>
                  <p className="text-sm">Create a new VCT and save it to the repository to get started.</p>
                </>
              ) : (
                <p>No files match your search.</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFiles.map((file) => (
                <div
                  key={file.sha}
                  onClick={() => handleLoadVct(file.name)}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-medium">{file.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <p className="text-xs text-gray-500 text-center">
            Files from Canadian-Open-Property-Association/governance
          </p>
        </div>
      </div>
    </div>
  );
}
