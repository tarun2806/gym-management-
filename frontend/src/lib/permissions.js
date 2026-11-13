const ALL = [
  "dashboard",
  "members.view",
  "members.create",
  "trainers.view",
  "trainers.create",
  "attendance",
  "classes",
  "workouts",
  "diet",
  "equipment.view",
  "equipment.manage",
  "plans",
  "payments",
  "reports",
  "settings.gym",
  "admin",
  "organizations.view",
  "organizations.create",
  "organizations.manage",
  "branches.view",
  "branches.create",
  "branches.manage"
];
const OPERATIONAL = [
  "dashboard",
  "members.view",
  "members.create",
  "trainers.view",
  "attendance",
  "classes",
  "equipment.view"
];
const ROLE_CAPABILITIES = {
  // Platform Admin: platform-level administration
  platform_admin: ALL,
  // Organization Owner: full access to their organization
  org_owner: [
    "dashboard",
    "members.view",
    "members.create",
    "trainers.view",
    "trainers.create",
    "attendance",
    "classes",
    "workouts",
    "diet",
    "equipment.view",
    "equipment.manage",
    "plans",
    "payments",
    "reports",
    "settings.gym",
    "organizations.view",
    "organizations.manage",
    "branches.view",
    "branches.create",
    "branches.manage"
  ],
  // Organization Admin: authorized organization-level operations
  org_admin: [
    "dashboard",
    "members.view",
    "members.create",
    "trainers.view",
    "trainers.create",
    "attendance",
    "classes",
    "workouts",
    "diet",
    "equipment.view",
    "equipment.manage",
    "plans",
    "payments",
    "reports",
    "settings.gym",
    "organizations.view",
    "branches.view",
    "branches.create",
    "branches.manage"
  ],
  // Branch Manager: authorized branch operations
  branch_manager: [
    ...OPERATIONAL,
    "trainers.create",
    "workouts",
    "diet",
    "equipment.manage",
    "plans",
    "settings.gym",
    "branches.view"
  ],
  // Staff (reception): daily tasks only, no privileged creation
  staff: OPERATIONAL,
  // Trainer: assigned members and workout-related operations
  trainer: [
    "dashboard",
    "workouts",
    "diet"
  ],
  // Member: own profile, membership and permitted personal information
  member: ["dashboard"]
};
const roleHas = (role, cap) => {
  const normalized = normalizeRole(role);
  if (!normalized) return false;
  return ROLE_CAPABILITIES[normalized]?.includes(cap) ?? false;
};
/** Normalize legacy role strings (user/owner/admin/manager) to canonical roles. */
const normalizeRole = (role) => {
  if (!role) return null;
  if (role in ROLE_CAPABILITIES) return role;
  return mapLegacyRole(role);
};
/** Roles that may see the management dashboard. */
const MANAGEMENT_ROLES = new Set([
  "platform_admin", "org_owner", "org_admin", "branch_manager", "staff", "trainer"
]);
/**
 * Resolve the effective role for a membership list + selected org.
 * Returns the normalized role, or null when no active membership exists
 * for that org — callers must treat null as "no management access".
 */
const resolveOrgRole = (memberships, orgId, fallbackGlobalRole) => {
  const membership = (memberships ?? []).find((m) => m.org_id === orgId);
  const role = normalizeRole(membership?.role);
  if (role) return role;
  // Platform admins are not org members; their authority is platform-level.
  if (normalizeRole(fallbackGlobalRole) === "platform_admin") return "platform_admin";
  return null;
};
const assignableRoles = (role) => {
  const normalizedRole = role && (role === "owner" || role === "admin" || role === "manager" || role === "user") ? mapLegacyRole(role) : role;
  switch (normalizedRole) {
    case "platform_admin":
      return ["platform_admin", "org_owner", "org_admin", "branch_manager", "staff", "trainer", "member"];
    case "org_owner":
      return ["org_owner", "org_admin", "branch_manager", "staff", "trainer", "member"];
    case "org_admin":
      return ["org_admin", "branch_manager", "staff", "trainer", "member"];
    case "branch_manager":
      return ["branch_manager", "staff", "trainer", "member"];
    default:
      return [];
  }
};
const mapLegacyRole = (legacyRole) => {
  const mapping = {
    "owner": "org_owner",
    "admin": "org_admin",
    "manager": "branch_manager",
    "staff": "staff",
    "user": "member"
  };
  return mapping[legacyRole] || "member";
};
const mapToLegacyRole = (role) => {
  const mapping = {
    "platform_admin": "admin",
    "org_owner": "owner",
    "org_admin": "admin",
    "branch_manager": "manager",
    "staff": "staff",
    "trainer": "staff",
    "member": "user"
  };
  return mapping[role] || "user";
};
export {
  MANAGEMENT_ROLES,
  ROLE_CAPABILITIES,
  assignableRoles,
  mapLegacyRole,
  mapToLegacyRole,
  normalizeRole,
  resolveOrgRole,
  roleHas
};
