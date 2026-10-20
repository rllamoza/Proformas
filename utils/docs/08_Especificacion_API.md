# Especificación de API / Endpoints

**Versión:** 1.0 · 17 de octubre de 2026
**Base URL:** `https://proformas.dominio.pe/api/v1` · **Formato:** JSON UTF-8 · **Autenticación:** sesión de servidor (cookie)

---

## 1. Convenciones generales

### 1.1 Cabeceras

| Cabecera | Valor | Cuándo |
|---|---|---|
| `Content-Type` | `application/json` (o `multipart/form-data` en importación y fotos) | Peticiones con cuerpo |
| `Accept` | `application/json` | Siempre |
| `Cookie` | `PROFORMAS_SESSID=<id>` | Automática tras el login (`HttpOnly`, `Secure`, `SameSite=Lax`) |
| `X-CSRF-Token` | Token entregado por el login o `GET /auth/me` | `POST`, `PUT`, `PATCH`, `DELETE` |

### 1.2 Formatos de datos

| Tipo | Formato | Ejemplo |
|---|---|---|
| Dinero | **Cadena** con 2 decimales, en soles | `"6992.81"` |
| Tipo de cambio | Cadena con 4 decimales | `"3.7500"` |
| Porcentajes | Cadena con 2 decimales (`"30.00"` = 30 %) | `"5.00"` |
| Horas y días | Cadena con 1 o 2 decimales | `"25.40"`, `"2.5"` |
| Fechas | `YYYY-MM-DD`; fecha y hora en ISO 8601 UTC | `"2026-10-17"`, `"2026-10-17T14:30:00Z"` |

### 1.3 Paginación y filtros

`GET /recurso?page=1&per_page=20&q=texto&sort=-created_at` · `per_page` máximo 100.

```json
{
  "data": [ { "id": 1 } ],
  "meta": { "page": 1, "per_page": 20, "total": 134 }
}
```

