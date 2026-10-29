"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  User,
  Users,
  Calendar,
  Phone,
  Mail,
  Home,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Printer,
  Sparkles,
  Building,
  Search,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { admissionsService, CreateAdmissionInput, AdmissionApplication } from "@/lib/services/admissions.service";

const GRADES = [
  { code: "KINDER", name: "Educación Prebásica • Kínder" },
  { code: "PREPARATORIA", name: "Educación Prebásica • Preparatoria" },
  { code: "PRIMERO", name: "1° Grado de Primaria" },
  { code: "SEGUNDO", name: "2° Grado de Primaria" },
  { code: "TERCERO", name: "3° Grado de Primaria" },
  { code: "CUARTO", name: "4° Grado de Primaria" },
  { code: "QUINTO", name: "5° Grado de Primaria" },
  { code: "SEXTO", name: "6° Grado de Primaria" },
  { code: "SEPTIMO", name: "7° Grado (I de Ciclo Común)" },
  { code: "OCTAVO", name: "8° Grado (II de Ciclo Común)" },
  { code: "NOVENO", name: "9° Grado (III de Ciclo Común)" },
  { code: "DECIMO_BTP", name: "10° Bachillerato Técnico Profesional (BTP)" },
  { code: "ONCEAVO_BTP", name: "11° Bachillerato Técnico Profesional (BTP)" },
  { code: "DECIMO_BCH", name: "10° Bachillerato en Ciencias y Humanidades" },
  { code: "ONCEAVO_BCH", name: "11° Bachillerato en Ciencias y Humanidades" },
];

