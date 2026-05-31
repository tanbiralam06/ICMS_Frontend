import api from "@/lib/api";
import axios from "axios";

export interface DocumentMeta {
  _id: string;
  title: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  key?: string;
  isExternal: boolean;
  url?: string;
  allowedViewers: string[];
  category: string;
  tags: string[];
  uploadedBy: {
    _id: string;
    fullName: string;
    email: string;
    employeeId: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentLogEntry {
  _id: string;
  documentId: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
    employeeId: string;
  };
  action: "VIEW" | "DOWNLOAD";
  ipAddress: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  documents?: T[];
  logs?: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const DocumentService = {
  // Get presigned upload URL
  getUploadUrl: async (fileName: string, fileType: string, category: string, path?: string) => {
    const { data } = await api.get("/documents/upload-url", {
      params: { fileName, fileType, category, path },
    });
    return data as { uploadUrl: string; key: string };
  },

  // Upload file directly to R2 via presigned URL
  uploadToR2: async (
    uploadUrl: string,
    file: File,
    onProgress?: (percent: number) => void
  ) => {
    await axios.put(uploadUrl, file, {
      headers: { "Content-Type": file.type },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percent);
        }
      },
    });
  },

  // Confirm upload and save metadata
  confirmUpload: async (docData: {
    title: string;
    originalName?: string;
    mimeType?: string;
    size?: number;
    key?: string;
    isExternal?: boolean;
    url?: string;
    allowedViewers?: string[];
    category: string;
    tags: string[];
  }) => {
    const { data } = await api.post("/documents/confirm", docData);
    return data as DocumentMeta;
  },

  // List documents
  getAll: async (params?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const { data } = await api.get("/documents", { params });
    return data as PaginatedResponse<DocumentMeta>;
  },

  // Get single document
  getById: async (id: string) => {
    const { data } = await api.get(`/documents/${id}`);
    return data as DocumentMeta;
  },

  // Get download URL
  getDownloadUrl: async (id: string) => {
    const { data } = await api.get(`/documents/${id}/download`);
    return data as { downloadUrl: string; document: DocumentMeta };
  },

  // Get audit logs for a document (Admin)
  getLogs: async (id: string, params?: { page?: number; limit?: number }) => {
    const { data } = await api.get(`/documents/${id}/logs`, { params });
    return data as PaginatedResponse<DocumentLogEntry>;
  },

  // Delete a document
  delete: async (id: string) => {
    const { data } = await api.delete(`/documents/${id}`);
    return data;
  },

  // Check if a URL already exists as an active document
  checkUrl: async (url: string) => {
    const { data } = await api.get("/documents/check-url", { params: { url } });
    return data as {
      exists: boolean;
      document?: {
        _id: string;
        title: string;
        uploadedBy: string;
      };
    };
  },
};
