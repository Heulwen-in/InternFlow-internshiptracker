import api from "./axios";

export const parseJobDescription = (description) =>
  api.post("/ai/parse-job", { description });
