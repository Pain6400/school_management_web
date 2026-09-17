"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader,
  DialogTitle, DialogBody, DialogFooter
} from "@/components/ui/dialog";
import {
  Bell, Megaphone, Plus, Search, Filter, RotateCcw,
  Calendar, Clock, AlertTriangle, Sparkles, Trash2,
  CheckCircle2, AlertCircle, Loader2, Send, Tag
} from "lucide-react";
import { communicationService, Announcement } from "@/lib/services/communication.service";

export default function AnnouncementsPage() {
  const { user } = useAuthStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterPriority, setFilterPriority] = useState("ALL");

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    announcementType: "GENERAL",
    priority: "NORMAL",
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const schoolCode = user?.schoolCode || "EDUSYS";

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await communicationService.getAnnouncements();
      if (res.status && res.data) {
        setAnnouncements(res.data);
      }
    } catch (err) {
      console.error("Error al cargar comunicados:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  // Filtered
  const filtered = useMemo(() => {
    return announcements.filter((a) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (filterType !== "ALL" && a.announcementType !== filterType) return false;
      if (filterPriority !== "ALL" && a.priority !== filterPriority) return false;

      return true;
    });
  }, [announcements, searchQuery, filterType, filterPriority]);

  const urgentCount = useMemo(
    () => announcements.filter((a) => a.priority === "URGENT" || a.priority === "HIGH").length,
    [announcements]
  );

  const eventCount = useMemo(
    () => announcements.filter((a) => a.announcementType === "EVENT").length,
    [announcements]
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) {
      setFormError("Por favor completa el título y el mensaje");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const res = await communicationService.createAnnouncement({
        schoolCode,
        title: form.title,
        content: form.content,
        announcementType: form.announcementType,
        priority: form.priority,
        publishDate: new Date().toISOString(),
        expiryDate: form.expiryDate,
        createdBy: user?.sub,
      });

      if (res.status) {
        setIsModalOpen(false);
        setForm({
          title: "",
          content: "",
          announcementType: "GENERAL",
          priority: "NORMAL",
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        });
        loadAnnouncements();
      } else {
        setFormError(res.message || "Error al crear comunicado");
      }
    } catch (err: any) {
      setFormError(err?.message || "Error al conectar con el servidor");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que deseas eliminar este comunicado?")) return;
    try {
      await communicationService.deleteAnnouncement(id);
      loadAnnouncements();
    } catch (err: any) {
      alert(err?.message || "No se pudo eliminar");
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="rounded-3xl bg-white border border-neutral-200/80 p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-2xl bg-neutral-950 text-lime-400 flex items-center justify-center font-black text-2xl shadow-md ring-4 ring-lime-400/20">
            <Megaphone className="size-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-black text-neutral-900 tracking-tight">
                Tablón de Comunicados & Avisos
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-lime-100 text-lime-800 border border-lime-200">
                <Sparkles className="size-3" /> Difusión Oficial
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Publica circulares, avisos institucionales y recordatorios para alumnos, docentes y padres.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => { setIsModalOpen(true); setFormError(null); }}
            className="h-12 px-6 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs sm:text-sm font-bold shadow-xs gap-2 cursor-pointer"
          >
            <Plus className="size-4 text-lime-400" />
            <span>Publicar Comunicado</span>
          </Button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Total Publicaciones</span>
            <div className="size-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900">
              <Bell className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-2">{announcements.length}</div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Circulares y avisos vigentes</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Avisos Prioritarios</span>
            <div className="size-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
              <AlertTriangle className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">{urgentCount}</div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Prioridad alta o urgente</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Eventos Escolares</span>
            <div className="size-8 rounded-xl bg-lime-100 flex items-center justify-center text-lime-800">
              <Calendar className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-2">{eventCount}</div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Fechas cívicas y actividades</p>
        </Card>
      </div>

      {/* FILTER BAR */}
      <Card className="p-5">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-neutral-500" />
              <h3 className="text-sm font-bold text-neutral-900">Filtrar Publicaciones</h3>
            </div>
            {(searchQuery || filterType !== "ALL" || filterPriority !== "ALL") && (
              <button
                type="button"
                onClick={() => { setSearchQuery(""); setFilterType("ALL"); setFilterPriority("ALL"); }}
                className="text-xs font-bold text-neutral-600 hover:text-neutral-950 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="size-3" />
                <span>Limpiar filtros</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por título o contenido..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 rounded-xl bg-white border border-neutral-200/90 pl-10 pr-4 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              />
            </div>

            <div>
              <Combobox
                options={[
                  { value: "ALL", label: "Todos los Tipos" },
                  { value: "GENERAL", label: "General", badge: "General" },
                  { value: "ACADEMIC", label: "Académico", badge: "Académico" },
                  { value: "EVENT", label: "Eventos", badge: "Evento" },
                  { value: "URGENT", label: "Urgente", badge: "Urgente" },
                ]}
                value={filterType}
                onChange={(val) => setFilterType(val || "ALL")}
                placeholder="Tipo de Comunicado"
                searchPlaceholder="Buscar tipo..."
              />
            </div>

            <div>
              <Combobox
                options={[
                  { value: "ALL", label: "Todas las Prioridades" },
                  { value: "NORMAL", label: "Prioridad Normal" },
                  { value: "HIGH", label: "Prioridad Alta" },
                  { value: "URGENT", label: "Prioridad Urgente" },
                ]}
                value={filterPriority}
                onChange={(val) => setFilterPriority(val || "ALL")}
                placeholder="Nivel de Prioridad"
                searchPlaceholder="Buscar prioridad..."
              />
            </div>
          </div>
        </div>
      </Card>

      {/* FEED DE COMUNICADOS */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-neutral-400 text-xs font-medium flex flex-col items-center gap-2">
            <Loader2 className="size-6 animate-spin text-neutral-400" />
            <span>Cargando comunicados...</span>
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center text-neutral-400 text-xs font-medium">
            No se encontraron comunicados publicados con los filtros actuales.
          </Card>
        ) : (
          filtered.map((a) => {
            const isUrgent = a.priority === "URGENT" || a.priority === "HIGH";

            return (
              <Card
                key={a.id}
                className={`p-6 hover:shadow-md transition-all border ${
                  isUrgent ? "border-amber-300 bg-amber-50/20" : "border-neutral-200/80 bg-white"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-black text-neutral-900">{a.title}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-neutral-100 text-neutral-700">
                        {a.announcementType || "GENERAL"}
                      </span>
                      {isUrgent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <AlertTriangle className="size-3" /> {a.priority}
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
                      {a.content}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-neutral-400 pt-2 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5" />
                        Publicado: {a.publishDate ? new Date(a.publishDate).toLocaleDateString() : "Hoy"}
                      </span>
                      {a.expiryDate && (
                        <span>Vigencia hasta: {new Date(a.expiryDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDelete(a.id)}
                      className="p-2 rounded-xl text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Eliminar comunicado"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* MODAL AMPLIO: PUBLICAR COMUNICADO */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publicar Nuevo Comunicado</DialogTitle>
            <DialogDescription>
              Difunde un mensaje o circular para la comunidad educativa de {schoolCode}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="flex flex-col flex-1">
            <DialogBody>
              {formError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0 text-red-500" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-sm font-semibold text-neutral-800">
                    Título del Comunicado <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className="h-12 rounded-xl text-sm px-4 font-bold"
                    placeholder="Ej. Convocatoria a Entrega de Calificaciones - Periodo 1"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-neutral-800">
                    Tipo de Comunicado <span className="text-red-500">*</span>
                  </Label>
                  <Combobox
                    options={[
                      { value: "GENERAL", label: "General" },
                      { value: "ACADEMIC", label: "Académico" },
                      { value: "EVENT", label: "Evento Escolar" },
                      { value: "URGENT", label: "Urgente" },
                    ]}
                    value={form.announcementType}
                    onChange={(val) => setForm({ ...form, announcementType: val || "GENERAL" })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-neutral-800">
                    Prioridad <span className="text-red-500">*</span>
                  </Label>
                  <Combobox
                    options={[
                      { value: "NORMAL", label: "Normal" },
                      { value: "HIGH", label: "Alta" },
                      { value: "URGENT", label: "Urgente" },
                    ]}
                    value={form.priority}
                    onChange={(val) => setForm({ ...form, priority: val || "NORMAL" })}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-sm font-semibold text-neutral-800">
                    Fecha de Vencimiento / Expiración (Opcional)
                  </Label>
                  <Input
                    type="date"
                    className="h-12 rounded-xl text-sm px-4"
                    value={form.expiryDate}
                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-sm font-semibold text-neutral-800">
                    Mensaje / Contenido Completo <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    rows={5}
                    className="rounded-xl text-sm p-3.5 border-neutral-200"
                    placeholder="Escribe el cuerpo del comunicado, indicaciones o cronograma..."
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    required
                  />
                </div>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="h-12 px-6 rounded-xl text-sm font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 px-6 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-sm font-bold shadow-xs gap-2"
              >
                {isSubmitting ? (
                  <><Loader2 className="size-4 animate-spin" />Publicando...</>
                ) : (
                  <>
                    <Send className="size-4 text-lime-400" />
                    <span>Publicar Ahora</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
