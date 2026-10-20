# PRD — Product Requirements Document

**Producto:** App web de proformas para instalaciones de redes, WiFi, porteros IP y cámaras
**Versión:** 1.0 · 17 de octubre de 2026 · **Estado:** borrador para validación
**Documentos relacionados:** `01_Vision_y_Alcance.md`, `SPEC_App_Proformas.md`

---

## 1. Propósito

Definir **qué** debe hacer la aplicación: módulos, requisitos funcionales y no funcionales, y criterios de aceptación verificables. El **cómo** está en los documentos de arquitectura, datos y API.

**Usuarios:** vendedor (3), técnico (5), gerencia (1–2), administrador (1). Uso interno. Volumen: 15 a 20 proformas al mes.

## 2. Supuestos adoptados

Las decisiones pendientes de la Visión se resolvieron con **valores por defecto razonables**. Todas son **configurables** y deben validarse con la empresa.

| ID | Tema | Valor por defecto | Configurable en |
|---|---|---|---|
| S1 | Precios al cliente y IGV | Precios **sin IGV**; el IGV 18 % se suma al final | Plantilla de proforma |
| S2 | Moneda de la proforma | **Soles (PEN)** | Parámetros |
| S3 | Margen | Por defecto 30 % sobre venta; **mínimo 20 %** | Parámetros |
| S4 | Descuentos | El vendedor puede dar hasta **5 %**; más de 5 % requiere gerencia | Parámetros |
| S5 | Aprobación por margen | Margen efectivo menor al mínimo → **requiere gerencia** | Parámetros |
| S6 | Validez de la proforma | **15 días** | Parámetros |
| S7 | Forma de pago y garantía | Texto de ejemplo en plantilla (p. ej. 50 % adelanto, 50 % a la entrega; garantía de instalación a definir) | Plantillas de condiciones |
| S8 | Base de datos y hosting | MySQL 8 / MariaDB; hosting compartido o VPS | Documento de arquitectura |
| S9 | Zona horaria | America/Lima | Configuración |

## 3. Módulos

| ID | Módulo | Descripción | Fase |
|---|---|---|---|
| AUT | Autenticación y usuarios | Acceso, sesiones, usuarios y roles | MVP |
| CLI | Clientes y proyectos | Datos de clientes, obras y tipo de inmueble | MVP |
| CAT | Catálogo y proveedores | Productos, ofertas por proveedor y moneda, costo vigente | MVP |
| PAR | Parámetros y tipo de cambio | Tarifas, márgenes, factores, plantillas de condiciones | MVP |
| ENS | Ensamblajes | Kits por punto con materiales, horas y costo por punto | MVP |
| PRO | Constructor de proforma | Zonas, líneas, cuadrilla, descuentos, estados | MVP |
| CAL | Motor de cálculo | Costos, mano de obra, días, margen, IGV, alertas | MVP |
| APR | Aprobaciones y emisión | Control de margen/descuento y congelado de la proforma | MVP |
| DOC | Documentos | PDF, Excel y Word | MVP / F2 |
| SER | Servicios y mantenimiento | Rubro recurrente separado | MVP |
| VIS | Visita técnica | Checklist, fotos y medidas | F2 |
| OT | Órdenes de trabajo | Horas reales y comparativo | F2 |
| REP | Reportes e indicadores | KPIs de éxito y reportes | F2 / F3 |
| AUD | Auditoría | Bitácora de cambios sensibles | MVP |

## 4. Requisitos funcionales

Prioridad según MoSCoW: **M** = Must, **S** = Should, **C** = Could.

### 4.1 AUT — Autenticación y usuarios

| ID | Requisito | Prior. | Criterios de aceptación |
|---|---|---|---|
| RF-AUT-01 | El usuario inicia sesión con correo y contraseña | M | Credenciales válidas crean sesión y llevan al inicio; inválidas muestran un mensaje genérico; 5 intentos fallidos bloquean la cuenta 15 minutos |
| RF-AUT-02 | Cierre de sesión y expiración por inactividad | M | Cerrar sesión invalida la sesión en el servidor; tras 30 minutos sin actividad se exige iniciar sesión de nuevo |
| RF-AUT-03 | El administrador crea, edita y desactiva usuarios y asigna un rol | M | Un usuario desactivado no puede iniciar sesión; cada usuario tiene exactamente un rol |
| RF-AUT-04 | Cambio y restablecimiento de contraseña | S | La contraseña nueva exige mínimo 10 caracteres; el enlace de restablecimiento expira en 1 hora y es de un solo uso |

