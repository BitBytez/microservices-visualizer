import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
    type Connection as RFConnection,
    type Node,
    type Edge,
    BackgroundVariant,
    type NodeChange,
    type EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import ServiceNodeComponent from './nodes/ServiceNode';
import DependencyEdgeComponent from './edges/DependencyEdge';
import { useAppStore } from '../store/store';
import type { Connection } from '../types';

const nodeTypes = { serviceNode: ServiceNodeComponent };
const edgeTypes = { dependencyEdge: DependencyEdgeComponent };

// ─── Global accessors for positions (used by toolbar when saving) ───
let _getNodePositions: () => Record<string, { x: number; y: number }> = () => ({});
let _getEdgeOffsets: () => Record<string, { x: number; y: number }> = () => ({});

export function getNodePositions() {
    return _getNodePositions();
}
export function getEdgeOffsets() {
    return _getEdgeOffsets();
}

// ─── Shared edge offset state (written by DependencyEdge, read by toolbar) ───
const _edgeOffsetsMap: Record<string, { x: number; y: number }> = {};
export function setEdgeOffset(edgeId: string, offset: { x: number; y: number }) {
    _edgeOffsetsMap[edgeId] = offset;
}
export function getEdgeOffsetsMap() {
    return { ..._edgeOffsetsMap };
}
export function clearEdgeOffsetsMap() {
    for (const key of Object.keys(_edgeOffsetsMap)) {
        delete _edgeOffsetsMap[key];
    }
}
export function seedEdgeOffsetsMap(offsets: Record<string, { x: number; y: number }>) {
    clearEdgeOffsetsMap();
    Object.assign(_edgeOffsetsMap, offsets);
}

// Layout helpers
function getNodePosition(index: number, total: number) {
    const cols = Math.ceil(Math.sqrt(total));
    const row = Math.floor(index / cols);
    const col = index % cols;
    const spacing = 250;
    return {
        x: col * spacing + (row % 2 === 1 ? spacing / 2 : 0),
        y: row * spacing,
    };
}

