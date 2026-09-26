import React from 'react';
import { RiskNode, RiskEdge } from '@/types/graph';

interface GraphAccessibilityTableProps {
  nodes: RiskNode[];
  edges: RiskEdge[];
}

export function GraphAccessibilityTable({ nodes, edges }: GraphAccessibilityTableProps) {
  return (
    <div className="space-y-4 bg-white p-4 border border-slate-200 rounded-xl">
      <h4 className="text-sm font-bold text-slate-800">
        Accessible Graph Data View (Screen Reader Friendly)
      </h4>

      <div>
        <h5 className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
          Clauses ({nodes.length})
        </h5>
        <div className="overflow-x-auto">
          <table aria-label="Risk DNA Graph Data" className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                <th className="p-2 font-bold">Clause Title</th>
                <th className="p-2 font-bold">Risk Level</th>
                <th className="p-2 font-bold">Assessment Reason</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((node) => (
                <tr key={node.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-2 font-semibold text-slate-800">{node.data.title}</td>
                  <td className="p-2 capitalize font-bold">{node.data.riskLevel}</td>
                  <td className="p-2 text-slate-600">{node.data.riskReason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {edges.length > 0 && (
        <div>
          <h5 className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
            Clause Relationships & Conflicts ({edges.length})
          </h5>
          <ul className="text-xs space-y-1 list-disc pl-4 text-slate-700">
            {edges.map((edge) => (
              <li key={edge.id}>
                <strong>{edge.source}</strong> connects to <strong>{edge.target}</strong> (
                {edge.type === 'conflict' ? 'Conflict' : edge.label || 'Related'})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
