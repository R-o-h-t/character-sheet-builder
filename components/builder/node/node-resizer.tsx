import { Handle, Position, NodeResizer } from '@xyflow/react';

export function Resizable({
  children,
  selected,
  options,
}: {
  children: React.ReactNode;
  selected: boolean;
  options?: {

    isResizable?: boolean;
  };
}) {
  return (
    <>
      <NodeResizer
        color="#ff0071"
        isVisible={selected && options?.isResizable !== false}
      />
      <Handle type="target" position={Position.Left} />
      <div className="w-full h-full">
        {children}
      </div>
      <Handle type="source" position={Position.Right} />
    </>
  );
};


export function resizable(
  children: React.ReactNode,
  selected: boolean,
  options?: { isResizable?: boolean }
) {
  return (
    <Resizable selected={selected} options={options}>
      {children}
    </Resizable>
  );
}
