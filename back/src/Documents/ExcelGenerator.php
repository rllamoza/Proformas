<?php

declare(strict_types=1);

namespace Proformas\Documents;

/**
 * Generador de hoja de costeo interna (.xlsx / CSV estructurado) exclusivo para Gerencia y Admin.
 */
final class ExcelGenerator
{
    public static function toCsv(array $quote): string
    {
        $lines = [
            ['HOJA DE COSTEO INTERNO - CONFIDENCIAL (GERENCIA / ADMIN)'],
            ['Proforma', (string) ($quote['code'] ?? ''), 'Version', (string) ($quote['version'] ?? 1)],
            ['Cliente', (string) ($quote['customer']['business_name'] ?? ''), 'Fecha', (string) ($quote['issue_date'] ?? '')],
            [],
            ['ITEM', 'CODIGO', 'DESCRIPCION', 'CANTIDAD', 'COSTO UNIT (PEN)', 'COSTO LINEA (PEN)', 'HORAS LINEA', 'PRECIO VENTA LINEA (PEN)'],
        ];

        foreach ($quote['lines'] ?? [] as $idx => $line) {
            $lines[] = [
                (string) ($idx + 1),
                (string) ($line['code'] ?? ''),
                (string) ($line['description'] ?? ''),
                number_format((float) ($line['quantity'] ?? 1), 2, '.', ''),
                number_format((float) ($line['unit_cost_pen'] ?? 0), 2, '.', ''),
                number_format((float) ($line['line_materials_cost_pen'] ?? 0), 2, '.', ''),
                number_format((float) ($line['line_total_hours'] ?? 0), 2, '.', ''),
                number_format((float) ($line['line_sale_subtotal_pen'] ?? 0), 2, '.', ''),
            ];
        }

        $lines[] = [];
        $lines[] = ['RESUMEN FINANCIERO INTERNO', 'MONTO (PEN)'];
        $lines[] = ['Costo Materiales', number_format((float) ($quote['materials_cost_pen'] ?? 0), 2, '.', '')];
        $lines[] = ['Mano de Obra Método A (Por punto)', number_format((float) ($quote['labor_cost_method_a_pen'] ?? 0), 2, '.', '')];
        $lines[] = ['Mano de Obra Método B (Por jornada)', number_format((float) ($quote['labor_cost_method_b_pen'] ?? 0), 2, '.', '')];
        $lines[] = ['Mano de Obra Aplicada', number_format((float) ($quote['labor_cost_applied_pen'] ?? 0), 2, '.', '')];
        $lines[] = ['Viáticos / Movilidad', number_format((float) ($quote['travel_cost_pen'] ?? 0), 2, '.', '')];
        $lines[] = ['Costo Directo Total', number_format((float) ($quote['direct_cost_pen'] ?? 0), 2, '.', '')];
        $lines[] = ['Gastos Generales (Overhead)', number_format((float) ($quote['overhead_amount_pen'] ?? 0), 2, '.', '')];
        $lines[] = ['Costo Total Proyecto', number_format((float) ($quote['total_cost_pen'] ?? 0), 2, '.', '')];
        $lines[] = ['Valor Venta Antes Descuento', number_format((float) ($quote['sale_value_before_discount_pen'] ?? 0), 2, '.', '')];
        $lines[] = ['Descuento Comercial', number_format((float) ($quote['discount_amount_pen'] ?? 0), 2, '.', '')];
        $lines[] = ['Base Imponible (Sin IGV)', number_format((float) ($quote['taxable_base_pen'] ?? 0), 2, '.', '')];
        $lines[] = ['IGV (18%)', number_format((float) ($quote['tax_amount_pen'] ?? 0), 2, '.', '')];
        $lines[] = ['Total con IGV', number_format((float) ($quote['total_with_tax_pen'] ?? 0), 2, '.', '')];
        $lines[] = ['Margen Efectivo sobre Venta (%)', number_format((float) ($quote['effective_margin_on_sale_pct'] ?? 0), 2, '.', '') . '%'];

        $output = "\xEF\xBB\xBF"; // UTF-8 BOM para Excel
        foreach ($lines as $row) {
            $escaped = array_map(static fn(string $cell): string => '"' . str_replace('"', '""', $cell) . '"', $row);
            $output .= implode(',', $escaped) . "\r\n";
        }

        return $output;
    }
}
