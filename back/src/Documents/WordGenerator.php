<?php

declare(strict_types=1);

namespace Proformas\Documents;

/**
 * Generador de Propuesta Técnica y Económica en formato Word (.docx / HTML-Doc compatible).
 */
final class WordGenerator
{
    public static function renderDoc(array $quote): string
    {
        $html = PdfGenerator::renderHtml($quote);
        return "MIME-Version: 1.0\r\nContent-Type: application/msword; charset=utf-8\r\n\r\n" . $html;
    }
}
