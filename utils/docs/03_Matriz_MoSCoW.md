# Matriz MoSCoW — Definición del MVP

**Versión:** 1.0 · 17 de octubre de 2026
**Criterio de corte del MVP:** *¿Se puede reemplazar Excel y Word para cotizar de punta a punta, con el margen protegido, sin esta función?* Si la respuesta es no, es **Must**.

| Prioridad | Significado | Destino |
|---|---|---|
| **Must have** | Sin esto el producto no cumple su objetivo | MVP |
| **Should have** | Importante, pero hay una alternativa temporal | MVP si hay capacidad; si no, Fase 2 |
| **Could have** | Deseable; aporta valor menor | Fase 2 o 3 |
| **Won't have (por ahora)** | Fuera del alcance acordado | No se construye; se reevalúa con datos |

---

## 1. Must have (MVP)

| ID | Funcionalidad | Requisitos PRD | Justificación |
|---|---|---|---|
| M-01 | Inicio de sesión, roles y usuarios | RF-AUT-01..03 | Sin acceso controlado no hay confidencialidad de costos |
| M-02 | Permisos por rol aplicados en la API (el vendedor no ve costos ni margen) | RNF-01 | Protege información comercial |
| M-03 | Clientes y proyectos | RF-CLI-01..03 | Base de toda proforma |
| M-04 | Catálogo de productos y proveedores | RF-CAT-01..02 | Fuente única de precios |
| M-05 | Ofertas por proveedor con moneda y vigencia; costo vigente | RF-CAT-03..04 | Resuelve el problema de precios por proveedor y dólar |
| M-06 | Tipo de cambio por fecha | RF-PAR-01 | Los costos en dólares dependen de él |
| M-07 | Parámetros de mano de obra y márgenes | RF-PAR-03 | Reglas de costo y margen |
| M-08 | Factores de dificultad | RF-PAR-04 | Ajusta horas según el sitio |
| M-09 | Plantillas de condiciones | RF-PAR-05 | Incluye / no incluye, pago, garantía |
| M-10 | Ensamblajes con horas y costo por punto | RF-ENS-01..03 | Acelera la cotización (O1) |
| M-11 | Constructor de proforma (zonas, líneas, cantidades) | RF-PRO-01..03 | Núcleo del producto |
| M-12 | Selección de cuadrilla y método de mano de obra | RF-PRO-04 | Días y costo de instalación |
| M-13 | Descuento con tope por rol | RF-PRO-06 | Control de margen |
| M-14 | Motor de cálculo: materiales, horas, mano de obra A y B, días, margen, IGV 18 % | RF-CAL-01..06, RF-CAL-08 | Elimina errores de cálculo (O2) |
| M-15 | Estados de la proforma y vencimiento | RF-PRO-10 | Seguimiento |
| M-16 | Bloqueo de emisión por margen o descuento y aprobación de gerencia | RF-APR-01..02 | Protege el margen (O3) |
| M-17 | Emisión con congelado de precios y parámetros | RF-APR-03..04 | Evita proformas que cambian solas |
| M-18 | PDF corporativo sin costos ni margen | RF-DOC-01, RF-DOC-04 | Documento para el cliente |
| M-19 | Excel con hoja interna restringida | RF-DOC-02 | Sustituye el flujo actual en Excel |
| M-20 | Servicios y mantenimiento en la proforma (sección aparte) | RF-SER-01..02, RF-PRO-07 | Segundo rubro del negocio |
| M-21 | Edición de incluye / no incluye y condiciones por proforma | RF-PRO-11 | Evita reclamos por alcance |
| M-22 | Bitácora de auditoría | RF-AUD-01 | Trazabilidad de precios y descuentos |
| M-23 | Datos de prueba para arrancar | Anexo A del blueprint | Permite validar antes de cargar el catálogo real |

## 2. Should have

