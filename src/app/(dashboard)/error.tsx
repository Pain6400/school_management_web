"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error caught by boundary:", error);
  }, [error]);

  return (
    <div className="flex-1 min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-destructive/20 text-center">
        <CardHeader className="space-y-2">
          <div className="mx-auto size-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center shadow-xs">
            <AlertTriangle className="size-6" />
          </div>
          <CardTitle className="text-xl font-bold">Ocurrió un error inesperado</CardTitle>
          <CardDescription>
            {error.message || "No fue posible cargar los datos de este módulo."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Si el problema persiste, revisa tu conexión o contacta al administrador del sistema.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            onClick={() => reset()}
            className="rounded-xl gap-2 bg-neutral-950 hover:bg-neutral-800 text-white shadow-xs cursor-pointer"
          >
            <RotateCcw className="size-4 text-lime-400" />
            Reintentar
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
