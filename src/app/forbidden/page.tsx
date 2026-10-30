"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShieldAlert, ArrowLeft, Home, KeyRound } from "lucide-react";

export default function ForbiddenPage() {
  const { user } = useAuthStore();

  let homePath = "/login";
  if (user?.roles?.includes("SUPER_ADMIN") || user?.roles?.includes("ADMIN")) homePath = "/admin";
  else if (user?.roles?.includes("SCHOOL_ADMIN") || user?.roles?.includes("DIRECTOR")) homePath = "/school";
  else if (user?.roles?.includes("TEACHER")) homePath = "/school/academics/timetable";
  else if (user?.roles?.includes("PARENT")) homePath = "/parent";
  else if (user?.roles?.includes("STUDENT")) homePath = "/student";

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 rounded-3xl bg-white border-neutral-200 shadow-xl text-center space-y-6">
        <div className="size-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
          <ShieldAlert className="size-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
            Error 403 • Acceso No Autorizado
          </span>
          <h1 className="text-2xl font-black text-neutral-950 tracking-tight">
            Acceso Restringido por Seguridad
          </h1>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Tu cuenta actual (<strong className="text-neutral-800">{user?.username || "Usuario"}</strong>) no dispone de los permisos requeridos en la Matriz RBAC para visualizar este recurso.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 text-left space-y-1 text-xs">
          <p className="text-neutral-400 font-bold uppercase text-[10px]">Rol Detectado:</p>
          <p className="font-mono font-bold text-neutral-800">
            {user?.roles?.join(", ") || "SIN ROL ASIGNADO"}
          </p>
          <p className="text-neutral-400 font-bold uppercase text-[10px] pt-1">Sede Escolar:</p>
          <p className="font-mono text-neutral-800">{user?.schoolCode || "ESC002"}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Link href={homePath} className="flex-1">
            <Button className="w-full rounded-xl text-xs font-bold bg-neutral-950 hover:bg-neutral-800 text-white gap-2">
              <Home className="size-3.5" />
              <span>Ir a Mi Panel</span>
            </Button>
          </Link>
          <Link href="/login" className="flex-1">
            <Button variant="outline" className="w-full rounded-xl text-xs font-bold gap-2">
              <KeyRound className="size-3.5" />
              <span>Cambiar Cuenta</span>
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

