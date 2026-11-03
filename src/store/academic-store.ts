import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { academicsService, AcademicYear } from "@/lib/services/academics.service";

interface AcademicState {
  academicYears: AcademicYear[];
  selectedYear: AcademicYear | null;
  isLoading: boolean;
  setSelectedYear: (year: AcademicYear | null) => void;
  setAcademicYears: (years: AcademicYear[]) => void;
  loadAcademicYears: () => Promise<AcademicYear[]>;
}

export const useAcademicStore = create<AcademicState>()(
  persist(
    (set, get) => ({
      academicYears: [],
      selectedYear: null,
      isLoading: false,

      setSelectedYear: (year: AcademicYear | null) => {
        set({ selectedYear: year });
      },

      setAcademicYears: (years: AcademicYear[]) => {
        const currentSelected = get().selectedYear;
        const exists = currentSelected && years.some((y) => y.id === currentSelected.id);
        const active = exists ? currentSelected : (years.find((y) => y.isCurrent) || years[0] || null);
        set({ academicYears: years, selectedYear: active });
      },

      loadAcademicYears: async () => {
        set({ isLoading: true });
        try {
          const res = await academicsService.getAcademicYears();
          if (res && res.data && res.data.length > 0) {
            get().setAcademicYears(res.data);
            return res.data;
          }
          return [];
        } catch (error) {
          console.error("Error loading academic years:", error);
          return [];
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "academic-store",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      })),
    }
  )
);
