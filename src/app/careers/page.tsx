"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase, GraduationCap, Users, Sparkles, CheckCircle2, AlertCircle,
  Search, ArrowRight, FileText, Building2, Phone, Mail, Award, Clock,
  ChevronRight, HeartHandshake, ShieldCheck, Copy, Check, Send
} from "lucide-react";
import { staffService, CreateStaffApplicationInput } from "@/lib/services/staff.service";

interface OpenPosition {
  id: string;
  title: string;
  department: string;
  level: string;
  type: string;
  experience: string;
  description: string;
  skills: string[];
}

const OPEN_POSITIONS: OpenPosition[] = [
  {
    id: "MAT-01",
    title: "Docente de Matemáticas y Física",
    department: "Ciencias y Matemáticas",
    level: "Secundaria / Bachillerato",
    type: "Tiempo Completo",
    experience: "3+ años",
    description: "Buscamos un docente apasionado por el razonamiento lógico, álgebra, cálculo y física para motivar a estudiantes de ciclo común y bachillerato.",
    skills: ["Geometría Analítica", "Preparación Olimpiadas", "Metodologías Activas", "Plataformas Virtuales"],
  },
  {
    id: "PRI-02",
    title: "Maestro(a) de Educación Primaria Bilingüe",
    department: "Educación Primaria",
    level: "1° a 6° Grado",
    type: "Tiempo Completo",
    experience: "2+ años",
    description: "Docente para impartir clases integradas en primaria con dominio avanzado del idioma inglés, pedagogía constructivista y empatía infantil.",
    skills: ["Inglés C1/C2", "Lectoescritura", "Control de Aula Positivo", "Proyectos STEAM"],
  },
  {
    id: "ENG-03",
    title: "Profesor(a) de Inglés Avanzado (ESL)",
    department: "Idiomas / Inglés",
    level: "Primaria y Secundaria",
    type: "Tiempo Completo",
    experience: "4+ años",
    description: "Liderar el programa institucional de inglés con enfoque comunicativo, debates y preparación para certificaciones internacionales.",
    skills: ["Certificación C1/C2", "Debate & Oratoria", "TOEFL/Cambridge Prep", "Fonética"],
  },
  {
    id: "ROB-04",
    title: "Docente de Computación, Robótica & Tecnología",
    department: "Tecnología e Informática",
    level: "Educación Básica y Media",
    type: "Tiempo Completo",
    experience: "2+ años",
    description: "Responsable del laboratorio de cómputo, clubes de robótica educativa, pensamiento computacional y alfabetización digital segura.",
    skills: ["Robótica Lego/Arduino", "Python Básico", "Ciudadanía Digital", "Scratch / Makerspace"],
  },
  {
    id: "NAT-05",
    title: "Docente de Ciencias Naturales y Química",
    department: "Ciencias y Matemáticas",
    level: "Secundaria",
    type: "Tiempo Completo",
    experience: "3+ años",
    description: "Impartición de biología, química de laboratorio y proyectos de investigación ambiental para secundaria y bachillerato.",
    skills: ["Prácticas de Laboratorio", "Feria Científica", "Biología Celular", "Seguridad Química"],
  },
];

