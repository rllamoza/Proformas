# Matriz de Roles y Permisos (Seguridad)

**Versión:** 1.0 · 17 de octubre de 2026
**Principio:** *mínimo privilegio, aplicado en el servidor.* Un permiso que no está en esta matriz **no existe**. La interfaz solo refleja lo que la API permite; nunca lo sustituye.

## Leyenda

| Símbolo | Significado |
|---|---|
| ✅ | Permitido |
| ❌ | Denegado (la API responde `403 FORBIDDEN`) |
| 🔒 P | Solo registros **propios** (por ejemplo, las proformas que el vendedor creó) |
| 👁 | Solo lectura |
| ⚠️ | Permitido con condición (ver notas) |

**Roles:** **V** Vendedor · **T** Técnico · **G** Gerencia · **A** Administrador

---

## 1. Funciones por módulo

### 1.1 Acceso y usuarios

| Acción | Ruta | V | T | G | A |
|---|---|---|---|---|---|
| Iniciar y cerrar sesión | `POST /auth/login`, `/auth/logout` | ✅ | ✅ | ✅ | ✅ |
| Ver su propio perfil | `GET /auth/me` | ✅ | ✅ | ✅ | ✅ |
| Cambiar su contraseña | `POST /auth/password/change` | ✅ | ✅ | ✅ | ✅ |
| Listar y ver usuarios | `GET /users` | ❌ | ❌ | 👁 | ✅ |
| Crear y editar usuarios | `POST/PUT /users` | ❌ | ❌ | ❌ | ✅ |
| Activar y desactivar usuarios | `POST /users/{id}/deactivate` | ❌ | ❌ | ❌ | ✅ |
| Asignar rol y tope de descuento | `PUT /users/{id}` | ❌ | ❌ | ❌ | ✅ |

### 1.2 Clientes y proyectos

| Acción | Ruta | V | T | G | A |
|---|---|---|---|---|---|
| Buscar y ver clientes | `GET /customers` | ✅ | ❌ | ✅ | ✅ |
| Crear y editar clientes | `POST/PUT /customers` | ✅ | ❌ | ✅ | ✅ |
| Ver proyectos | `GET /projects` | ✅ | 🔒 asignados | ✅ | ✅ |
| Crear y editar proyectos | `POST/PUT /projects` | ✅ | ❌ | ✅ | ✅ |

### 1.3 Catálogo, proveedores y precios

| Acción | Ruta | V | T | G | A |
|---|---|---|---|---|---|
| Ver productos (**sin costos**) | `GET /products` | ✅ | ❌ | ✅ | ✅ |
| Ver costos y ofertas por proveedor | `GET /products/{id}/offers` | ❌ | ❌ | 👁 | ✅ |
| Crear y editar productos | `POST/PUT /products` | ❌ | ❌ | ❌ | ✅ |
| Crear y editar ofertas | `POST /products/{id}/offers`, `PUT /supplier-offers/{id}` | ❌ | ❌ | ❌ | ✅ |
| Gestionar proveedores | `/suppliers` | ❌ | ❌ | 👁 | ✅ |
| Importar catálogo (Excel/CSV) | `POST /catalog/import` | ❌ | ❌ | ❌ | ✅ |
| Ver tipo de cambio vigente | `GET /exchange-rates/current` | ✅ | ❌ | ✅ | ✅ |
| Registrar y editar tipo de cambio | `POST/PUT /exchange-rates` | ❌ | ❌ | ❌ | ✅ |

### 1.4 Ensamblajes y parámetros

| Acción | Ruta | V | T | G | A |
|---|---|---|---|---|---|
| Ver ensamblajes (**sin costos**) | `GET /assemblies` | ✅ | 👁 | ✅ | ✅ |
| Ver costos de ensamblajes | `GET /assemblies/{id}` (bloque de costos) | ❌ | ❌ | 👁 | ✅ |
| Crear, editar y clonar ensamblajes | `POST/PUT /assemblies` | ❌ | ❌ | ❌ | ✅ |
| Ver parámetros de mano de obra y márgenes | `GET /labor-params/current` | ⚠️ | ❌ | 👁 | ✅ |
| Cambiar parámetros (nueva versión) | `POST /labor-params` | ❌ | ❌ | ❌ | ✅ |
| Ver factores de dificultad | `GET /difficulty-factors` | ✅ | 👁 | ✅ | ✅ |
| Gestionar factores de dificultad | `POST/PUT /difficulty-factors` | ❌ | ❌ | ❌ | ✅ |
| Ver plantillas de condiciones | `GET /condition-templates` | ✅ | ❌ | ✅ | ✅ |
| Gestionar plantillas de condiciones | `POST/PUT /condition-templates` | ❌ | ❌ | ❌ | ✅ |
| Ver servicios y tarifas | `GET /services` | ✅ | ❌ | ✅ | ✅ |
| Gestionar servicios | `POST/PUT /services` | ❌ | ❌ | ❌ | ✅ |

