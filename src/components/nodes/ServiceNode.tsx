import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ServiceType } from '../../types';

interface ServiceNodeData {
    label: string;
    serviceType: ServiceType;
    color: string;
    description?: string;
    isSelected?: boolean;
    [key: string]: unknown;
}

const typeIcons: Record<ServiceType, string> = {
    microservice: '⬡',
    database: '⛁',
    cache: '◆',
    queue: '↹',
    cdn: '◎',
    gateway: '⊞',
};

const typeLabels: Record<ServiceType, string> = {
    microservice: 'Service',
    database: 'Database',
    cache: 'Cache',
    queue: 'Queue',
    cdn: 'CDN',
    gateway: 'Gateway',
};

function ServiceNodeComponent({ data }: NodeProps) {
    const nodeData = data as unknown as ServiceNodeData;
    const { label, serviceType, color, isSelected } = nodeData;
    const icon = typeIcons[serviceType] || '⬡';
    const typeLabel = typeLabels[serviceType] || 'Service';

    const shapeClass = getShapeClass(serviceType);

    return (
        <>
            <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-surface-400 !border-2 !border-surface-700 hover:!bg-accent transition-colors" />
            <div
                className={`group relative transition-all duration-200 ${shapeClass} ${isSelected
                        ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface-900 scale-105'
                        : 'hover:scale-105 hover:shadow-lg hover:shadow-black/30'
                    }`}
                style={{
                    '--node-color': color,
                    '--node-color-20': color + '33',
                    '--node-color-40': color + '66',
                } as React.CSSProperties}
            >
                {/* Glow effect */}
                <div
                    className="absolute inset-0 rounded-xl opacity-20 blur-md transition-opacity group-hover:opacity-40"
                    style={{ backgroundColor: color }}
                />

                <div className="relative bg-surface-800/90 backdrop-blur-sm border border-surface-600/50 rounded-xl px-4 py-3 min-w-[140px]">
                    {/* Color bar top */}
                    <div
                        className="absolute top-0 left-3 right-3 h-[2px] rounded-full"
                        style={{ backgroundColor: color }}
                    />

                    <div className="flex items-center gap-2.5">
                        {/* Icon */}
                        <div
                            className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold"
                            style={{
                                backgroundColor: color + '20',
                                color: color,
                            }}
                        >
                            {icon}
                        </div>

                        {/* Info */}
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-surface-100 truncate max-w-[120px]">
                                {label}
                            </span>
                            <span className="text-[10px] font-medium text-surface-400 uppercase tracking-wider">
                                {typeLabel}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-surface-400 !border-2 !border-surface-700 hover:!bg-accent transition-colors" />
        </>
    );
}

function getShapeClass(type: ServiceType): string {
    switch (type) {
        case 'database':
            return 'node-database';
        case 'cache':
            return 'node-cache';
        case 'queue':
            return 'node-queue';
        default:
            return '';
    }
}

export default memo(ServiceNodeComponent);
