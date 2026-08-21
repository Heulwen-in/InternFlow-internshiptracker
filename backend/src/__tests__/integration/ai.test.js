jest.mock("../../services/aiService", () => ({
  parseJobDescription: jest.fn(),
}));

const request = require("supertest");
const app = require("../../app");
const { parseJobDescription } = require("../../services/aiService");
const { cleanDb, disconnect } = require("../helpers/db");
const { makeVerifiedUser, makeToken } = require("../helpers/auth");

let token;

beforeEach(async () => {
  await cleanDb();
  const user = await makeVerifiedUser({ email: "ai-parser@example.com" });
  token = makeToken(user);
  parseJobDescription.mockReset();
});

afterAll(() => disconnect());

test("requires authentication", async () => {
  const response = await request(app)
    .post("/api/ai/parse-job")
    .send({ description: "Software engineering internship" });

  expect(response.status).toBe(401);
  expect(parseJobDescription).not.toHaveBeenCalled();
});

test("rejects an empty description", async () => {
  const response = await request(app)
    .post("/api/ai/parse-job")
    .set("Authorization", `Bearer ${token}`)
    .send({ description: "   " });

  expect(response.status).toBe(400);
  expect(response.body.error).toBe("Job description is required");
  expect(parseJobDescription).not.toHaveBeenCalled();
});

test("returns normalized parser suggestions", async () => {
  const parsed = {
    company: "Acme",
    roleTitle: "Software Engineer Intern",
    industry: null,
    location: "Remote",
    workType: "Remote",
    deadline: null,
  };
  parseJobDescription.mockResolvedValue(parsed);

  const response = await request(app)
    .post("/api/ai/parse-job")
    .set("Authorization", `Bearer ${token}`)
    .send({ description: "Acme is hiring a software engineering intern." });

  expect(response.status).toBe(200);
  expect(response.body).toEqual({ parsed });
  expect(parseJobDescription).toHaveBeenCalledWith(
    "Acme is hiring a software engineering intern."
  );
});

test("returns stable service errors", async () => {
  const error = new Error("Unable to reach Ollama");
  error.status = 503;
  parseJobDescription.mockRejectedValue(error);

  const response = await request(app)
    .post("/api/ai/parse-job")
    .set("Authorization", `Bearer ${token}`)
    .send({ description: "A valid job description" });

  expect(response.status).toBe(503);
  expect(response.body.error).toBe("Unable to reach Ollama");
});
