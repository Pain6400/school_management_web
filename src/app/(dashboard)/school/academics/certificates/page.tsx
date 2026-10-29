"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Award, ShieldCheck, Printer, Check, GraduationCap,
  Building2, Calendar, User, Search, CheckCircle2, QrCode, Download,
  ChevronRight, Sparkles, Sliders
} from "lucide-react";
import { academicsService, AcademicYear, Grade } from "@/lib/services/academics.service";
import { enrollmentsService, StudentEnrollment } from "@/lib/services/enrollments.service";
import Link from "next/link";

type CertificateTemplate = "ENROLLMENT" | "HONOR" | "CONDUCT" | "COMPLETION";

interface TemplateOption {
  id: CertificateTemplate;
  title: string;
  subtitle: string;
  badge: string;
  icon: any;
  color: string;
}

const TEMPLATES: TemplateOption[] = [
  {
    id: "ENROLLMENT",
    title: "Constancia de Estudio",
    subtitle: "Acredita matrícula activa y grado en curso",
    badge: "Oficial",
    icon: FileText,
    color: "from-blue-600 to-indigo-600",
  },
  {
    id: "HONOR",
    title: "Diploma de Honor al Mérito",
    subtitle: "Distinción por excelencia académica y esfuerzo",
    badge: "Mérito",
    icon: Award,
    color: "from-amber-500 to-yellow-600",
  },
  {
    id: "CONDUCT",
    title: "Constancia de Buena Conducta",
    subtitle: "Certifica disciplina y valores institucionales",
    badge: "Disciplina",
    icon: ShieldCheck,
    color: "from-emerald-600 to-teal-600",
  },
  {
    id: "COMPLETION",
    title: "Certificado de Culminación",
    subtitle: "Aprobación de ciclo y promoción de grado",
    badge: "Egreso",
    icon: GraduationCap,
    color: "from-purple-600 to-indigo-600",
  },
];

