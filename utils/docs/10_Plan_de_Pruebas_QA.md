# Plan de Pruebas (QA Test Cases)

**Versión:** 1.0 · 17 de octubre de 2026
**Alcance:** MVP y requisitos Should marcados. Los casos de la Fase 2 figuran al final.

## 1. Estrategia

| Nivel | Qué cubre | Herramienta | Responsable | Criterio de salida |
|---|---|---|---|---|
| **Unitarias (motor)** | `QuoteCalculator`: costos, horas, días, margen, IGV, redondeo | PHPUnit | Desarrollo (IA) | 100 % de los casos CAL pasan; cobertura ≥ 95 % |
| **API / integración** | Endpoints, permisos por rol, estados, congelado | PHPUnit + base de datos de pruebas | Desarrollo (IA) | 100 % de la matriz de roles verificada |
| **Frontend** | Componentes críticos y flujos de pantalla | Vitest + React Testing Library | Desarrollo (IA) | Flujos F-02 y F-03 cubiertos |
| **Documentos** | PDF, Excel y Word generados | Pruebas automáticas + revisión visual | Desarrollo + usuario clave | Totales idénticos a pantalla |
| **Seguridad** | Autenticación, CSRF, inyección, XSS, visibilidad de campos | Pruebas automáticas + revisión | Desarrollo + revisor | Sin hallazgos críticos |
| **Aceptación (UAT)** | Proformas reales contra el Excel actual | Manual | Vendedores + gerencia | Aprobación escrita |

**Entorno de pruebas:** base de datos con los datos semilla (ficticios) y tipo de cambio **3.75**.
**Valores de referencia:** IGV 18 %; margen por defecto 30 %; mínimo 20 %; tope del vendedor 5 %; técnico S/ 140 por día; ayudante S/ 90 por día; 7 horas efectivas; buffer 15 %; movilización S/ 40 por día; gastos generales 8 %; eficiencia 2→100 %, 3→90 %, 4→80 %.

**Estados:** `Pendiente` · `En curso` · `Pasó` · `Falló` · `Bloqueado`.
**Severidad de defecto:** Crítica (dinero, permisos, pérdida de datos) · Alta · Media · Baja.

---

