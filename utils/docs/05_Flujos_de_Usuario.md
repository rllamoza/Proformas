# Flujos de Usuario de Alto Nivel

**Versión:** 1.0 · 17 de octubre de 2026
**Formato:** descripción paso a paso de los caminos críticos, con caminos alternativos y errores. Los números entre corchetes refieren a historias de usuario (US) y requisitos (RF) de los otros documentos.

**Actores:** Vendedor (V), Técnico (T), Gerencia (G), Administrador (A), Sistema (S).

---

## Índice de flujos

| ID | Flujo | Actor principal | Criticidad |
|---|---|---|---|
| F-01 | Inicio de sesión | Todos | Alta |
| F-02 | Cotizar de punta a punta (camino principal) | Vendedor | **Crítica** |
| F-03 | Descuento, aprobación y emisión | Vendedor y gerencia | **Crítica** |
| F-04 | Enviar la proforma y registrar la respuesta | Vendedor | Alta |
| F-05 | Corregir una proforma emitida (nueva versión) | Vendedor | Alta |
| F-06 | Mantener catálogo, ofertas y tipo de cambio | Administrador | **Crítica** |
| F-07 | Armar o ajustar un ensamblaje | Administrador | Alta |
| F-08 | Visita técnica en obra | Técnico | Media (Fase 2) |
| F-09 | Cierre de obra y horas reales | Técnico y gerencia | Media (Fase 2) |

---

## F-01 · Inicio de sesión

**Precondición:** el usuario existe y está activo.

1. El usuario abre la dirección de la aplicación.
2. S muestra la pantalla de acceso.
3. El usuario ingresa correo y contraseña y pulsa "Ingresar".
4. S valida las credenciales y crea la sesión.
5. S lleva al usuario a su pantalla de inicio según su rol (V: sus proformas; T: obras asignadas; G: panel y aprobaciones; A: catálogo y parámetros).

**Alternativas y errores**
- Credenciales incorrectas → mensaje genérico sin indicar qué dato falló.
- 5 intentos fallidos → bloqueo temporal de 15 minutos.
- Usuario desactivado → mismo mensaje genérico.
- Inactividad de 30 minutos → S cierra la sesión y pide ingresar de nuevo.

---

## F-02 · Cotizar de punta a punta (camino principal)

**Precondiciones:** catálogo, ensamblajes, parámetros y tipo de cambio vigentes. V con sesión iniciada.

1. V pulsa "Nueva proforma".
2. **Paso 1 · Cliente y proyecto.** V busca al cliente; si no existe, lo crea (RUC o DNI válido). V completa el proyecto: dirección, tipo de inmueble, pisos y notas del sitio. [US-03]
3. S crea la proforma en estado **borrador** con número `PF-AAAA-NNNN` y el tipo de cambio del día.
4. **Paso 2 · Zonas y equipos.** V crea las zonas (por ejemplo "Piso 1", "Piso 2", "Fachada") e indica el factor de dificultad de cada una. [US-10]
5. En cada zona, V abre el selector, busca los ensamblajes (cámaras, access points, NVR, switch, portero) y define las cantidades. [US-09]
6. Tras cada cambio, S recalcula y muestra el resumen: valor de venta, IGV y total, y el plazo estimado.
7. Si hace falta un equipo que no está en ensamblajes, V agrega un producto suelto.
8. **Paso 3 · Mano de obra y plazo.** V elige la cuadrilla (técnicos y ayudantes). S muestra días y costo de mano de obra, y la comparación de métodos. V puede abrir el comparador de cuadrillas para ver 2, 3 y 4 personas. [US-11, US-12]
9. V decide si aplica descuento (hasta 5 %). [US-13]
10. V agrega servicios de mantenimiento opcionales en sección aparte. [US-14]
11. **Paso 4 · Revisión.** S muestra el resumen económico (V ve valor de venta, IGV, total y plazo; no ve costos ni margen), las alertas y las condiciones (incluye / no incluye, pago, garantía, validez), que V puede editar.
12. V pulsa "Emitir proforma" → continúa en **F-03** si hay alertas de aprobación; si no, S congela la proforma. [US-17]
13. V descarga el PDF (y el Excel si lo necesita). [US-19]

