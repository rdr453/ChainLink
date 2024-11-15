import React from "react";
import { render, fireEvent } from "@testing-library/react";
import PipelineControl from "../PipelineControl";

it("should set and remove breakpoints", () => {
  const { getByText } = render(<PipelineControl />);
  const button = getByText("Set Breakpoint");

  // Set breakpoint
  fireEvent.click(button);
  expect(button).toHaveTextContent("Breakpoint Active");

  // Remove breakpoint
  fireEvent.click(button);
  expect(button).toHaveTextContent("Set Breakpoint");
});
