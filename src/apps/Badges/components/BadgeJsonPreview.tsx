import { useBadgeStore } from '../../../store/badgeStore';
import { badgeToExportFormat } from '../../../types/badge';

export default function BadgeJsonPreview() {
  const currentBadge = useBadgeStore((state) => state.currentBadge);

  if (!currentBadge) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 p-4">
        <p className="text-sm">No badge selected</p>
      </div>
    );
  }

  const exportData = badgeToExportFormat(currentBadge);

  return (
    <div className="flex-1 overflow-auto p-4">
      <pre className="text-xs text-gray-100 font-mono whitespace-pre-wrap">
        {JSON.stringify(exportData, null, 2)}
      </pre>
    </div>
  );
}
