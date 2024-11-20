import React from "react";
import { Handle, Position } from "reactflow";
import BaseNode from "./BaseNode";
import NodeLabel from "./NodeLabelComponent";

interface BreakpointNodeProps {
  id: string;
}

const BreakpointNode: React.FC<BreakpointNodeProps> = ({ id }) => {
  return (
    <BaseNode classNames="breakpoint-node" nodeId={id}>
      <NodeLabel title="Breakpoint" nodeId={id} icon="⏸️" />
      <Handle type="target" position={Position.Left} id="input" />
      <Handle type="source" position={Position.Right} id="output" />
    </BaseNode>
  );
};

export default BreakpointNode;
