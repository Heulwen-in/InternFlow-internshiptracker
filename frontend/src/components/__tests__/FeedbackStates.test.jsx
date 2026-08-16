import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import ErrorState from "../ErrorState";
import LoadingState from "../LoadingState";

describe("feedback states", () => {
  test("exposes loading text as a status", () => {
    render(<LoadingState label="Loading applications…" />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading applications…");
  });

  test("renders an error and invokes retry", () => {
    const retry = vi.fn();
    render(<ErrorState message="Network unavailable" onRetry={retry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Network unavailable");
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
