# Historias de Usuario

**Versión:** 1.0 · 17 de octubre de 2026
**Formato:** *Como [usuario], quiero [acción] para [beneficio]*, con criterios de aceptación en Gherkin (Dado que / Cuando / Entonces).
**Prioridad:** MoSCoW (M, S, C). **Trazabilidad:** requisito del PRD entre paréntesis.

**Datos de referencia (pruebas):** tipo de cambio 3.75; IGV 18 %; margen por defecto 30 %; margen mínimo 20 %; descuento máximo del vendedor 5 %.

---

## Épica 1 — Acceso y usuarios

### US-01 · Iniciar sesión (M) (RF-AUT-01)
**Como** usuario, **quiero** iniciar sesión con mi correo y contraseña **para** acceder a la aplicación según mi rol.

```gherkin
Escenario: Inicio de sesión correcto
  Dado que existe un usuario activo con correo "ana@empresa.pe" y contraseña válida
  Cuando ingresa sus credenciales
  Entonces accede a la pantalla de inicio de su rol

Escenario: Credenciales incorrectas
  Dado que un usuario escribe una contraseña errónea
  Cuando intenta ingresar
  Entonces ve el mensaje "Correo o contraseña incorrectos" sin indicar cuál dato falló

Escenario: Bloqueo por intentos fallidos
  Dado que un usuario falló 5 veces seguidas
  Cuando intenta ingresar de nuevo antes de 15 minutos
  Entonces ve un mensaje de cuenta bloqueada temporalmente
```

### US-02 · Gestionar usuarios y roles (M) (RF-AUT-03)
**Como** administrador, **quiero** crear, desactivar y asignar rol a los usuarios **para** controlar quién accede y qué ve.

```gherkin
Escenario: Crear usuario con rol
  Dado que el administrador está en "Usuarios"
  Cuando crea un usuario con correo, nombre y rol "vendedor"
  Entonces el usuario queda activo con ese único rol

Escenario: Desactivar usuario
  Dado que existe un usuario activo
  Cuando el administrador lo desactiva
  Entonces ese usuario ya no puede iniciar sesión y sus proformas se conservan
```

---

## Épica 2 — Clientes y proyectos

### US-03 · Registrar cliente y proyecto (M) (RF-CLI-01, RF-CLI-02)
**Como** vendedor, **quiero** registrar al cliente y la obra **para** asociar la proforma a datos correctos.

```gherkin
Escenario: Registrar cliente con RUC válido
  Dado que el vendedor abre "Nuevo cliente"
  Cuando ingresa razón social y un RUC de 11 dígitos
  Entonces el cliente se guarda y puede seleccionarse al crear una proforma

Escenario: Documento duplicado
  Dado que ya existe un cliente con el mismo RUC
  Cuando el vendedor intenta guardar otro con ese RUC
  Entonces ve el aviso "Ya existe un cliente con este documento" y puede abrir el existente

Escenario: Registrar proyecto
  Dado que existe un cliente
  Cuando el vendedor crea un proyecto con dirección, tipo "casa" y 2 pisos
  Entonces el proyecto queda asociado al cliente
```

---

## Épica 3 — Catálogo, precios y tipo de cambio

### US-04 · Registrar ofertas por proveedor (M) (RF-CAT-03, RF-CAT-04)
**Como** administrador, **quiero** registrar el costo de cada producto por proveedor y moneda **para** que todos cotizan con el precio vigente más conveniente.

```gherkin
Escenario: Costo vigente con dos ofertas en dólares
  Dado que el producto "Cámara IP bullet 4 MP PoE" tiene una oferta de TecnoSeg por 38.00 USD y otra de RedPro por 41.00 USD, ambas vigentes
  Y el tipo de cambio de venta es 3.75
  Cuando se consulta su costo vigente
  Entonces el costo vigente es S/ 142.50 con proveedor TecnoSeg

Escenario: Oferta vencida
  Dado que la única oferta de un producto venció ayer
  Cuando un vendedor agrega ese producto a una proforma
  Entonces la línea muestra el error "Precio vencido, solicite actualizar el catálogo" y no se calcula
```

