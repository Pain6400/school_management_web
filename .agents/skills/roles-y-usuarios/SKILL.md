---
name: roles-y-usuarios
description: "Catálogo de roles, cuentas de prueba y credenciales de acceso (ej. admin.school / 123456 para administración y caja) según la perspectiva del sistema escolar."
---

# Catálogo de Roles, Usuarios y Credenciales de Acceso

Esta habilidad define y documenta los roles oficiales del sistema escolar, las credenciales de prueba activas y la perspectiva de usuario adecuada según el módulo en desarrollo.

---

## 1. Principio Fundamental de Perspectiva

El sistema cuenta con interfaces y permisos diferenciados por rol. Al probar, navegar o generar flujos de trabajo, **siempre seleccionar el usuario adecuado según el módulo objetivo**:

- **Administración y Caja Institucional (`/school/*`, `/school/finance`):**
  Usar **`admin.school`** (Contraseña: `123456`). Sede: `ESC002`.
- **Portal del Estudiante (`/student/*`):**
  Usar **`kjmejia`** (Contraseña: `123456`). Titular: Kevin Mejia, DNI: `0501199710597`.
- **Aula Virtual y Calificaciones (`/teacher/*`):**
  Usar **`jgonzalez`** (Contraseña: `123456`) o **`lhernandez`**.
- **Super Administrador Global:**
  Usar **`superadmin`** (Contraseña: `123456`).

---

## 2. Catálogo Oficial de Roles en Base de Datos

| ID | Nombre en Base de Datos | Clave JWT / Store | Ámbito de Acción |
| :---: | :--- | :--- | :--- |
| **1** | Super Administrador | `SUPER_ADMIN` | Dueño de plataforma SaaS, venta de suscripciones a escuelas y planes |
| **2** | Administrador Escolar | `SCHOOL_ADMIN` | Gestión directiva completa, matrículas, promociones, personal y horarios |
| **3** | Profesor | `TEACHER` | Aula virtual, calificaciones, tareas, exámenes y pase de lista |
| **4** | Estudiante | `STUDENT` | Consulta de materias, tareas y pagos propios |
| **5** | Padre/Tutor | `PARENT` | Supervisión de dependientes económicos (panel multi-hijo) |
| **6** | Directora Escolar | `DIRECTOR` | Máxima autoridad ejecutiva, diplomas con QR, auditoría y circulares |
| **7** | Contador / Cajero | `ACCOUNTANT` | Ventanilla de caja, facturación a familias, cobros en POS/efectivo y morosos |
| **8** | Oficial de Admisiones | `ADMISSIONS_OFFICER` | Pre-matrículas web, recepción de aspirantes y conversión a estudiantes |

---

## 3. Directorio de Cuentas de Acceso Verificadas

Todas las contraseñas en el entorno de desarrollo y pruebas están unificadas en: **`123456`**.

| Usuario | Contraseña | Rol | Nombre Completo | Sede | Notas |
| :--- | :---: | :--- | :--- | :---: | :--- |
| **`superadmin`** | `123456` | Super Administrador SaaS | Carlos Martínez | *Global SaaS* | Creador de la plataforma, planes y escuelas |
| **`director`** | `123456` | Directora Escolar | Ana Gutiérrez | `ESC001` | Supervisión directiva, auditoría y diplomas |
| **`admin.school`** | `123456` | Administrador Escolar | Juan Perez | `ESC002` | Gestión institucional y académica general |
| **`cajero.school`** | `123456` | Contador / Cajero | Elena Gómez | `ESC002` | **Ventanilla de caja, cobros y finanzas** |
| **`admisiones.school`** | `123456` | Oficial de Admisiones | Patricia Castro | `ESC002` | **Aspirantes, pre-matrículas y altas** |
| **`lhernandez`** | `123456` | Docente Titular | Laura Hernández | `ESC002` | Profesora sede Luz del Saber |
| **`jgonzalez`** | `123456` | Docente Titular | José González | `ESC001` | Profesor asignado a materias |
| **`kjmejia`** | `123456` | Estudiante Regular | Kevin Mejia | `ESC002` | DNI: `0501199710597` (Alumno con beca/cobros) |
| **`mlopez`** | `123456` | Padre/Tutor Legal | Marta López | `ESC001` | Madre con panel multi-hijo (Carlos y Kevin) |

---

## 4. Sedes / Escuelas Registradas

- **`ESC001`**: Colegio San Miguel (Tegucigalpa)
- **`ESC002`**: Centro Educativo Luz del Saber (San Pedro Sula)
- **`ESC003`**: Escuela Rural Santa Fe

---

## 5. Instrucciones para Agentes y Subagentes

1. **Pruebas de Autenticación (`POST /api/auth/login`):**
   Para obtener un token administrativo válido, enviar siempre:
   ```json
   {
     "username": "admin.school",
     "password": "123456"
   }
   ```
2. **Contexto de Sesión:**
   Al verificar o abrir el navegador, asegurarse de que la sesión activa no sea de estudiante (`kjmejia`) si se está probando una ruta protegida para personal escolar (`/school/*`).
