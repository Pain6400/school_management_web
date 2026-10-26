"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, X, User, GraduationCap, Check, School, ShieldAlert } from "lucide-react";
import { studentsService, Student } from "@/lib/services/api.service";

interface AsyncStudentSearchProps {
  selectedStudent: Student | null;
  onSelectStudent: (student: Student | null) => void;
  schoolCode?: string;
  placeholder?: string;
  className?: string;
}

export function AsyncStudentSearch({
  selectedStudent,
  onSelectStudent,
  schoolCode,
  placeholder = "Escribe DNI (ej. 0501199710597) o nombre del estudiante...",
  className = "",
}: AsyncStudentSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync input when selectedStudent changes externally
  useEffect(() => {
    if (selectedStudent) {
      setSearchTerm(`${selectedStudent.firstName || ""} ${selectedStudent.lastName || ""}`.trim());
    } else {
      setSearchTerm("");
      setResults([]);
      setHasSearched(false);
    }
  }, [selectedStudent]);

  // Handle Search Input Change with Debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    // If typing while a student was already selected, clear current selection
    if (selectedStudent && value !== `${selectedStudent.firstName || ""} ${selectedStudent.lastName || ""}`.trim()) {
      onSelectStudent(null);
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      setHasSearched(false);
      setIsOpen(true);
      return;
    }

    setLoading(true);
    setIsOpen(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        // ALWAYS use the fast, dedicated combobox endpoint: GET /students/search?q=...&schoolCode=...
        const res = await studentsService.searchStudents(trimmed, schoolCode);
        if (res.status && Array.isArray(res.data)) {
          setResults(res.data);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error("Error al buscar estudiantes en combobox:", err);
        setResults([]);
      } finally {
        setLoading(false);
        setHasSearched(true);
      }
    }, 250);
  };

  const handleSelect = (student: Student) => {
    onSelectStudent(student);
    setSearchTerm(`${student.firstName || ""} ${student.lastName || ""}`.trim());
    setIsOpen(false);
  };

  const handleClear = () => {
    setSearchTerm("");
    setResults([]);
    setHasSearched(false);
    onSelectStudent(null);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Search Input Box */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => {
            if (searchTerm.trim().length >= 2 || results.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className="w-full h-11 rounded-xl bg-white border border-neutral-200/90 pl-10 pr-10 text-xs font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-950 transition-all"
        />

        {/* Loading Spinner or Clear Button */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading ? (
            <Loader2 className="size-4 animate-spin text-neutral-400" />
          ) : searchTerm ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
              title="Borrar búsqueda"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Floating Dropdown Results */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 max-h-72 overflow-y-auto rounded-2xl bg-white border border-neutral-200 shadow-xl p-1.5 space-y-1 animate-in fade-in-0 zoom-in-95 duration-100">
          {searchTerm.trim().length < 2 ? (
            <div className="py-6 px-4 text-center text-xs text-neutral-400 space-y-1">
              <Search className="size-5 mx-auto text-neutral-300" />
              <div className="font-semibold text-neutral-600">Ingresa al menos 2 caracteres</div>
              <p className="text-[11px] text-neutral-400">
                Puedes buscar por DNI/identidad (ej. <span className="font-mono text-neutral-700 font-bold">0501199710597</span>), nombre completo o carnet.
              </p>
            </div>
          ) : loading ? (
            <div className="py-6 px-4 text-center text-xs text-neutral-500 flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin text-neutral-600" />
              <span>Buscando en padrón estudiantil...</span>
            </div>
          ) : results.length === 0 && hasSearched ? (
            <div className="py-6 px-4 text-center text-xs text-neutral-400 space-y-1">
              <User className="size-5 mx-auto text-neutral-300" />
              <div className="font-semibold text-neutral-600">No se encontraron estudiantes para &quot;{searchTerm}&quot;</div>
              <p className="text-[11px] text-neutral-400">
                Verifica el DNI (ej. sin guiones o completo) o nombre del estudiante.
              </p>
            </div>
          ) : (
            results.map((student) => {
              const isSelected = selectedStudent?.publicId === student.publicId;
              const sch = Number(student.scholarshipPercentage) || 0;
              const initials = `${student.firstName?.[0] || ""}${student.lastName?.[0] || ""}`.toUpperCase() || "E";

              return (
                <button
                  key={student.publicId}
                  type="button"
                  onClick={() => handleSelect(student)}
                  className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? "bg-neutral-900 text-white"
                      : "hover:bg-neutral-100/80 text-neutral-900"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`size-8 rounded-lg font-black text-xs flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-neutral-800 text-lime-400 border border-neutral-700"
                          : "bg-neutral-100 text-neutral-800 border border-neutral-200"
                      }`}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs truncate">
                        {student.firstName} {student.lastName}
                      </div>
                      <div
                        className={`text-[10px] font-mono truncate flex items-center gap-2 ${
                          isSelected ? "text-neutral-400" : "text-neutral-500"
                        }`}
                      >
                        {student.identityNumber && <span>DNI: {student.identityNumber}</span>}
                        {student.userCode && <span>• Carnet: {student.userCode}</span>}
                        {student.schoolCode && (
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold ${isSelected ? "bg-neutral-800 text-neutral-300" : "bg-neutral-100 text-neutral-600"}`}>
                            {student.schoolCode}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {sch === 100 ? (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isSelected
                            ? "bg-amber-400 text-neutral-950 font-black"
                            : "bg-amber-100 text-amber-900 border border-amber-200"
                        }`}
                      >
                        Beca 100%
                      </span>
                    ) : sch > 0 ? (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isSelected
                            ? "bg-blue-400 text-neutral-950 font-black"
                            : "bg-blue-100 text-blue-900 border border-blue-200"
                        }`}
                      >
                        Beca {sch}%
                      </span>
                    ) : null}

                    {isSelected && <Check className="size-4 text-lime-400" />}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
