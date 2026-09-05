--
-- PostgreSQL database dump
--

\restrict SiNOaNxFYJI6OhBfXxXdzychBPfJD5zWcuk461unoNEHS6Q43gdREcBtF38m38T

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2025-12-10 21:38:11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 35792)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 5663 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 220 (class 1259 OID 35830)
-- Name: academic_periods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.academic_periods (
    id integer NOT NULL,
    academic_year_id integer,
    school_code character varying(20),
    name character varying(50) NOT NULL,
    code character varying(20) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    weight numeric(5,2) DEFAULT 100.00,
    status character varying(20) DEFAULT 'ACTIVE'::character varying,
    CONSTRAINT chk_academic_period_dates CHECK ((start_date < end_date)),
    CONSTRAINT chk_academic_period_status CHECK (((status)::text = ANY (ARRAY[('ACTIVE'::character varying)::text, ('INACTIVE'::character varying)::text, ('COMPLETED'::character varying)::text]))),
    CONSTRAINT chk_academic_period_weight CHECK (((weight >= (0)::numeric) AND (weight <= (100)::numeric)))
);


ALTER TABLE public.academic_periods OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 35843)
-- Name: academic_periods_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.academic_periods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.academic_periods_id_seq OWNER TO postgres;

--
-- TOC entry 5664 (class 0 OID 0)
-- Dependencies: 221
-- Name: academic_periods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.academic_periods_id_seq OWNED BY public.academic_periods.id;


--
-- TOC entry 222 (class 1259 OID 35844)
-- Name: academic_years; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.academic_years (
    id integer NOT NULL,
    school_code character varying(20),
    year_code integer,
    name character varying(50) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_current boolean DEFAULT false,
    status boolean DEFAULT true,
    CONSTRAINT chk_academic_year_dates CHECK ((start_date < end_date))
);


ALTER TABLE public.academic_years OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 35855)
-- Name: academic_years_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.academic_years_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.academic_years_id_seq OWNER TO postgres;

--
-- TOC entry 5665 (class 0 OID 0)
-- Dependencies: 223
-- Name: academic_years_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.academic_years_id_seq OWNED BY public.academic_years.id;


--
-- TOC entry 224 (class 1259 OID 35856)
-- Name: announcement_recipients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.announcement_recipients (
    id integer NOT NULL,
    announcement_id uuid,
    user_id uuid,
    read_at timestamp with time zone
);


ALTER TABLE public.announcement_recipients OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 35860)
-- Name: announcement_recipients_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.announcement_recipients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.announcement_recipients_id_seq OWNER TO postgres;

--
-- TOC entry 5666 (class 0 OID 0)
-- Dependencies: 225
-- Name: announcement_recipients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.announcement_recipients_id_seq OWNED BY public.announcement_recipients.id;


--
-- TOC entry 226 (class 1259 OID 35861)
-- Name: announcements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.announcements (
    public_id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_code character varying(20),
    title character varying(200) NOT NULL,
    content text NOT NULL,
    target_audience character varying(20) DEFAULT 'ALL'::character varying,
    priority character varying(10) DEFAULT 'NORMAL'::character varying,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    is_published boolean DEFAULT false,
    user_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_announcement_audience CHECK (((target_audience)::text = ANY (ARRAY[('ALL'::character varying)::text, ('STUDENTS'::character varying)::text, ('TEACHERS'::character varying)::text, ('PARENTS'::character varying)::text, ('STAFF'::character varying)::text]))),
    CONSTRAINT chk_announcement_dates CHECK ((start_date <= end_date)),
    CONSTRAINT chk_announcement_priority CHECK (((priority)::text = ANY (ARRAY[('LOW'::character varying)::text, ('NORMAL'::character varying)::text, ('HIGH'::character varying)::text, ('URGENT'::character varying)::text])))
);


ALTER TABLE public.announcements OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 35879)
-- Name: assignment_files; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assignment_files (
    id integer NOT NULL,
    submission_id integer,
    filename character varying(255) NOT NULL,
    file_url character varying(500) NOT NULL,
    file_type character varying(50),
    file_size integer,
    uploaded_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.assignment_files OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 35888)
-- Name: assignment_files_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assignment_files_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assignment_files_id_seq OWNER TO postgres;

--
-- TOC entry 5667 (class 0 OID 0)
-- Dependencies: 228
-- Name: assignment_files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assignment_files_id_seq OWNED BY public.assignment_files.id;


--
-- TOC entry 229 (class 1259 OID 35889)
-- Name: assignment_submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assignment_submissions (
    id integer NOT NULL,
    assignment_id integer,
    student_id uuid,
    score numeric(5,2),
    submitted_at timestamp with time zone,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    feedback text,
    graded_by uuid,
    graded_at timestamp with time zone,
    CONSTRAINT chk_submission_dates CHECK (((submitted_at IS NULL) OR (submitted_at <= CURRENT_TIMESTAMP))),
    CONSTRAINT chk_submission_score CHECK (((score >= (0)::numeric) AND (score <= (100)::numeric))),
    CONSTRAINT chk_submission_status CHECK (((status)::text = ANY (ARRAY[('PENDING'::character varying)::text, ('SUBMITTED'::character varying)::text, ('LATE'::character varying)::text, ('GRADED'::character varying)::text, ('EXCUSED'::character varying)::text])))
);


ALTER TABLE public.assignment_submissions OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 35899)
-- Name: assignment_submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assignment_submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assignment_submissions_id_seq OWNER TO postgres;

--
-- TOC entry 5668 (class 0 OID 0)
-- Dependencies: 230
-- Name: assignment_submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assignment_submissions_id_seq OWNED BY public.assignment_submissions.id;


--
-- TOC entry 231 (class 1259 OID 35900)
-- Name: assignment_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assignment_types (
    id integer NOT NULL,
    school_code character varying(20),
    code character varying(20) NOT NULL,
    name character varying(50) NOT NULL,
    weight numeric(5,2) DEFAULT 100,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid
);


ALTER TABLE public.assignment_types OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 35910)
-- Name: assignment_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assignment_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assignment_types_id_seq OWNER TO postgres;

--
-- TOC entry 5669 (class 0 OID 0)
-- Dependencies: 232
-- Name: assignment_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assignment_types_id_seq OWNED BY public.assignment_types.id;


--
-- TOC entry 233 (class 1259 OID 35911)
-- Name: assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assignments (
    id integer NOT NULL,
    class_code character varying(50),
    school_code character varying(20),
    type_id integer,
    title character varying(200) NOT NULL,
    description text,
    instructions text,
    max_score numeric(5,2) DEFAULT 100,
    due_date timestamp with time zone NOT NULL,
    assigned_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'ACTIVE'::character varying,
    user_id uuid,
    updated_at timestamp with time zone,
    updated_by uuid,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_assignments_max_score CHECK (((max_score >= (0)::numeric) AND (max_score <= 100.00))),
    CONSTRAINT chk_assignments_status CHECK (((status)::text = ANY (ARRAY[('DRAFT'::character varying)::text, ('ACTIVE'::character varying)::text, ('CLOSED'::character varying)::text, ('CANCELLED'::character varying)::text])))
);


ALTER TABLE public.assignments OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 35924)
-- Name: assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assignments_id_seq OWNER TO postgres;

--
-- TOC entry 5670 (class 0 OID 0)
-- Dependencies: 234
-- Name: assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assignments_id_seq OWNED BY public.assignments.id;


--
-- TOC entry 235 (class 1259 OID 35925)
-- Name: attendance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance (
    student_id uuid NOT NULL,
    class_code character varying(50) NOT NULL,
    school_code character varying(20) NOT NULL,
    date date NOT NULL,
    status character varying(10) NOT NULL,
    recorded_by uuid,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT attendance_status_check CHECK (((status)::text = ANY (ARRAY[('PRESENT'::character varying)::text, ('ABSENT'::character varying)::text, ('LATE'::character varying)::text, ('EXCUSED'::character varying)::text]))),
    CONSTRAINT chk_attendance_date CHECK ((date <= CURRENT_DATE))
);


ALTER TABLE public.attendance OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 35938)
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    user_id uuid,
    action character varying(50) NOT NULL,
    table_name character varying(50) NOT NULL,
    record_id integer,
    old_values jsonb,
    new_values jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    school_code character varying(20)
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 35947)
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO postgres;

--
-- TOC entry 5671 (class 0 OID 0)
-- Dependencies: 237
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- TOC entry 238 (class 1259 OID 35948)
-- Name: class_enrollments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.class_enrollments (
    id integer NOT NULL,
    student_id uuid,
    class_code character varying(50),
    school_code character varying(20),
    enrollment_date date DEFAULT CURRENT_DATE,
    status character varying(20) DEFAULT 'ACTIVE'::character varying,
    final_grade numeric(5,2)
);


ALTER TABLE public.class_enrollments OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 35954)
-- Name: class_enrollments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.class_enrollments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.class_enrollments_id_seq OWNER TO postgres;

--
-- TOC entry 5672 (class 0 OID 0)
-- Dependencies: 239
-- Name: class_enrollments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.class_enrollments_id_seq OWNED BY public.class_enrollments.id;


--
-- TOC entry 240 (class 1259 OID 35955)
-- Name: classes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.classes (
    code character varying(50) NOT NULL,
    school_code character varying(20) NOT NULL,
    academic_year_id integer,
    course_code character varying(20),
    grade_code character varying(10),
    classroom_code character varying(20),
    teacher_id uuid,
    name character varying(100) NOT NULL,
    schedule jsonb NOT NULL,
    max_students integer,
    status character varying(20) DEFAULT 'ACTIVE'::character varying,
    updated_at timestamp with time zone,
    updated_by uuid,
    deleted_at timestamp with time zone
);


ALTER TABLE public.classes OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 35965)
-- Name: classrooms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.classrooms (
    code character varying(20) NOT NULL,
    school_code character varying(20) NOT NULL,
    name character varying(50),
    capacity integer NOT NULL,
    location character varying(100),
    equipment text[],
    description text,
    status boolean DEFAULT true
);


ALTER TABLE public.classrooms OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 35974)
-- Name: courses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.courses (
    code character varying(20) NOT NULL,
    school_code character varying(20) NOT NULL,
    grade_code character varying(10),
    name character varying(100) NOT NULL,
    description text,
    credits integer DEFAULT 1,
    status boolean DEFAULT true
);


ALTER TABLE public.courses OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 35984)
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    public_id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_code character varying(20),
    filename character varying(255) NOT NULL,
    original_filename character varying(255) NOT NULL,
    file_url character varying(500) NOT NULL,
    file_type character varying(50),
    file_size integer,
    description text,
    category character varying(50),
    uploaded_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone,
    updated_by uuid,
    deleted_at timestamp with time zone,
    assignment_id integer,
    assignment_submission_id integer NOT NULL,
    document_type character varying(50) DEFAULT 'ASSIGNMENT_FILE'::character varying NOT NULL,
    is_teacher_upload boolean DEFAULT false,
    display_order integer DEFAULT 0,
    version integer DEFAULT 1,
    CONSTRAINT chk_document_entity CHECK ((assignment_submission_id IS NOT NULL)),
    CONSTRAINT chk_document_type CHECK (((document_type)::text = ANY (ARRAY[('SUBMISSION_FILE'::character varying)::text, ('FEEDBACK_FILE'::character varying)::text, ('INSTRUCTION_FILE'::character varying)::text])))
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 36003)
-- Name: employee_salaries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_salaries (
    id integer NOT NULL,
    employee_id uuid,
    school_code character varying(20),
    base_salary numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'HNL'::character varying,
    pay_frequency character varying(20),
    bank_account character varying(50),
    start_date date NOT NULL,
    end_date date,
    status character varying(20) DEFAULT 'ACTIVE'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.employee_salaries OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 36012)
-- Name: employee_salaries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_salaries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_salaries_id_seq OWNER TO postgres;

--
-- TOC entry 5673 (class 0 OID 0)
-- Dependencies: 245
-- Name: employee_salaries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_salaries_id_seq OWNED BY public.employee_salaries.id;


--
-- TOC entry 246 (class 1259 OID 36013)
-- Name: family_relationships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.family_relationships (
    student_id uuid NOT NULL,
    parent_id uuid NOT NULL,
    relationship character varying(20) NOT NULL,
    is_primary boolean DEFAULT false,
    can_view_grades boolean DEFAULT true,
    can_receive_notifications boolean DEFAULT true,
    CONSTRAINT family_relationships_relationship_check CHECK (((relationship)::text = ANY (ARRAY[('FATHER'::character varying)::text, ('MOTHER'::character varying)::text, ('GUARDIAN'::character varying)::text, ('OTHER'::character varying)::text])))
);