export default function CareersPage() {
  const [activeTab, setActiveTab] = useState<"positions" | "apply" | "track">("positions");

  // Form State
  const [form, setForm] = useState<CreateStaffApplicationInput>({
    schoolCode: "ESC002",
    firstName: "",
    lastName: "",
    identityNumber: "",
    email: "",
    phone: "",
    gender: "F",
    dateOfBirth: "",
    department: "Ciencias y Matemáticas",
    positionApplied: "",
    highestDegree: "Licenciatura",
    yearsOfExperience: 3,
    expectedSalary: 18500,
    resumeUrl: "",
    bio: "",
    address: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedApp, setSubmittedApp] = useState<any | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Tracker State
  const [trackRef, setTrackRef] = useState("");
  const [isTracking, setIsTracking] = useState(false);
  const [trackResult, setTrackResult] = useState<any | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);

  const handleSelectPosition = (pos: OpenPosition) => {
    setForm((prev) => ({
      ...prev,
      department: pos.department,
      positionApplied: pos.title,
    }));
    setActiveTab("apply");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.identityNumber || !form.email || !form.phone || !form.positionApplied) {
      setSubmitError("Por favor completa todos los campos requeridos marcados con *.");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      const res = await staffService.apply(form);
      if (res.status && res.data) {
        setSubmittedApp(res.data);
      } else {
        setSubmitError(res.message || "Error al enviar la postulación");
      }
    } catch (err: any) {
      console.error("Error submitting job application:", err);
      setSubmitError(err.message || "Error de conexión con el servidor");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackRef.trim()) return;

    try {
      setIsTracking(true);
      setTrackError(null);
      setTrackResult(null);
      const res = await staffService.getStatus(trackRef.trim());
      if (res.status && res.data) {
        setTrackResult(res.data);
      } else {
        setTrackError(res.message || "No se localizó la postulación");
      }
    } catch (err: any) {
      setTrackError(err.message || "No se encontró ningún expediente con ese código o DNI.");
    } finally {
      setIsTracking(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 selection:bg-neutral-900 selection:text-white">
      {/* Top Public Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-neutral-950 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              LS
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-950">Centro Educativo Luz del Saber</span>
              <span className="text-[10px] text-muted-foreground block -mt-1 font-medium">Portal de Oportunidades Laborales</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <Link href="/admissions" className="hover:text-primary transition-colors">
              Admisiones Alumnos
            </Link>
            <Link href="/application-status" className="hover:text-primary transition-colors">
              Rastreo Admisiones
            </Link>
            <button
              onClick={() => setActiveTab("track")}
              className="hover:text-primary transition-colors"
            >
              Consultar Mi Postulación
            </button>
            <Link href="/login">
              <Button size="sm" variant="outline" className="rounded-xl font-semibold">
                Acceso al Sistema
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 md:py-16 px-6 bg-gradient-to-b from-blue-50/60 via-slate-50/40 to-transparent border-b border-slate-200/60">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 text-blue-700 text-xs font-bold shadow-xs">
            <Briefcase className="h-3.5 w-3.5" />
            Convocatoria Docente 2026-2027
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-950">
            Únete a Nuestra Comunidad de Excelencia Educativa
          </h1>
          <p className="text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Formamos líderes con valores sólidos, calidez humana e innovación pedagógica. Si compartes la vocación de enseñar con impacto duradero, este es tu lugar.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs font-medium text-slate-700">
            <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
              <Sparkles className="h-4 w-4 text-amber-500" /> Remuneración Competitiva
            </span>
            <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
              <Award className="h-4 w-4 text-blue-500" /> Capacitación Continua
            </span>
            <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
              <HeartHandshake className="h-4 w-4 text-emerald-500" /> Clima Institucional Cálido
            </span>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        {/* Tab Switcher */}
        <div className="flex items-center justify-center">
          <div className="inline-flex p-1 rounded-2xl bg-slate-200/80 border border-slate-300/80 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("positions")}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeTab === "positions"
                  ? "bg-white text-slate-950 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              1. Plazas Disponibles ({OPEN_POSITIONS.length})
            </button>
            <button
              onClick={() => setActiveTab("apply")}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeTab === "apply"
                  ? "bg-white text-slate-950 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              2. Formulario de Postulación
            </button>
            <button
              onClick={() => setActiveTab("track")}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeTab === "track"
                  ? "bg-white text-slate-950 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              3. Estado de Mi Solicitud
            </button>
          </div>
        </div>

        {/* TAB 1: PLAZAS DISPONIBLES */}
        {activeTab === "positions" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-950">Convocatorias Abiertas</h2>
                <p className="text-xs text-muted-foreground">
                  Selecciona la plaza de tu interés para completar la postulación con los datos precargados.
                </p>
              </div>
              <Badge variant="outline" className="text-xs py-1 px-3 bg-white">
                Ciclo Académico 2026
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {OPEN_POSITIONS.map((pos) => (
                <Card
                  key={pos.id}
                  className="rounded-2xl border-slate-200 hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-0 text-[11px] font-semibold">
                        {pos.department}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground font-mono">{pos.id}</span>
                    </div>
                    <CardTitle className="text-lg font-bold text-slate-950 mt-2">{pos.title}</CardTitle>
                    <CardDescription className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                      <span>• {pos.level}</span>
                      <span>• {pos.type}</span>
                      <span>• Exp: {pos.experience}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <p className="text-xs text-slate-600 leading-relaxed">{pos.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {pos.skills.map((skill, i) => (
                        <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                    <Button
                      onClick={() => handleSelectPosition(pos)}
                      className="w-full gap-2 rounded-xl text-xs font-semibold shadow-xs"
                    >
                      Postularme a esta Plaza <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: FORMULARIO DE POSTULACIÓN */}
        {activeTab === "apply" && (
          <div className="max-w-3xl mx-auto">
            {submittedApp ? (
              <Card className="rounded-3xl border-emerald-500/30 bg-emerald-50/30 p-8 text-center space-y-6">
                <div className="h-16 w-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="h-9 w-9" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-950">¡Postulación Enviada con Éxito!</h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    Hemos recibido tus antecedentes para la plaza de <strong>{submittedApp.positionApplied}</strong>. Nuestro comité directivo revisará tu expediente a la brevedad.
                  </p>
                </div>

                <div className="bg-white border border-emerald-200 rounded-2xl p-5 max-w-sm mx-auto space-y-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Código Único de Seguimiento
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xl font-mono font-black text-emerald-700 tracking-wider">
                      {submittedApp.applicationNumber}
                    </span>
                    <button
                      onClick={() => handleCopyCode(submittedApp.applicationNumber)}
                      className="p-1.5 rounded-lg border hover:bg-slate-50 text-slate-600 transition-colors"
                      title="Copiar código"
                    >
                      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Guarda este número para verificar el avance de tu postulación y cita a entrevista.
                  </p>
                </div>

                <div className="flex justify-center gap-3">
                  <Button
                    onClick={() => {
                      setTrackRef(submittedApp.applicationNumber);
                      setActiveTab("track");
                    }}
                    variant="outline"
                    className="rounded-xl text-xs font-semibold bg-white"
                  >
                    Rastrear Estado de Postulación
                  </Button>
                  <Button
                    onClick={() => {
                      setSubmittedApp(null);
                      setActiveTab("positions");
                    }}
                    className="rounded-xl text-xs font-semibold"
                  >
                    Ver Otras Vacantes
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-200/80 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold text-slate-950">
                        Expediente de Postulación Docente
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 mt-1">
                        Ingresa tus datos personales, trayectoria académica y aspiración profesional.
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-white text-xs">
                      Convocatoria Oficial
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-6 md:p-8">
                  {submitError && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Bloque 1: Plaza de Interés */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-primary" />
                        1. Plaza y Área de Especialidad
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs font-semibold mb-1 block">Departamento Académico *</Label>
                          <select
                            className="w-full h-10 px-3 text-xs rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                            value={form.department}
                            onChange={(e) => setForm({ ...form, department: e.target.value })}
                            required
                          >
                            <option value="Ciencias y Matemáticas">Ciencias y Matemáticas</option>
                            <option value="Humanidades y Lenguaje">Humanidades y Lenguaje</option>
                            <option value="Educación Primaria">Educación Primaria</option>
                            <option value="Idiomas / Inglés">Idiomas / Inglés</option>
                            <option value="Tecnología e Informática">Tecnología e Informática</option>
                            <option value="Artes y Educación Física">Artes y Educación Física</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-xs font-semibold mb-1 block">Plaza a la que Postula *</Label>
                          <Input
                            placeholder="Ej. Docente de Matemáticas y Física"
                            value={form.positionApplied}
                            onChange={(e) => setForm({ ...form, positionApplied: e.target.value })}
                            className="h-10 text-xs rounded-xl"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bloque 2: Datos Personales */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        2. Datos Personales & Contacto
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs font-semibold mb-1 block">Nombres *</Label>
                          <Input
                            placeholder="Ej. Elena María"
                            value={form.firstName}
                            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                            className="h-10 text-xs rounded-xl"
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold mb-1 block">Apellidos *</Label>
                          <Input
                            placeholder="Ej. Vásquez Morales"
                            value={form.lastName}
                            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                            className="h-10 text-xs rounded-xl"
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold mb-1 block">Número de Identidad (DNI) *</Label>
                          <Input
                            placeholder="Ej. 0801-1992-05421"
                            value={form.identityNumber}
                            onChange={(e) => setForm({ ...form, identityNumber: e.target.value })}
                            className="h-10 text-xs rounded-xl font-mono"
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold mb-1 block">Correo Electrónico *</Label>
                          <Input
                            type="email"
                            placeholder="elena.vasquez@gmail.com"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="h-10 text-xs rounded-xl"
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold mb-1 block">Teléfono Móvil *</Label>
                          <Input
                            placeholder="(+504) 9845-1234"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            className="h-10 text-xs rounded-xl"
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold mb-1 block">Género</Label>
                          <select
                            className="w-full h-10 px-3 text-xs rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                            value={form.gender}
                            onChange={(e) => setForm({ ...form, gender: e.target.value })}
                          >
                            <option value="F">Femenino</option>
                            <option value="M">Masculino</option>
                            <option value="O">Otro / Prefiero no decir</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Bloque 3: Formación y Experiencia */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-primary" />
                        3. Trayectoria Académica & Laboral
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-xs font-semibold mb-1 block">Máximo Grado Académico</Label>
                          <select
                            className="w-full h-10 px-3 text-xs rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                            value={form.highestDegree}
                            onChange={(e) => setForm({ ...form, highestDegree: e.target.value })}
                          >
                            <option value="Licenciatura">Licenciatura</option>
                            <option value="Maestría">Maestría</option>
                            <option value="Doctorado">Doctorado</option>
                            <option value="Profesorado de Educación Media">Profesorado de Educación Media</option>
                            <option value="Técnico Superior">Técnico Superior</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-xs font-semibold mb-1 block">Años de Experiencia</Label>
                          <Input
                            type="number"
                            min="0"
                            max="40"
                            value={form.yearsOfExperience}
                            onChange={(e) => setForm({ ...form, yearsOfExperience: Number(e.target.value) })}
                            className="h-10 text-xs rounded-xl"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold mb-1 block">Aspiración Salarial (L.)</Label>
                          <Input
                            type="number"
                            step="500"
                            value={form.expectedSalary}
                            onChange={(e) => setForm({ ...form, expectedSalary: Number(e.target.value) })}
                            className="h-10 text-xs rounded-xl"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs font-semibold mb-1 block">Enlace a Currículum / LinkedIn / Portafolio</Label>
                        <Input
                          placeholder="https://drive.google.com/... o https://linkedin.com/in/..."
                          value={form.resumeUrl}
                          onChange={(e) => setForm({ ...form, resumeUrl: e.target.value })}
                          className="h-10 text-xs rounded-xl font-mono"
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-semibold mb-1 block">Carta de Presentación / Filosofía de Enseñanza</Label>
                        <textarea
                          rows={3}
                          placeholder="Cuéntanos brevemente sobre tu enfoque pedagógico, logros sobresalientes y por qué deseas unirte al Centro Educativo Luz del Saber..."
                          value={form.bio}
                          onChange={(e) => setForm({ ...form, bio: e.target.value })}
                          className="w-full p-3 rounded-xl border border-input bg-background text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActiveTab("positions")}
                        className="rounded-xl text-xs font-semibold"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-xl text-xs font-semibold gap-2 px-6 shadow-sm"
                      >
                        {isSubmitting ? (
                          <>Enviando Expediente...</>
                        ) : (
                          <>
                            <Send className="h-3.5 w-3.5" /> Enviar Postulación Oficial
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* TAB 3: RASTREADOR DE ESTADO */}
        {activeTab === "track" && (
          <div className="max-w-xl mx-auto space-y-6">
            <Card className="rounded-3xl border-slate-200 shadow-sm p-6 text-center space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
                <Search className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-950">Consulta el Avance de tu Postulación</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Ingresa tu código de seguimiento (ej. <code>STAFF-2026-0001</code>) o tu número de DNI.
                </p>
              </div>

              <form onSubmit={handleTrack} className="flex gap-2">
                <Input
                  placeholder="Código STAFF-XXXX o DNI..."
                  value={trackRef}
                  onChange={(e) => setTrackRef(e.target.value)}
                  className="h-10 text-xs rounded-xl font-mono"
                  required
                />
                <Button type="submit" disabled={isTracking} className="rounded-xl text-xs font-semibold px-5">
                  {isTracking ? "Buscando..." : "Consultar"}
                </Button>
              </form>

              {trackError && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs text-left">
                  {trackError}
                </div>
              )}
            </Card>

            {trackResult && (
              <Card className="rounded-3xl border-slate-200 shadow-md overflow-hidden bg-white">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block">EXPEDIENTE</span>
                    <span className="font-mono font-bold text-sm text-slate-900">{trackResult.applicationNumber}</span>
                  </div>
                  <Badge
                    className={`text-xs px-3 py-1 font-semibold ${
                      trackResult.status === "HIRED"
                        ? "bg-emerald-500 text-white"
                        : trackResult.status === "INTERVIEWED"
                        ? "bg-blue-600 text-white"
                        : trackResult.status === "SHORTLISTED"
                        ? "bg-purple-600 text-white"
                        : trackResult.status === "REJECTED"
                        ? "bg-rose-600 text-white"
                        : "bg-amber-500 text-white"
                    }`}
                  >
                    {trackResult.status === "HIRED"
                      ? "CONTRATADO(A)"
                      : trackResult.status === "INTERVIEWED"
                      ? "EN ENTREVISTA"
                      : trackResult.status === "SHORTLISTED"
                      ? "PRESELECCIONADO(A)"
                      : trackResult.status === "REJECTED"
                      ? "NO SELECCIONADO"
                      : "EN REVISIÓN"}
                  </Badge>
                </div>

                <div className="p-6 space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 block">Candidato(a):</span>
                      <span className="font-bold text-slate-900 text-sm">{trackResult.candidateName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Plaza:</span>
                      <span className="font-medium text-slate-800">{trackResult.positionApplied}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Departamento:</span>
                      <span className="font-medium text-slate-800">{trackResult.department}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Última Actualización:</span>
                      <span className="font-medium text-slate-800">
                        {new Date(trackResult.updatedAt).toLocaleDateString("es-ES")}
                      </span>
                    </div>
                  </div>

                  {trackResult.adminNotes && (
                    <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 leading-relaxed">
                      <strong>Mensaje del Comité de Selección:</strong>
                      <p className="mt-1">{trackResult.adminNotes}</p>
                    </div>
                  )}

                  {trackResult.status === "HIRED" && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-center font-medium">
                      🎉 ¡Felicidades! Has sido seleccionado(a) como parte del cuerpo docente oficial de nuestra institución. Revisa tu correo electrónico para detalles de inducción y bienvenida.
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