export default function AdmissionsPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<CreateAdmissionInput>({
    schoolCode: "ESC002",
    firstName: "",
    lastName: "",
    identityNumber: "",
    dateOfBirth: "2016-01-15",
    gender: "MASCULINO",
    gradeCode: "PRIMERO",
    previousSchool: "",
    parentFirstName: "",
    parentLastName: "",
    parentIdentityNumber: "",
    parentPhone: "",
    parentEmail: "",
    parentRelationship: "MADRE",
    address: "",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedApplication, setSubmittedApplication] = useState<AdmissionApplication | null>(null);

  const handleChange = (field: keyof CreateAdmissionInput, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validaciones básicas en cliente
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrorMessage("Por favor ingresa el nombre y apellido completo del alumno.");
      return;
    }
    if (!formData.dateOfBirth) {
      setErrorMessage("La fecha de nacimiento del aspirante es obligatoria.");
      return;
    }
    if (!formData.parentFirstName.trim() || !formData.parentLastName.trim()) {
      setErrorMessage("Por favor ingresa los datos completos del padre o tutor legal.");
      return;
    }
    if (!formData.parentIdentityNumber.trim()) {
      setErrorMessage("El DNI o documento de identidad del tutor es obligatorio.");
      return;
    }
    if (!formData.parentPhone.trim()) {
      setErrorMessage("El teléfono móvil de contacto del tutor es obligatorio.");
      return;
    }
    if (!formData.parentEmail.trim() || !formData.parentEmail.includes("@")) {
      setErrorMessage("Por favor ingresa un correo electrónico válido para el tutor.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await admissionsService.apply(formData);
      if (res && res.status && res.data) {
        setSubmittedApplication(res.data);
      } else {
        setErrorMessage(res.message || "Error al procesar la solicitud de admisión.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Ocurrió un error al enviar el formulario.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pantalla de Éxito / Comprobante Oficial
  if (submittedApplication) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] bg-dot-pattern flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 selection:bg-neutral-900 selection:text-white">
        <div className="w-full max-w-2xl bg-white rounded-3xl border border-neutral-200 shadow-2xl p-6 sm:p-10 space-y-8 animate-in fade-in zoom-in-95 duration-200">
          <div className="text-center space-y-3">
            <div className="size-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg ring-8 ring-emerald-50">
              <CheckCircle2 className="size-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight">
              ¡Solicitud de Admisión Registrada!
            </h1>
            <p className="text-sm text-neutral-500 max-w-md mx-auto">
              Hemos recibido tu postulación oficial. El equipo de Admisiones y Dirección revisará los antecedentes escolares.
            </p>
          </div>

          {/* APPLICATION CODE CARD */}
          <div className="p-6 rounded-2xl bg-neutral-950 text-white space-y-3 text-center shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <GraduationCap className="size-24 text-lime-400" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-lime-400 font-mono">
              Código Único de Solicitud
            </span>
            <p className="text-3xl sm:text-4xl font-black tracking-tight font-mono text-white select-all">
              {submittedApplication.applicationNumber}
            </p>
            <p className="text-xs text-neutral-400">
              Guarda este código para consultar el avance de tu trámite en cualquier momento.
            </p>
          </div>

          {/* APPLICATION DETAILS SUMMARY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs">
            <div>
              <span className="text-neutral-400 font-semibold uppercase text-[10px] tracking-wider">
                Aspirante
              </span>
              <p className="text-sm font-bold text-neutral-900 mt-0.5">
                {submittedApplication.firstName} {submittedApplication.lastName}
              </p>
              <p className="text-neutral-500">
                Grado: <strong className="text-neutral-700">{submittedApplication.gradeCode}</strong>
              </p>
            </div>

            <div>
              <span className="text-neutral-400 font-semibold uppercase text-[10px] tracking-wider">
                Tutor Responsable
              </span>
              <p className="text-sm font-bold text-neutral-900 mt-0.5">
                {submittedApplication.parentFirstName} {submittedApplication.parentLastName}
              </p>
              <p className="text-neutral-500">
                Tel: <strong className="text-neutral-700">{submittedApplication.parentPhone}</strong> • {submittedApplication.parentRelationship}
              </p>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Link
              href={`/application-status?code=${encodeURIComponent(submittedApplication.applicationNumber)}`}
              className="w-full sm:flex-1"
            >
              <Button className="w-full h-11 rounded-xl bg-lime-400 hover:bg-lime-500 text-neutral-950 font-bold text-xs gap-2 cursor-pointer shadow-sm">
                <span>Rastrear Estado en Vivo</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>

            <Button
              type="button"
              onClick={() => window.print()}
              variant="outline"
              className="w-full sm:w-auto h-11 px-5 rounded-xl border-neutral-300 text-neutral-700 hover:bg-neutral-100 font-semibold text-xs gap-2 cursor-pointer"
            >
              <Printer className="size-4" />
              <span>Imprimir Comprobante</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Formulario de Postulación Principal
  return (
    <div className="min-h-screen bg-[#f8f9fa] bg-dot-pattern selection:bg-neutral-900 selection:text-white pb-16">
      {/* PUBLIC NAVBAR */}
      <header className="h-16 px-4 sm:px-8 bg-white/90 backdrop-blur-xl border-b border-neutral-200 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-neutral-950 text-white flex items-center justify-center font-bold shadow-xs">
            <span className="text-lime-400 text-base font-black">E</span>
          </div>
          <div>
            <span className="text-sm font-black tracking-tight text-neutral-900 uppercase">
              EDUSYS • CENTRO EDUCATIVO LUZ DEL SABER
            </span>
            <p className="text-[10px] text-neutral-400 font-medium">Portal Público de Admisiones</p>
          </div>
        </div>

        <Link
          href="/application-status"
          className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 hover:text-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-200 bg-white shadow-2xs hover:bg-neutral-50 transition-colors"
        >
          <Search className="size-3.5 text-neutral-500" />
          <span>Rastrear mi Solicitud</span>
        </Link>
      </header>

      {/* HERO BANNER */}
      <div className="max-w-4xl mx-auto px-4 pt-10 pb-6 text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-100 border border-lime-200 text-lime-900 text-xs font-bold shadow-2xs">
          <Sparkles className="size-3.5 text-lime-600" />
          <span>Inscripciones Abiertas • Ciclo Lectivo 2026</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-neutral-950 tracking-tight">
          Formulario Oficial de Admisión Escolar
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 max-w-xl mx-auto">
          Completa los datos del aspirante y tutor. Al enviar, recibirás un código de rastreo para consultar el dictamen de admisión en tiempo real sin requerir usuario ni contraseña.
        </p>
      </div>

      {/* FORM CONTAINER */}
      <div className="max-w-4xl mx-auto px-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs font-bold flex items-center gap-2.5 animate-in fade-in-50">
              <AlertCircle className="size-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* SECTION 1: DATOS DEL ALUMNO */}
          <Card className="p-6 sm:p-8 border-neutral-200/90 bg-white rounded-3xl shadow-2xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
              <div className="size-9 rounded-xl bg-neutral-950 text-white flex items-center justify-center font-bold">
                <GraduationCap className="size-5 text-lime-400" />
              </div>
              <div>
                <h2 className="text-base font-black text-neutral-900">1. Datos del Aspirante</h2>
                <p className="text-xs text-neutral-400">Información básica del estudiante que solicita ingreso</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700">Nombres del Alumno *</Label>
                <Input
                  required
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  placeholder="Ej. Mateo Alejandro"
                  className="rounded-xl border-neutral-200 text-xs py-5"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700">Apellidos del Alumno *</Label>
                <Input
                  required
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  placeholder="Ej. Ramírez Flores"
                  className="rounded-xl border-neutral-200 text-xs py-5"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700">DNI / Número de Identidad (Opcional)</Label>
                <Input
                  value={formData.identityNumber || ""}
                  onChange={(e) => handleChange("identityNumber", e.target.value)}
                  placeholder="Ej. 0801201509876"
                  className="rounded-xl border-neutral-200 text-xs py-5 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700">Fecha de Nacimiento *</Label>
                <Input
                  required
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                  className="rounded-xl border-neutral-200 text-xs py-5"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700">Género *</Label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleChange("gender", e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-neutral-950"
                >
                  <option value="MASCULINO">Masculino</option>
                  <option value="FEMENINO">Femenino</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700">Grado al que Postula *</Label>
                <select
                  value={formData.gradeCode}
                  onChange={(e) => handleChange("gradeCode", e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-neutral-950"
                >
                  {GRADES.map((g) => (
                    <option key={g.code} value={g.code}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700">Escuela o Kínder de Procedencia</Label>
                <Input
                  value={formData.previousSchool || ""}
                  onChange={(e) => handleChange("previousSchool", e.target.value)}
                  placeholder="Ej. Kínder Los Pinos (o Primer Ingreso si no asistió antes)"
                  className="rounded-xl border-neutral-200 text-xs py-5"
                />
              </div>
            </div>
          </Card>

          {/* SECTION 2: DATOS DEL TUTOR */}
          <Card className="p-6 sm:p-8 border-neutral-200/90 bg-white rounded-3xl shadow-2xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
              <div className="size-9 rounded-xl bg-neutral-950 text-white flex items-center justify-center font-bold">
                <Users className="size-5 text-lime-400" />
              </div>
              <div>
                <h2 className="text-base font-black text-neutral-900">2. Datos del Padre / Tutor Legal</h2>
                <p className="text-xs text-neutral-400">Persona responsable de contacto y compromisos escolares</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700">Nombres del Tutor *</Label>
                <Input
                  required
                  value={formData.parentFirstName}
                  onChange={(e) => handleChange("parentFirstName", e.target.value)}
                  placeholder="Ej. Laura María"
                  className="rounded-xl border-neutral-200 text-xs py-5"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700">Apellidos del Tutor *</Label>
                <Input
                  required
                  value={formData.parentLastName}
                  onChange={(e) => handleChange("parentLastName", e.target.value)}
                  placeholder="Ej. Ramírez Zelaya"
                  className="rounded-xl border-neutral-200 text-xs py-5"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700">DNI / Número de Identidad del Tutor *</Label>
                <Input
                  required
                  value={formData.parentIdentityNumber}
                  onChange={(e) => handleChange("parentIdentityNumber", e.target.value)}
                  placeholder="Ej. 0801198812345"
                  className="rounded-xl border-neutral-200 text-xs py-5 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700">Parentesco con el Alumno *</Label>
                <select
                  value={formData.parentRelationship}
                  onChange={(e) => handleChange("parentRelationship", e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-neutral-950"
                >
                  <option value="MADRE">Madre</option>
                  <option value="PADRE">Padre</option>
                  <option value="TUTOR LEGAL">Tutor Legal / Encargado</option>
                  <option value="ABUELO">Abuelo / Abuela</option>
                  <option value="TIO">Tío / Tía</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700">Teléfono Móvil (WhatsApp) *</Label>
                <Input
                  required
                  value={formData.parentPhone}
                  onChange={(e) => handleChange("parentPhone", e.target.value)}
                  placeholder="Ej. 98765432 o (+504) 9876-5432"
                  className="rounded-xl border-neutral-200 text-xs py-5"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700">Correo Electrónico *</Label>
                <Input
                  required
                  type="email"
                  value={formData.parentEmail}
                  onChange={(e) => handleChange("parentEmail", e.target.value)}
                  placeholder="tutor@gmail.com"
                  className="rounded-xl border-neutral-200 text-xs py-5"
                />
              </div>
            </div>
          </Card>

          {/* SECTION 3: RESIDENCIA Y OBSERVACIONES */}
          <Card className="p-6 sm:p-8 border-neutral-200/90 bg-white rounded-3xl shadow-2xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
              <div className="size-9 rounded-xl bg-neutral-950 text-white flex items-center justify-center font-bold">
                <Home className="size-5 text-lime-400" />
              </div>
              <div>
                <h2 className="text-base font-black text-neutral-900">3. Residencia y Observaciones</h2>
                <p className="text-xs text-neutral-400">Ubicación y detalles complementarios para el expediente</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700">Dirección Residencial de la Familia</Label>
                <Input
                  value={formData.address || ""}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Colonia, calle, bloque o número de casa, ciudad"
                  className="rounded-xl border-neutral-200 text-xs py-5"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700">Notas u Observaciones Adicionales</Label>
                <textarea
                  rows={3}
                  value={formData.notes || ""}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder="Comentarios sobre alergias, necesidades especiales, solicitudes de transporte, becas o hermanos ya inscritos..."
                  className="w-full p-3 rounded-xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-neutral-950 bg-white"
                />
              </div>
            </div>
          </Card>

          {/* SUBMIT BUTTON */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 px-8 rounded-2xl bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin text-lime-400" />
                  <span>Enviando Solicitud...</span>
                </>
              ) : (
                <>
                  <span>Enviar Solicitud de Admisión</span>
                  <ArrowRight className="size-4 text-lime-400" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

