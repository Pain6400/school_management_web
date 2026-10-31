"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { plansService, Plan } from "@/lib/services/plans.service";
import {
  Loader2, Plus, Edit, Trash2, CheckCircle2, Shield, CreditCard,
  Users, HardDrive, Sparkles, RefreshCw, AlertCircle, Clock, Zap
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogBody, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const INITIAL_FORM = {
  code: "",
  name: "",
  description: "",
  price: 99.99,
  durationDays: 365,
  maxStudents: 200,
  maxTeachers: 25,
  maxStorageMb: 2048,
  features: "Aula Virtual, Control de Asistencias, Calificaciones, Finanzas & Caja, Diplomas con QR",
  status: true,
};

export default function PlansManagementPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await plansService.getPlans();
      if (res.status && Array.isArray(res.data)) {
        setPlans(res.data);
      }
    } catch (err) {
      console.error("Error loading plans:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleOpenCreate = () => {
    setEditingCode(null);
    setFormData(INITIAL_FORM);
    setError(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (plan: Plan) => {
    setEditingCode(plan.code);
    setFormData({
      code: plan.code,
      name: plan.name,
      description: plan.description || "",
      price: plan.price || 0,
      durationDays: plan.durationDays || 365,
      maxStudents: plan.maxStudents || 100,
      maxTeachers: plan.maxTeachers || 10,
      maxStorageMb: plan.maxStorageMb || 1024,
      features: Array.isArray(plan.features) ? plan.features.join(", ") : (plan.features || ""),
      status: plan.status !== undefined ? plan.status : true,
    });
    setError(null);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setIsSubmitting(true);
      const featuresArray = formData.features
        ? formData.features.split(",").map((f) => f.trim()).filter(Boolean)
        : [];

      const payload = {
        ...formData,
        price: Number(formData.price),
        durationDays: Number(formData.durationDays),
        maxStudents: Number(formData.maxStudents),
        maxTeachers: Number(formData.maxTeachers),
        maxStorageMb: Number(formData.maxStorageMb),
        features: featuresArray,
      };

      let res;
      if (editingCode) {
        res = await plansService.updatePlan(editingCode, payload);
      } else {
        res = await plansService.createPlan(payload);
      }

      if (res.status) {
        setIsDialogOpen(false);
        fetchPlans();
      } else {
        setError(res.message || "Error al procesar el plan");
      }
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`¿Estás seguro de eliminar el plan "${code}"?`)) return;
    try {
      await plansService.deletePlan(code);
      fetchPlans();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
              Catálogo de Planes SaaS
            </h2>
            <Badge className="bg-neutral-950 text-lime-400 font-bold border border-lime-400/40">
              Suscripciones Plataforma
            </Badge>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Configura los paquetes de suscripción, límites de alumnos y almacenamiento que ofreces a los colegios clientes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPlans}
            disabled={loading}
            className="rounded-xl text-xs font-semibold"
          >
            <RefreshCw className={`size-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Recargar
          </Button>
          <Button 
            onClick={handleOpenCreate}
            size="sm"
            className="rounded-xl px-4 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="size-4 text-lime-400" />
            <span>Nuevo Plan</span>
          </Button>
        </div>
      </div>

      {/* PLANS GRID */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-2">
          <Loader2 className="size-8 animate-spin text-neutral-900" />
          <p className="text-xs text-neutral-500 font-medium">Cargando catálogo de planes...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center space-y-2 bg-white rounded-3xl border border-neutral-200">
          <CreditCard className="size-12 text-neutral-300 stroke-1" />
          <p className="text-sm font-bold text-neutral-800">No hay planes registrados</p>
          <p className="text-xs text-neutral-400">Haz clic en &quot;Nuevo Plan&quot; para registrar el primero.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((p) => {
            const isPopular = p.code === "PREMIUM";
            const isFree = p.price === 0;

            return (
              <Card 
                key={p.code}
                className={`rounded-3xl border transition-all flex flex-col justify-between relative overflow-hidden shadow-xs hover:shadow-md ${
                  isPopular 
                    ? "border-neutral-950 ring-2 ring-neutral-950/10 bg-white" 
                    : "border-neutral-200/90 bg-white"
                }`}
              >
                {isPopular && (
                  <div className="bg-neutral-950 text-lime-400 text-[10px] font-black uppercase tracking-widest text-center py-1 font-mono">
                    Plan Más Popular
                  </div>
                )}

                <div>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="font-mono text-xs font-bold uppercase tracking-wider bg-neutral-50">
                        {p.code}
                      </Badge>
                      {p.status ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-200 text-neutral-700">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-xl font-black text-neutral-900 leading-tight">
                      {p.name}
                    </CardTitle>
                    <CardDescription className="text-xs text-neutral-500 line-clamp-2 min-h-[32px]">
                      {p.description || "Plan estándar para centros educativos."}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* PRICE DISPLAY */}
                    <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-baseline gap-1">
                      <span className="text-3xl font-black text-neutral-900">
                        ${Number(p.price || 0).toFixed(2)}
                      </span>
                      <span className="text-xs text-neutral-500 font-semibold">/ año</span>
                    </div>

                    {/* LIMITS SPECS */}
                    <div className="space-y-2 text-xs text-neutral-600">
                      <div className="flex items-center justify-between pb-1.5 border-b border-neutral-100">
                        <span className="flex items-center gap-1.5 text-neutral-500 font-medium">
                          <Users className="size-3.5 text-neutral-400" />
                          Alumnos Permitidos
                        </span>
                        <span className="font-bold text-neutral-900 font-mono">
                          {p.maxStudents}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pb-1.5 border-b border-neutral-100">
                        <span className="flex items-center gap-1.5 text-neutral-500 font-medium">
                          <Shield className="size-3.5 text-neutral-400" />
                          Docentes Máximos
                        </span>
                        <span className="font-bold text-neutral-900 font-mono">
                          {p.maxTeachers}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pb-1.5 border-b border-neutral-100">
                        <span className="flex items-center gap-1.5 text-neutral-500 font-medium">
                          <HardDrive className="size-3.5 text-neutral-400" />
                          Almacenamiento R2
                        </span>
                        <span className="font-bold text-neutral-900 font-mono">
                          {p.maxStorageMb >= 1024 
                            ? `${(p.maxStorageMb / 1024).toFixed(1)} GB` 
                            : `${p.maxStorageMb} MB`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-neutral-500 font-medium">
                          <Clock className="size-3.5 text-neutral-400" />
                          Ciclo de Vigencia
                        </span>
                        <span className="font-bold text-neutral-900 font-mono">
                          {p.durationDays} días
                        </span>
                      </div>
                    </div>

                    {/* FEATURES INCLUDED */}
                    {p.features && p.features.length > 0 && (
                      <div className="pt-2 border-t border-neutral-100 space-y-1.5">
                        <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                          Módulos Incluidos
                        </div>
                        {p.features.slice(0, 4).map((f, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-xs text-neutral-700">
                            <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="leading-tight">{f}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </div>

                {/* CARD ACTIONS */}
                <div className="p-4 pt-0 border-t border-neutral-100 flex items-center justify-between gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-xl text-xs font-bold"
                    onClick={() => handleOpenEdit(p)}
                  >
                    <Edit className="size-3.5 mr-1.5" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                    onClick={() => handleDelete(p.code)}
                    title="Eliminar plan"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CREAR / EDITAR PLAN SAAS                                */}
      {/* ============================================================== */}
      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => { setIsDialogOpen(open); if (open) setError(null); }}
      >
        <DialogContent size="lg">
          <form onSubmit={handleSubmit} className="flex flex-col">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="size-9 rounded-xl bg-neutral-950 text-lime-400 flex items-center justify-center">
                  <CreditCard className="size-5" />
                </div>
                <div>
                  <DialogTitle>{editingCode ? "Editar Plan SaaS" : "Crear Nuevo Plan de Servicio"}</DialogTitle>
                  <DialogDescription>
                    Define el nombre, límites de estudiantes, docentes y precio de facturación anual para las escuelas.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <DialogBody className="space-y-5">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="size-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700">
                    Código Único del Plan <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="Ej. BASIC, PREMIUM, ENTERPRISE"
                    disabled={!!editingCode}
                    required
                    className="h-11 rounded-xl text-xs font-mono uppercase px-4"
                  />
                  {!editingCode && <p className="text-[10px] text-neutral-400">Identificador en mayúsculas sin espacios</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700">
                    Nombre del Plan <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej. Plan Básico Escolar"
                    required
                    className="h-11 rounded-xl text-xs px-4"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700">
                    Precio Anual (USD) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    required
                    className="h-11 rounded-xl text-xs px-4 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700">
                    Duración (Días)
                  </Label>
                  <Input
                    type="number"
                    value={formData.durationDays}
                    onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value, 10) || 365 })}
                    required
                    className="h-11 rounded-xl text-xs px-4 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700">
                    Límite Máximo de Estudiantes <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={formData.maxStudents}
                    onChange={(e) => setFormData({ ...formData, maxStudents: parseInt(e.target.value, 10) || 50 })}
                    required
                    className="h-11 rounded-xl text-xs px-4 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700">
                    Límite Máximo de Docentes
                  </Label>
                  <Input
                    type="number"
                    value={formData.maxTeachers}
                    onChange={(e) => setFormData({ ...formData, maxTeachers: parseInt(e.target.value, 10) || 10 })}
                    required
                    className="h-11 rounded-xl text-xs px-4 font-mono"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold text-neutral-700">
                    Almacenamiento Máximo en MB (Cloudflare R2)
                  </Label>
                  <Input
                    type="number"
                    value={formData.maxStorageMb}
                    onChange={(e) => setFormData({ ...formData, maxStorageMb: parseInt(e.target.value, 10) || 1024 })}
                    required
                    className="h-11 rounded-xl text-xs px-4 font-mono"
                  />
                  <p className="text-[10px] text-neutral-400">1024 MB = 1 GB | 2048 MB = 2 GB | 5120 MB = 5 GB</p>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold text-neutral-700">
                    Descripción del Plan
                  </Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Breve resumen de para qué tamaño de colegio está pensado"
                    className="h-11 rounded-xl text-xs px-4"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold text-neutral-700">
                    Módulos y Características (separados por coma)
                  </Label>
                  <Input
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    placeholder="Aula Virtual, Finanzas, Diplomas con QR, Pase de Asistencia"
                    className="h-11 rounded-xl text-xs px-4"
                  />
                </div>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
                className="rounded-xl text-xs font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl px-5 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 size-3.5 animate-spin" /> Guardando...</>
                ) : (
                  editingCode ? "Actualizar Plan" : "Crear Plan"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
