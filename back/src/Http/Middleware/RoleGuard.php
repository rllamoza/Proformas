<?php

declare(strict_types=1);

namespace Proformas\Http\Middleware;

/**
 * Matriz de Permisos RBAC según 09_Matriz_Roles_Permisos.md.
 */
final class RoleGuard
{
    /**
     * Verifica si el rol tiene permiso para la acción solicitada.
     */
    public static function isAllowed(string $role, string $permission): bool
    {
        $matrix = [
            'catalog.write'          => ['admin'],
            'suppliers.read'         => ['gerencia', 'admin'],
            'suppliers.write'        => ['admin'],
            'offers.read'            => ['gerencia', 'admin'],
            'offers.write'           => ['admin'],
            'assemblies.write'       => ['admin'],
            'services.write'         => ['admin'],
            'settings.labor.write'   => ['gerencia', 'admin'],
            'settings.fx.write'      => ['gerencia', 'admin'],
            'quotes.write'           => ['vendedor', 'gerencia', 'admin'],
            'quotes.override_params' => ['gerencia', 'admin'],
            'quotes.approve'         => ['gerencia', 'admin'],
            'quotes.export_excel'    => ['gerencia', 'admin'],
            'reports.margins'        => ['gerencia', 'admin'],
            'reports.audit'          => ['admin'],
            'users.manage'           => ['admin'],
        ];

        if (!isset($matrix[$permission])) {
            return true;
        }

        return in_array($role, $matrix[$permission], true);
    }
}
