<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Roles y Cuentas de Acceso del Sistema Escolar

Para cualquier tarea de desarrollo, pruebas o autenticación, utilizar las credenciales oficiales:

- **Administrador Escolar / Cobros y Caja (`/school/finance`):**
  - **Usuario:** `admin.school`
  - **Contraseña:** `123456`
  - **Escuela:** `ESC002` (Centro Educativo Luz del Saber)
  - *Regla:* NUNCA usar cuentas de estudiante para probar administración o cobros.
- **Super Administrador:** `superadmin` / `123456`
- **Directora (ESC001):** `director` / `123456`
- **Docente:** `jgonzalez` (`ESC001`) o `lhernandez` (`ESC002`) / `123456`
- **Estudiante:** `kjmejia` (Kevin Mejia, DNI `0501199710597`, `ESC002`) / `123456`
- **Padre/Tutor:** `mlopez` (`ESC001`) / `123456`
