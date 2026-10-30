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
  CheckCircle2, AlertCircle, Loader2, Send, Tag,
  Pin, Share2, Printer, Eye, Users, MessageSquare,
  Check, Mail, Phone, ExternalLink, ShieldAlert,
  Building,
} from "lucide-react";
import {
  communicationService,
  Announcement,
  BroadcastResult,
} from "@/lib/services/communication.service";

const TYPE_CONFIG: Record<
  string,
  { label: string; badgeClass: string; icon: any }
> = {
  GENERAL: {
    label: "General / Institucional",
    badgeClass: "bg-neutral-100 text-neutral-800 border-neutral-200",
    icon: Bell,
  },
  ACADEMIC: {
    label: "Académico / Evaluaciones",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Sparkles,
  },
  EVENT: {
    label: "Evento / Actividad",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: Calendar,
  },
  URGENT: {
    label: "Urgente / Emergencia",
    badgeClass: "bg-red-100 text-red-800 border-red-200 font-bold",
    icon: AlertTriangle,
  },
  MEETING: {
    label: "Reunión de Padres / APF",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200 font-bold",
    icon: Users,
  },
};

const AUDIENCE_CONFIG: Record<string, { label: string; icon: any }> = {
  ALL: { label: "Toda la Comunidad", icon: Users },
  PARENTS: { label: "Padres y Tutores", icon: Users },
  STUDENTS: { label: "Solo Estudiantes", icon: Sparkles },
  TEACHERS: { label: "Cuerpo Docente", icon: Building },
};

