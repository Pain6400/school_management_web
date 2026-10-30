import { fetchApi } from "../api-client";

export interface Announcement {
  id: number;
  schoolCode: string;
  title: string;
  content: string;
  announcementType?: string; // GENERAL, ACADEMIC, URGENT, EVENT, MEETING
  type?: string; // Alias para announcementType
  priority?: string; // NORMAL, HIGH, URGENT
  targetAudience?: string; // ALL, PARENTS, STUDENTS, TEACHERS
  isPinned?: boolean;
  attachmentUrl?: string;
  publishDate: string;
  expiryDate?: string;
  createdBy?: string;
  school?: {
    code: string;
    name: string;
  };
  creator?: {
    firstName?: string;
    lastName?: string;
    username?: string;
  };
}

export interface BroadcastResult {
  announcementId: number;
  totalRecipients: number;
  channels: string[];
  sentAt: string;
  status: "SENT" | "PENDING";
  summary: {
    whatsapp: number;
    email: number;
    push: number;
  };
}

export const communicationService = {
  getAnnouncements: async (params?: { schoolCode?: string; targetAudience?: string }) => {
    const q = new URLSearchParams();
    if (params?.schoolCode && params.schoolCode !== "ALL") q.append("schoolCode", params.schoolCode);
    if (params?.targetAudience && params.targetAudience !== "ALL") q.append("targetAudience", params.targetAudience);
    const qs = q.toString() ? `?${q.toString()}` : "";

    return fetchApi<{ status: boolean; message: string; data: Announcement[] }>(`/announcements${qs}`, {
      method: "GET",
    });
  },

  getAnnouncementsBySchool: async (schoolCode: string) => {
    return fetchApi<{ status: boolean; message: string; data: Announcement[] }>(`/announcements/school/${schoolCode}`, {
      method: "GET",
    });
  },

  createAnnouncement: async (data: {
    schoolCode: string;
    title: string;
    content: string;
    announcementType?: string;
    priority?: string;
    targetAudience?: string;
    isPinned?: boolean;
    attachmentUrl?: string;
    publishDate?: string;
    expiryDate?: string;
    createdBy?: string;
  }) => {
    return fetchApi<{ status: boolean; message: string; data: Announcement }>("/announcements", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  deleteAnnouncement: async (id: number) => {
    return fetchApi<{ status: boolean; message: string; data: null }>(`/announcements/${id}`, {
      method: "DELETE",
    });
  },

  // Simulación de difusión masiva multicanal (WhatsApp, Email, Push)
  broadcastToParents: async (
    announcementId: number,
    channels: string[] = ["WHATSAPP", "EMAIL"]
  ): Promise<{ status: boolean; message: string; data: BroadcastResult }> => {
    // In live system, triggers background worker or notification gateway
    return {
      status: true,
      message: "Difusión institucional enviada exitosamente a todas las familias registradas",
      data: {
        announcementId,
        totalRecipients: 24,
        channels,
        sentAt: new Date().toISOString(),
        status: "SENT",
        summary: {
          whatsapp: channels.includes("WHATSAPP") ? 24 : 0,
          email: channels.includes("EMAIL") ? 24 : 0,
          push: channels.includes("PUSH") ? 18 : 0,
        },
      },
    };
  },
};
