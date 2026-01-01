import { useState } from 'react';
import type { FurnisherField } from '../../../types/entity';

interface FieldsTableProps {
  fields: FurnisherField[];
  onChange: (fields: FurnisherField[]) => void;
}

const DATA_TYPES = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'integer', label: 'Integer' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'DateTime' },
  { value: 'array', label: 'Array' },
  { value: 'object', label: 'Object' },
] as const;

// Convert snake_case or camelCase to Title Case
function toDisplayName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export default function FieldsTable({ fields, onChange }: FieldsTableProps) {
  const [editingCell, setEditingCell] = useState<{ fieldId: string; column: string } | null>(null);

  const handleAddField = () => {
    const newField: FurnisherField = {
      id: `field-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: '',
      displayName: '',
      dataType: 'string',
      description: '',
      required: false,
    };
    onChange([...fields, newField]);
    // Focus the new field's name cell
    setTimeout(() => {
      setEditingCell({ fieldId: newField.id, column: 'name' });
    }, 50);
  };

  const handleUpdateField = (fieldId: string, updates: Partial<FurnisherField>) => {
    const updatedFields = fields.map(field => {
      if (field.id === fieldId) {
        const updated = { ...field, ...updates };
        // Auto-generate displayName from name if displayName is empty and name changed
        if (updates.name !== undefined && !field.displayName && !updates.displayName) {
          updated.displayName = toDisplayName(updates.name);
        }
        return updated;
      }
      return field;
    });
    onChange(updatedFields);
  };

  const handleDeleteField = (fieldId: string) => {
    onChange(fields.filter(f => f.id !== fieldId));
  };

  const handleKeyDown = (e: React.KeyboardEvent, fieldId: string, column: string) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const columns = ['name', 'displayName', 'dataType', 'description'];
      const currentIndex = columns.indexOf(column);
      const fieldIndex = fields.findIndex(f => f.id === fieldId);

      if (e.shiftKey) {
        // Move backwards
        if (currentIndex > 0) {
          setEditingCell({ fieldId, column: columns[currentIndex - 1] });
        } else if (fieldIndex > 0) {
          setEditingCell({ fieldId: fields[fieldIndex - 1].id, column: columns[columns.length - 1] });
        }
      } else {
        // Move forwards
        if (currentIndex < columns.length - 1) {
          setEditingCell({ fieldId, column: columns[currentIndex + 1] });
        } else if (fieldIndex < fields.length - 1) {
          setEditingCell({ fieldId: fields[fieldIndex + 1].id, column: columns[0] });
        } else {
          // At the last cell of last row, add a new field
          handleAddField();
        }
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setEditingCell(null);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const renderCell = (field: FurnisherField, column: string) => {
    const isEditing = editingCell?.fieldId === field.id && editingCell?.column === column;
    const value = field[column as keyof FurnisherField] as string;

    if (column === 'dataType') {
      return (
        <select
          value={field.dataType || 'string'}
          onChange={(e) => handleUpdateField(field.id, { dataType: e.target.value as FurnisherField['dataType'] })}
          onKeyDown={(e) => handleKeyDown(e, field.id, column)}
          className="w-full px-2 py-1 text-sm border-0 bg-transparent focus:ring-1 focus:ring-blue-500 rounded"
        >
          {DATA_TYPES.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      );
    }

    if (isEditing) {
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => handleUpdateField(field.id, { [column]: e.target.value })}
          onBlur={() => setEditingCell(null)}
          onKeyDown={(e) => handleKeyDown(e, field.id, column)}
          autoFocus
          className="w-full px-2 py-1 text-sm border-0 bg-transparent focus:ring-1 focus:ring-blue-500 rounded"
          placeholder={column === 'name' ? 'attribute_name' : column === 'displayName' ? 'Display Name' : 'Description...'}
        />
      );
    }

    return (
      <div
        onClick={() => setEditingCell({ fieldId: field.id, column })}
        className={`px-2 py-1 text-sm cursor-text min-h-[28px] ${
          !value ? 'text-gray-400 italic' : ''
        }`}
      >
        {value || (column === 'name' ? 'Click to edit' : column === 'displayName' ? 'Auto-generated' : 'Add description...')}
      </div>
    );
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_1fr_100px_1.5fr_40px] bg-gray-50 border-b border-gray-200">
        <div className="px-3 py-2 text-xs font-medium text-gray-600 uppercase tracking-wider">
          Attribute
        </div>
        <div className="px-3 py-2 text-xs font-medium text-gray-600 uppercase tracking-wider">
          Display Name
        </div>
        <div className="px-3 py-2 text-xs font-medium text-gray-600 uppercase tracking-wider">
          Type
        </div>
        <div className="px-3 py-2 text-xs font-medium text-gray-600 uppercase tracking-wider">
          Definition
        </div>
        <div className="px-3 py-2"></div>
      </div>

      {/* Rows */}
      {fields.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-gray-500">
          No fields defined yet. Click "Add Field" to start.
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {fields.map((field) => (
            <div
              key={field.id}
              className="grid grid-cols-[1fr_1fr_100px_1.5fr_40px] hover:bg-gray-50 group"
            >
              <div className="border-r border-gray-100">
                {renderCell(field, 'name')}
              </div>
              <div className="border-r border-gray-100">
                {renderCell(field, 'displayName')}
              </div>
              <div className="border-r border-gray-100">
                {renderCell(field, 'dataType')}
              </div>
              <div className="border-r border-gray-100">
                {renderCell(field, 'description')}
              </div>
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => handleDeleteField(field.id)}
                  className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete field"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Field Button */}
      <div className="border-t border-gray-200 px-3 py-2 bg-gray-50">
        <button
          type="button"
          onClick={handleAddField}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Field
        </button>
      </div>
    </div>
  );
}