### 4.2 CLI — Clientes y proyectos

| ID | Requisito | Prior. | Criterios de aceptación |
|---|---|---|---|
| RF-CLI-01 | Crear y editar clientes (nombre o razón social, RUC o DNI, contactos, direcciones) | M | RUC de 11 dígitos y DNI de 8; no se permiten documentos duplicados |
| RF-CLI-02 | Crear proyectos de un cliente (dirección, tipo de inmueble, pisos, notas del sitio) | M | Tipo de inmueble: casa, edificio u oficina; pisos ≥ 1 |
| RF-CLI-03 | Buscar clientes por nombre o documento | M | Resultados en menos de 1 segundo; coincidencia parcial |

### 4.3 CAT — Catálogo y proveedores

| ID | Requisito | Prior. | Criterios de aceptación |
|---|---|---|---|
| RF-CAT-01 | Gestionar productos (SKU, nombre, categoría, marca, unidad) | M | SKU único; un producto usado en proformas no se elimina, se desactiva |
| RF-CAT-02 | Gestionar proveedores | M | Nombre único y estado activo/inactivo |
| RF-CAT-03 | Registrar ofertas por proveedor (moneda USD o PEN, costo, fecha, vigencia, plazo de entrega) | M | Costo > 0; vigencia ≥ fecha de oferta |
| RF-CAT-04 | Calcular el costo vigente en soles: menor oferta vigente o proveedor preferido | M | Con ofertas de 38 USD y 41 USD y TC 3.75, el costo vigente es S/ 142.50 |
| RF-CAT-05 | Alertar ofertas vencidas o que vencen en 7 días o menos | S | El listado marca las ofertas; una línea con costo vencido no se calcula |
| RF-CAT-06 | Importar catálogo y ofertas desde Excel o CSV | S | El informe indica fila, campo y motivo de cada error; las filas válidas se importan |

### 4.4 PAR — Parámetros y tipo de cambio

| ID | Requisito | Prior. | Criterios de aceptación |
|---|---|---|---|
| RF-PAR-01 | Registrar tipo de cambio por fecha (compra y venta) | M | Se usa el último TC con fecha ≤ hoy; no se permiten dos registros para la misma fecha |
| RF-PAR-02 | Colchón cambiario opcional | S | El costo en soles se incrementa por el porcentaje configurado |
| RF-PAR-03 | Parámetros de mano de obra y márgenes (costo día técnico y ayudante, horas efectivas, buffer, movilización, gastos generales, margen por defecto y mínimo, eficiencia por tamaño de cuadrilla, método de mano de obra) | M | Cada cambio conserva fecha de vigencia y usuario; las proformas emitidas no se ven afectadas |
| RF-PAR-04 | Gestionar factores de dificultad | M | Factor > 0; se aplica a cableado y montaje |
| RF-PAR-05 | Plantillas de condiciones (incluye, no incluye, pago, garantía, validez) | M | La proforma toma la plantilla por defecto y permite editarla antes de emitir |

### 4.5 ENS — Ensamblajes

| ID | Requisito | Prior. | Criterios de aceptación |
|---|---|---|---|
| RF-ENS-01 | Crear y editar ensamblajes con componentes (producto, cantidad o metros, o insumo de costo fijo) | M | Código único; al menos un componente |
| RF-ENS-02 | Definir horas por fase (cableado, montaje, configuración) y costo referencial por punto | M | Horas ≥ 0; al menos una fase con horas > 0 |
| RF-ENS-03 | Calcular materiales del ensamblaje con costos vigentes | M | `ASM-CAM-EXT` con los datos de prueba da S/ 223.50 |
| RF-ENS-04 | Clonar un ensamblaje | C | La copia tiene código nuevo y los mismos componentes |

### 4.6 PRO — Constructor de proforma

