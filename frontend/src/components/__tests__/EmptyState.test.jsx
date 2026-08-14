import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EmptyState from "../EmptyState";

describe("EmptyState", () => {
  it("renders title and hint copy", () => {
    render(<EmptyState title="Nothing here" hint="Add your first item." />);

    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.getByText("Add your first item.")).toBeInTheDocument();
  });
});
