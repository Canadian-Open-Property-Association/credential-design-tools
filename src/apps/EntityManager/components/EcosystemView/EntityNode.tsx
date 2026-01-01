import { useState } from 'react';
import type { Entity } from '../../../../types/entity';

interface EntityNodeProps {
  entity: Entity;
  logoUrl: string | null;
  x: number;
  y: number;
  onClick: (event: React.MouseEvent) => void;
  isSelected?: boolean;
  animationDelay?: number;
}

export default function EntityNode({
  entity,
  logoUrl,
  x,
  y,
  onClick,
  isSelected = false,
  animationDelay = 0,
}: EntityNodeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [imageError, setImageError] = useState(false);

  const size = 48;
  const halfSize = size / 2;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      className="cursor-pointer entity-node"
    >
      {/* Inner group for animation - separates position from animation transform */}
      <g
        className="entity-node-inner"
        style={{
          animationDelay: `${animationDelay}s`,
        }}
      >
        {/* Glow effect on hover/selection */}
        <circle
          cx={0}
          cy={0}
          r={halfSize + 4}
          className={`transition-all duration-200 ${
            isSelected
              ? 'fill-blue-500/30'
              : 'fill-transparent hover:fill-white/10'
          }`}
          style={{
            filter: isSelected ? 'blur(8px)' : undefined,
          }}
        />

        {/* Background circle */}
        <circle
          cx={0}
          cy={0}
          r={halfSize}
          className={`fill-slate-700 stroke-slate-500 transition-all duration-200 ${
            isSelected ? 'stroke-blue-400 stroke-2' : 'stroke-1 hover:stroke-slate-400'
          }`}
        />

        {/* Clip path for logo */}
        <defs>
          <clipPath id={`clip-${entity.id}`}>
            <circle cx={0} cy={0} r={halfSize - 4} />
          </clipPath>
        </defs>

        {/* Logo or initials */}
        {logoUrl && !imageError ? (
          <image
            href={logoUrl}
            x={-halfSize + 4}
            y={-halfSize + 4}
            width={size - 8}
            height={size - 8}
            clipPath={`url(#clip-${entity.id})`}
            preserveAspectRatio="xMidYMid slice"
            onError={() => setImageError(true)}
            className="pointer-events-none"
          />
        ) : (
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-slate-300 text-xs font-medium pointer-events-none select-none"
            style={{ fontSize: '14px' }}
          >
            {entity.name.substring(0, 2).toUpperCase()}
          </text>
        )}
      </g>

      {/* Tooltip - outside animation group so it doesn't float */}
      {showTooltip && (
        <g transform={`translate(0, ${-halfSize - 12})`}>
          <rect
            x={-60}
            y={-24}
            width={120}
            height={24}
            rx={4}
            className="fill-slate-800"
          />
          <text
            x={0}
            y={-12}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-white text-xs pointer-events-none select-none"
            style={{ fontSize: '11px' }}
          >
            {entity.name.length > 18 ? entity.name.substring(0, 18) + '...' : entity.name}
          </text>
        </g>
      )}
    </g>
  );
}