**Alternativas y errores**
- Un producto sin oferta vigente → la línea queda en error con el mensaje de precio vencido; no se puede emitir hasta resolverlo (A actualiza el catálogo, F-06).
- Cambio de cuadrilla → S recalcula días y costo al instante.
- V sale a mitad del proceso → la proforma queda guardada como borrador.
- Duplicar una proforma anterior → S copia zonas y líneas con precios y tipo de cambio actuales. [RF-PRO-08]

**Resultado:** proforma emitida, inmutable, con PDF listo para enviar.

---

## F-03 · Descuento, aprobación y emisión

**Precondición:** proforma en borrador, completa y sin errores de cálculo.

1. V aplica un descuento o S detecta que el margen efectivo queda por debajo del mínimo.
2. Si el descuento es ≤ 5 % y el margen efectivo ≥ 20 %, V emite directamente (F-02, paso 12).
3. Si el descuento > 5 % o el margen efectivo < 20 %:
   1. S muestra la alerta "Requiere aprobación de gerencia" y bloquea "Emitir".
   2. V pulsa "Solicitar aprobación" y puede agregar un comentario.
   3. S cambia el estado a **pendiente de aprobación** y notifica a G (aparece en su panel). [US-15]
4. G abre la solicitud y ve el desglose completo (costos, margen, descuento, motivo de la alerta).
5. G decide:
   - **Aprobar** (con comentario opcional) → S registra la aprobación y habilita la emisión. [US-16]
   - **Rechazar** (comentario obligatorio) → la proforma vuelve a borrador con el motivo visible para V.
6. Si fue aprobada, V pulsa "Emitir" y S congela precios, tipo de cambio, parámetros, horas y totales.
7. S registra todo en la bitácora de auditoría.

**Alternativas y errores**
- V modifica la proforma después de la aprobación → la aprobación se invalida y debe solicitarse otra vez.
- G está ausente → la solicitud permanece pendiente; no existe aprobación automática.

---

## F-04 · Enviar la proforma y registrar la respuesta

**Precondición:** proforma emitida.

1. V descarga el PDF y lo envía al cliente por su canal habitual (correo o WhatsApp). [RF-DOC-05 queda como mejora]
2. V marca la proforma como **enviada**. S registra fecha de envío y calcula la fecha de vencimiento según la validez (15 días por defecto).
3. Cuando el cliente responde, V registra el resultado:
   - **Aprobada** → la proforma queda lista para convertirse en orden de trabajo (Fase 2).
   - **Rechazada** → V puede indicar el motivo.
4. Si pasa la validez sin respuesta, S cambia el estado a **vencida**. [US-18]

**Alternativas**
- El cliente pide cambios → ir a **F-05**.
- Proforma vencida y el cliente retoma → V duplica la proforma para actualizar precios y tipo de cambio.

---

## F-05 · Corregir una proforma emitida (nueva versión)

**Precondición:** proforma emitida; necesita un cambio de alcance, precio o corrección.

1. V abre la proforma emitida (solo lectura) y pulsa "Crear nueva versión".
2. S pide el **motivo** (error de precio, error de cálculo, cambio de alcance, otro). [US-23]
3. S crea la versión `v2` en borrador, con copia de zonas y líneas, y deja `v1` de solo lectura.
4. V hace los cambios y recorre **F-02** desde el paso 6 (y **F-03** si corresponde).
5. S emite `v2` con precios y tipo de cambio **actuales** y registra el vínculo entre versiones.

**Regla:** el motivo alimenta el indicador "% de proformas con corrección".

---

## F-06 · Mantener catálogo, ofertas y tipo de cambio

**Actor:** A. **Frecuencia:** al recibir nuevas listas de precios y cada vez que cambia el dólar de forma relevante.

