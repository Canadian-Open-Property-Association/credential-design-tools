/**
 * IssuerSelector - Dropdown for selecting an issuer entity
 *
 * Fetches entities with 'issuer' type from the Entity Library
 * and allows selection for the schema's default issuer.
 */

import { useEffect, useMemo } from 'react';
import { useEntityStore } from '../../../store/entityStore';

interface IssuerSelectorProps {
  value?: string;
  onChange: (entityId: string, issuerUri: string, issuerName: string) => void;
  disabled?: boolean;
}

export default function IssuerSelector({ value, onChange, disabled }: IssuerSelectorProps) {
  const { entities, fetchEntities, isLoading } = useEntityStore();

  // Fetch entities on mount
  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  // Filter to only include entities with 'issuer' type
  const issuers = useMemo(() => {
    return entities.filter(e => e.types?.includes('issuer') && e.status === 'active');
  }, [entities]);

  const handleChange = (entityId: string) => {
    if (!entityId) {
      onChange('', '', '');
      return;
    }

    const selected = issuers.find(i => i.id === entityId);
    if (selected) {
      // Resolve issuer URI from DID (preferred) or construct canonical URL
      const issuerUri = selected.did ||
        `https://openpropertyassociation.ca/entities/${selected.id}`;
      onChange(selected.id, issuerUri, selected.name);
    }
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        Default Issuer
      </label>
      <select
        value={value || ''}
        onChange={(e) => handleChange(e.target.value)}
        disabled={disabled || isLoading}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="">
          {isLoading ? 'Loading issuers...' : 'Select an issuer...'}
        </option>
        {issuers.map(issuer => (
          <option key={issuer.id} value={issuer.id}>
            {issuer.name}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500">
        Entity that will issue this credential type
      </p>
    </div>
  );
}
