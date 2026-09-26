'use client';

import React, { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  NodeTypes,
  EdgeTypes,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';

import { ClauseNode } from './ClauseNode';
import { ConflictEdge } from './ConflictEdge';
import { RiskNode, RiskEdge, ClauseNodeData } from '@/types/graph';

const nodeTypes: NodeTypes = {
  clauseNode: ClauseNode,
};

const edgeTypes: EdgeTypes = {
  conflict: ConflictEdge,
};

interface RiskDNAGraphInnerProps {
  nodes: RiskNode[];
  edges: RiskEdge[];
  onNodeClick?: (data: ClauseNodeData) => void;
  direction?: 'TB' | 'LR';
}

function getLayoutedElements(
  nodes: RiskNode[],
  edges: RiskEdge[],
  direction: 'TB' | 'LR' = 'TB'
) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 70 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 210, height: 90 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 105,
        y: nodeWithPosition.y - 45,
      },
    };
  });

  return { layoutedNodes, layoutedEdges: edges };
}

export default function RiskDNAGraphInner({
  nodes,
  edges,
  onNodeClick,
  direction = 'TB',
}: RiskDNAGraphInnerProps) {
  const { layoutedNodes, layoutedEdges } = useMemo(
    () => getLayoutedElements(nodes, edges, direction),
    [nodes, edges, direction]
  );

  return (
    <div className="w-full h-[550px] bg-slate-50 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
      <ReactFlow
        nodes={layoutedNodes as Node[]}
        edges={layoutedEdges as Edge[]}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        panOnDrag
        zoomOnScroll
        onNodeClick={(_, node) => {
          if (onNodeClick && node.data) {
            onNodeClick(node.data as ClauseNodeData);
          }
        }}
      >
        <Background color="#cbd5e1" gap={16} />
        <Controls />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="!bg-white !border-slate-200"
        />
      </ReactFlow>
    </div>
  );
}