ALTER TABLE public.family_relationships OWNER TO postgres;

--
-- TOC entry 247 (class 1259 OID 36023)
-- Name: grades; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.grades (
    code character varying(10) NOT NULL,
    school_code character varying(20) NOT NULL,
    name character varying(50) NOT NULL,
    level integer NOT NULL,
    description text
);


ALTER TABLE public.grades OWNER TO postgres;

--
-- TOC entry 248 (class 1259 OID 36032)
-- Name: grades_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.grades_records (
    id integer NOT NULL,
    student_id uuid,
    assignment_id integer,
    score numeric(5,2),
    comments text,
    recorded_by uuid,
    recorded_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_grade_score CHECK (((score >= (0)::numeric) AND (score <= (100)::numeric)))
);


ALTER TABLE public.grades_records OWNER TO postgres;

--
-- TOC entry 249 (class 1259 OID 36040)
-- Name: grades_records_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.grades_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.grades_records_id_seq OWNER TO postgres;

--
-- TOC entry 5674 (class 0 OID 0)
-- Dependencies: 249
-- Name: grades_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.grades_records_id_seq OWNED BY public.grades_records.id;


--
-- TOC entry 250 (class 1259 OID 36041)
-- Name: inventory_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory_items (
    id integer NOT NULL,
    school_code character varying(20),
    name character varying(100) NOT NULL,
    category character varying(50),
    quantity integer DEFAULT 0,
    min_stock_level integer DEFAULT 0,
    unit_price numeric(10,2),
    location character varying(100),
    notes text,
    status character varying(20) DEFAULT 'ACTIVE'::character varying
);


ALTER TABLE public.inventory_items OWNER TO postgres;

--
-- TOC entry 251 (class 1259 OID 36051)
-- Name: inventory_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inventory_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_items_id_seq OWNER TO postgres;

--
-- TOC entry 5675 (class 0 OID 0)
-- Dependencies: 251
-- Name: inventory_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventory_items_id_seq OWNED BY public.inventory_items.id;


--
-- TOC entry 252 (class 1259 OID 36052)
-- Name: inventory_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory_transactions (
    id integer NOT NULL,
    item_id integer,
    school_code character varying(20),
    transaction_type character varying(20),
    quantity integer NOT NULL,
    reason character varying(100),
    performed_by uuid,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.inventory_transactions OWNER TO postgres;

--
-- TOC entry 253 (class 1259 OID 36060)
-- Name: inventory_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inventory_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_transactions_id_seq OWNER TO postgres;

--
-- TOC entry 5676 (class 0 OID 0)
-- Dependencies: 253
-- Name: inventory_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventory_transactions_id_seq OWNED BY public.inventory_transactions.id;


--
-- TOC entry 254 (class 1259 OID 36061)
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoice_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid,
    concept_id integer,
    description character varying(255),
    amount numeric(15,2) NOT NULL
);


ALTER TABLE public.invoice_items OWNER TO postgres;

--
-- TOC entry 255 (class 1259 OID 36067)
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_code character varying(20) NOT NULL,
    student_id uuid NOT NULL,
    invoice_number character varying(50) NOT NULL,
    total_amount numeric(15,2) NOT NULL,
    balance_due numeric(15,2) NOT NULL,
    status character varying(20) DEFAULT 'UNPAID'::character varying,
    due_date date NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT chk_invoice_amounts CHECK (((total_amount >= (0)::numeric) AND (balance_due >= (0)::numeric) AND (balance_due <= total_amount))),
    CONSTRAINT chk_invoice_status CHECK (((status)::text = ANY (ARRAY[('DRAFT'::character varying)::text, ('UNPAID'::character varying)::text, ('PARTIAL'::character varying)::text, ('PAID'::character varying)::text, ('OVERDUE'::character varying)::text, ('CANCELLED'::character varying)::text])))
);


ALTER TABLE public.invoices OWNER TO postgres;

--
-- TOC entry 256 (class 1259 OID 36082)
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    sender_id uuid,
    receiver_id uuid,
    subject character varying(200),
    content text NOT NULL,
    message_type character varying(20) DEFAULT 'GENERAL'::character varying,
    is_read boolean DEFAULT false,
    parent_message_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone,
    updated_by uuid,
    deleted_at timestamp with time zone
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- TOC entry 257 (class 1259 OID 36092)
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO postgres;

--
-- TOC entry 5677 (class 0 OID 0)
-- Dependencies: 257
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- TOC entry 258 (class 1259 OID 36093)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    school_code character varying(20),
    user_id uuid,
    title character varying(200) NOT NULL,
    message text NOT NULL,
    type character varying(50),
    entity_type character varying(50),
    entity_id integer,
    is_read boolean DEFAULT false,
    action_url character varying(500),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- TOC entry 259 (class 1259 OID 36103)
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- TOC entry 5678 (class 0 OID 0)
-- Dependencies: 259
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- TOC entry 260 (class 1259 OID 36104)
-- Name: payment_concepts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_concepts (
    id integer NOT NULL,
    school_code character varying(20),
    code character varying(20) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    default_amount numeric(10,2) NOT NULL,
    is_recurring boolean DEFAULT false,
    recurrence_pattern character varying(20),
    status boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid
);


ALTER TABLE public.payment_concepts OWNER TO postgres;

--
-- TOC entry 261 (class 1259 OID 36116)
-- Name: payment_concepts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payment_concepts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_concepts_id_seq OWNER TO postgres;

--
-- TOC entry 5679 (class 0 OID 0)
-- Dependencies: 261
-- Name: payment_concepts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payment_concepts_id_seq OWNED BY public.payment_concepts.id;


--
-- TOC entry 262 (class 1259 OID 36117)
-- Name: payment_methods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_methods (
    id integer NOT NULL,
    school_code character varying(20),
    code character varying(20) NOT NULL,
    name character varying(100) NOT NULL,
    type character varying(20),
    is_active boolean DEFAULT true,
    config jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid
);


ALTER TABLE public.payment_methods OWNER TO postgres;

--
-- TOC entry 263 (class 1259 OID 36127)
-- Name: payment_methods_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payment_methods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_methods_id_seq OWNER TO postgres;

--
-- TOC entry 5680 (class 0 OID 0)
-- Dependencies: 263
-- Name: payment_methods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payment_methods_id_seq OWNED BY public.payment_methods.id;


--
-- TOC entry 264 (class 1259 OID 36128)
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_code character varying(20) NOT NULL,
    invoice_id uuid,
    amount_paid numeric(15,2) NOT NULL,
    payment_method_id integer,
    transaction_reference character varying(100),
    paid_at timestamp without time zone DEFAULT now(),
    CONSTRAINT chk_payment_amount CHECK ((amount_paid > (0)::numeric))
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- TOC entry 265 (class 1259 OID 36137)
-- Name: payroll_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payroll_records (
    id integer NOT NULL,
    employee_id uuid,
    school_code character varying(20),
    pay_period_start date NOT NULL,
    pay_period_end date NOT NULL,
    gross_salary numeric(10,2),
    deductions numeric(10,2),
    net_salary numeric(10,2),
    payment_date date,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.payroll_records OWNER TO postgres;

--
-- TOC entry 266 (class 1259 OID 36145)
-- Name: payroll_records_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payroll_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payroll_records_id_seq OWNER TO postgres;

--
-- TOC entry 5681 (class 0 OID 0)
-- Dependencies: 266
-- Name: payroll_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payroll_records_id_seq OWNED BY public.payroll_records.id;


--
-- TOC entry 267 (class 1259 OID 36146)
-- Name: plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.plans (
    code character varying(20) NOT NULL,
    name character varying(50) NOT NULL,
    description character varying(250),
    price numeric(10,2) NOT NULL,
    duration_days integer NOT NULL,
    max_students integer NOT NULL,
    max_teachers integer NOT NULL,
    max_storage_mb integer DEFAULT 1024,
    features text[],
    status boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


ALTER TABLE public.plans OWNER TO postgres;

--
-- TOC entry 5682 (class 0 OID 0)
-- Dependencies: 267
-- Name: TABLE plans; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.plans IS 'Tabla de planes de suscripción para escuelas';


--
-- TOC entry 268 (class 1259 OID 36160)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    permissions jsonb NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 269 (class 1259 OID 36169)
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- TOC entry 5683 (class 0 OID 0)
-- Dependencies: 269
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- TOC entry 281 (class 1259 OID 40966)
-- Name: school_configs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.school_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    subdomain character varying(100),
    custom_domain character varying(100),
    logo_url character varying(500),
    website character varying(100),
    primary_color character varying(20) DEFAULT '#3B82F6'::character varying,
    secondary_color character varying(20) DEFAULT '#1E40AF'::character varying,
    accent_color character varying(20) DEFAULT '#10B981'::character varying,
    timezone character varying(50) DEFAULT 'America/Tegucigalpa'::character varying,
    language character varying(10) DEFAULT 'es'::character varying,
    date_format character varying(20) DEFAULT 'DD/MM/YYYY'::character varying,
    time_format character varying(10) DEFAULT '24h'::character varying,
    currency character varying(3) DEFAULT 'HNL'::character varying,
    allowed_file_types text[] DEFAULT ARRAY['pdf'::text, 'doc'::text, 'docx'::text, 'jpg'::text, 'png'::text, 'jpeg'::text],
    max_file_size_mb integer DEFAULT 10,
    session_timeout_minutes integer DEFAULT 30,
    email_notifications_enabled boolean DEFAULT true,
    push_notifications_enabled boolean DEFAULT true,
    sms_notifications_enabled boolean DEFAULT false,
    maintenance_mode boolean DEFAULT false,
    maintenance_message text,
    custom_css text,
    custom_js text,
    meta_title character varying(200),
    meta_description text,
    meta_keywords text[],
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone,
    updated_by uuid,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_domain_required CHECK ((((subdomain IS NOT NULL) AND (custom_domain IS NULL)) OR ((subdomain IS NULL) AND (custom_domain IS NOT NULL)) OR ((subdomain IS NOT NULL) AND (custom_domain IS NOT NULL)))),
    CONSTRAINT chk_language CHECK (((language)::text = ANY (ARRAY[('es'::character varying)::text, ('en'::character varying)::text]))),
    CONSTRAINT chk_max_file_size CHECK (((max_file_size_mb >= 1) AND (max_file_size_mb <= 100))),
    CONSTRAINT chk_time_format CHECK (((time_format)::text = ANY (ARRAY[('12h'::character varying)::text, ('24h'::character varying)::text])))
);


ALTER TABLE public.school_configs OWNER TO postgres;

--
-- TOC entry 5684 (class 0 OID 0)
-- Dependencies: 281
-- Name: TABLE school_configs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.school_configs IS 'Configuración personalizada para cada escuela';


--
-- TOC entry 5685 (class 0 OID 0)
-- Dependencies: 281
-- Name: COLUMN school_configs.subdomain; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.school_configs.subdomain IS 'Subdominio único para acceder a la escuela (ej: colegioamerica)';


--
-- TOC entry 5686 (class 0 OID 0)
-- Dependencies: 281
-- Name: COLUMN school_configs.custom_domain; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.school_configs.custom_domain IS 'Dominio personalizado (ej: campus.colegioamerica.edu.hn)';


--
-- TOC entry 5687 (class 0 OID 0)
-- Dependencies: 281
-- Name: COLUMN school_configs.primary_color; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.school_configs.primary_color IS 'Color principal de la marca de la escuela';


--
-- TOC entry 5688 (class 0 OID 0)
-- Dependencies: 281
-- Name: COLUMN school_configs.secondary_color; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.school_configs.secondary_color IS 'Color secundario de la marca';


--
-- TOC entry 5689 (class 0 OID 0)
-- Dependencies: 281
-- Name: COLUMN school_configs.accent_color; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.school_configs.accent_color IS 'Color de acento';


--
-- TOC entry 5690 (class 0 OID 0)
-- Dependencies: 281
-- Name: COLUMN school_configs.timezone; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.school_configs.timezone IS 'Zona horaria de la escuela';


--
-- TOC entry 5691 (class 0 OID 0)
-- Dependencies: 281
-- Name: COLUMN school_configs.language; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.school_configs.language IS 'Idioma principal de la interfaz';


--
-- TOC entry 5692 (class 0 OID 0)
-- Dependencies: 281
-- Name: COLUMN school_configs.allowed_file_types; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.school_configs.allowed_file_types IS 'Tipos de archivos permitidos para subir';


--
-- TOC entry 5693 (class 0 OID 0)
-- Dependencies: 281
-- Name: COLUMN school_configs.max_file_size_mb; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.school_configs.max_file_size_mb IS 'Tamaño máximo de archivo en MB';


--
-- TOC entry 5694 (class 0 OID 0)
-- Dependencies: 281
-- Name: COLUMN school_configs.session_timeout_minutes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.school_configs.session_timeout_minutes IS 'Tiempo de inactividad para cerrar sesión';


--
-- TOC entry 5695 (class 0 OID 0)
-- Dependencies: 281
-- Name: COLUMN school_configs.maintenance_mode; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.school_configs.maintenance_mode IS 'Modo mantenimiento activado/desactivado';


--
-- TOC entry 270 (class 1259 OID 36170)
-- Name: school_subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.school_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    plan_code character varying(20) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status character varying(20) DEFAULT 'ACTIVE'::character varying,
    payment_status character varying(20) DEFAULT 'PENDING'::character varying,
    total_amount numeric(10,2),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone
);