export default function CertificatesPage() {
  const { user } = useAuthStore();
  const schoolCode = user?.schoolCode || "ESC002";
  const schoolName = "Centro Educativo Luz del Saber";

  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate>("HONOR");
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Selected Student
  const [searchStudent, setSearchStudent] = useState("");
  const [selectedEnrollment, setSelectedEnrollment] = useState<StudentEnrollment | null>(null);

  // Customizer options
  const [authorityName, setAuthorityName] = useState("Licda. Carmen Mendoza");
  const [authorityTitle, setAuthorityTitle] = useState("Directora General");
  const [secretaryName, setSecretaryName] = useState("Lic. Roberto Morales");
  const [secretaryTitle, setSecretaryTitle] = useState("Secretaría Académica");
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [honorAverage, setHonorAverage] = useState("98.5%");
  const [customRemarks, setCustomRemarks] = useState("");
  const [showSeal, setShowSeal] = useState(true);
  const [showQr, setShowQr] = useState(true);
  const [showWatermark, setShowWatermark] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await enrollmentsService.getStudentEnrollments(schoolCode);
        if (res.status && res.data) {
          setEnrollments(res.data);
          if (res.data.length > 0) {
            setSelectedEnrollment(res.data[0]);
          }
        }
      } catch (err) {
        console.error("Error loading enrollments for certificates:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [schoolCode]);

  // Filtered students for dropdown/selector
  const filteredEnrollments = useMemo(() => {
    if (!searchStudent.trim()) return enrollments;
    const q = searchStudent.toLowerCase();
    return enrollments.filter((e) => {
      const u = e.student?.user;
      const name = `${u?.firstName || ""} ${u?.lastName || ""}`.toLowerCase();
      const dni = (u?.nationalId || "").toLowerCase();
      return name.includes(q) || dni.includes(q);
    });
  }, [enrollments, searchStudent]);

  const handlePrint = () => {
    window.print();
  };

  // Helper date formatter: "29 de octubre de 2026"
  const formattedDate = useMemo(() => {
    try {
      const [year, month, day] = issueDate.split("-");
      const d = new Date(Number(year), Number(month) - 1, Number(day));
      return d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
    } catch {
      return issueDate;
    }
  }, [issueDate]);

  const studentUser = selectedEnrollment?.student?.user;
  const studentFullName = studentUser
    ? `${studentUser.firstName || ""} ${studentUser.lastName || ""}`.trim()
    : "Nombre del Estudiante";
  const studentDni = studentUser?.nationalId || "0501199710597";
  const studentGradeName = selectedEnrollment?.grade?.name || selectedEnrollment?.gradeCode || "Primer Grado";
  const academicYearName = selectedEnrollment?.academicYear?.name || "Ciclo Lectivo 2024";

  return (
    <div className="space-y-6 pb-20">
      {/* Print styles injection */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-certificate, #printable-certificate * {
            visibility: visible !important;
          }
          #printable-certificate {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 24px !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/school/academics/years" className="hover:underline">
              Gestión Académica
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Certificados & Diplomas</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Emisión de Certificados & Diplomas Oficiales
          </h1>
          <p className="text-sm text-muted-foreground">
            Diseña, personaliza e imprime constancias de estudio, reconocimientos de honor y diplomas con sello y validación QR.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/school/enrollments/promotion">
            <Button variant="outline" className="gap-2 shadow-sm rounded-xl">
              <GraduationCap className="h-4 w-4 text-primary" />
              Promoción Masiva (Rollover)
            </Button>
          </Link>
          <Button
            onClick={handlePrint}
            className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-md font-semibold px-5"
          >
            <Printer className="h-4 w-4" />
            Imprimir / Guardar PDF
          </Button>
        </div>
      </div>

      {/* Main Grid: Controls (Left) vs Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Controls Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6 no-print">
          {/* Template Selection Cards */}
          <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
              <CardTitle className="text-base flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" />
                1. Selecciona el Tipo de Documento
              </CardTitle>
              <CardDescription className="text-xs">
                Formatos homologados con validez legal e institucional.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TEMPLATES.map((tmpl) => {
                const Icon = tmpl.icon;
                const isSelected = selectedTemplate === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    data-testid={`template-${tmpl.id}`}
                    type="button"
                    onClick={() => setSelectedTemplate(tmpl.id)}
                    className={`text-left p-3.5 rounded-xl border transition-all text-xs relative flex flex-col justify-between gap-2 ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                        : "border-border/70 hover:border-border hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className={`h-8 w-8 rounded-lg bg-gradient-to-tr ${tmpl.color} text-white flex items-center justify-center shadow-xs`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                        {tmpl.badge}
                      </Badge>
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-sm leading-tight">{tmpl.title}</div>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{tmpl.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Student Selector Card */}
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                2. Selecciona al Estudiante
              </CardTitle>
              <CardDescription className="text-xs">
                Carga automática de datos de matrícula, grado y expediente.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filtrar estudiante por nombre o DNI..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="pl-9 text-xs h-9 rounded-lg"
                />
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {loading ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">Cargando nómina...</div>
                ) : filteredEnrollments.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">No se encontraron estudiantes</div>
                ) : (
                  filteredEnrollments.map((enr) => {
                    const u = enr.student?.user;
                    const name = `${u?.firstName || ""} ${u?.lastName || ""}`.trim() || "Estudiante";
                    const isCurrent = selectedEnrollment?.id === enr.id;

                    return (
                      <button
                        key={enr.id}
                        type="button"
                        onClick={() => setSelectedEnrollment(enr)}
                        className={`w-full text-left p-2.5 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                          isCurrent
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border/60 hover:bg-muted/40 text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center font-bold text-[11px] shrink-0">
                            {name.charAt(0)}
                          </div>
                          <div className="truncate">
                            <div className="font-semibold truncate">{name}</div>
                            <div className="text-[11px] text-muted-foreground">
                              {enr.grade?.name || enr.gradeCode || "Sin grado"} • DNI: {u?.nationalId || "N/A"}
                            </div>
                          </div>
                        </div>
                        {isCurrent && <Check className="h-4 w-4 text-primary shrink-0 ml-2" />}
                      </button>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Customizer Details Card */}
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                3. Personalización del Documento
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                    Nombre Directora/Autoridad
                  </Label>
                  <Input
                    value={authorityName}
                    onChange={(e) => setAuthorityName(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                    Cargo de la Autoridad
                  </Label>
                  <Input
                    value={authorityTitle}
                    onChange={(e) => setAuthorityTitle(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                    Secretaría / Refrendo
                  </Label>
                  <Input
                    value={secretaryName}
                    onChange={(e) => setSecretaryName(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                    Fecha de Emisión
                  </Label>
                  <Input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {selectedTemplate === "HONOR" && (
                <div>
                  <Label className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mb-1 block">
                    Promedio o Mérito Destacado
                  </Label>
                  <Input
                    value={honorAverage}
                    onChange={(e) => setHonorAverage(e.target.value)}
                    placeholder="Ej. Promedio 98.5% — Primer Lugar de Honor"
                    className="h-8 text-xs border-amber-500/40"
                  />
                </div>
              )}

              <div>
                <Label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                  Observaciones / Nota Adicional (Opcional)
                </Label>
                <textarea
                  rows={2}
                  value={customRemarks}
                  onChange={(e) => setCustomRemarks(e.target.value)}
                  placeholder="Detalles sobre solvencia, beca, conducta o recomendación especial..."
                  className="w-full p-2 rounded-lg border border-input bg-background text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              {/* Toggles */}
              <div className="pt-2 border-t border-border/50 grid grid-cols-3 gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSeal}
                    onChange={(e) => setShowSeal(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <span className="text-[11px]">Sello Oficial</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showQr}
                    onChange={(e) => setShowQr(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <span className="text-[11px]">Código QR</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showWatermark}
                    onChange={(e) => setShowWatermark(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <span className="text-[11px]">Marca de Agua</span>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Document Preview Sheet (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-3 text-xs text-muted-foreground px-1 no-print">
            <span className="font-medium text-foreground">Vista Previa Oficial (Hoja Carta / A4)</span>
            <span>Optimizado para impresión en alta fidelidad</span>
          </div>

          {/* Printable Document Sheet Container */}
          <div
            id="printable-certificate"
            className={`w-full max-w-[700px] bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 transition-all duration-300 relative overflow-hidden p-8 sm:p-12 ${
              selectedTemplate === "HONOR" ? "border-amber-400/80" : ""
            }`}
            style={{ minHeight: "880px" }}
          >
            {/* Watermark in background */}
            {showWatermark && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035] select-none">
                <GraduationCap className="w-[480px] h-[480px] text-slate-950" />
              </div>
            )}

            {/* Template 1: Constancia de Estudio */}
            {selectedTemplate === "ENROLLMENT" && (
              <div className="space-y-8 flex flex-col justify-between h-full relative z-10">
                {/* Header */}
                <div className="text-center space-y-2 border-b-2 border-slate-900 pb-6">
                  <div className="flex items-center justify-center gap-3 mb-1">
                    <div className="h-14 w-14 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-bold text-xl shadow-md">
                      LS
                    </div>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-900 font-serif">
                    {schoolName}
                  </h2>
                  <p className="text-xs text-slate-600 font-medium tracking-wide">
                    Resolución Ministerial No. 0492-SE • Código Institucional: {schoolCode}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Boulevard del Norte, San Pedro Sula, Honduras • Tel: (+504) 2550-1234
                  </p>
                </div>

                {/* Title */}
                <div className="text-center py-2">
                  <span className="inline-block px-4 py-1 text-xs font-semibold tracking-widest uppercase bg-slate-100 rounded-full text-slate-700 mb-2">
                    Documento Oficial de Registro
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight font-serif text-slate-900">
                    Constancia de Estudio & Matrícula
                  </h3>
                </div>

                {/* Body Text */}
                <div className="space-y-6 text-slate-800 text-sm sm:text-base leading-relaxed text-justify px-2 font-serif">
                  <p>
                    La suscrita Dirección General del <strong>{schoolName}</strong>, por medio del presente documento hace constar formalmente que:
                  </p>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center my-4">
                    <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Nombre del Alumno(a)</div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-950 uppercase tracking-wide">
                      {studentFullName}
                    </div>
                    <div className="text-xs text-slate-600 font-mono mt-1">
                      Identidad / DNI: <strong>{studentDni}</strong> • Matrícula No: <strong>{selectedEnrollment?.id || "N/A"}</strong>
                    </div>
                  </div>

                  <p>
                    Se encuentra debidamente inscrito(a) y cursando de manera activa y regular sus estudios en el grado:
                  </p>

                  <div className="text-center font-bold text-lg text-blue-950 uppercase py-1 border-y border-slate-200">
                    {studentGradeName} — {academicYearName}
                  </div>

                  <p>
                    Habiendo cumplido a la fecha con todos los requisitos de ingreso y normativas académicas vigentes en este centro formativo.
                  </p>

                  {customRemarks && (
                    <div className="text-xs italic bg-blue-50/50 p-3 rounded-lg border border-blue-100 text-slate-700">
                      <strong>Observación:</strong> {customRemarks}
                    </div>
                  )}

                  <p>
                    Y a petición de la parte interesada y para los fines legales que estime convenientes, se extiende la presente constancia en la ciudad sede, a los <strong>{formattedDate}</strong>.
                  </p>
                </div>

                {/* Signatures & Seal */}
                <div className="pt-12 grid grid-cols-2 gap-8 items-end text-center mt-auto">
                  <div className="space-y-1">
                    <div className="h-16 flex items-center justify-center font-serif italic text-slate-400 text-lg">
                      {authorityName}
                    </div>
                    <div className="border-t border-slate-800 pt-2 font-bold text-xs uppercase tracking-wide text-slate-900">
                      {authorityName}
                    </div>
                    <div className="text-[11px] text-slate-500">{authorityTitle}</div>
                  </div>

                  <div className="space-y-1 relative">
                    {showSeal && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full border-2 border-red-700/60 text-red-700/70 flex flex-col items-center justify-center text-[9px] font-black uppercase text-center rotate-[-12deg] pointer-events-none p-1">
                        <div className="text-[8px]">SELLO OFICIAL</div>
                        <div className="font-bold">{schoolCode}</div>
                        <div className="text-[7px]">DIRECCIÓN</div>
                      </div>
                    )}
                    <div className="h-16 flex items-center justify-center font-serif italic text-slate-400 text-lg">
                      {secretaryName}
                    </div>
                    <div className="border-t border-slate-800 pt-2 font-bold text-xs uppercase tracking-wide text-slate-900">
                      {secretaryName}
                    </div>
                    <div className="text-[11px] text-slate-500">{secretaryTitle}</div>
                  </div>
                </div>

                {/* Footer Validation */}
                {showQr && (
                  <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-9 w-9 text-slate-800" />
                      <div>
                        <div className="font-mono font-semibold text-slate-800">
                          VERIF-DOC: {selectedEnrollment?.id || "000"}-{studentDni.slice(-4)}-{new Date().getFullYear()}
                        </div>
                        <div>Validable en portal escolar oficial /doc-verify</div>
                      </div>
                    </div>
                    <div className="text-right">
                      Página 1 de 1 • Emisión Oficial Digitalizada
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Template 2: Diploma de Honor al Mérito */}
            {selectedTemplate === "HONOR" && (
              <div className="border-[6px] border-double border-amber-600 p-6 sm:p-8 flex flex-col justify-between h-full relative z-10 text-center">
                {/* Ornamental top */}
                <div className="space-y-3">
                  <div className="flex justify-center mb-1">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-amber-500 to-amber-700 text-white flex items-center justify-center shadow-lg border-2 border-white">
                      <Award className="h-9 w-9" />
                    </div>
                  </div>
                  <h3 className="text-xs uppercase tracking-[0.25em] font-semibold text-amber-800">
                    {schoolName}
                  </h3>
                  <h1 className="text-3xl sm:text-4xl font-extrabold uppercase font-serif tracking-tight text-slate-950 py-1">
                    Diploma de Honor
                  </h1>
                  <p className="text-sm font-serif italic text-amber-900 font-medium">
                    Al Mérito & la Excelencia Académica
                  </p>
                </div>

                {/* Awarded To */}
                <div className="my-6 space-y-3">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-medium">
                    Se otorga con orgullo y felicitación a:
                  </p>
                  <div className="text-2xl sm:text-3xl font-black font-serif text-slate-900 tracking-wide underline decoration-amber-500 decoration-2 underline-offset-8">
                    {studentFullName}
                  </div>
                  <p className="text-xs text-slate-600 font-mono">DNI: {studentDni}</p>
                </div>

                {/* Statement */}
                <div className="space-y-3 px-4 text-xs sm:text-sm text-slate-700 font-serif leading-relaxed">
                  <p>
                    En reconocimiento a su extraordinario compromiso, dedicación perseverante y virtudes demostradas durante el grado:
                  </p>
                  <div className="font-bold text-base text-slate-900 uppercase">
                    {studentGradeName} • {academicYearName}
                  </div>
                  <div className="inline-block bg-amber-50 border border-amber-300 px-4 py-1.5 rounded-full font-bold text-xs text-amber-900 shadow-xs">
                    {honorAverage}
                  </div>
                  {customRemarks && (
                    <p className="text-xs italic text-slate-600">{customRemarks}</p>
                  )}
                  <p className="text-xs text-slate-500 pt-2">
                    Dado a los {formattedDate}.
                  </p>
                </div>

                {/* Signatures */}
                <div className="pt-8 grid grid-cols-2 gap-8 text-center mt-6">
                  <div className="space-y-1">
                    <div className="border-t border-slate-700 pt-2 font-bold text-xs uppercase text-slate-900">
                      {authorityName}
                    </div>
                    <div className="text-[10px] text-slate-500">{authorityTitle}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="border-t border-slate-700 pt-2 font-bold text-xs uppercase text-slate-900">
                      {secretaryName}
                    </div>
                    <div className="text-[10px] text-slate-500">{secretaryTitle}</div>
                  </div>
                </div>

                {/* QR bottom */}
                {showQr && (
                  <div className="pt-4 flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-100 mt-4">
                    <span>Certificación de Honor • {schoolCode}</span>
                    <span className="font-mono">FOLIO: HON-{selectedEnrollment?.id || "00"}-{studentDni.slice(-4)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Template 3: Buena Conducta */}
            {selectedTemplate === "CONDUCT" && (
              <div className="space-y-8 flex flex-col justify-between h-full relative z-10">
                <div className="text-center space-y-2 border-b-2 border-emerald-900 pb-6">
                  <div className="flex items-center justify-center gap-3 mb-1">
                    <div className="h-14 w-14 rounded-2xl bg-emerald-900 text-white flex items-center justify-center font-bold text-xl shadow-md">
                      <ShieldCheck className="h-8 w-8" />
                    </div>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-900 font-serif">
                    {schoolName}
                  </h2>
                  <p className="text-xs text-slate-600 font-medium">Comité de Convivencia y Orientación Estudiantil</p>
                </div>

                <div className="text-center py-2">
                  <h3 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight font-serif text-slate-900">
                    Constancia de Buena Conducta
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">
                    Certificación de Valores y Disciplina
                  </p>
                </div>

                <div className="space-y-6 text-slate-800 text-sm sm:text-base leading-relaxed text-justify px-2 font-serif">
                  <p>
                    La Coordinación de Disciplina y Orientación del <strong>{schoolName}</strong> certifica que el alumno(a):
                  </p>

                  <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 text-center my-2">
                    <div className="text-xl font-bold text-slate-950 uppercase">{studentFullName}</div>
                    <div className="text-xs text-slate-600 font-mono mt-1">DNI: {studentDni}</div>
                  </div>

                  <p>
                    Durante su permanencia y trayectoria en el <strong>{studentGradeName}</strong> durante el ciclo lectivo <strong>{academicYearName}</strong>, ha observado una conducta <strong>EJEMPLAR</strong>, demostrando un alto sentido de responsabilidad, respeto irrestricto hacia sus docentes y compañeros, acatamiento cabal al Reglamento Interno y sólido compromiso cívico.
                  </p>

                  <p>
                    No registra sanciones disciplinarias, faltas graves ni amonestaciones en su expediente estudiantil.
                  </p>

                  {customRemarks && (
                    <div className="text-xs italic bg-muted/40 p-3 rounded-lg border text-slate-700">
                      <strong>Nota Especial:</strong> {customRemarks}
                    </div>
                  )}

                  <p>
                    Se extiende la presente en testimonio de lo expuesto a los <strong>{formattedDate}</strong>.
                  </p>
                </div>

                <div className="pt-12 grid grid-cols-2 gap-8 text-center mt-auto">
                  <div className="space-y-1">
                    <div className="border-t border-slate-800 pt-2 font-bold text-xs uppercase text-slate-900">
                      {authorityName}
                    </div>
                    <div className="text-[11px] text-slate-500">{authorityTitle}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="border-t border-slate-800 pt-2 font-bold text-xs uppercase text-slate-900">
                      Lic. Marcela Varela
                    </div>
                    <div className="text-[11px] text-slate-500">Consejería y Orientación</div>
                  </div>
                </div>

                {showQr && (
                  <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-mono">COD: COND-{selectedEnrollment?.id || "00"}</span>
                    <span>Registro Oficial de Disciplina</span>
                  </div>
                )}
              </div>
            )}

            {/* Template 4: Culminación de Grado */}
            {selectedTemplate === "COMPLETION" && (
              <div className="space-y-8 flex flex-col justify-between h-full relative z-10">
                <div className="text-center space-y-2 border-b-2 border-purple-900 pb-6">
                  <div className="flex items-center justify-center gap-3 mb-1">
                    <div className="h-14 w-14 rounded-2xl bg-purple-900 text-white flex items-center justify-center font-bold text-xl shadow-md">
                      <GraduationCap className="h-8 w-8" />
                    </div>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-900 font-serif">
                    {schoolName}
                  </h2>
                  <p className="text-xs text-slate-600 font-medium">Secretaría Académica General</p>
                </div>

                <div className="text-center py-2">
                  <h3 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight font-serif text-slate-900">
                    Certificado de Aprobación & Culminación
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">
                    Acreditación de Grado y Promoción
                  </p>
                </div>

                <div className="space-y-6 text-slate-800 text-sm sm:text-base leading-relaxed text-justify px-2 font-serif">
                  <p>
                    Se hace constar formalmente que el estudiante:
                  </p>

                  <div className="bg-purple-50/50 border border-purple-200 rounded-xl p-4 text-center my-2">
                    <div className="text-2xl font-bold text-slate-950 uppercase">{studentFullName}</div>
                    <div className="text-xs text-slate-600 font-mono mt-1">DNI: {studentDni}</div>
                  </div>

                  <p>
                    Ha cursado y aprobado satisfactoriamente todos los espacios curriculares y asignaturas correspondientes al nivel de:
                  </p>

                  <div className="text-center font-bold text-lg text-purple-950 uppercase py-2 bg-purple-50/30 rounded-lg border border-purple-100">
                    {studentGradeName} — {academicYearName}
                  </div>

                  <p>
                    Por cuanto queda facultado(a) y promovido(a) para cursar el siguiente nivel del plan educativo correspondiente.
                  </p>

                  {customRemarks && (
                    <div className="text-xs italic bg-muted/40 p-3 rounded-lg border text-slate-700">
                      <strong>Anotación:</strong> {customRemarks}
                    </div>
                  )}

                  <p>
                    Dado y firmado para los efectos oficiales correspondientes a los <strong>{formattedDate}</strong>.
                  </p>
                </div>

                <div className="pt-12 grid grid-cols-2 gap-8 text-center mt-auto">
                  <div className="space-y-1">
                    <div className="border-t border-slate-800 pt-2 font-bold text-xs uppercase text-slate-900">
                      {authorityName}
                    </div>
                    <div className="text-[11px] text-slate-500">{authorityTitle}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="border-t border-slate-800 pt-2 font-bold text-xs uppercase text-slate-900">
                      {secretaryName}
                    </div>
                    <div className="text-[11px] text-slate-500">{secretaryTitle}</div>
                  </div>
                </div>

                {showQr && (
                  <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-mono">REG-APROB: {selectedEnrollment?.id || "00"}-{studentDni.slice(-4)}</span>
                    <span>Libro de Actas y Calificaciones Oficiales</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

