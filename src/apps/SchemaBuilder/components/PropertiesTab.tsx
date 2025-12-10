/**
 * PropertiesTab Component
 *
 * Tab 2 of the Schema Builder - contains property management:
 * - PropertyTree (list of credential properties) - LEFT column
 * - PropertyEditor (edit selected property) - RIGHT column
 *
 * Two-column layout for better UX.
 */

import PropertyTree from './PropertyTree';
import PropertyEditor from './PropertyEditor';
import { useSchemaStore } from '../../../store/schemaStore';

export default function PropertiesTab() {
  const selectedPropertyId = useSchemaStore((state) => state.selectedPropertyId);

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left Column - Property Tree */}
      <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
        <PropertyTree />
      </div>

      {/* Right Column - Property Editor */}
      <div className="w-1/2 overflow-y-auto bg-gray-50">
        {selectedPropertyId ? (
          <PropertyEditor />
        ) : (
          <div className="h-full flex items-center justify-center p-4 text-center text-gray-500">
            <div>
              <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <p className="text-sm">Select a property to edit</p>
              <p className="text-xs text-gray-400 mt-1">or add a new property above</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