### US-05 · Registrar tipo de cambio (M) (RF-PAR-01)
**Como** administrador, **quiero** registrar el tipo de cambio diario **para** convertir los costos en dólares a soles.

```gherkin
Escenario: Registrar tipo de cambio del día
  Dado que no existe un tipo de cambio para hoy
  Cuando el administrador registra compra 3.72 y venta 3.75
  Entonces las nuevas proformas usan 3.75

Escenario: Fecha repetida
  Dado que ya existe un registro para hoy
  Cuando el administrador intenta crear otro con la misma fecha
  Entonces el sistema lo rechaza e indica que debe editar el existente
```

### US-06 · Importar catálogo desde Excel (S) (RF-CAT-06)
**Como** administrador, **quiero** importar productos y ofertas desde Excel **para** cargar el catálogo sin digitar uno por uno.

```gherkin
Escenario: Importación con errores parciales
  Dado que el archivo tiene 50 filas y 3 con costo vacío
  Cuando el administrador lo importa
  Entonces se cargan 47 filas y se muestra un informe con fila, campo y motivo de las 3 rechazadas
```

---

## Épica 4 — Ensamblajes y parámetros

### US-07 · Definir un ensamblaje (M) (RF-ENS-01..03)
**Como** administrador, **quiero** armar un ensamblaje con sus componentes y horas **para** que los vendedores coticen puntos completos.

```gherkin
Escenario: Calcular materiales del ensamblaje
  Dado el ensamblaje "ASM-CAM-EXT" con cámara bullet, 40 m de cable Cat6 e insumos exteriores de S/ 25.00
  Cuando se calculan sus materiales con los costos vigentes
  Entonces el costo de materiales es S/ 223.50
  Y sus horas son 1.0 de cableado, 2.0 de montaje y 0.5 de configuración

Escenario: Ensamblaje sin componentes
  Dado que el administrador intenta guardar un ensamblaje sin componentes
  Entonces el sistema lo impide y pide agregar al menos uno
```

### US-08 · Configurar parámetros de mano de obra y márgenes (M) (RF-PAR-03)
**Como** administrador, **quiero** configurar costos por día, horas efectivas, buffer, gastos generales y márgenes **para** que los cálculos reflejen la realidad de la empresa.

```gherkin
Escenario: Cambiar un parámetro sin afectar proformas emitidas
  Dado que existe una proforma emitida con costo de técnico S/ 140 por día
  Cuando el administrador cambia el costo a S/ 150
  Entonces la proforma emitida conserva S/ 140
  Y las proformas nuevas usan S/ 150
  Y queda registrado quién hizo el cambio y cuándo
```

---

## Épica 5 — Constructor de proforma

### US-09 · Crear una proforma por zonas (M) (RF-PRO-01..03)
**Como** vendedor, **quiero** armar la proforma por zonas con ensamblajes **para** cotizar rápido y sin olvidar materiales.

```gherkin
Escenario: Proforma con número correlativo
  Dado un cliente y un proyecto existentes
  Cuando el vendedor crea una nueva proforma
  Entonces recibe un número con formato "PF-2026-NNNN" y estado "borrador"

Escenario: Agregar líneas
  Dado una proforma en borrador con la zona "Piso 1"
  Cuando el vendedor agrega 4 unidades de "Punto de cámara exterior"
  Entonces la línea muestra materiales S/ 894.00 y 14.0 horas de trabajo
  Y el resumen de la proforma se actualiza
```

### US-10 · Ajustar la dificultad del sitio (M) (RF-PAR-04, RF-CAL-02)
**Como** vendedor, **quiero** indicar la dificultad de cada zona **para** que las horas reflejen las condiciones reales.