| ID | Requisito | Prior. | Criterios de aceptación |
|---|---|---|---|
| RF-PRO-01 | Crear proforma para un cliente y proyecto, con número correlativo `PF-AAAA-NNNN` | M | El correlativo no se repite ni deja huecos por concurrencia |
| RF-PRO-02 | Organizar la proforma en zonas con factor de dificultad | M | Cada línea pertenece a una zona; el factor de la zona se aplica a sus líneas |
| RF-PRO-03 | Agregar líneas de ensamblaje o producto suelto con cantidad | M | Cantidad entera > 0; el precio de línea se actualiza al cambiar la cantidad |
| RF-PRO-04 | Elegir cuadrilla (técnicos y ayudantes) y método de mano de obra | M | Mínimo 1 técnico; los días y el costo se recalculan al cambiar la cuadrilla |
| RF-PRO-05 | Comparar cuadrillas de 2, 3 y 4 personas (días frente a costo) | S | Con el caso de prueba: 2.5 días / S/ 575.00, 2.0 días / S/ 640.00 y 1.5 días / S/ 690.00 |
| RF-PRO-06 | Aplicar descuento porcentual con tope por rol | M | El vendedor no puede superar 5 %; si lo intenta, la proforma pasa a "requiere aprobación" |
| RF-PRO-07 | Incluir servicios recurrentes opcionales en sección aparte | M | Subtotal propio con IGV; no se mezcla con el total de la instalación |
| RF-PRO-08 | Duplicar una proforma | S | La copia queda en borrador, con precios y TC actuales |
| RF-PRO-09 | Crear nueva versión indicando motivo (error de precio, error de cálculo, cambio de alcance, otro) | S | La versión anterior queda de solo lectura; el motivo alimenta los indicadores |
| RF-PRO-10 | Estados: borrador, enviada, aprobada, rechazada, vencida | M | Pasa a "vencida" al superar la validez sin respuesta; las transiciones válidas están definidas en los flujos |
| RF-PRO-11 | Editar incluye / no incluye y condiciones por proforma | M | Los textos editados se guardan solo en esa proforma |

### 4.7 CAL — Motor de cálculo

| ID | Requisito | Prior. | Criterios de aceptación |
|---|---|---|---|
| RF-CAL-01 | Calcular materiales con costo vigente y TC congelado | M | Caso de prueba: materiales S/ 3,126.00 |
| RF-CAL-02 | Calcular horas por fase con factor de dificultad | M | `ASM-CAM-EXT` en zona con factor 1.25 da 4.25 h por unidad |
| RF-CAL-03 | Calcular mano de obra por punto (A) y por día útil (B) y aplicar la regla configurada (por defecto, la mayor) | M | Caso de prueba: A = S/ 615.00, B = S/ 575.00, aplicada S/ 615.00 |
| RF-CAL-04 | Calcular días de obra con buffer y redondeo a medio día | M | 25.4 h con 2 personas da 2.5 días |
| RF-CAL-05 | Calcular costos, margen sobre venta, descuento e IGV 18 % | M | Caso de prueba: venta S/ 5,926.11; IGV S/ 1,066.70; total S/ 6,992.81 |
| RF-CAL-06 | Emitir alertas: margen bajo el mínimo, diferencia A/B mayor a 15 %, oferta vencida | M | Cada alerta tiene código, texto y severidad |
| RF-CAL-07 | Generar cronograma por fases | S | Horas y días por fase; el total coincide con el plazo |
| RF-CAL-08 | Aritmética exacta con redondeo mitad hacia arriba | M | Ningún monto usa `float`; diferencias de céntimos entre pantalla, PDF y Excel = 0 |

### 4.8 APR — Aprobaciones y emisión

| ID | Requisito | Prior. | Criterios de aceptación |
|---|---|---|---|
| RF-APR-01 | Bloquear la emisión si el margen es menor al mínimo o el descuento supera el tope, sin aprobación | M | Emitir devuelve error `APPROVAL_REQUIRED` hasta que gerencia apruebe |
| RF-APR-02 | Gerencia aprueba o rechaza solicitudes con comentario | M | Queda registrado quién, cuándo y por qué |
| RF-APR-03 | Al emitir, congelar precios, TC, parámetros, horas y totales | M | Cambiar el catálogo después no altera una proforma emitida |
| RF-APR-04 | Registrar manualmente la respuesta del cliente (enviada, aprobada, rechazada) | M | Se guarda fecha y motivo de rechazo opcional |

