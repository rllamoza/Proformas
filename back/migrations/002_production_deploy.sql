-- =============================================================================
-- SISTEMA DE PROFORMAS Y COTIZACIONES DE INSTALACIONES TÉCNICAS (LIMA, PERÚ)
-- Script SQL Unificado de Despliegue a Producción (Esquema DDL + Datos Semilla)
-- Motor: MySQL 8.0+ / MariaDB 10.6+ | InnoDB | utf8mb4_unicode_ci
-- =============================================================================

CREATE DATABASE IF NOT EXISTS proformas_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE proformas_db;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- =============================================================================
-- 1. SEGURIDAD, USUARIOS Y AUDITORÍA
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('vendedor', 'tecnico', 'gerencia', 'admin') NOT NULL,
    phone VARCHAR(30) NULL,
    zone VARCHAR(100) NULL DEFAULT 'Lima Metropolitana',
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

-- =============================================================================
-- 2. CLIENTES Y PROYECTOS
-- =============================================================================
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
    district VARCHAR(100) NULL,
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

-- =============================================================================
-- 3. CATÁLOGO TÉCNICO, PROVEEDORES, OFERTAS Y TIPO DE CAMBIO SUNAT
-- =============================================================================
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
    category ENUM('cctv', 'redes', 'energia', 'videoportero', 'accesos', 'canalizacion', 'herramientas', 'insumos', 'otros') NOT NULL,
    subcategory VARCHAR(80) NULL,
    name VARCHAR(200) NOT NULL,
    brand VARCHAR(100) NULL,
    model VARCHAR(100) NULL,
    description TEXT NULL,
    unit ENUM('UND', 'M', 'ROLLO', 'TUBO', 'KIT', 'GLB', 'PAR') NOT NULL DEFAULT 'UND',
    stock INT NOT NULL DEFAULT 20,
    stock_status ENUM('in_stock', 'critical', 'on_order') NOT NULL DEFAULT 'in_stock',
    warehouse VARCHAR(100) NOT NULL DEFAULT 'Lima / Callao',
    image_url VARCHAR(500) NULL,
    warranty_months SMALLINT UNSIGNED NOT NULL DEFAULT 24,
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
    source VARCHAR(80) NOT NULL DEFAULT 'SUNAT',
    created_by BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_fx_date (rate_date DESC),
    CONSTRAINT fk_fx_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 4. ENSAMBLAJES / KITS Y PARÁMETROS DE MANO DE OBRA (RN-02 / RN-03)
-- =============================================================================
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

-- =============================================================================
-- 5. SERVICIOS RECURRENTES DE MANTENIMIENTO
-- =============================================================================
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

-- =============================================================================
-- 6. PROFORMAS / COTIZACIONES, ZONAS, LÍNEAS, APROBACIONES Y SNAPSHOTS
-- =============================================================================
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
    period_key VARCHAR(20) NOT NULL DEFAULT 'jun2026',
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
    INDEX idx_quotes_period (period_key, status),
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
    detail_reason VARCHAR(255) NULL,
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

-- =============================================================================
-- 7. VISITAS TÉCNICAS, ÓRDENES DE TRABAJO Y LIQUIDACIÓN FISCAL SUNAT
-- =============================================================================
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

CREATE TABLE IF NOT EXISTS sunat_settlements (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    voucher_code VARCHAR(30) NOT NULL UNIQUE,
    quote_code VARCHAR(30) NOT NULL,
    customer_name VARCHAR(200) NOT NULL,
    customer_ruc VARCHAR(15) NOT NULL,
    issue_date DATE NOT NULL,
    period_key VARCHAR(20) NOT NULL DEFAULT 'ytd-2026',
    advisor_name VARCHAR(150) NOT NULL,
    subtotal_pen DECIMAL(14,2) NOT NULL,
    igv_pen DECIMAL(14,2) NOT NULL,
    spot_pen DECIMAL(14,2) NOT NULL,
    total_pen DECIMAL(14,2) NOT NULL,
    sunat_status ENUM('cdr_accepted', 'spot_pending', 'pending_payment') NOT NULL DEFAULT 'cdr_accepted',
    sunat_status_label VARCHAR(60) NOT NULL DEFAULT 'Aceptada CDR',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 8. DATOS MAESTROS Y CONFIGURACIÓN INICIAL (LIMA, PERÚ)
-- =============================================================================

-- 8.1 Usuarios (Contraseña por defecto: Secret123!)
INSERT INTO users (id, full_name, email, password_hash, role, phone, zone, is_active) VALUES
(1, 'Administrador General', 'admin@empresa.pe', '$2y$12$Q7m9zG7bU0P3l8W6xY5vOe1k2J3h4G5f6D7s8A9q0W1e2R3t4Y5u6', 'admin', '+51 999 000 111', 'Lima Metropolitana', 1),
(2, 'Roberto Sánchez', 'gerencia@empresa.pe', '$2y$12$Q7m9zG7bU0P3l8W6xY5vOe1k2J3h4G5f6D7s8A9q0W1e2R3t4Y5u6', 'gerencia', '+51 999 000 222', 'San Isidro - Sede Central', 1),
(3, 'Carlos Mendoza', 'vendedor@empresa.pe', '$2y$12$Q7m9zG7bU0P3l8W6xY5vOe1k2J3h4G5f6D7s8A9q0W1e2R3t4Y5u6', 'vendedor', '+51 999 000 333', 'Surco / Miraflores / La Molina', 1),
(4, 'Jorge Quispe', 'tecnico@empresa.pe', '$2y$12$Q7m9zG7bU0P3l8W6xY5vOe1k2J3h4G5f6D7s8A9q0W1e2R3t4Y5u6', 'tecnico', '+51 999 000 444', 'Cuadrilla Lima Sur / Este', 1)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), role = VALUES(role), is_active = VALUES(is_active);

-- 8.2 Tipo de Cambio SUNAT Vigente
INSERT INTO exchange_rates (id, rate_date, usd_to_pen_buy, usd_to_pen_sell, buffer_pct, source, created_by) VALUES
(1, '2026-06-04', 3.7200, 3.7500, 0.00, 'SUNAT Oficial Perú', 1)
ON DUPLICATE KEY UPDATE usd_to_pen_buy = VALUES(usd_to_pen_buy), usd_to_pen_sell = VALUES(usd_to_pen_sell);