```gherkin
Escenario: Factor de fachada con escalera
  Dado la zona "Fachada" con factor 1.25
  Cuando el vendedor agrega 1 "Punto de cámara exterior"
  Entonces las horas de la línea son 4.25 (cableado 1.25, montaje 2.50, configuración 0.50)
```

### US-11 · Elegir cuadrilla y ver el plazo (M) (RF-PRO-04, RF-CAL-03, RF-CAL-04)
**Como** vendedor, **quiero** elegir cuántas personas trabajarán **para** conocer los días de obra y el costo de mano de obra.

```gherkin
Escenario: Cuadrilla de 2 personas
  Dado una proforma con 25.4 horas de trabajo
  Cuando el vendedor elige 1 técnico y 1 ayudante
  Entonces el plazo es 2.5 días
  Y la mano de obra por día útil es S/ 575.00

Escenario: Se aplica el mayor entre ambos métodos
  Dado que la mano de obra por punto es S/ 615.00 y por día útil S/ 575.00
  Cuando se calcula el total
  Entonces la mano de obra aplicada es S/ 615.00

Escenario: Diferencia grande entre métodos
  Dado que ambos métodos difieren más de 15 %
  Cuando se calcula la proforma
  Entonces se muestra una alerta con ambos valores
```

### US-12 · Comparar cuadrillas (S) (RF-PRO-05)
**Como** vendedor, **quiero** comparar cuadrillas de 2, 3 y 4 personas **para** ofrecer al cliente una entrega más rápida cuando la necesite.

```gherkin
Escenario: Comparación de cuadrillas
  Dado una proforma con 25.4 horas de trabajo
  Cuando el vendedor abre el comparador
  Entonces ve 2 personas: 2.5 días y S/ 575.00
  Y 3 personas: 2.0 días y S/ 640.00
  Y 4 personas: 1.5 días y S/ 690.00
```

### US-13 · Aplicar descuento (M) (RF-PRO-06)
**Como** vendedor, **quiero** aplicar un descuento dentro de mi límite **para** cerrar la venta sin demorar con aprobaciones.

```gherkin
Escenario: Descuento dentro del tope
  Dado una proforma con valor de venta S/ 5,926.11
  Cuando el vendedor aplica 5 % de descuento
  Entonces el descuento es S/ 296.31 y la base imponible S/ 5,629.80
  Y el IGV es S/ 1,013.36 y el total S/ 6,643.16

Escenario: Descuento sobre el tope
  Dado que el vendedor aplica 10 % de descuento
  Cuando intenta emitir la proforma
  Entonces el sistema la marca "requiere aprobación de gerencia"
```

### US-14 · Incluir servicios de mantenimiento (M) (RF-PRO-07, RF-SER-02)
**Como** vendedor, **quiero** ofrecer mantenimiento en la misma proforma **para** vender el servicio recurrente junto con la instalación.

```gherkin
Escenario: Servicios en sección aparte
  Dado una proforma con total de instalación S/ 6,992.81
  Cuando el vendedor agrega "Plan mensual de soporte remoto" a S/ 180.00 por mes
  Entonces la sección "Servicios recurrentes" muestra valor S/ 180.00, IGV S/ 32.40 y total S/ 212.40 por mes
  Y el total de la instalación no cambia
```

---

## Épica 6 — Control de margen, aprobación y emisión

### US-15 · Proteger el margen mínimo (M) (RF-APR-01)
**Como** gerencia, **quiero** que no se emita una proforma con margen bajo el mínimo sin mi aprobación **para** no vender con pérdida.

```gherkin
Escenario: Margen bajo el mínimo
  Dado un margen mínimo de 20 %
  Y una proforma con un descuento de 20 % que deja un margen efectivo de 12.5 %
  Cuando el vendedor intenta emitirla
  Entonces el sistema responde "Requiere aprobación de gerencia" y no la emite

Escenario: Margen suficiente
  Dado una proforma con margen efectivo de 30 % y sin descuento
  Cuando el vendedor la emite
  Entonces la proforma pasa a emitida sin aprobación
```