### 1.4 Formato de error (uniforme)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Hay campos inválidos.",
    "details": [ { "field": "quantity", "message": "Debe ser mayor que 0." } ]
  }
}
```

| HTTP | `code` | Cuándo |
|---|---|---|
| 400 | `BAD_REQUEST` | JSON mal formado |
| 401 | `UNAUTHENTICATED` | Sin sesión o sesión expirada |
| 403 | `FORBIDDEN` | Rol sin permiso, o CSRF inválido (`CSRF_INVALID`) |
| 404 | `NOT_FOUND` | Recurso inexistente o fuera de alcance del usuario |
| 409 | `CONFLICT` | Duplicado (documento, SKU, código, fecha) |
| 409 | `QUOTE_LOCKED` | Editar una proforma emitida |
| 409 | `APPROVAL_REQUIRED` | Emitir sin aprobación necesaria |
| 422 | `VALIDATION_ERROR` | Datos inválidos |
| 422 | `OFFER_EXPIRED` | Producto sin oferta vigente |
| 423 | `ACCOUNT_LOCKED` | Cuenta bloqueada temporalmente |
| 429 | `RATE_LIMITED` | Demasiados intentos |
| 500 | `SERVER_ERROR` | Error interno (sin trazas) |

### 1.5 Visibilidad por rol (campos)

| Campo | Vendedor | Técnico | Gerencia | Admin |
|---|---|---|---|---|
| Precio de venta, IGV, total, plazo | Sí | No | Sí | Sí |
| Costos de compra, mano de obra, gastos generales, margen | **No** | **No** | Sí | Sí |
| Horas y alcance | Sí | Sí | Sí | Sí |

El servidor **omite** los campos no permitidos (no los envía vacíos).

---

## 2. Índice de endpoints

Acceso: **V** vendedor, **T** técnico, **G** gerencia, **A** administrador. "P" = solo registros propios.

### Autenticación y usuarios

| Método | Ruta | Descripción | Roles | Fase |
|---|---|---|---|---|
| POST | `/auth/login` | Iniciar sesión | Público | MVP |
| POST | `/auth/logout` | Cerrar sesión | Todos | MVP |
| GET | `/auth/me` | Usuario actual y token CSRF | Todos | MVP |
| POST | `/auth/password/change` | Cambiar contraseña propia | Todos | Should |
| POST | `/auth/password/forgot` · `/auth/password/reset` | Restablecer contraseña | Público | Should |
| GET · POST | `/users` | Listar y crear usuarios | A | MVP |
| GET · PUT | `/users/{id}` | Ver y editar usuario | A | MVP |
| POST | `/users/{id}/deactivate` · `/activate` | Desactivar y activar | A | MVP |

### Clientes y proyectos

| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| GET · POST | `/customers` | Buscar y crear clientes | V, G, A |
| GET · PUT | `/customers/{id}` | Ver y editar cliente | V, G, A |
| GET | `/customers/{id}/projects` | Proyectos del cliente | V, G, A, T (asignados) |
| POST | `/projects` | Crear proyecto | V, G, A |
| GET · PUT | `/projects/{id}` | Ver y editar proyecto | V, G, A, T (asignados) |

### Catálogo, proveedores y precios

| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| GET · POST | `/products` | Listar y crear productos | GET: V*, G, A · POST: A |
| GET · PUT | `/products/{id}` | Ver y editar producto | GET: V*, G, A · PUT: A |
| GET · POST | `/products/{id}/offers` | Ofertas por proveedor | G, A |
| PUT | `/supplier-offers/{id}` | Editar oferta | A |
| GET · POST · PUT | `/suppliers` · `/suppliers/{id}` | Proveedores | G (GET), A |
| POST | `/catalog/import` | Importar Excel/CSV | A (Should) |
| GET · POST · PUT | `/exchange-rates` · `/exchange-rates/{id}` | Tipo de cambio | GET: todos* · POST/PUT: A |
| GET | `/exchange-rates/current` | Tipo de cambio vigente | V, G, A |

\* Sin costos para V.

### Ensamblajes y parámetros

| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| GET | `/assemblies` · `/assemblies/{id}` | Ensamblajes (costos solo G, A) | V*, G, A |
| POST · PUT | `/assemblies` · `/assemblies/{id}` | Crear y editar | A |
| POST | `/assemblies/{id}/clone` | Clonar | A (Could) |
| GET | `/labor-params/current` | Parámetros vigentes | G, A (V: solo tope de descuento y validez) |
| POST | `/labor-params` | Nueva versión de parámetros | A |
| GET · POST · PUT | `/difficulty-factors` | Factores de dificultad | GET: V, G, A · escritura: A |
| GET · POST · PUT | `/condition-templates` | Plantillas de condiciones | GET: V, G, A · escritura: A |
| GET · POST · PUT | `/services` | Servicios y mantenimiento | GET: V, G, A · escritura: A |

### Proformas

| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| GET | `/quotes` | Listar (V: propias; G, A: todas) | V (P), G, A |
| POST | `/quotes` | Crear proforma en borrador | V, G, A |
| GET | `/quotes/{id}` | Detalle | V (P), G, A, T (asignadas, sin precios) |
| PUT | `/quotes/{id}` | Editar cabecera (cuadrilla, descuento, condiciones) | V (P), G, A |
| DELETE | `/quotes/{id}` | Eliminar borrador | V (P), A |
| POST | `/quotes/{id}/zones` | Agregar zona | V (P), G, A |
| PUT · DELETE | `/zones/{id}` | Editar o eliminar zona | V (P), G, A |
| POST | `/zones/{id}/lines` | Agregar línea | V (P), G, A |
| PUT · DELETE | `/lines/{id}` | Editar o eliminar línea | V (P), G, A |
| POST | `/quotes/{id}/services` | Agregar servicio | V (P), G, A |
| PUT · DELETE | `/quote-services/{id}` | Editar o quitar servicio | V (P), G, A |
| POST | `/quotes/{id}/calculate` | Calcular sin guardar cambios | V (P), G, A |
| GET | `/quotes/{id}/crew-comparison` | Comparar cuadrillas | V (P), G, A (Should) |
| POST | `/quotes/{id}/request-approval` | Solicitar aprobación | V (P) |
| POST | `/quotes/{id}/approve` · `/reject` | Decidir | G |
| POST | `/quotes/{id}/issue` | Emitir y congelar | V (P), G, A |
| POST | `/quotes/{id}/mark-sent` | Marcar enviada | V (P), G |
| POST | `/quotes/{id}/customer-response` | Registrar respuesta del cliente | V (P), G |
| POST | `/quotes/{id}/new-version` | Nueva versión | V (P), G |
| POST | `/quotes/{id}/duplicate` | Duplicar | V, G, A (Should) |
| GET | `/quotes/{id}/documents/pdf` · `/xlsx` · `/docx` | Descargar documento | V (P), G, A |
| GET | `/approvals?status=pendiente` | Solicitudes pendientes | G |

### Control y reportes

| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| GET | `/audit-log` | Bitácora (filtros por entidad, usuario, fecha) | G, A |
| GET | `/reports/kpis` | Indicadores de éxito | G (Should) |
| GET | `/health` | Estado de API y base de datos | Público |

### Fase 2 (resumen)

`POST /site-visits`, `GET /site-visits/{id}`, `POST /site-visits/{id}/items`, `POST /site-visit-items/{id}/photos` (multipart), `POST /quotes/{id}/work-order`, `GET /work-orders/{id}`, `POST /work-orders/{id}/logs`, `GET /work-orders/{id}/comparison`.

---

## 3. Detalle de endpoints críticos

### 3.1 `POST /auth/login`

**Headers:** `Content-Type: application/json`

**Cuerpo**
```json
{ "email": "ana@empresa.pe", "password": "********" }
```

**200 OK** (establece cookie de sesión)
```json
{
  "user": { "id": 3, "name": "Ana Torres", "email": "ana@empresa.pe", "role": "vendedor" },
  "csrf_token": "b7c1…e90"
}
```

**Errores**
```json
{ "error": { "code": "UNAUTHENTICATED", "message": "Correo o contraseña incorrectos." } }
```
`423 ACCOUNT_LOCKED` tras 5 intentos fallidos · `429 RATE_LIMITED`.

---

### 3.2 `GET /auth/me`

**Headers:** `Accept: application/json` · cookie de sesión

**200 OK**
```json
{
  "user": { "id": 3, "name": "Ana Torres", "role": "vendedor", "max_discount_pct": "5.00" },
  "csrf_token": "b7c1…e90"
}
```
**401** `UNAUTHENTICATED` si no hay sesión.

---

### 3.3 `POST /customers`

**Headers:** `Content-Type: application/json`, `X-CSRF-Token`

**Cuerpo**
```json
{
  "document_type": "RUC",
  "document_number": "20123456789",
  "name": "Familia Quispe S.A.C.",
  "email": "contacto@quispe.pe",
  "phone": "987654321",
  "contact_name": "Luis Quispe",
  "address": "Av. Los Olivos 123, Lima"
}
```

**201 Created**
```json
{ "data": { "id": 12, "document_type": "RUC", "document_number": "20123456789", "name": "Familia Quispe S.A.C." } }
```

**Errores:** `409 CONFLICT` (documento duplicado, incluye `existing_id`) · `422 VALIDATION_ERROR` (RUC no tiene 11 dígitos).

---

### 3.4 `POST /products/{id}/offers`

**Roles:** A · **Headers:** `Content-Type`, `X-CSRF-Token`

**Cuerpo**
```json
{
  "supplier_id": 1,
  "currency": "USD",
  "unit_cost": "38.0000",
  "offered_at": "2026-10-17",
  "valid_until": "2026-11-16",
  "lead_time_days": 3,
  "is_preferred": false
}
```

**201 Created**
```json
{
  "data": {
    "id": 41, "product_id": 7, "supplier_id": 1, "currency": "USD",
    "unit_cost": "38.0000", "valid_until": "2026-11-16",
    "current_cost_pen": "142.50"
  }
}
```
`current_cost_pen` = costo vigente del producto tras el cambio. **422** si `unit_cost ≤ 0` o `valid_until < offered_at`. El cambio se registra en `audit_log`.

---

### 3.5 `POST /exchange-rates`

**Roles:** A

**Cuerpo**
```json
{ "rate_date": "2026-10-17", "buy": "3.7200", "sell": "3.7500", "source": "manual", "buffer_pct": "0.00" }
```
**201 Created**
```json
{ "data": { "id": 55, "rate_date": "2026-10-17", "buy": "3.7200", "sell": "3.7500", "buffer_pct": "0.00" } }
```
**409 CONFLICT** si ya existe un registro para esa fecha.

---

### 3.6 `GET /assemblies/{id}`

**Roles:** G y A ven costos; V recibe solo datos de venta.

**200 OK (gerencia/admin)**
```json
{
  "data": {
    "id": 1, "code": "ASM-CAM-EXT", "name": "Punto de cámara exterior (muro, escalera)",
    "point_type": "camara",
    "components": [
      { "product_id": 7, "description": "Cámara IP bullet 4 MP PoE", "quantity": "1.00", "cost_pen": "142.50" },
      { "product_id": 11, "description": "Cable UTP Cat6", "quantity": "40.00", "cost_pen": "56.00" },
      { "product_id": null, "description": "Insumos exteriores", "quantity": "1.00", "cost_pen": "25.00" }
    ],
    "materials_cost": "223.50",
    "hours": { "cabling": "1.00", "mounting": "2.00", "config": "0.50", "total": "3.50" },
    "reference_cost_per_point": "70.00"
  }
}
```

---

### 3.7 `POST /quotes`

**Headers:** `Content-Type`, `X-CSRF-Token`

**Cuerpo**
```json
{ "customer_id": 12, "project_id": 8, "condition_template_id": 1 }
```

**201 Created**
```json
{
  "data": {
    "id": 101, "number": "PF-2026-0001", "version": 1,
    "status": "borrador", "approval_status": "no_requerida",
    "exchange_rate": { "date": "2026-10-17", "sell": "3.7500" },
    "technicians": 1, "assistants": 1,
    "discount_pct": "0.00", "validity_days": 15
  }
}
```
**422** si el cliente o el proyecto no existen o no coinciden.

---

### 3.8 `POST /quotes/{id}/zones`

**Cuerpo**
```json
{ "name": "Piso 1", "floor": "1", "difficulty_factor_id": 1 }
```
**201 Created**
```json
{ "data": { "id": 301, "quote_id": 101, "name": "Piso 1", "difficulty_factor": { "id": 1, "name": "Estándar", "factor": "1.00" } } }
```
**409 QUOTE_LOCKED** si la proforma ya fue emitida.

---

### 3.9 `POST /zones/{id}/lines`

**Cuerpo**
```json
{ "assembly_id": 1, "quantity": 4 }
```
(o `{ "product_id": 22, "quantity": 1 }` para un producto suelto)

**201 Created**
```json
{
  "data": {
    "id": 901, "zone_id": 301, "assembly_id": 1,
    "description": "Punto de cámara exterior (muro, escalera)",
    "quantity": 4,
    "hours": "14.00",
    "sale_price": "…"
  }
}
```
`sale_price` solo se incluye si el rol puede ver precios y el cálculo está disponible. **422 `OFFER_EXPIRED`** si algún componente no tiene oferta vigente:
```json
{ "error": { "code": "OFFER_EXPIRED", "message": "Precio vencido, solicite actualizar el catálogo.",
  "details": [ { "product_id": 7, "product": "Cámara IP bullet 4 MP PoE" } ] } }
