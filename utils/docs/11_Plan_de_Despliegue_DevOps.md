# Plan de Despliegue y DevOps

**Versión:** 1.0 · 17 de octubre de 2026
**Objetivo:** desplegar de forma **repetible, verificable y reversible**, con el menor número de piezas posible (volumen bajo, hosting económico, desarrollo con IA).

---

## 1. Resumen

| Tema | Decisión |
|---|---|
| Repositorio | Git (GitHub), monorepo: `/api`, `/web`, `/docs` |
| Ramas | `main` (producción) y `develop` (pruebas); ramas cortas `feature/*` y `fix/*` con *pull request* |
| CI | GitHub Actions: estilo, análisis estático, pruebas y compilación en cada PR |
| CD | `develop` → despliegue automático a **pruebas**; `main` → despliegue a **producción con aprobación manual** |
| Despliegue | Por SSH (rsync) a una carpeta de versión nueva + cambio de enlace simbólico; si el hosting no ofrece SSH, SFTP automatizado con respaldo previo |
| Base de datos | Migraciones SQL **hacia adelante**, compatibles con la versión anterior del código |
| Rollback | Volver al enlace de la versión anterior (segundos); restaurar base solo si una migración dañó datos |
| Versionado | `vMAYOR.MENOR.PARCHE` con etiquetas Git; cada versión incluye el artefacto compilado |

---

## 2. Flujo de trabajo y ramas

```
feature/xyz ──PR──► develop ──(CI verde)──► despliegue automático a PRUEBAS
                        │
                        └──PR──► main ──(CI verde + aprobación manual)──► PRODUCCIÓN (etiqueta vX.Y.Z)
```

| Regla | Detalle |
|---|---|
| Protección de `main` y `develop` | No se sube directo; PR con CI verde obligatorio |
| Revisión | Un humano revisa los PR que tocan el motor de cálculo, permisos o migraciones |
| Mensajes de commit | Descriptivos; referencia a requisito o historia (`RF-CAL-05`, `US-13`) |
| Etiquetas | Cada paso a producción crea una etiqueta (`v1.0.0`) y notas de versión |

---

## 3. Pipeline de CI (en cada pull request)

| Etapa | Qué hace | Falla si… |
|---|---|---|
| 1. Instalación | `composer install` y `npm ci` con caché | Dependencias no resuelven |
| 2. Estilo | PHP_CodeSniffer (PSR-12); ESLint y Prettier | Hay infracciones |
| 3. Análisis estático | PHPStan nivel 6 o superior; `tsc --noEmit` | Hay errores de tipos |
| 4. Pruebas del motor | PHPUnit (suite `Engine`), cobertura ≥ 95 % | Falla un caso CAL o baja la cobertura |
| 5. Pruebas de API | PHPUnit con MySQL de servicio; migraciones desde cero + semilla | Falla un caso SEG, PER, DAT, PRO, DOC o AUD |
| 6. Barrido de permisos | Prueba que recorre respuestas para vendedor y técnico buscando campos prohibidos | Aparece un campo de costo o margen |
| 7. Pruebas de frontend | Vitest | Falla alguna |
| 8. Compilación | `npm run build` (SPA) | Error de compilación |
| 9. Auditoría de dependencias | `composer audit` y `npm audit` (nivel alto) | Vulnerabilidades altas o críticas sin excepción registrada |
| 10. Artefacto | Empaqueta `api` (sin `.env`, sin pruebas) + `web/dist` en un `.tar.gz` versionado | — |