-- 8.3 Parámetros de Mano de Obra y Rentabilidad
INSERT INTO labor_params (
    id, technician_day_cost_pen, assistant_day_cost_pen, effective_hours_per_day,
    buffer_pct, default_travel_cost_per_day_pen, default_overhead_pct,
    default_margin_on_sale_pct, min_margin_on_sale_pct, seller_max_discount_pct,
    tax_pct, default_labor_method, default_validity_days, updated_by
) VALUES (
    1, 140.00, 90.00, 7.00, 15.00, 40.00, 8.00, 30.00, 20.00, 5.00, 18.00, 'max_ab', 15, 1
) ON DUPLICATE KEY UPDATE technician_day_cost_pen = VALUES(technician_day_cost_pen);

-- 8.4 Eficiencia de Cuadrillas (RN-03)
INSERT INTO crew_efficiency (id, crew_size, efficiency_pct, description) VALUES
(1, 1, 100.00, '1 persona - Rendimiento base 100%'),
(2, 2, 100.00, '2 personas (1T+1A) - Rendimiento óptimo 100%'),
(3, 3, 90.00,  '3 personas (1T+2A) - Rendimiento ajustado 90%'),
(4, 4, 80.00,  '4 personas (2T+2A) - Rendimiento ajustado 80%')
ON DUPLICATE KEY UPDATE efficiency_pct = VALUES(efficiency_pct);

-- 8.5 Factores de Dificultad (RN-02)
INSERT INTO difficulty_factors (id, code, name, factor, description, is_active) VALUES
(1, 'NORMAL', 'Estándar / Normal', 1.00, 'Instalación interior en altura estándar (< 3m) con ductería existente', 1),
(2, 'ALTURA_MEDIA', 'Altura > 3.5m o Canaleta Nueva', 1.15, 'Requiere escalera telescópica y tendido de canaleta adosada', 1),
(3, 'CONCRETO_EXT', 'Muro Concreto / Exterior Complejo', 1.25, 'Perforación en concreto armado y tubería EMT/PVC SAP exterior', 1),
(4, 'INDUSTRIAL_ALTA', 'Planta Industrial / Altura > 6m', 1.50, 'Trabajo en altura con andamio normado y protocolos EPP especiales', 1)
ON DUPLICATE KEY UPDATE factor = VALUES(factor);