1. A abre "Tipo de cambio" y registra compra y venta del día. [US-05]
2. A abre "Catálogo" y revisa productos con ofertas vencidas o por vencer (marcadas por S).
3. Para actualizar precios:
   - **Manual:** A selecciona el producto y agrega una oferta (proveedor, moneda, costo, vigencia, plazo de entrega). [US-04]
   - **Masivo:** A importa un archivo Excel o CSV; S valida fila por fila y entrega un informe de errores. [US-06]
4. S recalcula el costo vigente de cada producto y de los ensamblajes que lo usan.
5. S registra en la bitácora cada cambio de precio con el valor anterior y el nuevo. [US-22]

**Alternativas y errores**
- Fila con costo vacío o negativo → rechazada con motivo; las demás se importan.
- Dos registros de tipo de cambio para la misma fecha → rechazado; se edita el existente.
- Cambiar un precio **no** afecta las proformas ya emitidas.

---

## F-07 · Armar o ajustar un ensamblaje

**Actor:** A (con insumos del técnico).

1. A abre "Ensamblajes" y pulsa "Nuevo ensamblaje" (o abre uno existente).
2. A define código, nombre y tipo de punto.
3. A agrega componentes: productos con cantidad o metros, e insumos de costo fijo.
4. A ingresa horas por fase (cableado, montaje, configuración) y el costo referencial por punto.
5. S calcula el costo de materiales con los costos vigentes y lo muestra al instante. [US-07]
6. A guarda. El ensamblaje queda disponible para los vendedores.

**Mejora continua:** con las horas reales (F-09), A y G revisan las horas del ensamblaje y las ajustan.

---

## F-08 · Visita técnica en obra (Fase 2)

**Actor:** T (o V) con celular.

1. T abre la visita asignada, o crea una nueva para el proyecto.
2. T recorre las zonas y completa el checklist: tipo de techo, altura, ductos existentes, energía disponible, ubicación del rack y horarios de acceso.
3. En cada punto, T toma foto, anota la medida en metros y agrega una nota. [US-25]
4. T guarda la visita (S sincroniza fotos y datos).
5. V abre la visita desde la proforma y la usa para crear zonas y definir factores de dificultad.

**Alternativas:** sin cobertura, T guarda datos localmente y sincroniza después (mejora de Fase 3).

---

## F-09 · Cierre de obra y horas reales (Fase 2)

1. V registra la proforma aprobada y crea la **orden de trabajo** con las zonas, materiales, horas y plazo estimado.
2. T registra cada día las horas reales por ensamblaje y por persona. [US-26]
3. Al terminar, el responsable cierra la orden.
4. S muestra el comparativo estimado y real por ensamblaje, con la desviación porcentual.
5. G y A revisan las desviaciones y deciden si ajustar las horas de los ensamblajes (F-07).

---

## Mapa de estados de la proforma

**Nota de modelado:** la proforma tiene un **estado comercial** (`borrador`, `emitida`, `enviada`, `aprobada` por el cliente, `rechazada` por el cliente, `vencida`) y un **estado de aprobación interna** independiente (`no_requerida`, `pendiente`, `aprobada`, `rechazada`). En el diagrama, "pendiente de aprobación" es la aprobación interna mientras la proforma sigue en `borrador`.

```
borrador ──(solicitar aprobación)──► pendiente de aprobación ──(aprobar)──► borrador (aprobada)
   │                                         │                                   │
   │                                         └──(rechazar)──► borrador           │
   └──────────────────────────(emitir)───────────────────────────────────────────┘
                                   ▼
                               emitida ──(marcar enviada)──► enviada
                                                              │  ├─(cliente acepta)──► aprobada
                                                              │  ├─(cliente rechaza)─► rechazada
                                                              │  └─(vence validez)───► vencida
emitida / enviada ──(nueva versión)──► versión nueva en borrador (la anterior queda de solo lectura)
```

**Transiciones prohibidas:** editar una proforma emitida, volver de emitida a borrador, aprobar sin pasar por solicitud cuando hay alerta.
