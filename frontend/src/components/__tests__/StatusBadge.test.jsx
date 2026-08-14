import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StatusBadge from "../StatusBadge";

describe("StatusBadge", () => {
  it("renders the friendly label for online assessment", () => {
    render(<StatusBadge status="Online Assessment" />);

    expect(screen.getByText("Assessment")).toBeInTheDocument();
  });
});
