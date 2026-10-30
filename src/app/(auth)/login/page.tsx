"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchApi } from "@/lib/api-client";
import { useAuthStore, decodeJwt, User } from "@/store/auth-store";
import { GraduationCap, Loader2, Eye, EyeOff, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

const loginSchema = z.object({
  username: z
    .string()
    .min(3, "El usuario o correo debe tener al menos 3 caracteres")
    .trim(),
  password: z
    .string()
    .min(4, "La contraseña debe tener al menos 4 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const setDemoCredentials = (username: string) => {
    setValue("username", username, { shouldValidate: true });
    setValue("password", "123456", { shouldValidate: true });
  };

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);

    try {
      const response = await fetchApi<{
        status: boolean;
        message: string;
        data: { accessToken: string; refreshToken: string } | null;
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
        requireAuth: false,
      });

      if (!response.status || !response.data) {
        throw new Error(response.message || "Error al iniciar sesión");
      }

      const { accessToken, refreshToken } = response.data;

      // Sincronizar de inmediato con el estado global de autenticación
      useAuthStore.getState().login(accessToken, refreshToken);

      // Si se especificó una ruta de redirección válida
      const redirectUrl = searchParams.get("redirect");
      if (redirectUrl && redirectUrl.startsWith("/")) {
        router.push(redirectUrl);
        return;
      }

      // Decodificar rol para redirección
      const decoded = decodeJwt<User>(accessToken);
      const roles = decoded?.roles || [];

      if (roles.includes("SUPER_ADMIN") || roles.includes("ADMIN")) {
        router.push("/admin");
      } else if (roles.includes("DIRECTOR") || roles.includes("SCHOOL_ADMIN")) {
        router.push("/school");
      } else if (roles.includes("PARENT")) {
        router.push("/parent");
      } else if (roles.includes("TEACHER")) {
        router.push("/teacher");
      } else {
        router.push("/student");
      }
    } catch (err) {
      setServerError(
        err instanceof Error
          ? err.message
          : "Credenciales inválidas. Inténtalo de nuevo."
      );
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#f8f9fa] bg-dot-pattern px-4 py-12 overflow-hidden selection:bg-neutral-900 selection:text-white">
      {/* AMBIENT RADIAL LIGHTING */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-lime-300/15 via-emerald-400/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* TOP PILL BADGE */}
      <div className="mb-6 z-10 flex items-center gap-2 px-3 py-1 bg-white/80 backdrop-blur-md rounded-full border border-neutral-200/80 shadow-2xs text-xs font-medium text-neutral-600 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <span className="size-2 rounded-full bg-lime-500 animate-pulse" />
        <span className="font-semibold text-neutral-900">EDUSYS</span>
        <span className="text-neutral-300">•</span>
        <span>Portal de Gestión Académica</span>
      </div>

      {/* MAIN CARD CONTAINER */}
      <div className="relative z-10 w-full max-w-[420px] rounded-3xl bg-white/95 backdrop-blur-xl border border-neutral-200/90 shadow-[0_8px_32px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] p-7 sm:p-8 transition-all">
        {/* CARD HEADER */}
        <div className="text-center space-y-3 mb-6">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-neutral-950 text-white shadow-md ring-4 ring-neutral-950/5 relative group">
            <GraduationCap className="size-6 text-lime-400 transition-transform duration-200 group-hover:scale-110" />
            <div className="absolute -bottom-1 -right-1 size-3 bg-lime-400 rounded-full border-2 border-white" />
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight text-neutral-950">
              Iniciar Sesión
            </h1>
            <p className="text-xs text-neutral-500 font-medium mt-1 leading-relaxed">
              Ingresa tus credenciales para acceder a tu panel educativo
            </p>
          </div>
        </div>

        {/* SERVER ERROR ALERT */}
        {serverError && (
          <div className="mb-5 rounded-xl bg-red-50/90 border border-red-200/80 p-3.5 text-xs text-red-700 font-medium flex items-start gap-2.5 animate-in fade-in duration-150">
            <span className="size-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
            <div className="flex-1">{serverError}</div>
          </div>
        )}

        {/* LOGIN FORM */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-1.5 text-left">
            <div className="flex items-center justify-between">
              <Label htmlFor="username" className="text-xs font-semibold text-neutral-700">
                Usuario o Correo
              </Label>
            </div>
            <Input
              id="username"
              type="text"
              placeholder="ej: admin.school"
              {...register("username")}
              disabled={isSubmitting}
              autoComplete="username"
              aria-invalid={!!errors.username}
            />
            {errors.username && (
              <p className="text-xs text-red-600 font-medium mt-1">
                {errors.username.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5 text-left">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-semibold text-neutral-700">
                Contraseña
              </Label>
              <button
                type="button"
                className="text-[11px] font-semibold text-neutral-400 hover:text-neutral-900 transition-colors"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("password")}
                disabled={isSubmitting}
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 focus:outline-none cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-600 font-medium mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full h-11 text-sm font-bold shadow-md rounded-xl bg-neutral-950 text-white hover:bg-neutral-800 active:scale-[0.98] transition-[transform,background-color,box-shadow] duration-150 ease-out flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin text-lime-400" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Acceder al Sistema</span>
                  <ArrowRight className="size-4 text-lime-400" />
                </>
              )}
            </Button>
          </div>
        </form>

        {/* QUICK DEMO ROLES CHIPS */}
        <div className="mt-6 pt-5 border-t border-neutral-100">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 text-center mb-2.5">
            Acceso Rápido de Prueba
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setDemoCredentials("director")}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700 border border-neutral-200/60 active:scale-95 transition-all cursor-pointer"
            >
              Director
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials("profesor")}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700 border border-neutral-200/60 active:scale-95 transition-all cursor-pointer"
            >
              Profesor
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials("admin")}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700 border border-neutral-200/60 active:scale-95 transition-all cursor-pointer"
            >
              Super Admin
            </button>
          </div>
        </div>
      </div>

      {/* SECURITY FOOTER BADGE */}
      <div className="mt-8 flex items-center gap-2 text-xs font-medium text-neutral-400">
        <ShieldCheck className="size-4 text-emerald-500" />
        <span>Conexión segura cifrada TLS 1.3 con JWT</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="size-8 animate-spin text-neutral-900" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}