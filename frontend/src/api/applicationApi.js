import api from "./axios";

export const getApplications = () => api.get("/applications");
export const getApplication = (id) => api.get(`/applications/${id}`);
export const createApplication = (data) => api.post("/applications", data);
export const updateApplication = (id, data) => api.put(`/applications/${id}`, data);
export const updateApplicationStatus = (id, status) =>
  api.put(`/applications/${id}`, { status });
export const deleteApplication = (id) => api.delete(`/applications/${id}`);