ALTER TABLE public.school_subscriptions OWNER TO postgres;

--
-- TOC entry 5696 (class 0 OID 0)
-- Dependencies: 270
-- Name: TABLE school_subscriptions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.school_subscriptions IS 'Historial de suscripciones de las escuelas';


--
-- TOC entry 271 (class 1259 OID 36182)
-- Name: schools; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schools (
    public_id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(20) NOT NULL,
    plan_code character varying(20) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    address text,
    phone character varying(20),
    email character varying(100),
    status boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone,
    updated_by uuid,
    deleted_at timestamp with time zone,
    subscription_status character varying(20) DEFAULT 'ACTIVE'::character varying,
    subscription_start_date date DEFAULT CURRENT_DATE,
    subscription_end_date date,
    trial_ends_at date,
    auto_renew boolean DEFAULT true
);


ALTER TABLE public.schools OWNER TO postgres;

--
-- TOC entry 5697 (class 0 OID 0)
-- Dependencies: 271
-- Name: COLUMN schools.plan_code; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.schools.plan_code IS 'Plan actual de la escuela (referencia a plans.code)';


--
-- TOC entry 5698 (class 0 OID 0)
-- Dependencies: 271
-- Name: COLUMN schools.subscription_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.schools.subscription_status IS 'Estado de la suscripción: ACTIVE, EXPIRED, CANCELLED, PENDING';


--
-- TOC entry 5699 (class 0 OID 0)
-- Dependencies: 271
-- Name: COLUMN schools.subscription_start_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.schools.subscription_start_date IS 'Fecha de inicio de la suscripción actual';


--
-- TOC entry 5700 (class 0 OID 0)
-- Dependencies: 271
-- Name: COLUMN schools.subscription_end_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.schools.subscription_end_date IS 'Fecha de fin de la suscripción actual';


--
-- TOC entry 5701 (class 0 OID 0)
-- Dependencies: 271
-- Name: COLUMN schools.trial_ends_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.schools.trial_ends_at IS 'Fecha de fin del periodo de prueba (si aplica)';


--
-- TOC entry 5702 (class 0 OID 0)
-- Dependencies: 271
-- Name: COLUMN schools.auto_renew; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.schools.auto_renew IS 'Indica si la suscripción se renueva automáticamente';


--
-- TOC entry 272 (class 1259 OID 36197)
-- Name: student_behavior; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_behavior (
    id integer NOT NULL,
    student_id uuid,
    school_code character varying(20),
    recorded_by uuid,
    behavior_type character varying(50),
    description text NOT NULL,
    points integer,
    date_occurred date NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.student_behavior OWNER TO postgres;

--
-- TOC entry 273 (class 1259 OID 36206)
-- Name: student_behavior_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.student_behavior_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.student_behavior_id_seq OWNER TO postgres;

--
-- TOC entry 5703 (class 0 OID 0)
-- Dependencies: 273
-- Name: student_behavior_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.student_behavior_id_seq OWNED BY public.student_behavior.id;


--
-- TOC entry 274 (class 1259 OID 36207)
-- Name: student_enrollments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_enrollments (
    id integer NOT NULL,
    student_id uuid,
    academic_year_id integer,
    grade_code character varying(10),
    school_code character varying(20),
    enrollment_date date NOT NULL,
    status character varying(20) DEFAULT 'ACTIVE'::character varying,
    notes text
);


ALTER TABLE public.student_enrollments OWNER TO postgres;

--
-- TOC entry 275 (class 1259 OID 36215)
-- Name: student_enrollments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.student_enrollments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.student_enrollments_id_seq OWNER TO postgres;

--
-- TOC entry 5704 (class 0 OID 0)
-- Dependencies: 275
-- Name: student_enrollments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.student_enrollments_id_seq OWNED BY public.student_enrollments.id;


--
-- TOC entry 276 (class 1259 OID 36216)
-- Name: subscription_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscription_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subscription_id uuid NOT NULL,
    amount_paid numeric(10,2) NOT NULL,
    payment_method character varying(50),
    transaction_reference character varying(100),
    payment_date date NOT NULL,
    next_payment_date date,
    status character varying(20) DEFAULT 'COMPLETED'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.subscription_payments OWNER TO postgres;

--
-- TOC entry 5705 (class 0 OID 0)
-- Dependencies: 276
-- Name: TABLE subscription_payments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.subscription_payments IS 'Pagos de suscripciones de escuelas';


--
-- TOC entry 277 (class 1259 OID 36226)
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    user_id uuid NOT NULL,
    role_id integer NOT NULL,
    assigned_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- TOC entry 278 (class 1259 OID 36232)
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sessions (
    id integer NOT NULL,
    user_id uuid,
    session_token character varying(500) NOT NULL,
    ip_address inet,
    user_agent text,
    expires_at timestamp with time zone NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_session_expiry CHECK ((expires_at > created_at))
);


ALTER TABLE public.user_sessions OWNER TO postgres;

--
-- TOC entry 279 (class 1259 OID 36243)
-- Name: user_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_sessions_id_seq OWNER TO postgres;

--
-- TOC entry 5706 (class 0 OID 0)
-- Dependencies: 279
-- Name: user_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_sessions_id_seq OWNED BY public.user_sessions.id;


--
-- TOC entry 280 (class 1259 OID 36244)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    public_id uuid DEFAULT gen_random_uuid() NOT NULL,
    identity_number character varying(20) NOT NULL,
    school_code character varying(20),
    user_code character varying(50) NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL,
    phone character varying(20),
    date_of_birth date,
    gender character varying(10),
    address text,
    profile_picture character varying(500),
    emergency_contact jsonb,
    status boolean DEFAULT true,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone,
    updated_by uuid,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_user_age CHECK (((date_of_birth IS NULL) OR (date_of_birth <= (CURRENT_DATE - '4 years'::interval))))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 5071 (class 2604 OID 36261)
-- Name: academic_periods id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.academic_periods ALTER COLUMN id SET DEFAULT nextval('public.academic_periods_id_seq'::regclass);


--
-- TOC entry 5074 (class 2604 OID 36262)
-- Name: academic_years id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.academic_years ALTER COLUMN id SET DEFAULT nextval('public.academic_years_id_seq'::regclass);


--
-- TOC entry 5077 (class 2604 OID 36263)
-- Name: announcement_recipients id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcement_recipients ALTER COLUMN id SET DEFAULT nextval('public.announcement_recipients_id_seq'::regclass);


--
-- TOC entry 5083 (class 2604 OID 36264)
-- Name: assignment_files id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_files ALTER COLUMN id SET DEFAULT nextval('public.assignment_files_id_seq'::regclass);


--
-- TOC entry 5085 (class 2604 OID 36265)
-- Name: assignment_submissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_submissions ALTER COLUMN id SET DEFAULT nextval('public.assignment_submissions_id_seq'::regclass);


--
-- TOC entry 5087 (class 2604 OID 36266)
-- Name: assignment_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_types ALTER COLUMN id SET DEFAULT nextval('public.assignment_types_id_seq'::regclass);


--
-- TOC entry 5090 (class 2604 OID 36267)
-- Name: assignments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments ALTER COLUMN id SET DEFAULT nextval('public.assignments_id_seq'::regclass);


--
-- TOC entry 5095 (class 2604 OID 36268)
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- TOC entry 5097 (class 2604 OID 36269)
-- Name: class_enrollments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.class_enrollments ALTER COLUMN id SET DEFAULT nextval('public.class_enrollments_id_seq'::regclass);


--
-- TOC entry 5110 (class 2604 OID 36270)
-- Name: employee_salaries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_salaries ALTER COLUMN id SET DEFAULT nextval('public.employee_salaries_id_seq'::regclass);


--
-- TOC entry 5117 (class 2604 OID 36271)
-- Name: grades_records id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grades_records ALTER COLUMN id SET DEFAULT nextval('public.grades_records_id_seq'::regclass);


--
-- TOC entry 5119 (class 2604 OID 36272)
-- Name: inventory_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_items ALTER COLUMN id SET DEFAULT nextval('public.inventory_items_id_seq'::regclass);


--
-- TOC entry 5123 (class 2604 OID 36273)
-- Name: inventory_transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_transactions ALTER COLUMN id SET DEFAULT nextval('public.inventory_transactions_id_seq'::regclass);


--
-- TOC entry 5129 (class 2604 OID 36274)
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- TOC entry 5133 (class 2604 OID 36275)
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- TOC entry 5136 (class 2604 OID 36276)
-- Name: payment_concepts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_concepts ALTER COLUMN id SET DEFAULT nextval('public.payment_concepts_id_seq'::regclass);


--
-- TOC entry 5140 (class 2604 OID 36277)
-- Name: payment_methods id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_methods ALTER COLUMN id SET DEFAULT nextval('public.payment_methods_id_seq'::regclass);


--
-- TOC entry 5145 (class 2604 OID 36278)
-- Name: payroll_records id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_records ALTER COLUMN id SET DEFAULT nextval('public.payroll_records_id_seq'::regclass);


--
-- TOC entry 5151 (class 2604 OID 36279)
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- TOC entry 5162 (class 2604 OID 36280)
-- Name: student_behavior id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_behavior ALTER COLUMN id SET DEFAULT nextval('public.student_behavior_id_seq'::regclass);


--
-- TOC entry 5164 (class 2604 OID 36281)
-- Name: student_enrollments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_enrollments ALTER COLUMN id SET DEFAULT nextval('public.student_enrollments_id_seq'::regclass);


--
-- TOC entry 5170 (class 2604 OID 36282)
-- Name: user_sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions ALTER COLUMN id SET DEFAULT nextval('public.user_sessions_id_seq'::regclass);


--
-- TOC entry 5596 (class 0 OID 35830)
-- Dependencies: 220
-- Data for Name: academic_periods; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.academic_periods (id, academic_year_id, school_code, name, code, start_date, end_date, weight, status) FROM stdin;
1	1	ESC001	Primer Trimestre	T1	2024-01-15	2024-04-15	33.33	ACTIVE
2	1	ESC001	Segundo Trimestre	T2	2024-04-16	2024-08-15	33.33	ACTIVE
3	1	ESC001	Tercer Trimestre	T3	2024-08-16	2024-11-30	33.34	ACTIVE
\.


--
-- TOC entry 5598 (class 0 OID 35844)
-- Dependencies: 222
-- Data for Name: academic_years; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.academic_years (id, school_code, year_code, name, start_date, end_date, is_current, status) FROM stdin;
1	ESC001	2024	Año Escolar 2024	2024-01-15	2024-11-30	t	t
2	ESC001	2023	Año Escolar 2023	2023-01-15	2023-11-30	f	t
3	ESC002	2024	Ciclo Lectivo 2024	2024-02-01	2024-11-20	t	t
\.


--
-- TOC entry 5600 (class 0 OID 35856)
-- Dependencies: 224
-- Data for Name: announcement_recipients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.announcement_recipients (id, announcement_id, user_id, read_at) FROM stdin;
\.


--
-- TOC entry 5602 (class 0 OID 35861)
-- Dependencies: 226
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.announcements (public_id, school_code, title, content, target_audience, priority, start_date, end_date, is_published, user_id, created_at) FROM stdin;
3417bff8-bc63-44ca-9d0b-fbb009a9c5ac	ESC001	Inicio del Año Escolar 2024	Les damos la bienvenida al nuevo año escolar 2024. Las clases inician el 15 de enero.	ALL	HIGH	2024-01-10 02:00:00-06	2024-01-20 17:59:59-06	t	341c5705-f13a-47b4-9cec-f81fc2fc20a8	2025-11-26 14:22:52.696384-06
\.


--
-- TOC entry 5603 (class 0 OID 35879)
-- Dependencies: 227
-- Data for Name: assignment_files; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assignment_files (id, submission_id, filename, file_url, file_type, file_size, uploaded_at) FROM stdin;
\.


--
-- TOC entry 5605 (class 0 OID 35889)
-- Dependencies: 229
-- Data for Name: assignment_submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assignment_submissions (id, assignment_id, student_id, score, submitted_at, status, feedback, graded_by, graded_at) FROM stdin;
1	1	27d777b7-f9d4-4d2f-b95d-179ee351438f	87.50	2024-02-19 18:00:00-06	GRADED	Buen trabajo, revisar procedimiento en problema 5	c325de39-986e-42bf-8da1-185bf4ef8696	\N
\.


--
-- TOC entry 5607 (class 0 OID 35900)
-- Dependencies: 231
-- Data for Name: assignment_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assignment_types (id, school_code, code, name, weight, description, created_at, created_by) FROM stdin;
1	ESC001	EXAMEN	Examen	40.00	Evaluación escrita formal	2025-11-27 20:20:37.93934-06	\N
2	ESC001	TAREA	Tarea	20.00	Tareas para casa	2025-11-27 20:20:37.93934-06	\N
3	ESC001	PROYECTO	Proyecto	30.00	Proyectos prácticos	2025-11-27 20:20:37.93934-06	\N
4	ESC001	PARTICIPACION	Participación	10.00	Participación en clase	2025-11-27 20:20:37.93934-06	\N
\.


--
-- TOC entry 5609 (class 0 OID 35911)
-- Dependencies: 233
-- Data for Name: assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assignments (id, class_code, school_code, type_id, title, description, instructions, max_score, due_date, assigned_date, status, user_id, updated_at, updated_by, deleted_at) FROM stdin;
1	MAT1-A-2024	ESC001	2	Sumas y Restas Básicas	Práctica de operaciones matemáticas básicas	Resolver todos los problemas mostrando el procedimiento	100.00	2024-02-20 18:00:00-06	2025-11-26 14:22:52.696384-06	ACTIVE	c325de39-986e-42bf-8da1-185bf4ef8696	\N	\N	\N
2	MAT1-A-2024	ESC001	1	Examen Parcial Matemáticas	Evaluación de los primeros 3 temas	No se permite uso de calculadora	100.00	2024-03-15 18:00:00-06	2025-11-26 14:22:52.696384-06	ACTIVE	c325de39-986e-42bf-8da1-185bf4ef8696	\N	\N	\N
\.


--
-- TOC entry 5611 (class 0 OID 35925)
-- Dependencies: 235
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance (student_id, class_code, school_code, date, status, recorded_by, notes, created_at) FROM stdin;
27d777b7-f9d4-4d2f-b95d-179ee351438f	MAT1-A-2024	ESC001	2024-02-01	PRESENT	c325de39-986e-42bf-8da1-185bf4ef8696	\N	2025-11-26 14:22:52.696384-06
131b3510-ee31-4f6f-a9cd-7f391e661ecf	MAT1-A-2024	ESC001	2024-02-01	ABSENT	c325de39-986e-42bf-8da1-185bf4ef8696	Enfermedad	2025-11-26 14:22:52.696384-06
bdda5776-61c7-474e-85b3-ea84501fc000	MAT1-A-2024	ESC001	2024-02-01	LATE	c325de39-986e-42bf-8da1-185bf4ef8696	Llegó 15 minutos tarde	2025-11-26 14:22:52.696384-06
\.


--
-- TOC entry 5612 (class 0 OID 35938)
-- Dependencies: 236
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent, created_at, school_code) FROM stdin;
\.


