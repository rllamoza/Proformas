<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/Domain/Money.php';
require_once __DIR__ . '/../src/Domain/Hours.php';
require_once __DIR__ . '/../src/Engine/QuoteCalculator.php';
require_once __DIR__ . '/../src/Config/Database.php';

use Proformas\Config\Database;

echo "=== Ejecutando Migraciones de Base de Datos (001_initial_schema.sql) ===\n";

try {
    $pdo = Database::getConnection();
    $sql = file_get_contents(__DIR__ . '/../migrations/001_initial_schema.sql');
    if ($sql === false) {
        throw new RuntimeException('No se pudo leer migrations/001_initial_schema.sql');
    }
    $pdo->exec($sql);
    echo "[OK] Esquema 001_initial_schema.sql aplicado correctamente.\n";
} catch (Throwable $e) {
    fwrite(STDERR, "[ERROR] " . $e->getMessage() . "\n");
    exit(1);
}
