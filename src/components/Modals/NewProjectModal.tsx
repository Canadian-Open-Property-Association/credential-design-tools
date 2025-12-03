interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartFresh: () => void;
  onImport: () => void;
}

export default function NewProjectModal({
  isOpen,
  onClose,
  onStartFresh,
  onImport,
}: NewProjectModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[400px] max-w-[90vw]">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">New Project</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            How would you like to start?
          </p>
        </div>

        {/* Options */}
        <div className="p-4 space-y-3">
          <button
            onClick={() => {
              onStartFresh();
              onClose();
            }}
            className="w-full p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left group"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">📄</div>
              <div>
                <p className="font-medium text-gray-800 group-hover:text-blue-700">
                  Start Fresh
                </p>
                <p className="text-sm text-gray-500">
                  Create a new blank VCT from scratch
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              onImport();
              onClose();
            }}
            className="w-full p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left group"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">📥</div>
              <div>
                <p className="font-medium text-gray-800 group-hover:text-blue-700">
                  Import Existing
                </p>
                <p className="text-sm text-gray-500">
                  Load a VCT from file or GitHub repository
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
