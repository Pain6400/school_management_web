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
| **1** | Super Administrador | `SUPER_ADMIN` | Control total del sistema, multi-escuela |
| **2** | Administrador Escolar | `ADMIN` | Gestión directiva, matrículas, cobros y caja |
| **3** | Profesor | `TEACHER` | Aula virtual, calificaciones, asistencias |
| **4** | Estudiante | `STUDENT` | Consulta de materias, tareas y pagos propios |
| **5** | Padre/Tutor | `PARENT` | Supervisión de dependientes económicos |

---

## 3. Directorio de Cuentas de Acceso Verificadas

Todas las contraseñas en el entorno de desarrollo y pruebas están unificadas en: **`123456`**.

| Usuario | Contraseña | Rol | Nombre Completo | Sede | Notas |
| :--- | :---: | :--- | :--- | :---: | :--- |
| **`admin.school`** | `123456` | Administrador Escolar | Juan Perez | `ESC002` | **Usuario por defecto para caja, finanzas y administración** |
| **`director`** | `123456` | Administrador Escolar | Ana Gutiérrez | `ESC001` | Dirección sede Los Pinos / Colegio San Miguel |
| **`superadmin`** | `123456` | Super Administrador | Carlos Martínez | *Global* | Acceso sin restricción de sede |
| **`jgonzalez`** | `123456` | Docente | José González | `ESC001` | Profesor asignado a materias |
| **`lhernandez`** | `123456` | Docente | Laura Hernández | `ESC002` | Profesora sede Luz del Saber |
| **`kjmejia`** | `123456` | Estudiante | Kevin Mejia | `ESC002` | DNI: `0501199710597` (Alumno con beca/cobros) |
| **`clopez`** | `123456` | Estudiante | Carlos López | `ESC001` | Alumno sede ESC001 |
| **`mgarcia`** | `123456` | Estudiante | Marta García | `ESC001` | Alumna sede ESC001 |
| **`mlopez`** | `123456` | Padre/Tutor | Marta López | `ESC001` | Familiar de alumnos ESC001 |

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
