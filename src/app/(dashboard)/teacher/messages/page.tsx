"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Mail, Send, Inbox, Star, Clock, MoreVertical, Edit, CheckSquare, CornerUpLeft } from "lucide-react";

const DUMMY_EMAILS = [
  {
    id: 1,
    sender: "Ana Martínez",
    role: "Estudiante",
    subject: "Duda sobre el proyecto final de ciencias",
    preview: "Estimado profesor, quería consultarle si podemos usar materiales reciclados para la maqueta...",
    time: "10:30 AM",
    unread: true,
    avatar: "A"
  },
  {
    id: 2,
    sender: "Dirección Académica",
    role: "Administración",
    subject: "Recordatorio: Cierre de actas próximo viernes",
    preview: "Por favor recuerden subir todas las calificaciones al sistema antes de las 18:00 hrs del viernes.",
    time: "Ayer",
    unread: false,
    avatar: "D"
  },
  {
    id: 3,
    sender: "Carlos Ruiz (Tutor)",
    role: "Padre de Familia",
    subject: "Justificación de inasistencia de Mateo Ruiz",
    preview: "Buenos días, adjunto el certificado médico de Mateo por su ausencia de ayer...",
    time: "Lun",
    unread: false,
    avatar: "C"
  }
];

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState("inbox");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Centro de Mensajería</h1>
          <p className="text-sm text-neutral-500">Comunícate con estudiantes, padres y administración</p>
        </div>
        <Button className="h-11 px-6 rounded-2xl bg-lime-400 hover:bg-lime-500 text-neutral-950 font-black shadow-xs transition-transform active:scale-95">
          <Edit className="size-4 mr-2" />
          Redactar Nuevo
        </Button>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-64 shrink-0 flex flex-col gap-2">
          <Button 
            variant="ghost" 
            onClick={() => setActiveTab("inbox")}
            className={`justify-start h-12 px-4 rounded-xl font-bold transition-all ${
              activeTab === "inbox" ? "bg-neutral-950 text-white shadow-md" : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            <Inbox className="size-4 mr-3" /> Bandeja de Entrada
            <span className="ml-auto bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full">3</span>
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setActiveTab("sent")}
            className={`justify-start h-12 px-4 rounded-xl font-bold transition-all ${
              activeTab === "sent" ? "bg-neutral-950 text-white shadow-md" : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            <Send className="size-4 mr-3" /> Elementos Enviados
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setActiveTab("starred")}
            className={`justify-start h-12 px-4 rounded-xl font-bold transition-all ${
              activeTab === "starred" ? "bg-neutral-950 text-white shadow-md" : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            <Star className="size-4 mr-3" /> Destacados
          </Button>
        </div>

        {/* Mail List Area */}
        <Card className="flex-1 rounded-3xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col bg-white">
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
              <input 
                type="text" 
                placeholder="Buscar en correos..." 
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-neutral-200/80 bg-white text-sm outline-none focus:ring-2 focus:ring-lime-500/20 focus:border-lime-500 transition-all"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="size-10 rounded-xl border-neutral-200 text-neutral-500 hover:text-neutral-900">
                <CheckSquare className="size-4" />
              </Button>
              <Button variant="outline" size="icon" className="size-10 rounded-xl border-neutral-200 text-neutral-500 hover:text-neutral-900">
                <Clock className="size-4" />
              </Button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {DUMMY_EMAILS.map((email) => (
              <div 
                key={email.id} 
                className={`group flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all ${
                  email.unread ? "bg-blue-50/50 border border-blue-100" : "hover:bg-neutral-50 border border-transparent"
                }`}
              >
                <div className={`shrink-0 size-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm ${
                  email.role === 'Estudiante' ? 'bg-lime-200 text-lime-900' : 
                  email.role === 'Administración' ? 'bg-neutral-900 text-white' : 
                  'bg-indigo-100 text-indigo-800'
                }`}>
                  {email.avatar}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold truncate ${email.unread ? "text-neutral-900" : "text-neutral-700"}`}>
                        {email.sender}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-500 font-medium">
                        {email.role}
                      </span>
                    </div>
                    <span className={`text-xs whitespace-nowrap ${email.unread ? "font-bold text-blue-600" : "text-neutral-400"}`}>
                      {email.time}
                    </span>
                  </div>
                  
                  <h4 className={`text-sm mb-1 truncate ${email.unread ? "font-bold text-neutral-900" : "font-medium text-neutral-800"}`}>
                    {email.subject}
                  </h4>
                  <p className="text-xs text-neutral-500 truncate">
                    {email.preview}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="size-8 rounded-lg text-neutral-400 hover:text-neutral-900">
                    <CornerUpLeft className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-8 rounded-lg text-neutral-400 hover:text-amber-500">
                    <Star className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
