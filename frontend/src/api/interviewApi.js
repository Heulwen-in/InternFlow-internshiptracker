import api from "./axios";

export const getInterviews = () => api.get("/interviews");

export const getApplicationInterviews = (applicationId) =>
  api.get(`/applications/${applicationId}/interviews`);

export const createInterview = (applicationId, data) =>
  api.post(`/applications/${applicationId}/interviews`, data);

export const deleteInterview = (id) => api.delete(`/interviews/${id}`);
