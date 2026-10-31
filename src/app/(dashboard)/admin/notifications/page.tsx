"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bell, AlertTriangle, CheckCircle2, Clock, Building2, CreditCard,
  Users, RefreshCw, CheckCheck, ArrowRight, ShieldAlert, Sparkles, Filter
} from "lucide-react";
import Link from "next/link";

interface SaasNotification {
  id: string;
  type: "CRITICAL_OVERDUE" | "PLAN_CAPACITY" | "PAYMENT_REPORTED" | "NEW_SCHOOL";
  title: string;
  description: string;
  schoolCode?: string;
  schoolName?: string;
  timeAgo: string;
  amount?: number;
  read: boolean;
  actionUrl: string;
  actionLabel: string;
}

const INITIAL_NOTIFICATIONS: SaasNotification[] = [
  {
    id: "notif-1",
    type: "CRITICAL_OVERDUE",
    title: "Suscripción Escolar en Mora Crítica (18 días)",
    description: "Colegio San Jerónimo (ESC002) tiene la suscripción del Plan Básico vencida. No se ha recibido el pago correspondiente al ciclo anual.",
    schoolCode: "ESC002",
    schoolName: "Colegio San Jerónimo",
    timeAgo: "Hace 2 horas",
    amount: 99.99,
    read: false,
    actionUrl: "/admin/schools",
    actionLabel: "Gestionar Cobro SaaS",
  },
  {
    id: "notif-2",
    type: "PLAN_CAPACITY",
    title: "Límite de Estudiantes al 96% de Capacidad",
    description: "Colegio Bilingüe San José (ESC001) ha matriculado 192 de los 200 estudiantes permitidos en su Plan Básico. Requiere oferta de actualización a Plan Premium.",
    schoolCode: "ESC001",
    schoolName: "Colegio Bilingüe San José",
    timeAgo: "Hace 5 horas",
    read: false,
    actionUrl: "/admin/schools",
    actionLabel: "Ver Escuela & Upgrade",
  },
  {
    id: "notif-3",
    type: "PAYMENT_REPORTED",
    title: "Comprobante de Transferencia Reportado",
    description: "Instituto Montessori reportó una transferencia bancaria por $299.99 para renovación de su Plan Premium. Requiere verificación y aprobación contable.",
    schoolCode: "ESC003",
    schoolName: "Instituto Montessori",
    timeAgo: "Ayer, 4:30 PM",
    amount: 299.99,
    read: false,
    actionUrl: "/admin/schools",
    actionLabel: "Verificar Comprobante",
  },
  {
    id: "notif-4",
    type: "NEW_SCHOOL",
    title: "Nueva Institución Incorporada a la Plataforma",
    description: "Academia Internacional San Lucas completó su registro inicial en el Plan Gratuito (Free) con capacidad de 50 alumnos.",
    schoolCode: "ESC004",
    schoolName: "Academia Internacional San Lucas",
    timeAgo: "Hace 2 días",
    read: true,
    actionUrl: "/admin/schools",
    actionLabel: "Ver Expediente Escolar",
  },
];

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<SaasNotification[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<"ALL" | "CRITICAL" | "CAPACITY" | "PAYMENTS">("ALL");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleToggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const filtered = notifications.filter((n) => {
    if (filter === "CRITICAL") return n.type === "CRITICAL_OVERDUE";
    if (filter === "CAPACITY") return n.type === "PLAN_CAPACITY";
    if (filter === "PAYMENTS") return n.type === "PAYMENT_REPORTED";
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
              Centro de Notificaciones SaaS
            </h2>
            {unreadCount > 0 && (
              <Badge className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-2.5 py-0.5">
                {unreadCount} Nuevas
              </Badge>
            )}
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Alertas de cobranza de suscripciones, límites de capacidad de planes y eventos clave de las escuelas clientes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="rounded-xl text-xs font-semibold gap-1.5"
          >
            <CheckCheck className="size-3.5 text-neutral-600" />
            <span>Marcar todas como leídas</span>
          </Button>
          <Link href="/admin">
            <Button
              size="sm"
              className="rounded-xl px-4 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold gap-1.5 shadow-xs"
            >
              <Building2 className="size-3.5 text-lime-400" />
              <span>Consola SaaS</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI METRICS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-neutral-200/90 shadow-2xs bg-white p-4 space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold">Total Alertas</span>
            <Bell className="size-4 text-neutral-400" />
          </div>
          <p className="text-2xl font-black text-neutral-900">{notifications.length}</p>
          <p className="text-[10px] text-neutral-400 font-medium">Historial registrado</p>
        </Card>

        <Card className="rounded-2xl border-rose-200/80 shadow-2xs bg-rose-50/40 p-4 space-y-1">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs font-bold">Mora Crítica</span>
            <AlertTriangle className="size-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600">
            {notifications.filter((n) => n.type === "CRITICAL_OVERDUE").length}
          </p>
          <p className="text-[10px] text-rose-600/70 font-medium">Facturas SaaS vencidas</p>
        </Card>

        <Card className="rounded-2xl border-amber-200/80 shadow-2xs bg-amber-50/40 p-4 space-y-1">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-bold">Límites & Upgrade</span>
            <Users className="size-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">
            {notifications.filter((n) => n.type === "PLAN_CAPACITY").length}
          </p>
          <p className="text-[10px] text-amber-600/70 font-medium">Planes al 90%+ capacidad</p>
        </Card>

        <Card className="rounded-2xl border-emerald-200/80 shadow-2xs bg-emerald-50/40 p-4 space-y-1">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-bold">Pagos por Verificar</span>
            <CreditCard className="size-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600">
            {notifications.filter((n) => n.type === "PAYMENT_REPORTED").length}
          </p>
          <p className="text-[10px] text-emerald-600/70 font-medium">Transferencias por validar</p>
        </Card>
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Button
          variant={filter === "ALL" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("ALL")}
          className={`rounded-xl text-xs font-bold ${
            filter === "ALL" ? "bg-neutral-950 text-white" : ""
          }`}
        >
          Todas ({notifications.length})
        </Button>
        <Button
          variant={filter === "CRITICAL" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("CRITICAL")}
          className={`rounded-xl text-xs font-bold ${
            filter === "CRITICAL" ? "bg-rose-600 text-white hover:bg-rose-700" : ""
          }`}
        >
          🔴 Mora Crítica ({notifications.filter((n) => n.type === "CRITICAL_OVERDUE").length})
        </Button>
        <Button
          variant={filter === "CAPACITY" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("CAPACITY")}
          className={`rounded-xl text-xs font-bold ${
            filter === "CAPACITY" ? "bg-amber-600 text-white hover:bg-amber-700" : ""
          }`}
        >
          🟡 Capacidad ({notifications.filter((n) => n.type === "PLAN_CAPACITY").length})
        </Button>
        <Button
          variant={filter === "PAYMENTS" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("PAYMENTS")}
          className={`rounded-xl text-xs font-bold ${
            filter === "PAYMENTS" ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""
          }`}
        >
          🟢 Pagos Reportados ({notifications.filter((n) => n.type === "PAYMENT_REPORTED").length})
        </Button>
      </div>

      {/* NOTIFICATIONS LIST */}
      <div className="space-y-3">
        {filtered.map((item) => {
          const isCritical = item.type === "CRITICAL_OVERDUE";
          const isCapacity = item.type === "PLAN_CAPACITY";
          const isPayment = item.type === "PAYMENT_REPORTED";

          return (
            <Card
              key={item.id}
              className={`rounded-3xl border transition-all ${
                !item.read
                  ? isCritical
                    ? "border-rose-300 bg-rose-50/20 shadow-xs"
                    : isCapacity
                    ? "border-amber-300 bg-amber-50/20 shadow-xs"
                    : "border-blue-300 bg-blue-50/20 shadow-xs"
                  : "border-neutral-200/90 bg-white"
              }`}
            >
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`size-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                      isCritical
                        ? "bg-rose-100 text-rose-700"
                        : isCapacity
                        ? "bg-amber-100 text-amber-700"
                        : isPayment
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {isCritical ? (
                      <AlertTriangle className="size-5" />
                    ) : isCapacity ? (
                      <Users className="size-5" />
                    ) : isPayment ? (
                      <CreditCard className="size-5" />
                    ) : (
                      <Building2 className="size-5" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-black text-neutral-900 leading-tight">
                        {item.title}
                      </h4>
                      {item.schoolCode && (
                        <Badge variant="outline" className="text-[10px] font-bold font-mono bg-neutral-50">
                          {item.schoolCode}
                        </Badge>
                      )}
                      {!item.read && (
                        <span className="size-2 rounded-full bg-rose-500 ring-2 ring-rose-200 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed max-w-2xl">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-neutral-400 font-medium pt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {item.timeAgo}
                      </span>
                      {item.amount !== undefined && (
                        <span className="font-bold text-neutral-900">
                          Monto: ${item.amount.toFixed(2)} USD
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleRead(item.id)}
                    className="text-xs text-neutral-500 hover:text-neutral-900 rounded-xl"
                  >
                    {item.read ? "Marcar no leída" : "Marcar leída"}
                  </Button>
                  <Link href={item.actionUrl}>
                    <Button
                      size="sm"
                      className={`rounded-xl text-xs font-bold gap-1.5 shadow-xs cursor-pointer ${
                        isCritical
                          ? "bg-rose-600 hover:bg-rose-700 text-white"
                          : "bg-neutral-950 hover:bg-neutral-800 text-white"
                      }`}
                    >
                      <span>{item.actionLabel}</span>
                      <ArrowRight className="size-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