## 2. Motor de cálculo (CAL)

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|---|
| CAL-01 | Proforma de referencia (casa de 2 pisos) | Semilla cargada; cuadrilla 1 técnico + 1 ayudante; sin descuento | 1. Crear zonas y líneas: 4 × `ASM-CAM-EXT`, 2 × `ASM-AP`, 1 × `ASM-NVR`, 1 × `ASM-SW8`, 1 × `ASM-VP-CASA`<br>2. Calcular | Materiales **3,126.00**; horas **25.40** (cableado 6.20, montaje 12.50, config 6.70); método A **615.00**; método B **575.00**; aplicada **615.00**; movilización **100.00**; costo directo **3,841.00**; gastos generales **307.28**; costo total **4,148.28**; venta **5,926.11**; IGV **1,066.70**; total **6,992.81**; plazo **2.5 días**; margen efectivo **30.00 %** | Pendiente |
| CAL-02 | Costo vigente: menor oferta | Cámara bullet: TecnoSeg 38.00 USD y RedPro 41.00 USD, vigentes; TC venta 3.75 | Consultar costo vigente | **S/ 142.50** (TecnoSeg) | Pendiente |
| CAL-03 | Proveedor preferido | Igual que CAL-02; RedPro marcado como preferido | Consultar costo vigente | **S/ 153.75** (41 × 3.75) | Pendiente |
| CAL-04 | Colchón cambiario | Igual que CAL-02; colchón 2 % | Consultar costo vigente | **S/ 145.35** (38 × 3.75 × 1.02) | Pendiente |
| CAL-05 | Oferta vencida | Única oferta del producto venció ayer | Agregar el producto a una línea y calcular | Error `OFFER_EXPIRED`; la línea no se calcula | Pendiente |
| CAL-06 | Materiales de un ensamblaje | Semilla cargada | Calcular `ASM-CAM-EXT` | **S/ 223.50** (142.50 + 56.00 + 25.00) | Pendiente |
| CAL-07 | Factor de dificultad | Zona "Fachada" con factor 1.25 | Agregar 1 × `ASM-CAM-EXT` | Horas **4.25** (cableado 1.25; montaje 2.50; config 0.50 sin factor) | Pendiente |
| CAL-08 | Cuadrilla de 3 personas | Proforma de CAL-01 | Cambiar a 1 técnico + 2 ayudantes | Capacidad **18.90 h/día**; **2.0 días**; método B **640.00** | Pendiente |
| CAL-09 | Cuadrilla de 4 personas | Proforma de CAL-01 | Cambiar a 2 técnicos + 2 ayudantes | Capacidad **22.40 h/día**; **1.5 días**; método B **690.00** | Pendiente |
| CAL-10 | Comparador de cuadrillas | Proforma de CAL-01 | Consultar `/crew-comparison` | 2 pers.: 2.5 d / 575.00; 3 pers.: 2.0 d / 640.00; 4 pers.: 1.5 d / 690.00 | Pendiente |
| CAL-11 | Redondeo de medio día (sin buffer) | Buffer 0 %; 2 personas (cap. 14 h/día) | Calcular con 14.0 h y luego con 14.1 h | 14.0 h → **1.0 día**; 14.1 h → **1.5 días** | Pendiente |
| CAL-12 | Regla A/B: se aplica la mayor | Proforma de CAL-01 | Calcular con método `max_ab` | Mano de obra aplicada **615.00** (A > B) | Pendiente |
| CAL-13 | Método B forzado | Parámetro `labor_method = b` | Calcular CAL-01 | Mano de obra aplicada **575.00**; costo directo **3,801.00** | Pendiente |
| CAL-14 | Alerta A/B distintos (> 15 %) | Cuadrilla 1 + 1 | Línea: 1 × `ASM-PORT-EDIF`; calcular | A **150.00**; B **230.00** (1.0 día); aplicada **230.00**; alerta `LABOR_METHODS_DIFFER` | Pendiente |
| CAL-15 | Sin alerta A/B (≤ 15 %) | Cuadrilla 1 + 1 | Línea: 10 × `ASM-DROP`; calcular | Horas **18.00**; A **400.00**; B **345.00** (1.5 días); diferencia 13.75 %; **sin** alerta | Pendiente |
| CAL-16 | Descuento 5 % | Proforma de CAL-01 | Aplicar 5 % | Descuento **296.31**; base **5,629.80**; IGV **1,013.36**; total **6,643.16**; margen efectivo **26.32 %** | Pendiente |
| CAL-17 | Descuento 10 % | Proforma de CAL-01 | Aplicar 10 % | Descuento **592.61**; base **5,333.50**; IGV **960.03**; total **6,293.53**; margen **22.22 %**; `requires_approval = true` (descuento > 5 %) | Pendiente |
| CAL-18 | Descuento 20 % (margen bajo el mínimo) | Proforma de CAL-01 | Aplicar 20 % | Descuento **1,185.22**; base **4,740.89**; margen **12.50 %**; alerta `MARGIN_BELOW_MIN`; `requires_approval = true` | Pendiente |
| CAL-19 | Servicios en sección aparte | Proforma de CAL-01 | Agregar "Plan mensual de soporte remoto" S/ 180.00 | Servicios: venta **180.00**, IGV **32.40**, total **212.40**; total de instalación sigue **6,992.81** | Pendiente |
| CAL-20 | Sensibilidad al dólar | Proforma de CAL-01 | Cambiar TC venta a 3.90 y recalcular | Materiales **3,220.80** (+94.80) | Pendiente |
| CAL-21 | Redondeo mitad hacia arriba | Proforma de CAL-01 con 5 % | Verificar descuento exacto 296.3055 | Se muestra **296.31** | Pendiente |
| CAL-22 | Sin `float` en dinero | Revisión de código y pruebas | Buscar tipos `float` en el motor; ejecutar CAL-01 mil veces con distintos órdenes de líneas | Ningún `float` para dinero; resultado idéntico en todas las ejecuciones | Pendiente |
| CAL-23 | Cronograma por fases | Proforma de CAL-01 | Consultar `schedule` | Cableado 6.20 h / 0.44 d; montaje 12.50 h / 0.89 d; configuración 6.70 h / 0.48 d | Pendiente |
| CAL-24 | Coherencia entre canales | Proforma emitida de CAL-01 | Comparar pantalla, API, PDF y Excel | Todos los totales idénticos al céntimo | Pendiente |

