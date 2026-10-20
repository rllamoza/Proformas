# Documento de Visión y Alcance (Product Brief)

**Producto:** Aplicación web de proformas para instalaciones de redes, WiFi, porteros IP y cámaras
**Versión:** 1.0 · 17 de octubre de 2026
**Tipo de uso:** interno (vendedores, técnicos, gerencia y administración)
**Estado:** borrador para validación

---

## 1. Resumen estratégico

La empresa vende equipos e instala redes, WiFi, porteros IP y cámaras en casas y edificios. Hoy cotiza en Excel y Word. Eso genera dos pérdidas medibles: **tiempo** (cada proforma tarda más de lo que debería) y **dinero** (errores de precio que se traducen en márgenes que no se cobran o en correcciones frente al cliente).

El producto es una **herramienta interna de cotización** que convierte un levantamiento de campo en una proforma correcta, con costos al día, mano de obra y plazo de obra calculados con reglas, y un documento listo para enviar. No busca ser un sistema contable ni un ERP: busca que **cotizar sea rápido, consistente y rentable**.

**Recomendación:** construir un MVP acotado, rápido y con reglas de negocio blindadas por pruebas automáticas, y **medir antes y después** para demostrar el valor. Con un volumen de 15 a 20 proformas al mes, el retorno viene de **proteger el margen y evitar errores**, no de escala; por eso el alcance inicial se limita a lo esencial.

---

## 2. Problema

| # | Problema | Efecto en el negocio |
|---|---|---|
| 1 | **Demora en cotizar:** cada proforma se arma a mano en Excel/Word, buscando precios y recalculando mano de obra | El cliente espera; se pierde velocidad frente a la competencia; el vendedor invierte horas en tareas repetitivas |
| 2 | **Errores de precio:** costos desactualizados, cambios del dólar no reflejados, fórmulas manuales, materiales olvidados | Margen erosionado, adicionales sin cobrar, correcciones y pérdida de confianza |
| 3 | **Precios que cambian por proveedor y por dólar** sin un lugar único donde consultarlos | Cada vendedor puede cotizar con un costo distinto para el mismo producto |
| 4 | **Mano de obra y plazos estimados "a ojo"** | Obras que toman más días o más horas de lo cotizado; cuadrillas mal dimensionadas |
| 5 | **Sin trazabilidad:** no se sabe qué se cotizó, con qué precios ni cuántas proformas se cierran | Imposible mejorar, ni corregir causas de error |

**Causa raíz:** el conocimiento de precios, tiempos y reglas vive en hojas de cálculo y en la cabeza de cada persona, no en un sistema único.

---

## 3. Público objetivo

Producto de **uso exclusivamente interno**. El cliente final no accede a la aplicación; recibe el documento (PDF, Excel o Word).

| Usuario | Cantidad estimada | Necesidad principal | Uso típico |
|---|---|---|---|
| **Vendedor** | 3 | Cotizar rápido y sin errores, desde oficina o en la visita | Crear proformas, consultar precios de venta, exportar y enviar |
| **Técnico** | 5 | Registrar lo que ve en obra y conocer alcance y horas | Visita técnica, materiales, horas reales (según fase) |
| **Gerencia** | 1 a 2 | Control de margen, descuentos y rentabilidad | Aprobar excepciones, ver costos y reportes |
| **Administrador** | 1 | Mantener catálogo, tarifas y tipo de cambio actualizados | Cargar ofertas de proveedores, ajustar parámetros |

**Volumen:** 15 a 20 proformas al mes. Es un volumen bajo, lo que implica que la aplicación debe ser **simple de operar y barata de mantener**.

---

## 4. Propuesta de valor

> Para el equipo comercial y técnico de la empresa, que hoy cotiza en Excel y Word, esta aplicación es una **herramienta interna de cotización** que **calcula costos, mano de obra, días de obra e IGV con reglas únicas y precios al día**, de modo que **cada proforma sale rápida, consistente y con el margen protegido**. A diferencia de las hojas de cálculo, **no depende de la memoria ni de las fórmulas de cada persona**.

**Beneficios clave**

| Para quién | Beneficio |
|---|---|
| Vendedor | Proforma completa en minutos, usando ensamblajes ya armados (cámara, access point, portero) en lugar de ítem por ítem |
| Gerencia | Margen visible, mínimos exigidos y aprobación de descuentos; cero sorpresas |
| Administración | Un único catálogo con ofertas por proveedor y tipo de cambio; precios vigentes para todos |
| Técnico | Alcance claro y datos de la visita centralizados |
| Empresa | Plazos realistas (días por fases y cuadrilla) y datos para mejorar con cada obra |

