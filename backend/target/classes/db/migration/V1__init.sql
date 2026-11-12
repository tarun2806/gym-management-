-- GymPro initial schema (MySQL 8.4)
-- IDs preserved as VARCHAR(36) to carry Firestore auto-IDs through migration.
-- Status columns use VARCHAR to tolerate legacy free-text values; canonical
-- values are enforced at the service layer.

CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100),
    password_hash VARCHAR(255) NULL,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at DATETIME(3),
    last_login_at DATETIME(3)
) ENGINE=InnoDB;

CREATE TABLE organizations (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    owner_id VARCHAR(36) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    subscription_tier VARCHAR(20) NOT NULL DEFAULT 'free',
    max_branches INT NULL,
    max_members INT NULL,
    settings JSON NULL,
    created_at DATETIME(3),
    updated_at DATETIME(3),
    CONSTRAINT fk_org_owner FOREIGN KEY (owner_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE organization_memberships (
    id VARCHAR(80) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) NULL,
    role VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    joined_at DATETIME(3),
    invited_by VARCHAR(36) NULL,
    UNIQUE KEY uq_membership (user_id, organization_id, branch_id),
    CONSTRAINT fk_mem_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_mem_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE branches (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    name VARCHAR(200) NOT NULL,
    address VARCHAR(500),
    manager_id VARCHAR(36) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    phone VARCHAR(50),
    capacity INT NULL,
    created_at DATETIME(3),
    updated_at DATETIME(3),
    INDEX idx_branches_org (organization_id),
    CONSTRAINT fk_branch_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_branch_manager FOREIGN KEY (manager_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- branch_id on memberships references branches; added after branches exists.
ALTER TABLE organization_memberships
    ADD CONSTRAINT fk_mem_branch FOREIGN KEY (branch_id) REFERENCES branches(id);

CREATE TABLE membership_plans (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    name VARCHAR(200) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    duration VARCHAR(50),
    features JSON NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at DATETIME(3),
    INDEX idx_plans_org_price (organization_id, price),
    CONSTRAINT fk_plans_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
) ENGINE=InnoDB;

CREATE TABLE trainers (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) NULL,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    specialization VARCHAR(100),
    experience VARCHAR(50),
    rating DECIMAL(3,1) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    location VARCHAR(200),
    bio TEXT,
    hourly_rate DECIMAL(10,2) NULL,
    created_at DATETIME(3),
    INDEX idx_trainers_org (organization_id),
    CONSTRAINT fk_trainers_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_trainers_branch FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB;

CREATE TABLE members (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) NULL,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    membership_type VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    join_date DATE NULL,
    last_visit DATETIME(3) NULL,
    trainer_id VARCHAR(36) NULL,
    plan_id VARCHAR(36) NULL,
    plan_name VARCHAR(200) NULL,
    start_date DATE NULL,
    expiry_date DATE NULL,
    created_at DATETIME(3),
    INDEX idx_members_org_status (organization_id, status),
    INDEX idx_members_org_expiry (organization_id, expiry_date),
    INDEX idx_members_org_created (organization_id, created_at),
    CONSTRAINT fk_members_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_members_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
    CONSTRAINT fk_members_trainer FOREIGN KEY (trainer_id) REFERENCES trainers(id),
    CONSTRAINT fk_members_plan FOREIGN KEY (plan_id) REFERENCES membership_plans(id)
) ENGINE=InnoDB;

CREATE TABLE classes (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) NULL,
    name VARCHAR(200) NOT NULL,
    instructor VARCHAR(200),
    schedule_time VARCHAR(100),
    capacity INT NOT NULL DEFAULT 0,
    enrolled INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    room VARCHAR(100),
    type VARCHAR(50),
    description TEXT,
    created_at DATETIME(3),
    INDEX idx_classes_org (organization_id),
    CONSTRAINT fk_classes_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_classes_branch FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB;

CREATE TABLE class_bookings (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    class_id VARCHAR(36) NOT NULL,
    member_id VARCHAR(36) NOT NULL,
    booked_at DATETIME(3),
    status VARCHAR(20) NOT NULL DEFAULT 'booked',
    cancelled_at DATETIME(3) NULL,
    INDEX idx_bookings_class_member (class_id, member_id),
    INDEX idx_bookings_org (organization_id),
    CONSTRAINT fk_bookings_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_bookings_class FOREIGN KEY (class_id) REFERENCES classes(id),
    CONSTRAINT fk_bookings_member FOREIGN KEY (member_id) REFERENCES members(id)
) ENGINE=InnoDB;

CREATE TABLE attendance (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) NULL,
    member_id VARCHAR(36) NOT NULL,
    check_in DATETIME(3) NOT NULL,
    check_out DATETIME(3) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'present',
    member_name VARCHAR(200) NULL,
    member_type VARCHAR(100) NULL,
    created_at DATETIME(3),
    INDEX idx_att_org_checkin (organization_id, check_in),
    INDEX idx_att_org_member_checkin (organization_id, member_id, check_in),
    INDEX idx_att_member_checkin (member_id, check_in),
    CONSTRAINT fk_att_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_att_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
    CONSTRAINT fk_att_member FOREIGN KEY (member_id) REFERENCES members(id)
) ENGINE=InnoDB;

CREATE TABLE payments (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) NULL,
    member_id VARCHAR(36) NULL,
    amount DECIMAL(12,2) NOT NULL,
    type VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'completed',
    note TEXT,
    plan_id VARCHAR(36) NULL,
    plan_name VARCHAR(200) NULL,
    period_start DATE NULL,
    period_end DATE NULL,
    razorpay_order_id VARCHAR(100) NULL,
    razorpay_payment_id VARCHAR(100) NULL,
    created_at DATETIME(3),
    UNIQUE KEY uq_payments_razorpay (razorpay_payment_id),
    INDEX idx_payments_org_created (organization_id, created_at),
    INDEX idx_payments_status_created (status, created_at),
    CONSTRAINT fk_pay_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_pay_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
    CONSTRAINT fk_pay_member FOREIGN KEY (member_id) REFERENCES members(id)
) ENGINE=InnoDB;

CREATE TABLE invoices (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) NULL,
    invoice_number VARCHAR(50) NOT NULL,
    member_id VARCHAR(36) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    due_date DATE NULL,
    issued_date DATE NULL,
    paid_date DATE NULL,
    items JSON NULL,
    subtotal DECIMAL(12,2) NULL,
    tax DECIMAL(12,2) NULL,
    total DECIMAL(12,2) NULL,
    notes TEXT,
    created_at DATETIME(3),
    UNIQUE KEY uq_invoice_number (organization_id, invoice_number),
    CONSTRAINT fk_inv_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_inv_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
    CONSTRAINT fk_inv_member FOREIGN KEY (member_id) REFERENCES members(id)
) ENGINE=InnoDB;