---

## 3. Autenticación y seguridad (SEG)

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|---|
| SEG-01 | Inicio de sesión correcto | Usuario activo | `POST /auth/login` con credenciales válidas | `200`; cookie `HttpOnly`/`Secure`/`SameSite`; devuelve rol y `csrf_token` | Pendiente |
| SEG-02 | Contraseña incorrecta | Usuario activo | Login con contraseña errónea | `401`; mensaje genérico "Correo o contraseña incorrectos" | Pendiente |
| SEG-03 | Bloqueo tras 5 intentos | Usuario activo | 5 intentos fallidos y un sexto | Sexto intento: `423 ACCOUNT_LOCKED`; desbloqueo tras 15 minutos | Pendiente |
| SEG-04 | Usuario desactivado | Usuario desactivado | Intentar ingresar | `401` con el mismo mensaje genérico | Pendiente |
| SEG-05 | Expiración por inactividad | Sesión abierta | Esperar 30 minutos sin actividad y llamar a `/auth/me` | `401 UNAUTHENTICATED` | Pendiente |
| SEG-06 | Logout invalida la sesión | Sesión abierta | `POST /auth/logout` y reutilizar la cookie | `401` | Pendiente |
| SEG-07 | CSRF obligatorio | Sesión abierta | `POST /customers` sin `X-CSRF-Token` | `403 CSRF_INVALID` | Pendiente |
| SEG-08 | Inyección SQL | Sesión abierta | Buscar clientes con `' OR 1=1 --` y enviar la misma cadena en campos de texto | Sin error de SQL ni datos extra; se trata como texto | Pendiente |
| SEG-09 | XSS almacenado | Sesión abierta | Guardar `<script>alert(1)</script>` en notas del sitio y en nombre de cliente; abrir pantallas y PDF | El texto se muestra escapado; no se ejecuta | Pendiente |
| SEG-10 | Errores sin información interna | Producción simulada | Forzar un error 500 | Respuesta `SERVER_ERROR` sin trazas ni rutas; detalle solo en el log | Pendiente |
| SEG-11 | Contraseñas almacenadas con hash | Base de pruebas | Revisar `users.password_hash` | Hash argon2id o bcrypt; nunca texto plano | Pendiente |
| SEG-12 | Acceso sin sesión | Sin sesión | Llamar a `GET /quotes` | `401` | Pendiente |

---

