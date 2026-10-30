<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Roles y Cuentas de Acceso del Sistema Escolar

Para cualquier tarea de desarrollo, pruebas o autenticación, utilizar las credenciales oficiales de la matriz institucional:

- **Super Administrador SaaS (Creador / Plataforma):**
  - **Usuario:** `superadmin` / `123456`
  - *Ámbito:* Gestión SaaS, escuelas suscritas, planes y facturación SaaS a escuelas.
- **Directora Escolar (ESC001):**
  - **Usuario:** `director` / `123456`
  - *Ámbito:* Supervisión ejecutiva, diplomas de honor con QR, auditoría y circulares.
- **Administrador Escolar (ESC002):**
  - **Usuario:** `admin.school` / `123456`
  - *Ámbito:* Control institucional general, matrículas masivas, promociones, personal y horarios.
- **Contador / Cajero (Finance - ESC002):**
  - **Usuario:** `cajero.school` / `123456`
  - *Ámbito:* Ventanilla de caja, emisión de facturas a familias, recepción de pagos (POS/efectivo) y morosos.
- **Oficial de Admisiones (Admissions - ESC002):**
  - **Usuario:** `admisiones.school` / `123456`
  - *Ámbito:* Pre-matrículas web, recepción de aspirantes, revisión documental y conversión a estudiantes.
- **Docente Titular:**
  - **Usuario:** `lhernandez` (`ESC002`) o `jgonzalez` (`ESC001`) / `123456`
  - *Ámbito:* Aula virtual, pase de asistencia, asignación de tareas, exámenes y calificaciones.
- **Estudiante Regular:**
  - **Usuario:** `kjmejia` (Kevin Mejia, `ESC002`) / `123456`
  - *Ámbito:* Portal estudiantil, entrega de tareas, calificaciones personales, asistencia y cuotas.
- **Padre / Tutor Legal:**
  - **Usuario:** `mlopez` (`ESC001`) o `p.carlos.861` (`ESC002`) / `123456`
  - *Ámbito:* Portal familiar, panel multi-hijo, asistencias de hijos, notas y pagos de colegiaturas.
