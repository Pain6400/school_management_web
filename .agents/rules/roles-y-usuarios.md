# Roles y Usuarios de Acceso del Sistema Escolar

## 1. Cuentas de Acceso y Credenciales de Prueba

> [!IMPORTANT]
> **Regla de Acceso Administrativo:**
> Para cualquier tarea o prueba en módulos de administración, finanzas, caja institucional (`/school/finance`), matrículas o configuración, utilizar siempre la cuenta de Administrador Escolar:
> - **Usuario:** `admin.school`
> - **Contraseña:** `123456`
> - **Sede / Escuela:** `ESC002` (Centro Educativo Luz del Saber)
> 
> **NUNCA** iniciar sesión con cuentas de estudiante (ej. `kjmejia`) al desarrollar o probar funcionalidades administrativas o de cobros.

---

## 2. Directorio de Usuarios de Prueba por Rol

| Rol | ID | Clave Rol | Usuario | Nombre | Sede / Escuela | Contraseña | Propósito |
| :--- | :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **Administrador Escolar** | 2 | `ADMIN` | **`admin.school`** | Juan Perez | **`ESC002`** | `123456` | **Cuenta principal de administración, finanzas y caja en ventanilla** |
| **Directora / Admin** | 2 | `ADMIN` | `director` | Ana Gutiérrez | `ESC001` | `123456` | Administración de sede Colegio San Miguel |
| **Super Administrador** | 1 | `SUPER_ADMIN` | `superadmin` | Carlos Martínez | *Global (Todas)* | `123456` | Control global y multi-escuela |
| **Profesor / Docente** | 3 | `TEACHER` | `jgonzalez` | José González | `ESC001` | `123456` | Pruebas de aula virtual, tareas y calificaciones |
| **Profesor / Docente** | 3 | `TEACHER` | `lhernandez` | Laura Hernández | `ESC002` | `123456` | Pruebas docentes en sede Luz del Saber |
| **Estudiante** | 4 | `STUDENT` | `kjmejia` | Kevin Mejia | `ESC002` | `123456` | Alumno titular (DNI: `0501199710597`). Usar solo en portal del estudiante |
| **Estudiante** | 4 | `STUDENT` | `clopez` | Carlos López | `ESC001` | `123456` | Alumno sede ESC001 |
| **Padre / Tutor** | 5 | `PARENT` | `mlopez` | Marta López | `ESC001` | `123456` | Seguimiento familiar y portal de tutores |

---

## 3. Códigos de Escuela en la Base de Datos

- **`ESC001`**: Colegio San Miguel (Tegucigalpa)
- **`ESC002`**: Centro Educativo Luz del Saber (San Pedro Sula) — *Sede de `admin.school` y del estudiante `Kevin Mejia`*
- **`ESC003`**: Escuela Rural Santa Fe

---

## 4. Perspectivas de Desarrollo Obligatorias

1. **Perspectiva Administración / Cajero (`/school/*`):**
   - Corresponde a los cobros presenciales, emisión de comprobantes, arqueo de caja y conciliación de transferencias.
   - Acceso con `admin.school` (`123456`).
2. **Perspectiva Estudiante / Padre (`/student/*`):**
   - Solo cuando el usuario pida explícitamente trabajar en la vista o autoservicio del estudiante o padre.
   - Acceso con `kjmejia` (`123456`).
3. **Perspectiva Docente (`/teacher/*`):**
   - Asistencia, tareas, calificaciones y aula virtual.
   - Acceso con `jgonzalez` o `lhernandez` (`123456`).
