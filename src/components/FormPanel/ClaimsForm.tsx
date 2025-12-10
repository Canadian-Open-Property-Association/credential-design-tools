import { useState, useEffect } from 'react';
import { useVctStore } from '../../store/vctStore';
import {
  VCTClaim,
  VCTClaimDisplay,
  getLocaleName,
  ParsedSchemaProperty,
  propertyPathToClaimPath,
  formatPropertyPath,
} from '../../types/vct';

// Track which properties are selected as claims (for SD-JWT mode)
interface SelectedClaims {
  [pathKey: string]: boolean;
}

export default function ClaimsForm() {
  const currentVct = useVctStore((state) => state.currentVct);
  const schemaProperties = useVctStore((state) => state.schemaProperties);
  const isLoadingSchema = useVctStore((state) => state.isLoadingSchema);
  const schemaError = useVctStore((state) => state.schemaError);
  const loadSchemaProperties = useVctStore((state) => state.loadSchemaProperties);
  const updateClaim = useVctStore((state) => state.updateClaim);
  const sampleData = useVctStore((state) => state.sampleData);
  const updateSampleDataField = useVctStore((state) => state.updateSampleDataField);

  // Use Zustand's set method to directly update claims
  const setClaimsDirectly = (claims: VCTClaim[]) => {
    useVctStore.setState((state) => ({
      currentVct: { ...state.currentVct, claims },
      isDirty: true,
    }));
  };

  const [expandedClaim, setExpandedClaim] = useState<string | null>(null);
  const [selectedClaims, setSelectedClaims] = useState<SelectedClaims>({});

  // Get locales from display configuration
  const locales = currentVct.display.map((d) => d.locale);
  const isJsonLd = currentVct.format === 'json-ld';

  // Load schema properties when schema_uri changes
  useEffect(() => {
    if (currentVct.schema_uri) {
      loadSchemaProperties(currentVct.schema_uri);
    }
  }, [currentVct.schema_uri, loadSchemaProperties]);

  // Initialize selected claims from existing VCT claims
  useEffect(() => {
    if (schemaProperties && currentVct.claims.length > 0) {
      const selected: SelectedClaims = {};
      currentVct.claims.forEach((claim) => {
        const pathKey = claim.path.filter(Boolean).join('.');
        selected[pathKey] = true;
      });
      setSelectedClaims(selected);
    }
  }, [schemaProperties, currentVct.claims]);

  // For JSON-LD, auto-select all properties when schema loads
  useEffect(() => {
    if (isJsonLd && schemaProperties && schemaProperties.properties.length > 0) {
      const allSelected: SelectedClaims = {};
      const addAllProps = (props: ParsedSchemaProperty[]) => {
        props.forEach((prop) => {
          const pathKey = prop.path.join('.');
          allSelected[pathKey] = true;
          if (prop.children) {
            addAllProps(prop.children);
          }
        });
      };
      addAllProps(schemaProperties.properties);
      setSelectedClaims(allSelected);
      syncClaimsFromSelection(allSelected, schemaProperties.properties);
    }
  }, [isJsonLd, schemaProperties]);

  // Sync claims array based on selected properties
  const syncClaimsFromSelection = (
    selection: SelectedClaims,
    properties: ParsedSchemaProperty[]
  ) => {
    const newClaims: VCTClaim[] = [];

    const processProperty = (prop: ParsedSchemaProperty) => {
      const pathKey = prop.path.join('.');
      if (selection[pathKey]) {
        // Check if claim already exists
        const existingClaim = currentVct.claims.find(
          (c) => c.path.filter(Boolean).join('.') === pathKey
        );

        if (existingClaim) {
          newClaims.push(existingClaim);
        } else {
          // Create new claim with proper display for each locale
          newClaims.push({
            path: propertyPathToClaimPath(prop.path) as (string | number | null)[],
            display: locales.map((locale) => ({
              locale,
              label: prop.title || prop.name,
              description: prop.description || '',
            })),
            sd: 'allowed',
          });
        }
      }

      // Process children
      if (prop.children) {
        prop.children.forEach(processProperty);
      }
    };

    properties.forEach(processProperty);
    setClaimsDirectly(newClaims);
  };

  // Toggle property selection (SD-JWT mode only)
  const togglePropertySelection = (prop: ParsedSchemaProperty) => {
    if (isJsonLd) return; // JSON-LD doesn't allow deselection

    const pathKey = prop.path.join('.');
    const newSelection = {
      ...selectedClaims,
      [pathKey]: !selectedClaims[pathKey],
    };
    setSelectedClaims(newSelection);

    if (schemaProperties) {
      syncClaimsFromSelection(newSelection, schemaProperties.properties);
    }
  };

  // Update claim display for a specific locale
  const updateClaimDisplay = (
    claimPath: string,
    locale: string,
    field: keyof VCTClaimDisplay,
    value: string
  ) => {
    const claimIndex = currentVct.claims.findIndex(
      (c) => c.path.filter(Boolean).join('.') === claimPath
    );
    if (claimIndex === -1) return;

    const claim = currentVct.claims[claimIndex];
    const newDisplay = claim.display.map((d) =>
      d.locale === locale ? { ...d, [field]: value } : d
    );
    updateClaim(claimIndex, { display: newDisplay });
  };

  // Update claim options
  const updateClaimOptions = (
    claimPath: string,
    updates: Partial<VCTClaim>
  ) => {
    const claimIndex = currentVct.claims.findIndex(
      (c) => c.path.filter(Boolean).join('.') === claimPath
    );
    if (claimIndex === -1) return;
    updateClaim(claimIndex, updates);
  };

  // Get claim by path
  const getClaimByPath = (pathKey: string): VCTClaim | undefined => {
    return currentVct.claims.find(
      (c) => c.path.filter(Boolean).join('.') === pathKey
    );
  };

  // Render a property row
  const renderPropertyRow = (
    prop: ParsedSchemaProperty,
    depth: number = 0
  ): React.ReactNode => {
    const pathKey = prop.path.join('.');
    const isSelected = selectedClaims[pathKey];
    const claim = getClaimByPath(pathKey);
    const isExpanded = expandedClaim === pathKey;

    return (
      <div key={pathKey}>
        {/* Property Row */}
        <div
          className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${
            isSelected ? 'bg-blue-50' : ''
          }`}
          style={{ paddingLeft: `${16 + depth * 20}px` }}
        >
          {/* Checkbox (SD-JWT only) or Check icon (JSON-LD) */}
          {isJsonLd ? (
            <span className="w-5 h-5 flex items-center justify-center text-green-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          ) : (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => togglePropertySelection(prop)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          )}

          {/* Property Name */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`font-medium ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                {prop.title || prop.name}
              </span>
              <code className="text-xs text-gray-500 bg-gray-100 px-1 rounded">
                {prop.name}
              </code>
              {prop.required && (
                <span className="text-xs text-red-500">required</span>
              )}
            </div>
            {prop.description && (
              <p className="text-xs text-gray-500 truncate">{prop.description}</p>
            )}
          </div>

          {/* Type Badge */}
          <span className={`text-xs px-2 py-0.5 rounded ${
            prop.type === 'object' ? 'bg-purple-100 text-purple-700' :
            prop.type === 'array' ? 'bg-orange-100 text-orange-700' :
            prop.type === 'string' ? 'bg-green-100 text-green-700' :
            prop.type === 'integer' || prop.type === 'number' ? 'bg-blue-100 text-blue-700' :
            prop.type === 'boolean' ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {prop.type}
            {prop.format && <span className="opacity-70"> ({prop.format})</span>}
          </span>

          {/* Path Display */}
          <code className="text-xs text-gray-400 hidden md:block">
            {formatPropertyPath(prop.path)}
          </code>

          {/* Expand button (if selected) */}
          {isSelected && (
            <button
              type="button"
              onClick={() => setExpandedClaim(isExpanded ? null : pathKey)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* Expanded Claim Configuration */}
        {isSelected && isExpanded && claim && (
          <div className="px-4 py-4 bg-gray-50 border-b border-gray-200 space-y-4">
            {/* Claim Path Display */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Claim Path
              </label>
              <code className="text-sm bg-white border border-gray-200 px-3 py-1.5 rounded block">
                [{claim.path.map((s) => typeof s === 'string' ? `"${s}"` : s).join(', ')}]
              </code>
            </div>

            {/* Claim Options */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Selective Disclosure
                </label>
                <select
                  value={claim.sd || 'allowed'}
                  onChange={(e) =>
                    updateClaimOptions(pathKey, {
                      sd: e.target.value as 'always' | 'allowed' | 'never',
                    })
                  }
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="allowed">Allowed</option>
                  <option value="always">Always</option>
                  <option value="never">Never</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Mandatory
                </label>
                <select
                  value={claim.mandatory ? 'true' : 'false'}
                  onChange={(e) =>
                    updateClaimOptions(pathKey, {
                      mandatory: e.target.value === 'true',
                    })
                  }
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  SVG ID (for templates)
                </label>
                <input
                  type="text"
                  value={claim.svg_id || ''}
                  onChange={(e) =>
                    updateClaimOptions(pathKey, { svg_id: e.target.value || undefined })
                  }
                  placeholder="field_name"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                />
              </div>
            </div>

            {/* Display Labels by Language */}
            <div className="space-y-3">
              <h5 className="text-sm font-medium text-gray-700">
                Display Labels by Language
              </h5>
              <div className={`grid gap-4 ${locales.length === 1 ? 'grid-cols-1' : locales.length === 2 ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                {locales.map((locale) => {
                  const claimDisplay = claim.display.find((d) => d.locale === locale);
                  return (
                    <div key={locale} className="space-y-2 p-3 bg-white rounded-lg border border-gray-200">
                      <h6 className="text-sm font-medium text-gray-700">
                        {getLocaleName(locale)}
                      </h6>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Label
                        </label>
                        <input
                          type="text"
                          value={claimDisplay?.label || ''}
                          onChange={(e) =>
                            updateClaimDisplay(pathKey, locale, 'label', e.target.value)
                          }
                          placeholder="Field Label"
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={claimDisplay?.description || ''}
                          onChange={(e) =>
                            updateClaimDisplay(pathKey, locale, 'description', e.target.value)
                          }
                          placeholder="Field description"
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sample Data */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sample Value (for preview)
              </label>
              <input
                type="text"
                value={sampleData[formatPropertyPath(prop.path)] || ''}
                onChange={(e) =>
                  updateSampleDataField(formatPropertyPath(prop.path), e.target.value)
                }
                placeholder="Enter sample value..."
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
        )}

        {/* Render children (nested properties) */}
        {prop.children && prop.children.map((child) => renderPropertyRow(child, depth + 1))}
      </div>
    );
  };

  // Loading state
  if (isLoadingSchema) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p>Loading schema properties...</p>
      </div>
    );
  }

  // Error state
  if (schemaError) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-red-600 font-medium">Failed to load schema</p>
        <p className="text-sm text-gray-500 mt-1">{schemaError}</p>
        <button
          type="button"
          onClick={() => loadSchemaProperties(currentVct.schema_uri)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  // No schema loaded
  if (!schemaProperties) {
    return (
      <div className="p-8 text-center text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="font-medium">No schema selected</p>
        <p className="text-sm mt-1">Select a schema in the Metadata tab to configure claims</p>
      </div>
    );
  }

  // No properties in schema
  if (schemaProperties.properties.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="font-medium">No properties found</p>
        <p className="text-sm mt-1">The schema has no credentialSubject properties defined</p>
      </div>
    );
  }

  // Count selected claims
  const selectedCount = Object.values(selectedClaims).filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Claims</h3>
          <p className="text-sm text-gray-500">
            {isJsonLd
              ? 'All schema properties are included as claims (JSON-LD 1:1 mapping)'
              : `Select which properties become claims (${selectedCount} selected)`}
          </p>
        </div>
        {schemaProperties && (
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700">{schemaProperties.title}</p>
            <p className="text-xs text-gray-400">{schemaProperties.properties.length} properties</p>
          </div>
        )}
      </div>

      {/* Format indicator */}
      <div className={`mx-4 p-3 rounded-lg text-sm ${
        isJsonLd
          ? 'bg-purple-50 border border-purple-200 text-purple-700'
          : 'bg-blue-50 border border-blue-200 text-blue-700'
      }`}>
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {isJsonLd ? 'JSON-LD Mode' : 'SD-JWT Mode'}
          </span>
          <span className="text-xs opacity-75">
            {isJsonLd
              ? '— All properties are automatically included as claims'
              : '— Check the properties you want to include as claims'}
          </span>
        </div>
      </div>

      {/* Property List */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Column Headers */}
        <div className="flex items-center gap-3 px-4 py-2 bg-gray-100 border-b border-gray-200 text-xs font-medium text-gray-600">
          <span className="w-5"></span>
          <span className="flex-1">Property</span>
          <span className="w-20 text-center">Type</span>
          <span className="w-32 text-right hidden md:block">Path</span>
          <span className="w-5"></span>
        </div>

        {/* Properties */}
        {schemaProperties.properties.map((prop) => renderPropertyRow(prop, 0))}
      </div>

      {/* Summary */}
      {selectedCount > 0 && (
        <div className="mx-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          <span className="font-medium">{selectedCount} claim{selectedCount !== 1 ? 's' : ''}</span> will be included in this VCT
        </div>
      )}
    </div>
  );
}
