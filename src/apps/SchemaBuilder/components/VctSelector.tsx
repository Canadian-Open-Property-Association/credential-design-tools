/**
 * VctSelector - Dropdown for selecting a VCT (Verifiable Credential Type)
 *
 * Shows VCTs from the user's saved projects in VCT Builder.
 * In the future, could also fetch published VCTs from VDR API.
 */

import { useMemo } from 'react';
import { useVctStore } from '../../../store/vctStore';

interface VctSelectorProps {
  value?: string;
  onChange: (vctUri: string, vctName: string) => void;
  disabled?: boolean;
}

export default function VctSelector({ value, onChange, disabled }: VctSelectorProps) {
  const savedProjects = useVctStore((state) => state.savedProjects);

  // Build list of VCTs from saved projects
  const vctOptions = useMemo(() => {
    return savedProjects
      .filter(project => project.vct?.vct) // Only include projects with a VCT URI
      .map(project => ({
        uri: project.vct.vct,
        name: project.vct.name || project.name,
        projectName: project.name,
      }));
  }, [savedProjects]);

  const handleChange = (vctUri: string) => {
    if (!vctUri) {
      onChange('', '');
      return;
    }

    const selected = vctOptions.find(v => v.uri === vctUri);
    if (selected) {
      onChange(selected.uri, selected.name);
    }
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        VCT Reference
      </label>
      <select
        value={value || ''}
        onChange={(e) => handleChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="">
          {vctOptions.length === 0 ? 'No VCTs available' : 'Select a VCT...'}
        </option>
        {vctOptions.map(vct => (
          <option key={vct.uri} value={vct.uri}>
            {vct.name} ({vct.projectName})
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500">
        Links this schema to a VCT definition
      </p>
      {value && (
        <p className="text-xs text-gray-400 truncate" title={value}>
          URI: {value}
        </p>
      )}
    </div>
  );
}
