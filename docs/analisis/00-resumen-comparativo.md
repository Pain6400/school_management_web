# Matriz Comparativa de Plataformas SaaS Escolares

> **Documento:** Resumen Comparativo de Arquitectura Funcional y Mejores Prácticas  
> **Objetivo:** Extraer patrones de diseño, reglas de negocio y modelos de datos de las plataformas líderes (Gradelink, Additio App, Teachmint, Alexia Suite) para implementar una solución escolar robusta con enfoque *clean room* sobre NestJS, PostgreSQL y React/Next.js.  
> **Estado:** Módulo 01 inicializado (Gradelink analizado).

---

## 1. Módulo: Cuaderno de Notas / Gradebook

### Tabla Comparativa de Capacidades

| Característica / Capacidad | **Gradelink** | **Additio App** | **Teachmint** | **Alexia Suite** |
| :--- | :--- | :--- | :--- | :--- |
| **Enfoque Principal** | SIS Formal / Calificaciones oficiales K-12 | Cuaderno pedagógico de campo / Evaluación flexible | LMS integrado con SIS / Clases en vivo y analítica | ERP/SIS integral para colegios concertados/privados (España/LatAm) |
| **Estructura del Cuaderno** | GradeSheet plano por clase y período | Pestañas (Trimestres/Evaluaciones) + Subcarpetas de categorías | *(Pendiente de análisis)* | *(Pendiente de análisis)* |
| **Modelos de Ponderación** | • % por categoría (peso igual)<br>• % por categoría (peso por puntos)<br>• Puntos totales puros | • Media aritmética<br>• Media ponderada (%)<br>• Fórmulas calculadas (`fx`) con condicionales | *(Pendiente de análisis)* | *(Pendiente de análisis)* |
| **Manejo de Celdas Vacías** | Omite tareas no evaluadas del denominador | Parámetro configurable: *"Omitir celdas sin notas"* (normaliza pesos) o contar como 0 | *(Pendiente de análisis)* | *(Pendiente de análisis)* |
| **Sobrescritura Manual (*Override*)** | No directa en celda calculada (requiere ajuste en tarea) | Clic en celda para forzar valor manual con icono de auditoría y opción de restaurar | *(Pendiente de análisis)* | *(Pendiente de análisis)* |
| **Tipos de Notas Soportados** | Números, Letras y Códigos (`EX`, `INC`, `AB`) | Números, Letras, Selectores de Iconos (con valor subyacente), Rúbricas | *(Pendiente de análisis)* | *(Pendiente de análisis)* |
| **Cálculos Entre Períodos (*Cross-Tab*)** | Calculado en pantalla de boletines | Columnas de cálculo directo entre pestañas (ej. $30\% T1 + 30\% T2 + 40\% T3$) | *(Pendiente de análisis)* | *(Pendiente de análisis)* |
| **Integraciones LMS** | Google Classroom (API directa), Schoology, Canvas | Google Classroom, Microsoft Teams, Moodle | *(Pendiente de análisis)* | *(Pendiente de análisis)* |

---

### Aprendizajes Clave de Gradelink para Nuestro SaaS
1. **Rigor Matemático Estricto:** Exigir que las categorías regulares sumen exactamente el `100%`.
2. **Códigos de Excepción Sin Penalización:** Código `EX` (Exonerado) para evitar que un alumno con inasistencia justificada reciba un cero en su promedio.
3. **Auditoría de Cierre de Notas:** Acción formal *Conclude Class* / *Conclude Term* para congelar calificaciones antes de generar boletines oficiales.

---

### Aprendizajes Clave de Additio App para Nuestro SaaS
1. **Pestañas y Cálculos Cruzados (*Cross-Tab Calculations*):** Permitir estructurar el cuaderno en pestañas (Trimestre 1, 2, 3 y Evaluación Final), donde una columna final puede calcular promedios directamente a partir de columnas de pestañas previas.
2. **Sobrescritura Manual con Trazabilidad (*Manual Override*):** Dar al docente la capacidad de forzar una nota en una celda calculada (ej. subir un 4.8 a 5.0 por esfuerzo), registrando el motivo y mostrando un indicador visual sin perder el cálculo matemático original.
3. **Normalización de Celdas Vacías (*Skip Empty Cells*):** Si un estudiante se incorpora a mitad de período o tiene actividades pendientes justificadas, el motor debe normalizar los pesos sobre las actividades efectivamente evaluadas.
4. **Columnas No Atadas a Tareas Formales:** Desacoplar el cuaderno de notas para permitir columnas rápidas de actitud, participación o rúbricas sin obligar a crear una "tarea" completa en el LMS.

---

*(Este documento se actualizará progresivamente conforme se completen los análisis de Teachmint y Alexia Suite).*