```

---

### 3.10 `PUT /quotes/{id}`

**Cuerpo** (todos los campos son opcionales)
```json
{
  "technicians": 1,
  "assistants": 1,
  "discount_pct": "5.00",
  "labor_method": "max_ab",
  "validity_days": 15,
  "includes_text": "…", "excludes_text": "…", "payment_text": "…", "warranty_text": "…"
}
```
**200 OK** con la proforma actualizada.
**422** si `discount_pct` está fuera de 0–100 o `technicians < 1`.
**409 QUOTE_LOCKED** si está emitida.
Nota: `margin_pct` solo puede cambiarse por **G** o **A**; si V lo envía, `403 FORBIDDEN`. Un descuento mayor al tope del vendedor se **acepta** pero marca la proforma como que requiere aprobación (se refleja en `calculate`).

---

### 3.11 `POST /quotes/{id}/calculate`

Calcula con el estado actual de la proforma. No cambia estado ni congela nada.

**Cuerpo (opcional, para simular sin guardar)**
```json
{ "technicians": 1, "assistants": 1, "discount_pct": "0.00" }
```

**200 OK — Gerencia o administrador** (caso de prueba: casa de 2 pisos)
```json
{
  "data": {
    "quote_id": 101,
    "currency": "PEN",
    "exchange_rate": { "date": "2026-10-17", "sell": "3.7500", "buffer_pct": "0.00" },
    "summary": {
      "sale_value": "5926.11",
      "discount": "0.00",
      "taxable_base": "5926.11",
      "tax_rate_pct": "18.00",
      "tax": "1066.70",
      "total": "6992.81",
      "days": "2.5"
    },
    "internal": {
      "materials_cost": "3126.00",
      "labor_method_a": "615.00",
      "labor_method_b": "575.00",
      "labor_applied": "615.00",
      "travel": "100.00",
      "direct_cost": "3841.00",
      "overhead": "307.28",
      "total_cost": "4148.28",
      "effective_margin_pct": "30.00"
    },
    "hours": { "cabling": "6.20", "mounting": "12.50", "config": "6.70", "total": "25.40" },
    "crew": { "technicians": 1, "assistants": 1, "capacity_per_day": "14.00" },
    "schedule": [
      { "phase": "cableado", "hours": "6.20", "days_no_buffer": "0.44" },
      { "phase": "montaje", "hours": "12.50", "days_no_buffer": "0.89" },
      { "phase": "configuracion", "hours": "6.70", "days_no_buffer": "0.48" }
    ],
    "services": { "sale_value": "0.00", "tax": "0.00", "total": "0.00" },
    "requires_approval": false,
    "alerts": []
  }
}
```

**200 OK — Vendedor** (sin el bloque `internal`)
```json
{
  "data": {
    "quote_id": 101,
    "summary": { "sale_value": "5926.11", "discount": "0.00", "taxable_base": "5926.11", "tax_rate_pct": "18.00", "tax": "1066.70", "total": "6992.81", "days": "2.5" },
    "hours": { "cabling": "6.20", "mounting": "12.50", "config": "6.70", "total": "25.40" },
    "crew": { "technicians": 1, "assistants": 1, "capacity_per_day": "14.00" },
    "schedule": [ { "phase": "cableado", "hours": "6.20", "days_no_buffer": "0.44" } ],
    "services": { "sale_value": "0.00", "tax": "0.00", "total": "0.00" },
    "requires_approval": false,
    "alerts": []
  }
}
```

**Alertas posibles**
```json
{ "code": "MARGIN_BELOW_MIN", "severity": "high", "message": "El margen efectivo (12.50 %) es menor al mínimo (20.00 %)." }
{ "code": "DISCOUNT_ABOVE_LIMIT", "severity": "high", "message": "El descuento supera el tope del vendedor (5.00 %)." }
{ "code": "LABOR_METHODS_DIFFER", "severity": "medium", "message": "Por punto y por día útil difieren más de 15 %." }
{ "code": "OFFER_NEAR_EXPIRY", "severity": "low", "message": "Hay ofertas que vencen en 7 días o menos." }
```
Para el vendedor, las alertas **no** incluyen cifras de costo o margen: solo el mensaje "Requiere aprobación de gerencia".

**Errores:** `422 OFFER_EXPIRED` · `404 NOT_FOUND`.

---

### 3.12 `GET /quotes/{id}/crew-comparison`

**200 OK**
```json
{
  "data": [
    { "people": 2, "technicians": 1, "assistants": 1, "capacity_per_day": "14.00", "days": "2.5", "labor_cost": "575.00" },
    { "people": 3, "technicians": 1, "assistants": 2, "capacity_per_day": "18.90", "days": "2.0", "labor_cost": "640.00" },
    { "people": 4, "technicians": 2, "assistants": 2, "capacity_per_day": "22.40", "days": "1.5", "labor_cost": "690.00" }
  ]
}
```
`labor_cost` y `capacity_per_day` internos solo para G y A; el vendedor recibe `people`, `days` y la diferencia de **precio de venta** correspondiente.

---

### 3.13 `POST /quotes/{id}/request-approval`

**Roles:** V (dueño)

**Cuerpo**
```json
{ "comment": "Cliente frecuente, pide descuento de 10 %." }
```
**200 OK**
```json
{ "data": { "approval_id": 18, "status": "pendiente", "reason_code": "descuento_alto" } }
```
**422** si la proforma no requiere aprobación. **409** si ya hay una solicitud pendiente.

---

### 3.14 `POST /quotes/{id}/approve` · `POST /quotes/{id}/reject`

**Roles:** G

**Cuerpo**
```json
{ "comment": "Cliente frecuente." }
```
(`comment` obligatorio en `reject`)

**200 OK**
```json
{ "data": { "approval_id": 18, "status": "aprobada", "decided_by": 2, "decided_at": "2026-10-17T15:10:00Z" } }
```
**403** si el rol no es gerencia · **409** si la solicitud ya fue decidida o fue invalidada por cambios posteriores.

---

### 3.15 `POST /quotes/{id}/issue`

Congela la proforma. **Headers:** `X-CSRF-Token`.

**200 OK**
```json
{
  "data": {
    "id": 101, "number": "PF-2026-0001", "version": 1,
    "status": "emitida", "issued_at": "2026-10-17T15:20:00Z",
    "expires_at": "2026-11-01",
    "summary": { "sale_value": "5926.11", "tax": "1066.70", "total": "6992.81", "days": "2.5" }
  }
}
```

**Errores**
```json
{ "error": { "code": "APPROVAL_REQUIRED", "message": "Requiere aprobación de gerencia." } }
```
`409 QUOTE_LOCKED` si ya estaba emitida · `422 OFFER_EXPIRED` si hay precios vencidos · `422 VALIDATION_ERROR` si la proforma no tiene líneas.

---

### 3.16 `POST /quotes/{id}/new-version`

**Cuerpo**
```json
{ "reason": "error_precio" }
```
`reason`: `error_precio`, `error_calculo`, `cambio_alcance`, `otro`.

**201 Created**
```json
{ "data": { "id": 118, "number": "PF-2026-0001", "version": 2, "status": "borrador", "parent_quote_id": 101 } }
```
**409** si la proforma está en borrador (solo se versiona una proforma emitida o posterior).

---

### 3.17 `POST /quotes/{id}/customer-response`

**Cuerpo**
```json
{ "result": "rechazada", "reason": "Eligió otro proveedor." }
```
`result`: `aprobada` o `rechazada`.

**200 OK**
```json
{ "data": { "id": 101, "status": "rechazada", "customer_response_at": "2026-10-20T09:00:00Z" } }
```
**409** si la proforma no está en estado `enviada`.

---

### 3.18 `GET /quotes/{id}/documents/pdf`

**Headers:** `Accept: application/pdf`

**200 OK:** `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="PF-2026-0001-v1.pdf"`. El PDF se genera del congelado: **no contiene costos ni margen**.

**Errores:** `409` si la proforma no está emitida · `403` si no es propia (vendedor).

`/documents/xlsx`: `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`; la hoja **Interno** (costos y margen) solo se incluye para G y A.
`/documents/docx` (Should): `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.