### 1.5 Proformas

| Acción | Ruta | V | T | G | A |
|---|---|---|---|---|---|
| Listar proformas | `GET /quotes` | 🔒 P | ❌ | ✅ todas | ✅ todas |
| Ver detalle con precios | `GET /quotes/{id}` | 🔒 P | ❌ | ✅ | ✅ |
| Ver alcance y horas (**sin precios**) | `GET /quotes/{id}` | — | 🔒 asignadas | — | — |
| Crear proforma | `POST /quotes` | ✅ | ❌ | ✅ | ✅ |
| Editar cabecera, zonas, líneas y servicios (en borrador) | `PUT /quotes/{id}`, `/zones`, `/lines`, `/quote-services` | 🔒 P | ❌ | ✅ | ✅ |
| Cambiar el margen de la proforma | `PUT /quotes/{id}` (campo `margin_pct`) | ❌ | ❌ | ✅ | ✅ |
| Aplicar descuento hasta su tope (5 %) | `PUT /quotes/{id}` (campo `discount_pct`) | 🔒 P | ❌ | ✅ | ✅ |
| Aplicar descuento sobre el tope | `PUT /quotes/{id}` | ⚠️ requiere aprobación | ❌ | ✅ | ✅ |
| Calcular (ver totales y plazo) | `POST /quotes/{id}/calculate` | 🔒 P (sin costos) | ❌ | ✅ (con costos) | ✅ (con costos) |
| Comparar cuadrillas | `GET /quotes/{id}/crew-comparison` | 🔒 P (sin costos) | ❌ | ✅ | ✅ |
| Eliminar proforma en borrador | `DELETE /quotes/{id}` | 🔒 P | ❌ | ❌ | ✅ |
| Duplicar | `POST /quotes/{id}/duplicate` | ✅ | ❌ | ✅ | ✅ |

### 1.6 Aprobación, emisión y seguimiento

| Acción | Ruta | V | T | G | A |
|---|---|---|---|---|---|
| Solicitar aprobación | `POST /quotes/{id}/request-approval` | 🔒 P | ❌ | ❌ | ❌ |
| Ver solicitudes pendientes | `GET /approvals` | ❌ | ❌ | ✅ | 👁 |
| Aprobar o rechazar | `POST /quotes/{id}/approve`, `/reject` | ❌ | ❌ | ✅ | ❌ |
| Emitir proforma | `POST /quotes/{id}/issue` | ⚠️ 🔒 P | ❌ | ✅ | ✅ |
| Marcar como enviada | `POST /quotes/{id}/mark-sent` | 🔒 P | ❌ | ✅ | ❌ |
| Registrar respuesta del cliente | `POST /quotes/{id}/customer-response` | 🔒 P | ❌ | ✅ | ❌ |
| Crear nueva versión | `POST /quotes/{id}/new-version` | 🔒 P | ❌ | ✅ | ❌ |

### 1.7 Documentos y control

| Acción | Ruta | V | T | G | A |
|---|---|---|---|---|---|
| Descargar PDF (sin costos) | `GET /quotes/{id}/documents/pdf` | 🔒 P | ❌ | ✅ | ✅ |
| Descargar Excel **sin** hoja interna | `GET /quotes/{id}/documents/xlsx` | 🔒 P | ❌ | — | — |
| Descargar Excel **con** hoja interna | `GET /quotes/{id}/documents/xlsx` | ❌ | ❌ | ✅ | ✅ |
| Descargar Word | `GET /quotes/{id}/documents/docx` | 🔒 P | ❌ | ✅ | ✅ |
| Ver bitácora de auditoría | `GET /audit-log` | ❌ | ❌ | ✅ | ✅ |
| Ver indicadores de éxito | `GET /reports/kpis` | ❌ | ❌ | ✅ | 👁 |
| Ver estado del sistema | `GET /health` | público | público | público | público |

### 1.8 Visita técnica y obra (Fase 2)

