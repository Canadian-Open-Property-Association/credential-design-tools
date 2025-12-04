import { useState } from 'react';
import { useVctStore } from '../../store/vctStore';
import { getLocaleName } from '../../types/vct';
import MetadataForm from '../../components/FormPanel/MetadataForm';
import DisplayForm from '../../components/FormPanel/DisplayForm';
import ClaimsForm from '../../components/FormPanel/ClaimsForm';
import JsonPreview from '../../components/JsonPanel/JsonPreview';
import CredentialPreview from '../../components/PreviewPanel/CredentialPreview';
import Toolbar from '../../components/Toolbar/Toolbar';

type FormSection = 'metadata' | 'display' | 'claims';

export default function VctBuilderApp() {
  const [activeSection, setActiveSection] = useState<FormSection>('metadata');
  const [previewLocale, setPreviewLocale] = useState<string>('en-CA');
  const [cardSide, setCardSide] = useState<'front' | 'back' | undefined>(undefined);
  const currentProjectName = useVctStore((state) => state.currentProjectName);
  const updateProjectName = useVctStore((state) => state.updateProjectName);
  const isDirty = useVctStore((state) => state.isDirty);
  const currentVct = useVctStore((state) => state.currentVct);

  // Get available locales from the current VCT display configuration
  const availableLocales = currentVct.display.map((d) => d.locale);

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Header */}
      <header className="bg-slate-800 text-white px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">VCT Builder</h1>
            <p className="text-slate-300 text-sm">
              Build Verifiable Credential Type files for COPA
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={currentProjectName}
              onChange={(e) => updateProjectName(e.target.value)}
              className="text-lg font-medium bg-transparent border-b border-transparent hover:border-slate-500 focus:border-white focus:outline-none px-2 py-1 text-right text-white placeholder-slate-400"
              placeholder="Project name"
            />
            {isDirty && <span className="text-yellow-400 text-lg" title="Unsaved changes">*</span>}
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <Toolbar />

      {/* Main Content - Three Panel Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel - Form Input */}
        <div className="w-1/3 border-r border-gray-300 bg-white overflow-y-auto">
          {/* Section Tabs */}
          <div className="flex border-b border-gray-200 sticky top-0 bg-white z-10">
            <button
              onClick={() => setActiveSection('metadata')}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeSection === 'metadata'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              Metadata
            </button>
            <button
              onClick={() => setActiveSection('display')}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeSection === 'display'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              Display
            </button>
            <button
              onClick={() => setActiveSection('claims')}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeSection === 'claims'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              Claims
            </button>
          </div>

          {/* Form Content */}
          <div className="p-4">
            {activeSection === 'metadata' && <MetadataForm />}
            {activeSection === 'display' && <DisplayForm />}
            {activeSection === 'claims' && <ClaimsForm />}
          </div>
        </div>

        {/* Middle Panel - JSON Preview */}
        <div className="w-1/3 border-r border-gray-300 bg-gray-900 overflow-y-auto">
          <div className="sticky top-0 bg-gray-800 px-4 py-2 border-b border-gray-700">
            <h2 className="text-white font-medium">VCT JSON</h2>
          </div>
          <JsonPreview />
        </div>

        {/* Right Panel - Credential Preview */}
        <div className="w-1/3 bg-gray-50 overflow-y-auto">
          {/* Preview Controls */}
          <div className="sticky top-0 bg-white px-4 py-2 border-b border-gray-200 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Language:</label>
              <select
                value={previewLocale}
                onChange={(e) => setPreviewLocale(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                {availableLocales.map((locale) => (
                  <option key={locale} value={locale}>
                    {getLocaleName(locale)}
                  </option>
                ))}
              </select>
            </div>
            {/* Card Side Toggle */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Side:</label>
              <div className="flex rounded-md shadow-sm">
                <button
                  type="button"
                  onClick={() => setCardSide(cardSide === 'front' ? undefined : 'front')}
                  className={`px-2 py-1 text-xs font-medium rounded-l-md border ${
                    cardSide === 'front'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Front
                </button>
                <button
                  type="button"
                  onClick={() => setCardSide(cardSide === 'back' ? undefined : 'back')}
                  className={`px-2 py-1 text-xs font-medium rounded-r-md border-t border-r border-b -ml-px ${
                    cardSide === 'back'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Back
                </button>
              </div>
              {cardSide && (
                <button
                  type="button"
                  onClick={() => setCardSide(undefined)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                  title="Reset to interactive flip"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <CredentialPreview locale={previewLocale} cardSide={cardSide} />
        </div>
      </main>
    </div>
  );
}
