"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchApi } from "@/lib/api-client";
import { useAuthStore, decodeJwt, User } from "@/store/auth-store";
import { GraduationCap, Loader2 } from "lucide-react";

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

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

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

      // Decodificar rol para redirección
      const decoded = decodeJwt<User>(accessToken);
      const roles = decoded?.roles || [];

      if (roles.includes("SUPER_ADMIN") || roles.includes("ADMIN")) {
        router.push("/admin");
      } else if (roles.includes("DIRECTOR") || roles.includes("SCHOOL_ADMIN")) {
        router.push("/school");
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
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-xl border-border/40">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <GraduationCap className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Iniciar Sesión
          </CardTitle>
          <CardDescription>
            Ingresa tu usuario y contraseña para acceder a la plataforma escolar
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-4">
            {serverError && (
              <div className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive font-medium">
                {serverError}
              </div>
            )}
            <div className="space-y-1.5 text-left">
              <Label htmlFor="username">Usuario o Correo</Label>
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
                <p className="text-xs text-destructive font-medium">
                  {errors.username.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5 text-left">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                disabled={isSubmitting}
                autoComplete="current-password"
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <p className="text-xs text-destructive font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="pt-2">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Acceder al Sistema"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}