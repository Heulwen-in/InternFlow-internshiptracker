import api from "./axios";

export const exportData = () => api.get("/data/export");
export const exportApplicationsCsv = () =>
  api.get("/data/export/applications.csv", { responseType: "text" });
export const importData = (data) => api.post("/data/import", data);
