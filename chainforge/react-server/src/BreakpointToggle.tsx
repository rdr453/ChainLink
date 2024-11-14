import React, { useState } from "react";

const BreakpointToggle: React.FC<{ onToggle: (state: boolean) => void }> = ({
  onToggle,
}) => {
  const [isActive, setIsActive] = useState(false);

  const handleToggle = () => {
    setIsActive(!isActive);
    onToggle(!isActive);
  };

  return (
    <button
      onClick={handleToggle}
      style={{ backgroundColor: isActive ? "red" : "gray" }}
    >
      {isActive ? "Breakpoint Active" : "Set Breakpoint"}
    </button>
  );
};

export default BreakpointToggle;
