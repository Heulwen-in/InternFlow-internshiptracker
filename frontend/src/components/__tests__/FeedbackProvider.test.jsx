import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { FeedbackProvider } from "../../context/FeedbackProvider";
import { useFeedback } from "../../context/FeedbackContext";

function Trigger() {
  const feedback = useFeedback();
  return (
    <button onClick={() => feedback.success("Application saved")}>
      Show toast
    </button>
  );
}

function UndoTrigger({ onUndo }) {
  const feedback = useFeedback();
  return (
    <button
      onClick={() =>
        feedback.addToast({
          type: "info",
          title: "Note deleted",
          message: "The note will be deleted shortly.",
          action: { label: "Undo", onClick: onUndo },
        })
      }
    >
      Delete note
    </button>
  );
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("FeedbackProvider", () => {
  test("announces and automatically dismisses a toast", () => {
    vi.useFakeTimers();
    render(
      <FeedbackProvider>
        <Trigger />
      </FeedbackProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Show toast" }));
    expect(screen.getByRole("status")).toHaveTextContent("Application saved");

    act(() => vi.advanceTimersByTime(4500));
    expect(screen.queryByText("Application saved")).not.toBeInTheDocument();
  });

  test("allows a toast to be dismissed manually", () => {
    render(
      <FeedbackProvider>
        <Trigger />
      </FeedbackProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Show toast" }));
    fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(screen.queryByText("Application saved")).not.toBeInTheDocument();
  });

  test("runs an action and dismisses its toast", () => {
    const onUndo = vi.fn();
    render(
      <FeedbackProvider>
        <UndoTrigger onUndo={onUndo} />
      </FeedbackProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete note" }));
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));

    expect(onUndo).toHaveBeenCalledOnce();
    expect(screen.queryByText("Note deleted")).not.toBeInTheDocument();
  });
});
