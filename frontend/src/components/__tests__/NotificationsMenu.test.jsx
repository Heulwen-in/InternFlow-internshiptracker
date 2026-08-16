import { act, cleanup, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import NotificationsMenu from "../NotificationsMenu";
import { FeedbackProvider } from "../../context/FeedbackProvider";
import { UIContext } from "../../context/UIContext";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../api/reminderApi";

vi.mock("../../api/reminderApi", () => ({
  getNotifications: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  markNotificationRead: vi.fn(),
}));

function renderMenu() {
  return render(
    <MemoryRouter>
      <FeedbackProvider>
        <UIContext.Provider
          value={{
            refreshKey: 0,
            openApp: vi.fn(),
          }}
        >
          <NotificationsMenu />
        </UIContext.Provider>
      </FeedbackProvider>
    </MemoryRouter>
  );
}

async function flushTimers(ms = 0) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
    await Promise.resolve();
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  getNotifications.mockResolvedValue({
    data: { notifications: [], unreadCount: 0 },
  });
  markAllNotificationsRead.mockResolvedValue({});
  markNotificationRead.mockResolvedValue({});
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("NotificationsMenu refresh", () => {
  test("polls while mounted and stops after cleanup", async () => {
    const view = renderMenu();
    await flushTimers();
    expect(getNotifications).toHaveBeenCalledTimes(1);

    await flushTimers(60_000);
    expect(getNotifications).toHaveBeenCalledTimes(2);

    view.unmount();
    await flushTimers(60_000);
    expect(getNotifications).toHaveBeenCalledTimes(2);
  });

  test("refreshes on focus when the data is stale", async () => {
    renderMenu();
    await flushTimers();

    await flushTimers(16_000);
    await act(async () => {
      window.dispatchEvent(new Event("focus"));
      await Promise.resolve();
    });

    expect(getNotifications).toHaveBeenCalledTimes(2);
  });
});