--
-- TOC entry 5614 (class 0 OID 35948)
-- Dependencies: 238
-- Data for Name: class_enrollments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.class_enrollments (id, student_id, class_code, school_code, enrollment_date, status, final_grade) FROM stdin;
1	27d777b7-f9d4-4d2f-b95d-179ee351438f	MAT1-A-2024	ESC001	2024-01-15	ACTIVE	\N
2	131b3510-ee31-4f6f-a9cd-7f391e661ecf	MAT1-A-2024	ESC001	2024-01-15	ACTIVE	\N
3	bdda5776-61c7-474e-85b3-ea84501fc000	MAT1-A-2024	ESC001	2024-01-15	ACTIVE	\N
4	27d777b7-f9d4-4d2f-b95d-179ee351438f	ESP1-A-2024	ESC001	2024-01-15	ACTIVE	\N
5	131b3510-ee31-4f6f-a9cd-7f391e661ecf	ESP1-A-2024	ESC001	2024-01-15	ACTIVE	\N
6	bdda5776-61c7-474e-85b3-ea84501fc000	ESP1-A-2024	ESC001	2024-01-15	ACTIVE	\N
\.


--
-- TOC entry 5616 (class 0 OID 35955)
-- Dependencies: 240
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.classes (code, school_code, academic_year_id, course_code, grade_code, classroom_code, teacher_id, name, schedule, max_students, status, updated_at, updated_by, deleted_at) FROM stdin;
MAT1-A-2024	ESC001	1	MAT-1RO	1RO	A101	c325de39-986e-42bf-8da1-185bf4ef8696	Matemáticas 1A	{"days": ["LUNES", "MIERCOLES", "VIERNES"], "end_time": "09:00", "start_time": "08:00"}	25	ACTIVE	\N	\N	\N
ESP1-A-2024	ESC001	1	ESP-1RO	1RO	A101	5128aedd-0fcf-4319-accf-b59fe187c705	Español 1A	{"days": ["MARTES", "JUEVES"], "end_time": "09:30", "start_time": "08:00"}	25	ACTIVE	\N	\N	\N
\.


--
-- TOC entry 5617 (class 0 OID 35965)
-- Dependencies: 241
-- Data for Name: classrooms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.classrooms (code, school_code, name, capacity, location, equipment, description, status) FROM stdin;
A101	ESC001	Aula 101	30	Edificio A - Primer Piso	{Pizarra,Proyector,"Aire Acondicionado"}	Aula de primaria	t
A102	ESC001	Aula 102	25	Edificio A - Primer Piso	{Pizarra,Televisor}	Aula de preescolar	t
LAB1	ESC001	Laboratorio de Ciencias	20	Edificio B - Planta Baja	{Microscopios,"Sustancias Químicas",Proyector}	Laboratorio equipado	t
\.


--
-- TOC entry 5618 (class 0 OID 35974)
-- Dependencies: 242
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.courses (code, school_code, grade_code, name, description, credits, status) FROM stdin;
MAT-1RO	ESC001	1RO	Matemáticas	Matemáticas básicas para primer grado	5	t
ESP-1RO	ESC001	1RO	Español	Lengua y literatura española	4	t
CIE-1RO	ESC001	1RO	Ciencias	Ciencias naturales	4	t
SOC-1RO	ESC001	1RO	Estudios Sociales	Historia y geografía	3	t
MAT-2DO	ESC001	2DO	Matemáticas	Matemáticas para segundo grado	5	t
\.


--
-- TOC entry 5619 (class 0 OID 35984)
-- Dependencies: 243
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (public_id, school_code, filename, original_filename, file_url, file_type, file_size, description, category, uploaded_at, updated_at, updated_by, deleted_at, assignment_id, assignment_submission_id, document_type, is_teacher_upload, display_order, version) FROM stdin;
\.


--
-- TOC entry 5620 (class 0 OID 36003)
-- Dependencies: 244
-- Data for Name: employee_salaries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_salaries (id, employee_id, school_code, base_salary, currency, pay_frequency, bank_account, start_date, end_date, status, created_at) FROM stdin;
\.


--
-- TOC entry 5622 (class 0 OID 36013)
-- Dependencies: 246
-- Data for Name: family_relationships; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.family_relationships (student_id, parent_id, relationship, is_primary, can_view_grades, can_receive_notifications) FROM stdin;
27d777b7-f9d4-4d2f-b95d-179ee351438f	9f556773-820d-4525-9f41-c955d1e2c202	MOTHER	t	t	t
131b3510-ee31-4f6f-a9cd-7f391e661ecf	fe7ff4df-10b6-46ba-abf5-559783c670a8	FATHER	t	t	t
\.


--
-- TOC entry 5623 (class 0 OID 36023)
-- Dependencies: 247
-- Data for Name: grades; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.grades (code, school_code, name, level, description) FROM stdin;
PRE	ESC001	Preescolar	0	Educación inicial
1RO	ESC001	Primer Grado	1	Primer año de primaria
2DO	ESC001	Segundo Grado	2	Segundo año de primaria
3RO	ESC001	Tercer Grado	3	Tercer año de primaria
4TO	ESC001	Cuarto Grado	4	Cuarto año de primaria
\.


--
-- TOC entry 5624 (class 0 OID 36032)
-- Dependencies: 248
-- Data for Name: grades_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.grades_records (id, student_id, assignment_id, score, comments, recorded_by, recorded_at) FROM stdin;
\.


--
-- TOC entry 5626 (class 0 OID 36041)
-- Dependencies: 250
-- Data for Name: inventory_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory_items (id, school_code, name, category, quantity, min_stock_level, unit_price, location, notes, status) FROM stdin;
\.


--
-- TOC entry 5628 (class 0 OID 36052)
-- Dependencies: 252
-- Data for Name: inventory_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory_transactions (id, item_id, school_code, transaction_type, quantity, reason, performed_by, notes, created_at) FROM stdin;
\.


--
-- TOC entry 5630 (class 0 OID 36061)
-- Dependencies: 254
-- Data for Name: invoice_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoice_items (id, invoice_id, concept_id, description, amount) FROM stdin;
9f306e57-9324-4221-a05b-0b5960b4af0a	cd29dce3-7906-4cba-8fbd-63944d28f34e	1	Matrícula Anual 2024	500.00
\.


--
-- TOC entry 5631 (class 0 OID 36067)
-- Dependencies: 255
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoices (id, school_code, student_id, invoice_number, total_amount, balance_due, status, due_date, created_at) FROM stdin;
cd29dce3-7906-4cba-8fbd-63944d28f34e	ESC001	27d777b7-f9d4-4d2f-b95d-179ee351438f	FAC-2024-001	500.00	500.00	UNPAID	2024-02-15	2025-11-26 14:22:52.696384
\.


--
-- TOC entry 5632 (class 0 OID 36082)
-- Dependencies: 256
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, sender_id, receiver_id, subject, content, message_type, is_read, parent_message_id, created_at, updated_at, updated_by, deleted_at) FROM stdin;
\.


--
-- TOC entry 5634 (class 0 OID 36093)
-- Dependencies: 258
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, school_code, user_id, title, message, type, entity_type, entity_id, is_read, action_url, created_at) FROM stdin;
\.


--
-- TOC entry 5636 (class 0 OID 36104)
-- Dependencies: 260
-- Data for Name: payment_concepts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_concepts (id, school_code, code, name, description, default_amount, is_recurring, recurrence_pattern, status, created_at, created_by) FROM stdin;
1	ESC001	MATRICULA	Matrícula Anual	Costo de matrícula para el año escolar	500.00	f	\N	t	2025-11-27 20:20:40.294304-06	\N
2	ESC001	MENSUALIDAD	Mensualidad	Pago mensual de colegiatura	150.00	t	MONTHLY	t	2025-11-27 20:20:40.294304-06	\N
3	ESC001	UNIFORME	Uniforme Escolar	Costo de uniforme completo	75.00	f	\N	t	2025-11-27 20:20:40.294304-06	\N
\.


--
-- TOC entry 5638 (class 0 OID 36117)
-- Dependencies: 262
-- Data for Name: payment_methods; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_methods (id, school_code, code, name, type, is_active, config, created_at, created_by) FROM stdin;
1	ESC001	EFECTIVO	Efectivo	CASH	t	{"requires_change": true}	2025-11-27 20:20:42.775869-06	\N
2	ESC001	TARJETA	Tarjeta de Crédito/Débito	CARD	t	{"processor": "stripelocal", "merchant_id": "12345"}	2025-11-27 20:20:42.775869-06	\N
3	ESC001	TRANSFERENCIA	Transferencia Bancaria	BANK_TRANSFER	t	{"bank_name": "BAC", "account_number": "123456789"}	2025-11-27 20:20:42.775869-06	\N
\.


--
-- TOC entry 5640 (class 0 OID 36128)
-- Dependencies: 264
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, school_code, invoice_id, amount_paid, payment_method_id, transaction_reference, paid_at) FROM stdin;
\.


--
-- TOC entry 5641 (class 0 OID 36137)
-- Dependencies: 265
-- Data for Name: payroll_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payroll_records (id, employee_id, school_code, pay_period_start, pay_period_end, gross_salary, deductions, net_salary, payment_date, status, created_at) FROM stdin;
\.


