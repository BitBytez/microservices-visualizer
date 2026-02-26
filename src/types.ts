// ─── Service Types ───────────────────────────────────────────────
export type ServiceType = 'microservice' | 'database' | 'cache' | 'queue' | 'cdn' | 'gateway';

export interface ServiceLink {
    label: string;
    url: string;
}

export interface ServiceNode {
    id: string;
    name: string;
    type: ServiceType;
    description?: string;
    color: string;
    links?: ServiceLink[];
}

// ─── Dashboard / Edge Types ─────────────────────────────────────
export interface Dashboard {
    id: string;
    title: string;
    iframeUrl: string;
}

export interface Connection {
    id: string;
    source: string;
    target: string;
    label?: string;
    dashboards: Dashboard[];
}

// ─── Graph Config ───────────────────────────────────────────────
export interface GraphConfig {
    services: ServiceNode[];
    connections: Connection[];
}

// ─── Saved Diagram (persisted to IndexedDB) ─────────────────────
export interface SavedDiagram {
    id: string;
    name: string;
    services: ServiceNode[];
    connections: Connection[];
    nodePositions: Record<string, { x: number; y: number }>;
    edgeOffsets: Record<string, { x: number; y: number }>;
    createdAt: number;
    updatedAt: number;
}

// ─── App State ──────────────────────────────────────────────────
export interface AppState {
    services: ServiceNode[];
    connections: Connection[];
    selectedNodeId: string | null;
    selectedEdgeId: string | null;
    pinnedEdgeIds: string[];
    animationsEnabled: boolean;
    showAddServiceModal: boolean;
    showAddConnectionModal: boolean;

    // Multi-diagram state
    savedDiagrams: SavedDiagram[];
    activeDiagramId: string | null;

    // Actions
    setSelectedNode: (id: string | null) => void;
    togglePinEdge: (id: string) => void;
    unpinAllEdges: () => void;
    setSelectedEdge: (id: string | null) => void;
    toggleAnimations: () => void;
    addService: (service: ServiceNode) => void;
    updateService: (id: string, updates: Partial<ServiceNode>) => void;
    removeService: (id: string) => void;
    addConnection: (connection: Connection) => void;
    removeConnection: (id: string) => void;
    addDashboard: (connectionId: string, dashboard: Dashboard) => void;
    updateDashboard: (connectionId: string, dashboardId: string, updates: Partial<Dashboard>) => void;
    removeDashboard: (connectionId: string, dashboardId: string) => void;
    setShowAddServiceModal: (show: boolean) => void;
    setShowAddConnectionModal: (show: boolean) => void;
    resetToDefaults: () => void;
    exportConfig: () => GraphConfig;
    importConfig: (config: GraphConfig) => void;

    // Diagram management actions
    refreshDiagramList: () => Promise<void>;
    saveDiagram: (name: string, nodePositions: Record<string, { x: number; y: number }>, edgeOffsets: Record<string, { x: number; y: number }>) => Promise<void>;
    loadDiagram: (id: string) => Promise<void>;
    deleteDiagram: (id: string) => Promise<void>;
    renameDiagram: (id: string, name: string) => Promise<void>;
}