export default function GraphCanvas() {
    const services = useAppStore((s) => s.services);
    const connections = useAppStore((s) => s.connections);
    const selectedNodeId = useAppStore((s) => s.selectedNodeId);
    const selectedEdgeId = useAppStore((s) => s.selectedEdgeId);
    const pinnedEdgeIds = useAppStore((s) => s.pinnedEdgeIds);
    const animationsEnabled = useAppStore((s) => s.animationsEnabled);
    const setSelectedNode = useAppStore((s) => s.setSelectedNode);
    const setSelectedEdge = useAppStore((s) => s.setSelectedEdge);
    const addConnection = useAppStore((s) => s.addConnection);
    const setShowAddServiceModal = useAppStore((s) => s.setShowAddServiceModal);
    const activeDiagramId = useAppStore((s) => s.activeDiagramId);

    // ─── Position tracking via ref ───
    const positionsRef = useRef<Record<string, { x: number; y: number }>>({});
    // Version counter to force nodes memo to re-derive after async position loads
    const [positionVersion, setPositionVersion] = useState(0);
    // Ref to rfNodes state so we can read actual rendered positions for saving
    const rfNodesRef = useRef<Node[]>([]);

    // Expose positions globally for toolbar save — read from actual React Flow nodes
    useEffect(() => {
        _getNodePositions = () => {
            const positions: Record<string, { x: number; y: number }> = {};
            for (const node of rfNodesRef.current) {
                positions[node.id] = { x: node.position.x, y: node.position.y };
            }
            return positions;
        };
        _getEdgeOffsets = getEdgeOffsetsMap;
        return () => {
            _getNodePositions = () => ({});
            _getEdgeOffsets = () => ({});
        };
    }, []);

    // Seed positions when active diagram changes — load directly from IndexedDB
    // to avoid the race condition where savedDiagrams hasn't been populated yet
    useEffect(() => {
        if (activeDiagramId) {
            import('../storage/diagramStorage').then(({ getDiagram }) => {
                getDiagram(activeDiagramId).then((diagram) => {
                    if (diagram) {
                        positionsRef.current = { ...diagram.nodePositions };
                        seedEdgeOffsetsMap(diagram.edgeOffsets);
                        setPositionVersion((v) => v + 1); // force re-render
                    }
                });
            });
        } else {
            // New/default diagram — reset to auto-layout
            positionsRef.current = {};
            clearEdgeOffsetsMap();
            setPositionVersion((v) => v + 1);
        }
    }, [activeDiagramId]);

    // Initialize positions for new nodes
    const getPosition = useCallback(
        (id: string, index: number, total: number) => {
            if (positionsRef.current[id]) return positionsRef.current[id];
            const pos = getNodePosition(index, total);
            positionsRef.current[id] = pos;
            return pos;
        },
        []
    );

    // ─── Derive nodes from store + position ref (positionVersion forces re-derive) ───
    const nodes: Node[] = useMemo(
        () =>
            services.map((s, i) => ({
                id: s.id,
                type: 'serviceNode' as const,
                position: getPosition(s.id, i, services.length),
                data: {
                    label: s.name,
                    serviceType: s.type,
                    color: s.color,
                    description: s.description,
                    isSelected: s.id === selectedNodeId,
                },
            })),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [services, selectedNodeId, getPosition, positionVersion]
    );

    // ─── Derive edges purely from store ───
    const edges: Edge[] = useMemo(
        () =>
            connections.map((c) => ({
                id: c.id,
                source: c.source,
                target: c.target,
                type: 'dependencyEdge' as const,
                data: {
                    dashboardCount: c.dashboards.length,
                    dashboards: c.dashboards,
                    label: c.label,
                    isSelected: c.id === selectedEdgeId,
                    isPinned: pinnedEdgeIds.includes(c.id),
                    connectionId: c.id,
                    animationsEnabled,
                },
            })),
        [connections, selectedEdgeId, pinnedEdgeIds, animationsEnabled]
    );

    const [rfNodes, setRfNodes] = useState<Node[]>(nodes);
    const [rfEdges, setRfEdges] = useState<Edge[]>(edges);

    // Keep rfNodesRef in sync for the global position getter
    useEffect(() => {
        rfNodesRef.current = rfNodes;
    }, [rfNodes]);

    useEffect(() => {
        setRfNodes(nodes);
    }, [nodes]);

    useEffect(() => {
        setRfEdges(edges);
    }, [edges]);

    const handleNodesChange = useCallback(
        (changes: NodeChange[]) => {
            for (const change of changes) {
                if (change.type === 'position' && change.position) {
                    positionsRef.current[change.id] = change.position;
                }
            }
            setRfNodes((nds) => {
                const updated = applyNodeChanges(changes, nds);
                rfNodesRef.current = updated; // sync immediately for save
                return updated;
            });
        },
        []
    );

    const handleEdgesChange = useCallback(
        (changes: EdgeChange[]) => {
            setRfEdges((eds) => applyEdgeChanges(changes, eds));
        },
        []
    );

    const onConnect = useCallback(
        (params: RFConnection) => {
            const newConn: Connection = {
                id: `conn-${Date.now()}`,
                source: params.source,
                target: params.target,
                dashboards: [],
            };
            addConnection(newConn);
            setRfEdges((eds) =>
                addEdge(
                    { ...params, type: 'dependencyEdge', id: newConn.id, data: { dashboardCount: 0 } },
                    eds
                )
            );
        },
        [addConnection]
    );

    const onNodeClick = useCallback(
        (_: React.MouseEvent, node: Node) => {
            setSelectedNode(node.id);
        },
        [setSelectedNode]
    );

    const onEdgeClick = useCallback(
        (_: React.MouseEvent, edge: Edge) => {
            setSelectedEdge(edge.id);
        },
        [setSelectedEdge]
    );

    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
        setSelectedEdge(null);
    }, [setSelectedNode, setSelectedEdge]);

    const onDoubleClick = useCallback(() => {
        setShowAddServiceModal(true);
    }, [setShowAddServiceModal]);

    return (
        <div className="w-full h-full">
            <ReactFlow
                nodes={rfNodes}
                edges={rfEdges}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onEdgeClick={onEdgeClick}
                onPaneClick={onPaneClick}
                onDoubleClick={onDoubleClick}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.1}
                maxZoom={2}
                defaultEdgeOptions={{
                    type: 'dependencyEdge',
                }}
                proOptions={{ hideAttribution: true }}
                className={`bg-surface-950${animationsEnabled ? '' : ' no-animate'}`}
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={24}
                    size={1}
                    color="#1e293b"
                />
                <Controls
                    className="!bg-surface-800 !border-surface-600 !rounded-xl !shadow-xl [&>button]:!bg-surface-700 [&>button]:!border-surface-600 [&>button]:!text-surface-300 [&>button:hover]:!bg-surface-600"
                />
                <MiniMap
                    nodeColor={(node) => {
                        const data = node.data as { color?: string };
                        return data?.color ?? '#64748b';
                    }}
                    className="!bg-surface-800/80 !border-surface-600 !rounded-xl"
                    maskColor="rgba(15, 23, 42, 0.7)"
                />
            </ReactFlow>
        </div>
    );
}