--
-- TOC entry 5643 (class 0 OID 36146)
-- Dependencies: 267
-- Data for Name: plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.plans (code, name, description, price, duration_days, max_students, max_teachers, max_storage_mb, features, status, created_at, updated_at, deleted_at) FROM stdin;
FREE	Plan Gratuito	Plan básico gratuito para escuelas pequeñas	0.00	365	50	10	1024	{"Gestión básica de estudiantes",Calificaciones,Asistencia,"Comunicaciones básicas"}	t	2025-11-26 08:21:49.738767-06	\N	\N
BASIC	Plan Básico	Plan ideal para escuelas medianas	99.99	365	200	25	5120	{"Todas las funciones del Free","Pagos en línea","Reportes avanzados","Soporte por email"}	t	2025-11-26 08:21:49.738767-06	\N	\N
PREMIUM	Plan Premium	Plan completo para instituciones grandes	299.99	365	1000	100	20480	{"Todas las funciones del Basic","Control de inventario","Nómina avanzada","Soporte prioritario 24/7","API acceso"}	t	2025-11-26 08:21:49.738767-06	\N	\N
ENTERPRISE	Plan Empresarial	Solución personalizada para grandes instituciones	599.99	365	5000	500	51200	{"Todas las funciones del Premium",Personalización,"Múltiples sedes","Soporte dedicado","Migración asistida"}	t	2025-11-26 08:21:49.738767-06	\N	\N
\.


--
-- TOC entry 5644 (class 0 OID 36160)
-- Dependencies: 268
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, code, name, description, permissions) FROM stdin;
1	SUPER_ADMIN	Super Administrador	Acceso completo al sistema	{"all": true}
2	SCHOOL_ADMIN	Administrador Escolar	Administrador de la escuela	{"academic": true, "students": true, "teachers": true, "financial": true}
3	TEACHER	Profesor	Personal docente	{"grades": true, "classes": true, "attendance": true}
4	STUDENT	Estudiante	Estudiante	{"view_grades": true, "view_attendance": true}
5	PARENT	Padre/Tutor	Padre o tutor	{"view_student_grades": true, "view_student_attendance": true}
\.


--
-- TOC entry 5657 (class 0 OID 40966)
-- Dependencies: 281
-- Data for Name: school_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.school_configs (id, school_id, subdomain, custom_domain, logo_url, website, primary_color, secondary_color, accent_color, timezone, language, date_format, time_format, currency, allowed_file_types, max_file_size_mb, session_timeout_minutes, email_notifications_enabled, push_notifications_enabled, sms_notifications_enabled, maintenance_mode, maintenance_message, custom_css, custom_js, meta_title, meta_description, meta_keywords, created_at, updated_at, updated_by, deleted_at) FROM stdin;
75c7ca49-3445-4dd6-a35d-39ad03e206c9	a81802d6-5bcd-4509-9ffe-eb2a45bae8a9	esc001	\N	\N	www.colegiosanmiguel.edu	#3B82F6	#1E40AF	#10B981	America/Tegucigalpa	es	DD/MM/YYYY	24h	HNL	{pdf,doc,docx,jpg,png,jpeg}	10	30	t	t	f	f	\N	\N	\N	\N	\N	\N	2025-11-26 14:21:23.099669-06	\N	\N	\N
b6e69fd3-c428-43f2-bead-e90e3aac871c	42aabd78-ee63-4869-9f7c-3515126f8f72	esc002	\N	\N	www.luzdelsaber.edu	#3B82F6	#1E40AF	#10B981	America/Tegucigalpa	es	DD/MM/YYYY	24h	HNL	{pdf,doc,docx,jpg,png,jpeg}	10	30	t	t	f	f	\N	\N	\N	\N	\N	\N	2025-11-26 14:21:23.099669-06	\N	\N	\N
bea302dc-a556-404b-8c16-e79ab580b44d	071a9749-1d16-4758-977a-80a3135747e0	esc003	\N	\N	\N	#3B82F6	#1E40AF	#10B981	America/Tegucigalpa	es	DD/MM/YYYY	24h	HNL	{pdf,doc,docx,jpg,png,jpeg}	10	30	t	t	f	f	\N	\N	\N	\N	\N	\N	2025-11-26 14:21:23.099669-06	\N	\N	\N
\.


--
-- TOC entry 5646 (class 0 OID 36170)
-- Dependencies: 270
-- Data for Name: school_subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.school_subscriptions (id, school_id, plan_code, start_date, end_date, status, payment_status, total_amount, created_at, updated_at) FROM stdin;
f111bbef-c510-46d8-990a-ca6bfff4524e	071a9749-1d16-4758-977a-80a3135747e0	FREE	2024-01-15	2024-07-15	ACTIVE	PAID	0.00	2025-11-26 14:22:52.696384-06	\N
66ff65df-6a67-440d-a0c4-e3ec3850327f	42aabd78-ee63-4869-9f7c-3515126f8f72	BASIC	2024-02-01	2025-01-31	ACTIVE	PAID	99.99	2025-11-26 14:22:52.696384-06	\N
4fbfe000-ce9c-4ffe-9700-793ea9933943	a81802d6-5bcd-4509-9ffe-eb2a45bae8a9	PREMIUM	2024-01-01	2024-12-31	ACTIVE	PAID	299.99	2025-11-26 14:22:52.696384-06	\N
\.


--
-- TOC entry 5647 (class 0 OID 36182)
-- Dependencies: 271
-- Data for Name: schools; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schools (public_id, code, plan_code, name, description, address, phone, email, status, created_at, updated_at, updated_by, deleted_at, subscription_status, subscription_start_date, subscription_end_date, trial_ends_at, auto_renew) FROM stdin;
a81802d6-5bcd-4509-9ffe-eb2a45bae8a9	ESC001	PREMIUM	Colegio San Miguel	Institución educativa de excelencia académica	Calle Principal 123, Tegucigalpa	2234-5678	info@colegiosanmiguel.edu	t	2025-11-26 14:21:23.099669-06	\N	\N	\N	ACTIVE	2024-01-01	2024-12-31	\N	t
42aabd78-ee63-4869-9f7c-3515126f8f72	ESC002	BASIC	Centro Educativo Luz del Saber	Formando líderes del mañana	Avenida Central 456, San Pedro Sula	2245-6789	contacto@luzdelsaber.edu	t	2025-11-26 14:21:23.099669-06	\N	\N	\N	ACTIVE	2024-02-01	2025-01-31	\N	t
071a9749-1d16-4758-977a-80a3135747e0	ESC003	FREE	Escuela Rural Santa Fe	Educación de calidad en zona rural	Carretera a Santa Fe, Km 12	2231-2345	santafe@escuelarural.edu	t	2025-11-26 14:21:23.099669-06	\N	\N	\N	ACTIVE	2024-01-15	2024-07-15	\N	t
\.


--
-- TOC entry 5648 (class 0 OID 36197)
-- Dependencies: 272
-- Data for Name: student_behavior; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_behavior (id, student_id, school_code, recorded_by, behavior_type, description, points, date_occurred, created_at) FROM stdin;
1	27d777b7-f9d4-4d2f-b95d-179ee351438f	ESC001	c325de39-986e-42bf-8da1-185bf4ef8696	POSITIVE	Ayudó a un compañero con sus tareas	5	2024-02-05	2025-11-26 14:22:52.696384-06
\.


--
-- TOC entry 5650 (class 0 OID 36207)
-- Dependencies: 274
-- Data for Name: student_enrollments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_enrollments (id, student_id, academic_year_id, grade_code, school_code, enrollment_date, status, notes) FROM stdin;
1	27d777b7-f9d4-4d2f-b95d-179ee351438f	1	1RO	ESC001	2024-01-15	ACTIVE	\N
2	131b3510-ee31-4f6f-a9cd-7f391e661ecf	1	1RO	ESC001	2024-01-15	ACTIVE	\N
3	bdda5776-61c7-474e-85b3-ea84501fc000	1	1RO	ESC001	2024-01-15	ACTIVE	\N
4	6c7f6fd8-4190-4f63-ae3b-b96c2fbba18a	1	2DO	ESC001	2024-01-15	ACTIVE	\N
\.


--
-- TOC entry 5652 (class 0 OID 36216)
-- Dependencies: 276
-- Data for Name: subscription_payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscription_payments (id, subscription_id, amount_paid, payment_method, transaction_reference, payment_date, next_payment_date, status, created_at) FROM stdin;
\.


--
-- TOC entry 5653 (class 0 OID 36226)
-- Dependencies: 277
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_roles (user_id, role_id, assigned_at) FROM stdin;
67b9e78a-3bab-49b0-9057-1c6f74c9d271	1	2025-11-26 14:21:37.894249-06
341c5705-f13a-47b4-9cec-f81fc2fc20a8	2	2025-11-26 14:21:37.894249-06
a84e6048-913f-4310-b4dc-1e42852764f7	2	2025-11-26 14:21:37.894249-06
c325de39-986e-42bf-8da1-185bf4ef8696	3	2025-11-26 14:21:37.894249-06
5128aedd-0fcf-4319-accf-b59fe187c705	3	2025-11-26 14:21:37.894249-06
9f96ecdd-a467-4e83-ad58-d855ede4014d	3	2025-11-26 14:21:37.894249-06
a4d6c025-3bcd-4fae-bb0d-d196868b15f9	3	2025-11-26 14:21:37.894249-06
9f556773-820d-4525-9f41-c955d1e2c202	3	2025-11-26 14:21:37.894249-06
27d777b7-f9d4-4d2f-b95d-179ee351438f	4	2025-11-26 14:21:37.894249-06
131b3510-ee31-4f6f-a9cd-7f391e661ecf	4	2025-11-26 14:21:37.894249-06
bdda5776-61c7-474e-85b3-ea84501fc000	4	2025-11-26 14:21:37.894249-06
6c7f6fd8-4190-4f63-ae3b-b96c2fbba18a	4	2025-11-26 14:21:37.894249-06
a4d6c025-3bcd-4fae-bb0d-d196868b15f9	5	2025-11-26 14:21:37.894249-06
9f556773-820d-4525-9f41-c955d1e2c202	5	2025-11-26 14:21:37.894249-06
\.


--
-- TOC entry 5654 (class 0 OID 36232)
-- Dependencies: 278
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_sessions (id, user_id, session_token, ip_address, user_agent, expires_at, is_active, created_at) FROM stdin;
\.


