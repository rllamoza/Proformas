-- =============================================================================
-- MIGRACIÓN DELTA 003: PERSONALIZACIÓN DE EMPRESA, LOGOS, RUC, BANCOS Y MARCAS PDF
-- Motor: MySQL 8.0+ / MariaDB 10.6+ | InnoDB | utf8mb4_unicode_ci
-- =============================================================================

USE proformas_db;

SET NAMES utf8mb4;

-- 1. Tabla de Identidad Corporativa, Logos, RUC, Cuentas CCI y Marcas del Pie de Página PDF
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
    logo_url LONGTEXT NULL COMMENT 'URL o imagen Base64 del logotipo principal de la empresa',
    signature_url LONGTEXT NULL COMMENT 'URL o imagen Base64 de la firma y sello digital autorizado',
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
    updated_by BIGINT UNSIGNED NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_company_settings_user FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Datos iniciales por defecto (Idempotente)
INSERT INTO company_settings (
    id,
    business_name,
    trade_name,
    trade_subtitle,
    short_code,
    tagline,
    ruc,
    sunat_badge,
    fiscal_address,
    phone,
    whatsapp,
    email,
    website,
    logo_url,
    signature_url,
    primary_color,
    accent_color,
    document_control_code,
    spot_bank_name,
    spot_account_number,
    spot_code_label,
    spot_pct,
    default_warranty_text,
    footer_title,
    footer_subtitle,
    certifications_json,
    bank_accounts_json,
    camera_brands_json,
    network_brands_json
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
    '',
    '',
    '#041533',
    '#ff6b1a',
    'Formato Corporativo Homologado FO-COM-042 Rev. 04 · Sistema Integrado de Gestión ISO 9001',
    'Banco de la Nación',
    '00-019-382910',
    'Cód. 022 / 037 SUNAT',
    4.00,
    '24 meses de garantía comercial directa en equipamiento activo y cámaras IP por defectos de fábrica, 12 meses en mano de obra de instalación y hasta 15 años en cableado estructurado certificado. SLA de atención en sitio < 8 horas.',
    'Ecosistema de Marcas Homologadas · Partners Oficiales de Redes, Fibra Óptica y Cámaras de Seguridad IP',
    'Equipamiento 100% Original con Garantía Oficial de Fábrica en Perú',
    JSON_ARRAY(
        'ISO 9001:2015',
        'ANSI/TIA-568.2-D',
        'CNE-Utilización / INDECI',
        'Personal con SCTR Vigente'
    ),
    JSON_ARRAY(
        JSON_OBJECT('bank', 'BCP Banco de Crédito', 'currency', 'Soles (PEN S/)', 'account_number', '194-2489102-0-45', 'cci', '002-19400248910204591'),
        JSON_OBJECT('bank', 'BCP Banco de Crédito', 'currency', 'Dólares (USD $)', 'account_number', '194-2489108-1-52', 'cci', '002-19400248910815298'),
        JSON_OBJECT('bank', 'BBVA Perú', 'currency', 'Soles (PEN S/)', 'account_number', '0011-0342-0100048291', 'cci', '011-342-000100048291-75')
    ),
    JSON_ARRAY(
        JSON_OBJECT('name', 'HIKVISION', 'sub', 'Platinum Partner', 'accent', '#d9232e', 'prefix', 'HIK', 'suffix', 'VISION', 'prefixColor', '#d9232e', 'suffixColor', '#041533', 'logo_url', ''),
        JSON_OBJECT('name', 'DAHUA', 'sub', 'Technology', 'accent', '#005bac', 'prefix', 'a', 'suffix', 'hua', 'prefixColor', '#e60012', 'suffixColor', '#041533', 'logo_url', ''),
        JSON_OBJECT('name', 'AXIS', 'sub', 'Communications', 'accent', '#ffcc00', 'prefix', 'AXIS', 'suffix', '', 'prefixColor', '#041533', 'suffixColor', '#041533', 'logo_url', ''),
        JSON_OBJECT('name', 'HANWHA', 'sub', 'Wisenet Vision', 'accent', '#f37321', 'prefix', 'HANWHA', 'suffix', '', 'prefixColor', '#f37321', 'suffixColor', '#041533', 'logo_url', ''),
        JSON_OBJECT('name', 'UNV', 'sub', 'Uniview IP', 'accent', '#0066b3', 'prefix', 'UNV', 'suffix', '', 'prefixColor', '#0066b3', 'suffixColor', '#041533', 'logo_url', ''),
        JSON_OBJECT('name', 'EZVIZ', 'sub', 'Smart Security', 'accent', '#ff6b1a', 'prefix', 'EZVIZ', 'suffix', '', 'prefixColor', '#041533', 'suffixColor', '#041533', 'logo_url', '')
    ),
    JSON_ARRAY(
        JSON_OBJECT('name', 'CISCO', 'sub', 'Enterprise Partner', 'accent', '#049fd9', 'color', '#049fd9', 'logo_url', ''),
        JSON_OBJECT('name', 'UBIQUITI', 'sub', 'UniFi Enterprise', 'accent', '#0559c9', 'color', '#0559c9', 'logo_url', ''),
        JSON_OBJECT('name', 'MikroTik', 'sub', 'Certified Routing', 'accent', '#293239', 'color', '#293239', 'logo_url', ''),
        JSON_OBJECT('name', 'PANDUIT', 'sub', 'NetKey / TX6A', 'accent', '#0085ad', 'color', '#004f6e', 'logo_url', ''),
        JSON_OBJECT('name', 'COMMSCOPE', 'sub', 'AMP / Systimax', 'accent', '#0072ce', 'color', '#0072ce', 'logo_url', ''),
        JSON_OBJECT('name', 'ARUBA', 'sub', 'HPE Networking', 'accent', '#ff8300', 'color', '#ff8300', 'logo_url', ''),
        JSON_OBJECT('name', 'OMADA', 'sub', 'TP-Link Business', 'accent', '#4acbd6', 'color', '#041533', 'logo_url', ''),
        JSON_OBJECT('name', 'FLUKE', 'sub', 'Networks Cert.', 'accent', '#ffc20e', 'color', '#041533', 'logo_url', '')
    )
) ON DUPLICATE KEY UPDATE
    business_name = VALUES(business_name),
    ruc = VALUES(ruc),
    fiscal_address = VALUES(fiscal_address),
    camera_brands_json = VALUES(camera_brands_json),
    network_brands_json = VALUES(network_brands_json);