| ID | Funcionalidad | Requisitos PRD | Alternativa temporal |
|---|---|---|---|
| S-01 | Comparador de cuadrillas (2, 3 y 4 personas) | RF-PRO-05 | Cambiar la cuadrilla a mano y observar el resultado |
| S-02 | Importación de catálogo desde Excel o CSV | RF-CAT-06 | Carga manual de productos y ofertas |
| S-03 | Alertas de ofertas vencidas o por vencer | RF-CAT-05 | Revisión manual del catálogo |
| S-04 | Duplicar proforma | RF-PRO-08 | Crear desde cero con ensamblajes |
| S-05 | Nueva versión con motivo | RF-PRO-09 | Duplicar y anotar el motivo aparte |
| S-06 | Cronograma por fases | RF-CAL-07 | Mostrar solo el plazo total en días |
| S-07 | Colchón cambiario | RF-PAR-02 | Ajustar el tipo de cambio manualmente |
| S-08 | Cambio y restablecimiento de contraseña | RF-AUT-04 | El administrador restablece contraseñas |
| S-09 | Word | RF-DOC-03 | Editar el PDF o usar la plantilla actual |
| S-10 | Panel de indicadores de éxito | RF-REP-01 | Hoja simple de seguimiento |
| S-11 | Visita técnica móvil con fotos y medidas | RF-VIS-01 | Fotos y notas por WhatsApp; el vendedor las transcribe |
| S-12 | Órdenes de trabajo y horas reales | RF-OT-01..03 | Registro en hoja aparte para calibrar tiempos |

## 3. Could have

| ID | Funcionalidad | Requisitos PRD |
|---|---|---|
| C-01 | Clonar ensamblajes | RF-ENS-04 |
| C-02 | Envío por correo o WhatsApp desde la app | RF-DOC-05 |
| C-03 | Contratos de mantenimiento con recordatorios | RF-SER-03 |
| C-04 | Convertir visita técnica en zonas de proforma | RF-VIS-02 |
| C-05 | Reportes de margen por proforma y tasa de cierre | RF-REP-02 |
| C-06 | Recomendaciones de calibración de horas | Fase 3 |
| C-07 | Importación de listas de precios de proveedores en su formato | Fase 3 |
| C-08 | Modo con conexión limitada para la visita técnica | Fase 3 |

## 4. Won't have (por ahora)

| Funcionalidad | Motivo | Cuándo reevaluar |
|---|---|---|
| Acceso del cliente a la app o aprobación en línea | Uso interno definido | Si se pide autoservicio |
| Facturación electrónica | No es el problema actual | Después de la Fase 2 |
| Contabilidad e inventario de almacén | Fuera del problema | Si aparece necesidad real |
| Compras a proveedores | Fuera del problema | Idem |
| Cronograma tipo Gantt y asignación de personal | Volumen bajo (15–20 proformas al mes) | Con datos de la Fase 2 |
| App móvil nativa | La web responsive cubre el uso | Si la web no alcanza |
| Integración automática con listas de precios de proveedores | Costo alto frente al volumen | Si los proveedores ofrecen API |
| Multiempresa | Una sola empresa | Si el producto se ofrece a terceros |

## 5. Definición del MVP

**Incluye todo lo Must (M-01 a M-23)** y, si hay capacidad, S-01 a S-06 por su bajo costo y alto impacto en uso diario.

| Resultado verificable del MVP | Criterio |
|---|---|
| Cotizar la casa de ejemplo de punta a punta | Total S/ 6,992.81 y 2.5 días, sin tocar Excel |
| Margen protegido | Una proforma con margen menor al mínimo no se emite sin gerencia |
| Confidencialidad | Ninguna respuesta de API para vendedor contiene costos ni margen |
| Estabilidad de precios | Una proforma emitida no cambia al actualizar el catálogo |
| Documento | PDF y Excel con los totales idénticos a los de pantalla |

## 6. Orden sugerido de construcción

1. M-14 (motor de cálculo, con pruebas) y M-23 (datos de prueba).
2. M-01, M-02, M-22 (acceso, permisos y auditoría).
3. M-03 a M-10 (datos maestros).
4. M-11 a M-13, M-15 a M-17 (constructor, estados, aprobación y emisión).
5. M-18, M-19, M-21 (documentos).
6. M-20 (servicios).
7. Should según capacidad.