### US-16 · Aprobar o rechazar una proforma (M) (RF-APR-02)
**Como** gerencia, **quiero** revisar y aprobar o rechazar solicitudes **para** controlar excepciones.

```gherkin
Escenario: Aprobar con comentario
  Dado una solicitud de aprobación pendiente
  Cuando gerencia la aprueba con el comentario "Cliente frecuente"
  Entonces el vendedor puede emitirla y queda registrado quién aprobó, cuándo y el comentario

Escenario: Rechazar
  Dado una solicitud pendiente
  Cuando gerencia la rechaza indicando el motivo
  Entonces la proforma vuelve a borrador y el vendedor ve el motivo
```

### US-17 · Emitir una proforma inmutable (M) (RF-APR-03)
**Como** vendedor, **quiero** que la proforma emitida no cambie **para** garantizar lo que le prometí al cliente.

```gherkin
Escenario: Precios congelados
  Dado una proforma emitida con total S/ 6,992.81
  Cuando el administrador sube el precio de la cámara en el catálogo
  Entonces la proforma emitida sigue en S/ 6,992.81

Escenario: Edición de proforma emitida
  Dado una proforma emitida
  Cuando el vendedor intenta editar una línea
  Entonces el sistema ofrece "Crear nueva versión" y no permite modificar la original
```

### US-18 · Registrar la respuesta del cliente (M) (RF-APR-04, RF-PRO-10)
**Como** vendedor, **quiero** marcar la proforma como enviada, aprobada o rechazada **para** dar seguimiento.

```gherkin
Escenario: Proforma vencida
  Dado una proforma enviada con validez de 15 días
  Cuando pasan 16 días sin respuesta
  Entonces su estado cambia a "vencida"
```

---

## Épica 7 — Documentos

### US-19 · Descargar el PDF para el cliente (M) (RF-DOC-01, RF-DOC-04)
**Como** vendedor, **quiero** descargar un PDF profesional **para** enviarlo al cliente.

```gherkin
Escenario: PDF sin información interna
  Dado una proforma emitida
  Cuando el vendedor descarga el PDF
  Entonces el documento incluye resumen, alcance (incluye / no incluye), detalle por zona, cronograma, servicios, condiciones y espacio de aceptación
  Y no muestra costos de compra ni margen
  Y el total coincide exactamente con el de la pantalla
```

### US-20 · Descargar Excel con detalle interno (M) (RF-DOC-02)
**Como** gerencia, **quiero** un Excel con costos y margen **para** revisar la rentabilidad de la proforma.

```gherkin
Escenario: Hoja interna solo para gerencia
  Dado una proforma emitida
  Cuando gerencia descarga el Excel
  Entonces incluye la hoja "Interno" con costos y margen

Escenario: Vendedor no ve la hoja interna
  Dado un usuario con rol vendedor
  Cuando descarga el Excel
  Entonces el archivo no contiene la hoja "Interno"
```

---

## Épica 8 — Confidencialidad y auditoría

### US-21 · Ocultar costos al vendedor (M) (RNF-01)
**Como** gerencia, **quiero** que el vendedor no pueda ver costos ni márgenes **para** proteger la información comercial.

```gherkin
Escenario: Respuesta de API para vendedor
  Dado un usuario con rol vendedor
  Cuando consulta el cálculo de una proforma
  Entonces la respuesta no contiene los campos de costo, margen ni gastos generales

Escenario: Intento de acceso a parámetros
  Dado un usuario con rol vendedor
  Cuando intenta abrir la pantalla de parámetros
  Entonces recibe un error de acceso denegado
```

### US-22 · Auditar cambios sensibles (M) (RF-AUD-01)
**Como** gerencia, **quiero** un historial de cambios de precios, parámetros y descuentos **para** saber quién cambió qué y cuándo.

```gherkin
Escenario: Registro de cambio de precio
  Dado que el administrador cambia una oferta de 38.00 a 40.00 USD
  Cuando consulta la bitácora
  Entonces ve usuario, fecha, valor anterior (38.00) y valor nuevo (40.00)
```

