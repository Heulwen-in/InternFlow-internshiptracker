const env = require("../../config/env");
const {
  AiServiceError,
  parseJobDescription,
} = require("../../services/aiService");

const originalFetch = global.fetch;
const originalTimeout = env.ollama.timeoutMs;

function ollamaResponse(content) {
  return {
    ok: true,
    json: jest.fn().mockResolvedValue({
      message: { content: JSON.stringify(content) },
    }),
  };
}

afterEach(() => {
  global.fetch = originalFetch;
  env.ollama.timeoutMs = originalTimeout;
  jest.useRealTimers();
});

test("returns normalized application fields from Ollama", async () => {
  global.fetch = jest.fn().mockResolvedValue(
    ollamaResponse({
      company: " Acme ",
      roleTitle: "Software Engineer Intern",
      industry: "Technology",
      location: "New York",
      workType: "onsite",
      deadline: "2026-09-30",
    })
  );

  await expect(parseJobDescription("A full job description")).resolves.toEqual({
    company: "Acme",
    roleTitle: "Software Engineer Intern",
    industry: "Technology",
    location: "New York",
    workType: "On-site",
    deadline: "2026-09-30",
  });
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining("/api/chat"),
    expect.objectContaining({ method: "POST" })
  );
});

test("rejects malformed model JSON", async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue({
      message: { content: "not json" },
    }),
  });

  await expect(parseJobDescription("Description")).rejects.toMatchObject({
    status: 502,
    message: "Ollama returned malformed JSON",
  });
});

test("reports an Ollama connection failure", async () => {
  global.fetch = jest.fn().mockRejectedValue(new TypeError("fetch failed"));

  await expect(parseJobDescription("Description")).rejects.toEqual(
    expect.objectContaining({
      status: 503,
      message: expect.stringContaining("Unable to reach Ollama"),
    })
  );
});

test("aborts a slow Ollama request", async () => {
  jest.useFakeTimers();
  env.ollama.timeoutMs = 20;
  global.fetch = jest.fn((_url, options) => {
    return new Promise((_resolve, reject) => {
      options.signal.addEventListener("abort", () => {
        const error = new Error("aborted");
        error.name = "AbortError";
        reject(error);
      });
    });
  });

  const pending = parseJobDescription("Description");
  const expectation = expect(pending).rejects.toEqual(
    expect.objectContaining({
      status: 504,
      message: "Ollama took too long to respond",
    })
  );
  await jest.advanceTimersByTimeAsync(20);

  await expectation;
  expect(AiServiceError).toBeDefined();
});