### 4.9 DOC — Documentos

| ID | Requisito | Prior. | Criterios de aceptación |
|---|---|---|---|
| RF-DOC-01 | Generar PDF con resumen, alcance, detalle por zona, cronograma, servicios, condiciones y aceptación | M | Orden de secciones según la especificación; numeración de páginas; montos `S/ 1,234.56` |
| RF-DOC-02 | Generar Excel con hoja para el cliente y hoja interna con costos y margen | M | La hoja interna solo se incluye para gerencia y administrador |
| RF-DOC-03 | Generar Word con la misma estructura del PDF | S | Estilos corporativos; mismos totales |
| RF-DOC-04 | Los documentos para el cliente nunca muestran costos ni margen | M | Verificado con revisión del archivo generado |
| RF-DOC-05 | Enviar por correo o WhatsApp | C | Registro del envío en la proforma |

### 4.10 SER — Servicios y mantenimiento

| ID | Requisito | Prior. | Criterios de aceptación |
|---|---|---|---|
| RF-SER-01 | Gestionar servicios (tipo, tarifa, periodicidad, cobertura) | M | Tipos: visita, plan, bolsa de horas, preventivo |
| RF-SER-02 | Incluir servicios en la proforma con subtotal, IGV y total propios | M | `Servicios + IGV` se muestra aparte del total de instalación |
| RF-SER-03 | Contratos de mantenimiento con recordatorios de visita y renovación | C | Recordatorio 15 días antes de la fecha |

### 4.11 VIS, OT, REP y AUD

| ID | Requisito | Prior. | Criterios de aceptación |
|---|---|---|---|
| RF-VIS-01 | Registrar visita técnica con checklist por zona, fotos y medidas desde el celular | S | Las fotos se guardan con la visita; formato y tamaño validados |
| RF-VIS-02 | Convertir la visita en zonas de una proforma | C | Se crean zonas con notas y factor sugerido |
| RF-OT-01 | Crear orden de trabajo desde una proforma aprobada | S | La OT hereda zonas, materiales, horas y plazo |
| RF-OT-02 | Registrar horas reales por técnico y por ensamblaje | S | Horas ≥ 0 con fecha y técnico |
| RF-OT-03 | Mostrar comparativo de horas estimadas y reales | S | Desviación porcentual por ensamblaje |
| RF-REP-01 | Panel de indicadores: tiempo de cotización, % de proformas con corrección, cumplimiento de margen mínimo y adopción | S | Cálculo según las definiciones de la Visión |
| RF-REP-02 | Reportes de margen por proforma y tasa de cierre | C | Filtros por fecha y vendedor; exportación a Excel |
| RF-AUD-01 | Registrar cambios en precios, parámetros, descuentos, aprobaciones y estados | M | Cada registro guarda usuario, fecha, valor anterior y nuevo |

## 5. Requisitos no funcionales