--
-- TOC entry 5656 (class 0 OID 36244)
-- Dependencies: 280
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (public_id, identity_number, school_code, user_code, username, email, password, first_name, last_name, phone, date_of_birth, gender, address, profile_picture, emergency_contact, status, last_login, created_at, updated_at, updated_by, deleted_at) FROM stdin;
67b9e78a-3bab-49b0-9057-1c6f74c9d271	0801-1980-00123	\N	SUPER-001	superadmin	superadmin@sistema.edu	$2b$10$ExampleHash1	Carlos	Martínez	2234-5678	1980-05-15	M	Tegucigalpa, Honduras	\N	\N	t	\N	2025-11-26 14:21:29.314411-06	\N	\N	\N
341c5705-f13a-47b4-9cec-f81fc2fc20a8	0801-1975-00234	ESC001	ADM-001	director	director@colegiosanmiguel.edu	$2b$10$ExampleHash2	Ana	Gutiérrez	2345-6789	1975-08-20	F	Avenida Central 456	\N	\N	t	\N	2025-11-26 14:21:29.314411-06	\N	\N	\N
a84e6048-913f-4310-b4dc-1e42852764f7	0801-1978-00345	ESC002	ADM-002	admin	admin@luzdelsaber.edu	$2b$10$ExampleHash3	Roberto	López	2456-7890	1978-03-10	M	Colonia Los Pinos	\N	\N	t	\N	2025-11-26 14:21:29.314411-06	\N	\N	\N
c325de39-986e-42bf-8da1-185bf4ef8696	0801-1985-00456	ESC001	PROF-001	mperez	maria.perez@colegiosanmiguel.edu	$2b$10$ExampleHash4	María	Pérez	2567-8901	1985-06-25	F	Barrio El Centro	\N	\N	t	\N	2025-11-26 14:21:29.314411-06	\N	\N	\N
5128aedd-0fcf-4319-accf-b59fe187c705	0801-1982-00567	ESC001	PROF-002	jgonzalez	jose.gonzalez@colegiosanmiguel.edu	$2b$10$ExampleHash5	José	González	2678-9012	1982-11-30	M	Residencial Las Flores	\N	\N	t	\N	2025-11-26 14:21:29.314411-06	\N	\N	\N
9f96ecdd-a467-4e83-ad58-d855ede4014d	0801-1988-00678	ESC002	PROF-003	lhernandez	laura.hernandez@luzdelsaber.edu	$2b$10$ExampleHash6	Laura	Hernández	2789-0123	1988-09-15	F	Colonia Moderna	\N	\N	t	\N	2025-11-26 14:21:29.314411-06	\N	\N	\N
27d777b7-f9d4-4d2f-b95d-179ee351438f	0801-2015-00789	ESC001	EST-001	clopez	carlos.lopez@colegiosanmiguel.edu	$2b$10$ExampleHash7	Carlos	López	\N	2015-06-08	M	Avenida Juventud 222	\N	\N	t	\N	2025-11-26 14:21:29.314411-06	\N	\N	\N
131b3510-ee31-4f6f-a9cd-7f391e661ecf	0801-2015-00890	ESC001	EST-002	mgarcia	marta.garcia@colegiosanmiguel.edu	$2b$10$ExampleHash8	Marta	García	\N	2015-09-22	F	Pasaje Escolar 333	\N	\N	t	\N	2025-11-26 14:21:29.314411-06	\N	\N	\N
bdda5776-61c7-474e-85b3-ea84501fc000	0801-2015-00901	ESC001	EST-003	pramirez	pedro.ramirez@colegiosanmiguel.edu	$2b$10$ExampleHash9	Pedro	Ramírez	\N	2015-12-05	M	Colonia Estudiantil 444	\N	\N	t	\N	2025-11-26 14:21:29.314411-06	\N	\N	\N
6c7f6fd8-4190-4f63-ae3b-b96c2fbba18a	0801-2014-01012	ESC001	EST-004	srodriguez	sofia.rodriguez@colegiosanmiguel.edu	$2b$10$ExampleHash10	Sofía	Rodríguez	\N	2014-04-18	F	Barrio Nuevo 555	\N	\N	t	\N	2025-11-26 14:21:29.314411-06	\N	\N	\N
a4d6c025-3bcd-4fae-bb0d-d196868b15f9	0801-1980-01123	ESC001	PAD-001	rhernandez	roberto.hernandez@email.com	$2b$10$ExampleHash11	Roberto	Hernández	2890-1234	1980-01-12	M	Calle Estudiantes 111	\N	\N	t	\N	2025-11-26 14:21:29.314411-06	\N	\N	\N
9f556773-820d-4525-9f41-c955d1e2c202	0801-1982-01234	ESC001	PAD-002	mlopez	marta.lopez@email.com	$2b$10$ExampleHash12	Marta	López	2901-2345	1982-03-25	F	Avenida Juventud 222	\N	\N	t	\N	2025-11-26 14:21:29.314411-06	\N	\N	\N
fe7ff4df-10b6-46ba-abf5-559783c670a8	0801-1978-01345	ESC001	PAD-003	jgarcia	juan.garcia@email.com	$2b$10$ExampleHash13	Juan	García	3012-3456	1978-07-08	M	Pasaje Escolar 333	\N	\N	t	\N	2025-11-26 14:21:29.314411-06	\N	\N	\N
\.


--
-- TOC entry 5707 (class 0 OID 0)
-- Dependencies: 221
-- Name: academic_periods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.academic_periods_id_seq', 3, true);


--
-- TOC entry 5708 (class 0 OID 0)
-- Dependencies: 223
-- Name: academic_years_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.academic_years_id_seq', 3, true);


--
-- TOC entry 5709 (class 0 OID 0)
-- Dependencies: 225
-- Name: announcement_recipients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.announcement_recipients_id_seq', 1, false);


--
-- TOC entry 5710 (class 0 OID 0)
-- Dependencies: 228
-- Name: assignment_files_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assignment_files_id_seq', 1, false);


--
-- TOC entry 5711 (class 0 OID 0)
-- Dependencies: 230
-- Name: assignment_submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assignment_submissions_id_seq', 1, true);


--
-- TOC entry 5712 (class 0 OID 0)
-- Dependencies: 232
-- Name: assignment_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assignment_types_id_seq', 4, true);


--
-- TOC entry 5713 (class 0 OID 0)
-- Dependencies: 234
-- Name: assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assignments_id_seq', 2, true);


--
-- TOC entry 5714 (class 0 OID 0)
-- Dependencies: 237
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 1, false);


--
-- TOC entry 5715 (class 0 OID 0)
-- Dependencies: 239
-- Name: class_enrollments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.class_enrollments_id_seq', 6, true);


--
-- TOC entry 5716 (class 0 OID 0)
-- Dependencies: 245
-- Name: employee_salaries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_salaries_id_seq', 1, false);


--
-- TOC entry 5717 (class 0 OID 0)
-- Dependencies: 249
-- Name: grades_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.grades_records_id_seq', 1, false);


--
-- TOC entry 5718 (class 0 OID 0)
-- Dependencies: 251
-- Name: inventory_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inventory_items_id_seq', 1, false);


--
-- TOC entry 5719 (class 0 OID 0)
-- Dependencies: 253
-- Name: inventory_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inventory_transactions_id_seq', 1, false);


--
-- TOC entry 5720 (class 0 OID 0)
-- Dependencies: 257
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.messages_id_seq', 1, false);


--
-- TOC entry 5721 (class 0 OID 0)
-- Dependencies: 259
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- TOC entry 5722 (class 0 OID 0)
-- Dependencies: 261
-- Name: payment_concepts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payment_concepts_id_seq', 3, true);


--
-- TOC entry 5723 (class 0 OID 0)
-- Dependencies: 263
-- Name: payment_methods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payment_methods_id_seq', 3, true);


--
-- TOC entry 5724 (class 0 OID 0)
-- Dependencies: 266
-- Name: payroll_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payroll_records_id_seq', 1, false);


--
-- TOC entry 5725 (class 0 OID 0)
-- Dependencies: 269
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 5, true);


--
-- TOC entry 5726 (class 0 OID 0)
-- Dependencies: 273
-- Name: student_behavior_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.student_behavior_id_seq', 1, true);


--
-- TOC entry 5727 (class 0 OID 0)
-- Dependencies: 275
-- Name: student_enrollments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.student_enrollments_id_seq', 4, true);


--
-- TOC entry 5728 (class 0 OID 0)
-- Dependencies: 279
-- Name: user_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_sessions_id_seq', 1, false);


--
-- TOC entry 5221 (class 2606 OID 36284)
-- Name: academic_periods academic_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.academic_periods
    ADD CONSTRAINT academic_periods_pkey PRIMARY KEY (id);


--
-- TOC entry 5223 (class 2606 OID 36286)
-- Name: academic_years academic_years_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.academic_years
    ADD CONSTRAINT academic_years_pkey PRIMARY KEY (id);


--
-- TOC entry 5225 (class 2606 OID 40965)
-- Name: academic_years academic_years_school_code_year_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.academic_years
    ADD CONSTRAINT academic_years_school_code_year_code_key UNIQUE (school_code, year_code);


--
-- TOC entry 5227 (class 2606 OID 36290)
-- Name: announcement_recipients announcement_recipients_announcement_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcement_recipients
    ADD CONSTRAINT announcement_recipients_announcement_id_user_id_key UNIQUE (announcement_id, user_id);


--
-- TOC entry 5229 (class 2606 OID 36292)
-- Name: announcement_recipients announcement_recipients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcement_recipients
    ADD CONSTRAINT announcement_recipients_pkey PRIMARY KEY (id);


--
-- TOC entry 5231 (class 2606 OID 36294)
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (public_id);


--
-- TOC entry 5234 (class 2606 OID 36296)
-- Name: assignment_files assignment_files_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_files
    ADD CONSTRAINT assignment_files_pkey PRIMARY KEY (id);


--
-- TOC entry 5236 (class 2606 OID 36298)
-- Name: assignment_submissions assignment_submissions_assignment_id_student_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_assignment_id_student_id_key UNIQUE (assignment_id, student_id);


--
-- TOC entry 5238 (class 2606 OID 36300)
-- Name: assignment_submissions assignment_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_pkey PRIMARY KEY (id);


--
-- TOC entry 5242 (class 2606 OID 36302)
-- Name: assignment_types assignment_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_types
    ADD CONSTRAINT assignment_types_pkey PRIMARY KEY (id);


--
-- TOC entry 5244 (class 2606 OID 36304)
-- Name: assignment_types assignment_types_school_code_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_types
    ADD CONSTRAINT assignment_types_school_code_code_key UNIQUE (school_code, code);


--
-- TOC entry 5246 (class 2606 OID 36306)
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);


--
-- TOC entry 5251 (class 2606 OID 36308)
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (student_id, class_code, school_code, date);


--
-- TOC entry 5256 (class 2606 OID 36310)
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 5259 (class 2606 OID 36312)
-- Name: class_enrollments class_enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.class_enrollments
    ADD CONSTRAINT class_enrollments_pkey PRIMARY KEY (id);


--
-- TOC entry 5261 (class 2606 OID 36314)
-- Name: class_enrollments class_enrollments_student_id_class_code_school_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.class_enrollments
    ADD CONSTRAINT class_enrollments_student_id_class_code_school_code_key UNIQUE (student_id, class_code, school_code);


--
-- TOC entry 5264 (class 2606 OID 36316)
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (code, school_code);


--
-- TOC entry 5267 (class 2606 OID 36318)
-- Name: classrooms classrooms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classrooms
    ADD CONSTRAINT classrooms_pkey PRIMARY KEY (code, school_code);


--
-- TOC entry 5269 (class 2606 OID 36320)
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (code, school_code);


--
-- TOC entry 5271 (class 2606 OID 36322)
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (public_id);


--
-- TOC entry 5276 (class 2606 OID 36324)
-- Name: employee_salaries employee_salaries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_salaries
    ADD CONSTRAINT employee_salaries_pkey PRIMARY KEY (id);


--
-- TOC entry 5278 (class 2606 OID 36326)
-- Name: family_relationships family_relationships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family_relationships
    ADD CONSTRAINT family_relationships_pkey PRIMARY KEY (student_id, parent_id);


--
-- TOC entry 5282 (class 2606 OID 36328)
-- Name: grades grades_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_pkey PRIMARY KEY (code, school_code);


--
-- TOC entry 5284 (class 2606 OID 36330)
-- Name: grades_records grades_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grades_records
    ADD CONSTRAINT grades_records_pkey PRIMARY KEY (id);


--
-- TOC entry 5288 (class 2606 OID 36332)
-- Name: inventory_items inventory_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5290 (class 2606 OID 36334)
-- Name: inventory_transactions inventory_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 5292 (class 2606 OID 36336)
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5295 (class 2606 OID 36338)
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- TOC entry 5299 (class 2606 OID 36340)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- TOC entry 5302 (class 2606 OID 36342)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 5304 (class 2606 OID 36344)
-- Name: payment_concepts payment_concepts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_concepts
    ADD CONSTRAINT payment_concepts_pkey PRIMARY KEY (id);


--
-- TOC entry 5306 (class 2606 OID 36346)
-- Name: payment_concepts payment_concepts_school_code_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_concepts
    ADD CONSTRAINT payment_concepts_school_code_code_key UNIQUE (school_code, code);


--
-- TOC entry 5308 (class 2606 OID 36348)
-- Name: payment_methods payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (id);


--
-- TOC entry 5310 (class 2606 OID 36350)
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- TOC entry 5312 (class 2606 OID 36352)
-- Name: payroll_records payroll_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_records
    ADD CONSTRAINT payroll_records_pkey PRIMARY KEY (id);


--
-- TOC entry 5314 (class 2606 OID 36354)
-- Name: plans plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_pkey PRIMARY KEY (code);


--
-- TOC entry 5316 (class 2606 OID 36356)
-- Name: roles roles_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_code_key UNIQUE (code);


--
-- TOC entry 5318 (class 2606 OID 36358)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 5361 (class 2606 OID 41001)
-- Name: school_configs school_configs_custom_domain_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.school_configs
    ADD CONSTRAINT school_configs_custom_domain_key UNIQUE (custom_domain);


--
-- TOC entry 5363 (class 2606 OID 40995)
-- Name: school_configs school_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.school_configs
    ADD CONSTRAINT school_configs_pkey PRIMARY KEY (id);


--
-- TOC entry 5365 (class 2606 OID 40997)
-- Name: school_configs school_configs_school_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.school_configs
    ADD CONSTRAINT school_configs_school_id_key UNIQUE (school_id);


--
-- TOC entry 5367 (class 2606 OID 40999)
-- Name: school_configs school_configs_subdomain_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.school_configs
    ADD CONSTRAINT school_configs_subdomain_key UNIQUE (subdomain);


--
-- TOC entry 5323 (class 2606 OID 36360)
-- Name: school_subscriptions school_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.school_subscriptions
    ADD CONSTRAINT school_subscriptions_pkey PRIMARY KEY (id);


--
-- TOC entry 5326 (class 2606 OID 36362)
-- Name: schools schools_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_code_key UNIQUE (code);


--
-- TOC entry 5328 (class 2606 OID 36364)
-- Name: schools schools_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_pkey PRIMARY KEY (public_id);


