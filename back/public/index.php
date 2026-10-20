<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/Domain/Money.php';
require_once __DIR__ . '/../src/Domain/Hours.php';
require_once __DIR__ . '/../src/Engine/QuoteCalculator.php';
require_once __DIR__ . '/../src/Config/Database.php';
require_once __DIR__ . '/../src/Http/Resources/RoleSanitizer.php';
require_once __DIR__ . '/../src/Http/Middleware/RoleGuard.php';
require_once __DIR__ . '/../src/Documents/PdfGenerator.php';
require_once __DIR__ . '/../src/Documents/ExcelGenerator.php';

use Proformas\Engine\QuoteCalculator;
use Proformas\Http\Resources\RoleSanitizer;

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');

$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:5173';
header("Access-Control-Allow-Origin: {$origin}");
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

session_name($_ENV['SESSION_NAME'] ?? 'PROFORMA_SESSID');
session_start([
    'cookie_httponly' => true,
    'cookie_samesite' => 'Lax',
]);

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($uri === '/api/v1/health') {
    echo json_encode([
        'data' => [
            'status' => 'ok',
            'service' => 'proformas-backend-php',
            'version' => '1.0.0',
        ],
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($uri === '/api/v1/quotes/preview-calculation' && $method === 'POST') {
    $rawBody = file_get_contents('php://input') ?: '{}';
    $payload = json_decode($rawBody, true) ?: [];
    $role = (string) ($_SESSION['user']['role'] ?? 'vendedor');

    try {
        $result = QuoteCalculator::calculateQuote($payload);
        echo json_encode([
            'data' => RoleSanitizer::sanitizePayload($result, $role),
        ], JSON_UNESCAPED_UNICODE);
    } catch (Throwable $e) {
        http_response_code(422);
        echo json_encode([
            'error' => [
                'code' => 'VALIDATION_ERROR',
                'message' => $e->getMessage(),
                'details' => (object) [],
            ],
        ], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

http_response_code(404);
echo json_encode([
    'error' => [
        'code' => 'NOT_FOUND',
        'message' => 'Ruta no encontrada: ' . $uri,
        'details' => (object) [],
    ],
], JSON_UNESCAPED_UNICODE);
