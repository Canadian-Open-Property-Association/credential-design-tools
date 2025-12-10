import { useState, useEffect, useCallback } from 'react';
import { useVctStore } from '../../store/vctStore';
import { VCTRendering, VCTIssuer, FONT_FAMILY_OPTIONS } from '../../types/vct';
import AssetLibrary from '../AssetLibrary/AssetLibrary';
import type { Entity } from '../../types/entity';

interface SchemaFile {
  name: string;
  path: string;
  sha: string;
  download_url: string;
  uri: string;
}

interface Config {
  vctBaseUrl: string;
  schemaBaseUrl: string;
}

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5174';

export default function MetadataForm() {
  const currentVct = useVctStore((state) => state.currentVct);
  const updateVctField = useVctStore((state) => state.updateVctField);
  const setFormat = useVctStore((state) => state.setFormat);
  const setIssuer = useVctStore((state) => state.setIssuer);
  const currentProjectName = useVctStore((state) => state.currentProjectName);
  const updateProjectName = useVctStore((state) => state.updateProjectName);
  const isDirty = useVctStore((state) => state.isDirty);
  const updateDisplay = useVctStore((state) => state.updateDisplay);

  // Get the primary display (index 0) for global styling
  const primaryDisplay = currentVct.display[0];

  const updateRendering = (rendering: Partial<VCTRendering>) => {
    updateDisplay(0, {
      rendering: { ...primaryDisplay.rendering, ...rendering },
    });
  };

  const generateHash = async (url: string) => {
    try {
      const response = await fetch(
        `${API_BASE}/hash?url=${encodeURIComponent(url)}`
      );
      const data = await response.json();
      if (data.hash) {
        updateRendering({
          simple: {
            ...primaryDisplay.rendering?.simple,
            background_image: {
              uri: url,
              'uri#integrity': data.hash,
            },
          },
        });
      }
    } catch (error) {
      console.error('Failed to generate hash:', error);
      alert('Failed to generate hash. Make sure the proxy server is running.');
    }
  };

  const handleAssetSelect = (uri: string, hash?: string) => {
    updateRendering({
      simple: {
        ...primaryDisplay.rendering?.simple,
        background_image: {
          uri,
          'uri#integrity': hash,
        },
      },
    });
    setAssetPickerOpen(false);
  };

  const [config, setConfig] = useState<Config | null>(null);
  const [schemas, setSchemas] = useState<SchemaFile[]>([]);
  const [loadingSchemas, setLoadingSchemas] = useState(false);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [filename, setFilename] = useState('');
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);

  // Fetch config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/github/config`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setConfig(data);
        }
      } catch (error) {
        console.error('Failed to fetch config:', error);
      }
    };
    fetchConfig();
  }, []);

  // Fetch schemas on mount
  useEffect(() => {
    const fetchSchemas = async () => {
      setLoadingSchemas(true);
      try {
        const response = await fetch(`${API_BASE}/api/github/schema-library`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setSchemas(data);
        }
      } catch (error) {
        console.error('Failed to fetch schemas:', error);
      } finally {
        setLoadingSchemas(false);
      }
    };
    fetchSchemas();
  }, []);

  // Fetch entities (issuers) on mount
  useEffect(() => {
    const fetchEntities = async () => {
      setLoadingEntities(true);
      try {
        // Fetch entities that have 'issuer' in their types
        const response = await fetch(`${API_BASE}/api/entities?types=issuer`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setEntities(data);
        }
      } catch (error) {
        console.error('Failed to fetch entities:', error);
      } finally {
        setLoadingEntities(false);
      }
    };
    fetchEntities();
  }, []);

  // Extract filename from current VCT URI on load
  useEffect(() => {
    if (config && currentVct.vct && currentVct.vct.startsWith(config.vctBaseUrl)) {
      const extractedFilename = currentVct.vct
        .replace(config.vctBaseUrl, '')
        .replace('.json', '');
      setFilename(extractedFilename);
    }
  }, [config, currentVct.vct]);

  // Debounced availability check
  const checkAvailability = useCallback(
    async (name: string) => {
      if (!name.trim()) {
        setIsAvailable(null);
        return;
      }

      setCheckingAvailability(true);
      setAvailabilityError(null);

      try {
        const response = await fetch(
          `${API_BASE}/api/github/vct-available/${encodeURIComponent(name)}`,
          { credentials: 'include' }
        );
        if (response.ok) {
          const data = await response.json();
          setIsAvailable(data.available);
        } else {
          setAvailabilityError('Failed to check availability');
        }
      } catch (error) {
        console.error('Availability check failed:', error);
        setAvailabilityError('Failed to check availability');
      } finally {
        setCheckingAvailability(false);
      }
    },
    []
  );

  // Debounce the availability check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filename) {
        checkAvailability(filename);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [filename, checkAvailability]);

  // Update VCT URI when filename changes
  const handleFilenameChange = (newFilename: string) => {
    // Only allow valid filename characters
    const sanitized = newFilename.replace(/[^a-zA-Z0-9-_]/g, '');
    setFilename(sanitized);
    setIsAvailable(null);

    if (config && sanitized) {
      updateVctField('vct', `${config.vctBaseUrl}${sanitized}.json`);
    } else if (!sanitized) {
      updateVctField('vct', '');
    }
  };

  // Handle schema selection
  const handleSchemaSelect = async (schemaName: string) => {
    const schema = schemas.find((s) => s.name === schemaName);
    if (schema) {
      updateVctField('schema_uri', schema.uri);
      // Auto-generate integrity hash
      try {
        const response = await fetch(
          `${API_BASE}/hash?url=${encodeURIComponent(schema.uri)}`
        );
        const data = await response.json();
        if (data.hash) {
          updateVctField('schema_uri#integrity', data.hash);
        }
      } catch (error) {
        console.error('Failed to generate hash:', error);
      }
    } else {
      updateVctField('schema_uri', '');
      updateVctField('schema_uri#integrity', '');
    }
  };

  // Get selected schema name from URI
  const getSelectedSchemaName = () => {
    if (!currentVct.schema_uri) return '';
    const schema = schemas.find((s) => s.uri === currentVct.schema_uri);
    return schema?.name || '';
  };

  // Handle issuer selection
  const handleIssuerSelect = (entityId: string) => {
    if (!entityId) {
      setIssuer(undefined);
      return;
    }
    const entity = entities.find((e) => e.id === entityId);
    if (entity) {
      const issuerData: VCTIssuer = {
        id: entity.id,
        name: entity.name,
        uri: entity.did || undefined,
        logoUri: entity.logoUri || undefined,
      };
      setIssuer(issuerData);
    }
  };

  return (
    <div className="space-y-4">
      {/* Format Selection - Must be chosen first */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <label className="block text-sm font-medium text-blue-800 mb-2">
          Credential Format <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="vctFormat"
              value="sd-jwt"
              checked={currentVct.format === 'sd-jwt'}
              onChange={() => setFormat('sd-jwt')}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">SD-JWT VC</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="vctFormat"
              value="json-ld"
              checked={currentVct.format === 'json-ld'}
              onChange={() => setFormat('json-ld')}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">JSON-LD VC</span>
          </label>
        </div>
        <p className="mt-2 text-xs text-blue-600">
          {currentVct.format === 'sd-jwt'
            ? 'SD-JWT: Select which schema properties become claims (flexible subset)'
            : 'JSON-LD: All schema properties become claims (1:1 mapping required)'}
        </p>
      </div>

      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        General
      </h3>

      {/* Project Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Project Name
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={currentProjectName}
            onChange={(e) => updateProjectName(e.target.value)}
            placeholder="Untitled Project"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          {isDirty && (
            <span className="text-yellow-500 text-lg" title="Unsaved changes">*</span>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Name for this project (used for saving locally)
        </p>
      </div>

      {/* VCT URI */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          VCT Filename <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400 truncate max-w-[200px]" title={config?.vctBaseUrl}>
            {config?.vctBaseUrl || 'Loading...'}
          </span>
          <input
            type="text"
            value={filename}
            onChange={(e) => handleFilenameChange(e.target.value)}
            placeholder="my-credential"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          <span className="text-sm text-gray-500">.json</span>
          {/* Availability indicator */}
          <div className="w-6 h-6 flex items-center justify-center">
            {checkingAvailability ? (
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : isAvailable === true ? (
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : isAvailable === false ? (
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : null}
          </div>
        </div>
        {isAvailable === false && (
          <p className="mt-1 text-xs text-red-500">
            This filename is already in use. Please choose a different name.
          </p>
        )}
        {availabilityError && (
          <p className="mt-1 text-xs text-yellow-600">{availabilityError}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Unique filename for this VCT (letters, numbers, hyphens, underscores only)
        </p>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={currentVct.name}
          onChange={(e) => updateVctField('name', e.target.value)}
          placeholder="My Credential"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">
          Human-readable name for the credential type
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={currentVct.description || ''}
          onChange={(e) => updateVctField('description', e.target.value)}
          placeholder="A brief description of this credential..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </div>

      {/* Schema Selection - Now a secondary highlight box */}
      <div className={`border rounded-lg p-4 space-y-3 ${currentVct.schema_uri ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
        <label className="block text-sm font-medium text-gray-800 mb-1">
          Schema <span className="text-red-500">*</span>
          {!currentVct.schema_uri && (
            <span className="ml-2 text-xs text-orange-600">(Required before configuring claims)</span>
          )}
        </label>
        <select
          value={getSelectedSchemaName()}
          onChange={(e) => handleSchemaSelect(e.target.value)}
          disabled={loadingSchemas}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
        >
          <option value="">
            {loadingSchemas ? 'Loading schemas...' : 'Select a schema...'}
          </option>
          {schemas.map((schema) => (
            <option key={schema.sha} value={schema.name}>
              {schema.name.replace('.json', '')}
            </option>
          ))}
        </select>
        {currentVct.schema_uri && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-xs text-green-700 truncate" title={currentVct.schema_uri}>
              {currentVct.schema_uri}
            </p>
          </div>
        )}
        {schemas.length === 0 && !loadingSchemas && (
          <p className="text-xs text-yellow-600">
            No schemas found in the repository. Add schemas to credentials/schemas/ first.
          </p>
        )}
        {currentVct['schema_uri#integrity'] && (
          <p className="text-xs text-green-600 font-mono truncate" title={currentVct['schema_uri#integrity']}>
            Hash: {currentVct['schema_uri#integrity']}
          </p>
        )}
      </div>

      {/* Issuer Selection */}
      <div className={`border rounded-lg p-4 space-y-3 ${currentVct.issuer ? 'border-purple-200 bg-purple-50' : 'border-gray-200 bg-gray-50'}`}>
        <label className="block text-sm font-medium text-gray-800 mb-1">
          Issuer
          <span className="ml-2 text-xs text-gray-500">(Optional - credential issuing entity)</span>
        </label>
        <select
          value={currentVct.issuer?.id || ''}
          onChange={(e) => handleIssuerSelect(e.target.value)}
          disabled={loadingEntities}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-sm bg-white"
        >
          <option value="">
            {loadingEntities ? 'Loading issuers...' : 'Select an issuer...'}
          </option>
          {entities.map((entity) => (
            <option key={entity.id} value={entity.id}>
              {entity.name}
            </option>
          ))}
        </select>
        {currentVct.issuer && (
          <div className="flex items-center gap-3 p-2 bg-white rounded border border-purple-200">
            {currentVct.issuer.logoUri && (
              <img
                src={currentVct.issuer.logoUri}
                alt={currentVct.issuer.name}
                className="w-8 h-8 object-contain rounded"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">{currentVct.issuer.name}</p>
              {currentVct.issuer.uri && (
                <p className="text-xs text-purple-600 truncate" title={currentVct.issuer.uri}>
                  DID: {currentVct.issuer.uri}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIssuer(undefined)}
              className="text-gray-400 hover:text-gray-600"
              title="Clear issuer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {entities.length === 0 && !loadingEntities && (
          <p className="text-xs text-gray-500">
            No issuers found. Add entities with type &quot;issuer&quot; in Entity Manager.
          </p>
        )}
      </div>

      {/* Card Styling */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-4 mt-6">
        <h4 className="font-medium text-gray-800">Card Styling</h4>

        {/* Background Colour */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Background Colour
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={primaryDisplay?.rendering?.simple?.background_color || '#1E3A5F'}
              onChange={(e) =>
                updateRendering({
                  simple: {
                    ...primaryDisplay.rendering?.simple,
                    background_color: e.target.value,
                  },
                })
              }
              className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={primaryDisplay?.rendering?.simple?.background_color || '#1E3A5F'}
              onChange={(e) =>
                updateRendering({
                  simple: {
                    ...primaryDisplay.rendering?.simple,
                    background_color: e.target.value,
                  },
                })
              }
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
            />
          </div>
        </div>

        {/* Text Colour */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Text Colour
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={primaryDisplay?.rendering?.simple?.text_color || '#FFFFFF'}
              onChange={(e) =>
                updateRendering({
                  simple: {
                    ...primaryDisplay.rendering?.simple,
                    text_color: e.target.value,
                  },
                })
              }
              className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={primaryDisplay?.rendering?.simple?.text_color || '#FFFFFF'}
              onChange={(e) =>
                updateRendering({
                  simple: {
                    ...primaryDisplay.rendering?.simple,
                    text_color: e.target.value,
                  },
                })
              }
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
            />
          </div>
        </div>

        {/* Font Family */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Font Family
          </label>
          <select
            value={primaryDisplay?.rendering?.simple?.font_family || ''}
            onChange={(e) =>
              updateRendering({
                simple: {
                  ...primaryDisplay.rendering?.simple,
                  font_family: e.target.value || undefined,
                },
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">Default (System)</option>
            {FONT_FAMILY_OPTIONS.map((font) => (
              <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                {font.label}
              </option>
            ))}
          </select>
        </div>

        {/* Background Image URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Background Image URL (optional)
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={primaryDisplay?.rendering?.simple?.background_image?.uri || ''}
              onChange={(e) =>
                updateRendering({
                  simple: {
                    ...primaryDisplay.rendering?.simple,
                    background_image: {
                      ...primaryDisplay.rendering?.simple?.background_image,
                      uri: e.target.value,
                    },
                  },
                })
              }
              placeholder="https://example.com/background.png"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <button
              type="button"
              onClick={() => setAssetPickerOpen(true)}
              className="px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
              title="Browse Asset Library"
            >
              Browse
            </button>
            <button
              type="button"
              onClick={() => {
                const url = primaryDisplay?.rendering?.simple?.background_image?.uri;
                if (url) generateHash(url);
              }}
              className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              Hash
            </button>
          </div>
          {primaryDisplay?.rendering?.simple?.background_image?.['uri#integrity'] && (
            <p className="mt-1 text-xs text-green-600 font-mono truncate">
              {primaryDisplay.rendering.simple.background_image['uri#integrity']}
            </p>
          )}
        </div>
      </div>

      {/* Asset Library Modal */}
      <AssetLibrary
        isOpen={assetPickerOpen}
        onClose={() => setAssetPickerOpen(false)}
        onSelect={handleAssetSelect}
        title="Select Background Image"
      />
    </div>
  );
}
