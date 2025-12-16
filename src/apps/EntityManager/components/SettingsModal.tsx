import { useState, useEffect } from 'react';
import { useFurnisherSettingsStore, DataProviderTypeSetting, EntityStatusSetting, EntityTypeSetting, ServiceProviderTypeSetting } from '../../../store/furnisherSettingsStore';

interface SettingsModalProps {
  onClose: () => void;
}

type SettingsCategory = 'data-types' | 'statuses' | 'entity-types' | 'service-types';

const STATUS_COLORS = [
  { value: 'green', label: 'Green', bg: 'bg-green-100', text: 'text-green-800' },
  { value: 'yellow', label: 'Yellow', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  { value: 'red', label: 'Red', bg: 'bg-red-100', text: 'text-red-800' },
  { value: 'blue', label: 'Blue', bg: 'bg-blue-100', text: 'text-blue-800' },
  { value: 'gray', label: 'Gray', bg: 'bg-gray-100', text: 'text-gray-800' },
  { value: 'purple', label: 'Purple', bg: 'bg-purple-100', text: 'text-purple-800' },
  { value: 'orange', label: 'Orange', bg: 'bg-orange-100', text: 'text-orange-800' },
];

const CATEGORIES = [
  { id: 'entity-types' as const, label: 'Entity Types', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  )},
  { id: 'statuses' as const, label: 'Entity Statuses', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )},
  { id: 'data-types' as const, label: 'Data Provider Types', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
  )},
  { id: 'service-types' as const, label: 'Service Provider Types', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )},
];

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { settings, fetchSettings, updateSettings, isLoading } = useFurnisherSettingsStore();
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('entity-types');
  const [dataProviderTypes, setDataProviderTypes] = useState<DataProviderTypeSetting[]>([]);
  const [entityStatuses, setEntityStatuses] = useState<EntityStatusSetting[]>([]);
  const [entityTypes, setEntityTypes] = useState<EntityTypeSetting[]>([]);
  const [serviceProviderTypes, setServiceProviderTypes] = useState<ServiceProviderTypeSetting[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // New item forms
  const [newDataType, setNewDataType] = useState({ id: '', label: '', description: '' });
  const [newStatus, setNewStatus] = useState({ id: '', label: '', color: 'gray' });
  const [newEntityType, setNewEntityType] = useState({ id: '', label: '', description: '' });
  const [newServiceType, setNewServiceType] = useState({ id: '', label: '', description: '' });

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      setDataProviderTypes(settings.dataProviderTypes);
      setEntityStatuses(settings.entityStatuses);
      setEntityTypes(settings.entityTypes || []);
      setServiceProviderTypes(settings.serviceProviderTypes || []);
    }
  }, [settings]);

  // Generate ID from label
  const generateId = (label: string) => {
    return label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Data Provider Types handlers
  const handleAddDataType = () => {
    if (!newDataType.label.trim()) return;

    const id = newDataType.id.trim() || generateId(newDataType.label);
    if (dataProviderTypes.some(t => t.id === id)) {
      setError('A data provider type with this ID already exists');
      return;
    }

    setDataProviderTypes([...dataProviderTypes, {
      id,
      label: newDataType.label.trim(),
      description: newDataType.description.trim() || undefined,
    }]);
    setNewDataType({ id: '', label: '', description: '' });
    setHasChanges(true);
    setError(null);
  };

  const handleRemoveDataType = (id: string) => {
    setDataProviderTypes(dataProviderTypes.filter(t => t.id !== id));
    setHasChanges(true);
  };

  const handleUpdateDataType = (id: string, updates: Partial<DataProviderTypeSetting>) => {
    setDataProviderTypes(dataProviderTypes.map(t =>
      t.id === id ? { ...t, ...updates } : t
    ));
    setHasChanges(true);
  };

  // Entity Status handlers
  const handleAddStatus = () => {
    if (!newStatus.label.trim()) return;

    const id = newStatus.id.trim() || generateId(newStatus.label);
    if (entityStatuses.some(s => s.id === id)) {
      setError('A status with this ID already exists');
      return;
    }

    setEntityStatuses([...entityStatuses, {
      id,
      label: newStatus.label.trim(),
      color: newStatus.color,
    }]);
    setNewStatus({ id: '', label: '', color: 'gray' });
    setHasChanges(true);
    setError(null);
  };

  const handleRemoveStatus = (id: string) => {
    if (entityStatuses.length <= 1) {
      setError('You must have at least one status');
      return;
    }
    setEntityStatuses(entityStatuses.filter(s => s.id !== id));
    setHasChanges(true);
  };

  const handleUpdateStatus = (id: string, updates: Partial<EntityStatusSetting>) => {
    setEntityStatuses(entityStatuses.map(s =>
      s.id === id ? { ...s, ...updates } : s
    ));
    setHasChanges(true);
  };

  // Entity Type handlers
  const handleAddEntityType = () => {
    if (!newEntityType.label.trim()) return;

    const id = newEntityType.id.trim() || generateId(newEntityType.label);
    if (entityTypes.some(t => t.id === id)) {
      setError('An entity type with this ID already exists');
      return;
    }

    setEntityTypes([...entityTypes, {
      id,
      label: newEntityType.label.trim(),
      description: newEntityType.description.trim() || undefined,
    }]);
    setNewEntityType({ id: '', label: '', description: '' });
    setHasChanges(true);
    setError(null);
  };

  const handleRemoveEntityType = (id: string) => {
    if (entityTypes.length <= 1) {
      setError('You must have at least one entity type');
      return;
    }
    setEntityTypes(entityTypes.filter(t => t.id !== id));
    setHasChanges(true);
  };

  const handleUpdateEntityType = (id: string, updates: Partial<EntityTypeSetting>) => {
    setEntityTypes(entityTypes.map(t =>
      t.id === id ? { ...t, ...updates } : t
    ));
    setHasChanges(true);
  };

  // Service Provider Type handlers
  const handleAddServiceType = () => {
    if (!newServiceType.label.trim()) return;

    const id = newServiceType.id.trim() || generateId(newServiceType.label);
    if (serviceProviderTypes.some(t => t.id === id)) {
      setError('A service provider type with this ID already exists');
      return;
    }

    setServiceProviderTypes([...serviceProviderTypes, {
      id,
      label: newServiceType.label.trim(),
      description: newServiceType.description.trim() || undefined,
    }]);
    setNewServiceType({ id: '', label: '', description: '' });
    setHasChanges(true);
    setError(null);
  };

  const handleRemoveServiceType = (id: string) => {
    setServiceProviderTypes(serviceProviderTypes.filter(t => t.id !== id));
    setHasChanges(true);
  };

  const handleUpdateServiceType = (id: string, updates: Partial<ServiceProviderTypeSetting>) => {
    setServiceProviderTypes(serviceProviderTypes.map(t =>
      t.id === id ? { ...t, ...updates } : t
    ));
    setHasChanges(true);
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await updateSettings({
        dataProviderTypes,
        entityStatuses,
        entityTypes,
        serviceProviderTypes,
      });
      setHasChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColorClasses = (color: string) => {
    const colorConfig = STATUS_COLORS.find(c => c.value === color);
    return colorConfig || STATUS_COLORS.find(c => c.value === 'gray')!;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-[800px] h-[600px] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Entity Settings</h2>
              <p className="text-sm text-gray-500">Configure entity data types and statuses</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main Content - Split Layout */}
        <div className="flex-1 flex min-h-0">
          {/* Left Sidebar - Categories */}
          <div className="w-56 border-r border-gray-200 bg-gray-50 flex-shrink-0">
            <nav className="p-3 space-y-1">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeCategory === category.id
                      ? 'bg-white text-blue-600 shadow-sm border border-gray-200'
                      : 'text-gray-600 hover:bg-white hover:text-gray-900'
                  }`}
                >
                  <span className={activeCategory === category.id ? 'text-blue-600' : 'text-gray-400'}>
                    {category.icon}
                  </span>
                  {category.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoading && !settings ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  {/* Data Provider Types */}
                  {activeCategory === 'data-types' && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-medium text-gray-900">Data Provider Types</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Configure the types of data that entities can provide. These options appear when editing entity profiles.
                        </p>
                      </div>

                      {/* Existing types */}
                      <div className="space-y-2">
                        {dataProviderTypes.map((type) => (
                          <div
                            key={type.id}
                            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{type.label}</span>
                                <span className="text-xs text-gray-400 font-mono">{type.id}</span>
                              </div>
                              <input
                                type="text"
                                value={type.description || ''}
                                onChange={(e) => handleUpdateDataType(type.id, { description: e.target.value })}
                                placeholder="Description (optional)"
                                className="mt-1 w-full text-sm text-gray-600 bg-transparent border-none p-0 focus:ring-0 placeholder:text-gray-400"
                              />
                            </div>
                            <button
                              onClick={() => handleRemoveDataType(type.id)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                              title="Remove"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add new type */}
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Data Provider Type</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={newDataType.label}
                            onChange={(e) => setNewDataType({ ...newDataType, label: e.target.value })}
                            placeholder="Label (e.g., Insurance)"
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            value={newDataType.id}
                            onChange={(e) => setNewDataType({ ...newDataType, id: e.target.value })}
                            placeholder="ID (auto-generated)"
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                          />
                        </div>
                        <input
                          type="text"
                          value={newDataType.description}
                          onChange={(e) => setNewDataType({ ...newDataType, description: e.target.value })}
                          placeholder="Description (optional)"
                          className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={handleAddDataType}
                          disabled={!newDataType.label.trim()}
                          className="mt-3 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add Data Provider Type
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Entity Statuses */}
                  {activeCategory === 'statuses' && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-medium text-gray-900">Entity Statuses</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Configure the status options available for entities. These affect how entities are displayed and filtered.
                        </p>
                      </div>

                      {/* Existing statuses */}
                      <div className="space-y-2">
                        {entityStatuses.map((status) => {
                          const colorConfig = getStatusColorClasses(status.color);
                          return (
                            <div
                              key={status.id}
                              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                            >
                              <span className={`px-2 py-0.5 text-xs font-medium rounded ${colorConfig.bg} ${colorConfig.text}`}>
                                {status.label}
                              </span>
                              <span className="text-xs text-gray-400 font-mono">{status.id}</span>
                              <select
                                value={status.color}
                                onChange={(e) => handleUpdateStatus(status.id, { color: e.target.value })}
                                className="ml-auto text-sm border border-gray-300 rounded px-2 py-1"
                              >
                                {STATUS_COLORS.map((color) => (
                                  <option key={color.value} value={color.value}>
                                    {color.label}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleRemoveStatus(status.id)}
                                className="p-1 text-gray-400 hover:text-red-600 rounded"
                                title="Remove"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Add new status */}
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Status</h4>
                        <div className="grid grid-cols-3 gap-3">
                          <input
                            type="text"
                            value={newStatus.label}
                            onChange={(e) => setNewStatus({ ...newStatus, label: e.target.value })}
                            placeholder="Label (e.g., Archived)"
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            value={newStatus.id}
                            onChange={(e) => setNewStatus({ ...newStatus, id: e.target.value })}
                            placeholder="ID (auto-generated)"
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                          />
                          <select
                            value={newStatus.color}
                            onChange={(e) => setNewStatus({ ...newStatus, color: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {STATUS_COLORS.map((color) => (
                              <option key={color.value} value={color.value}>
                                {color.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={handleAddStatus}
                          disabled={!newStatus.label.trim()}
                          className="mt-3 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add Status
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Entity Types */}
                  {activeCategory === 'entity-types' && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-medium text-gray-900">Entity Types</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Configure the types of entities (e.g., Data Furnisher, Service Provider). Each entity can be assigned one type.
                        </p>
                      </div>

                      {/* Existing entity types */}
                      <div className="space-y-2">
                        {entityTypes.map((type) => (
                          <div
                            key={type.id}
                            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{type.label}</span>
                                <span className="text-xs text-gray-400 font-mono">{type.id}</span>
                              </div>
                              <input
                                type="text"
                                value={type.description || ''}
                                onChange={(e) => handleUpdateEntityType(type.id, { description: e.target.value })}
                                placeholder="Description (optional)"
                                className="mt-1 w-full text-sm text-gray-600 bg-transparent border-none p-0 focus:ring-0 placeholder:text-gray-400"
                              />
                            </div>
                            <button
                              onClick={() => handleRemoveEntityType(type.id)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                              title="Remove"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add new entity type */}
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Entity Type</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={newEntityType.label}
                            onChange={(e) => setNewEntityType({ ...newEntityType, label: e.target.value })}
                            placeholder="Label (e.g., Regulator)"
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            value={newEntityType.id}
                            onChange={(e) => setNewEntityType({ ...newEntityType, id: e.target.value })}
                            placeholder="ID (auto-generated)"
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                          />
                        </div>
                        <input
                          type="text"
                          value={newEntityType.description}
                          onChange={(e) => setNewEntityType({ ...newEntityType, description: e.target.value })}
                          placeholder="Description (optional)"
                          className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={handleAddEntityType}
                          disabled={!newEntityType.label.trim()}
                          className="mt-3 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add Entity Type
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Service Provider Types */}
                  {activeCategory === 'service-types' && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-medium text-gray-900">Service Provider Types</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Configure the types of services that service provider entities can offer (e.g., Insurance, Mortgage, Legal). Only applicable to service provider entities.
                        </p>
                      </div>

                      {/* Existing service types */}
                      <div className="space-y-2">
                        {serviceProviderTypes.map((type) => (
                          <div
                            key={type.id}
                            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{type.label}</span>
                                <span className="text-xs text-gray-400 font-mono">{type.id}</span>
                              </div>
                              <input
                                type="text"
                                value={type.description || ''}
                                onChange={(e) => handleUpdateServiceType(type.id, { description: e.target.value })}
                                placeholder="Description (optional)"
                                className="mt-1 w-full text-sm text-gray-600 bg-transparent border-none p-0 focus:ring-0 placeholder:text-gray-400"
                              />
                            </div>
                            <button
                              onClick={() => handleRemoveServiceType(type.id)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                              title="Remove"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add new service type */}
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Service Provider Type</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={newServiceType.label}
                            onChange={(e) => setNewServiceType({ ...newServiceType, label: e.target.value })}
                            placeholder="Label (e.g., Home Warranty)"
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            value={newServiceType.id}
                            onChange={(e) => setNewServiceType({ ...newServiceType, id: e.target.value })}
                            placeholder="ID (auto-generated)"
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                          />
                        </div>
                        <input
                          type="text"
                          value={newServiceType.description}
                          onChange={(e) => setNewServiceType({ ...newServiceType, description: e.target.value })}
                          placeholder="Description (optional)"
                          className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={handleAddServiceType}
                          disabled={!newServiceType.label.trim()}
                          className="mt-3 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add Service Provider Type
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="text-sm text-gray-500">
            {hasChanges && <span className="text-amber-600">Unsaved changes</span>}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {hasChanges ? 'Cancel' : 'Close'}
            </button>
            {hasChanges && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
