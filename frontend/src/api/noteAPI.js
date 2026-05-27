import api from "./axios";

export const getNotes = (applicationId) =>
  api.get(`/applications/${applicationId}/notes`);

export const createNote = (applicationId, data) =>
  api.post(`/applications/${applicationId}/notes`, data);

export const deleteNote = (id) => api.delete(`/notes/${id}`);