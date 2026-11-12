import { api } from "./api";
async function logAudit(level, message, userName, action) {
  try {
    await api("/api/admin/logs", {
      method: "POST",
      body: { level, message, user_name: userName, action }
    });
  } catch (err) {
    console.error("[audit] write failed:", err);
  }
}
export {
  logAudit
};
