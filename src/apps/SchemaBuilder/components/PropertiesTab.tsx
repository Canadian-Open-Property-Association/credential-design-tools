/**
 * PropertiesTab Component
 *
 * Tab 2 of the Schema Builder - contains property management:
 * - PropertyTree (list of credential properties)
 * - PropertyEditor (edit selected property)
 *
 * Combines the previous separate panels into a single tab view.
 */

import PropertyTree from './PropertyTree';
import PropertyEditor from './PropertyEditor';
import { useSchemaStore } from '../../../store/schemaStore';

export default function PropertiesTab() {
  const selectedPropertyId = useSchemaStore((state) => state.selectedPropertyId);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Property Tree - scrollable list */}
      <div className={`${selectedPropertyId ? 'h-1/2' : 'flex-1'} overflow-y-auto border-b border-gray-200`}>
        <PropertyTree />
      </div>

      {/* Property Editor - shown when a property is selected */}
      {selectedPropertyId && (
        <div className="h-1/2 overflow-y-auto bg-gray-50">
          <PropertyEditor />
        </div>
      )}

      {/* Empty state when no property selected */}
      {!selectedPropertyId && (
        <div className="p-4 text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          <p className="text-sm">Select a property to edit</p>
          <p className="text-xs text-gray-400 mt-1">or add a new property above</p>
        </div>
      )}
    </div>
  );
}
