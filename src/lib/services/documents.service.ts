import { fetchApi } from '../api-client';

export interface Document {
  publicId: string;
  documentType: string;
  fileUrl: string;
  filename?: string;
  originalFilename?: string;
  fileSize?: number;
  fileType?: string;
  description?: string;
  assignmentId?: number;
  assignmentSubmissionId?: number;
  isTeacherUpload?: boolean;
}

export const documentsService = {
  uploadDocument: async (formData: FormData) => {
    return fetchApi<{ status: boolean; message: string; data: Document }>('/documents', {
      method: 'POST',
      body: formData,
    });
  },

  getDocumentsByAssignment: async (assignmentId: number) => {
    return fetchApi<{ status: boolean; message: string; data: Document[] }>(`/documents/assignment/${assignmentId}`, {
      method: 'GET',
    });
  },

  getDocumentsBySubmission: async (submissionId: number) => {
    return fetchApi<{ status: boolean; message: string; data: Document[] }>(`/documents/submission/${submissionId}`, {
      method: 'GET',
    });
  },

  deleteDocument: async (publicId: string) => {
    return fetchApi<{ status: boolean; message: string; data: null }>(`/documents/${publicId}`, {
      method: 'DELETE',
    });
  }
};