## 4. Roles y permisos (PER)

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|---|
| PER-01 | Vendedor no ve costos en el cálculo | Vendedor con proforma propia | `POST /quotes/{id}/calculate` | Respuesta sin bloque `internal`; sin `materials_cost`, `total_cost` ni `effective_margin_pct` | Pendiente |
| PER-02 | Vendedor no ve costos en catálogo | Sesión de vendedor | `GET /products` y `GET /assemblies/{id}` | Sin costos ni ofertas de proveedor | Pendiente |
| PER-03 | Vendedor no accede a ofertas | Sesión de vendedor | `GET /products/{id}/offers` | `403` | Pendiente |
| PER-04 | Vendedor ve solo sus proformas | Dos vendedores con proformas | Vendedor A consulta `GET /quotes` | Solo las suyas | Pendiente |
| PER-05 | Proforma ajena | Proforma del vendedor B | Vendedor A abre `GET /quotes/{id}` de B | `404 NOT_FOUND` | Pendiente |
| PER-06 | Vendedor no cambia el margen | Sesión de vendedor | `PUT /quotes/{id}` con `margin_pct` | `403 FORBIDDEN` | Pendiente |
| PER-07 | Vendedor sobre parámetros | Sesión de vendedor | `GET /labor-params/current` | Solo `seller_max_discount_pct` y `validity_days` | Pendiente |
| PER-08 | Técnico sin precios | Técnico con obra asignada | Consultar la proforma asignada | Alcance y horas; sin precios, IGV ni total | Pendiente |
| PER-09 | Técnico sin catálogo | Sesión de técnico | `GET /products`, `GET /customers` | `403` | Pendiente |
| PER-10 | Gerencia ve costos | Sesión de gerencia | `POST /quotes/{id}/calculate` | Incluye bloque `internal` con costos y margen | Pendiente |
| PER-11 | Aprobación solo por gerencia | Solicitud pendiente | Administrador y vendedor llaman a `/approve` | `403`; gerencia: `200` | Pendiente |
| PER-12 | Solo el administrador cambia parámetros | Sesión de gerencia | `POST /labor-params` | `403`; administrador: `201` | Pendiente |
| PER-13 | Solo el administrador crea usuarios | Sesión de gerencia | `POST /users` | `403` | Pendiente |
| PER-14 | Hoja "Interno" del Excel | Proforma emitida | Descargar Excel como vendedor y como gerencia | Vendedor: sin hoja "Interno"; gerencia: con hoja "Interno" | Pendiente |
| PER-15 | Barrido de campos prohibidos | Respuestas JSON de todos los endpoints de lectura | Automatizar para V y T | Ningún campo de la lista prohibida: `materials_cost`, `labor_method_a`, `labor_method_b`, `labor_applied`, `travel`, `direct_cost`, `overhead`, `total_cost`, `effective_margin_pct`, `unit_cost`, `supplier` | Pendiente |
| PER-16 | Matriz completa | Cuentas de los 4 roles | Ejecutar cada fila de `09_Matriz_Roles_Permisos.md` | `2xx` si ✅; `403` si ❌; `404` si registro ajeno | Pendiente |

---

## 5. Clientes, catálogo, tipo de cambio y parámetros (DAT)

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|---|
| DAT-01 | Crear cliente con RUC válido | Sesión de vendedor | Crear cliente con RUC de 11 dígitos | `201`; cliente disponible para proformas | Pendiente |
| DAT-02 | RUC inválido | Sesión de vendedor | RUC de 10 dígitos | `422 VALIDATION_ERROR` en `document_number` | Pendiente |
| DAT-03 | Documento duplicado | Cliente existente | Crear otro con el mismo RUC | `409 CONFLICT` con `existing_id` | Pendiente |
| DAT-04 | Crear proyecto | Cliente existente | Crear proyecto: casa, 2 pisos | `201`; asociado al cliente | Pendiente |
| DAT-05 | Pisos inválidos | Cliente existente | Pisos = 0 | `422` | Pendiente |
| DAT-06 | SKU duplicado | Producto existente | Crear producto con el mismo SKU | `409` | Pendiente |
| DAT-07 | Costo de oferta no válido | Administrador | Oferta con costo 0 o negativo | `422` | Pendiente |
| DAT-08 | Vigencia anterior a la oferta | Administrador | `valid_until` < `offered_at` | `422` | Pendiente |
| DAT-09 | Tipo de cambio duplicado | Registro de hoy existente | Crear otro con la misma fecha | `409 CONFLICT` | Pendiente |
| DAT-10 | Producto usado no se borra | Producto presente en una proforma emitida | Intentar eliminarlo | Rechazado; solo se puede desactivar | Pendiente |
| DAT-11 | Importar catálogo con errores | Archivo de 50 filas, 3 con errores | `POST /catalog/import` | 47 importadas, 3 rechazadas con fila, campo y motivo | Pendiente |
| DAT-12 | Importar archivo inválido | Archivo `.exe` o mayor a 5 MB | Importar | `422` | Pendiente |
| DAT-13 | Ensamblaje sin componentes | Administrador | Guardar ensamblaje vacío | `422` | Pendiente |
| DAT-14 | Cambio de parámetros no afecta emitidas | Proforma emitida con técnico a S/ 140 | Cambiar a S/ 150 y consultar la proforma emitida | La emitida conserva S/ 140; las nuevas usan S/ 150; queda en bitácora | Pendiente |
| DAT-15 | Alerta de oferta por vencer | Oferta vence en 5 días | Listar catálogo | Oferta marcada como por vencer | Pendiente |

