"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchApi } from "@/lib/api-client";
import { GraduationCap, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetchApi<{
        status: boolean;
        message: string;
        data: { accessToken: string; refreshToken: string } | null;
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
        requireAuth: false,
      });

      if (!response.status || !response.data) {
        throw new Error(response.message || "Error al iniciar sesion");
      }

      // Guardar tokens
      localStorage.setItem("token", response.data.accessToken);
      document.cookie = "token=${response.data.accessToken}; path=/; max-age=86400";
      localStorage.setItem("refreshToken", response.data.refreshToken);

      // Decodificar payload basico del JWT para redireccionar segun rol
      try {
        const payloadBase64 = response.data.accessToken.split(".")[1];
        const decoded = JSON.parse(atob(payloadBase64));
        const roles: string[] = decoded.roles || [];

        if (roles.includes("SUPER_ADMIN") || roles.includes("ADMIN")) {
          router.push("/admin");
        } else if (roles.includes("DIRECTOR") || roles.includes("SCHOOL_ADMIN")) {
          router.push("/school");
        } else if (roles.includes("TEACHER")) {
          router.push("/teacher");
        } else {
          router.push("/student");
        }
      } catch {
        router.push("/admin");
      }
    } catch (err: any) {
      setError(err.message || "Credenciales invalidas. Intentalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4" suppressHydrationWarning>
      <Card className="w-full max-w-md shadow-xl border-border/40" suppressHydrationWarning>
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <GraduationCap className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Iniciar Sesion</CardTitle>
          <CardDescription>
            Ingresa tu usuario/correo y contrasena para acceder a la plataforma escolar
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive font-medium">
                {error}
              </div>
            )}
            <div className="space-y-2 text-left">
              <Label htmlFor="username">Usuario o Correo</Label>
              <Input
                id="username"
                type="text"
                placeholder="ej: admin.school"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="password">Contrasena</Label>
              <Input
                id="password"
                type="password"
                placeholder="        "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="pt-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesion...
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