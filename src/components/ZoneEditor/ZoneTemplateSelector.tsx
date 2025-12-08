import { useZoneTemplateStore } from '../../store/zoneTemplateStore';

interface ZoneTemplateSelectorProps {
  selectedTemplateId: string | null;
  onSelect: (templateId: string) => void;
  onManageClick?: () => void;
  disabled?: boolean;
}

export default function ZoneTemplateSelector({
  selectedTemplateId,
  onSelect,
  onManageClick,
  disabled = false,
}: ZoneTemplateSelectorProps) {
  const templates = useZoneTemplateStore((state) => state.templates);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <select
          value={selectedTemplateId || ''}
          onChange={(e) => onSelect(e.target.value)}
          disabled={disabled || templates.length === 0}
          className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-500 appearance-none cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
            backgroundPosition: 'right 0.5rem center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1.5em 1.5em',
            paddingRight: '2.5rem',
          }}
        >
          {templates.length === 0 ? (
            <option value="">No templates available</option>
          ) : (
            <>
              <option value="">Select a template...</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                  {template.description ? ` - ${template.description}` : ''}
                </option>
              ))}
            </>
          )}
        </select>

        {onManageClick && (
          <button
            type="button"
            onClick={onManageClick}
            disabled={disabled}
            className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md border border-blue-200 transition-colors disabled:text-gray-400 disabled:border-gray-200 disabled:hover:bg-transparent shrink-0"
          >
            Manage
          </button>
        )}
      </div>

      {/* Template info */}
      {selectedTemplateId && (
        <TemplateInfo templateId={selectedTemplateId} />
      )}
    </div>
  );
}

function TemplateInfo({ templateId }: { templateId: string }) {
  const template = useZoneTemplateStore((state) =>
    state.templates.find((t) => t.id === templateId)
  );

  if (!template) return null;

  const frontZoneCount = template.front.zones.length;
  const backZoneCount = template.back.zones.length;

  return (
    <div className="text-xs text-gray-500 flex items-center gap-3">
      <span>
        Front: {frontZoneCount} zone{frontZoneCount !== 1 ? 's' : ''}
      </span>
      {!template.frontOnly && (
        <>
          <span className="text-gray-300">|</span>
          <span>
            Back: {backZoneCount} zone{backZoneCount !== 1 ? 's' : ''}
          </span>
        </>
      )}
      {template.frontOnly && (
        <>
          <span className="text-gray-300">|</span>
          <span className="text-purple-500 font-medium">Front only</span>
        </>
      )}
    </div>
  );
}
