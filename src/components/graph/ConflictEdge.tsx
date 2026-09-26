'use client';

import React from 'react';
import { BaseEdge, EdgeProps, getBezierPath } from 'reactflow';
import { CONFLICT_EDGE_COLOR } from '@/lib/utils/colorUtils';

export function ConflictEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd } = props;

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <BaseEdge
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        ...style,
        stroke: CONFLICT_EDGE_COLOR,
        strokeWidth: 2.5,
        strokeDasharray: '5,5',
      }}
    />
  );
}
