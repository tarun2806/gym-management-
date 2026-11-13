import { api } from "../api";
import { cached, invalidate } from "../cache";
const LIST_TTL_MS = 6e4;
const scopeKey = (prefix, scope) => `${prefix}:${scope?.orgId ?? "all"}:${scope?.branchId ?? "all"}`;
const invalidateAll = (prefix) => invalidate(`${prefix}:`);
const asEntity = (row) => ({ id: String(row.id), ...row });
const toScope = (scope) => scope ? { orgId: scope.orgId ?? void 0, branchId: scope.branchId ?? void 0 } : void 0;
const memberService = {
  list: (scope) => cached(scopeKey("members", scope), LIST_TTL_MS, async () => {
    const rows = await api("/api/members", { scope: toScope(scope) });
    return rows.map(asEntity);
  }),
  listActive: (scope) => cached(scopeKey("members:active", scope), LIST_TTL_MS, async () => {
    const rows = await api("/api/members/active", { scope: toScope(scope) });
    return rows.map(asEntity);
  }),
  count: async (scope) => {
    const rows = await api("/api/members", { scope: toScope(scope) });
    return rows.length;
  },
  create: async (scope, data) => {
    const row = await api("/api/members", {
      method: "POST",
      scope: toScope(scope),
      body: {
        join_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        ...data
      }
    });
    invalidateAll("members");
    return String(row.id);
  },
  update: async (id, data) => {
    await api(`/api/members/${id}`, { method: "PUT", body: data });
    invalidateAll("members");
  },
  remove: async (id) => {
    await api(`/api/members/${id}`, { method: "DELETE" });
    invalidateAll("members");
  }
};
const trainerService = {
  list: (scope) => cached(scopeKey("trainers", scope), LIST_TTL_MS, async () => {
    const rows = await api("/api/trainers", { scope: toScope(scope) });
    return rows.map(asEntity);
  }),
  create: async (scope, data) => {
    const row = await api("/api/trainers", {
      method: "POST",
      scope: toScope(scope),
      body: data
    });
    invalidateAll("trainers");
    return String(row.id);
  },
  update: async (id, data) => {
    await api(`/api/trainers/${id}`, { method: "PUT", body: data });
    invalidateAll("trainers");
  },
  remove: async (id) => {
    await api(`/api/trainers/${id}`, { method: "DELETE" });
    invalidateAll("trainers");
  }
};
const classService = {
  list: (scope) => cached(scopeKey("classes", scope), LIST_TTL_MS, async () => {
    const rows = await api("/api/classes", { scope: toScope(scope) });
    return rows.map(asEntity);
  }),
  create: async (scope, data) => {
    const row = await api("/api/classes", {
      method: "POST",
      scope: toScope(scope),
      body: { enrolled: 0, ...data }
    });
    invalidateAll("classes");
    return String(row.id);
  },
  update: async (id, data) => {
    await api(`/api/classes/${id}`, { method: "PUT", body: data });
    invalidateAll("classes");
  },
  remove: async (id) => {
    await api(`/api/classes/${id}`, { method: "DELETE" });
    invalidateAll("classes");
  }
};
const attendanceService = {
  /** Records checked in today, newest first. */
  listToday: async (scope) => {
    const rows = await api("/api/attendance", {
      scope: toScope(scope)
    });
    return rows.map(asEntity);
  },
  /** True when the member already has an open (not checked-out) session today. */
  hasOpenSessionToday: async (scope, memberId) => {
    const rows = await attendanceService.listToday(scope);
    return rows.some((r) => r.member_id === memberId && !r.check_out);
  },
  /** Check-in via the dedicated endpoint — server enforces the open-session rule. */
  create: async (scope, data) => {
    const row = await api("/api/attendance/check-in", {
      method: "POST",
      scope: toScope(scope),
      body: data
    });
    return String(row.id);
  },
  checkOut: (id, scope) => api(`/api/attendance/${id}/check-out`, { method: "POST", scope: toScope(scope) })
};
const PAYMENT_PAGE_SIZE = 50;
const paymentService = {
  list: async (scope, pageSize = PAYMENT_PAGE_SIZE) => {
    const rows = await api(
      `/api/payments?page=0&size=${pageSize}`,
      { scope: toScope(scope) }
    );
    return rows.map(asEntity);
  },
  /** Offset-paginated payments. Kept for signature compatibility. */
  listPage: async (scope, _lastDoc, pageSize = PAYMENT_PAGE_SIZE) => {
    const rows = await paymentService.list(scope, pageSize);
    return {
      rows,
      lastSnapshot: null,
      hasMore: rows.length === pageSize
    };
  },
  create: async (scope, data) => {
    const row = await api("/api/payments", {
      method: "POST",
      scope: toScope(scope),
      body: data
    });
    return String(row.id);
  }
};
const equipmentService = {
  list: (scope) => cached(scopeKey("equipment", scope), LIST_TTL_MS, async () => {
    const rows = await api("/api/equipment", { scope: toScope(scope) });
    return rows.map(asEntity);
  }),
  create: async (scope, data) => {
    const row = await api("/api/equipment", {
      method: "POST",
      scope: toScope(scope),
      body: data
    });
    invalidateAll("equipment");
    return String(row.id);
  },
  update: async (id, data) => {
    await api(`/api/equipment/${id}`, { method: "PUT", body: data });
    invalidateAll("equipment");
  },
  remove: async (id) => {
    await api(`/api/equipment/${id}`, { method: "DELETE" });
    invalidateAll("equipment");
  }
};
const memberInviteService = {
  list: (scope) => api("/api/member-invitations", { scope: toScope(scope) }),
  create: (scope, memberId) => api("/api/member-invitations", {
    method: "POST",
    scope: toScope(scope),
    body: { member_id: memberId }
  }),
  revoke: (scope, id) => api(`/api/member-invitations/${id}/revoke`, {
    method: "POST",
    scope: toScope(scope)
  })
};
const subscriptionService = {
  mine: () => api("/api/me/subscription"),
  plans: () => api("/api/subscription/plans"),
  checkout: (planId) => api("/api/subscription/checkout", { method: "POST", body: { plan_id: planId } }),
  verify: (payload) => api("/api/subscription/verify", { method: "POST", body: payload })
};

