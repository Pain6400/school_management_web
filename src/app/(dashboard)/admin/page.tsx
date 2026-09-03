"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Building2, CreditCard, Users, ArrowRight, Activity } from "lucide-react";
import Link from "next/link";
import { fetchApi } from "@/lib/api-client";

export default function AdminPage() {
  const { user } = useAuthStore();
  const [schoolsCount, setSchoolsCount] = useState<number>(0);
  const [plansCount, setPlansCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSaaSData = async () => {
      try {
        setLoading(true);
        const [schoolsRes, plansRes] = await Promise.allSettled([
          fetchApi<{ status: boolean; data: any[] }>("/schools"),
          fetchApi<{ status: boolean; data: any[] }>("/plans"),
        ]);

        if (schoolsRes.status === "fulfilled" && schoolsRes.value.status && Array.isArray(schoolsRes.value.data)) {
          setSchoolsCount(schoolsRes.value.data.length);
        }
        if (plansRes.status === "fulfilled" && plansRes.value.status && Array.isArray(plansRes.value.data)) {
          setPlansCount(plansRes.value.data.length);
        }
      } catch (err) {
        console.error("Error loading SaaS admin data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSaaSData();
  }, []);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Shield className="size-6" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Panel SaaS Super Admin</h2>
            <p className="text-sm text-muted-foreground">
              Administración global de instituciones, suscripciones y configuración de plataforma.
            </p>
          </div>
        </div>
      </div>

      {/* METRICS */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Escuelas Activas</CardTitle>
            <Building2 className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? "..." : schoolsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Instituciones clientes en la plataforma</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Planes de Suscripción</CardTitle>
            <CreditCard className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? "..." : plansCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Paquetes de servicio configurados</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Estado del Sistema</CardTitle>
            <Activity className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-emerald-600">En Línea</div>
            <p className="text-xs text-muted-foreground mt-1">Todos los microservicios operativos</p>
          </CardContent>
        </Card>
      </div>

      {/* ACCESS TILES */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
              <Building2 className="size-5" />
            </div>
            <CardTitle>Gestión de Escuelas (Tenants)</CardTitle>
            <CardDescription>
              Crea nuevas escuelas, define su código único, logo, colores institucionales y asigna límites de usuarios y almacenamiento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/school">
              <Button variant="outline" className="w-full justify-between group">
                <span>Acceder a Mi Escuela</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
              <CreditCard className="size-5" />
            </div>
            <CardTitle>Planes y Pagos de Suscripción</CardTitle>
            <CardDescription>
              Configura los precios mensuales/anuales de cada plan de suscripción y revisa los comprobantes de pago de las escuelas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full justify-between" disabled>
              <span>Próximamente Facturación SaaS</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}