---

### 3.19 `POST /catalog/import`

**Roles:** A · **Headers:** `Content-Type: multipart/form-data`, `X-CSRF-Token`

**Campos:** `file` (`.xlsx` o `.csv`, máx. 5 MB), `mode` (`validate` | `commit`)

**200 OK**
```json
{
  "data": {
    "rows_total": 50, "rows_imported": 47, "rows_rejected": 3,
    "errors": [
      { "row": 12, "field": "unit_cost", "message": "El costo es obligatorio." },
      { "row": 18, "field": "currency", "message": "Moneda inválida (use USD o PEN)." },
      { "row": 33, "field": "valid_until", "message": "La vigencia no puede ser anterior a la fecha de la oferta." }
    ]
  }
}
```
**422** si el archivo no es válido o excede el tamaño.

---

### 3.20 `GET /audit-log`

**Roles:** G, A · **Filtros:** `entity`, `entity_id`, `user_id`, `from`, `to`

**200 OK**
```json
{
  "data": [
    {
      "id": 5012, "entity": "supplier_offers", "entity_id": 41, "action": "update",
      "old_values": { "unit_cost": "38.0000" }, "new_values": { "unit_cost": "40.0000" },
      "user": { "id": 1, "name": "Admin" }, "created_at": "2026-10-17T16:02:00Z"
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 1 }
}
```

