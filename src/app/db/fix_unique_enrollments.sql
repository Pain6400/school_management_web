-- ========================================================================
-- SCRIPT DE MIGRACIÓN: RESTRICCIÓN DE UNICIDAD PARA INSCRIPCIÓN DE CLASES
-- Motor: PostgreSQL
-- ========================================================================

-- PASO 1: Limpiar duplicados existentes en class_enrollments (si ya se crearon registros repetidos)
-- Se conserva el registro más antiguo (menor ID) y se eliminan las repeticiones
DELETE FROM public.class_enrollments a
USING public.class_enrollments b
WHERE a.id > b.id
  AND a.student_id = b.student_id
  AND a.class_code = b.class_code
  AND a.school_code = b.school_code;

-- PASO 2: Eliminar restricciones previas con el mismo nombre si existían
ALTER TABLE public.class_enrollments 
DROP CONSTRAINT IF EXISTS class_enrollments_student_id_class_code_school_code_key;

ALTER TABLE public.class_enrollments 
DROP CONSTRAINT IF EXISTS uq_class_enrollment_student_class_school;

-- PASO 3: Agregar la restricción UNIQUE definitiva
ALTER TABLE public.class_enrollments
ADD CONSTRAINT uq_class_enrollment_student_class_school
UNIQUE (student_id, class_code, school_code);

-- ========================================================================
-- PASO 4 (OPCIONAL RECOMENDADO): Restricción de unicidad para matrícula anual
-- Evita que el mismo alumno se matricule dos veces en el mismo ciclo escolar
-- ========================================================================
DELETE FROM public.student_enrollments a
USING public.student_enrollments b
WHERE a.id > b.id
  AND a.student_id = b.student_id
  AND a.academic_year_id = b.academic_year_id
  AND a.school_code = b.school_code;

ALTER TABLE public.student_enrollments 
DROP CONSTRAINT IF EXISTS student_enrollments_student_id_academic_year_id_key;

ALTER TABLE public.student_enrollments 
DROP CONSTRAINT IF EXISTS uq_student_enrollment_student_year_school;

ALTER TABLE public.student_enrollments
ADD CONSTRAINT uq_student_enrollment_student_year_school
UNIQUE (student_id, academic_year_id, school_code);
