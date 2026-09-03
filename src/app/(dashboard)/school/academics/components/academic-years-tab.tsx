"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Calendar, Clock, Layers } from "lucide-react";
import { academicsService, AcademicYear, AcademicPeriod } from "@/lib/services/academics.service";

export default function AcademicYearsTab() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Año
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [isSubmittingYear, setIsSubmittingYear] = useState(false);
  const [yearForm, setYearForm] = useState({
    schoolCode: "ESC001",
    yearCode: new Date().getFullYear(),
    name: `Año Escolar ${new Date().getFullYear()}`,
    startDate: "",
    endDate: "",
  });

  // Modal Período
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [isSubmittingPeriod, setIsSubmittingPeriod] = useState(false);
  const [periodForm, setPeriodForm] = useState({
    schoolCode: "ESC001",
    academicYearId: 0,
    name: "",
    code: "",
    startDate: "",
    endDate: "",
    weight: 25,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [yearsRes, periodsRes] = await Promise.allSettled([
        academicsService.getAcademicYears(),
        academicsService.getAcademicPeriods(),
      ]);

      if (yearsRes.status === "fulfilled" && yearsRes.value.status) {
        setYears(yearsRes.value.data);
        if (yearsRes.value.data.length > 0 && periodForm.academicYearId === 0) {
          setPeriodForm((prev) => ({ ...prev, academicYearId: yearsRes.value.data[0].id }));
        }
      }
      if (periodsRes.status === "fulfilled" && periodsRes.value.status) {
        setPeriods(periodsRes.value.data);
      }
    } catch (error) {
      console.error("Error loading academic years/periods:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateYear = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingYear(true);
      const res = await academicsService.createAcademicYear({
        ...yearForm,
        yearCode: Number(yearForm.yearCode),
      });
      if (res.status) {
        setIsYearOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error("Error creating academic year:", error);
    } finally {
      setIsSubmittingYear(false);
    }
  };

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodForm.academicYearId) {
      alert("Por favor selecciona un año académico.");
      return;
    }
    try {
      setIsSubmittingPeriod(true);
      const res = await academicsService.createAcademicPeriod({
        ...periodForm,
        academicYearId: Number(periodForm.academicYearId),
        weight: Number(periodForm.weight),
      });
      if (res.status) {
        setIsPeriodOpen(false);
        setPeriodForm((prev) => ({
          ...prev,
          name: "",
          code: "",
          startDate: "",
          endDate: "",
          weight: 25,
        }));
        fetchData();
      }
    } catch (error) {
      console.error("Error creating period:", error);
    } finally {
      setIsSubmittingPeriod(false);
    }
  };

  const yearMap = Object.fromEntries(years.map((y) => [y.id, y.name]));

  return (
    <div className="space-y-6">
      {/* SECCIÓN 1: AÑOS ACADÉMICOS */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="size-5 text-primary" /> Años Académicos
            </CardTitle>
            <CardDescription>
              Ciclos escolares que estructuran los períodos, matrículas y asignaturas.
            </CardDescription>
          </div>
          <Dialog open={isYearOpen} onOpenChange={setIsYearOpen}>
            <DialogTrigger render={<Button size="sm"><Plus className="mr-2 size-4" /> Nuevo Año</Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Año Académico</DialogTitle>
                <DialogDescription>Define el ciclo escolar y su vigencia.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateYear} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="yearCode">Código (Año)</Label>
                    <Input
                      id="yearCode"
                      type="number"
                      value={yearForm.yearCode}
                      onChange={(e) => setYearForm({ ...yearForm, yearCode: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      value={yearForm.name}
                      onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Fecha de Inicio</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={yearForm.startDate}
                      onChange={(e) => setYearForm({ ...yearForm, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Fecha de Fin</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={yearForm.endDate}
                      onChange={(e) => setYearForm({ ...yearForm, endDate: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isSubmittingYear}>
                    {isSubmittingYear ? <Loader2 className="mr-2 size-4 animate-spin" /> : "Guardar Año"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-6"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>Nombre del Ciclo</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Fecha Inicio</TableHead>
                    <TableHead>Fecha Fin</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {years.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No hay años académicos registrados.</TableCell></TableRow>
                  ) : (
                    years.map((y) => (
                      <TableRow key={y.id} className="hover:bg-muted/20">
                        <TableCell className="font-semibold text-foreground">{y.name}</TableCell>
                        <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{y.yearCode}</code></TableCell>
                        <TableCell>{y.startDate ? new Date(y.startDate).toLocaleDateString() : "—"}</TableCell>
                        <TableCell>{y.endDate ? new Date(y.endDate).toLocaleDateString() : "—"}</TableCell>
                        <TableCell>
                          <Badge variant={y.status ? "default" : "secondary"} className={y.status ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/20 text-[11px]" : "text-[11px]"}>
                            {y.status ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECCIÓN 2: PERÍODOS ACADÉMICOS (Bimestres / Trimestres) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layers className="size-5 text-primary" /> Períodos Académicos
            </CardTitle>
            <CardDescription>
              Bimestres, trimestres o semestres en los que se dividen las calificaciones.
            </CardDescription>
          </div>
          <Dialog open={isPeriodOpen} onOpenChange={setIsPeriodOpen}>
            <DialogTrigger render={<Button size="sm" variant="outline"><Plus className="mr-2 size-4" /> Nuevo Período</Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Período Académico</DialogTitle>
                <DialogDescription>Asigna el período a un ciclo escolar con su ponderación de nota.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreatePeriod} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Año Académico <span className="text-destructive">*</span></Label>
                  <Select
                    value={periodForm.academicYearId ? String(periodForm.academicYearId) : ""}
                    onValueChange={(v) => setPeriodForm({ ...periodForm, academicYearId: Number(v ?? 0) })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona un año..." />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y.id} value={String(y.id)}>{y.name} ({y.yearCode})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="periodName">Nombre del Período</Label>
                    <Input
                      id="periodName"
                      placeholder="Ej: 1er Trimestre"
                      value={periodForm.name}
                      onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="periodCode">Código Corto</Label>
                    <Input
                      id="periodCode"
                      placeholder="Ej: T1"
                      value={periodForm.code}
                      onChange={(e) => setPeriodForm({ ...periodForm, code: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pStartDate">Fecha de Inicio</Label>
                    <Input
                      id="pStartDate"
                      type="date"
                      value={periodForm.startDate}
                      onChange={(e) => setPeriodForm({ ...periodForm, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pEndDate">Fecha de Fin</Label>
                    <Input
                      id="pEndDate"
                      type="date"
                      value={periodForm.endDate}
                      onChange={(e) => setPeriodForm({ ...periodForm, endDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Ponderación (%)</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="1"
                    max="100"
                    value={periodForm.weight}
                    onChange={(e) => setPeriodForm({ ...periodForm, weight: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isSubmittingPeriod}>
                    {isSubmittingPeriod ? <Loader2 className="mr-2 size-4 animate-spin" /> : "Guardar Período"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-6"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Año Académico</TableHead>
                    <TableHead>Ponderación</TableHead>
                    <TableHead>Fechas</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periods.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No hay períodos registrados. Crea el primer trimestre/bimestre.</TableCell></TableRow>
                  ) : (
                    periods.map((p) => (
                      <TableRow key={p.id} className="hover:bg-muted/20">
                        <TableCell className="font-semibold text-foreground">{p.name}</TableCell>
                        <TableCell><Badge variant="outline" className="font-mono text-xs">{p.code}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {p.id && (p as any).academicYear?.name ? (p as any).academicYear.name : (p as any).academicYearId ? yearMap[(p as any).academicYearId] || `Año ${(p as any).academicYearId}` : "—"}
                        </TableCell>
                        <TableCell><span className="font-medium text-primary">{p.weight}%</span></TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {p.startDate ? new Date(p.startDate).toLocaleDateString() : ""} - {p.endDate ? new Date(p.endDate).toLocaleDateString() : ""}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[11px]">{p.status || "Activo"}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}