"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  CheckCircle2,
  Clock,
  CheckCircle,
  XCircle,
  GraduationCap,
  Building,
  User,
  Users,
  Calendar,
  FileText,
  Printer,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { admissionsService, PublicAdmissionStatus } from "@/lib/services/admissions.service";

function TrackerContent() {
  const searchParams = useSearchParams();
  const initialRef = searchParams.get("ref") || "";

  const [query, setQuery] = useState(initialRef);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PublicAdmissionStatus | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchStatus = async (refCode: string) => {
    if (!refCode || !refCode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await admissionsService.getStatus(refCode.trim());
      setResult(res.data);
    } catch (err: any) {
      setResult(null);
      setError(
        err?.response?.data?.message ||
        `No se encontró ninguna postulación con el número o DNI "${refCode}". Por favor verifica los datos.`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialRef) {
      fetchStatus(initialRef);
    }
  }, [initialRef]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStatus(query);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStepState = (status: string, stepIndex: number) => {
    // 0: PENDING, 1: IN_REVIEW, 2: APPROVED, 3: ENROLLED
    const statusMap: Record<string, number> = {
      PENDING: 0,
      IN_REVIEW: 1,
      APPROVED: 2,
      ENROLLED: 3,
      REJECTED: -1,
    };

    const currentRank = statusMap[status] ?? 0;
    if (status === "REJECTED") {
      return stepIndex === 0 ? "completed" : "rejected";
    }

    if (currentRank > stepIndex) return "completed";
    if (currentRank === stepIndex) return "current";
    return "upcoming";
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      {/* Encabezado Superior */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight">Centro Educativo Luz del Saber</span>
              <p className="text-xs text-slate-500 dark:text-slate-400">Portal Público de Admisiones • Rastreo de Postulación</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admissions">
              <Button variant="outline" size="sm" className="hidden sm:inline-flex rounded-xl">
                Nueva Solicitud
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                Portal Institucional
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full">
        {/* Cabecera del Buscador */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="outline" className="px-3 py-1 mb-3 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-xs font-semibold rounded-full">
            Seguimiento en Tiempo Real
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Consulta el Estado de tu Postulación
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
            Ingresa tu código de solicitud (ej. <span className="font-mono font-semibold text-blue-600">APP-2026-0042</span>) o el DNI del postulante/tutor para conocer en qué fase se encuentra tu trámite.
          </p>

          {/* Formulario de Búsqueda */}
          <form onSubmit={handleSearch} className="mt-8 flex flex-col sm:flex-row gap-2 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Código (APP-2026-XXXX) o DNI..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 h-12 rounded-xl text-base bg-white dark:bg-slate-900 shadow-sm border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !query.trim()}
              className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Consultando...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Buscar</span>
                </>
              )}
            </Button>
          </form>

          {/* Sugerencias Rápidas */}
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500">
            <span>Ejemplo de prueba:</span>
            <button
              type="button"
              onClick={() => {
                setQuery("APP-2026-0042");
                fetchStatus("APP-2026-0042");
              }}
              className="font-mono text-blue-600 dark:text-blue-400 hover:underline"
            >
              APP-2026-0042
            </button>
          </div>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="mb-8 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 flex items-start gap-3 text-sm animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-semibold">No se encontraron resultados</p>
              <p className="mt-0.5 text-amber-700 dark:text-amber-300">{error}</p>
            </div>
          </div>
        )}

        {/* Tarjeta de Resultados */}
        {result && (
          <Card className="rounded-3xl shadow-xl border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 transition-all duration-300">
            {/* Banner Superior con Estado Principal */}
            <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold tracking-wider uppercase text-blue-300">
                    Expediente Oficial de Admisión
                  </span>
                  <Badge className="bg-white/10 text-white border-white/20 text-xs">
                    {result.schoolCode}
                  </Badge>
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <h2 className="text-2xl sm:text-3xl font-mono font-black tracking-tight">
                    {result.applicationNumber}
                  </h2>
                  <button
                    onClick={() => copyToClipboard(result.applicationNumber)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="Copiar código"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-sm text-slate-300 mt-1">
                  Postulante: <strong className="text-white font-semibold">{result.firstName} {result.lastName}</strong>
                </p>
              </div>

              {/* Status Pill Badge */}
              <div className="flex items-center gap-2 self-start sm:self-center">
                {result.status === "PENDING" && (
                  <Badge className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-200 border-amber-400/30 text-sm font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    En Espera de Revisión
                  </Badge>
                )}
                {result.status === "IN_REVIEW" && (
                  <Badge className="px-4 py-2 rounded-xl bg-sky-500/20 text-sky-200 border-sky-400/30 text-sm font-semibold flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
                    En Evaluación de Expediente
                  </Badge>
                )}
                {result.status === "APPROVED" && (
                  <Badge className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-200 border-emerald-400/30 text-sm font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Aceptada • Pendiente Matrícula
                  </Badge>
                )}
                {result.status === "ENROLLED" && (
                  <Badge className="px-4 py-2 rounded-xl bg-purple-500/20 text-purple-200 border-purple-400/30 text-sm font-semibold flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-purple-300" />
                    Estudiante Matriculado Oficialmente
                  </Badge>
                )}
                {result.status === "REJECTED" && (
                  <Badge className="px-4 py-2 rounded-xl bg-rose-500/20 text-rose-200 border-rose-400/30 text-sm font-semibold flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-400" />
                    Solicitud No Aprobada
                  </Badge>
                )}
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-8">
              {/* Stepper Visual de Progreso */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6">
                  Línea de Tiempo del Trámite
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                  {/* Paso 1: Recibida */}
                  {(() => {
                    const state = getStepState(result.status, 0);
                    return (
                      <div className={`p-4 rounded-2xl border transition-all ${
                        state === "completed"
                          ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                          : state === "current"
                          ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700 ring-2 ring-amber-400/30"
                          : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
                      }`}>
                        <div className="flex items-center gap-2.5 mb-2">
                          {state === "completed" ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          ) : state === "current" ? (
                            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-pulse" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center text-xs text-slate-400">1</div>
                          )}
                          <span className="font-bold text-sm">1. Recibida</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Solicitud registrada en la base de datos oficial.
                        </p>
                      </div>
                    );
                  })()}

                  {/* Paso 2: En Revisión */}
                  {(() => {
                    const state = getStepState(result.status, 1);
                    return (
                      <div className={`p-4 rounded-2xl border transition-all ${
                        state === "completed"
                          ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                          : state === "current"
                          ? "bg-sky-50 dark:bg-sky-950/20 border-sky-300 dark:border-sky-700 ring-2 ring-sky-400/30"
                          : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
                      }`}>
                        <div className="flex items-center gap-2.5 mb-2">
                          {state === "completed" ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          ) : state === "current" ? (
                            <Loader2 className="w-5 h-5 text-sky-600 dark:text-sky-400 animate-spin" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center text-xs text-slate-400">2</div>
                          )}
                          <span className="font-bold text-sm">2. En Revisión</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Comité verifica antecedentes académicos y cupos.
                        </p>
                      </div>
                    );
                  })()}

                  {/* Paso 3: Aprobada */}
                  {(() => {
                    const state = getStepState(result.status, 2);
                    return (
                      <div className={`p-4 rounded-2xl border transition-all ${
                        state === "completed"
                          ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                          : state === "current"
                          ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-400/30"
                          : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
                      }`}>
                        <div className="flex items-center gap-2.5 mb-2">
                          {state === "completed" ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          ) : state === "current" ? (
                            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center text-xs text-slate-400">3</div>
                          )}
                          <span className="font-bold text-sm">3. Aprobada</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Cupo reservado con éxito para el período escolar.
                        </p>
                      </div>
                    );
                  })()}

                  {/* Paso 4: Matriculada */}
                  {(() => {
                    const state = getStepState(result.status, 3);
                    return (
                      <div className={`p-4 rounded-2xl border transition-all ${
                        state === "completed" || state === "current"
                          ? "bg-purple-50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-700 ring-2 ring-purple-400/30"
                          : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
                      }`}>
                        <div className="flex items-center gap-2.5 mb-2">
                          {state === "completed" || state === "current" ? (
                            <GraduationCap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center text-xs text-slate-400">4</div>
                          )}
                          <span className="font-bold text-sm">4. Matriculado</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Cuenta de estudiante activa y credenciales emitidas.
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Observaciones Administrativas (si existen) */}
              {result.adminNotes && (
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300 font-semibold text-sm mb-1">
                    <FileText className="w-4 h-4" />
                    <span>Nota del Comité de Admisiones:</span>
                  </div>
                  <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                    {result.adminNotes}
                  </p>
                </div>
              )}

              {/* Detalle Resumido en Cuadrícula */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Grado Postulado</span>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                    {result.gradeCode}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Tutor Legal Declarado</span>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    {result.parentName}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Fecha de Solicitud</span>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {new Date(result.createdAt).toLocaleDateString("es-HN", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Última Actualización</span>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {new Date(result.updatedAt).toLocaleTimeString("es-HN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              {/* Botonera de Acciones */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  className="w-full sm:w-auto rounded-xl flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Comprobante</span>
                </Button>

                {result.status === "ENROLLED" ? (
                  <Link href="/login" className="w-full sm:w-auto">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                      <span>Iniciar Sesión en el Portal Estudiantil</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/admissions" className="w-full sm:w-auto">
                    <Button variant="ghost" className="w-full text-slate-600 dark:text-slate-400 hover:text-slate-900 rounded-xl">
                      Registrar otra postulación
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </Card>
        )}
      </main>

      {/* Pie de Página */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 Centro Educativo Luz del Saber. Todos los derechos reservados.</span>
          <span className="font-mono text-slate-400">Sistema Escolar v2.4 • Módulo de Admisiones</span>
        </div>
      </footer>
    </div>
  );
}

export default function ApplicationStatusTrackerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    }>
      <TrackerContent />
    </Suspense>
  );
}
