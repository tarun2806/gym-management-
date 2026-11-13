import { auth } from "./firebase";
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8090";
class ApiError extends Error {
  status;
  constructor(status, message) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
async function token() {
  const user = auth.currentUser;
  return user ? user.getIdToken() : null;
}
function tenantHeaders(scope) {
  const headers = {};
  let orgId = scope?.orgId;
  if (!orgId && auth.currentUser) {
    try {
      orgId = window.localStorage.getItem(`gympro:org:${auth.currentUser.uid}`);
    } catch {
    }
  }
  if (orgId) headers["X-Org-Id"] = orgId;
  const branchId = scope?.branchId ?? void 0;
  if (branchId) headers["X-Branch-Id"] = branchId;
  return headers;
}
async function api(path, options = {}) {
  const { method = "GET", body, scope } = options;
  const headers = { "Content-Type": "application/json" };
  const t = await token();
  if (t) headers["Authorization"] = `Bearer ${t}`;
  Object.assign(headers, tenantHeaders(scope));
  const payload = body === undefined
    ? undefined
    : typeof body === "string" ? body : JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: payload,
    signal: options.signal ?? AbortSignal.timeout(20000)
  });
  if (!res.ok) {
    let message = `API ${res.status}`;
    try {
      const err = await res.json();
      if (err?.message) message = err.message;
    } catch {
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return void 0;
  return res.json();
}
export {
  ApiError,
  api
};
