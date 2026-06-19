import api from "./axios";

export const updateProfile = (data) => api.patch("/auth/profile", data);

export const changePassword = (data) => api.patch("/auth/password", data);

export const getProfileStats = () => api.get("/auth/profile/stats");