---

## 6. Proformas, aprobación y emisión (PRO)

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|---|
| PRO-01 | Crear proforma con correlativo | Cliente y proyecto | `POST /quotes` | `PF-2026-NNNN`; estado `borrador`; TC del día | Pendiente |
| PRO-02 | Correlativo bajo concurrencia | Dos usuarios | Crear 20 proformas en paralelo | Números únicos y consecutivos, sin duplicados | Pendiente |
| PRO-03 | Cantidad inválida | Proforma en borrador | Línea con cantidad 0 | `422` | Pendiente |
| PRO-04 | Línea sin ensamblaje ni producto | Proforma en borrador | `POST /zones/{id}/lines` sin ambos | `422` | Pendiente |
| PRO-05 | Descuento dentro del tope | Vendedor | Aplicar 5 % y emitir | Se emite sin aprobación | Pendiente |
| PRO-06 | Descuento sobre el tope bloquea | Vendedor | Aplicar 10 % e intentar emitir | `409 APPROVAL_REQUIRED` | Pendiente |
| PRO-07 | Solicitar y aprobar | Descuento 10 % | Vendedor solicita → gerencia aprueba → vendedor emite | Emitida; bitácora con solicitante, aprobador, fecha y comentario | Pendiente |
| PRO-08 | Rechazo con motivo | Solicitud pendiente | Gerencia rechaza con comentario | Proforma en borrador; vendedor ve el motivo | Pendiente |
| PRO-09 | Rechazo sin comentario | Solicitud pendiente | Gerencia rechaza sin comentario | `422` | Pendiente |
| PRO-10 | Cambios invalidan la aprobación | Aprobada, no emitida | Vendedor cambia la cantidad de una línea | Aprobación `invalidada`; emitir exige nueva solicitud | Pendiente |
| PRO-11 | Margen bajo el mínimo | Descuento 20 % (margen 12.50 %) | Intentar emitir | `409 APPROVAL_REQUIRED`; alerta `MARGIN_BELOW_MIN` | Pendiente |
| PRO-12 | Emitir sin líneas | Proforma vacía | Emitir | `422` | Pendiente |
| PRO-13 | Proforma emitida inmutable | Proforma emitida | `PUT` o `DELETE` sobre cabecera, zona, línea o servicio | `409 QUOTE_LOCKED` | Pendiente |
| PRO-14 | Precios congelados | Proforma emitida con total 6,992.81 | Subir el precio de una cámara y reabrir la proforma | Total sigue en **6,992.81** | Pendiente |
| PRO-15 | Integridad del congelado | Proforma emitida | Alterar manualmente `snapshot_json` y verificar `checksum` | La verificación detecta la alteración | Pendiente |
| PRO-16 | Emitir dos veces | Proforma emitida | Repetir `issue` | `409 QUOTE_LOCKED`; sin duplicados | Pendiente |
| PRO-17 | Nueva versión | Proforma emitida | `new-version` con motivo `error_precio` | `v2` en borrador; `v1` solo lectura; vínculo `parent_quote_id` | Pendiente |
| PRO-18 | Versionar un borrador | Proforma en borrador | `new-version` | `409` | Pendiente |
| PRO-19 | Vencimiento automático | Proforma enviada con validez 15 días | Ejecutar la tarea programada el día 16 | Estado `vencida` | Pendiente |
| PRO-20 | Respuesta del cliente | Proforma enviada | Registrar `rechazada` con motivo | Estado `rechazada`; fecha guardada | Pendiente |
| PRO-21 | Respuesta en estado incorrecto | Proforma en borrador | `customer-response` | `409` | Pendiente |
| PRO-22 | Duplicar proforma | Proforma anterior | `duplicate` | Copia en borrador con precios y TC actuales | Pendiente |
| PRO-23 | Condiciones editables por proforma | Plantilla por defecto | Editar "no incluye" en una proforma | Solo esa proforma cambia; la plantilla no | Pendiente |
| PRO-24 | Solo borradores se eliminan | Proforma emitida | `DELETE /quotes/{id}` | `409` | Pendiente |