**Diferenciadores**

1. **Ensamblajes por punto:** el vendedor cotiza "puntos", no listas de materiales sueltos.
2. **Precios por proveedor y por dólar,** con tipo de cambio congelado en cada proforma.
3. **Dos métodos de mano de obra** (por punto y por día útil) con cuadrilla variable, para decidir entre costo y rapidez de entrega.
4. **Motor de cálculo único** probado automáticamente: el mismo resultado en pantalla, PDF y Excel.

---

## 5. Objetivos

### 5.1 Objetivos de negocio

| ID | Objetivo | Resultado esperado |
|---|---|---|
| O1 | Reducir el tiempo de elaboración de una proforma | Cotizar en una fracción del tiempo actual |
| O2 | Eliminar errores de precio y de cálculo en proformas emitidas | Proformas con costos vigentes y totales correctos |
| O3 | Proteger el margen | Ninguna proforma emitida por debajo del margen mínimo sin aprobación |
| O4 | Dar plazos de obra realistas | Días de obra estimados con reglas, comparables con lo real |
| O5 | Centralizar precios y reglas | Un solo catálogo y una sola fuente de tarifas |

### 5.2 Objetivos del producto (MVP)

- Emitir proformas en **PDF y Excel** con IGV 18 % y plazo de obra.
- Gestionar catálogo, ofertas por proveedor, tipo de cambio y ensamblajes.
- Calcular mano de obra por punto y por día útil con cuadrilla variable.
- Controlar permisos por rol (el vendedor no ve costos ni margen).
- Incluir un rubro básico de mantenimiento y servicios.

---

## 6. Cómo medir el éxito

Como hoy no existe una medición, el primer paso es **establecer una línea base**. Proponemos:

**Paso 1 — Línea base (2 semanas antes del lanzamiento).** Con las 8 a 10 proformas del período, registrar en una hoja simple:

- Tiempo desde que llega la solicitud hasta que se envía la proforma (horas o minutos).
- Cantidad de proformas con **corrección posterior** (precio, material olvidado, cálculo).
- Margen proyectado de cada proforma y, cuando la obra termina, margen real aproximado.

**Paso 2 — Indicadores del producto.**

| Indicador | Cómo se mide | Línea base | Meta propuesta (hipótesis, validar con la línea base) |
|---|---|---|---|
| **Tiempo de cotización** | Minutos desde el inicio hasta el envío de la proforma (la app registra fechas de creación y emisión) | Medir | Reducción de al menos 50 % |
| **Proformas con error o corrección** | Conteo de proformas corregidas tras enviarse / total emitidas | Medir | Cercano a 0 por errores de catálogo o cálculo |
| **Cumplimiento de margen mínimo** | % de proformas emitidas con margen ≥ mínimo (o aprobadas por gerencia) | Medir | 100 % |
| **Adopción** | % de proformas emitidas desde la app | 0 % | 100 % a los 30 días |
| **Precisión de plazo** | Días estimados frente a días reales (requiere registrar la obra, Fase 2) | Medir | Desviación menor a 20 % |
| **Tasa de cierre** | Proformas aprobadas / enviadas | Medir | Informativo; no es meta inicial |

Las metas son **hipótesis de trabajo**. Se confirman o ajustan con la línea base, no se prometen antes de medir.

---

## 7. Alcance

### 7.1 Dentro del alcance (MVP)

| Área | Incluye |
|---|---|
| Clientes y proyectos | Datos básicos del cliente, dirección y tipo de inmueble (casa, edificio, oficina) |
| Catálogo | Productos, proveedores, ofertas con moneda (USD/PEN) y vigencia, importación desde Excel/CSV |
| Tipo de cambio | Registro por fecha y congelado por proforma |
| Ensamblajes | Kits por punto con materiales, horas por fase y costo referencial por punto |
| Proforma | Zonas, líneas, factores de dificultad, descuentos, cuadrilla, comparación de cuadrillas |
| Cálculo | Costo, mano de obra (A y B), días de obra, gastos generales, margen, IGV 18 % |
| Servicios | Mantenimiento y servicios como rubro aparte, con tarifa y periodicidad |
| Documentos | PDF corporativo y Excel |
| Seguridad | Usuarios, roles y permisos; el vendedor no ve costos ni margen |
| Datos de prueba | Catálogo de ejemplo para arrancar y probar |

