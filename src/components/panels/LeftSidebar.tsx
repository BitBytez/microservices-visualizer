import { useState, useMemo } from 'react';
import { useAppStore } from '../../store/store';

const typeIcons: Record<string, string> = {
    microservice: '⬡',
    database: '⛁',
    cache: '◆',
    queue: '↹',
    cdn: '◎',
    gateway: '⊞',
};

export default function LeftSidebar() {
    const { services, selectedNodeId, setSelectedNode, setSelectedEdge } = useAppStore();
    const [search, setSearch] = useState('');

    const filtered = useMemo(
        () =>
            services.filter((s) =>
                s.name.toLowerCase().includes(search.toLowerCase())
            ),
        [services, search]
    );

    const grouped = useMemo(() => {
        const groups: Record<string, typeof filtered> = {};
        filtered.forEach((s) => {
            const type = s.type;
            if (!groups[type]) groups[type] = [];
            groups[type].push(s);
        });
        return groups;
    }, [filtered]);

    const typeOrder = ['gateway', 'microservice', 'database', 'cache', 'queue', 'cdn'];
    const typeLabels: Record<string, string> = {
        microservice: 'Services',
        database: 'Databases',
        cache: 'Caches',
        queue: 'Queues',
        cdn: 'CDN',
        gateway: 'Gateways',
    };

    return (
        <div className="w-[280px] min-w-[280px] h-full bg-surface-900 border-r border-surface-700/50 flex flex-col animate-slide-in-left">
            {/* Header */}
            <div className="p-4 border-b border-surface-700/50">
                <h1 className="text-lg font-bold text-surface-100 flex items-center gap-2">
                    <span className="text-accent">◈</span>
                    Service Graph
                </h1>
                <p className="text-xs text-surface-400 mt-0.5">
                    {services.length} services
                </p>
            </div>

            {/* Search */}
            <div className="px-4 py-3">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search services..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-surface-800 border border-surface-600/50 rounded-lg px-3 py-2 pl-8 text-sm text-surface-200 placeholder-surface-500 
              focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                    />
                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Service List */}
            <div className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-thin">
                {typeOrder.map((type) => {
                    const group = grouped[type];
                    if (!group || group.length === 0) return null;
                    return (
                        <div key={type} className="mb-3">
                            <div className="px-2 py-1.5 text-[10px] font-semibold text-surface-500 uppercase tracking-widest">
                                {typeLabels[type] || type}
                            </div>
                            {group.map((service) => {
                                const isActive = service.id === selectedNodeId;
                                return (
                                    <button
                                        key={service.id}
                                        onClick={() => {
                                            setSelectedNode(service.id);
                                            setSelectedEdge(null);
                                        }}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150 group
                      ${isActive
                                                ? 'bg-accent/15 border border-accent/30'
                                                : 'hover:bg-surface-800/80 border border-transparent'
                                            }`}
                                    >
                                        <span
                                            className="flex items-center justify-center w-6 h-6 rounded-md text-xs"
                                            style={{
                                                backgroundColor: service.color + '20',
                                                color: service.color,
                                            }}
                                        >
                                            {typeIcons[service.type] || '⬡'}
                                        </span>
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className={`text-sm truncate ${isActive ? 'text-accent-light font-medium' : 'text-surface-300 group-hover:text-surface-100'}`}>
                                                {service.name}
                                            </span>
                                        </div>
                                        {/* Color dot */}
                                        <div
                                            className="w-2 h-2 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: service.color }}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    );
                })}
                {filtered.length === 0 && (
                    <div className="text-center py-8 text-surface-500 text-sm">
                        No services found
                    </div>
                )}
            </div>
        </div>
    );
}
