import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import AppFormModal from "../AppFormModal";
import { FeedbackProvider } from "../../context/FeedbackProvider";
import { parseJobDescription } from "../../api/aiApi";
import { getCompanies } from "../../api/companyApi";

vi.mock("../../api/aiApi", () => ({
  parseJobDescription: vi.fn(),
}));

vi.mock("../../api/applicationApi", () => ({
  createApplication: vi.fn(),
  getApplication: vi.fn(),
  updateApplication: vi.fn(),
}));

vi.mock("../../api/companyApi", () => ({
  createCompany: vi.fn(),
  getCompanies: vi.fn(),
  updateCompany: vi.fn(),
}));

function renderModal() {
  return render(
    <FeedbackProvider>
      <AppFormModal
        mode="new"
        onClose={vi.fn()}
        refresh={vi.fn()}
        openApp={vi.fn()}
      />
    </FeedbackProvider>
  );
}

async function openParser() {
  await screen.findByPlaceholderText("Acme Corp");
  fireEvent.click(
    screen.getByRole("button", { name: /Parse job description/i })
  );
  return screen.getByRole("textbox", { name: "Job description" });
}

beforeEach(() => {
  getCompanies.mockResolvedValue({ data: { companies: [] } });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AppFormModal job parser", () => {
  test("reviews suggestions and applies them without replacing existing text", async () => {
    parseJobDescription.mockResolvedValue({
      data: {
        parsed: {
          company: "Parsed Company",
          roleTitle: "Software Engineer Intern",
          industry: "Technology",
          location: "Singapore",
          workType: "Hybrid",
          deadline: "2026-09-30",
        },
      },
    });
    renderModal();

    const companyInput = await screen.findByPlaceholderText("Acme Corp");
    fireEvent.change(companyInput, { target: { value: "Existing Company" } });
    const description = await openParser();
    fireEvent.change(description, {
      target: { value: "Parsed Company is hiring an engineering intern." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Parse description" }));

    expect(await screen.findByText("Parsed suggestions")).toBeInTheDocument();
    expect(screen.getByText("Software Engineer Intern")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Apply suggestions" }));

    expect(companyInput).toHaveValue("Existing Company");
    expect(screen.getByPlaceholderText("Software Engineer Intern")).toHaveValue(
      "Software Engineer Intern"
    );
    expect(screen.getByPlaceholderText("Fintech")).toHaveValue("Technology");
    expect(screen.getByPlaceholderText("New York, NY")).toHaveValue("Singapore");
    expect(screen.getByDisplayValue("Hybrid")).toBeInTheDocument();
    expect(document.querySelector('input[type="date"][value="2026-09-30"]')).not.toBeNull();
  });

  test("shows progress and a retryable Ollama error", async () => {
    let rejectRequest;
    parseJobDescription.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectRequest = reject;
        })
    );
    renderModal();

    const description = await openParser();
    fireEvent.change(description, {
      target: { value: "A complete pasted job description" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Parse description" }));

    expect(screen.getByText("Ollama is reading the job…")).toBeInTheDocument();
    rejectRequest({
      response: { data: { message: "Ollama is not running" } },
    });

    await waitFor(() => {
      expect(
        screen.getByText("Couldn’t parse this description")
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Ollama is not running")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Retry/i })).toBeInTheDocument();
  });
});