const platformService = {
  metrics: () => api("/api/platform/metrics"),
  organizations: () => api("/api/platform/organizations"),
  organization: (id) => api(`/api/platform/organizations/${id}`),
  suspendOrg: (id, reason) => api(`/api/platform/organizations/${id}/suspend`, { method: "POST", body: { reason } }),
  reactivateOrg: (id) => api(`/api/platform/organizations/${id}/reactivate`, { method: "POST" }),
  plans: () => api("/api/platform/subscription-plans"),
  createPlan: (data) => api("/api/platform/subscription-plans", { method: "POST", body: data }),
  updatePlan: (id, data) => api(`/api/platform/subscription-plans/${id}`, { method: "PUT", body: data }),
  activationKeys: () => api("/api/platform/activation-keys"),
  createActivationKey: (label) => api("/api/platform/activation-keys", { method: "POST", body: { label } }),
  revokeActivationKey: (id) => api(`/api/platform/activation-keys/${id}/revoke`, { method: "POST" })
};

const memberPortalService = {
  member: () => api("/api/me/member"),
  attendance: (page = 0, from, to) => {
    const params = new URLSearchParams({ page: String(page) });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return api(`/api/me/attendance?${params}`);
  },
  payments: (page = 0) => api(`/api/me/payments?page=${page}`),
  invoices: () => api("/api/me/invoices"),
  workoutPlans: () => api("/api/me/workout-plans"),
  dietPlans: () => api("/api/me/diet-plans"),
  classes: () => api("/api/me/classes"),
  classBookings: () => api("/api/me/class-bookings"),
  bookClass: (classId) => api(`/api/me/class-bookings/${classId}/book`, { method: "POST" }),
  cancelBooking: (bookingId) => api(`/api/me/class-bookings/${bookingId}/cancel`, { method: "POST" })
};
export {
  PAYMENT_PAGE_SIZE,
  attendanceService,
  classService,
  equipmentService,
  memberInviteService,
  memberPortalService,
  memberService,
  paymentService,
  platformService,
  subscriptionService,
  trainerService
};
