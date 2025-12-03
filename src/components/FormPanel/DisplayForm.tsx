import { useState, useEffect } from 'react';
import { useVctStore } from '../../store/vctStore';
import {
  VCTRendering,
  AVAILABLE_LOCALES,
  getLocaleName,
  DisplayMode,
  detectDisplayMode,
  isFrontBackFormat,
  isLegacyFormat,
  VCTSvgTemplate,
  FONT_FAMILY_OPTIONS,
} from '../../types/vct';
import AssetLibrary from '../AssetLibrary/AssetLibrary';
import CardElementsForm from './CardElementsForm';

export default function DisplayForm() {
  const currentVct = useVctStore((state) => state.currentVct);
  const updateDisplay = useVctStore((state) => state.updateDisplay);
  const addDisplay = useVctStore((state) => state.addDisplay);
  const removeDisplay = useVctStore((state) => state.removeDisplay);
  const setDisplayMode = useVctStore((state) => state.setDisplayMode);
  const updateSvgTemplateByFace = useVctStore((state) => state.updateSvgTemplateByFace);
  const [activeTab, setActiveTab] = useState(0);
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const [assetPickerTarget, setAssetPickerTarget] = useState<'logo' | 'background' | 'svg' | 'svg-front' | 'svg-back' | null>(null);
  const [displayMode, setDisplayModeLocal] = useState<DisplayMode>('legacy');

  const display = currentVct.display[activeTab];

  // Auto-detect display mode when display changes
  useEffect(() => {
    if (display) {
      const detectedMode = detectDisplayMode(display);
      setDisplayModeLocal(detectedMode);
    }
  }, [display]);

  // Handle display mode toggle
  const handleDisplayModeChange = (mode: DisplayMode) => {
    setDisplayModeLocal(mode);
    setDisplayMode(activeTab, mode);
  };

  // Get SVG templates based on current mode
  const getSvgTemplatesArray = (): VCTSvgTemplate[] => {
    const templates = display?.rendering?.svg_templates;
    if (!templates) return [];
    if (isLegacyFormat(templates)) return templates;
    // Convert front/back to array for legacy display
    const result: VCTSvgTemplate[] = [];
    if (templates.front) result.push(templates.front);
    if (templates.back) result.push(templates.back);
    return result;
  };

  // Get front/back templates for COPA mode
  const getFrontBackTemplates = () => {
    const templates = display?.rendering?.svg_templates;
    if (!templates) return { front: undefined, back: undefined };
    if (isFrontBackFormat(templates)) return templates;
    // Convert array to front/back
    if (Array.isArray(templates)) {
      return { front: templates[0], back: templates[1] };
    }
    return { front: undefined, back: undefined };
  };

  // Get locales that haven't been added yet
  const availableLocales = AVAILABLE_LOCALES.filter(
    (locale) => !currentVct.display.some((d) => d.locale === locale.code)
  );

  const updateRendering = (rendering: Partial<VCTRendering>) => {
    updateDisplay(activeTab, {
      rendering: { ...display.rendering, ...rendering },
    });
  };

  const generateHash = async (url: string, type: 'logo' | 'svg' | 'background') => {
    try {
      const response = await fetch(
        `http://localhost:5174/hash?url=${encodeURIComponent(url)}`
      );
      const data = await response.json();
      if (data.hash) {
        if (type === 'logo') {
          updateRendering({
            simple: {
              ...display.rendering?.simple,
              logo: {
                ...display.rendering?.simple?.logo,
                uri: url,
                'uri#integrity': data.hash,
              },
            },
          });
        } else if (type === 'background') {
          updateRendering({
            simple: {
              ...display.rendering?.simple,
              background_image: {
                uri: url,
                'uri#integrity': data.hash,
              },
            },
          });
        } else {
          // SVG templates - add to array (legacy mode only)
          const existingTemplates = display.rendering?.svg_templates;
          if (existingTemplates && isLegacyFormat(existingTemplates)) {
            const existingIndex = existingTemplates.findIndex((t: VCTSvgTemplate) => t.uri === url);
            if (existingIndex >= 0) {
              const updated = [...existingTemplates];
              updated[existingIndex] = {
                ...updated[existingIndex],
                'uri#integrity': data.hash,
              };
              updateRendering({ svg_templates: updated });
            } else {
              updateRendering({
                svg_templates: [
                  ...existingTemplates,
                  { uri: url, 'uri#integrity': data.hash },
                ],
              });
            }
          } else {
            // No templates yet, create new array
            updateRendering({
              svg_templates: [{ uri: url, 'uri#integrity': data.hash }],
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to generate hash:', error);
      alert('Failed to generate hash. Make sure the proxy server is running.');
    }
  };

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

  const openAssetPicker = (target: 'logo' | 'background' | 'svg' | 'svg-front' | 'svg-back') => {
    setAssetPickerTarget(target);
    setAssetPickerOpen(true);
  };

  const handleAssetSelect = (uri: string, hash?: string) => {
    if (assetPickerTarget === 'logo') {
      updateRendering({
        simple: {
          ...display.rendering?.simple,
          logo: {
            ...display.rendering?.simple?.logo,
            uri,
            'uri#integrity': hash,
          },
        },
      });
    } else if (assetPickerTarget === 'background') {
      updateRendering({
        simple: {
          ...display.rendering?.simple,
          background_image: {
            uri,
            'uri#integrity': hash,
          },
        },
      });
    } else if (assetPickerTarget === 'svg') {
      // Legacy mode: add to array
      const existingTemplates = display.rendering?.svg_templates;
      if (existingTemplates && isLegacyFormat(existingTemplates)) {
        updateRendering({
          svg_templates: [
            ...existingTemplates,
            { uri, 'uri#integrity': hash },
          ],
        });
      } else {
        updateRendering({
          svg_templates: [{ uri, 'uri#integrity': hash }],
        });
      }
    } else if (assetPickerTarget === 'svg-front') {
      updateSvgTemplateByFace(activeTab, 'front', { uri, 'uri#integrity': hash });
    } else if (assetPickerTarget === 'svg-back') {
      updateSvgTemplateByFace(activeTab, 'back', { uri, 'uri#integrity': hash });
    }
    setAssetPickerOpen(false);
    setAssetPickerTarget(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Display Configuration
        </h3>
        {availableLocales.length > 0 && (
          <div className="relative">
            <select
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
          </div>
        )}
      </div>

      {/* Language Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
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
        <div className="space-y-4 pt-4">
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

          {/* Display Mode Toggle */}
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-sm font-medium text-gray-700">Display Mode:</span>
            <div className="flex rounded-md shadow-sm">
              <button
                type="button"
                onClick={() => handleDisplayModeChange('legacy')}
                className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                  displayMode === 'legacy'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Legacy
              </button>
              <button
                type="button"
                onClick={() => handleDisplayModeChange('copa')}
                className={`px-4 py-2 text-sm font-medium rounded-r-md border-t border-r border-b -ml-px ${
                  displayMode === 'copa'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                COPA Card Standard
              </button>
            </div>
          </div>

          {/* Simple Rendering */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-gray-800">Simple Card Rendering</h4>

            {/* Background Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Background Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={display.rendering?.simple?.background_color || '#1E3A5F'}
                  onChange={(e) =>
                    updateRendering({
                      simple: {
                        ...display.rendering?.simple,
                        background_color: e.target.value,
                      },
                    })
                  }
                  className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={display.rendering?.simple?.background_color || '#1E3A5F'}
                  onChange={(e) =>
                    updateRendering({
                      simple: {
                        ...display.rendering?.simple,
                        background_color: e.target.value,
                      },
                    })
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                />
              </div>
            </div>

            {/* Text Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Text Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={display.rendering?.simple?.text_color || '#FFFFFF'}
                  onChange={(e) =>
                    updateRendering({
                      simple: {
                        ...display.rendering?.simple,
                        text_color: e.target.value,
                      },
                    })
                  }
                  className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={display.rendering?.simple?.text_color || '#FFFFFF'}
                  onChange={(e) =>
                    updateRendering({
                      simple: {
                        ...display.rendering?.simple,
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
                value={display.rendering?.simple?.font_family || ''}
                onChange={(e) =>
                  updateRendering({
                    simple: {
                      ...display.rendering?.simple,
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

            {/* Logo URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={display.rendering?.simple?.logo?.uri || ''}
                  onChange={(e) =>
                    updateRendering({
                      simple: {
                        ...display.rendering?.simple,
                        logo: {
                          ...display.rendering?.simple?.logo,
                          uri: e.target.value,
                        },
                      },
                    })
                  }
                  placeholder="https://example.com/logo.png"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() => openAssetPicker('logo')}
                  className="px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                  title="Browse Asset Library"
                >
                  Browse
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const url = display.rendering?.simple?.logo?.uri;
                    if (url) generateHash(url, 'logo');
                  }}
                  className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  Hash
                </button>
              </div>
              {display.rendering?.simple?.logo?.['uri#integrity'] && (
                <p className="mt-1 text-xs text-green-600 font-mono truncate">
                  {display.rendering.simple.logo['uri#integrity']}
                </p>
              )}
            </div>

            {/* Logo Alt Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo Alt Text
              </label>
              <input
                type="text"
                value={display.rendering?.simple?.logo?.alt_text || ''}
                onChange={(e) =>
                  updateRendering({
                    simple: {
                      ...display.rendering?.simple,
                      logo: {
                        ...display.rendering?.simple?.logo,
                        uri: display.rendering?.simple?.logo?.uri || '',
                        alt_text: e.target.value,
                      },
                    },
                  })
                }
                placeholder="Organization logo"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            {/* Background Image URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Background Image URL (optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={display.rendering?.simple?.background_image?.uri || ''}
                  onChange={(e) =>
                    updateRendering({
                      simple: {
                        ...display.rendering?.simple,
                        background_image: {
                          ...display.rendering?.simple?.background_image,
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
                  onClick={() => openAssetPicker('background')}
                  className="px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                  title="Browse Asset Library"
                >
                  Browse
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const url = display.rendering?.simple?.background_image?.uri;
                    if (url) generateHash(url, 'background');
                  }}
                  className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  Hash
                </button>
              </div>
              {display.rendering?.simple?.background_image?.['uri#integrity'] && (
                <p className="mt-1 text-xs text-green-600 font-mono truncate">
                  {display.rendering.simple.background_image['uri#integrity']}
                </p>
              )}
            </div>
          </div>

          {/* SVG Template Rendering - Legacy Mode */}
          {displayMode === 'legacy' && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              <h4 className="font-medium text-gray-800">SVG Template Rendering</h4>
              <p className="text-xs text-gray-500">
                Recommended: SVG format, 400x250px, max 500KB. Use {'{{placeholder}}'} syntax for dynamic values.
              </p>

              {/* SVG Templates List */}
              {getSvgTemplatesArray().map((template, idx) => (
                <div key={idx} className="border border-gray-100 rounded p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Template {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const templates = getSvgTemplatesArray();
                        const updated = templates.filter((_, i) => i !== idx);
                        updateRendering({ svg_templates: updated });
                      }}
                      className="text-red-500 text-xs hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    type="url"
                    value={template.uri}
                    onChange={(e) => {
                      const templates = getSvgTemplatesArray();
                      const updated = [...templates];
                      updated[idx] = { ...updated[idx], uri: e.target.value };
                      updateRendering({ svg_templates: updated });
                    }}
                    placeholder="https://example.com/template.svg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  {template['uri#integrity'] && (
                    <p className="text-xs text-green-600 font-mono truncate">
                      {template['uri#integrity']}
                    </p>
                  )}
                  {/* SVG Properties */}
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <select
                      value={template.properties?.orientation || ''}
                      onChange={(e) => {
                        const templates = getSvgTemplatesArray();
                        const updated = [...templates];
                        updated[idx] = {
                          ...updated[idx],
                          properties: {
                            ...updated[idx].properties,
                            orientation: e.target.value as 'portrait' | 'landscape' | undefined,
                          },
                        };
                        updateRendering({ svg_templates: updated });
                      }}
                      className="px-2 py-1 text-xs border border-gray-300 rounded"
                    >
                      <option value="">Orientation</option>
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </select>
                    <select
                      value={template.properties?.color_scheme || ''}
                      onChange={(e) => {
                        const templates = getSvgTemplatesArray();
                        const updated = [...templates];
                        updated[idx] = {
                          ...updated[idx],
                          properties: {
                            ...updated[idx].properties,
                            color_scheme: e.target.value as 'light' | 'dark' | undefined,
                          },
                        };
                        updateRendering({ svg_templates: updated });
                      }}
                      className="px-2 py-1 text-xs border border-gray-300 rounded"
                    >
                      <option value="">Color Scheme</option>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                    <select
                      value={template.properties?.contrast || ''}
                      onChange={(e) => {
                        const templates = getSvgTemplatesArray();
                        const updated = [...templates];
                        updated[idx] = {
                          ...updated[idx],
                          properties: {
                            ...updated[idx].properties,
                            contrast: e.target.value as 'normal' | 'high' | undefined,
                          },
                        };
                        updateRendering({ svg_templates: updated });
                      }}
                      className="px-2 py-1 text-xs border border-gray-300 rounded"
                    >
                      <option value="">Contrast</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
              ))}

              {/* Add SVG Template */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add SVG Template URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    id="new-svg-url"
                    placeholder="https://example.com/template.svg"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => openAssetPicker('svg')}
                    className="px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                    title="Browse Asset Library"
                  >
                    Browse
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('new-svg-url') as HTMLInputElement;
                      const url = input.value.trim();
                      if (url) {
                        generateHash(url, 'svg');
                        input.value = '';
                      }
                    }}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                  >
                    Add + Hash
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SVG Template Rendering - COPA Card Standard Mode */}
          {displayMode === 'copa' && (
            <>
              <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                <h4 className="font-medium text-gray-800">SVG Templates (Front/Back)</h4>
                <p className="text-xs text-gray-500">
                  Configure separate SVG templates for the front and back of the credential card.
                </p>

                {/* Front SVG Template */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Front of Card
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={getFrontBackTemplates().front?.uri || ''}
                      onChange={(e) =>
                        updateSvgTemplateByFace(activeTab, 'front', { uri: e.target.value })
                      }
                      placeholder="https://example.com/card-front.svg"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => openAssetPicker('svg-front')}
                      className="px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                    >
                      Browse
                    </button>
                  </div>
                  {getFrontBackTemplates().front?.['uri#integrity'] && (
                    <p className="text-xs text-green-600 font-mono truncate">
                      {getFrontBackTemplates().front?.['uri#integrity']}
                    </p>
                  )}
                </div>

                {/* Back SVG Template */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Back of Card
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={getFrontBackTemplates().back?.uri || ''}
                      onChange={(e) =>
                        updateSvgTemplateByFace(activeTab, 'back', { uri: e.target.value })
                      }
                      placeholder="https://example.com/card-back.svg"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => openAssetPicker('svg-back')}
                      className="px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                    >
                      Browse
                    </button>
                  </div>
                  {getFrontBackTemplates().back?.['uri#integrity'] && (
                    <p className="text-xs text-green-600 font-mono truncate">
                      {getFrontBackTemplates().back?.['uri#integrity']}
                    </p>
                  )}
                </div>
              </div>

              {/* Card Elements Configuration */}
              <CardElementsForm displayIndex={activeTab} />
            </>
          )}
        </div>
      )}

      {/* Asset Library Modal */}
      <AssetLibrary
        isOpen={assetPickerOpen}
        onClose={() => {
          setAssetPickerOpen(false);
          setAssetPickerTarget(null);
        }}
        onSelect={handleAssetSelect}
        title={
          assetPickerTarget === 'logo'
            ? 'Select Logo Image'
            : assetPickerTarget === 'background'
            ? 'Select Background Image'
            : 'Select SVG Template'
        }
      />
    </div>
  );
}
