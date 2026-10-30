import { fetchApi } from "../api-client";

export interface AuditLogItem {
  id: string;
  schoolCode: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    publicId: string;
    username: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    roles?: string[];
  };
}

export const auditService = {
  getLogs: async (schoolCode: string = "ESC002") => {
    return fetchApi<{ status: boolean; message: string; data: AuditLogItem[] }>(
      `/audit-logs?schoolCode=${schoolCode}`,
      { method: "GET" }
    );
  },
  getLogsByUser: async (userId: string) => {
    return fetchApi<{ status: boolean; message: string; data: AuditLogItem[] }>(
      `/audit-logs/user/${userId}`,
      { method: "GET" }
    );
  },
};

