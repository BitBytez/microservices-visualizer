import { memo } from 'react';
import {
    BaseEdge,
    EdgeLabelRenderer,
    getBezierPath,
    type EdgeProps,
} from '@xyflow/react';

interface DependencyEdgeData {
    dashboardCount: number;
    label?: string;
    isSelected?: boolean;
    [key: string]: unknown;
}

function DependencyEdgeComponent({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    style,
}: EdgeProps) {
    const edgeData = data as unknown as DependencyEdgeData;
    const dashboardCount = edgeData?.dashboardCount ?? 0;
    const label = edgeData?.label;
    const isSelected = edgeData?.isSelected ?? false;

    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetPosition,
        targetX,
        targetY,
    });

    return (
        <>
            {/* Glow line behind for selected */}
            {isSelected && (
                <BaseEdge
                    id={`${id}-glow`}
                    path={edgePath}
                    style={{
                        stroke: '#6366f1',
                        strokeWidth: 6,
                        filter: 'blur(4px)',
                        opacity: 0.4,
                    }}
                />
            )}
            <BaseEdge
                id={id}
                path={edgePath}
                style={{
                    ...style,
                    stroke: isSelected ? '#818cf8' : '#475569',
                    strokeWidth: isSelected ? 2.5 : 1.5,
                    transition: 'stroke 0.2s, stroke-width 0.2s',
                }}
            />
            {/* Animated flow dots */}
            <circle r="3" fill={isSelected ? '#818cf8' : '#64748b'}>
                <animateMotion dur="3s" repeatCount="indefinite" path={edgePath} />
            </circle>

            <EdgeLabelRenderer>
                <div
                    className="nodrag nopan pointer-events-auto"
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                    }}
                >
                    <div
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium cursor-pointer
              transition-all duration-200 border
              ${isSelected
                                ? 'bg-accent/20 border-accent/50 text-accent-light shadow-lg shadow-accent/10'
                                : 'bg-surface-800/90 border-surface-600/50 text-surface-300 hover:bg-surface-700/90 hover:border-surface-500/50'
                            }`}
                    >
                        {label && <span>{label}</span>}
                        {dashboardCount > 0 && (
                            <span
                                className={`inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold
                  ${isSelected ? 'bg-accent text-white' : 'bg-surface-600 text-surface-200'}`}
                            >
                                {dashboardCount}
                            </span>
                        )}
                        {dashboardCount === 0 && !label && (
                            <span className="text-surface-500">•</span>
                        )}
                    </div>
                </div>
            </EdgeLabelRenderer>
        </>
    );
}

export default memo(DependencyEdgeComponent);
