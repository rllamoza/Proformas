<?php

declare(strict_types=1);

namespace Proformas\Config;

use PDO;
use PDOException;

final class Database
{
    private static ?PDO $instance = null;

    public static function getConnection(): PDO
    {
        if (self::$instance !== null) {
            return self::$instance;
        }

        $host = $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?: '127.0.0.1';
        $port = $_ENV['DB_PORT'] ?? getenv('DB_PORT') ?: '3306';
        $db   = $_ENV['DB_DATABASE'] ?? getenv('DB_DATABASE') ?: 'proformas_db';
        $user = $_ENV['DB_USERNAME'] ?? getenv('DB_USERNAME') ?: 'root';
        $pass = $_ENV['DB_PASSWORD'] ?? getenv('DB_PASSWORD') ?: 'Ra020976';

        $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $db);

        self::$instance = new PDO($dsn, (string) $user, (string) $pass, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);

        return self::$instance;
    }
}
