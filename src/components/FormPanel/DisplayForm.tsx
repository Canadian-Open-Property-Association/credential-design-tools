import { useState } from 'react';
import { useVctStore } from '../../store/vctStore';
import { AVAILABLE_LOCALES, getLocaleName, VCTRendering, FONT_FAMILY_OPTIONS } from '../../types/vct';
import CardElementsForm from './CardElementsForm';
import AssetLibrary from '../AssetLibrary/AssetLibrary';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5174';

export default function DisplayForm() {
  const currentVct = useVctStore((state) => state.currentVct);
  const updateDisplay = useVctStore((state) => state.updateDisplay);
  const addDisplay = useVctStore((state) => state.addDisplay);
  const removeDisplay = useVctStore((state) => state.removeDisplay);
  const [activeTab, setActiveTab] = useState(0);
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const [cardStylingCollapsed, setCardStylingCollapsed] = useState(false);
  const [displayConfigCollapsed, setDisplayConfigCollapsed] = useState(false);

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

  const display = currentVct.display[activeTab];

  // Get locales that haven't been added yet
  const availableLocales = AVAILABLE_LOCALES.filter(
    (locale) => !currentVct.display.some((d) => d.locale === locale.code)
  );

  const handleAddLocale = (localeCode: string) => {
    addDisplay(localeCode);
    // Switch to the new tab
    setActiveTab(currentVct.display.length);
  };

  const handleRemoveLocale = (index: number) => {
    if (currentVct.display.length <= 1) {
      alert('You must have at least one display language.');
      return;
    }
    removeDisplay(index);
    if (activeTab >= index && activeTab > 0) {
      setActiveTab(activeTab - 1);
    }
  };

  return (
    <div className="space-y-4">
      {/* Card Styling - Collapsible Section */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setCardStylingCollapsed(!cardStylingCollapsed)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <h4 className="font-medium text-gray-800">Card Styling</h4>
          <svg
            className={`w-5 h-5 text-gray-500 transform transition-transform ${cardStylingCollapsed ? '' : 'rotate-180'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {!cardStylingCollapsed && (
          <div className="p-4 space-y-4 border-t border-gray-200">
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
        )}
      </div>

      {/* Display Configuration - Collapsible Section */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setDisplayConfigCollapsed(!displayConfigCollapsed)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-800">
              Display Configuration
            </h3>
            {availableLocales.length > 0 && !displayConfigCollapsed && (
              <select
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddLocale(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                defaultValue=""
              >
                <option value="" disabled>
                  + Add Language
                </option>
                {availableLocales.map((locale) => (
                  <option key={locale.code} value={locale.code}>
                    {locale.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <svg
            className={`w-5 h-5 text-gray-500 transform transition-transform ${displayConfigCollapsed ? '' : 'rotate-180'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {!displayConfigCollapsed && (
          <div className="border-t border-gray-200">
            {/* Language Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto bg-white">
              {currentVct.display.map((d, index) => (
                <div key={d.locale} className="flex items-center">
                  <button
                    onClick={() => setActiveTab(index)}
                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                      activeTab === index
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {getLocaleName(d.locale)}
                  </button>
                  {currentVct.display.length > 1 && (
                    <button
                      onClick={() => handleRemoveLocale(index)}
                      className="ml-1 mr-2 text-gray-400 hover:text-red-500 text-xs"
                      title="Remove this language"
                    >
                      x
                    </button>
                  )}
                </div>
              ))}
            </div>

            {display && (
              <div className="space-y-4 p-4">
                {/* Localized Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={display.name}
                    onChange={(e) => updateDisplay(activeTab, { name: e.target.value })}
                    placeholder="Credential Name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                {/* Localized Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Description
                  </label>
                  <textarea
                    value={display.description || ''}
                    onChange={(e) => updateDisplay(activeTab, { description: e.target.value })}
                    placeholder="Description..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                {/* Card Elements Configuration */}
                <CardElementsForm displayIndex={activeTab} />
              </div>
            )}
          </div>
        )}
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