--
-- TOC entry 5330 (class 2606 OID 36366)
-- Name: student_behavior student_behavior_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_behavior
    ADD CONSTRAINT student_behavior_pkey PRIMARY KEY (id);


--
-- TOC entry 5333 (class 2606 OID 36368)
-- Name: student_enrollments student_enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_enrollments
    ADD CONSTRAINT student_enrollments_pkey PRIMARY KEY (id);


--
-- TOC entry 5335 (class 2606 OID 36370)
-- Name: student_enrollments student_enrollments_student_id_academic_year_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_enrollments
    ADD CONSTRAINT student_enrollments_student_id_academic_year_id_key UNIQUE (student_id, academic_year_id);


--
-- TOC entry 5338 (class 2606 OID 36372)
-- Name: subscription_payments subscription_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_pkey PRIMARY KEY (id);


--
-- TOC entry 5340 (class 2606 OID 36374)
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- TOC entry 5342 (class 2606 OID 36376)
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 5347 (class 2606 OID 36378)
-- Name: users users_identity_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_identity_number_key UNIQUE (identity_number);


--
-- TOC entry 5349 (class 2606 OID 36380)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (public_id);


--
-- TOC entry 5351 (class 2606 OID 36382)
-- Name: users users_school_code_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_school_code_email_key UNIQUE (school_code, email);


--
-- TOC entry 5353 (class 2606 OID 36384)
-- Name: users users_school_code_user_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_school_code_user_code_key UNIQUE (school_code, user_code);


--
-- TOC entry 5355 (class 2606 OID 36386)
-- Name: users users_school_code_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_school_code_username_key UNIQUE (school_code, username);


--
-- TOC entry 5232 (class 1259 OID 36387)
-- Name: idx_announcements_school_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_announcements_school_dates ON public.announcements USING btree (school_code, start_date, end_date);


--
-- TOC entry 5247 (class 1259 OID 36388)
-- Name: idx_assignments_class_school; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignments_class_school ON public.assignments USING btree (class_code, school_code);


--
-- TOC entry 5248 (class 1259 OID 36389)
-- Name: idx_assignments_due_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignments_due_date ON public.assignments USING btree (due_date);


--
-- TOC entry 5249 (class 1259 OID 36390)
-- Name: idx_assignments_teacher; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assignments_teacher ON public.assignments USING btree (user_id, status);


--
-- TOC entry 5252 (class 1259 OID 36391)
-- Name: idx_attendance_date_class; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_date_class ON public.attendance USING btree (date, class_code);


--
-- TOC entry 5253 (class 1259 OID 36392)
-- Name: idx_attendance_month; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_month ON public.attendance USING btree (date, student_id);


--
-- TOC entry 5254 (class 1259 OID 36393)
-- Name: idx_attendance_student_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_student_date ON public.attendance USING btree (student_id, date);


--
-- TOC entry 5257 (class 1259 OID 36394)
-- Name: idx_audit_logs_school_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_school_date ON public.audit_logs USING btree (school_code, created_at);


--
-- TOC entry 5262 (class 1259 OID 36395)
-- Name: idx_class_enrollments_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_class_enrollments_student ON public.class_enrollments USING btree (student_id);


--
-- TOC entry 5265 (class 1259 OID 36396)
-- Name: idx_classes_academic_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_classes_academic_year ON public.classes USING btree (academic_year_id);


--
-- TOC entry 5272 (class 1259 OID 36397)
-- Name: idx_documents_assignment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_assignment ON public.documents USING btree (assignment_id);


--
-- TOC entry 5273 (class 1259 OID 36398)
-- Name: idx_documents_submission; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_submission ON public.documents USING btree (assignment_submission_id);


--
-- TOC entry 5274 (class 1259 OID 36399)
-- Name: idx_documents_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_type ON public.documents USING btree (document_type);


--
-- TOC entry 5279 (class 1259 OID 36400)
-- Name: idx_family_relationships_parent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_family_relationships_parent ON public.family_relationships USING btree (parent_id);


--
-- TOC entry 5280 (class 1259 OID 36401)
-- Name: idx_family_relationships_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_family_relationships_student ON public.family_relationships USING btree (student_id);


--
-- TOC entry 5285 (class 1259 OID 36402)
-- Name: idx_grades_records_student_assignment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_grades_records_student_assignment ON public.grades_records USING btree (student_id, assignment_id);


--
-- TOC entry 5286 (class 1259 OID 36403)
-- Name: idx_grades_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_grades_student ON public.grades_records USING btree (student_id);


--
-- TOC entry 5293 (class 1259 OID 36404)
-- Name: idx_invoices_student_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_student_status ON public.invoices USING btree (student_id, status);


--
-- TOC entry 5296 (class 1259 OID 36405)
-- Name: idx_messages_receiver; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_receiver ON public.messages USING btree (receiver_id);


--
-- TOC entry 5297 (class 1259 OID 36406)
-- Name: idx_messages_sender; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_sender ON public.messages USING btree (sender_id);


--
-- TOC entry 5300 (class 1259 OID 36407)
-- Name: idx_notifications_user_unread; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user_unread ON public.notifications USING btree (user_id, is_read);


--
-- TOC entry 5356 (class 1259 OID 41009)
-- Name: idx_school_configs_custom_domain; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_school_configs_custom_domain ON public.school_configs USING btree (custom_domain) WHERE (custom_domain IS NOT NULL);


--
-- TOC entry 5357 (class 1259 OID 41007)
-- Name: idx_school_configs_school_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_school_configs_school_id ON public.school_configs USING btree (school_id);


--
-- TOC entry 5358 (class 1259 OID 41008)
-- Name: idx_school_configs_subdomain; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_school_configs_subdomain ON public.school_configs USING btree (subdomain) WHERE (subdomain IS NOT NULL);


--
-- TOC entry 5359 (class 1259 OID 41010)
-- Name: idx_school_configs_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_school_configs_updated_at ON public.school_configs USING btree (updated_at);


--
-- TOC entry 5319 (class 1259 OID 36408)
-- Name: idx_school_subscriptions_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_school_subscriptions_dates ON public.school_subscriptions USING btree (start_date, end_date);


--
-- TOC entry 5320 (class 1259 OID 36409)
-- Name: idx_school_subscriptions_school; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_school_subscriptions_school ON public.school_subscriptions USING btree (school_id);


--
-- TOC entry 5321 (class 1259 OID 36410)
-- Name: idx_school_subscriptions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_school_subscriptions_status ON public.school_subscriptions USING btree (status);


--
-- TOC entry 5324 (class 1259 OID 36411)
-- Name: idx_schools_plan_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_schools_plan_code ON public.schools USING btree (plan_code);


--
-- TOC entry 5331 (class 1259 OID 36412)
-- Name: idx_student_enrollments_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_enrollments_year ON public.student_enrollments USING btree (academic_year_id);


--
-- TOC entry 5239 (class 1259 OID 36413)
-- Name: idx_submissions_assignment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_submissions_assignment ON public.assignment_submissions USING btree (assignment_id);


--
-- TOC entry 5240 (class 1259 OID 36414)
-- Name: idx_submissions_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_submissions_student ON public.assignment_submissions USING btree (student_id, status);


--
-- TOC entry 5336 (class 1259 OID 36415)
-- Name: idx_subscription_payments_subscription; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscription_payments_subscription ON public.subscription_payments USING btree (subscription_id);


--
-- TOC entry 5343 (class 1259 OID 36416)
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- TOC entry 5344 (class 1259 OID 36417)
-- Name: idx_users_identity_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_identity_number ON public.users USING btree (identity_number);


--
-- TOC entry 5345 (class 1259 OID 36418)
-- Name: idx_users_school_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_school_code ON public.users USING btree (school_code);


--
-- TOC entry 5368 (class 2606 OID 36419)
-- Name: academic_periods academic_periods_academic_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.academic_periods
    ADD CONSTRAINT academic_periods_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id);


--
-- TOC entry 5369 (class 2606 OID 36424)
-- Name: academic_periods academic_periods_school_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.academic_periods
    ADD CONSTRAINT academic_periods_school_code_fkey FOREIGN KEY (school_code) REFERENCES public.schools(code);


--
-- TOC entry 5370 (class 2606 OID 36429)
-- Name: academic_years academic_years_school_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.academic_years
    ADD CONSTRAINT academic_years_school_code_fkey FOREIGN KEY (school_code) REFERENCES public.schools(code);


--
-- TOC entry 5371 (class 2606 OID 36434)
-- Name: announcement_recipients announcement_recipients_announcement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcement_recipients
    ADD CONSTRAINT announcement_recipients_announcement_id_fkey FOREIGN KEY (announcement_id) REFERENCES public.announcements(public_id);


--
-- TOC entry 5372 (class 2606 OID 36439)
-- Name: announcement_recipients announcement_recipients_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcement_recipients
    ADD CONSTRAINT announcement_recipients_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(public_id);


--
-- TOC entry 5373 (class 2606 OID 36444)
-- Name: announcements announcements_school_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_school_code_fkey FOREIGN KEY (school_code) REFERENCES public.schools(code);


--
-- TOC entry 5374 (class 2606 OID 36449)
-- Name: announcements announcements_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(public_id);


--
-- TOC entry 5375 (class 2606 OID 36454)
-- Name: assignment_files assignment_files_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_files
    ADD CONSTRAINT assignment_files_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.assignment_submissions(id) ON DELETE CASCADE;


--
-- TOC entry 5376 (class 2606 OID 36459)
-- Name: assignment_submissions assignment_submissions_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(id);


--
-- TOC entry 5377 (class 2606 OID 36464)
-- Name: assignment_submissions assignment_submissions_graded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_graded_by_fkey FOREIGN KEY (graded_by) REFERENCES public.users(public_id);


--
-- TOC entry 5378 (class 2606 OID 36469)
-- Name: assignment_submissions assignment_submissions_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(public_id);


--
-- TOC entry 5379 (class 2606 OID 36474)
-- Name: assignment_types assignment_types_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_types
    ADD CONSTRAINT assignment_types_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(public_id);


--
-- TOC entry 5380 (class 2606 OID 36479)
-- Name: assignment_types assignment_types_school_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_types
    ADD CONSTRAINT assignment_types_school_code_fkey FOREIGN KEY (school_code) REFERENCES public.schools(code);


--
-- TOC entry 5381 (class 2606 OID 36484)
-- Name: assignments assignments_school_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_school_code_fkey FOREIGN KEY (school_code) REFERENCES public.schools(code);


--
-- TOC entry 5382 (class 2606 OID 36489)
-- Name: assignments assignments_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.assignment_types(id);


--
-- TOC entry 5383 (class 2606 OID 36494)
-- Name: assignments assignments_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(public_id);


--
-- TOC entry 5384 (class 2606 OID 36499)
-- Name: assignments assignments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(public_id);


--
-- TOC entry 5385 (class 2606 OID 36504)
-- Name: attendance attendance_recorded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES public.users(public_id);


--
-- TOC entry 5386 (class 2606 OID 36509)
-- Name: attendance attendance_school_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_school_code_fkey FOREIGN KEY (school_code) REFERENCES public.schools(code);


--
-- TOC entry 5387 (class 2606 OID 36514)
-- Name: attendance attendance_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(public_id);


--
-- TOC entry 5388 (class 2606 OID 36519)
-- Name: audit_logs audit_logs_school_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_school_code_fkey FOREIGN KEY (school_code) REFERENCES public.schools(code);


--
-- TOC entry 5389 (class 2606 OID 36524)
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(public_id);


--
-- TOC entry 5390 (class 2606 OID 36529)
-- Name: class_enrollments class_enrollments_school_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.class_enrollments
    ADD CONSTRAINT class_enrollments_school_code_fkey FOREIGN KEY (school_code) REFERENCES public.schools(code);


--
-- TOC entry 5391 (class 2606 OID 36534)
-- Name: class_enrollments class_enrollments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.class_enrollments
    ADD CONSTRAINT class_enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(public_id);


--
-- TOC entry 5392 (class 2606 OID 36539)
-- Name: classes classes_academic_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id);


--
-- TOC entry 5393 (class 2606 OID 36544)
-- Name: classes classes_school_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_school_code_fkey FOREIGN KEY (school_code) REFERENCES public.schools(code);


--
-- TOC entry 5394 (class 2606 OID 36549)
-- Name: classes classes_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(public_id);


--
-- TOC entry 5395 (class 2606 OID 36554)
-- Name: classes classes_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(public_id);


--
-- TOC entry 5396 (class 2606 OID 36559)
-- Name: classrooms classrooms_school_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classrooms
    ADD CONSTRAINT classrooms_school_code_fkey FOREIGN KEY (school_code) REFERENCES public.schools(code);