-- 8.6 Proveedores Mayoristas (Lima, Perú)
INSERT INTO suppliers (id, ruc, name, contact_name, phone, email, is_active) VALUES
(1, '20212331377', 'DELTRON PERÚ S.A.', 'Ejecutivo Mayorista B2B', '(01) 415-0101', 'ventas.corporativas@deltron.com.pe', 1),
(2, '20512345678', 'TECNOSEG S.A.C.', 'Ana Ríos', '998 221 334', 'arios@tecnoseg.pe', 1),
(3, '20498765432', 'INGRAM MICRO PERÚ', 'Luis Vega', '(01) 616-1200', 'peru.networking@ingrammicro.com', 1),
(4, '20384950617', 'ANIXTER PERÚ S.A.C.', 'Claudia Morales', '(01) 712-4400', 'cotizaciones.pe@wesco.com', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 8.7 Catálogo Técnico de Equipos Homologados (Pantalla 16)
INSERT INTO products (id, sku, category, name, brand, description, unit, stock, stock_status, warehouse, image_url, warranty_months, is_active) VALUES
(1, 'HK-DS2CD2183G2', 'cctv', 'Cámara Domo IP 4K AcuSense IR30m IP67', 'HIKVISION', 'Sensor CMOS 1/2.8" Escaneo Progresivo • Lente fijo 2.8mm • PoE 802.3af • Clasificación humana/vehicular IA • Compresión H.265+', 'UND', 24, 'in_stock', 'Lima / Callao', 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=400&q=80', 24, 1),
(2, 'UB-USW-24-POE', 'redes', 'Switch UniFi Gen2 24 Puertos Gigabit PoE+', 'UBIQUITI', '16 Puertos PoE+ IEEE 802.3at/af (95W total) • 2x SFP 1G • Pantalla táctil LCM 1.3" • Rackeable 1U silencioso sin ventilador', 'UND', 8, 'in_stock', 'Lima / Callao', 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=400&q=80', 12, 1),
(3, 'PAN-PUC6ASD04BU', 'redes', 'Bobina Cable UTP Cat6A LSZH 305m Azul', 'PANDUIT', 'Conductor Cobre Sólido 23 AWG • Chaqueta Libre de Halógenos (LSZH) IEC 60332-1 • Certificación 10GBASE-T hasta 100m', 'ROLLO', 45, 'in_stock', 'Lima / Callao', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80', 300, 1),
(4, 'ZK-SPEEDFACE-V5L', 'accesos', 'Terminal Control de Acceso Facial + Huella', 'ZKTECO', 'Pantalla táctil 5" • Reconocimiento facial luz visible anti-spoofing • Capacidad 6,000 rostros / 10,000 huellas • TCP/IP, Wiegand, RS485', 'UND', 2, 'critical', 'Lima / Callao', 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=400&q=80', 24, 1),
(5, 'EMT-CONDUIT-34', 'canalizacion', 'Tubería Metálica EMT 3/4" x 3m Galvanizada UL', 'COLMENA', 'Acero galvanizado en caliente ANSI C80.3 • Alta protección mecánica y electromagnética para cableado estructurado e industrial', 'TUBO', 180, 'in_stock', 'Lima / Callao', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80', 60, 1),
(6, 'FLU-LIQ-KIT', 'herramientas', 'Kit Consumibles Fijación & Etiquetado Termocontraíble', 'PANDUIT', 'Cintillos nylon UV 4.8x200mm + Tarugos Fischer SX8 + Cinta vulcanizante 3M 23 + Cartucho etiquetas termocontraíbles TIA-606-C', 'KIT', 32, 'in_stock', 'Lima / Callao', 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=400&q=80', 12, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name), stock = VALUES(stock), stock_status = VALUES(stock_status);

-- 8.8 Ofertas Mayoristas por Producto (RN-01)
INSERT INTO supplier_offers (id, product_id, supplier_id, supplier_sku, currency, unit_cost, valid_from, valid_until, is_preferred, is_active) VALUES
(1, 1, 1, 'DEL-DS2CD2183G2', 'USD', 84.8000, '2026-01-01', '2026-12-31', 1, 1),
(2, 1, 2, 'TSEG-2183G2-4K', 'USD', 88.5000, '2026-01-01', '2026-12-31', 0, 1),
(3, 2, 3, 'ING-USW-24-POE', 'USD', 341.3300, '2026-01-01', '2026-12-31', 1, 1),
(4, 3, 4, 'ANX-PUC6ASD04BU', 'USD', 180.0000, '2026-01-01', '2026-12-31', 1, 1),
(5, 4, 2, 'TSEG-SPEEDFACE-V5L', 'USD', 250.6700, '2026-01-01', '2026-12-31', 1, 1),
(6, 5, 1, 'DEL-EMT-34', 'PEN', 24.5000, '2026-01-01', '2026-12-31', 1, 1),
(7, 6, 1, 'DEL-KIT-CONS', 'PEN', 118.0000, '2026-01-01', '2026-12-31', 1, 1)
ON DUPLICATE KEY UPDATE unit_cost = VALUES(unit_cost), is_preferred = VALUES(is_preferred);

-- 8.9 Ensamblajes / Kits de Instalación
INSERT INTO assemblies (id, code, name, category, unit, hours_cabling, hours_mounting, hours_config, reference_cost_per_point, fixed_supplies_cost_pen, is_active) VALUES
(1, 'ASM-CAM-EXT', 'Punto de cámara IP Bullet 4MP exterior', 'cctv', 'PUNTO', 1.00, 2.00, 0.50, 70.00, 223.50, 1),
(2, 'ASM-AP', 'Punto Access Point Wi-Fi 6', 'redes', 'PUNTO', 0.80, 1.25, 0.60, 55.00, 315.00, 1),
(3, 'ASM-NVR', 'Grabador NVR 8 canales + HDD 2TB', 'cctv', 'UND', 0.20, 0.50, 1.50, 80.00, 680.00, 1),
(4, 'ASM-SW8', 'Switch PoE+ 8 puertos en gabinete', 'redes', 'UND', 0.20, 0.50, 1.00, 55.00, 342.00, 1),
(5, 'ASM-VP-CASA', 'Kit videoportero IP residencial', 'videoportero', 'KIT', 0.20, 1.00, 1.00, 90.00, 580.00, 1),
(6, 'ASM-BIO-ACC', 'Punto Control de Acceso Biométrico Facial + Electroimán', 'accesos', 'PUNTO', 1.20, 2.50, 1.00, 95.00, 1120.00, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name), fixed_supplies_cost_pen = VALUES(fixed_supplies_cost_pen);

-- 8.10 Servicios de Mantenimiento Recurrente
INSERT INTO services (id, code, name, periodicity, scope_description, estimated_hours, supplies_cost_pen, reference_price_pen, is_active) VALUES
(1, 'MANT-SEM', 'Mantenimiento preventivo semestral', 'semestral', 'Limpieza óptica de lentes, ajuste de conectores RJ45, verificación de disco duro NVR y respaldo de configuración.', 3.50, 45.00, 250.00, 1),
(2, 'MANT-ANU', 'Mantenimiento anual + limpieza profunda', 'anual', 'Certificación de puntos de red, cambio de conectores sulfatados, actualización de firmware y pruebas de respaldo UPS.', 7.00, 90.00, 420.00, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name), reference_price_pen = VALUES(reference_price_pen);

-- 8.11 Cartera de Clientes (19 Clientes Corporativos y Residenciales en Lima)
INSERT INTO customers (id, document_type, document_number, business_name, contact_name, phone, email, fiscal_address, district, created_by) VALUES
(1,  'DNI', '10293847',    'Familia Quispe', 'Sr. Alberto Quispe', '999 111 222', 'aquispe@mail.pe', 'Av. Primavera 1240, Surco, Lima', 'Residencial - Surco', 3),
(2,  'RUC', '20556677881', 'Condominio Las Torres', 'Junta de Propietarios', '988 777 666', 'admin@lastorres.pe', 'Calle Los Pinos 450, San Isidro, Lima', 'Junta Propietarios - San Isidro', 2),
(3,  'RUC', '20443322119', 'Edificio Panorama', 'Lic. Rosa Méndez', '977 666 555', 'gerencia@panorama.pe', 'Malecón Balta 820, Miraflores, Lima', 'Corporativo - Miraflores', 4),
(4,  'RUC', '20112233445', 'Clínica San Rafael', 'Dra. Claudia Benavides', '966 555 444', 'logistica@sanrafael.pe', 'Av. Javier Prado Este 2110, San Borja, Lima', 'Salud - San Borja', 2),
(5,  'RUC', '20334455667', 'Almacenes del Sur', 'Ing. Pedro Salazar', '955 444 333', 'compras@almacenesdelsur.pe', 'Panamericana Sur Km 19, Villa El Salvador, Lima', 'Logística - Villa El Salvador', 3),
(6,  'RUC', '20778899001', 'Edificio Mirador', 'Arq. Roberto Gómez', '944 333 222', 'obras@mirador.pe', 'Av. Del Ejército 1820, Magdalena, Lima', 'Inmobiliaria - Magdalena', 4),
(7,  'RUC', '20998877665', 'Colegio Los Cedros', 'Hna. Carmen Vargas', '933 222 111', 'direccion@loscedros.edu.pe', 'Av. La Fontana 980, La Molina, Lima', 'Educación - La Molina', 2),
(8,  'DNI', '09876543',    'Residencia La Molina', 'Arq. Fernando Belaunde', '922 111 000', 'fbelaunde@estudio.pe', 'Calle Las Palmeras 320, La Molina, Lima', 'Residencial - La Molina', 3),
(9,  'RUC', '20100070970', 'Supermercados Peruanos S.A.', 'Ing. Luis Ríos', '911 222 333', 'mantenimiento@spsa.pe', 'Calle Morelli 181, San Borja, Lima', 'Retail - Surco', 3),
(10, 'RUC', '20304050601', 'Hotel Costa del Sol Miraflores', 'Lic. Diana Castro', '912 345 678', 'operaciones@costadelsol.pe', 'Av. José Pardo 780, Miraflores, Lima', 'Hotelería - Miraflores', 2),
(11, 'RUC', '20506070809', 'Centro Empresarial San Isidro', 'Ing. Martín Soto', '913 456 789', 'infraestructura@cesi.pe', 'Av. Rivera Navarrete 750, San Isidro, Lima', 'Corporativo - San Isidro', 4),
(12, 'RUC', '20141516178', 'Laboratorios ROE Surco', 'Dra. Patricia Luna', '914 567 890', 'calidad@labroe.com', 'Av. Caminos del Inca 1420, Surco, Lima', 'Salud - Surco', 3),
(13, 'RUC', '20109876543', 'Universidad Pacífico - Pabellón B', 'Ing. César Torres', '915 678 901', 'ti@up.edu.pe', 'Av. Salaverry 2020, Jesús María, Lima', 'Educación - Jesús María', 2),
(14, 'RUC', '20609080701', 'Planta Textil Ate Vitarte', 'Ing. Hugo Chávez', '916 789 012', 'planta@textilate.pe', 'Av. Nicolás Ayllón 3410, Ate, Lima', 'Industrial - Ate', 4),
(15, 'RUC', '20554433221', 'Concesionario Automotriz Surquillo', 'Ing. Mario Paz', '923 456 789', 'seguridad@autosurquillo.pe', 'Av. República de Panamá 4210, Surquillo, Lima', 'Comercial - Surquillo', 3),
(16, 'RUC', '20113355779', 'Colegio Markham Monterrico', 'Lic. Andrew Paul', '924 567 890', 'facilities@markham.edu.pe', 'Calle Augusto Angulo 291, Surco, Lima', 'Educación - Surco', 2),
(17, 'RUC', '20446688002', 'Notaría Gálvez - San Borja', 'Dr. Raúl Gálvez', '925 678 901', 'administracion@notariagalvez.pe', 'Av. Aviación 2840, San Borja, Lima', 'Legal - San Borja', 4),
(18, 'RUC', '20224466880', 'Restaurante La Mar Miraflores', 'Chef Gastón Polar', '926 789 012', 'operaciones@lamar.pe', 'Av. La Mar 770, Miraflores, Lima', 'Gastronomía - Miraflores', 3),
(19, 'RUC', '20887766554', 'Terminal Logístico Callao S.A.C.', 'Ing. Jorge Merino', '927 890 123', 'seguridad@terminallogistico.pe', 'Av. Gambetta Km 8.5, Callao', 'Portuario - Callao', 3),
(20, 'RUC', '20548912304', 'CORPORACIÓN LOGÍSTICA DEL PACÍFICO S.A.C.', 'Ing. Roberto Valdivia', '998 452 110', 'rvaldivia@corplogistica.com.pe', 'Av. Los Eucaliptos Mz. D Lt. 14 - Zona Industrial Lurín', 'Industrial - Lurín', 3)
ON DUPLICATE KEY UPDATE business_name = VALUES(business_name), district = VALUES(district);

-- 8.12 Proyectos de Instalación Técnica
INSERT INTO projects (id, customer_id, name, property_type, floors, installation_address, district, city, site_notes, created_by) VALUES
(1,  1,  'Red Mesh Wi-Fi 6 (Casa 2 pisos)', 'casa', 2, 'Av. Primavera 1240, Surco', 'Surco', 'Lima', '8 puntos UTP Cat6 + 3 Nodos', 3),
(2,  2,  'CCTV IP 16 Cámaras Exteriores', 'edificio', 8, 'Calle Los Pinos 450, San Isidro', 'San Isidro', 'Lima', 'NVR 32ch + PoE + Poste', 2),
(3,  3,  'Control de Acceso Biométrico', 'edificio', 12, 'Malecón Balta 820, Miraflores', 'Miraflores', 'Lima', '4 Torniquetes + Lectores QR', 4),
(4,  4,  'Cableado Estructurado Cat6A (48 pts)', 'edificio', 6, 'Av. Javier Prado Este 2110, San Borja', 'San Borja', 'Lima', '2 Gabinetes 42RU + Certificación', 2),
(5,  5,  'Cerco Eléctrico Perimetral 240m', 'planta_industrial', 1, 'Panamericana Sur Km 19, Villa El Salvador', 'Villa El Salvador', 'Lima', 'Energizador + 8 Zonas Alarma', 3),
(6,  6,  'Videoportero IP Multifamiliar', 'edificio', 14, 'Av. Del Ejército 1820, Magdalena', 'Magdalena', 'Lima', '42 Monitores 7" + Placa Calle', 4),
(7,  7,  'Cobertura Wi-Fi Campus + Fibra', 'edificio', 3, 'Av. La Fontana 980, La Molina', 'La Molina', 'Lima', '18 APs Outdoor + Enlace OM4', 2),
(8,  8,  'Domótica e Intrusión Perimetral', 'casa', 2, 'Calle Las Palmeras 320, La Molina', 'La Molina', 'Lima', '12 Cámaras AcuSense + Cerco', 3),
(9,  9,  'Modernización CCTV IP Tienda Higuereta', 'local_comercial', 2, 'Av. Benavides 4800, Surco', 'Surco', 'Lima', '32 Domos 4K + Analítica Retail', 3),
(10, 10, 'Red Wi-Fi 6 Roaming Pisos 3 al 7', 'edificio', 7, 'Av. José Pardo 780, Miraflores', 'Miraflores', 'Lima', '14 Access Points UniFi Pro', 2),
(11, 11, 'Backbone Fibra Óptica OM4 + Gabinetes', 'edificio', 15, 'Av. Rivera Navarrete 750, San Isidro', 'San Isidro', 'Lima', '64 Puntos Cat6A Panduit', 4),
(12, 12, 'Control de Acceso Esclusas Laboratorio', 'oficina', 3, 'Av. Caminos del Inca 1420, Surco', 'Surco', 'Lima', '3 Lectores Faciales ZKTeco', 3),
(13, 13, 'Renovación Switches PoE+ Aulas Híbridas', 'edificio', 5, 'Av. Salaverry 2020, Jesús María', 'Jesús María', 'Lima', '8 Switches 24p + Cableado', 2),
(14, 14, 'Cámaras Térmicas & Perímetro Industrial', 'planta_industrial', 2, 'Av. Nicolás Ayllón 3410, Ate', 'Ate', 'Lima', '10 Cámaras IP67 + Canalización EMT', 4),
(15, 15, 'CCTV Showroom & Taller Automotriz', 'local_comercial', 2, 'Av. República de Panamá 4210, Surquillo', 'Surquillo', 'Lima', '24 Cámaras Domo + NVR 4K', 3),
(16, 16, 'Cobertura Wi-Fi 6 Pabellón Secundaria', 'edificio', 3, 'Calle Augusto Angulo 291, Surco', 'Surco', 'Lima', '22 Access Points + PoE+', 2),
(17, 17, 'Biometría y Bóveda Documentaria', 'oficina', 2, 'Av. Aviación 2840, San Borja', 'San Borja', 'Lima', '6 Puertas + Registro Asistencia', 4),
(18, 18, 'Cámaras IP Cocina y Salón Principal', 'local_comercial', 2, 'Av. La Mar 770, Miraflores', 'Miraflores', 'Lima', '8 Domos Audio Bidireccional', 3),
(19, 19, 'Anillo Fibra Óptica Patio Contenedores', 'planta_industrial', 1, 'Av. Gambetta Km 8.5, Callao', 'Callao', 'Callao', 'Tendido Subterráneo 480m + 4 Nodos', 3),
(20, 20, 'Implementación CCTV IP + Fibra Óptica Almacén Central Lurín', 'planta_industrial', 3, 'Av. Los Eucaliptos Mz. D Lt. 14 - Zona Industrial Lurín', 'Lurín', 'Lima', 'Trabajos en altura 6m con SCTR', 3)
ON DUPLICATE KEY UPDATE name = VALUES(name), site_notes = VALUES(site_notes);

-- 8.13 Proformas Multimensuales (Junio, Mayo y Abril 2026)
INSERT INTO quotes (
    id, code, version, customer_id, project_id, seller_id, period_key, status, currency, exchange_rate_used,
    validity_days, valid_until, issue_date, crew_technicians, crew_assistants, crew_efficiency_pct,
    labor_method, total_hours_cabling, total_hours_mounting, total_hours_config, total_hours,
    estimated_days, materials_cost_pen, labor_cost_method_a_pen, labor_cost_method_b_pen,
    labor_cost_applied_pen, travel_cost_pen, direct_cost_pen, overhead_pct, overhead_amount_pen,
    total_cost_pen, target_margin_on_sale_pct, sale_value_before_discount_pen, discount_pct,
    discount_amount_pen, taxable_base_pen, tax_pct, tax_amount_pen, total_with_tax_pen,
    effective_margin_on_sale_pct, requires_approval
) VALUES
-- JUNIO 2026 (jun2026)
(1,  'PF-2026-0001', 1, 1,  1,  3, 'jun2026', 'aceptada',      'PEN', 3.7500, 15, '2026-06-19', '2026-06-04', 1, 1, 100.00, 'max_ab', 6.20, 12.50, 6.70, 25.40, 2.50, 3126.00,  615.00,  575.00,  615.00, 100.00,  3841.00, 8.00,  307.28,  4148.28, 30.00,  5926.11,  0.00,    0.00,  5926.11, 18.00, 1066.70,  6992.81, 30.00, 0),
(2,  'PF-2026-0002', 1, 2,  2,  2, 'jun2026', 'enviada',       'PEN', 3.7500, 15, '2026-06-18', '2026-06-03', 2, 2,  80.00, 'max_ab', 18.00, 24.00, 10.00, 52.00, 5.00, 14200.00, 1800.00, 1750.00, 1800.00, 350.00, 16350.00, 8.00, 1308.00, 17658.00, 30.00, 24110.17,  0.00,    0.00, 24110.17, 18.00, 4339.83, 28450.00, 28.00, 0),
(3,  'PF-2026-0003', 1, 3,  3,  4, 'jun2026', 'borrador',      'PEN', 3.7500, 15, '2026-06-17', '2026-06-02', 1, 1, 100.00, 'max_ab', 10.00, 14.00,  7.00, 31.00, 3.00,  6950.00,  850.00,  690.00,  850.00, 210.00,  8010.00, 8.00,  640.80,  8650.80, 30.00, 12033.90,  0.00,    0.00, 12033.90, 18.00, 2166.10, 14200.00, 28.00, 0),
(4,  'PF-2026-0004', 1, 4,  4,  2, 'jun2026', 'en_aprobacion', 'PEN', 3.7500, 15, '2026-06-16', '2026-06-01', 2, 2,  80.00, 'max_ab', 32.00, 36.00, 16.00, 84.00, 8.00, 21800.00, 2600.00, 2400.00, 2600.00, 560.00, 24960.00, 8.00, 1996.80, 26956.80, 30.00, 36271.19,  0.00,    0.00, 36271.19, 18.00, 6528.81, 42800.00, 22.10, 1),
(5,  'PF-2026-0005', 1, 5,  5,  3, 'jun2026', 'rechazada',     'PEN', 3.7500, 15, '2026-06-15', '2026-06-01', 1, 1, 100.00, 'max_ab', 14.00, 18.00,  6.00, 38.00, 4.00,  9100.00, 1100.00,  920.00, 1100.00, 280.00, 10480.00, 8.00,  838.40, 11318.40, 30.00, 15542.37,  0.00,    0.00, 15542.37, 18.00, 2797.63, 18340.00, 27.99, 0),
(6,  'PF-2026-0006', 1, 6,  6,  4, 'jun2026', 'en_aprobacion', 'PEN', 3.7500, 15, '2026-06-19', '2026-06-04', 2, 1,  90.00, 'max_ab', 20.00, 26.00, 10.00, 56.00, 5.50, 12900.00, 1400.00, 1320.00, 1400.00, 380.00, 14680.00, 8.00, 1174.40, 15854.40, 30.00, 18983.05,  0.00,    0.00, 18983.05, 18.00, 3416.95, 22400.00, 16.50, 1),
(7,  'PF-2026-0007', 1, 7,  7,  2, 'jun2026', 'en_aprobacion', 'PEN', 3.7500, 15, '2026-06-19', '2026-06-04', 2, 2,  80.00, 'max_ab', 24.00, 30.00, 14.00, 68.00, 6.50, 16800.00, 2100.00, 1980.00, 2100.00, 450.00, 19350.00, 8.00, 1548.00, 20898.00, 30.00, 30335.14, 12.00, 3640.22, 26694.92, 18.00, 4805.08, 31500.00, 22.00, 1),
(8,  'PF-2026-0008', 1, 8,  8,  3, 'jun2026', 'en_aprobacion', 'PEN', 3.7500, 15, '2026-06-19', '2026-06-04', 1, 1, 100.00, 'max_ab',  7.00,  9.00,  5.00, 21.00, 2.00,  4500.00, 1200.00,  980.00, 1200.00, 160.00,  5860.00, 8.00,  468.80,  6328.80, 30.00,  8347.46,  0.00,    0.00,  8347.46, 18.00, 1502.54,  9850.00, 24.36, 1),

-- MAYO 2026 (may2026)
(9,  'PF-2026-0091', 1, 9,  9,  3, 'may2026', 'aceptada',      'PEN', 3.7500, 15, '2026-06-13', '2026-05-29', 2, 2,  80.00, 'max_ab', 22.00, 28.00, 12.00, 62.00, 6.00, 17200.00, 2200.00, 2050.00, 2200.00, 420.00, 19820.00, 8.00, 1585.60, 21405.60, 30.00, 29830.51,  0.00,    0.00, 29830.51, 18.00, 5369.49, 35200.00, 28.15, 0),
(10, 'PF-2026-0090', 1, 10, 10, 2, 'may2026', 'aceptada',      'PEN', 3.7500, 15, '2026-06-08', '2026-05-24', 1, 1, 100.00, 'max_ab', 12.00, 15.00,  8.00, 35.00, 3.50,  9400.00, 1200.00, 1100.00, 1200.00, 250.00, 10850.00, 8.00,  868.00, 11718.00, 30.00, 16343.83,  2.00,  326.88, 16016.95, 18.00, 2883.05, 18900.00, 28.09, 0),
(11, 'PF-2026-0089', 1, 11, 11, 4, 'may2026', 'enviada',       'PEN', 3.7500, 15, '2026-06-03', '2026-05-19', 2, 2,  80.00, 'max_ab', 28.00, 34.00, 16.00, 78.00, 7.50, 22100.00, 2800.00, 2600.00, 2800.00, 540.00, 25440.00, 8.00, 2035.20, 27475.20, 30.00, 37796.61,  0.00,    0.00, 37796.61, 18.00, 6803.39, 44600.00, 28.04, 0),
(12, 'PF-2026-0088', 1, 12, 12, 3, 'may2026', 'aceptada',      'PEN', 3.7500, 15, '2026-05-29', '2026-05-14', 1, 1, 100.00, 'max_ab',  8.00, 10.00,  6.00, 24.00, 2.50,  6200.00,  800.00,  720.00,  800.00, 180.00,  7180.00, 8.00,  574.40,  7754.40, 30.00, 10805.08,  0.00,    0.00, 10805.08, 18.00, 1944.92, 12750.00, 28.22, 0),
(13, 'PF-2026-0087', 1, 13, 13, 2, 'may2026', 'en_aprobacion', 'PEN', 3.7500, 15, '2026-05-26', '2026-05-11', 2, 1,  90.00, 'max_ab', 16.00, 22.00, 10.00, 48.00, 5.00, 15400.00, 1750.00, 1600.00, 1750.00, 360.00, 17510.00, 8.00, 1400.80, 18910.80, 30.00, 25237.47,  9.00, 2271.37, 22966.10, 18.00, 4133.90, 27100.00, 17.80, 1),
(14, 'PF-2026-0086', 1, 14, 14, 4, 'may2026', 'en_aprobacion', 'PEN', 3.7500, 15, '2026-05-21', '2026-05-06', 1, 1, 100.00, 'max_ab', 12.00, 16.00,  8.00, 36.00, 4.00,  9800.00, 1150.00, 1050.00, 1150.00, 280.00, 11230.00, 8.00,  898.40, 12128.40, 30.00, 17372.88, 10.00, 1737.29, 15635.59, 18.00, 2814.41, 18450.00, 21.50, 1),

-- ABRIL 2026 (abr2026)
(15, 'PF-2026-0065', 1, 15, 15, 3, 'abr2026', 'aceptada',      'PEN', 3.7500, 15, '2026-05-13', '2026-04-28', 1, 1, 100.00, 'max_ab', 15.00, 19.00, 10.00, 44.00, 4.50, 11900.00, 1500.00, 1380.00, 1500.00, 320.00, 13720.00, 8.00, 1097.60, 14817.60, 30.00, 20593.22,  0.00,    0.00, 20593.22, 18.00, 3706.78, 24300.00, 28.16, 0),
(16, 'PF-2026-0064', 1, 16, 16, 2, 'abr2026', 'enviada',       'PEN', 3.7500, 15, '2026-05-07', '2026-04-22', 2, 1,  90.00, 'max_ab', 18.00, 24.00, 12.00, 54.00, 5.50, 15300.00, 1950.00, 1800.00, 1950.00, 400.00, 17650.00, 8.00, 1412.00, 19062.00, 30.00, 26355.93,  0.00,    0.00, 26355.93, 18.00, 4744.07, 31100.00, 27.70, 0),
(17, 'PF-2026-0063', 1, 17, 17, 4, 'abr2026', 'aceptada',      'PEN', 3.7500, 15, '2026-05-02', '2026-04-17', 1, 1, 100.00, 'max_ab', 10.00, 12.00,  7.00, 29.00, 3.00,  7900.00,  980.00,  890.00,  980.00, 240.00,  9120.00, 8.00,  729.60,  9849.60, 30.00, 13728.81,  0.00,    0.00, 13728.81, 18.00, 2471.19, 16200.00, 28.04, 0),
(18, 'PF-2026-0062', 1, 18, 18, 3, 'abr2026', 'rechazada',     'PEN', 3.7500, 15, '2026-04-26', '2026-04-11', 1, 1, 100.00, 'max_ab',  6.00,  9.00,  5.00, 20.00, 2.00,  5400.00,  700.00,  640.00,  700.00, 160.00,  6260.00, 8.00,  500.80,  6760.80, 30.00,  9533.90,  0.00,    0.00,  9533.90, 18.00, 1716.10, 11250.00, 27.80, 0),
(19, 'PF-2026-0061', 1, 19, 19, 3, 'abr2026', 'en_aprobacion', 'PEN', 3.7500, 15, '2026-04-20', '2026-04-05', 2, 2,  80.00, 'max_ab', 24.00, 30.00, 14.00, 68.00, 6.50, 21400.00, 2400.00, 2200.00, 2400.00, 480.00, 24280.00, 8.00, 1942.40, 26222.40, 30.00, 34451.00,  8.00, 2756.08, 31694.92, 18.00, 5705.08, 37400.00, 17.20, 1)
ON DUPLICATE KEY UPDATE status = VALUES(status), total_with_tax_pen = VALUES(total_with_tax_pen);

INSERT INTO quote_sequences (year, last_number) VALUES (2026, 91)
ON DUPLICATE KEY UPDATE last_number = VALUES(last_number);

-- 8.14 Cola de Aprobaciones de Gerencia (Junio, Mayo y Abril 2026)
INSERT INTO quote_approvals (id, quote_id, requested_by, requested_reason, detail_reason, status, requested_at) VALUES
(1, 6,  4, 'Motivo: Margen bajo el mínimo',       'Margen propuesto 16.5% vs meta corporativa mín. 20.0% (-3.5% delta).', 'pendiente', '2026-06-04 09:15:00'),
(2, 7,  2, 'Motivo: Descuento comercial excedido', 'Descuento de 12.0% solicitado por cliente corporativo (tope asesor: 5.0%).', 'pendiente', '2026-06-04 10:30:00'),
(3, 8,  3, 'Motivo: Desviación M.O. > 15%',        'Discrepancia entre método por punto vs cuadrilla técnica por día (+18.2% costo cuadrilla).', 'pendiente', '2026-06-04 11:45:00'),
(4, 13, 2, 'Motivo: Margen bajo el mínimo',       'Margen propuesto 17.8% en proyecto educativo vs mínimo requerido 20.0%.', 'pendiente', '2026-05-11 14:20:00'),
(5, 14, 4, 'Motivo: Descuento comercial excedido', 'Descuento especial de 10.0% por renovación de planta industrial (tope: 5.0%).', 'pendiente', '2026-05-06 16:10:00'),
(6, 19, 3, 'Motivo: Margen y Descuento Especial',  'Margen 17.2% con descuento corporativo de 8.0% en licitación portuaria Callao.', 'pendiente', '2026-04-05 12:00:00')
ON DUPLICATE KEY UPDATE status = VALUES(status), detail_reason = VALUES(detail_reason);

-- 8.15 Visitas Técnicas y Órdenes de Trabajo
INSERT INTO site_visits (id, project_id, technician_id, visit_date, status, general_observations, risks_detected) VALUES
(1, 1, 4, '2026-06-03 09:00:00', 'completada', 'Casa residencial de 2 pisos, ductería EMT existente en primer piso.', 'Muro exterior frontal requiere broca copa para concreto armado.')
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO work_orders (id, quote_id, code, lead_technician_id, scheduled_start_date, scheduled_end_date, actual_start_date, actual_end_date, status, actual_materials_cost_pen, actual_hours_worked, actual_labor_cost_pen, actual_travel_cost_pen, closure_notes) VALUES
(1, 1, 'OT-2026-0001', 4, '2026-06-18', '2026-06-20', '2026-06-18', '2026-06-20', 'finalizada', 3100.00, 17.50, 350.00, 100.00, 'Instalación entregada conforme con acta y pruebas de enlace.')
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- 8.16 Liquidación Fiscal SUNAT y Detracciones SPOT Banco de la Nación (Pantalla 18)
INSERT INTO sunat_settlements (id, voucher_code, quote_code, customer_name, customer_ruc, issue_date, period_key, advisor_name, subtotal_pen, igv_pen, spot_pen, total_pen, sunat_status, sunat_status_label) VALUES
(1, 'F001-0004289', 'PRO-2026-0891', 'MINERA CHINALCO PERÚ S.A.',           '20512805419', '2026-10-14', 'ytd-2026', 'Carlos Mendoza',  68500.00, 12330.00, 3233.20,  80830.00, 'cdr_accepted',    'Aceptada CDR'),
(2, 'F001-0004290', 'PRO-2026-0894', 'ALMACENES CENTRALES HUACHIPA S.A.C.', '20547896321', '2026-10-15', 'ytd-2026', 'Ana Paredes',     34200.00,  6156.00, 1614.24,  40356.00, 'cdr_accepted',    'Aceptada CDR'),
(3, 'F001-0004291', 'PRO-2026-0898', 'CLÍNICA SAN PABLO SURCO S.A.',        '20107463705', '2026-10-17', 'q2-2026',  'Jorge Salas',     69830.50, 12569.49, 3296.00,  82399.99, 'spot_pending',    'SPOT Pendiente BN'),
(4, 'F001-0004292', 'PRO-2026-0902', 'BANCO INTERBANK SEDE CORP.',          '20100053455', '2026-10-18', 'jun2026',  'Roberto Sánchez', 112400.00, 20232.00, 5305.28, 132632.00, 'cdr_accepted',    'Aceptada CDR'),
(5, 'F001-0004293', 'PF-2026-0091',  'SUPERMERCADOS PERUANOS S.A.',         '20100070970', '2026-05-29', 'q2-2026',  'Carlos Mendoza',  29830.51,  5369.49, 1408.00,  35200.00, 'cdr_accepted',    'Aceptada CDR'),
(6, 'F001-0004294', 'PF-2026-0065',  'CONCESIONARIO AUTOMOTRIZ SURQUILLO',  '20554433221', '2026-04-28', 'q1-2026',  'Carlos Mendoza',  20593.22,  3706.78,  972.00,  24300.00, 'pending_payment', 'Por Cobrar')
ON DUPLICATE KEY UPDATE sunat_status = VALUES(sunat_status), sunat_status_label = VALUES(sunat_status_label);

-- 8.17 Identidad Corporativa, Logos, RUC, Cuentas Bancarias CCI y Marcas en PDF
CREATE TABLE IF NOT EXISTS company_settings (
    id TINYINT UNSIGNED PRIMARY KEY DEFAULT 1,
    business_name VARCHAR(200) NOT NULL,
    trade_name VARCHAR(100) NOT NULL DEFAULT 'PROFORMAS',
    trade_subtitle VARCHAR(100) NOT NULL DEFAULT 'Instalaciones PE',
    short_code VARCHAR(20) NOT NULL DEFAULT 'INST-PE',
    tagline VARCHAR(255) NULL,
    ruc VARCHAR(20) NOT NULL,
    sunat_badge VARCHAR(100) NULL DEFAULT 'Homologado SUNAT UBL 2.1',
    fiscal_address VARCHAR(255) NOT NULL,
    phone VARCHAR(60) NULL,
    whatsapp VARCHAR(60) NULL,
    email VARCHAR(180) NULL,
    website VARCHAR(180) NULL,
    logo_url LONGTEXT NULL,
    signature_url LONGTEXT NULL,
    primary_color VARCHAR(20) NOT NULL DEFAULT '#041533',
    accent_color VARCHAR(20) NOT NULL DEFAULT '#ff6b1a',
    document_control_code VARCHAR(200) NULL,
    spot_bank_name VARCHAR(120) NOT NULL DEFAULT 'Banco de la Nación',
    spot_account_number VARCHAR(60) NOT NULL DEFAULT '00-019-382910',
    spot_code_label VARCHAR(100) NOT NULL DEFAULT 'Cód. 022 / 037 SUNAT',
    spot_pct DECIMAL(5,2) NOT NULL DEFAULT 4.00,
    default_warranty_text TEXT NULL,
    footer_title VARCHAR(255) NULL,
    footer_subtitle VARCHAR(255) NULL,
    certifications_json JSON NULL,
    bank_accounts_json JSON NULL,
    camera_brands_json JSON NULL,
    network_brands_json JSON NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO company_settings (
    id, business_name, trade_name, trade_subtitle, short_code, tagline, ruc, sunat_badge,
    fiscal_address, phone, whatsapp, email, website, primary_color, accent_color,
    document_control_code, spot_bank_name, spot_account_number, spot_code_label, spot_pct,
    default_warranty_text, footer_title, footer_subtitle, certifications_json, bank_accounts_json,
    camera_brands_json, network_brands_json
) VALUES (
    1,
    'PRECISION SYSTEMS INSTALACIONES S.A.C.',
    'PROFORMAS',
    'Instalaciones PE',
    'INST-PE',
    'Ingeniería de Redes, Fibra Óptica, CCTV IP & Seguridad Electrónica Corporativa',
    '20601234567',
    'Homologado SUNAT UBL 2.1',
    'Av. Javier Prado Este 4520, Of. 802, Santiago de Surco — Lima, Perú',
    '(01) 715-8400',
    '+51 998 452 110',
    'ingenieria@instalacionespe.com.pe',
    'www.instalacionespe.com.pe',
    '#041533',
    '#ff6b1a',
    'Formato Corporativo Homologado FO-COM-042 Rev. 04 · Sistema Integrado de Gestión ISO 9001',
    'Banco de la Nación',
    '00-019-382910',
    'Cód. 022 / 037 SUNAT',
    4.00,
    '24 meses de garantía comercial en equipamiento activo y cámaras IP, 12 meses en mano de obra de instalación y hasta 15 años en cableado estructurado certificado.',
    'Ecosistema de Marcas Homologadas · Partners Oficiales de Redes, Fibra Óptica y Cámaras de Seguridad IP',
    'Equipamiento 100% Original con Garantía Oficial de Fábrica en Perú',
    '["ISO 9001:2015", "ANSI/TIA-568.2-D", "CNE-Utilización / INDECI", "Personal con SCTR Vigente"]',
    '[{"bank":"BCP Banco de Crédito","currency":"Soles (PEN S/)","account_number":"194-2489102-0-45","cci":"002-19400248910204591"},{"bank":"BCP Banco de Crédito","currency":"Dólares (USD $)","account_number":"194-2489108-1-52","cci":"002-19400248910815298"},{"bank":"BBVA Perú","currency":"Soles (PEN S/)","account_number":"0011-0342-0100048291","cci":"011-342-000100048291-75"}]',
    '[{"name":"HIKVISION","sub":"Platinum Partner","accent":"#d9232e","prefix":"HIK","suffix":"VISION","prefixColor":"#d9232e","suffixColor":"#041533","logo_url":""},{"name":"DAHUA","sub":"Technology","accent":"#005bac","prefix":"a","suffix":"hua","prefixColor":"#e60012","suffixColor":"#041533","logo_url":""},{"name":"AXIS","sub":"Communications","accent":"#ffcc00","prefix":"AXIS","suffix":"","prefixColor":"#041533","suffixColor":"#041533","logo_url":""},{"name":"HANWHA","sub":"Wisenet Vision","accent":"#f37321","prefix":"HANWHA","suffix":"","prefixColor":"#f37321","suffixColor":"#041533","logo_url":""},{"name":"UNV","sub":"Uniview IP","accent":"#0066b3","prefix":"UNV","suffix":"","prefixColor":"#0066b3","suffixColor":"#041533","logo_url":""},{"name":"EZVIZ","sub":"Smart Security","accent":"#ff6b1a","prefix":"EZVIZ","suffix":"","prefixColor":"#041533","suffixColor":"#041533","logo_url":""}]',
    '[{"name":"CISCO","sub":"Enterprise Partner","accent":"#049fd9","color":"#049fd9","logo_url":""},{"name":"UBIQUITI","sub":"UniFi Enterprise","accent":"#0559c9","color":"#0559c9","logo_url":""},{"name":"MikroTik","sub":"Certified Routing","accent":"#293239","color":"#293239","logo_url":""},{"name":"PANDUIT","sub":"NetKey / TX6A","accent":"#0085ad","color":"#004f6e","logo_url":""},{"name":"COMMSCOPE","sub":"AMP / Systimax","accent":"#0072ce","color":"#0072ce","logo_url":""},{"name":"ARUBA","sub":"HPE Networking","accent":"#ff8300","color":"#ff8300","logo_url":""},{"name":"OMADA","sub":"TP-Link Business","accent":"#4acbd6","color":"#041533","logo_url":""},{"name":"FLUKE","sub":"Networks Cert.","accent":"#ffc20e","color":"#041533","logo_url":""}]'
) ON DUPLICATE KEY UPDATE business_name = VALUES(business_name), ruc = VALUES(ruc), camera_brands_json = VALUES(camera_brands_json), network_brands_json = VALUES(network_brands_json);

SET FOREIGN_KEY_CHECKS = 1;
-- =============================================================================
-- FIN DEL SCRIPT DE DESPLIEGUE A PRODUCCIÓN
-- =============================================================================
