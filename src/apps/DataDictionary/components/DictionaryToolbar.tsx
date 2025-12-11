import { useState } from 'react';
import { useDictionaryStore } from '../../../store/dictionaryStore';

interface DictionaryToolbarProps {
  onAddVocabType: () => void;
  onSaveToRepo: () => void;
}

// Available data dictionaries (expandable in future)
const DATA_DICTIONARIES = [
  { id: 'reso-2.0', name: 'RESO Data Dictionary 2.0', description: 'Real Estate Standards Organization' },
];

export default function DictionaryToolbar({ onAddVocabType, onSaveToRepo }: DictionaryToolbarProps) {
  const { vocabTypes } = useDictionaryStore();
  const [selectedDictionary, setSelectedDictionary] = useState('reso-2.0');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const currentDictionary = DATA_DICTIONARIES.find(d => d.id === selectedDictionary);

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left side - Dictionary Selector */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 text-left bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="text-sm font-semibold text-gray-800">{currentDictionary?.name}</span>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  <div className="p-2">
                    {DATA_DICTIONARIES.map(dict => (
                      <button
                        key={dict.id}
                        onClick={() => {
                          setSelectedDictionary(dict.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                          selectedDictionary === dict.id
                            ? 'bg-blue-50 text-blue-700'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{dict.name}</span>
                          {selectedDictionary === dict.id && (
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{dict.description}</p>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 p-2">
                    <button
                      className="w-full text-left px-3 py-2 text-sm text-gray-400 rounded-md cursor-not-allowed"
                      disabled
                    >
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Data Dictionary
                        <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">Coming soon</span>
                      </span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            {vocabTypes.length} types
          </span>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Add Vocab Type */}
          <button
            onClick={onAddVocabType}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Vocab Type
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Create Pull Request */}
          <button
            onClick={onSaveToRepo}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            Create Pull Request
          </button>
        </div>
      </div>
    </div>
  );
}
