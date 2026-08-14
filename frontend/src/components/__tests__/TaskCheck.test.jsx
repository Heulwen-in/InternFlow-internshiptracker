import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TaskCheck from "../TaskCheck";

describe("TaskCheck", () => {
  it("calls onChange and exposes the correct label", () => {
    const onChange = vi.fn();
    render(<TaskCheck checked={false} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Mark complete" }));

    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
