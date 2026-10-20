-- =============================================================================
-- Sistema de Proformas y Cotizaciones de Instalaciones Técnicas
-- Migración 001: Esquema Inicial Completo (MySQL 8.0+ / MariaDB 10.6+)
-- Motor: InnoDB | Charset: utf8mb4_unicode_ci
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Seguridad, Usuarios y Auditoría
CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('vendedor', 'tecnico', 'gerencia', 'admin') NOT NULL,
    phone VARCHAR(30) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    failed_attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
    locked_until DATETIME NULL,
    last_login_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_role_active (role, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS password_resets (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pwd_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_log (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NULL,
    action VARCHAR(80) NOT NULL,
    entity_type VARCHAR(60) NOT NULL,
    entity_id BIGINT UNSIGNED NULL,
    before_json JSON NULL,
    after_json JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_entity (entity_type, entity_id),
    INDEX idx_audit_user_date (user_id, created_at),
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Clientes y Proyectos
CREATE TABLE IF NOT EXISTS customers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    document_type ENUM('RUC', 'DNI', 'CE', 'OTRO') NOT NULL DEFAULT 'RUC',
    document_number VARCHAR(20) NOT NULL,
    business_name VARCHAR(200) NOT NULL,
    trade_name VARCHAR(200) NULL,
    contact_name VARCHAR(150) NOT NULL,
    contact_role VARCHAR(100) NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(180) NULL,
    fiscal_address VARCHAR(255) NULL,
    notes TEXT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_by BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_customers_doc (document_type, document_number),
    INDEX idx_customers_name (business_name),
    CONSTRAINT fk_customers_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS projects (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(200) NOT NULL,
    property_type ENUM('casa', 'edificio', 'oficina', 'local_comercial', 'planta_industrial', 'otro') NOT NULL DEFAULT 'casa',
    floors SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    installation_address VARCHAR(255) NOT NULL,
    district VARCHAR(100) NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Lima',
    site_notes TEXT NULL,
    created_by BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_projects_customer (customer_id),
    CONSTRAINT fk_projects_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_projects_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Catálogo, Proveedores, Ofertas y Tipo de Cambio
CREATE TABLE IF NOT EXISTS suppliers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ruc VARCHAR(15) NULL UNIQUE,
    name VARCHAR(180) NOT NULL,
    contact_name VARCHAR(150) NULL,
    phone VARCHAR(30) NULL,
    email VARCHAR(180) NULL,
    website VARCHAR(255) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(60) NOT NULL UNIQUE,
    category ENUM('cctv', 'redes', 'energia', 'videoportero', 'accesos', 'insumos', 'otros') NOT NULL,
    subcategory VARCHAR(80) NULL,
    name VARCHAR(200) NOT NULL,
    brand VARCHAR(100) NULL,
    model VARCHAR(100) NULL,
    description TEXT NULL,
    unit ENUM('UND', 'M', 'ROLLO', 'KIT', 'GLB', 'PAR') NOT NULL DEFAULT 'UND',
    warranty_months SMALLINT UNSIGNED NOT NULL DEFAULT 12,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_products_category_active (category, is_active),
    INDEX idx_products_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS supplier_offers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT UNSIGNED NOT NULL,
    supplier_id BIGINT UNSIGNED NOT NULL,
    supplier_sku VARCHAR(80) NULL,
    currency ENUM('PEN', 'USD') NOT NULL DEFAULT 'USD',
    unit_cost DECIMAL(12,4) NOT NULL,
    includes_tax TINYINT(1) NOT NULL DEFAULT 0,
    lead_time_days SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    valid_from DATE NOT NULL,
    valid_until DATE NULL,
    is_preferred TINYINT(1) NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_offers_product_active (product_id, is_active, valid_until),
    CONSTRAINT fk_offers_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_offers_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS exchange_rates (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    rate_date DATE NOT NULL,
    usd_to_pen_buy DECIMAL(10,4) NOT NULL,
    usd_to_pen_sell DECIMAL(10,4) NOT NULL,
    buffer_pct DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    source VARCHAR(80) NOT NULL DEFAULT 'MANUAL',
    created_by BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_fx_date (rate_date DESC),
    CONSTRAINT fk_fx_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Ensamblajes / Kits y Parámetros de Mano de Obra
CREATE TABLE IF NOT EXISTS assemblies (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(60) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    category ENUM('cctv', 'redes', 'energia', 'videoportero', 'accesos', 'otros') NOT NULL,
    description TEXT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'PUNTO',
    hours_cabling DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    hours_mounting DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    hours_config DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    reference_cost_per_point DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    fixed_supplies_cost_pen DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assembly_components (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    assembly_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    is_optional TINYINT(1) NOT NULL DEFAULT 0,
    sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    CONSTRAINT fk_asm_comp_assembly FOREIGN KEY (assembly_id) REFERENCES assemblies(id) ON DELETE CASCADE,
    CONSTRAINT fk_asm_comp_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS labor_params (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    technician_day_cost_pen DECIMAL(10,2) NOT NULL DEFAULT 140.00,
    assistant_day_cost_pen DECIMAL(10,2) NOT NULL DEFAULT 90.00,
    effective_hours_per_day DECIMAL(5,2) NOT NULL DEFAULT 7.00,
    buffer_pct DECIMAL(5,2) NOT NULL DEFAULT 15.00,
    default_travel_cost_per_day_pen DECIMAL(10,2) NOT NULL DEFAULT 40.00,
    default_overhead_pct DECIMAL(5,2) NOT NULL DEFAULT 8.00,
    default_margin_on_sale_pct DECIMAL(5,2) NOT NULL DEFAULT 30.00,
    min_margin_on_sale_pct DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    seller_max_discount_pct DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    tax_pct DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    default_labor_method ENUM('method_a', 'method_b', 'max_ab') NOT NULL DEFAULT 'max_ab',
    default_validity_days SMALLINT UNSIGNED NOT NULL DEFAULT 15,
    updated_by BIGINT UNSIGNED NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_labor_updater FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS crew_efficiency (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    crew_size TINYINT UNSIGNED NOT NULL UNIQUE,
    efficiency_pct DECIMAL(5,2) NOT NULL,
    description VARCHAR(120) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS difficulty_factors (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(40) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    factor DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    description VARCHAR(255) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS condition_templates (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    includes_text TEXT NOT NULL,
    excludes_text TEXT NOT NULL,
    payment_terms_text TEXT NOT NULL,
    warranty_text TEXT NOT NULL,
    notes_text TEXT NULL,
    is_default TINYINT(1) NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Servicios Recurrentes (Mantenimiento)
CREATE TABLE IF NOT EXISTS services (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(60) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    periodicity ENUM('mensual', 'trimestral', 'semestral', 'anual', 'unico') NOT NULL DEFAULT 'semestral',
    scope_description TEXT NOT NULL,
    estimated_hours DECIMAL(8,2) NOT NULL DEFAULT 2.00,
    supplies_cost_pen DECIMAL(12,2) NOT NULL DEFAULT 30.00,
    reference_price_pen DECIMAL(12,2) NOT NULL DEFAULT 250.00,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Proformas / Cotizaciones, Líneas, Aprobaciones y Snapshots
CREATE TABLE IF NOT EXISTS quote_sequences (
    year SMALLINT UNSIGNED PRIMARY KEY,
    last_number INT UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quotes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(30) NOT NULL,
    version SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    parent_quote_id BIGINT UNSIGNED NULL,
    customer_id BIGINT UNSIGNED NOT NULL,
    project_id BIGINT UNSIGNED NOT NULL,
    seller_id BIGINT UNSIGNED NOT NULL,
    status ENUM(
        'borrador',
        'en_aprobacion',
        'emitida',
        'enviada',
        'aceptada',
        'rechazada',
        'vencida',
        'anulada'
    ) NOT NULL DEFAULT 'borrador',
    currency ENUM('PEN', 'USD') NOT NULL DEFAULT 'PEN',
    exchange_rate_used DECIMAL(10,4) NOT NULL DEFAULT 3.7500,
    validity_days SMALLINT UNSIGNED NOT NULL DEFAULT 15,
    valid_until DATE NULL,
    issue_date DATE NULL,
    crew_technicians TINYINT UNSIGNED NOT NULL DEFAULT 1,
    crew_assistants TINYINT UNSIGNED NOT NULL DEFAULT 1,
    crew_efficiency_pct DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    labor_method ENUM('method_a', 'method_b', 'max_ab') NOT NULL DEFAULT 'max_ab',
    total_hours_cabling DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_hours_mounting DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_hours_config DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_hours DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    estimated_days DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    materials_cost_pen DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    labor_cost_method_a_pen DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    labor_cost_method_b_pen DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    labor_cost_applied_pen DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    travel_cost_pen DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    direct_cost_pen DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    overhead_pct DECIMAL(5,2) NOT NULL DEFAULT 8.00,
    overhead_amount_pen DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    total_cost_pen DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    target_margin_on_sale_pct DECIMAL(5,2) NOT NULL DEFAULT 30.00,
    sale_value_before_discount_pen DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    discount_pct DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    discount_amount_pen DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    taxable_base_pen DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    tax_pct DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    tax_amount_pen DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    total_with_tax_pen DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    effective_margin_on_sale_pct DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    requires_approval TINYINT(1) NOT NULL DEFAULT 0,
    includes_text TEXT NULL,
    excludes_text TEXT NULL,
    payment_terms_text TEXT NULL,
    warranty_text TEXT NULL,
    notes_text TEXT NULL,
    rejection_reason VARCHAR(255) NULL,
    sent_at DATETIME NULL,
    accepted_at DATETIME NULL,
    rejected_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_quotes_code_version (code, version),
    INDEX idx_quotes_status_date (status, issue_date),
    INDEX idx_quotes_seller (seller_id, status),
    INDEX idx_quotes_customer (customer_id),
    CONSTRAINT fk_quotes_parent FOREIGN KEY (parent_quote_id) REFERENCES quotes(id) ON DELETE SET NULL,
    CONSTRAINT fk_quotes_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_quotes_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT,
    CONSTRAINT fk_quotes_seller FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quote_zones (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    quote_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(120) NOT NULL,
    difficulty_factor_id BIGINT UNSIGNED NULL,
    difficulty_factor_value DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    notes VARCHAR(255) NULL,
    CONSTRAINT fk_qzones_quote FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
    CONSTRAINT fk_qzones_df FOREIGN KEY (difficulty_factor_id) REFERENCES difficulty_factors(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quote_lines (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    quote_id BIGINT UNSIGNED NOT NULL,
    quote_zone_id BIGINT UNSIGNED NULL,
    line_type ENUM('assembly', 'product', 'custom') NOT NULL DEFAULT 'assembly',
    assembly_id BIGINT UNSIGNED NULL,
    product_id BIGINT UNSIGNED NULL,
    code VARCHAR(60) NULL,
    description VARCHAR(255) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'UND',
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    unit_cost_pen DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    unit_price_pen DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    hours_cabling_unit DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    hours_mounting_unit DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    hours_config_unit DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    reference_labor_unit_pen DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    difficulty_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    line_materials_cost_pen DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    line_total_hours DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    line_sale_subtotal_pen DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    CONSTRAINT fk_qlines_quote FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
    CONSTRAINT fk_qlines_zone FOREIGN KEY (quote_zone_id) REFERENCES quote_zones(id) ON DELETE SET NULL,
    CONSTRAINT fk_qlines_assembly FOREIGN KEY (assembly_id) REFERENCES assemblies(id) ON DELETE SET NULL,
    CONSTRAINT fk_qlines_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quote_service_lines (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    quote_id BIGINT UNSIGNED NOT NULL,
    service_id BIGINT UNSIGNED NULL,
    name VARCHAR(200) NOT NULL,
    periodicity ENUM('mensual', 'trimestral', 'semestral', 'anual', 'unico') NOT NULL DEFAULT 'semestral',
    quantity SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    unit_cost_pen DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    unit_price_pen DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    subtotal_price_pen DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    is_included_in_quote_total TINYINT(1) NOT NULL DEFAULT 0,
    CONSTRAINT fk_qslines_quote FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
    CONSTRAINT fk_qslines_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quote_approvals (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    quote_id BIGINT UNSIGNED NOT NULL,
    requested_by BIGINT UNSIGNED NOT NULL,
    requested_reason VARCHAR(255) NOT NULL,
    status ENUM('pendiente', 'aprobada', 'rechazada') NOT NULL DEFAULT 'pendiente',
    decided_by BIGINT UNSIGNED NULL,
    decision_comment VARCHAR(255) NULL,
    requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    decided_at DATETIME NULL,
    CONSTRAINT fk_qapp_quote FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
    CONSTRAINT fk_qapp_req FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_qapp_dec FOREIGN KEY (decided_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quote_snapshots (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    quote_id BIGINT UNSIGNED NOT NULL UNIQUE,
    snapshot_json JSON NOT NULL,
    pdf_hash CHAR(64) NULL,
    emitted_by BIGINT UNSIGNED NOT NULL,
    emitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_qsnap_quote FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
    CONSTRAINT fk_qsnap_user FOREIGN KEY (emitted_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Fase 2 / Levantamiento Técnico y Órdenes de Trabajo
CREATE TABLE IF NOT EXISTS site_visits (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT UNSIGNED NOT NULL,
    technician_id BIGINT UNSIGNED NOT NULL,
    visit_date DATETIME NOT NULL,
    status ENUM('programada', 'en_curso', 'completada', 'cancelada') NOT NULL DEFAULT 'programada',
    general_observations TEXT NULL,
    risks_detected TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_visits_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_visits_tech FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS site_visit_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    site_visit_id BIGINT UNSIGNED NOT NULL,
    zone_name VARCHAR(120) NOT NULL,
    assembly_id BIGINT UNSIGNED NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    estimated_cable_meters DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    difficulty_factor_id BIGINT UNSIGNED NULL,
    notes VARCHAR(255) NULL,
    CONSTRAINT fk_vitems_visit FOREIGN KEY (site_visit_id) REFERENCES site_visits(id) ON DELETE CASCADE,
    CONSTRAINT fk_vitems_assembly FOREIGN KEY (assembly_id) REFERENCES assemblies(id) ON DELETE SET NULL,
    CONSTRAINT fk_vitems_df FOREIGN KEY (difficulty_factor_id) REFERENCES difficulty_factors(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS site_visit_photos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    site_visit_id BIGINT UNSIGNED NOT NULL,
    zone_name VARCHAR(120) NULL,
    file_path VARCHAR(255) NOT NULL,
    caption VARCHAR(255) NULL,
    uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vphotos_visit FOREIGN KEY (site_visit_id) REFERENCES site_visits(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS work_orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    quote_id BIGINT UNSIGNED NOT NULL UNIQUE,
    code VARCHAR(30) NOT NULL UNIQUE,
    lead_technician_id BIGINT UNSIGNED NULL,
    scheduled_start_date DATE NULL,
    scheduled_end_date DATE NULL,
    actual_start_date DATE NULL,
    actual_end_date DATE NULL,
    status ENUM('pendiente', 'en_ejecucion', 'finalizada', 'cerrada') NOT NULL DEFAULT 'pendiente',
    actual_materials_cost_pen DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    actual_hours_worked DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    actual_labor_cost_pen DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    actual_travel_cost_pen DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    closure_notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_wo_quote FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE RESTRICT,
    CONSTRAINT fk_wo_tech FOREIGN KEY (lead_technician_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS work_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    work_order_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    work_date DATE NOT NULL,
    hours_worked DECIMAL(5,2) NOT NULL,
    activity_type ENUM('cabling', 'mounting', 'config', 'support') NOT NULL DEFAULT 'mounting',
    notes VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wlogs_wo FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_wlogs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