### Ejemplo de flujo (GitHub Actions)

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [develop, main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: proformas_test
        ports: ["3306:3306"]
        options: >-
          --health-cmd="mysqladmin ping -h 127.0.0.1 -proot"
          --health-interval=10s --health-timeout=5s --health-retries=10
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with:
          php-version: "8.2"
          extensions: pdo_mysql, mbstring, gd, zip, xml, bcmath, intl
          coverage: xdebug
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
          cache-dependency-path: web/package-lock.json
      - name: Backend - dependencias
        working-directory: api
        run: composer install --no-interaction --prefer-dist
      - name: Backend - estilo y análisis
        working-directory: api
        run: |
          vendor/bin/phpcs --standard=PSR12 src
          vendor/bin/phpstan analyse -l 6 src
      - name: Backend - migraciones y semilla
        working-directory: api
        env:
          DB_HOST: 127.0.0.1
          DB_NAME: proformas_test
          DB_USER: root
          DB_PASS: root
        run: php bin/migrate.php && php bin/seed.php
      - name: Backend - pruebas
        working-directory: api
        env:
          DB_HOST: 127.0.0.1
          DB_NAME: proformas_test
          DB_USER: root
          DB_PASS: root
        run: vendor/bin/phpunit --coverage-text
      - name: Frontend - dependencias, pruebas y compilación
        working-directory: web
        run: |
          npm ci
          npm run lint
          npm test -- --run
          npm run build
      - name: Auditoría de dependencias
        run: |
          (cd api && composer audit)
          (cd web && npm audit --audit-level=high)
      - name: Empaquetar artefacto
        if: github.ref == 'refs/heads/develop' || github.ref == 'refs/heads/main'
        run: |
          VERSION=${GITHUB_SHA::8}
          mkdir -p dist/api && rsync -a --exclude tests --exclude .env api/ dist/api/
          cp -r web/dist dist/web
          tar -czf proformas-$VERSION.tar.gz -C dist .
      - uses: actions/upload-artifact@v4
        if: github.ref == 'refs/heads/develop' || github.ref == 'refs/heads/main'
        with:
          name: release
          path: proformas-*.tar.gz
```

> Nota: el *workflow* de despliegue (siguiente sección) descarga este artefacto y lo publica. Los scripts `bin/migrate.php` y `bin/seed.php` forman parte del repositorio.

---

## 4. Estrategia de despliegue

### 4.1 Estructura en el servidor (con SSH)

```
/home/usuario/proformas/
  releases/
    20261017-1530-a1b2c3d4/    # cada versión en su carpeta
    20261024-1010-e5f6a7b8/
  shared/
    .env                        # secretos del entorno (no se versiona)
    storage/                    # logs, fotos y documentos (persistente)
  current -> releases/20261024-1010-e5f6a7b8   # enlace simbólico a la versión activa
  backups/
/home/usuario/public_html/
  api -> /home/usuario/proformas/current/api/public
  (SPA en la raíz: index.html + assets, publicados con cada versión)
```

### 4.2 Pasos del despliegue (producción)

| # | Paso | Responsable | Verificación |
|---|---|---|---|
| 1 | CI verde en `main`; versión etiquetada (`vX.Y.Z`) y notas de versión | CI | Etiqueta creada |
| 2 | **Aprobación manual** (entorno `production` en GitHub) | Responsable del producto | Aprobación registrada |
| 3 | Aviso a los usuarios (si hay cambios visibles) y elegir horario de baja actividad | Responsable | — |
| 4 | **Respaldo previo:** volcado de la base de datos y copia de `storage` | Script | Archivo con tamaño y suma de verificación |
| 5 | Subir el artefacto a `releases/<fecha-hora-hash>/` | Script | Suma de verificación coincide |
| 6 | Enlazar `shared/.env` y `shared/storage` dentro de la nueva carpeta | Script | Enlaces válidos |
| 7 | Activar modo mantenimiento (solo si la migración lo exige) | Script | Página de mantenimiento |
| 8 | Ejecutar **migraciones** (`php bin/migrate.php`) | Script | Todas aplicadas o error y parada |
| 9 | Cambiar el enlace `current` a la nueva versión y publicar la SPA | Script | `current` apunta a la nueva |
| 10 | Limpiar caché de opcode (si aplica) | Script | — |
| 11 | **Pruebas de humo** (sección 4.4) | Script + persona | Todas verdes |
| 12 | Desactivar modo mantenimiento; monitoreo reforzado por 1 hora | Responsable | Sin errores |

Se conservan las **5 últimas versiones** en `releases/`.

### 4.3 Sin acceso SSH (hosting compartido básico)

| Paso | Detalle |
|---|---|
| 1 | Descargar respaldo de base y archivos (desde el panel o el script con la API del proveedor) |
| 2 | Subir por SFTP a una carpeta temporal `release_nuevo/` |
| 3 | Renombrar `api_actual` → `api_anterior` y `release_nuevo` → `api_actual` (cambio casi atómico) |
| 4 | Ejecutar migraciones con una URL protegida de uso único o tarea programada manual |
| 5 | Pruebas de humo |
| 6 | **Rollback:** renombrar `api_anterior` → `api_actual` |

### 4.4 Pruebas de humo posteriores al despliegue

| # | Prueba | Resultado esperado |
|---|---|---|
| 1 | `GET /api/v1/health` | `200`, API y base `ok` |
| 2 | Inicio de sesión de una cuenta de verificación | Entra y ve su inicio |
| 3 | Calcular la proforma de referencia (cuenta de gerencia) | Total **S/ 6,992.81**; plazo **2.5 días** |
| 4 | Descargar el PDF de esa proforma | Se genera y muestra los mismos totales |
| 5 | Vendedor consulta el cálculo | Sin campos de costo ni margen |
| 6 | Revisar el log de errores | Sin errores nuevos |

*Para producción*, la prueba 3 usa una proforma de verificación marcada y excluida de reportes; nunca datos reales de clientes.

---

## 5. Entornos y configuración

| Elemento | Pruebas | Producción |
|---|---|---|
| Disparador | Automático al fusionar en `develop` | Manual con aprobación sobre `main` |
| Base de datos | Propia, con datos semilla o copia anonimizada | Propia, datos reales |
| `.env` | `APP_ENV=staging`, `APP_DEBUG=false` | `APP_ENV=production`, `APP_DEBUG=false` |
| Secretos | Distintos a los de producción | Solo en el servidor y en *secrets* de GitHub |
| Correos | Capturados o a una cuenta interna | Reales |
| Acceso | Solo equipo (autenticación básica adicional) | Usuarios autorizados |

**Secretos de GitHub (Environments):** `SSH_HOST`, `SSH_USER`, `SSH_KEY`, `DEPLOY_PATH`, `DB_BACKUP_*`. Rotar las claves cada 6 meses o al cambiar de responsable.

---

## 6. Migraciones de base de datos

| Regla | Detalle |
|---|---|
| Formato | Archivos `NNN_descripcion.sql` con tabla `schema_migrations` que registra las aplicadas |
| Solo hacia adelante | No se editan migraciones ya aplicadas; los cambios nuevos son migraciones nuevas |
| Compatibilidad con la versión anterior | Patrón **expandir y contraer**: primero se agregan columnas o tablas (compatible), después se cambia el código, y solo en una versión posterior se elimina lo obsoleto |
| Prohibido en un solo despliegue | Renombrar o borrar columnas que el código anterior usa |
| Datos | Las migraciones que transforman datos se prueban sobre una copia de producción antes de aplicarse |
| Respaldo | Obligatorio antes de aplicar migraciones en producción |
| Transacciones | MySQL no revierte DDL; por eso cada migración debe ser pequeña y tener su **script de reversión manual documentado** |
| Datos semilla | La semilla de prueba **nunca** se ejecuta en producción (el script exige `APP_ENV != production`) |

---

## 7. Estrategia de rollback

### 7.1 Árbol de decisión

| Situación | Acción | Tiempo objetivo |
|---|---|---|
| Falla una prueba de humo o hay errores graves tras el cambio de versión | **Rollback de código:** apuntar `current` a la versión anterior y republicar la SPA anterior | ≤ 5 minutos |
| Falla la migración a la mitad | Detener el despliegue; **no** cambiar `current`; evaluar reversión manual con el script de la migración o restaurar el respaldo | ≤ 30 minutos |
| Se detectan datos corruptos o cálculos incorrectos después de horas | Rollback de código + corrección de datos con script revisado; si hay proformas emitidas afectadas, **nueva versión** de cada una (no se editan) | Según gravedad |
| Error de dinero (totales distintos) | Rollback inmediato y **bloqueo de emisión** hasta corregir | Inmediato |

### 7.2 Procedimiento de rollback de código

1. Confirmar la versión anterior estable (`releases/<anterior>`).
2. Cambiar `current` a esa carpeta y restaurar la SPA anterior.
3. Verificar que las migraciones aplicadas sean compatibles con el código anterior (por el patrón expandir/contraer, lo son).
4. Ejecutar las pruebas de humo.
5. Comunicar a los usuarios y registrar el incidente (causa, impacto, acción).
6. Abrir un defecto con prueba de regresión antes de volver a intentar el despliegue.

### 7.3 Procedimiento de restauración de base de datos

1. Poner la aplicación en modo mantenimiento.
2. Exportar el estado actual (por si se necesita un análisis posterior).
3. Restaurar el respaldo previo al despliegue en la base de datos.
4. Re-aplicar el código de la versión anterior.
5. Pruebas de humo y revisión de datos con el responsable.
6. **Advertencia:** se pierden los cambios hechos entre el respaldo y la restauración; evaluar reaplicarlos manualmente (por ejemplo, proformas creadas en ese lapso, a partir de la bitácora).

---

## 8. Copias de seguridad y recuperación

| Elemento | Frecuencia | Retención | Dónde | Verificación |
|---|---|---|---|---|
| Base de datos (volcado cifrado) | Diaria (madrugada) y antes de cada despliegue | 14 diarias + 8 semanales | Fuera del servidor (almacenamiento externo) | Suma de verificación; restauración de prueba trimestral |
| `storage` (fotos y documentos) | Diaria incremental | 14 días | Fuera del servidor | Muestreo semanal |
| Configuración (`.env`, sin secretos en el repositorio) | Al cambiar | Últimas 5 | Gestor de secretos o carpeta cifrada | — |

**Objetivos:** pérdida máxima de datos (RPO) ≤ 24 horas; tiempo de recuperación (RTO) ≤ 4 horas en horario laboral.

---

## 9. Monitoreo y operación

| Aspecto | Herramienta | Alerta |
|---|---|---|
| Disponibilidad | Servicio de monitoreo externo gratuito sobre `/api/v1/health` cada 5 minutos | Correo si falla 2 veces seguidas |
| Errores del servidor | Log rotado en `storage/logs`; resumen diario por correo al administrador | Correo inmediato ante errores críticos |
| Copias de seguridad | La tarea registra éxito o fallo | Correo si falla |
| Espacio en disco y memoria | Panel del hosting o revisión mensual | Aviso al 80 % |
| Certificado SSL | Renovación automática; monitoreo de vencimiento | Aviso a 14 días |
| Tareas programadas (cron) | Vencimiento de proformas, copia de seguridad, limpieza de sesiones | Registro de última ejecución |
| Indicadores de negocio | Panel de KPIs | Revisión mensual con gerencia |

### Tareas programadas (cron)

| Tarea | Frecuencia |
|---|---|
| Marcar proformas vencidas | Diaria, 00:10 (America/Lima) |
| Respaldo de base de datos y `storage` | Diaria, 02:00 |
| Limpieza de sesiones y tokens vencidos | Diaria, 03:00 |
| Recordatorios de ofertas por vencer (Should) | Diaria, 07:00 |

---

## 10. Seguridad del proceso de entrega

| Control | Detalle |
|---|---|
| Secretos | Nunca en el repositorio; escaneo de secretos en CI |
| Dependencias | `composer audit` y `npm audit` en cada PR; actualización mensual |
| Acceso al servidor | Llaves SSH por persona o cuenta de despliegue con permisos mínimos; sin contraseña |
| Principio de cuatro ojos | Los cambios a motor de cálculo, permisos y migraciones requieren revisión humana |
| Entorno de producción | Solo despliegues desde CI; sin edición manual de archivos en el servidor |
| Registro | Historial de despliegues (quién, qué versión, cuándo) en GitHub |

---

## 11. Lista de verificación de salida a producción (go-live)

| # | Verificación | Estado |
|---|---|---|
| 1 | Criterios de aceptación del MVP cumplidos (`10_Plan_de_Pruebas_QA.md`, sección 12) | ☐ |
| 2 | UAT firmado por gerencia | ☐ |
| 3 | Catálogo, ofertas, tarifas, tipo de cambio y plantillas **reales** cargados y validados | ☐ |
| 4 | Datos semilla de prueba **eliminados** de producción | ☐ |
| 5 | Usuarios reales creados con rol correcto; cuentas de prueba desactivadas | ☐ |
| 6 | SSL activo, HTTPS forzado, `APP_DEBUG=false` | ☐ |
| 7 | Copia de seguridad y **restauración probada** | ☐ |
| 8 | Monitoreo y alertas configurados | ☐ |
| 9 | Plan de rollback ensayado en pruebas | ☐ |
| 10 | Línea base de indicadores medida (tiempo, correcciones, margen) | ☐ |
| 11 | Capacitación breve a vendedores, técnicos y gerencia | ☐ |
| 12 | Período de convivencia definido (primeras proformas se verifican contra el Excel) | ☐ |
| 13 | Contacto y procedimiento de soporte comunicados | ☐ |

## 12. Plan de convivencia tras el lanzamiento

| Periodo | Acción |
|---|---|
| Semanas 1 y 2 | Cada proforma emitida se compara con el Excel actual; cualquier diferencia se investiga el mismo día |
| Semana 3 en adelante | Revisión semanal de errores y de la bitácora; ajustes de horas y ensamblajes |
| Día 30 | Revisión de indicadores de éxito con gerencia y decisión sobre las funciones de la Fase 2 |

## 13. Matriz de responsabilidades

| Actividad | Responsable del producto | Desarrollo (IA) | Administrador | Gerencia |
|---|---|---|---|---|
| Aprobar paso a producción | **R** | C | I | A |
| Mantener CI/CD | I | **R** | C | — |
| Ejecutar despliegue | A | **R** | C | I |
| Respaldos y restauración | I | C | **R** | I |
| Decidir rollback | **R** | C | C | A |
| Validar cálculos tras cambios | **R** | C | I | A |

R = responsable · A = aprueba · C = consultado · I = informado
