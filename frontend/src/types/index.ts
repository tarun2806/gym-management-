export type Role = 'platform_admin' | 'org_owner' | 'org_admin' | 'branch_manager' | 'staff' | 'trainer' | 'member';

// LEGACY: Old role names for backward compatibility during migration
export type LegacyRole = 'owner' | 'admin' | 'manager' | 'staff' | 'user';

export interface User {
    id: string;
    username: string;
    email: string | undefined;
    // LEGACY: role field preserved for backward compatibility during migration
    role?: Role | LegacyRole;
    status?: 'active' | 'inactive' | 'suspended';
    lastLogin?: string;
    created_at?: string;
    permissions: string[];
    notificationState?: {
        readIds?: string[];
        updatedAt?: string;
    };
    app_metadata?: {
        role?: string;
    };
    user_metadata?: {
        role?: string;
    };
}

export interface Organization {
    id: string;
    name: string;
    slug: string;
    owner_id: string;
    status: 'active' | 'suspended' | 'pending';
    subscription_tier?: 'free' | 'basic' | 'premium';
    max_branches?: number;
    max_members?: number;
    created_at: string;
    updated_at: string;
    settings?: {
        gym_name?: string;
        address?: string;
        phone?: string;
        open_time?: string;
        close_time?: string;
        capacity?: number;
    };
}

export interface Branch {
    id: string;
    org_id: string;
    name: string;
    address: string;
    manager_id?: string;
    status: 'active' | 'suspended';
    phone?: string;
    capacity?: number;
    created_at: string;
    updated_at: string;
}

export interface OrganizationMembership {
    id: string;
    org_id: string;
    user_id: string;
    role: Role;
    branch_id?: string;
    status: 'active' | 'suspended' | 'pending';
    joined_at: string;
    invited_by?: string;
}

export type MemberStatus = 'Active' | 'Inactive' | 'Pending';

export interface Member {
    id: string;
    name: string;
    email: string;
    phone: string;
    membership_type: string;
    status: MemberStatus | string;
    join_date: string;
    last_visit?: string;
    trainer: string;
    plan_id?: string;
    plan_name?: string;
    start_date?: string;
    expiry_date?: string;
    created_at?: string;
    // Multi-tenant fields
    org_id: string;
    branch_id?: string;
}

export interface MembershipPlan {
    id: string;
    name: string;
    price: number;
    duration: string;
    features: string[];
    status: string;
    // Multi-tenant fields
    org_id: string;
}

export interface Payment {
    id: string;
    member_id: string;
    amount: number;
    created_at: string;
    type: string;
    status: string;
    note?: string;
    plan_id?: string | null;
    plan_name?: string;
    period_start?: string;
    period_end?: string;
    member?: {
        name: string;
        membership_type: string;
    };
    // Multi-tenant fields
    org_id: string;
    branch_id?: string;
}

export interface ClassData {
    id: string;
    name: string;
    instructor: string;
    schedule_time: string;
    capacity: number;
    enrolled: number;
    status: string;
    room: string;
    type: string;
    description: string;
    // Multi-tenant fields
    org_id: string;
    branch_id?: string;
}

export interface ClassBooking {
    id: string;
    class_id: string;
    member_id: string;
    booked_at: string;
    status: 'booked' | 'cancelled';
    cancelled_at?: string;
    // Multi-tenant fields
    org_id: string;
}

export interface Trainer {
    id: string;
    name: string;
    email: string;
    phone: string;
    specialization: string;
    experience: string;
    rating: number;
    status: string;
    location: string;
    bio: string;
    hourly_rate: number;
    // Multi-tenant fields
    org_id: string;
    branch_id?: string;
}

export interface AttendanceRecord {
    id: string;
    member_id: string;
    check_in: string;
    check_out: string | null;
    status: string;
    member?: {
        name: string;
        membership_type: string;
        phone: string;
    };
    // Denormalized member snapshot written at check-in so lists don't need
    // a per-record member lookup.
    member_name?: string;
    member_type?: string;
    // Multi-tenant fields
    org_id: string;
    branch_id?: string;
}

