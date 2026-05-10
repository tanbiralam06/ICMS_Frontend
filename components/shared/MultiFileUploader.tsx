"use client";

import { useState } from "react";
import { Upload, X, FileText, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentService } from "@/lib/services/document.service";
import { toast } from "sonner";

interface MultiFileUploaderProps {
  onUploadComplete: (documentIds: string[]) => void;
  category: string;
  path?: string;
  existingDocuments?: any[];
}

export function MultiFileUploader({
  onUploadComplete,
  category,
  path,
  existingDocuments = [],
}: MultiFileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<any[]>(existingDocuments);
  const [progress, setProgress] = useState<{ [key: string]: number }>({});

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    const newDocIds: string[] = [...uploadedDocs.map((d) => d._id)];

    for (const file of files) {
      try {
        // 1. Get Presigned URL
        const { uploadUrl, key } = await DocumentService.getUploadUrl(
          file.name,
          file.type,
          category,
          path
        );

        // 2. Upload to R2
        await DocumentService.uploadToR2(uploadUrl, file, (p) => {
          setProgress((prev) => ({ ...prev, [file.name]: p }));
        });

        // 3. Confirm with Backend
        const doc = await DocumentService.confirmUpload({
          title: file.name.replace(/\.[^.]+$/, ""),
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          key,
          category,
          tags: ["inventory", "receipt"],
        });

        newDocIds.push(doc._id);
        setUploadedDocs((prev) => [...prev, doc]);
        onUploadComplete(newDocIds);
        toast.success(`Uploaded ${file.name}`);
      } catch (error) {
        console.error(`Failed to upload ${file.name}`, error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setUploading(false);
    setProgress({});
  };

  const removeDoc = async (id: string) => {
    try {
      await DocumentService.delete(id);
      const updated = uploadedDocs.filter((d) => d._id !== id);
      setUploadedDocs(updated);
      onUploadComplete(updated.map((d) => d._id));
      toast.success("File removed");
    } catch (error) {
      toast.error("Failed to delete file from storage");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {uploadedDocs.map((doc) => (
          <div
            key={doc._id}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 text-sm"
          >
            <FileText className="h-4 w-4 text-blue-500" />
            <span className="max-w-[150px] truncate font-medium">
              {doc.title || doc.originalName}
            </span>
            <button
              onClick={() => removeDoc(doc._id)}
              className="text-slate-400 hover:text-red-500 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {uploading &&
          Object.entries(progress).map(([name, p]) => (
            <div
              key={name}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800 text-sm animate-pulse"
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
              <span className="max-w-[100px] truncate text-blue-600">
                {name}
              </span>
              <span className="text-[10px] font-bold text-blue-500">{p}%</span>
            </div>
          ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-dashed"
          disabled={uploading}
          onClick={() => document.getElementById("multi-file-input")?.click()}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Attachments
        </Button>
        <input
          id="multi-file-input"
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      <p className="text-[10px] text-muted-foreground italic">
        Upload invoices, delivery notes, or quality certificates.
      </p>
    </div>
  );
}