--
-- TOC entry 5397 (class 2606 OID 36564)
-- Name: courses courses_school_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_school_code_fkey FOREIGN KEY (school_code) REFERENCES public.schools(code);


--
-- TOC entry 5398 (class 2606 OID 36569)
-- Name: documents documents_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(id);


--
-- TOC entry 5399 (class 2606 OID 36574)
-- Name: documents documents_assignment_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_assignment_submission_id_fkey FOREIGN KEY (assignment_submission_id) REFERENCES public.assignment_submissions(id);


--
-- TOC entry 5400 (class 2606 OID 36579)
-- Name: documents documents_school_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_school_code_fkey FOREIGN KEY (school_code) REFERENCES public.schools(code);


--
-- TOC entry 5401 (class 2606 OID 36584)
-- Name: documents documents_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(public_id);


--
-- TOC entry 5402 (class 2606 OID 36589)
-- Name: employee_salaries employee_salaries_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_salaries
    ADD CONSTRAINT employee_salaries_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(public_id);


--
-- TOC entry 5403 (class 2606 OID 36594)
-- Name: employee_salaries employee_salaries_school_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_salaries
    ADD CONSTRAINT employee_salaries_school_code_fkey FOREIGN KEY (school_code) REFERENCES public.schools(code);


--
-- TOC entry 5404 (class 2606 OID 36599)
-- Name: family_relationships family_relationships_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family_relationships
    ADD CONSTRAINT family_relationships_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.users(public_id);


--
-- TOC entry 5405 (class 2606 OID 36604)
-- Name: family_relationships family_relationships_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family_relationships
    ADD CONSTRAINT family_relationships_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(public_id);


--
-- TOC entry 5448 (class 2606 OID 41002)
-- Name: school_configs fk_school_configs_school; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.school_configs
    ADD CONSTRAINT fk_school_configs_school FOREIGN KEY (school_id) REFERENCES public.schools(public_id);


--
-- TOC entry 5407 (class 2606 OID 36624)
-- Name: grades_records grades_records_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grades_records
    ADD CONSTRAINT grades_records_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(id);


--
-- TOC entry 5408 (class 2606 OID 36629)
-- Name: grades_records grades_records_recorded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grades_records
    ADD CONSTRAINT grades_records_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES public.users(public_id);


--
-- TOC entry 5409 (class 2606 OID 36634)
-- Name: grades_records grades_records_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grades_records
    ADD CONSTRAINT grades_records_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(public_id);


--
-- TOC entry 5406 (class 2606 OID 36639)
-- Name: grades grades_school_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_school_code_fkey FOREIGN KEY (school_code) REFERENCES public.schools(code);


--
-- TOC entry 5410 (class 2606 OID 36644)
-- Name: inventory_items inventory_items_school_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_school_code_fkey FOREIGN KEY (school_code) REFERENCES public.schools(code);


--
-- TOC entry 5411 (class 2606 OID 36649)
-- Name: inventory_transactions inventory_transactions_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id);


--
-- TOC entry 5412 (class 2606 OID 36654)
-- Name: inventory_transactions inventory_transactions_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.users(public_id);


--
-- TOC entry 5413 (class 2606 OID 36659)
-- Name: inventory_transactions inventory_transactions_school_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_school_code_fkey FOREIGN KEY (school_code) REFERENCES public.schools(code);


--
-- TOC entry 5414 (class 2606 OID 36664)
-- Name: invoice_items invoice_items_concept_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_concept_id_fkey FOREIGN KEY (concept_id) REFERENCES public.payment_concepts(id);


--
-- TOC entry 5415 (class 2606 OID 36669)
-- Name: invoice_items invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id);


--
-- TOC entry 5416 (class 2606 OID 36674)
-- Name: invoices invoices_school_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_school_code_fkey FOREIGN KEY (school_code) REFERENCES public.schools(code);


--
-- TOC entry 5417 (class 2606 OID 36679)
-- Name: invoices invoices_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(public_id);


--
-- TOC entry 5418 (class 2606 OID 36684)
-- Name: messages messages_parent_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_parent_message_id_fkey FOREIGN KEY (parent_message_id) REFERENCES public.messages(id);


--
-- TOC entry 5419 (class 2606 OID 36689)
-- Name: messages messages_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(public_id);


--
-- TOC entry 5420 (class 2606 OID 36694)
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(public_id);


--
-- TOC entry 5421 (class 2606 OID 36699)
-- Name: messages messages_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(public_id);


--
-- TOC entry 5422 (class 2606 OID 36704)
-- Name: notifications notifications_school_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_school_code_fkey FOREIGN KEY (school_code) REFERENCES public.schools(code);


--
-- TOC entry 5423 (class 2606 OID 36709)
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(public_id);


--
-- TOC entry 5424 (class 2606 OID 36714)
-- Name: payment_concepts payment_concepts_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_concepts
    ADD CONSTRAINT payment_concepts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(public_id);


--
-- TOC entry 5425 (class 2606 OID 36719)
-- Name: payment_concepts payment_concepts_school_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_concepts
    ADD CONSTRAINT payment_concepts_school_code_fkey FOREIGN KEY (school_code) REFERENCES public.schools(code);


--
-- TOC entry 5426 (class 2606 OID 36724)
-- Name: payment_methods payment_methods_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(public_id);


--
-- TOC entry 5427 (class 2606 OID 36729)
-- Name: payment_methods payment_methods_school_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_school_code_fkey FOREIGN KEY (school_code) REFERENCES public.schools(code);


--
-- TOC entry 5428 (class 2606 OID 36734)
-- Name: payments payments_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id);


--
-- TOC entry 5429 (class 2606 OID 36739)
-- Name: payments payments_payment_method_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id);


--
-- TOC entry 5430 (class 2606 OID 36744)
-- Name: payments payments_school_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_school_code_fkey FOREIGN KEY (school_code) REFERENCES public.schools(code);


--
-- TOC entry 5431 (class 2606 OID 36749)
-- Name: payroll_records payroll_records_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_records
    ADD CONSTRAINT payroll_records_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(public_id);


--
-- TOC entry 5432 (class 2606 OID 36754)
-- Name: payroll_records payroll_records_school_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_records
    ADD CONSTRAINT payroll_records_school_code_fkey FOREIGN KEY (school_code) REFERENCES public.schools(code);


--
-- TOC entry 5433 (class 2606 OID 36759)
-- Name: school_subscriptions school_subscriptions_plan_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.school_subscriptions
    ADD CONSTRAINT school_subscriptions_plan_code_fkey FOREIGN KEY (plan_code) REFERENCES public.plans(code);


--
-- TOC entry 5434 (class 2606 OID 36764)
-- Name: school_subscriptions school_subscriptions_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.school_subscriptions
    ADD CONSTRAINT school_subscriptions_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(public_id);


--
-- TOC entry 5435 (class 2606 OID 36769)
-- Name: schools schools_plan_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_plan_code_fkey FOREIGN KEY (plan_code) REFERENCES public.plans(code);


--
-- TOC entry 5436 (class 2606 OID 36774)
-- Name: student_behavior student_behavior_recorded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_behavior
    ADD CONSTRAINT student_behavior_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES public.users(public_id);


--
-- TOC entry 5437 (class 2606 OID 36779)
-- Name: student_behavior student_behavior_school_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_behavior
    ADD CONSTRAINT student_behavior_school_code_fkey FOREIGN KEY (school_code) REFERENCES public.schools(code);


--
-- TOC entry 5438 (class 2606 OID 36784)
-- Name: student_behavior student_behavior_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_behavior
    ADD CONSTRAINT student_behavior_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(public_id);


--
-- TOC entry 5439 (class 2606 OID 36789)
-- Name: student_enrollments student_enrollments_academic_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_enrollments
    ADD CONSTRAINT student_enrollments_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id);


--
-- TOC entry 5440 (class 2606 OID 36794)
-- Name: student_enrollments student_enrollments_school_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_enrollments
    ADD CONSTRAINT student_enrollments_school_code_fkey FOREIGN KEY (school_code) REFERENCES public.schools(code);


--
-- TOC entry 5441 (class 2606 OID 36799)
-- Name: student_enrollments student_enrollments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_enrollments
    ADD CONSTRAINT student_enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(public_id);


--
-- TOC entry 5442 (class 2606 OID 36804)
-- Name: subscription_payments subscription_payments_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.school_subscriptions(id);


--
-- TOC entry 5443 (class 2606 OID 36809)
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- TOC entry 5444 (class 2606 OID 36814)
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(public_id);


--
-- TOC entry 5445 (class 2606 OID 36819)
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(public_id);


--
-- TOC entry 5446 (class 2606 OID 36824)
-- Name: users users_school_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_school_code_fkey FOREIGN KEY (school_code) REFERENCES public.schools(code);


--
-- TOC entry 5447 (class 2606 OID 36829)
-- Name: users users_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(public_id);


-- Completed on 2025-12-10 21:38:11

--
-- SAAS IMPROVEMENTS
--

-- 1. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Note: The backend MUST run: SET LOCAL app.current_school_code = 'THE_CODE'; 
-- at the start of each transaction for these policies to work.
CREATE POLICY school_isolation_users ON public.users USING (school_code = current_setting('app.current_school_code', true));
CREATE POLICY school_isolation_classes ON public.classes USING (school_code = current_setting('app.current_school_code', true));
CREATE POLICY school_isolation_assignments ON public.assignments USING (school_code = current_setting('app.current_school_code', true));
CREATE POLICY school_isolation_attendance ON public.attendance USING (school_code = current_setting('app.current_school_code', true));

CREATE POLICY school_isolation_grades ON public.grades_records USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.public_id = grades_records.student_id AND u.school_code = current_setting('app.current_school_code', true))
);
CREATE POLICY school_isolation_documents ON public.documents USING (school_code = current_setting('app.current_school_code', true));

-- 2. LIMITS & SUBSCRIPTIONS
CREATE TABLE public.school_usage_stats (
    school_code character varying(20) NOT NULL,
    current_students integer DEFAULT 0,
    current_teachers integer DEFAULT 0,
    current_storage_mb numeric(10,2) DEFAULT 0.00,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT school_usage_stats_pkey PRIMARY KEY (school_code),
    CONSTRAINT school_usage_stats_school_code_fkey FOREIGN KEY (school_code) REFERENCES public.schools(code) ON DELETE CASCADE
);
ALTER TABLE public.school_usage_stats OWNER TO postgres;

ALTER TABLE public.school_subscriptions ADD COLUMN features_enabled jsonb DEFAULT '{}'::jsonb;

-- 3. DOMAIN FEATURES
CREATE TABLE public.grading_scales (
    id integer NOT NULL,
    school_code character varying(20) NOT NULL,
    name character varying(50) NOT NULL,
    scale_type character varying(20) NOT NULL,
    scale_mapping jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT grading_scales_pkey PRIMARY KEY (id),
    CONSTRAINT grading_scales_school_code_fkey FOREIGN KEY (school_code) REFERENCES public.schools(code) ON DELETE CASCADE
);
CREATE SEQUENCE public.grading_scales_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.grading_scales_id_seq OWNED BY public.grading_scales.id;
ALTER TABLE ONLY public.grading_scales ALTER COLUMN id SET DEFAULT nextval('public.grading_scales_id_seq'::regclass);
ALTER TABLE public.grading_scales OWNER TO postgres;

ALTER TABLE public.grades_records ADD COLUMN qualitative_score character varying(10);

CREATE TABLE public.user_devices (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    device_token character varying(255) NOT NULL,
    platform character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_devices_pkey PRIMARY KEY (id),
    CONSTRAINT user_devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(public_id) ON DELETE CASCADE
);
CREATE SEQUENCE public.user_devices_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.user_devices_id_seq OWNED BY public.user_devices.id;
ALTER TABLE ONLY public.user_devices ALTER COLUMN id SET DEFAULT nextval('public.user_devices_id_seq'::regclass);
ALTER TABLE public.user_devices OWNER TO postgres;

ALTER TABLE public.attendance ADD COLUMN time_in time without time zone;
ALTER TABLE public.attendance ADD COLUMN time_out time without time zone;

-- 4. SOFT DELETES
ALTER TABLE public.grades_records ADD COLUMN deleted_at timestamp with time zone;
ALTER TABLE public.attendance ADD COLUMN deleted_at timestamp with time zone;
ALTER TABLE public.inventory_items ADD COLUMN deleted_at timestamp with time zone;
ALTER TABLE public.inventory_transactions ADD COLUMN deleted_at timestamp with time zone;


--
-- PostgreSQL database dump complete
--

\unrestrict SiNOaNxFYJI6OhBfXxXdzychBPfJD5zWcuk461unoNEHS6Q43gdREcBtF38m38T
