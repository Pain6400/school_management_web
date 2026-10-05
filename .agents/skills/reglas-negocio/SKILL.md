---
name: reglas-negocio
description: "Directrices y reglas de negocio para el sistema de gestión escolar, inspiradas en las mejores prácticas de plataformas líderes (Canvas, Moodle, PowerSchool) y adaptadas a la arquitectura backend-first."
---

# Reglas de Negocio del Sistema Escolar (School Management)

Esta habilidad define las reglas de negocio base que todos los agentes y subagentes (Orquestador, DB, Backend, Frontend, QA) deben considerar para construir un producto robusto, escalable y competitivo frente a estándares de la industria.

## 1. Naturaleza del Sistema (SIS + LMS)
Nuestro proyecto combina dos mundos que deben estar bien definidos:
- **Enfoque SIS (Student Information System - estilo PowerSchool):** Datos oficiales (Asistencia, Calificaciones Finales, Matrícula, Expedientes). Requieren **integridad absoluta, auditoría y validaciones estrictas**. Se utiliza `Soft Delete` (borrado lógico) para retener el historial.
- **Enfoque LMS (Learning Management System - estilo Canvas/Moodle):** Contenido académico (Tareas, Entregas, Foros). Debe priorizar la **experiencia de usuario (UX)** y tiempos de carga rápidos.

## 2. Aplicación de Arquitectura Backend-First
- **Fuente de la Verdad:** Toda regla de negocio (ej. calcular si un alumno aprueba, si tiene faltas acumuladas, si hay conflicto de horario) se ejecuta en el **Backend**.
- **Frontend como Consumidor:** El frontend (React/Next.js) jamás asume responsabilidades de filtrado masivo o cálculos críticos. 
- **Fechas y Timezones:** Respetar la regla de proyecto sobre Oracle/Postgres DB. Las fechas deben manipularse sin alterar la zona horaria y formatearse correctamente en las consultas (ej. `TO_DATE` en bases relacionales).

## 3. Gestión de Roles y Permisos (RBAC)
- **SuperAdmin / Admin:** Únicos con poder de modificar la estructura de ciclos escolares, catálogos base y asignar personal.
- **Docente:** Solo puede editar calificaciones, asistencia y contenido dentro de **sus cursos asignados y dentro del periodo lectivo activo**. Fuera del periodo, es modo solo-lectura.
- **Estudiante:** Acceso de lectura a su propio progreso y permisos de escritura limitados a entregas de trabajos. No puede ver datos de otros compañeros.
- **Padre/Tutor (Opcional):** Visibilidad unificada de dependientes económicos, alertas de inasistencia y reporte de calificaciones.

## 4. Automatización y Consistencia de Datos
- **Estados Cíclicos:** Los periodos de calificación (parciales, semestres) deben poder cerrarse. Un periodo "Cerrado" prohíbe la modificación de notas para evitar alteraciones en reportes oficiales.
- **Bajas y Retiros:** Si un alumno cambia a estado "Inactivo", se revocan sus accesos a entregas de trabajos pero su historial de calificaciones se mantiene intacto.

## 5. Interacción con el Orquestador y Flujo de Trabajo
Cuando el **Orquestador** analice un requerimiento, deberá consultar estas reglas para:
1. Definir qué tabla o campo en DB (SIS o LMS) necesita el subagente de DB.
2. Instruir al subagente de Backend para que aplique la lógica de permisos o validaciones pertinentes (ej. validar que el docente pertenezca al curso).
3. Instruir al subagente de Frontend para mostrar de forma limpia e intuitiva los datos, ocultando botones de acción si el rol no tiene acceso.
4. QA deberá validar que los roles no puedan sobrepasar sus permisos mediante ataques directos a la API.
