export function getApiErrorMessage(error, fallback = "Something went wrong") {
  const payload = error?.response?.data;
  const serverMessage =
    typeof payload === "string" ? payload : payload?.message || payload?.error;

  if (serverMessage) return serverMessage;
  if (error?.code === "ERR_NETWORK" || !error?.response) {
    return "Unable to reach InternFlow. Check your connection and try again.";
  }
  return error?.message || fallback;
}
