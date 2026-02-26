import { memo, useState, useRef, useCallback } from 'react';
import {
    BaseEdge,
    EdgeLabelRenderer,
    getBezierPath,
    useViewport,
    type EdgeProps,
} from '@xyflow/react';
import { useAppStore } from '../../store/store';
import type { Dashboard } from '../../types';

interface DependencyEdgeData {
    dashboardCount: number;
    dashboards: Dashboard[];
    label?: string;
    isSelected?: boolean;
    isPinned?: boolean;
    connectionId: string;
    animationsEnabled?: boolean;
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
    const dashboards = edgeData?.dashboards ?? [];
    const label = edgeData?.label;
    const isSelected = edgeData?.isSelected ?? false;
    const isPinned = edgeData?.isPinned ?? false;
    const connectionId = edgeData?.connectionId;
    const animationsEnabled = edgeData?.animationsEnabled ?? true;

    const togglePinEdge = useAppStore((s) => s.togglePinEdge);
    const [expandedDashIds, setExpandedDashIds] = useState<Set<string>>(new Set());
    const { zoom } = useViewport();

    // ─── Drag offset for the edge label (in flow coordinates) ───
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const offsetStart = useRef({ x: 0, y: 0 });

    const onPointerDown = useCallback((e: React.PointerEvent) => {
        if ((e.target as HTMLElement).closest('button, iframe, input')) return;
        e.stopPropagation();
        isDragging.current = true;
        dragStart.current = { x: e.clientX, y: e.clientY };
        offsetStart.current = { ...offset };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, [offset]);

    const onPointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging.current) return;
        e.stopPropagation();
        // Divide by zoom to convert screen pixels → flow coordinates
        setOffset({
            x: offsetStart.current.x + (e.clientX - dragStart.current.x) / zoom,
            y: offsetStart.current.y + (e.clientY - dragStart.current.y) / zoom,
        });
    }, [zoom]);

    const onPointerUp = useCallback((e: React.PointerEvent) => {
        if (!isDragging.current) return;
        isDragging.current = false;
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }, []);

    // ─── Compute default bezier path ───
    const [defaultPath, defaultLabelX, defaultLabelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetPosition,
        targetX,
        targetY,
    });

    // ─── When offset exists, compute a custom path that curves through the dragged point ───
    const hasOffset = offset.x !== 0 || offset.y !== 0;
    let edgePath: string;
    let labelPosX: number;
    let labelPosY: number;

    if (hasOffset) {
        // Desired midpoint at t=0.5 of the curve
        labelPosX = defaultLabelX + offset.x;
        labelPosY = defaultLabelY + offset.y;

        // For quadratic bezier M P0 Q CP P2, point at t=0.5 is:
        //   B(0.5) = 0.25*P0 + 0.5*CP + 0.25*P2
        // Solving for CP:
        //   CP = 2*B(0.5) - 0.5*P0 - 0.5*P2
        const cpX = 2 * labelPosX - 0.5 * sourceX - 0.5 * targetX;
        const cpY = 2 * labelPosY - 0.5 * sourceY - 0.5 * targetY;

        edgePath = `M ${sourceX},${sourceY} Q ${cpX},${cpY} ${targetX},${targetY}`;
    } else {
        edgePath = defaultPath;
        labelPosX = defaultLabelX;
        labelPosY = defaultLabelY;
    }

    const toggleDashExpand = (dashId: string) => {
        setExpandedDashIds((prev) => {
            const next = new Set(prev);
            if (next.has(dashId)) next.delete(dashId);
            else next.add(dashId);
            return next;
        });
    };

    return (
        <>
            {/* Glow line behind for selected or pinned */}
            {(isSelected || isPinned) && (
                <BaseEdge
                    id={`${id}-glow`}
                    path={edgePath}
                    style={{
                        stroke: isPinned ? '#10b981' : '#6366f1',
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
                    stroke: isPinned ? '#34d399' : isSelected ? '#818cf8' : '#475569',
                    strokeWidth: isSelected || isPinned ? 2.5 : 1.5,
                    transition: 'stroke 0.2s, stroke-width 0.2s',
                }}
            />
            {/* Animated flow dots (only when animations enabled) */}
            {animationsEnabled && (
                <circle r="3" fill={isPinned ? '#34d399' : isSelected ? '#818cf8' : '#64748b'}>
                    <animateMotion dur="3s" repeatCount="indefinite" path={edgePath} />
                </circle>
            )}

            <EdgeLabelRenderer>
                {/* ─── Edge label badge (draggable — moves the edge line too) ─── */}
                <div
                    className="nodrag nopan pointer-events-auto"
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelPosX}px,${labelPosY}px)`,
                        zIndex: isPinned ? 10 : 1,
                        cursor: isDragging.current ? 'grabbing' : 'grab',
                    }}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                >
                    <div className="flex flex-col items-center gap-1">
                        {/* Badge row */}
                        <div
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium cursor-pointer
                transition-all duration-200 border
                ${isPinned
                                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-lg shadow-emerald-500/10'
                                    : isSelected
                                        ? 'bg-accent/20 border-accent/50 text-accent-light shadow-lg shadow-accent/10'
                                        : 'bg-surface-800/90 border-surface-600/50 text-surface-300 hover:bg-surface-700/90 hover:border-surface-500/50'
                                }`}
                        >
                            {label && <span>{label}</span>}
                            {dashboardCount > 0 && (
                                <span
                                    className={`inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold
                    ${isPinned
                                            ? 'bg-emerald-500 text-white'
                                            : isSelected ? 'bg-accent text-white' : 'bg-surface-600 text-surface-200'
                                        }`}
                                >
                                    {dashboardCount}
                                </span>
                            )}
                            {dashboardCount === 0 && !label && (
                                <span className="text-surface-500">•</span>
                            )}

                            {/* Pin/Unpin button */}
                            {dashboardCount > 0 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        togglePinEdge(connectionId);
                                    }}
                                    className={`ml-0.5 p-0.5 rounded transition-colors ${isPinned
                                        ? 'text-emerald-300 hover:text-emerald-200'
                                        : 'text-surface-400 hover:text-surface-200'
                                        }`}
                                    title={isPinned ? 'Unpin metrics from canvas' : 'Pin metrics to canvas'}
                                >
                                    <svg className="w-3 h-3" fill={isPinned ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* ─── Pinned metrics panel ─────────────── */}
                        {isPinned && dashboards.length > 0 && (
                            <div
                                className="mt-1 w-[320px] bg-surface-900/95 backdrop-blur-md border border-surface-600/50 rounded-xl shadow-2xl shadow-black/40 overflow-hidden animate-fade-in"
                                style={{ zIndex: 20 }}
                            >
                                {/* Panel header */}
                                <div className="flex items-center justify-between px-3 py-2 border-b border-surface-700/50 bg-surface-800/50">
                                    <span className="text-[11px] font-semibold text-surface-300 uppercase tracking-wider">
                                        📊 Metrics ({dashboards.length})
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            togglePinEdge(connectionId);
                                        }}
                                        className="p-1 rounded-md text-surface-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                                        title="Unpin"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Dashboard cards */}
                                <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
                                    {dashboards.map((dash) => {
                                        const isExpanded = expandedDashIds.has(dash.id);
                                        return (
                                            <div key={dash.id} className="border-b border-surface-700/30 last:border-b-0">
                                                {/* Title bar */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleDashExpand(dash.id);
                                                    }}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-800/50 transition-colors group"
                                                >
                                                    <svg
                                                        className={`w-3 h-3 text-surface-400 transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                                                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                    <span className="text-xs font-medium text-surface-200 truncate">{dash.title}</span>
                                                </button>

                                                {/* Lazy-loaded iframe */}
                                                {isExpanded && (
                                                    <div className="px-2 pb-2 animate-fade-in">
                                                        <div className="rounded-lg overflow-hidden bg-surface-950 border border-surface-700/50">
                                                            <iframe
                                                                src={dash.iframeUrl}
                                                                title={dash.title}
                                                                className="w-full h-[180px] border-0"
                                                                loading="lazy"
                                                                sandbox="allow-scripts allow-same-origin allow-popups"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </EdgeLabelRenderer>
        </>
    );
}

export default memo(DependencyEdgeComponent);
