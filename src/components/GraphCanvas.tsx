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

    // ─── Position tracking via ref (survives re-renders without triggering them) ───
    const positionsRef = useRef<Record<string, { x: number; y: number }>>({});

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

    // ─── Derive nodes purely from store + position ref (no side effects) ───
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
        [services, selectedNodeId, getPosition]
    );

    // ─── Derive edges purely from store (no side effects) ───
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

    // ─── We need React Flow to actually move nodes, so use applyNodeChanges ───
    // Use a state-based approach but only for position tracking
    const [rfNodes, setRfNodes] = useState<Node[]>(nodes);
    const [rfEdges, setRfEdges] = useState<Edge[]>(edges);

    // Sync derived data → local RF state (only when store data changes)
    useEffect(() => {
        setRfNodes(nodes);
    }, [nodes]);

    useEffect(() => {
        setRfEdges(edges);
    }, [edges]);

    const handleNodesChange = useCallback(
        (changes: NodeChange[]) => {
            // Update positions ref
            for (const change of changes) {
                if (change.type === 'position' && change.position) {
                    positionsRef.current[change.id] = change.position;
                }
            }
            setRfNodes((nds) => applyNodeChanges(changes, nds));
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
