import { fetchApi } from "../api-client";

export interface Announcement {
  id: number;
  schoolCode: string;
  title: string;
  content: string;
  announcementType?: string; // GENERAL, ACADEMIC, URGENT, EVENT
  priority?: string; // NORMAL, HIGH, URGENT
  publishDate: string;
  expiryDate?: string;
  createdBy?: string;
}

export const communicationService = {
  getAnnouncements: async () => {
    return fetchApi<{ status: boolean; message: string; data: Announcement[] }>("/announcements", {
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
};