---

## Épica 9 — Calidad de datos y seguimiento (Should)

### US-23 · Nueva versión con motivo (S) (RF-PRO-09)
**Como** vendedor, **quiero** crear una versión nueva indicando el motivo **para** corregir sin perder el historial.

```gherkin
Escenario: Nueva versión por error de precio
  Dado una proforma emitida
  Cuando el vendedor crea una nueva versión con motivo "error de precio"
  Entonces la versión anterior queda de solo lectura
  Y el motivo cuenta en el indicador de proformas con corrección
```

### US-24 · Ver indicadores de éxito (S) (RF-REP-01)
**Como** gerencia, **quiero** ver el tiempo de cotización, las correcciones y el cumplimiento de margen **para** comprobar si la aplicación funciona.

```gherkin
Escenario: Panel de indicadores
  Dado proformas emitidas durante el mes
  Cuando gerencia abre el panel
  Entonces ve el tiempo promedio de cotización, el porcentaje de proformas con corrección, el porcentaje con margen mínimo cumplido y el porcentaje emitido desde la app
```

---

## Épica 10 — Visita técnica y obra (Should, Fase 2)

### US-25 · Registrar visita técnica desde el celular (S) (RF-VIS-01)
**Como** técnico, **quiero** registrar fotos, medidas y condiciones del sitio **para** que la proforma refleje lo que realmente hay.

```gherkin
Escenario: Registrar punto con foto
  Dado una visita técnica abierta en el celular
  Cuando el técnico completa el checklist de "Piso 1", agrega una foto y una medida de 12.5 m
  Entonces la información queda guardada en la visita y es visible para el vendedor
```

### US-26 · Registrar horas reales (S) (RF-OT-02, RF-OT-03)
**Como** técnico, **quiero** registrar las horas reales trabajadas **para** que la empresa calibre sus estimaciones.

```gherkin
Escenario: Comparativo estimado y real
  Dado una orden de trabajo con 3.5 horas estimadas para una cámara exterior
  Cuando el técnico registra 4.2 horas reales
  Entonces el comparativo muestra una desviación de +20 %
```

---

## Resumen de historias

| ID | Historia | Prioridad | Épica |
|---|---|---|---|
| US-01 | Iniciar sesión | M | Acceso |
| US-02 | Gestionar usuarios y roles | M | Acceso |
| US-03 | Registrar cliente y proyecto | M | Clientes |
| US-04 | Registrar ofertas por proveedor | M | Catálogo |
| US-05 | Registrar tipo de cambio | M | Catálogo |
| US-06 | Importar catálogo desde Excel | S | Catálogo |
| US-07 | Definir un ensamblaje | M | Ensamblajes |
| US-08 | Configurar parámetros | M | Ensamblajes |
| US-09 | Crear proforma por zonas | M | Constructor |
| US-10 | Ajustar dificultad del sitio | M | Constructor |
| US-11 | Elegir cuadrilla y ver plazo | M | Constructor |
| US-12 | Comparar cuadrillas | S | Constructor |
| US-13 | Aplicar descuento | M | Constructor |
| US-14 | Incluir mantenimiento | M | Constructor |
| US-15 | Proteger margen mínimo | M | Control |
| US-16 | Aprobar o rechazar | M | Control |
| US-17 | Emitir proforma inmutable | M | Control |
| US-18 | Registrar respuesta del cliente | M | Control |
| US-19 | Descargar PDF | M | Documentos |
| US-20 | Descargar Excel interno | M | Documentos |
| US-21 | Ocultar costos al vendedor | M | Seguridad |
| US-22 | Auditar cambios | M | Seguridad |
| US-23 | Nueva versión con motivo | S | Calidad |
| US-24 | Ver indicadores de éxito | S | Calidad |
| US-25 | Registrar visita técnica | S | Obra |
| US-26 | Registrar horas reales | S | Obra |
