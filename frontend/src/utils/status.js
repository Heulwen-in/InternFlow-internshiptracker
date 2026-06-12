export const STATUSES = [
  "Saved",
  "Applied",
  "Online Assessment",
  "Interview",
  "Offer",
  "Rejected",
];

export const STATUS_HUES = {
  Saved: 75,
  Applied: 250,
  "Online Assessment": 305,
  Interview: 45,
  Offer: 155,
  Rejected: 22,
};

export const PRIORITIES = ["High", "Medium", "Low"];

export const WORK_TYPES = ["Remote", "Hybrid", "On-site"];

export const statusLabel = (status) =>
  status === "Online Assessment" ? "Assessment" : status;