export default function AnnouncementsPage() {
  const { user } = useAuthStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [filterAudience, setFilterAudience] = useState("ALL");

  // Read Modal
  const [readingAnnouncement, setReadingAnnouncement] = useState<Announcement | null>(null);

  // Broadcast Modal
  const [broadcastingItem, setBroadcastingItem] = useState<Announcement | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["WHATSAPP", "EMAIL"]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<BroadcastResult | null>(null);

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    announcementType: "GENERAL",
    priority: "NORMAL",
    targetAudience: "ALL",
    isPinned: false,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const schoolCode = user?.schoolCode || "ESC002";

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await communicationService.getAnnouncements({
        schoolCode,
        targetAudience: filterAudience !== "ALL" ? filterAudience : undefined,
      });
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
  }, [filterAudience]);

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

  const pinnedAnnouncements = useMemo(
    () => filtered.filter((a) => a.isPinned),
    [filtered]
  );

  const regularAnnouncements = useMemo(
    () => filtered.filter((a) => !a.isPinned),
    [filtered]
  );

  const urgentCount = useMemo(
    () => announcements.filter((a) => a.priority === "URGENT" || a.priority === "HIGH").length,
    [announcements]
  );

  const eventCount = useMemo(
    () => announcements.filter((a) => a.announcementType === "EVENT" || a.announcementType === "MEETING").length,
    [announcements]
  );

  const pinnedCount = useMemo(
    () => announcements.filter((a) => a.isPinned).length,
    [announcements]
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setFormError("Por favor completa el título y el mensaje del comunicado.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const res = await communicationService.createAnnouncement({
        schoolCode,
        title: form.title.trim(),
        content: form.content.trim(),
        announcementType: form.announcementType,
        priority: form.priority,
        targetAudience: form.targetAudience,
        isPinned: form.isPinned,
        publishDate: new Date().toISOString(),
        expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : undefined,
        createdBy: user?.sub,
      });

      if (res.status) {
        setIsModalOpen(false);
        setForm({
          title: "",
          content: "",
          announcementType: "GENERAL",
          priority: "NORMAL",
          targetAudience: "ALL",
          isPinned: false,
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

  const handleOpenBroadcast = (a: Announcement) => {
    setBroadcastingItem(a);
    setSelectedChannels(["WHATSAPP", "EMAIL"]);
    setBroadcastResult(null);
  };

  const handleConfirmBroadcast = async () => {
    if (!broadcastingItem) return;
    try {
      setIsBroadcasting(true);
      const res = await communicationService.broadcastToParents(
        broadcastingItem.id,
        selectedChannels
      );
      if (res.status) {
        setBroadcastResult(res.data);
      }
    } catch (err: any) {
      alert("Error en la difusión: " + err.message);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handlePrintCircular = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* HEADER BANNER */}
      <div className="rounded-3xl bg-white border border-neutral-200/80 p-6 md:p-8 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-2xl bg-neutral-950 text-lime-400 flex items-center justify-center font-black text-2xl shadow-md ring-4 ring-lime-400/20 shrink-0">
            <Megaphone className="size-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-black text-neutral-900 tracking-tight">
                Muro de Avisos & Comunicados
              </h1>
              <Badge variant="outline" className="bg-lime-50 text-lime-800 border-lime-300 text-xs font-bold gap-1">
                <Sparkles className="size-3 text-lime-600" />
                <span>Difusión Oficial</span>
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Publica circulares, avisos de emergencia, fechas de exámenes y reuniones para padres, alumnos y docentes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={loadAnnouncements}
            variant="outline"
            size="sm"
            className="rounded-xl text-xs font-bold gap-1.5 h-11 border-neutral-300"
          >
            <RotateCcw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Actualizar</span>
          </Button>

          <Button
            onClick={() => { setIsModalOpen(true); setFormError(null); }}
            className="h-11 px-5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs sm:text-sm font-bold shadow-xs gap-2 cursor-pointer"
          >
            <Plus className="size-4 text-lime-400" />
            <span>Publicar Comunicado</span>
          </Button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 sm:p-5 bg-white border-neutral-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Total Publicaciones
            </span>
            <div className="size-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900">
              <Bell className="size-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-900 mt-2">
            {announcements.length}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Circulares y avisos vigentes</p>
        </Card>

        <Card className="p-4 sm:p-5 bg-white border-neutral-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
              Avisos Prioritarios
            </span>
            <div className="size-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
              <AlertTriangle className="size-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-900 mt-2">
            {urgentCount}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Prioridad alta o urgente</p>
        </Card>

        <Card className="p-4 sm:p-5 bg-white border-neutral-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">
              Eventos & Asambleas
            </span>
            <div className="size-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-800">
              <Calendar className="size-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-900 mt-2">
            {eventCount}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Actividades y reuniones</p>
        </Card>

        <Card className="p-4 sm:p-5 bg-white border-neutral-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-lime-600 uppercase tracking-wider">
              Fijados en Cartelera
            </span>
            <div className="size-8 rounded-xl bg-lime-50 flex items-center justify-center text-lime-800">
              <Pin className="size-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-lime-900 mt-2">
            {pinnedCount}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Destacados en banner</p>
        </Card>
      </div>

      {/* FILTER BAR */}
      <Card className="p-4 bg-white border-neutral-200/80 shadow-2xs">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-neutral-500" />
              <h3 className="text-sm font-bold text-neutral-900">Filtrar Avisos Institucionales</h3>
            </div>
            {(searchQuery || filterType !== "ALL" || filterPriority !== "ALL" || filterAudience !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setFilterType("ALL");
                  setFilterPriority("ALL");
                  setFilterAudience("ALL");
                }}
                className="text-xs font-bold text-neutral-600 hover:text-neutral-950 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="size-3" />
                <span>Limpiar filtros</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Buscar por título o contenido..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 rounded-xl text-xs bg-neutral-50/50 border-neutral-200"
              />
            </div>

            <div>
              <Combobox
                options={[
                  { value: "ALL", label: "Todos los Tipos" },
                  { value: "GENERAL", label: "General", badge: "General" },
                  { value: "ACADEMIC", label: "Académico", badge: "Académico" },
                  { value: "EVENT", label: "Eventos", badge: "Evento" },
                  { value: "MEETING", label: "Reuniones de Padres", badge: "Reunión" },
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
                  { value: "ALL", label: "Toda la Comunidad" },
                  { value: "PARENTS", label: "Solo Padres y Tutores", badge: "Padres" },
                  { value: "STUDENTS", label: "Solo Estudiantes", badge: "Alumnos" },
                  { value: "TEACHERS", label: "Solo Docentes", badge: "Staff" },
                ]}
                value={filterAudience}
                onChange={(val) => setFilterAudience(val || "ALL")}
                placeholder="Audiencia Destino"
                searchPlaceholder="Buscar audiencia..."
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

      {/* PINNED ANNOUNCEMENTS (BANNER DESTACADO SUPERIOR) */}
      {pinnedAnnouncements.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Pin className="size-4 text-lime-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Comunicados Fijados en Cartelera Oficial
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pinnedAnnouncements.map((a) => {
              const isUrgent = a.priority === "URGENT";
              const typeCfg = TYPE_CONFIG[a.announcementType || "GENERAL"] || TYPE_CONFIG.GENERAL;
              const TypeIcon = typeCfg.icon;

              return (
                <Card
                  key={a.id}
                  className={`p-5 rounded-3xl border transition-all shadow-xs relative overflow-hidden ${
                    isUrgent
                      ? "border-red-300 bg-gradient-to-br from-red-50/70 to-white"
                      : "border-purple-200 bg-gradient-to-br from-purple-50/60 to-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-900 text-lime-400">
                        <Pin className="size-3 text-lime-400" /> Fijado
                      </span>
                      <Badge variant="outline" className={`text-[10px] font-bold ${typeCfg.badgeClass}`}>
                        {typeCfg.label}
                      </Badge>
                    </div>

                    {isUrgent && (
                      <span className="text-[10px] font-black text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                        <AlertTriangle className="size-3" /> URGENTE
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-black text-neutral-900 leading-snug">
                    {a.title}
                  </h4>

                  <p className="text-xs text-neutral-600 line-clamp-3 mt-1.5 leading-relaxed">
                    {a.content}
                  </p>

                  <div className="mt-4 pt-3 border-t border-neutral-200/60 flex items-center justify-between">
                    <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                      <Clock className="size-3" />
                      {new Date(a.publishDate).toLocaleDateString("es-HN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenBroadcast(a)}
                        className="rounded-xl text-xs font-bold h-8 px-2.5 gap-1 text-purple-700 border-purple-200 hover:bg-purple-50"
                      >
                        <Share2 className="size-3" />
                        <span>Difundir</span>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setReadingAnnouncement(a)}
                        className="rounded-xl text-xs font-bold h-8 px-3 gap-1 bg-neutral-900 hover:bg-neutral-800 text-white"
                      >
                        <Eye className="size-3" />
                        <span>Leer</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* FEED DE COMUNICADOS GENERALES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-900">
            Todos los Comunicados ({filtered.length})
          </h3>
          <span className="text-xs text-neutral-400">
            Sede Institucional: {schoolCode}
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-neutral-400 text-xs font-medium flex flex-col items-center gap-2">
            <Loader2 className="size-8 animate-spin text-neutral-900" />
            <span>Cargando muro de comunicados...</span>
          </div>
        ) : regularAnnouncements.length === 0 && pinnedAnnouncements.length === 0 ? (
          <Card className="p-12 text-center text-neutral-400 text-xs font-medium space-y-2">
            <Bell className="size-10 text-neutral-300 mx-auto stroke-1" />
            <p className="text-sm font-bold text-neutral-800">No hay comunicados publicados</p>
            <p className="text-xs text-neutral-500">
              No se encontraron avisos que coincidan con los filtros seleccionados.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {regularAnnouncements.map((a) => {
              const typeCfg = TYPE_CONFIG[a.announcementType || "GENERAL"] || TYPE_CONFIG.GENERAL;
              const audienceCfg = AUDIENCE_CONFIG[a.targetAudience || "ALL"] || AUDIENCE_CONFIG.ALL;
              const isUrgent = a.priority === "URGENT" || a.priority === "HIGH";

              return (
                <Card
                  key={a.id}
                  className="p-5 hover:shadow-xs transition-all border border-neutral-200/80 bg-white rounded-3xl"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] font-bold ${typeCfg.badgeClass}`}>
                          {typeCfg.label}
                        </Badge>

                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-neutral-100 text-neutral-700 flex items-center gap-1">
                          <Users className="size-3 text-neutral-400" />
                          <span>Para: {audienceCfg.label}</span>
                        </span>

                        {isUrgent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <AlertTriangle className="size-3" /> Prioridad {a.priority}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-black text-neutral-900 leading-snug">
                        {a.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed whitespace-pre-line">
                        {a.content}
                      </p>

                      <div className="flex items-center gap-4 text-[11px] text-neutral-400 pt-2 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5" />
                          Publicado: {a.publishDate ? new Date(a.publishDate).toLocaleDateString("es-HN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }) : "Hoy"}
                        </span>
                        {a.expiryDate && (
                          <span>Vigencia hasta: {new Date(a.expiryDate).toLocaleDateString("es-HN")}</span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5 self-end sm:self-start">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenBroadcast(a)}
                        className="rounded-xl text-xs font-bold h-8 px-2.5 gap-1 text-purple-700 border-purple-200 hover:bg-purple-50"
                        title="Difundir a Familias"
                      >
                        <Share2 className="size-3" />
                        <span>Difundir</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReadingAnnouncement(a)}
                        className="rounded-xl text-xs font-bold h-8 px-2.5 gap-1 text-neutral-700 hover:bg-neutral-100"
                        title="Ver Circular"
                      >
                        <Eye className="size-3" />
                        <span>Ver Circular</span>
                      </Button>

                      <button
                        type="button"
                        onClick={() => handleDelete(a.id)}
                        className="p-1.5 rounded-xl text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Eliminar comunicado"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: LECTURA Y FORMATO DE CIRCULAR OFICIAL */}
      <Dialog open={!!readingAnnouncement} onOpenChange={(open) => !open && setReadingAnnouncement(null)}>
        <DialogContent size="lg" className="rounded-3xl p-6 sm:p-8">
          {readingAnnouncement && (
            <>
              {/* INSTITUTIONAL CIRCULAR LETTERHEAD */}
              <div className="border-b-2 border-neutral-900 pb-4 mb-4 text-center space-y-1">
                <div className="size-12 rounded-2xl bg-neutral-950 text-lime-400 font-bold text-sm flex items-center justify-center mx-auto mb-2">
                  LS
                </div>
                <h2 className="text-lg font-black text-neutral-900 uppercase tracking-wide">
                  Centro Educativo Luz del Saber
                </h2>
                <p className="text-xs font-semibold text-neutral-500">
                  Secretaría General & Dirección Académica · Circular Oficial #{readingAnnouncement.id}
                </p>
                <div className="text-[10px] text-neutral-400 font-mono">
                  Sede: {readingAnnouncement.schoolCode} · Fecha: {new Date(readingAnnouncement.publishDate).toLocaleDateString("es-HN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>

              <DialogBody className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Badge variant="outline" className={`text-xs font-bold ${TYPE_CONFIG[readingAnnouncement.announcementType || "GENERAL"]?.badgeClass}`}>
                    {TYPE_CONFIG[readingAnnouncement.announcementType || "GENERAL"]?.label}
                  </Badge>

                  <span className="text-xs font-semibold text-neutral-600">
                    Destinatarios: <strong>{AUDIENCE_CONFIG[readingAnnouncement.targetAudience || "ALL"]?.label}</strong>
                  </span>
                </div>

                <DialogTitle className="text-xl font-black text-neutral-900 leading-tight">
                  {readingAnnouncement.title}
                </DialogTitle>

                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-xs text-neutral-700 leading-relaxed whitespace-pre-wrap font-sans">
                  {readingAnnouncement.content}
                </div>

                {readingAnnouncement.expiryDate && (
                  <p className="text-[11px] text-neutral-400 italic">
                    * Comunicado válido hasta el {new Date(readingAnnouncement.expiryDate).toLocaleDateString("es-HN")}.
                  </p>
                )}

                {/* INSTITUTIONAL SIGNATURE BLOCK */}
                <div className="mt-8 pt-6 border-t border-neutral-200/80 flex flex-col items-center text-center">
                  <div className="w-48 border-b border-neutral-400 mb-1" />
                  <p className="text-xs font-bold text-neutral-900">Dirección Ejecutiva y Secretaría</p>
                  <p className="text-[10px] text-neutral-400">Centro Educativo Luz del Saber</p>
                </div>
              </DialogBody>

              <DialogFooter className="border-t border-neutral-200 pt-3">
                <Button
                  variant="outline"
                  onClick={handlePrintCircular}
                  className="rounded-xl text-xs font-bold gap-1.5"
                >
                  <Printer className="size-3.5 text-neutral-600" />
                  <span>Imprimir Circular</span>
                </Button>

                <Button
                  onClick={() => setReadingAnnouncement(null)}
                  className="rounded-xl text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white"
                >
                  Cerrar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 2: DIFUSIÓN MULTICANAL A FAMILIAS (BROADCAST) */}
      <Dialog open={!!broadcastingItem} onOpenChange={(open) => !open && setBroadcastingItem(null)}>
        <DialogContent size="md" className="rounded-3xl p-6">
          {broadcastingItem && (
            <>
              <DialogHeader>
                <div className="size-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center mb-1">
                  <Share2 className="size-5" />
                </div>
                <DialogTitle className="text-lg font-black text-neutral-900">
                  Difundir Comunicado a Familias
                </DialogTitle>
                <DialogDescription className="text-xs text-neutral-500">
                  Envía este aviso de inmediato a las familias y tutores de {schoolCode} por canales digitales.
                </DialogDescription>
              </DialogHeader>

              <DialogBody className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1 text-xs">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Comunicado Seleccionado
                  </span>
                  <p className="font-bold text-neutral-900 leading-snug">{broadcastingItem.title}</p>
                </div>

                {!broadcastResult ? (
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-neutral-700 block">
                      Selecciona los Canales de Difusión:
                    </Label>

                    <div className="space-y-2">
                      <label className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 cursor-pointer">
                        <div className="flex items-center gap-2.5">
                          <MessageSquare className="size-4 text-emerald-600" />
                          <div>
                            <span className="text-xs font-bold text-neutral-800 block">
                              WhatsApp Institucional
                            </span>
                            <span className="text-[10px] text-neutral-400">
                              Mensaje directo a los 24 tutores con teléfono móvil
                            </span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedChannels.includes("WHATSAPP")}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedChannels([...selectedChannels, "WHATSAPP"]);
                            else setSelectedChannels(selectedChannels.filter((c) => c !== "WHATSAPP"));
                          }}
                          className="size-4 rounded accent-neutral-900"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 cursor-pointer">
                        <div className="flex items-center gap-2.5">
                          <Mail className="size-4 text-blue-600" />
                          <div>
                            <span className="text-xs font-bold text-neutral-800 block">
                              Correo Electrónico Masivo
                            </span>
                            <span className="text-[10px] text-neutral-400">
                              Envío formal con circular en formato HTML
                            </span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedChannels.includes("EMAIL")}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedChannels([...selectedChannels, "EMAIL"]);
                            else setSelectedChannels(selectedChannels.filter((c) => c !== "EMAIL"));
                          }}
                          className="size-4 rounded accent-neutral-900"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-lime-50 border border-lime-300 text-center space-y-2 animate-in fade-in">
                    <CheckCircle2 className="size-8 text-lime-600 mx-auto" />
                    <h4 className="text-sm font-black text-lime-900">
                      ¡Difusión Enviada con Éxito!
                    </h4>
                    <p className="text-xs text-lime-800 leading-relaxed">
                      Se ha transmitido la circular a <strong>{broadcastResult.totalRecipients} familias</strong> a través de {broadcastResult.channels.join(" y ")}.
                    </p>
                  </div>
                )}
              </DialogBody>

              <DialogFooter className="border-t border-neutral-200 pt-3">
                <Button
                  variant="outline"
                  onClick={() => setBroadcastingItem(null)}
                  disabled={isBroadcasting}
                  className="rounded-xl text-xs font-bold"
                >
                  {broadcastResult ? "Cerrar" : "Cancelar"}
                </Button>

                {!broadcastResult && (
                  <Button
                    onClick={handleConfirmBroadcast}
                    disabled={isBroadcasting || selectedChannels.length === 0}
                    className="rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white gap-1.5 shadow-xs"
                  >
                    {isBroadcasting ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        <span>Transmitiendo Difusión...</span>
                      </>
                    ) : (
                      <>
                        <Send className="size-3.5" />
                        <span>Confirmar y Enviar a 24 Familias</span>
                      </>
                    )}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 3: PUBLICAR COMUNICADO */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent size="lg" className="rounded-3xl p-6 min-h-[480px]">
          <DialogHeader>
            <DialogTitle>Publicar Nuevo Comunicado</DialogTitle>
            <DialogDescription>
              Difunde un mensaje o circular para la comunidad educativa de {schoolCode}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="flex flex-col flex-1">
            <DialogBody className="space-y-4">
              {formError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0 text-red-500" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold text-neutral-700">
                    Título del Comunicado <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className="h-10 rounded-xl text-xs font-bold"
                    placeholder="Ej. Convocatoria a Entrega de Calificaciones - I Parcial 2026"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700">
                    Tipo de Comunicado <span className="text-red-500">*</span>
                  </Label>
                  <Combobox
                    options={[
                      { value: "GENERAL", label: "General / Informativo" },
                      { value: "ACADEMIC", label: "Académico / Exámenes" },
                      { value: "EVENT", label: "Evento Escolar" },
                      { value: "MEETING", label: "Reunión de Padres / APF" },
                      { value: "URGENT", label: "Urgente / Emergencia" },
                    ]}
                    value={form.announcementType}
                    onChange={(val) => setForm({ ...form, announcementType: val || "GENERAL" })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700">
                    Audiencia Objetivo <span className="text-red-500">*</span>
                  </Label>
                  <Combobox
                    options={[
                      { value: "ALL", label: "Toda la Comunidad Escolar" },
                      { value: "PARENTS", label: "Solo Padres y Tutores" },
                      { value: "STUDENTS", label: "Solo Estudiantes" },
                      { value: "TEACHERS", label: "Solo Docentes y Personal" },
                    ]}
                    value={form.targetAudience}
                    onChange={(val) => setForm({ ...form, targetAudience: val || "ALL" })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700">
                    Prioridad <span className="text-red-500">*</span>
                  </Label>
                  <Combobox
                    options={[
                      { value: "NORMAL", label: "Prioridad Normal" },
                      { value: "HIGH", label: "Prioridad Alta" },
                      { value: "URGENT", label: "Prioridad Urgente" },
                    ]}
                    value={form.priority}
                    onChange={(val) => setForm({ ...form, priority: val || "NORMAL" })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700">
                    Fecha de Vencimiento (Opcional)
                  </Label>
                  <Input
                    type="date"
                    className="h-10 rounded-xl text-xs"
                    value={form.expiryDate}
                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200 bg-neutral-50/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isPinned}
                      onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
                      className="size-4 rounded accent-neutral-900"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-neutral-900 block">
                        Fijar en la parte superior de la Cartelera (Pinned)
                      </span>
                      <span className="text-neutral-400 text-[10px]">
                        Aparecerá como banner destacado para toda la institución.
                      </span>
                    </div>
                  </label>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold text-neutral-700">
                    Mensaje / Contenido Completo <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    rows={4}
                    className="rounded-xl text-xs p-3 border-neutral-200"
                    placeholder="Escribe el cuerpo del comunicado, indicaciones o cronograma..."
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    required
                  />
                </div>
              </div>
            </DialogBody>

            <DialogFooter className="border-t border-neutral-200 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="rounded-xl text-xs font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold shadow-xs gap-1.5 px-4"
              >
                {isSubmitting ? (
                  <><Loader2 className="size-3.5 animate-spin" />Publicando...</>
                ) : (
                  <>
                    <Send className="size-3.5 text-lime-400" />
                    <span>Publicar Circular</span>
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
