import type { Role, LegacyRole } from '../types';

// Single source of truth for what each role may do. Both the UI (routes,
// sidebar entries, action buttons) and future backend checks should reference
// these capabilities instead of ad-hoc role lists.
export type Capability =
    | 'dashboard'
    | 'members.view'
    | 'members.create'
    | 'trainers.view'
    | 'trainers.create'
    | 'attendance'
    | 'classes'
    | 'workouts'
    | 'diet'
    | 'equipment.view'
    | 'equipment.manage'
    | 'plans'
    | 'payments'
    | 'reports'
    | 'settings.gym'
    | 'admin'
    | 'organizations.view'
    | 'organizations.create'
    | 'organizations.manage'
    | 'branches.view'
    | 'branches.create'
    | 'branches.manage';

const ALL: Capability[] = [
    'dashboard',
    'members.view', 'members.create',
    'trainers.view', 'trainers.create',
    'attendance',
    'classes',
    'workouts',
    'diet',
    'equipment.view', 'equipment.manage',
    'plans',
    'payments',
    'reports',
    'settings.gym',
    'admin',
    'organizations.view', 'organizations.create', 'organizations.manage',
    'branches.view', 'branches.create', 'branches.manage',
];

const OPERATIONAL: Capability[] = [
    'dashboard',
    'members.view', 'members.create',
    'trainers.view',
    'attendance',
    'classes',
    'equipment.view',
];

export const ROLE_CAPABILITIES: Record<Role, Capability[]> = {
    // Platform Admin: platform-level administration
    platform_admin: ALL,
    
    // Organization Owner: full access to their organization
    org_owner: [
        'dashboard',
        'members.view', 'members.create',
        'trainers.view', 'trainers.create',
        'attendance',
        'classes',
        'workouts',
        'diet',
        'equipment.view', 'equipment.manage',
        'plans',
        'payments',
        'reports',
        'settings.gym',
        'organizations.view', 'organizations.manage',
        'branches.view', 'branches.create', 'branches.manage',
    ],
    
    // Organization Admin: authorized organization-level operations
    org_admin: [
        'dashboard',
        'members.view', 'members.create',
        'trainers.view', 'trainers.create',
        'attendance',
        'classes',
        'workouts',
        'diet',
        'equipment.view', 'equipment.manage',
        'plans',
        'payments',
        'reports',
        'settings.gym',
        'organizations.view',
        'branches.view', 'branches.create', 'branches.manage',
    ],
    
    // Branch Manager: authorized branch operations
    branch_manager: [
        ...OPERATIONAL,
        'trainers.create',
        'workouts',
        'diet',
        'equipment.manage',
        'plans',
        'settings.gym',
        'branches.view',
    ],
    
    // Staff (reception): daily tasks only, no privileged creation
    staff: OPERATIONAL,
    
    // Trainer: assigned members and workout-related operations
    trainer: [
        'dashboard',
        'workouts',
        'diet',
    ],
    
    // Member: own profile, membership and permitted personal information
    member: ['dashboard'],
};

export const roleHas = (role: Role | undefined, cap: Capability): boolean => {
    if (!role) return false;
    return ROLE_CAPABILITIES[role]?.includes(cap) ?? false;
};

// Which roles a signed-in user may assign to accounts within their organization
export const assignableRoles = (role: Role | LegacyRole | undefined): Role[] => {
    const normalizedRole = role && (role === 'owner' || role === 'admin' || role === 'manager' || role === 'user') 
        ? mapLegacyRole(role) 
        : role;
    
    switch (normalizedRole) {
        case 'platform_admin':
            return ['platform_admin', 'org_owner', 'org_admin', 'branch_manager', 'staff', 'trainer', 'member'];
        case 'org_owner':
            return ['org_owner', 'org_admin', 'branch_manager', 'staff', 'trainer', 'member'];
        case 'org_admin':
            return ['org_admin', 'branch_manager', 'staff', 'trainer', 'member'];
        case 'branch_manager':
            return ['branch_manager', 'staff', 'trainer', 'member'];
        default:
            return [];
    }
};

// LEGACY: Map old role names to new multi-tenant roles for backward compatibility
export const mapLegacyRole = (legacyRole: string): Role => {
    const mapping: Record<string, Role> = {
        'owner': 'org_owner',
        'admin': 'org_admin',
        'manager': 'branch_manager',
        'staff': 'staff',
        'user': 'member',
    };
    return mapping[legacyRole] || 'member';
};

// LEGACY: Map new role names back to old role names for UI compatibility
export const mapToLegacyRole = (role: Role): string => {
    const mapping: Record<Role, string> = {
        'platform_admin': 'admin',
        'org_owner': 'owner',
        'org_admin': 'admin',
        'branch_manager': 'manager',
        'staff': 'staff',
        'trainer': 'staff',
        'member': 'user',
    };
    return mapping[role] || 'user';
};
