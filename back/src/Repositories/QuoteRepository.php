<?php

declare(strict_types=1);

namespace Proformas\Repositories;

use PDO;

/**
 * Repositorio de acceso a datos para Proformas (PDO con sentencias preparadas y bloqueo FOR UPDATE).
 */
final class QuoteRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /**
     * Genera el siguiente correlativo anual PRO-YYYY-NNNN con bloqueo transaccional FOR UPDATE.
     */
    public function nextCorrelative(int $year): string
    {
        $stmt = $this->pdo->prepare('SELECT last_number FROM quote_sequences WHERE year = :y FOR UPDATE');
        $stmt->execute([':y' => $year]);
        $row = $stmt->fetch();

        if (!$row) {
            $next = 1;
            $ins = $this->pdo->prepare('INSERT INTO quote_sequences (year, last_number) VALUES (:y, :n)');
            $ins->execute([':y' => $year, ':n' => $next]);
        } else {
            $next = ((int) $row['last_number']) + 1;
            $upd = $this->pdo->prepare('UPDATE quote_sequences SET last_number = :n WHERE year = :y');
            $upd->execute([':n' => $next, ':y' => $year]);
        }

        return sprintf('PRO-%04d-%04d', $year, $next);
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM quotes WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }
}