| ID | Categoría | Requisito | Criterio / métrica |
|---|---|---|---|
| RNF-01 | Seguridad | Permisos aplicados en el servidor; un vendedor nunca recibe costos ni margen | Pruebas automáticas de cada endpoint por rol |
| RNF-02 | Seguridad | Contraseñas con `password_hash` (argon2id o bcrypt); sesiones con cookie `HttpOnly`, `Secure`, `SameSite` | Revisión de configuración |
| RNF-03 | Seguridad | Sentencias preparadas, validación de entradas, protección CSRF y XSS, HTTPS | Revisión de código y pruebas |
| RNF-04 | Rendimiento | Calcular una proforma de hasta 50 líneas | ≤ 2 s (percentil 95) |
| RNF-05 | Rendimiento | Carga de pantallas principales | ≤ 3 s en conexión móvil estándar |
| RNF-06 | Disponibilidad | Uso en horario laboral | ≥ 99 % mensual (mejor esfuerzo) |
| RNF-07 | Datos | Copia de seguridad diaria con retención de 14 días y restauración probada | Prueba de restauración trimestral |
| RNF-08 | Usabilidad | Diseño responsive; objetivos táctiles ≥ 44 px; textos en español (Perú) | Revisión en móvil y escritorio |
| RNF-09 | Accesibilidad | Contraste mínimo AA; no depender solo del color | Revisión manual |
| RNF-10 | Compatibilidad | Chrome, Edge, Safari y Firefox en sus dos últimas versiones principales | Pruebas manuales |
| RNF-11 | Mantenibilidad | Código tipado, PSR-12, PHPStan nivel 6 o superior; cobertura del motor de cálculo ≥ 95 % | Reporte de CI |
| RNF-12 | Precisión | Dinero con enteros en céntimos o BCMath; redondeo mitad hacia arriba | Pruebas del motor |
| RNF-13 | Auditoría | Bitácora inmutable de cambios sensibles | Registro verificable |
| RNF-14 | Localización | Moneda soles `S/ 1,234.56`; fechas `dd/mm/aaaa`; zona America/Lima | Revisión visual |
| RNF-15 | Capacidad | Hasta 20 usuarios y 1,000 proformas por año sin degradación | Prueba de carga básica |
| RNF-16 | Privacidad | Datos de clientes tratados conforme a la normativa peruana de protección de datos personales (Ley N.º 29733); acceso solo a usuarios autorizados | Validación con asesoría legal |
| RNF-17 | Observabilidad | Registro de errores de servidor y alertas de fallos críticos | Logs accesibles al administrador |

## 6. Reglas de negocio

| ID | Regla |
|---|---|
| RN-01 | Costo vigente de un producto = menor oferta vigente convertida a soles (`USD × TC venta × (1 + colchón)`), salvo proveedor preferido |
| RN-02 | Horas de línea = cantidad × (cableado + montaje) × factor de zona + cantidad × configuración |
| RN-03 | Capacidad por día = personas × horas efectivas × eficiencia de la cuadrilla |
| RN-04 | Días de obra = redondeo a medio día hacia arriba de `horas ÷ capacidad × (1 + buffer)` |
| RN-05 | Mano de obra aplicada = mayor entre método A y método B (configurable); los días salen siempre del método B |
| RN-06 | Costo directo = materiales + mano de obra + movilización; costo total = costo directo × (1 + gastos generales) |
| RN-07 | Valor de venta = costo total ÷ (1 − margen); IGV = 18 % sobre (valor de venta − descuento) |
| RN-08 | El vendedor puede descontar hasta 5 %; un descuento mayor, o un margen efectivo menor al mínimo, requiere aprobación de gerencia |
| RN-09 | Una proforma emitida es inmutable; los cambios generan una nueva versión |
| RN-10 | Una proforma sin respuesta pasa a "vencida" al superar su validez |

## 7. Trazabilidad con los objetivos

| Objetivo | Requisitos principales |
|---|---|
| O1 Reducir tiempo de cotización | RF-ENS-01..03, RF-PRO-02..04, RF-PRO-08, RF-CAL-01..05, RF-DOC-01 |
| O2 Eliminar errores de precio | RF-CAT-03..05, RF-PAR-01, RF-CAL-08, RF-APR-03, RF-AUD-01 |
| O3 Proteger el margen | RF-PAR-03, RF-CAL-06, RF-APR-01..02, RF-PRO-06 |
| O4 Plazos realistas | RF-CAL-02..04, RF-CAL-07, RF-OT-02..03 |
| O5 Centralizar precios y reglas | RF-CAT-01..04, RF-PAR-01..05, RF-ENS-01..03 |

## 8. Glosario

| Término | Definición |
|---|---|
| Proforma | Cotización formal enviada al cliente |
| Ensamblaje | Kit predefinido que representa un punto de instalación (materiales + horas) |
| Punto | Unidad de trabajo cotizable: una cámara, un access point, un portero, un punto de red |
| Método A / B | Mano de obra por costo referencial por punto / por horas a día útil |
| Cuadrilla | Personas asignadas a la obra (técnicos y ayudantes) |
| Costo vigente | Costo actual de un producto en soles, según ofertas de proveedores |
| Margen sobre venta | (Venta − costo) ÷ Venta |
