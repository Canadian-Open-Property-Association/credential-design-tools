import { useHarmonizationStore } from '../../../store/harmonizationStore';

export default function HarmonizationToolbar() {
  const { mappings, setViewMode } = useHarmonizationStore();

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
      {/* Left side - Title */}
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Data Harmonization</h1>
        <p className="text-xs text-gray-500">Map furnisher fields to COPA vocabulary</p>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-3">
        {/* Stats badge */}
        <div className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-600">
          {mappings.length} mapping{mappings.length !== 1 ? 's' : ''}
        </div>

        {/* View All Mappings button */}
        <button
          onClick={() => setViewMode('all-mappings')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          View All Mappings
        </button>
      </div>
    </div>
  );
}
