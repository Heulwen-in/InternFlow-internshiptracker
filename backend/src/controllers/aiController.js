const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");
const { parseJobDescription } = require("../services/aiService");

const MAX_DESCRIPTION_LENGTH = 30000;

const parseJob = asyncHandler(async (req, res) => {
  const description =
    typeof req.body.description === "string" ? req.body.description.trim() : "";

  if (!description) {
    throw new HttpError(400, "Job description is required");
  }
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    throw new HttpError(
      400,
      `Job description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer`
    );
  }

  const parsed = await parseJobDescription(description);
  res.json({ parsed });
});

module.exports = { parseJob, MAX_DESCRIPTION_LENGTH };