CREATE TABLE expenses (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) NULL,
    category VARCHAR(100),
    description VARCHAR(500),
    amount DECIMAL(12,2) NOT NULL,
    date DATE NULL,
    payment_method VARCHAR(50),
    vendor VARCHAR(200),
    receipt_url VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    approved_by VARCHAR(36) NULL,
    approved_at DATETIME(3) NULL,
    created_at DATETIME(3),
    INDEX idx_expenses_org_date (organization_id, date),
    CONSTRAINT fk_exp_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_exp_branch FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB;

CREATE TABLE payroll_entries (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) NULL,
    employee_id VARCHAR(36) NOT NULL,
    employee_name VARCHAR(200),
    employee_type VARCHAR(20) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    base_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
    commission DECIMAL(12,2) NOT NULL DEFAULT 0,
    bonuses DECIMAL(12,2) NOT NULL DEFAULT 0,
    deductions DECIMAL(12,2) NOT NULL DEFAULT 0,
    net_pay DECIMAL(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    processed_at DATETIME(3) NULL,
    paid_at DATETIME(3) NULL,
    created_at DATETIME(3),
    UNIQUE KEY uq_payroll_period (employee_id, period_start, period_end),
    INDEX idx_payroll_org (organization_id),
    CONSTRAINT fk_payroll_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_payroll_branch FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB;

CREATE TABLE workout_plans (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    member_id VARCHAR(36) NULL,
    trainer_id VARCHAR(36) NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    objective VARCHAR(200),
    level VARCHAR(50),
    weeks INT NULL,
    days_per_week INT NULL,
    exercises JSON NULL,
    completions JSON NULL,
    created_at DATETIME(3),
    INDEX idx_workouts_org (organization_id),
    INDEX idx_workouts_member (member_id, created_at),
    CONSTRAINT fk_wo_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_wo_member FOREIGN KEY (member_id) REFERENCES members(id),
    CONSTRAINT fk_wo_trainer FOREIGN KEY (trainer_id) REFERENCES trainers(id)
) ENGINE=InnoDB;

CREATE TABLE diet_plans (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    member_id VARCHAR(36) NULL,
    date DATE NULL,
    calories INT NULL,
    macros JSON NULL,
    goals VARCHAR(500),
    description TEXT,
    meals JSON NULL,
    diet_preference VARCHAR(100),
    created_at DATETIME(3),
    INDEX idx_diet_org (organization_id),
    CONSTRAINT fk_diet_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_diet_member FOREIGN KEY (member_id) REFERENCES members(id)
) ENGINE=InnoDB;

CREATE TABLE pt_packages (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    sessions INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    duration_days INT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at DATETIME(3),
    INDEX idx_ptpkg_org (organization_id),
    CONSTRAINT fk_ptpkg_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_ptpkg_branch FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB;

CREATE TABLE pt_sessions (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) NULL,
    package_id VARCHAR(36) NULL,
    member_id VARCHAR(36) NOT NULL,
    trainer_id VARCHAR(36) NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    completed_at DATETIME(3) NULL,
    created_at DATETIME(3),
    INDEX idx_ptsess_org_date (organization_id, scheduled_date),
    CONSTRAINT fk_ptsess_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_ptsess_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
    CONSTRAINT fk_ptsess_pkg FOREIGN KEY (package_id) REFERENCES pt_packages(id),
    CONSTRAINT fk_ptsess_member FOREIGN KEY (member_id) REFERENCES members(id),
    CONSTRAINT fk_ptsess_trainer FOREIGN KEY (trainer_id) REFERENCES trainers(id)
) ENGINE=InnoDB;

CREATE TABLE equipment (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) NULL,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(100),
    brand VARCHAR(100),
    model VARCHAR(100),
    location VARCHAR(200),
    status VARCHAR(30) NOT NULL DEFAULT 'operational',
    last_maintenance DATE NULL,
    next_maintenance DATE NULL,
    equipment_condition VARCHAR(50),
    serial_number VARCHAR(100),
    purchase_date DATE NULL,
    warranty VARCHAR(100),
    notes TEXT,
    service_interval_days INT NULL,
    maintenance_log JSON NULL,
    created_at DATETIME(3),
    UNIQUE KEY uq_equipment_serial (organization_id, serial_number),
    INDEX idx_equipment_org (organization_id),
    CONSTRAINT fk_equip_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_equip_branch FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB;

CREATE TABLE products (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) NULL,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    sku VARCHAR(100),
    description TEXT,
    stock_quantity INT NOT NULL DEFAULT 0,
    unit_price DECIMAL(10,2) NULL,
    supplier VARCHAR(200),
    min_stock INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at DATETIME(3),
    INDEX idx_products_org (organization_id),
    CONSTRAINT fk_prod_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_prod_branch FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB;

CREATE TABLE stock_movements (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) NULL,
    product_id VARCHAR(36) NOT NULL,
    type VARCHAR(20) NOT NULL,
    quantity INT NOT NULL,
    unit_cost DECIMAL(10,2) NULL,
    reason VARCHAR(500),
    from_branch_id VARCHAR(36) NULL,
    to_branch_id VARCHAR(36) NULL,
    performed_by VARCHAR(36) NULL,
    date DATETIME(3),
    created_at DATETIME(3),
    INDEX idx_movements_product (product_id, date),
    INDEX idx_movements_org (organization_id),
    CONSTRAINT fk_mov_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_mov_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
    CONSTRAINT fk_mov_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

CREATE TABLE settings (
    `key` VARCHAR(100) PRIMARY KEY,
    value JSON NULL
) ENGINE=InnoDB;

CREATE TABLE system_logs (
    id VARCHAR(36) PRIMARY KEY,
    level VARCHAR(20),
    message TEXT,
    user_name VARCHAR(200),
    user_id VARCHAR(36) NULL,
    action VARCHAR(100),
    org_id VARCHAR(36) NULL,
    branch_id VARCHAR(36) NULL,
    target_type VARCHAR(50),
    target_id VARCHAR(100),
    created_at DATETIME(3),
    INDEX idx_logs_org_created (org_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    organization_id VARCHAR(36) NULL,
    type VARCHAR(50),
    title VARCHAR(300),
    body TEXT,
    payload JSON NULL,
    read_flag BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(3),
    INDEX idx_notif_user_read (user_id, read_flag),
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;