---

## 7. Documentos (DOC)

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|---|
| DOC-01 | Estructura del PDF | Proforma emitida | Descargar PDF | Contiene, en orden: resumen, alcance (incluye / no incluye), detalle por zona, cronograma, servicios, condiciones, aceptación | Pendiente |
| DOC-02 | PDF sin información interna | Proforma emitida | Revisar el PDF (texto y metadatos) | Sin costos de compra, margen ni gastos generales | Pendiente |
| DOC-03 | Totales idénticos | Proforma de CAL-01 emitida | Comparar PDF y pantalla | Venta 5,926.11; IGV 1,066.70; total **6,992.81**; plazo **2.5 días** | Pendiente |
| DOC-04 | Formato de moneda y fechas | Proforma emitida | Revisar PDF | Montos `S/ 1,234.56`; fechas `dd/mm/aaaa` | Pendiente |
| DOC-05 | Numeración y marca | Proforma emitida | Revisar PDF de varias páginas | Número `PF-2026-NNNN`, versión, logotipo y numeración de páginas | Pendiente |
| DOC-06 | Excel con fórmulas | Proforma emitida | Abrir Excel como gerencia | Totales con fórmulas; hoja "Interno" con costos y margen | Pendiente |
| DOC-07 | Documento de proforma no emitida | Proforma en borrador | Descargar PDF | `409` | Pendiente |
| DOC-08 | Caracteres especiales | Cliente "Peña & Muñoz S.A.C." | Generar PDF y Excel | Se ven tildes, eñes y símbolos correctamente | Pendiente |
| DOC-09 | Proforma grande | 50 líneas | Generar PDF | Se genera en ≤ 5 s y sin cortes de tabla | Pendiente |
| DOC-10 | Word (Should) | Proforma emitida | Descargar Word | Misma estructura y totales que el PDF | Pendiente |

---

## 8. Auditoría (AUD)

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|---|
| AUD-01 | Cambio de precio auditado | Oferta de 38.00 USD | Cambiar a 40.00 y consultar `/audit-log` | Registro con usuario, fecha, valor anterior (38.00) y nuevo (40.00) | Pendiente |
| AUD-02 | Cambios de parámetros auditados | Administrador | Cambiar costo del técnico | Registro con versión anterior y nueva | Pendiente |
| AUD-03 | Emisiones y aprobaciones auditadas | Proforma emitida con aprobación | Consultar bitácora | Registros de solicitud, aprobación y emisión | Pendiente |
| AUD-04 | Bitácora no modificable | Usuario administrador | Intentar editar o borrar un registro por API | No existe endpoint; la base rechaza `UPDATE`/`DELETE` desde la aplicación | Pendiente |
| AUD-05 | Acceso a la bitácora | Sesión de vendedor | `GET /audit-log` | `403` | Pendiente |

---

## 9. No funcionales (NFR)

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|---|
| NFR-01 | Rendimiento del cálculo | Proforma de 50 líneas | 100 llamadas a `calculate` | Percentil 95 ≤ 2 s | Pendiente |
| NFR-02 | Carga de pantallas | Conexión móvil estándar | Medir lista, constructor y revisión | ≤ 3 s | Pendiente |
| NFR-03 | Responsive | Pantalla de 375 px de ancho | Recorrer F-02 completo en móvil | Sin scroll horizontal en tablas; botones ≥ 44 px; barra de totales visible | Pendiente |
| NFR-04 | Navegadores | Chrome, Edge, Safari y Firefox | Ejecutar F-02 | Funciona en los cuatro | Pendiente |
| NFR-05 | Contraste y foco | Interfaz completa | Revisión con herramienta de contraste y teclado | Contraste AA; foco visible | Pendiente |
| NFR-06 | Copia de seguridad | Base con datos de prueba | Ejecutar copia y restaurarla en otro entorno | Datos íntegros; proforma emitida idéntica | Pendiente |
| NFR-07 | Estado del sistema | API y base activas | `GET /health` con y sin base de datos | `200 ok`; `503 degraded` si falla la base | Pendiente |
| NFR-08 | Zona horaria | Servidor en UTC | Emitir a las 23:30 hora de Lima | Fecha de emisión y vencimiento correctas en America/Lima | Pendiente |
| NFR-09 | Registro de errores | Producción simulada | Forzar un error | Línea en el log con fecha, ruta y mensaje | Pendiente |
| NFR-10 | Concurrencia de edición | Dos usuarios sobre la misma proforma | Ambos guardan cambios | El segundo recibe aviso de conflicto o se aplica la última versión con registro | Pendiente |

