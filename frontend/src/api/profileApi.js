import api from "./axios";

export const updateProfile = (data) => api.patch("/auth/profile", data);

export const changePassword = (data) => api.patch("/auth/password", data);

export const getProfileStats = () => api.get("/auth/profile/stats");

export const getPreferences = () => api.get("/auth/preferences");

export const updatePreferences = (data) => api.patch("/auth/preferences", data);

export const deleteAccount = (password) =>
  api.delete("/auth/account", { data: { password } });
