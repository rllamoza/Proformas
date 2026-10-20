<?php

declare(strict_types=1);

namespace Proformas\Services;

use InvalidArgumentException;
use Proformas\Engine\QuoteCalculator;
use Proformas\Http\Middleware\RoleGuard;

/**
 * Servicio de dominio para transición de estados de proformas (RN-08, RN-09, RN-10).
 */
final class QuoteService
{
    /**
     * Valida si una proforma puede editarse directamente.
     * RN-09: Una proforma emitida, enviada, aceptada, rechazada, vencida o anulada es inmutable.
     */
    public static function assertEditable(array $quote): void
    {
        if (($quote['status'] ?? '') !== 'borrador') {
            throw new InvalidArgumentException(
                'QUOTE_IMMUTABLE: La proforma ya fue emitida o enviada a aprobación y no puede modificarse directamente. Genere una nueva versión.'
            );
        }
    }

    /**
     * Valida si una proforma puede ser emitida.
     * RN-08: Si requires_approval = 1 y no tiene aprobación aprobada, lanza APPROVAL_REQUIRED.
     */
    public static function assertCanIssue(array $quote, string $userRole, bool $hasApprovedRequest = false): void
    {
        $status = (string) ($quote['status'] ?? 'borrador');
        if (!in_array($status, ['borrador', 'en_aprobacion'], true)) {
            throw new InvalidArgumentException('INVALID_STATE_TRANSITION: Solo se puede emitir desde borrador o en_aprobacion.');
        }

        $requiresApproval = !empty($quote['requires_approval']);
        if ($requiresApproval && !$hasApprovedRequest && !RoleGuard::isAllowed($userRole, 'quotes.approve')) {
            throw new InvalidArgumentException(
                'APPROVAL_REQUIRED: La proforma supera el descuento autónomo o tiene margen inferior al mínimo. Solicite aprobación de Gerencia.'
            );
        }
    }
}