---

## 10. Aceptación de usuario (UAT)

| ID | Caso de prueba | Precondiciones | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|---|
| UAT-01 | Proformas reales frente al Excel actual | Catálogo y tarifas reales cargados; 3 a 5 proformas recientes | Rehacer cada proforma en la app y comparar con el Excel | Diferencias explicadas (error del Excel o de la app); ninguna sin explicación | Pendiente |
| UAT-02 | Tiempo de cotización | Línea base medida | 5 vendedores cotizan 3 casos | Tiempo registrado por la app; reducción frente a la línea base | Pendiente |
| UAT-03 | Revisión de gerencia | Proformas con descuento | Gerencia aprueba y rechaza | El flujo es comprensible sin capacitación extra | Pendiente |
| UAT-04 | Documento para cliente | Proforma real | Un vendedor envía el PDF a un cliente de prueba | Aprobado por gerencia en formato y condiciones | Pendiente |
| UAT-05 | Confidencialidad | Cuentas reales | Vendedor intenta ver costos en pantallas y documentos | No puede | Pendiente |
| UAT-06 | Firma de aceptación | Todos los anteriores | Revisión conjunta | Acta de aceptación firmada | Pendiente |

---

## 11. Casos de Fase 2 (resumen)

| ID | Caso de prueba | Resultado esperado | Estado |
|---|---|---|---|
| VIS-01 | Registrar visita con checklist, foto y medida de 12.5 m | Datos guardados y visibles al vendedor | Pendiente |
| VIS-02 | Subir archivo que no es imagen | Rechazado por tipo MIME real | Pendiente |
| VIS-03 | Foto mayor al tamaño máximo | Rechazada con mensaje claro | Pendiente |
| OT-01 | Crear orden de trabajo desde proforma aprobada | Hereda zonas, materiales, horas y plazo | Pendiente |
| OT-02 | Crear orden desde una proforma no aprobada | `409` | Pendiente |
| OT-03 | Registrar 4.2 h reales frente a 3.5 estimadas | Desviación **+20 %** | Pendiente |
| OT-04 | Técnico registra horas de una obra no asignada | `403` | Pendiente |

---

## 12. Criterios de aceptación del MVP

| Criterio | Condición |
|---|---|
| Motor de cálculo | CAL-01 a CAL-24 en estado `Pasó` |
| Seguridad y permisos | SEG-01 a SEG-12 y PER-01 a PER-16 en `Pasó`; sin hallazgos críticos |
| Datos y proformas | DAT, PRO, DOC y AUD en `Pasó` |
| Rendimiento y respaldo | NFR-01, NFR-02, NFR-06 y NFR-07 en `Pasó` |
| UAT | UAT-01, UAT-04, UAT-05 y UAT-06 en `Pasó` |
| Defectos | 0 críticos y 0 altos abiertos |

## 13. Gestión de defectos

| Campo | Contenido |
|---|---|
| ID | `BUG-NNN` |
| Título y descripción | Qué ocurre y qué se esperaba |
| Pasos y evidencia | Pasos para reproducir; capturas o archivos |
| Severidad | Crítica, Alta, Media, Baja |
| Estado | Nuevo → Asignado → Corregido → Verificado → Cerrado |
| Regla | Todo defecto crítico en dinero o permisos detiene el despliegue; cada corrección agrega una prueba de regresión |