### 7.2 Fuera del alcance (por ahora)

| Elemento | Motivo |
|---|---|
| Acceso del cliente a la app o aprobación en línea | Uso interno definido |
| Facturación electrónica y contabilidad | Se evaluará integración posterior |
| Control de inventario y compras | No es parte del problema actual |
| Planificación avanzada de obra (Gantt, asignación de personal) | Volumen bajo; se evaluará con datos reales |
| Reportes avanzados y calibración automática de horas | Dependen de acumular datos |
| App móvil nativa | Se usa web responsive |

### 7.3 Fases propuestas

| Fase | Contenido | Objetivo |
|---|---|---|
| **MVP** | Cotizar de punta a punta con PDF y Excel | Reemplazar Excel/Word en las proformas nuevas |
| **Fase 2** | Word, versiones y aprobaciones, visita técnica móvil, órdenes de trabajo y horas reales, contratos de mantenimiento | Cerrar el ciclo y medir plazos reales |
| **Fase 3** | Reportes y recomendaciones de calibración | Mejora continua con datos |

Con 15 a 20 proformas al mes, la Fase 3 solo se justifica si la Fase 2 demuestra valor.

---

## 8. Supuestos, restricciones y dependencias

**Supuestos**

- Los precios de proveedores (en dólares y soles) se actualizarán de forma manual o por importación de Excel; no existe integración automática.
- Los técnicos pueden aportar horas por tarea para calibrar los ensamblajes.
- El IGV es 18 % sobre el valor de venta.
- Los 8 usuarios cuentan con navegador moderno (escritorio y celular).

**Restricciones**

- **Desarrollo rápido y a cargo de una IA.** Esto exige especificaciones precisas, pruebas automáticas del motor de cálculo y revisión humana del resultado antes de usarlo con clientes.
- Stack definido: **API en PHP puro (sin Laravel)** y **React** en el frontend.
- Presupuesto de infraestructura bajo, compatible con hosting compartido.

**Dependencias**

- Entrega de proformas reales (Excel/Word) para replicar formato y condiciones comerciales.
- Datos reales de catálogo, tarifas y costos por día antes del lanzamiento.
- Persona responsable de **validar los cálculos** contra casos reales.

---

## 9. Riesgos principales

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Errores de cálculo introducidos por el desarrollo con IA | Proformas incorrectas, pérdida de confianza | Motor puro con pruebas automáticas y validación contra 3 a 5 proformas reales antes del lanzamiento |
| Horas estimadas por debajo de la realidad | Margen perdido | Calibrar con técnicos y registrar horas reales desde la Fase 2 |
| Catálogo desactualizado o variación del dólar | Costos incorrectos | Vigencia por oferta, alertas de vencimiento, tipo de cambio congelado, validez corta de proforma |
| Resistencia a dejar Excel | Baja adopción | Importar y exportar Excel; formato de proforma igual al actual; capacitación breve |
| Vendedores con acceso a costos | Fuga de información | Permisos aplicados en el servidor, no solo en pantalla |
| Alcance que crece (más módulos antes del MVP) | Retrasos | Mantener la matriz de prioridades y dejar lo no esencial para fases posteriores |
| No medir resultados | No se demuestra el valor | Línea base antes de lanzar e indicadores registrados por la propia app |

---

## 10. Decisiones tomadas y preguntas pendientes

**Decisiones**

- Uso interno únicamente.
- Soles como moneda, IGV 18 %, precios por proveedor y por dólar.
- Mano de obra por punto y por día útil con cuadrilla variable.
- Aplicación web: API en PHP puro y frontend en React.
- Salidas: PDF y Excel en el MVP; Word en la Fase 2.

**Pendientes (se resolverán en los siguientes documentos)**

1. Nombre de la empresa o marca y logotipo para el documento y la plantilla.
2. Margen mínimo, descuento máximo por rol y quién aprueba excepciones.
3. Forma de pago, adelanto y garantía estándar de las proformas.
4. Precios al cliente con IGV incluido o sin IGV.
5. Proforma en soles, en dólares o ambas.

---

## 11. Aprobación

| Rol | Nombre | Fecha | Firma |
|---|---|---|---|
| Responsable del producto | | | |
| Gerencia | | | |
| Responsable técnico | | | |
