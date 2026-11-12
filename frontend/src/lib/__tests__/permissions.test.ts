import { describe, it, expect } from 'vitest';
import {
  ROLE_CAPABILITIES,
  roleHas,
  assignableRoles,
} from '../permissions';
import type { Role } from '../../types';

const ALL_ROLES: Role[] = ['org_owner', 'org_admin', 'branch_manager', 'staff', 'trainer', 'member'];

describe('ROLE_CAPABILITIES', () => {
  it('defines a capability list for every Role in the domain model', () => {
    for (const role of ALL_ROLES) {
      expect(ROLE_CAPABILITIES[role]).toBeInstanceOf(Array);
    }
  });

  it('org_owner and org_admin hold all operational capabilities', () => {
    const ownerCaps = new Set(ROLE_CAPABILITIES.org_owner);
    const adminCaps = new Set(ROLE_CAPABILITIES.org_admin);
    
    // Core operational capabilities
    const coreCaps = [
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
    ];
    
    for (const cap of coreCaps) {
      expect(ownerCaps.has(cap)).toBe(true);
      expect(adminCaps.has(cap)).toBe(true);
    }
    
    // Check they have organization and branch capabilities
    expect(ownerCaps.has('organizations.view')).toBe(true);
    expect(ownerCaps.has('organizations.manage')).toBe(true);
    expect(ownerCaps.has('branches.view')).toBe(true);
    expect(ownerCaps.has('branches.create')).toBe(true);
    expect(ownerCaps.has('branches.manage')).toBe(true);
    
    expect(adminCaps.has('organizations.view')).toBe(true);
    expect(adminCaps.has('branches.view')).toBe(true);
    expect(adminCaps.has('branches.create')).toBe(true);
    expect(adminCaps.has('branches.manage')).toBe(true);
  });

  it('staff capabilities are a strict subset of branch_manager capabilities', () => {
    const staff = new Set(ROLE_CAPABILITIES.staff);
    const manager = new Set(ROLE_CAPABILITIES.branch_manager);
    for (const cap of staff) {
      expect(manager.has(cap)).toBe(true);
    }
    // Manager has at least one capability staff does not.
    expect(manager.size).toBeGreaterThan(staff.size);
  });

  it('branch_manager capabilities are a strict subset of org_admin capabilities', () => {
    const manager = new Set(ROLE_CAPABILITIES.branch_manager);
    const admin = new Set(ROLE_CAPABILITIES.org_admin);
    for (const cap of manager) {
      expect(admin.has(cap)).toBe(true);
    }
    expect(admin.size).toBeGreaterThan(manager.size);
  });

  it('member has only dashboard access', () => {
    expect(ROLE_CAPABILITIES.member).toEqual(['dashboard']);
  });

  it('staff cannot reach privileged admin surfaces', () => {
    const staff = new Set(ROLE_CAPABILITIES.staff);
    // Any new privileged capability added to ALL must be excluded here
    // to keep the receptionist boundary honest.
    expect(staff.has('admin')).toBe(false);
    expect(staff.has('payments')).toBe(false);
    expect(staff.has('reports')).toBe(false);
    expect(staff.has('settings.gym')).toBe(false);
    expect(staff.has('plans')).toBe(false);
    expect(staff.has('workouts')).toBe(false);
    expect(staff.has('diet')).toBe(false);
    expect(staff.has('equipment.manage')).toBe(false);
    expect(staff.has('trainers.create')).toBe(false);
  });

  it('branch_manager cannot reach admin-panel-only surfaces (admin, payments, reports)', () => {
    const manager = new Set(ROLE_CAPABILITIES.branch_manager);
    // Manager gets plans + gym settings + workouts + diet, but not the
    // Admin Panel route itself, and not financial/report surfaces.
    expect(manager.has('admin')).toBe(false);
    expect(manager.has('payments')).toBe(false);
    expect(manager.has('reports')).toBe(false);
  });
});

describe('roleHas', () => {
  it('returns true for every valid (role, capability) pair', () => {
    for (const role of ALL_ROLES) {
      for (const cap of ROLE_CAPABILITIES[role]) {
        expect(roleHas(role, cap)).toBe(true);
      }
    }
  });

  it('returns false for a capability the role does not hold', () => {
    expect(roleHas('staff', 'admin')).toBe(false);
    expect(roleHas('member', 'payments')).toBe(false);
    expect(roleHas('branch_manager', 'reports')).toBe(false);
  });

  it('returns false for undefined / missing role (signed out)', () => {
    expect(roleHas(undefined, 'dashboard')).toBe(false);
  });
});

describe('assignableRoles', () => {
  it('org_owner can assign every role including another org_owner', () => {
    const result = assignableRoles('org_owner');
    for (const role of ALL_ROLES) {
      expect(result).toContain(role);
    }
  });

  it('org_admin can assign org_admin and below, but never org_owner', () => {
    const result = assignableRoles('org_admin');
    expect(result).not.toContain('org_owner');
    expect(result).toContain('org_admin');
    expect(result).toContain('branch_manager');
    expect(result).toContain('staff');
    expect(result).toContain('trainer');
    expect(result).toContain('member');
  });

  it('branch_manager can assign branch_manager, staff, trainer, member — never org_admin or org_owner', () => {
    const result = assignableRoles('branch_manager');
    expect(result).not.toContain('org_owner');
    expect(result).not.toContain('org_admin');
    expect(result).toEqual(['branch_manager', 'staff', 'trainer', 'member']);
  });

  it('staff cannot assign any role (no self-promotion path)', () => {
    expect(assignableRoles('staff')).toEqual([]);
  });

  it('trainer cannot assign any role', () => {
    expect(assignableRoles('trainer')).toEqual([]);
  });

  it('member cannot assign any role', () => {
    expect(assignableRoles('member')).toEqual([]);
  });

  it('undefined role cannot assign any role', () => {
    expect(assignableRoles(undefined)).toEqual([]);
  });
});
