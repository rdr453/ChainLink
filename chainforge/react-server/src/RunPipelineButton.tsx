import React from "react";

const RunPipelineButton: React.FC<{ onRun: () => void }> = ({ onRun }) => {
  return <button onClick={onRun}>Run Pipeline</button>;
};

export default RunPipelineButton;
