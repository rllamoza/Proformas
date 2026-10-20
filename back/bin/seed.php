<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/Domain/Money.php';
require_once __DIR__ . '/../src/Domain/Hours.php';
require_once __DIR__ . '/../src/Engine/QuoteCalculator.php';
require_once __DIR__ . '/../src/Config/Database.php';

use Proformas\Config\Database;

echo "=== Sembrando Datos Maestros, Clientes y Proformas Multimensuales (Abril, Mayo, Junio 2026) ===\n";

try {
    $pdo = Database::getConnection();
    $pdo->beginTransaction();

    // 1. Usuarios de los 4 roles
    $pwdHash = password_hash('Secret123!', PASSWORD_BCRYPT, ['cost' => 12]);
    $stmtUser = $pdo->prepare(
        "INSERT IGNORE INTO users (id, full_name, email, password_hash, role, phone, is_active) VALUES
        (1, 'Administrador General', 'admin@empresa.pe', :h, 'admin', '+51 999 000 111', 1),
        (2, 'Roberto Sánchez (Gerencia)', 'gerencia@empresa.pe', :h, 'gerencia', '+51 999 000 222', 1),
        (3, 'Carlos Mendoza', 'vendedor@empresa.pe', :h, 'vendedor', '+51 999 000 333', 1),
        (4, 'Jorge Quispe (Técnico Líder)', 'tecnico@empresa.pe', :h, 'tecnico', '+51 999 000 444', 1)"
    );
    $stmtUser->execute([':h' => $pwdHash]);

    // 2. Tipo de cambio vigente Lima, Perú
    $pdo->exec(
        "INSERT IGNORE INTO exchange_rates (id, rate_date, usd_to_pen_buy, usd_to_pen_sell, buffer_pct, source, created_by)
         VALUES (1, '2026-06-04', 3.7200, 3.7500, 0.00, 'SUNAT', 1)"
    );

    // 3. Parámetros de mano de obra y financieros por defecto
    $pdo->exec(
        "INSERT IGNORE INTO labor_params (
            id, technician_day_cost_pen, assistant_day_cost_pen, effective_hours_per_day,
            buffer_pct, default_travel_cost_per_day_pen, default_overhead_pct,
            default_margin_on_sale_pct, min_margin_on_sale_pct, seller_max_discount_pct,
            tax_pct, default_labor_method, default_validity_days, updated_by
        ) VALUES (
            1, 140.00, 90.00, 7.00, 15.00, 40.00, 8.00, 30.00, 20.00, 5.00, 18.00, 'max_ab', 15, 1
        )"
    );

    // 4. Rendimiento de cuadrilla (RN-03)
    $pdo->exec(
        "INSERT IGNORE INTO crew_efficiency (crew_size, efficiency_pct, description) VALUES
        (1, 100.00, '1 persona - Rendimiento base 100%'),
        (2, 100.00, '2 personas (1T+1A) - Rendimiento óptimo 100%'),
        (3, 90.00,  '3 personas (1T+2A) - Rendimiento ajustado 90%'),
        (4, 80.00,  '4 personas (2T+2A) - Rendimiento ajustado 80%')"
    );

    // 5. Factores de dificultad (RN-02)
    $pdo->exec(
        "INSERT IGNORE INTO difficulty_factors (id, code, name, factor, description) VALUES
        (1, 'NORMAL', 'Estándar / Normal', 1.00, 'Instalación interior en altura estándar (< 3m) con ductería existente'),
        (2, 'ALTURA_MEDIA', 'Altura > 3.5m o Canaleta Nueva', 1.15, 'Requiere escalera telescópica y tendido de canaleta adosada'),
        (3, 'CONCRETO_EXT', 'Muro Concreto / Exterior Complejo', 1.25, 'Perforación en concreto armado y tubería EMT/PVC SAP exterior'),
        (4, 'INDUSTRIAL_ALTA', 'Planta Industrial / Altura > 6m', 1.50, 'Trabajo en altura con andamio normado y protocolos EPP especiales')"
    );

    // 6. Clientes corporativos y residenciales (Lima, Perú)
    $pdo->exec(
        "INSERT IGNORE INTO customers (id, document_type, document_number, business_name, contact_name, phone, email, fiscal_address) VALUES
        (1, 'DNI', '10293847', 'Familia Quispe', 'Sr. Alberto Quispe', '999111222', 'aquispe@mail.pe', 'Av. Primavera 1240, Surco, Lima'),
        (2, 'RUC', '20556677881', 'Condominio Las Torres', 'Ing. Marcos Valdivia', '988777666', 'admin@lastorres.pe', 'Calle Los Pinos 450, San Isidro, Lima'),
        (3, 'RUC', '20443322119', 'Edificio Panorama', 'Lic. Rosa Méndez', '977666555', 'gerencia@panorama.pe', 'Malecón Balta 820, Miraflores, Lima'),
        (4, 'RUC', '20112233445', 'Clínica San Rafael', 'Dra. Claudia Benavides', '966555444', 'logistica@sanrafael.pe', 'Av.Javier Prado Este 2110, San Borja, Lima'),
        (5, 'RUC', '20334455667', 'Almacenes del Sur', 'Ing. Pedro Salazar', '955444333', 'compras@almacenesdelsur.pe', 'Panamericana Sur Km 19, Villa El Salvador, Lima'),
        (6, 'RUC', '20778899001', 'Edificio Mirador', 'Arq. Roberto Gómez', '944333222', 'obras@mirador.pe', 'Av. Salaverry 3100, San Isidro, Lima'),
        (7, 'RUC', '20998877665', 'Colegio Los Cedros', 'Hna. Carmen Vargas', '933222111', 'direccion@loscedros.edu.pe', 'Av. La Fontana 980, La Molina, Lima'),
        (8, 'DNI', '09876543', 'Residencia La Molina', 'Arq. Fernando Belaunde', '922111000', 'fbelaunde@estudio.pe', 'Calle Las Palmeras 320, La Molina, Lima'),
        (9, 'RUC', '20100070970', 'Supermercados Peruanos S.A.', 'Ing. Luis Ríos', '911222333', 'mantenimiento@spsa.pe', 'Calle Morelli 181, San Borja, Lima'),
        (10, 'RUC', '20304050601', 'Hotel Costa del Sol Miraflores', 'Lic. Diana Castro', '912345678', 'operaciones@costadelsol.pe', 'Av. José Pardo 780, Miraflores, Lima'),
        (11, 'RUC', '20548912304', 'CORPORACIÓN LOGÍSTICA DEL PACÍFICO S.A.C.', 'Ing. Roberto Valdivia', '998452110', 'rvaldivia@corplogistica.com.pe', 'Av. Los Eucaliptos Mz. D Lt. 14 - Zona Industrial Lurín'),
        (15, 'RUC', '20554433221', 'Concesionario Automotriz Surquillo', 'Ing. Mario Paz', '923456789', 'seguridad@autosurquillo.pe', 'Av. República de Panamá 4210, Surquillo, Lima')"
    );

    // 7. Proveedores Mayoristas (Lima, Perú)
    $pdo->exec(
        "INSERT IGNORE INTO suppliers (id, name, ruc, contact_name, phone, email, is_active) VALUES
        (1, 'DELTRON PERÚ S.A.', '20212331377', 'Ejecutivo Mayorista B2B', '(01) 415-0101', 'ventas.corporativas@deltron.com.pe', 1),
        (2, 'TECNOSEG S.A.C.', '20512345678', 'Ana Ríos', '998221334', 'arios@tecnoseg.pe', 1),
        (3, 'INGRAM MICRO PERÚ', '20498765432', 'Luis Vega', '(01) 616-1200', 'peru.networking@ingrammicro.com', 1),
        (4, 'ANIXTER PERÚ S.A.C.', '20384950617', 'Claudia Morales', '(01) 712-4400', 'cotizaciones.pe@wesco.com', 1)"
    );

    // 8. Equipos Homologados del Catálogo Técnico (Pantalla 16)
    $pdo->exec(
        "INSERT IGNORE INTO products (id, sku, category, name, brand, unit, is_active) VALUES
        (1, 'HK-DS2CD2183G2', 'cctv', 'Cámara Domo IP 4K AcuSense IR30m IP67', 'HIKVISION', 'UND', 1),
        (2, 'UB-USW-24-POE', 'redes', 'Switch UniFi Gen2 24 Puertos Gigabit PoE+', 'UBIQUITI', 'UND', 1),
        (3, 'PAN-PUC6ASD04BU', 'redes', 'Bobina Cable UTP Cat6A LSZH 305m Azul', 'PANDUIT', 'ROLLO', 1),
        (4, 'ZK-SPEEDFACE-V5L', 'accesos', 'Terminal Control de Acceso Facial + Huella', 'ZKTECO', 'UND', 1),
        (5, 'EMT-CONDUIT-34', 'canalizacion', 'Tubería Metálica EMT 3/4\" x 3m Galvanizada UL', 'COLMENA', 'TUBO', 1),
        (6, 'FLU-LIQ-KIT', 'herramientas', 'Kit Consumibles Fijación & Etiquetado Termocontraíble', 'PANDUIT', 'KIT', 1)"
    );

    // 9. Ofertas Mayoristas por Producto (RN-01)
    $pdo->exec(
        "INSERT IGNORE INTO supplier_offers (id, product_id, supplier_id, supplier_sku, currency, unit_cost, valid_until, is_preferred, is_active) VALUES
        (1, 1, 1, 'DEL-DS2CD2183G2', 'USD', 84.80, '2026-12-31', 1, 1),
        (2, 1, 2, 'TSEG-2183G2-4K', 'USD', 88.50, '2026-12-31', 0, 1),
        (3, 2, 3, 'ING-USW-24-POE', 'USD', 341.33, '2026-12-31', 1, 1),
        (4, 3, 4, 'ANX-PUC6ASD04BU', 'USD', 180.00, '2026-12-31', 1, 1),
        (5, 4, 2, 'TSEG-SPEEDFACE-V5L', 'USD', 250.67, '2026-12-31', 1, 1)"
    );

    $pdo->commit();
    echo "[OK] Semilla de base de datos completada con éxito.\n";
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    fwrite(STDERR, "[ERROR] " . $e->getMessage() . "\n");
    exit(1);
}