| Acción | Ruta | V | T | G | A |
|---|---|---|---|---|---|
| Crear y ver visitas técnicas | `/site-visits` | ✅ | 🔒 P / asignadas | ✅ | ✅ |
| Subir fotos y medidas | `/site-visit-items/{id}/photos` | ✅ | 🔒 P | ❌ | ❌ |
| Crear orden de trabajo desde proforma aprobada | `POST /quotes/{id}/work-order` | ✅ | ❌ | ✅ | ✅ |
| Registrar horas reales | `POST /work-orders/{id}/logs` | ❌ | 🔒 asignadas | ❌ | ✅ |
| Ver comparativo estimado y real | `GET /work-orders/{id}/comparison` | ❌ | 👁 horas | ✅ | ✅ |

---

## 2. Visibilidad de campos sensibles

| Campo | V | T | G | A |
|---|---|---|---|---|
| Precio de venta, descuento, IGV, total | ✅ | ❌ | ✅ | ✅ |
| Plazo de obra (días) | ✅ | ✅ | ✅ | ✅ |
| Horas por ensamblaje y por fase | ✅ | ✅ | ✅ | ✅ |
| Costo de compra y ofertas por proveedor | ❌ | ❌ | ✅ | ✅ |
| Costo de mano de obra y costos por día | ❌ | ❌ | ✅ | ✅ |
| Gastos generales y margen | ❌ | ❌ | ✅ | ✅ |
| Hoja "Interno" del Excel | ❌ | ❌ | ✅ | ✅ |
| Comentarios de aprobación | solo de sus proformas | ❌ | ✅ | 👁 |
| Datos de otros vendedores | ❌ | ❌ | ✅ | ✅ |

**Regla técnica:** el servidor construye la respuesta con un `Resource` por rol; los campos no permitidos **no se incluyen** en el JSON (no se envían vacíos ni ocultos).

---

## 3. Notas y condiciones

| Nota | Regla |
|---|---|
| ⚠️ Vendedor y parámetros | Solo ve `seller_max_discount_pct` y `validity_days`; nunca costos, gastos generales ni márgenes |
| ⚠️ Descuento sobre el tope | El vendedor puede ingresarlo, pero la proforma no se emite hasta que **G** apruebe |
| ⚠️ Emisión por el vendedor | Solo si no hay alerta de aprobación pendiente, o si G ya aprobó |
| Aprobación | La decisión es exclusiva de **G**; **A** no aprueba excepciones de negocio (separación de funciones) |
| Autoaprobación | Si G crea una proforma con alertas, **otro usuario G** (o la política definida) debe aprobarla; si solo hay un G, queda registrado como autoaprobación en la bitácora |
| Proforma emitida | Nadie puede editarla (`QUOTE_LOCKED`); solo se crea una nueva versión |
| Técnico | No ve precios ni márgenes en ninguna pantalla ni respuesta |
| Datos propios | "Propio" = `seller_id` del usuario (vendedor) o asignación (técnico) |
| Cuenta desactivada | Pierde acceso inmediato; sus registros se conservan |
| Un solo rol | Cada usuario tiene exactamente un rol |

## 4. Controles de seguridad asociados

| Control | Detalle |
|---|---|
| Autenticación | Sesión con cookie `HttpOnly`, `Secure`, `SameSite=Lax`; expira a los 30 minutos de inactividad |
| Contraseñas | Mínimo 10 caracteres; `password_hash` (argon2id o bcrypt) |
| Bloqueo | 5 intentos fallidos → 15 minutos |
| CSRF | Token `X-CSRF-Token` en toda operación de escritura |
| Autorización | Middleware por rol en cada ruta + verificación de propiedad del registro |
| Auditoría | Cambios de precios, parámetros, descuentos, aprobaciones, emisiones, estados y usuarios |
| Revisión periódica | Revisar usuarios activos y roles cada trimestre |

## 5. Verificación (obligatoria en CI)

Para cada fila de la sección 1 existe una prueba automática por rol que comprueba el resultado esperado (`200`/`201` si ✅, `403` si ❌ y `404` si el registro es ajeno y el rol solo ve los propios). Las pruebas de visibilidad de campos recorren las respuestas JSON y fallan si aparece alguno de estos campos para V o T: `materials_cost`, `labor_method_a`, `labor_method_b`, `labor_applied`, `travel`, `direct_cost`, `overhead`, `total_cost`, `effective_margin_pct`, `unit_cost`, `supplier`.
