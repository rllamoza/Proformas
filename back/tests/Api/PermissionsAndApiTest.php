<?php

declare(strict_types=1);

namespace Proformas\Tests\Api;

use InvalidArgumentException;
use PHPUnit\Framework\TestCase;
use Proformas\Http\Middleware\RoleGuard;
use Proformas\Services\QuoteService;

final class PermissionsAndApiTest extends TestCase
{
    public function testRoleGuardPermissionsMatrix(): void
    {
        // PER-01..PER-09
        self::assertFalse(RoleGuard::isAllowed('vendedor', 'catalog.write'));
        self::assertFalse(RoleGuard::isAllowed('vendedor', 'suppliers.read'));
        self::assertFalse(RoleGuard::isAllowed('vendedor', 'quotes.approve'));
        self::assertFalse(RoleGuard::isAllowed('vendedor', 'quotes.export_excel'));
        self::assertFalse(RoleGuard::isAllowed('vendedor', 'reports.margins'));

        // Gerencia puede aprobar y ver márgenes pero no administrar usuarios ni catálogo
        self::assertTrue(RoleGuard::isAllowed('gerencia', 'quotes.approve'));
        self::assertTrue(RoleGuard::isAllowed('gerencia', 'reports.margins'));
        self::assertFalse(RoleGuard::isAllowed('gerencia', 'users.manage'));

        // Admin tiene control total
        self::assertTrue(RoleGuard::isAllowed('admin', 'catalog.write'));
        self::assertTrue(RoleGuard::isAllowed('admin', 'users.manage'));
        self::assertTrue(RoleGuard::isAllowed('admin', 'reports.audit'));
    }

    public function testImmutableQuoteRejectsDirectEdit(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessageMatches('/QUOTE_IMMUTABLE/');
        QuoteService::assertEditable(['id' => 1, 'status' => 'emitida']);
    }

    public function testApprovalRequiredPreventsSellerFromIssuingDirectly(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessageMatches('/APPROVAL_REQUIRED/');
        QuoteService::assertCanIssue(
            ['id' => 1, 'status' => 'borrador', 'requires_approval' => 1],
            'vendedor',
            false
        );
    }
}