export interface MaintenanceLogEntry {
    id: string;
    date: string;               // ISO date (YYYY-MM-DD) the work was done
    kind: 'repair' | 'service' | 'inspection';
    description: string;
    technician?: string;
    cost?: number;
}

export interface EquipmentItem {
    id: string;
    name: string;
    type: string;
    brand: string;
    model: string;
    location: string;
    status: string;
    last_maintenance: string;
    next_maintenance?: string;
    condition: string;
    serial_number: string;
    purchase_date: string;
    warranty: string;
    notes: string;
    service_interval_days?: number;
    maintenance_log?: MaintenanceLogEntry[];
    // Multi-tenant fields
    org_id: string;
    branch_id?: string;
}

export interface WorkoutExercise {
    id?: string;
    plan_id?: string;
    name: string;
    sets: number;
    reps: number;
    weight: string;
    category?: string;
    rest?: string;
    notes?: string;
}

export interface WorkoutCompletion {
    id: string;
    date: string;
    note?: string;
}

export interface WorkoutPlan {
    id: string;
    name: string;
    member_id: string | null;
    trainer_id?: string | null;
    description?: string;
    objective?: string;
    level?: string;
    weeks?: number;
    days_per_week?: number;
    created_at: string;
    exercises?: WorkoutExercise[];
    completions?: WorkoutCompletion[];
    member?: { name: string };
    // Multi-tenant fields
    org_id: string;
}

export interface DietMeal {
    id: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    image: string;
}

export interface DietPlan {
    id: string;
    date: string;
    calories: number;
    macros: { protein: number; carbs: number; fats: number };
    goals: string;
    description: string;
    meals: {
        breakfast: DietMeal[];
        lunch: DietMeal[];
        dinner: DietMeal[];
        snacks: DietMeal[];
    };
    dietPreference: string;
    member_id?: string;
    created_at?: string;
    // Multi-tenant fields
    org_id: string;
}

// Personal Training Types
export interface PTPackage {
    id: string;
    name: string;
    description: string;
    sessions: number;
    price: number;
    duration_days: number;
    status: 'active' | 'inactive';
    org_id: string;
    branch_id?: string;
}

export interface PTSession {
    id: string;
    package_id: string;
    member_id: string;
    trainer_id: string;
    scheduled_date: string;
    scheduled_time: string;
    status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
    notes?: string;
    completed_at?: string;
    org_id: string;
    branch_id?: string;
}

// Billing and Invoice Types
export interface Invoice {
    id: string;
    invoice_number: string;
    member_id: string;
    amount: number;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'voided';
    due_date: string;
    issued_date: string;
    paid_date?: string;
    items: InvoiceItem[];
    subtotal: number;
    tax: number;
    total: number;
    notes?: string;
    org_id: string;
    branch_id?: string;
}

export interface InvoiceItem {
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
}

// Expense Types
export interface Expense {
    id: string;
    category: string;
    description: string;
    amount: number;
    date: string;
    payment_method: string;
    vendor?: string;
    receipt_url?: string;
    status: 'pending' | 'approved' | 'rejected';
    approved_by?: string;
    approved_at?: string;
    org_id: string;
    branch_id?: string;
}

// Payroll Types
export interface PayrollEntry {
    id: string;
    employee_id: string;
    employee_name: string;
    employee_type: 'staff' | 'trainer';
    period_start: string;
    period_end: string;
    base_salary: number;
    commission: number;
    bonuses: number;
    deductions: number;
    net_pay: number;
    status: 'draft' | 'processed' | 'paid';
    processed_at?: string;
    paid_at?: string;
    org_id: string;
    branch_id?: string;
}

// Inventory Types
export interface Product {
    id: string;
    name: string;
    category: string;
    sku: string;
    description: string;
    stock_quantity: number;
    unit_price: number;
    supplier?: string;
    min_stock: number;
    status: 'active' | 'discontinued';
    org_id: string;
    branch_id?: string;
}

export interface StockMovement {
    id: string;
    product_id: string;
    type: 'purchase' | 'sale' | 'transfer' | 'adjustment' | 'return';
    quantity: number;
    unit_cost?: number;
    reason?: string;
    from_branch_id?: string;
    to_branch_id?: string;
    performed_by: string;
    date: string;
    org_id: string;
    branch_id?: string;
}
