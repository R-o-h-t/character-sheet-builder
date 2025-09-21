import React from 'react';
import { NodeProps, Node } from '@xyflow/react';
import { NodeErrorBoundary } from '../error-boundary/error-boundary';

/**
 * Higher-order component that wraps a node component with an error boundary
 */
export function withNodeErrorBoundary<T extends Node = Node>(
  WrappedComponent: React.ComponentType<NodeProps<T>>,
  displayName?: string
) {
  const ComponentWithErrorBoundary = (props: NodeProps<T>) => {
    return (
      <NodeErrorBoundary
        nodeId={props.id}
        nodeType={displayName || WrappedComponent.displayName || WrappedComponent.name || 'Node'}
      >
        <WrappedComponent {...props} />
      </NodeErrorBoundary>
    );
  };

  ComponentWithErrorBoundary.displayName = `withNodeErrorBoundary(${displayName || WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return ComponentWithErrorBoundary;
}