---

### 3.21 `GET /health`

**200 OK**
```json
{ "status": "ok", "database": "ok", "time": "2026-10-17T16:05:00Z" }
```
**503** `{ "status": "degraded", "database": "error" }` si falla la base de datos.

---

## 4. Reglas transversales

1. **Idempotencia:** `POST /quotes/{id}/issue` repetido sobre una proforma emitida devuelve `409 QUOTE_LOCKED` sin duplicar nada.
2. **Concurrencia:** el correlativo `PF-AAAA-NNNN` se asigna con bloqueo de fila; no hay números repetidos ni huecos por concurrencia.
3. **Inmutabilidad:** tras emitir, `PUT/DELETE` sobre cabecera, zonas, líneas y servicios devuelven `409 QUOTE_LOCKED`.
4. **Invalidez de aprobación:** si se modifica una proforma con aprobación otorgada y no emitida, la aprobación pasa a `invalidada` y debe solicitarse de nuevo.
5. **Auditoría:** se registran cambios de ofertas, tipo de cambio, parámetros, descuentos, aprobaciones, emisiones y estados.
6. **Rendimiento:** `POST /quotes/{id}/calculate` ≤ 2 s para hasta 50 líneas.
7. **Seguridad:** todos los endpoints (salvo `/auth/login`, `/auth/password/*` y `/health`) exigen sesión; las rutas de escritura exigen `X-CSRF-Token`.
