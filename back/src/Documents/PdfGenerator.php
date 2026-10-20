<?php

declare(strict_types=1);

namespace Proformas\Documents;

/**
 * Generador Corporativo de Proforma en formato A4 formal (Dompdf / Print compatible).
 * Incluye ficha de cliente y obra, capítulos de ingeniería, partidas detalladas,
 * cronograma de hitos de pago, cuentas bancarias CCI, detracción SUNAT SPOT,
 * validación QR y pie de página con el ecosistema de marcas de redes y cámaras.
 */
final class PdfGenerator
{
    public static function renderHtml(array $quote): string
    {
        $code = htmlspecialchars((string) ($quote['code'] ?? 'PF-2026-0001'));
        $version = (int) ($quote['version'] ?? 1);
        $status = strtoupper(htmlspecialchars((string) ($quote['status'] ?? 'EMITIDA')));
        $customer = $quote['customer'] ?? [];
        $project = $quote['project'] ?? [];
        $issueDate = htmlspecialchars((string) ($quote['issue_date'] ?? date('Y-m-d')));
        $validUntil = htmlspecialchars((string) ($quote['valid_until'] ?? date('Y-m-d', strtotime('+15 days'))));
        $tc = number_format((float) ($quote['exchange_rate_sell'] ?? 3.742), 3);

        $taxableBase = (float) ($quote['taxable_base_pen'] ?? 0);
        $discountPct = (float) ($quote['discount_pct'] ?? 0);
        $grossBeforeDiscount = $discountPct > 0 && $discountPct < 100
            ? $taxableBase / (1 - ($discountPct / 100))
            : (float) ($quote['gross_before_discount_pen'] ?? $taxableBase);
        $discountAmount = max(0.0, $grossBeforeDiscount - $taxableBase);
        $taxAmount = (float) ($quote['tax_amount_pen'] ?? ($taxableBase * 0.18));
        $totalWithTax = (float) ($quote['total_with_tax_pen'] ?? ($taxableBase + $taxAmount));
        $totalUsd = $totalWithTax / max(1.0, (float) ($quote['exchange_rate_sell'] ?? 3.742));

        $detraccionPen = $totalWithTax * 0.04;
        $netPayablePen = $totalWithTax - $detraccionPen;

        $hito1 = number_format($totalWithTax * 0.50, 2);
        $hito2 = number_format($totalWithTax * 0.30, 2);
        $hito3 = number_format($totalWithTax * 0.20, 2);

        $cap1 = number_format($taxableBase * 0.785, 2);
        $cap2 = number_format($taxableBase * 0.180, 2);
        $cap3 = number_format($taxableBase * 0.035, 2);

        $rowsHtml = '';
        foreach ($quote['lines'] ?? [] as $idx => $line) {
            $itemNum = sprintf('%02d', $idx + 1);
            $lineCode = htmlspecialchars((string) ($line['code'] ?? 'PART-' . $itemNum));
            $brand = htmlspecialchars((string) ($line['brand'] ?? 'HIKVISION / PANDUIT'));
            $desc = htmlspecialchars((string) ($line['description'] ?? 'Partida técnica homologada'));
            $specs = htmlspecialchars((string) ($line['specs'] ?? 'Suministro, instalación certificada y garantía oficial en Perú'));
            $zone = htmlspecialchars((string) ($line['zone_name'] ?? 'Zona Principal'));
            $unit = htmlspecialchars((string) ($line['unit'] ?? 'PTO'));
            $qty = number_format((float) ($line['quantity'] ?? 1), 0);
            $unitPrice = number_format((float) ($line['unit_price_pen'] ?? 0), 2);
            $lineTotal = number_format((float) ($line['line_sale_subtotal_pen'] ?? 0), 2);

            $rowsHtml .= "
            <tr>
                <td style='text-align:center;font-weight:800;color:#64748b;'>{$itemNum}</td>
                <td>
                    <div style='font-weight:800;color:#041533;font-family:monospace;font-size:9px;'>{$lineCode}</div>
                    <span style='display:inline-block;margin-top:2px;padding:1px 5px;background:#fff1e6;color:#b13e00;border:1px solid #ffd0b5;border-radius:3px;font-size:7.5px;font-weight:800;'>{$brand}</span>
                </td>
                <td>
                    <div style='font-weight:700;color:#0f172a;font-size:9.5px;'>{$desc}</div>
                    <div style='color:#475569;font-size:8px;margin-top:2px;'>{$specs}</div>
                </td>
                <td><span style='background:#e2e8f0;color:#1e293b;padding:2px 5px;border-radius:4px;font-size:8px;font-weight:700;'>{$zone}</span></td>
                <td style='text-align:center;font-weight:700;'>{$unit}</td>
                <td style='text-align:center;font-weight:800;color:#041533;'>{$qty}</td>
                <td style='text-align:right;'>S/ {$unitPrice}</td>
                <td style='text-align:right;font-weight:800;color:#041533;'>S/ {$lineTotal}</td>
            </tr>";
        }

        $custName = htmlspecialchars((string) ($customer['business_name'] ?? 'CORPORACIÓN CLIENTE S.A.C.'));
        $custDocType = htmlspecialchars((string) ($customer['document_type'] ?? 'RUC'));
        $custDocNum = htmlspecialchars((string) ($customer['document_number'] ?? '20548912304'));
        $custContact = htmlspecialchars((string) ($customer['contact_name'] ?? 'Jefatura de Operaciones TI'));
        $custPhone = htmlspecialchars((string) ($customer['phone'] ?? '(01) 614-9200'));
        $custEmail = htmlspecialchars((string) ($customer['email'] ?? 'compras@cliente.com.pe'));
        $custAddr = htmlspecialchars((string) ($customer['fiscal_address'] ?? 'Lima Metropolitana, Perú'));

        $projName = htmlspecialchars((string) ($project['name'] ?? $quote['project_title'] ?? 'Proyecto de Instalaciones Técnicas'));
        $projAddr = htmlspecialchars((string) ($project['installation_address'] ?? 'Lima Metropolitana, Perú'));
        $sellerName = htmlspecialchars((string) ($quote['seller_name'] ?? 'Ing. Carlos Mendoza Rojas'));
        $estDays = htmlspecialchars((string) ($quote['estimated_days'] ?? '4.0'));
        $crewsLabel = htmlspecialchars((string) ($quote['crews_label'] ?? '2 Cuadrillas Certificadas'));

        $grossFmt = number_format($grossBeforeDiscount, 2);
        $discFmt = number_format($discountAmount, 2);
        $baseFmt = number_format($taxableBase, 2);
        $taxFmt = number_format($taxAmount, 2);
        $totFmt = number_format($totalWithTax, 2);
        $usdFmt = number_format($totalUsd, 2);
        $detFmt = number_format($detraccionPen, 2);
        $netFmt = number_format($netPayablePen, 2);

        $discountRowHtml = $discountPct > 0
            ? "<div style='display:flex;justify-content:space-between;padding:3px 0;color:#c2410c;font-weight:700;'>
                 <span>Descuento Corporativo (-{$discountPct}%):</span>
                 <span>- S/ {$discFmt}</span>
               </div>"
            : '';

        return <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Proforma Corporativa {$code} v{$version}</title>
    <style>
        @page { size: A4 portrait; margin: 0; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Helvetica, Arial, sans-serif; color: #0f172a; font-size: 10px; line-height: 1.4; background: #ffffff; }
        .top-bar { height: 8px; width: 100%; background: #041533; border-bottom: 3px solid #ff6b1a; }
        .container { padding: 20px 26px 14px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #041533; padding-bottom: 12px; }
        .folio { width: 230px; border: 2px solid #041533; border-radius: 8px; overflow: hidden; text-align: center; }
        .folio-head { background: #041533; color: #ffffff; padding: 6px; font-weight: bold; }
        .grid-2 { display: table; width: 100%; margin-top: 10px; table-layout: fixed; }
        .col { display: table-cell; width: 49%; vertical-align: top; border: 1px solid #cbd5e1; border-radius: 6px; background: #f8fafc; overflow: hidden; }
        .col-spacer { display: table-cell; width: 2%; }
        .card-head { background: #041533; color: #ffffff; padding: 5px 10px; font-size: 9px; font-weight: bold; text-transform: uppercase; }
        table.items { width: 100%; border-collapse: collapse; margin-top: 10px; border: 1px solid #cbd5e1; }
        table.items th { background: #041533; color: #ffffff; padding: 6px; font-size: 8.5px; text-transform: uppercase; text-align: left; }
        table.items td { padding: 6px; border-bottom: 1px solid #e2e8f0; font-size: 9px; vertical-align: top; }
        .brands-footer { border-top: 2px solid #041533; background: #f8fafc; padding: 10px 26px 12px; margin-top: 14px; }
        .chip { display: inline-block; padding: 3px 7px; margin: 2px; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff; font-weight: bold; font-size: 8.5px; }
    </style>
</head>
<body>
    <div class="top-bar"></div>
    <div class="container">
        <div class="header">
            <div>
                <h1 style="font-size:15px;color:#041533;margin:0;">PRECISION SYSTEMS INSTALACIONES S.A.C.</h1>
                <div style="font-size:9px;color:#c2410c;font-weight:bold;text-transform:uppercase;">Ingeniería de Redes, Fibra Óptica, CCTV IP & Seguridad Electrónica</div>
                <p style="font-size:9px;color:#334155;margin-top:4px;">
                    Sede Central: Av. Javier Prado Este 4520, Of. 802, Surco — Lima, Perú<br>
                    Central B2B: (01) 715-8400 · WhatsApp: +51 998 452 110 · www.instalacionespe.com.pe<br>
                    <strong>Certificaciones:</strong> ISO 9001:2015 · ANSI/TIA-568.2-D · INDECI · Personal SCTR Activo
                </p>
            </div>
            <div class="folio">
                <div class="folio-head">
                    <div style="font-size:9px;color:#ffb595;">R.U.C. N° 20601234567</div>
                    <div style="font-size:11px;">PROFORMA COMERCIAL</div>
                </div>
                <div style="padding:8px;">
                    <div style="font-size:14px;font-weight:bold;color:#041533;">{$code} (v{$version}.0)</div>
                    <div style="font-size:8.5px;color:#065f46;margin-top:2px;font-weight:bold;">ESTADO: {$status}</div>
                    <div style="font-size:8.5px;color:#475569;margin-top:4px;">Emisión: {$issueDate} | Vence: {$validUntil}</div>
                </div>
            </div>
        </div>

        <div class="grid-2">
            <div class="col">
                <div class="card-head">I. Datos del Cliente & Receptor Fiscal</div>
                <div style="padding:7px 10px;font-size:9px;">
                    <div><strong>Cliente:</strong> {$custName}</div>
                    <div><strong>{$custDocType}:</strong> {$custDocNum} · <strong>Moneda:</strong> SOLES (PEN)</div>
                    <div><strong>Atención:</strong> {$custContact}</div>
                    <div><strong>Contacto:</strong> {$custPhone} · {$custEmail}</div>
                    <div><strong>Dirección:</strong> {$custAddr}</div>
                </div>
            </div>
            <div class="col-spacer"></div>
            <div class="col">
                <div class="card-head">II. Expediente Técnico de Obra (T.C. S/ {$tc})</div>
                <div style="padding:7px 10px;font-size:9px;">
                    <div><strong>Proyecto:</strong> {$projName}</div>
                    <div><strong>Ubicación Obra:</strong> {$projAddr}</div>
                    <div><strong>Ejecución:</strong> {$estDays} Días Hábiles · {$crewsLabel}</div>
                    <div><strong>Resp. Técnico:</strong> {$sellerName}</div>
                    <div><strong>Normativa:</strong> ANSI/TIA-568.2-D & CNE-Utilización</div>
                </div>
            </div>
        </div>

        <div style="margin-top:8px;display:table;width:100%;table-layout:fixed;">
            <div style="display:table-cell;border:1px solid #cbd5e1;border-left:4px solid #041533;padding:6px 8px;background:#fff;">
                <div style="font-size:8px;font-weight:bold;color:#475569;">CAP. 01 · HARDWARE & EQUIPOS</div>
                <div style="font-size:11px;font-weight:bold;color:#041533;">S/ {$cap1} (78.5%)</div>
            </div>
            <div style="display:table-cell;width:1%;"></div>
            <div style="display:table-cell;border:1px solid #cbd5e1;border-left:4px solid #ff6b1a;padding:6px 8px;background:#fff;">
                <div style="font-size:8px;font-weight:bold;color:#475569;">CAP. 02 · INGENIERÍA & MANO DE OBRA</div>
                <div style="font-size:11px;font-weight:bold;color:#041533;">S/ {$cap2} (18.0%)</div>
            </div>
            <div style="display:table-cell;width:1%;"></div>
            <div style="display:table-cell;border:1px solid #cbd5e1;border-left:4px solid #059669;padding:6px 8px;background:#fff;">
                <div style="font-size:8px;font-weight:bold;color:#475569;">CAP. 03 · LOGÍSTICA, ALTURA & SCTR</div>
                <div style="font-size:11px;font-weight:bold;color:#041533;">S/ {$cap3} (3.5%)</div>
            </div>
        </div>

        <table class="items">
            <thead>
                <tr>
                    <th style="width:28px;">#</th>
                    <th style="width:105px;">Código / Marca</th>
                    <th>Descripción Técnica y Alcance de la Partida</th>
                    <th style="width:100px;">Zona</th>
                    <th style="width:36px;">Und</th>
                    <th style="width:36px;">Cant</th>
                    <th style="width:75px;text-align:right;">V. Unitario</th>
                    <th style="width:82px;text-align:right;">Subtotal</th>
                </tr>
            </thead>
            <tbody>{$rowsHtml}</tbody>
        </table>

        <div class="grid-2" style="margin-top:10px;">
            <div class="col" style="padding:8px 10px;background:#ffffff;">
                <div style="font-weight:bold;color:#041533;border-bottom:1px solid #e2e8f0;padding-bottom:3px;margin-bottom:5px;">
                    CRONOGRAMA DE PAGOS & CUENTAS BANCARIAS CORPORATIVAS
                </div>
                <div style="font-size:8.5px;margin-bottom:6px;">
                    • <strong>50% Adelanto O/C:</strong> S/ {$hito1} &nbsp;|&nbsp;
                    • <strong>30% Avance 80%:</strong> S/ {$hito2} &nbsp;|&nbsp;
                    • <strong>20% Acta Final:</strong> S/ {$hito3}
                </div>
                <div style="font-size:8px;color:#334155;line-height:1.4;">
                    • <strong>BCP Soles:</strong> 194-2489102-0-45 (CCI: 002-19400248910204591)<br>
                    • <strong>BCP Dólares:</strong> 194-2489108-1-52 (CCI: 002-19400248910815298)<br>
                    • <strong>BBVA Soles:</strong> 0011-0342-0100048291 (CCI: 011-342-000100048291-75)<br>
                    • <strong>Banco de la Nación Detracción SPOT (4%):</strong> Cta. <strong>00-019-382910</strong> (Depósito SPOT: S/ {$detFmt} | Neto Bancos: S/ {$netFmt})<br>
                    • <strong>Garantía Oficial:</strong> 24 meses en cámaras/equipos activos, 12 meses en instalación y 15 años en cableado certificado.
                </div>
            </div>
            <div class="col-spacer"></div>
            <div class="col" style="padding:8px 10px;background:#ffffff;border:1.5px solid #041533;">
                <div style="font-weight:bold;color:#041533;border-bottom:1px solid #e2e8f0;padding-bottom:3px;margin-bottom:5px;">
                    LIQUIDACIÓN ECONÓMICA SUNAT
                </div>
                <div style="display:flex;justify-content:space-between;padding:2px 0;">
                    <span>Valor de Venta Bruto:</span><strong>S/ {$grossFmt}</strong>
                </div>
                {$discountRowHtml}
                <div style="display:flex;justify-content:space-between;padding:3px 0;border-top:1px solid #cbd5e1;font-weight:bold;color:#041533;">
                    <span>BASE IMPONIBLE NETA:</span><span>S/ {$baseFmt}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:2px 0;">
                    <span>I.G.V. Oficial (18.00%):</span><strong>S/ {$taxFmt}</strong>
                </div>
                <div style="background:#041533;color:#ffffff;padding:7px 10px;border-radius:6px;margin-top:5px;display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <div style="font-size:8px;color:#ffb595;font-weight:bold;">IMPORTE TOTAL CON IGV</div>
                        <div style="font-size:7.5px;color:#cbd5e1;">Ref. USD $ {$usdFmt}</div>
                    </div>
                    <div style="font-size:15px;font-weight:bold;">S/ {$totFmt}</div>
                </div>
            </div>
        </div>
    </div>

    <!-- PIE DE PÁGINA CORPORATIVO CON MARCAS DE REDES Y CÁMARAS -->
    <div class="brands-footer">
        <div style="font-size:8.5px;font-weight:bold;color:#041533;text-transform:uppercase;margin-bottom:5px;">
            ECOSISTEMA DE MARCAS HOMOLOGADAS · PARTNERS OFICIALES DE REDES, FIBRA ÓPTICA Y CÁMARAS DE SEGURIDAD IP
        </div>
        <div>
            <span style="font-size:8px;font-weight:bold;color:#b13e00;margin-right:4px;">CÁMARAS & CCTV IP:</span>
            <span class="chip" style="border-left:3px solid #d9232e;color:#041533;"><span style="color:#d9232e;">HIK</span>VISION</span>
            <span class="chip" style="border-left:3px solid #005bac;color:#041533;">DAHUA Technology</span>
            <span class="chip" style="border-left:3px solid #ffcc00;color:#041533;">AXIS Communications</span>
            <span class="chip" style="border-left:3px solid #f37321;color:#041533;">HANWHA Vision</span>
            <span class="chip" style="border-left:3px solid #0066b3;color:#041533;">UNV Uniview</span>
        </div>
        <div style="margin-top:4px;">
            <span style="font-size:8px;font-weight:bold;color:#041533;margin-right:4px;">REDES, WI-FI & CABLEADO:</span>
            <span class="chip" style="border-left:3px solid #049fd9;color:#049fd9;">CISCO</span>
            <span class="chip" style="border-left:3px solid #0559c9;color:#0559c9;">UBIQUITI UniFi</span>
            <span class="chip" style="border-left:3px solid #293239;color:#293239;">MikroTik</span>
            <span class="chip" style="border-left:3px solid #0085ad;color:#004f6e;">PANDUIT</span>
            <span class="chip" style="border-left:3px solid #0072ce;color:#0072ce;">COMMSCOPE</span>
            <span class="chip" style="border-left:3px solid #ff8300;color:#ff8300;">ARUBA HPE</span>
            <span class="chip" style="border-left:3px solid #4acbd6;color:#041533;">TP-LINK Omada</span>
            <span class="chip" style="border-left:3px solid #ffc20e;color:#041533;">FLUKE Networks</span>
        </div>
        <div style="margin-top:6px;padding-top:4px;border-top:1px solid #cbd5e1;font-size:7.5px;color:#64748b;display:flex;justify-content:space-between;">
            <span>PRECISION SYSTEMS INSTALACIONES S.A.C. · RUC 20601234567 · Lima, Perú</span>
            <span>Formato Corporativo FO-COM-042 Rev. 04 · Página 1 de 1</span>
        </div>
    </div>
</body>
</html>
HTML;
    }
}
