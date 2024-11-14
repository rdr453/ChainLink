import React, { useState } from "react";
import RunPipelineButton from "./RunPipelineButton";
import BreakpointToggle from "./BreakpointToggle";

const PipelineControl: React.FC = () => {
  const [isBreakpointActive, setIsBreakpointActive] = useState(false);

  const handleRunPipeline = () => {
    // Logic to run the pipeline
    console.log("Running pipeline...");
    if (isBreakpointActive) {
      console.log("Pipeline will stop at breakpoint.");
    }
  };

  return (
    <div>
      <RunPipelineButton onRun={handleRunPipeline} />
      <BreakpointToggle onToggle={setIsBreakpointActive} />
    </div>
  );
};

export default PipelineControl;
