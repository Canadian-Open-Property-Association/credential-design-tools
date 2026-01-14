/**
 * JSON Preview Panel
 *
 * Toggleable bottom panel showing the DIF Presentation Exchange JSON output.
 * Can be shown/hidden from the app header.
 */

import { useState, useRef, useEffect } from 'react';
import { useProofTemplateStore } from '../../../store/proofTemplateStore';
import PresentationPreview from './PresentationPreview';

interface JsonPreviewPanelProps {
  /** Initial height in pixels */
  initialHeight?: number;
  /** Minimum height in pixels */
  minHeight?: number;
  /** Maximum height in pixels */
  maxHeight?: number;
}

export default function JsonPreviewPanel({
  initialHeight = 300,
  minHeight = 150,
  maxHeight = 600,
}: JsonPreviewPanelProps) {
  const { getPresentationDefinition } = useProofTemplateStore();
  const definition = getPresentationDefinition();

  const [height, setHeight] = useState(initialHeight);
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const startHeight = useRef(0);

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startY.current = e.clientY;
    startHeight.current = height;
  };

  // Handle resize move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const delta = startY.current - e.clientY;
      const newHeight = Math.min(maxHeight, Math.max(minHeight, startHeight.current + delta));
      setHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, maxHeight, minHeight]);

  return (
    <div
      ref={panelRef}
      className="flex-shrink-0 border-t border-gray-300 bg-gray-900 flex flex-col"
      style={{ height }}
    >
      {/* Resize handle */}
      <div
        className={`h-2 bg-gray-700 cursor-ns-resize flex items-center justify-center hover:bg-gray-600 transition-colors ${
          isDragging ? 'bg-blue-600' : ''
        }`}
        onMouseDown={handleResizeStart}
      >
        <div className="w-10 h-1 bg-gray-500 rounded" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <PresentationPreview definition={definition} />
      </div>
    </div>
  );
}
