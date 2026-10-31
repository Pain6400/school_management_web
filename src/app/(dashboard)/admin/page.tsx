"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, Building2, CreditCard, Users, ArrowRight, AlertTriangle, 
  CheckCircle2, DollarSign, Clock, RefreshCw, Calendar
} from "lucide-react";
import Link from "next/link";
import { schoolsService, SaasOverviewData } from "@/lib/services/schools.service";

export default function AdminPage() {
  const [data, setData] = useState<SaasOverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await schoolsService.getSaasOverview();
      if (res.status && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Error loading SaaS overview:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const kpis = data?.kpis;
  const overdueSchools = data?.schools.filter((s) => s.subscription.debtStatus === "OVERDUE") || [];
  const expiringSoonSchools = data?.schools.filter((s) => s.subscription.debtStatus === "EXPIRING_SOON") || [];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-200/80">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-neutral-950 text-lime-400 flex items-center justify-center shadow-xs">
            <Shield className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                Panel Super Admin SaaS
              </h2>
              <Badge className="bg-lime-400 text-neutral-950 font-bold hover:bg-lime-500">
                Creador del Sistema
              </Badge>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Supervisión de clientes, cobros de suscripciones a escuelas y control de mora global.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="rounded-xl text-xs font-semibold"
          >
            <RefreshCw className={`size-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Link href="/admin/schools">
            <Button size="sm" className="rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold shadow-xs">
              Gestionar Escuelas
              <ArrowRight className="size-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* METRICS KPIS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* ESCUELAS ACTIVAS */}
        <Card className="rounded-2xl border-neutral-200/90 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-neutral-600">Escuelas Clientes</CardTitle>
            <div className="p-2 rounded-xl bg-neutral-100 text-neutral-900">
              <Building2 className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-neutral-900">
              {loading ? "..." : `${kpis?.activeSchools || 0} / ${kpis?.totalSchools || 0}`}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1">
              <span className="font-semibold text-emerald-600">{kpis?.activeSchools || 0} activas</span> en la plataforma
            </p>
          </CardContent>
        </Card>

        {/* ESCUELAS EN MORA */}
        <Card className={`rounded-2xl border-neutral-200/90 shadow-2xs ${kpis && kpis.schoolsInDebt > 0 ? "border-rose-200 bg-rose-50/20" : ""}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-neutral-600">Escuelas en Mora</CardTitle>
            <div className={`p-2 rounded-xl ${kpis && kpis.schoolsInDebt > 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
              <AlertTriangle className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl sm:text-3xl font-black ${kpis && kpis.schoolsInDebt > 0 ? "text-rose-600" : "text-neutral-900"}`}>
              {loading ? "..." : kpis?.schoolsInDebt || 0}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              {kpis && kpis.schoolsInDebt > 0 ? (
                <span className="text-rose-600 font-semibold">Requieren cobro o suspensión</span>
              ) : (
                <span className="text-emerald-600 font-semibold">Todas las suscripciones al día</span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* ALUMNOS MATRICULADOS TOTAL */}
        <Card className="rounded-2xl border-neutral-200/90 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-neutral-600">Alumnos en Plataforma</CardTitle>
            <div className="p-2 rounded-xl bg-blue-100 text-blue-800">
              <Users className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-neutral-900">
              {loading ? "..." : kpis?.totalStudentsPlatform || 0}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              Estudiantes activos distribuidos en todas las escuelas
            </p>
          </CardContent>
        </Card>

        {/* RECAUDACIÓN Y MRR */}
        <Card className="rounded-2xl border-neutral-200/90 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-neutral-600">Recaudación Total SaaS</CardTitle>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <DollarSign className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">
              {loading ? "..." : `$${(kpis?.totalCollected || 0).toFixed(2)}`}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              MRR estimado activo: <span className="font-semibold text-neutral-800">${(kpis?.mrr || 0).toFixed(2)}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ALERTAS DE MORA Y VENCIMIENTOS */}
      {(overdueSchools.length > 0 || expiringSoonSchools.length > 0) && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <Clock className="size-4 text-amber-500" />
            Atención Inmediata de Suscripciones SaaS
          </h3>

          <div className="grid gap-3 sm:grid-cols-2">
            {overdueSchools.map((s) => (
              <div 
                key={s.code}
                className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs bg-rose-200 text-rose-900 px-2 py-0.5 rounded-md font-mono">
                      {s.code}
                    </span>
                    <span className="font-bold text-sm truncate">{s.name}</span>
                  </div>
                  <p className="text-xs text-rose-700 mt-1">
                    Venció hace <strong>{s.subscription.daysOverdue} días</strong> ({s.subscription.endDate?.split("T")[0]}). Plan {s.plan.name} (${s.plan.price}).
                  </p>
                </div>
                <Link href={`/admin/schools?search=${s.code}`}>
                  <Button size="sm" className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0">
                    Cobrar / Regularizar
                  </Button>
                </Link>
              </div>
            ))}

            {expiringSoonSchools.map((s) => (
              <div 
                key={s.code}
                className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md font-mono">
                      {s.code}
                    </span>
                    <span className="font-bold text-sm truncate">{s.name}</span>
                  </div>
                  <p className="text-xs text-amber-700 mt-1">
                    Vence en <strong>{s.subscription.daysRemaining} días</strong> ({s.subscription.endDate?.split("T")[0]}). Plan {s.plan.name}.
                  </p>
                </div>
                <Link href={`/admin/schools?search=${s.code}`}>
                  <Button size="sm" variant="outline" className="rounded-xl border-amber-300 text-amber-900 hover:bg-amber-100 text-xs font-bold shrink-0">
                    Ver Estado
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QUICK ACCESS MODULES */}
      <div className="grid gap-5 md:grid-cols-3">
        <Card className="rounded-3xl border-neutral-200/90 shadow-xs hover:border-neutral-300 transition-all flex flex-col justify-between">
          <CardHeader>
            <div className="size-10 rounded-xl bg-neutral-950 text-lime-400 flex items-center justify-center mb-2">
              <Building2 className="size-5" />
            </div>
            <CardTitle className="text-base font-bold">Escuelas & Suscripciones</CardTitle>
            <CardDescription className="text-xs">
              Supervisión de escuelas, cupos de alumnos, estado de mora e historial de cobros.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/schools">
              <Button className="w-full justify-between rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs shadow-xs">
                <span>Ver Escuelas & Mora</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-neutral-200/90 shadow-xs hover:border-neutral-300 transition-all flex flex-col justify-between">
          <CardHeader>
            <div className="size-10 rounded-xl bg-lime-100 text-lime-900 flex items-center justify-center mb-2">
              <Users className="size-5" />
            </div>
            <CardTitle className="text-base font-bold">Usuarios & Roles Globales</CardTitle>
            <CardDescription className="text-xs">
              Crea el Administrador Escolar para una nueva escuela, docentes, directores o cajeros con roles diferenciados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/users">
              <Button className="w-full justify-between rounded-xl bg-lime-400 hover:bg-lime-500 text-neutral-950 font-bold text-xs shadow-xs">
                <span>Crear & Gestionar Usuarios</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-neutral-200/90 shadow-xs hover:border-neutral-300 transition-all flex flex-col justify-between">
          <CardHeader>
            <div className="size-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2">
              <CreditCard className="size-5" />
            </div>
            <CardTitle className="text-base font-bold">Planes de Servicio SaaS</CardTitle>
            <CardDescription className="text-xs">
              Precios y límites de alumnos (FREE, BASIC, PREMIUM, ENTERPRISE).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/schools">
              <Button variant="outline" className="w-full justify-between rounded-xl font-bold text-xs">
                <span>Configurar Planes</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
