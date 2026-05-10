"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { DocumentService } from "@/lib/services/document.service";
import { toast } from "sonner";

const CATEGORIES = [
  "Policy",
  "Invoice",
  "EmployeeRecord",
  "Contract",
  "Report",
  "TaskAttachment",
  "Other",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DocumentUploadModal({
  open,
  onClose,
  onSuccess,
}: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Other");
  const [tagsInput, setTagsInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<
    "idle" | "uploading" | "confirming" | "done"
  >("idle");
  const [dragOver, setDragOver] = useState(false);

  const resetForm = () => {
    setFile(null);
    setTitle("");
    setCategory("Other");
    setTagsInput("");
    setUploading(false);
    setProgress(0);
    setStep("idle");
  };

  const handleClose = () => {
    if (uploading) return;
    resetForm();
    onClose();
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.size > MAX_FILE_SIZE) {
        toast.error("File size exceeds 50MB limit.");
        return;
      }
      setFile(droppedFile);
      if (!title) setTitle(droppedFile.name.replace(/\.[^.]+$/, ""));
    }
  }, [title]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > MAX_FILE_SIZE) {
        toast.error("File size exceeds 50MB limit.");
        return;
      }
      setFile(selectedFile);
      if (!title) setTitle(selectedFile.name.replace(/\.[^.]+$/, ""));
    }
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      toast.error("Please select a file and provide a title.");
      return;
    }

    setUploading(true);
    setStep("uploading");

    try {
      // Step 1: Get presigned URL
      const { uploadUrl, key } = await DocumentService.getUploadUrl(
        file.name,
        file.type,
        category
      );

      // Step 2: Upload directly to R2
      await DocumentService.uploadToR2(uploadUrl, file, (percent) => {
        setProgress(percent);
      });

      setStep("confirming");

      // Step 3: Confirm with backend
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      await DocumentService.confirmUpload({
        title: title.trim(),
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        key,
        category,
        tags,
      });

      setStep("done");
      toast.success("Document uploaded successfully!");

      setTimeout(() => {
        resetForm();
        onClose();
        onSuccess();
      }, 800);
    } catch (error: any) {
      console.error("Upload failed:", error);
      toast.error(error?.response?.data?.message || "Upload failed. Please try again.");
      setStep("idle");
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Upload Document
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Dropzone */}
          {!file ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
                dragOver
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                  : "border-slate-300 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
              onClick={() =>
                document.getElementById("file-upload-input")?.click()
              }
            >
              <Upload className="h-10 w-10 mx-auto text-slate-400 mb-3" />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-blue-600">
                  Click to upload
                </span>{" "}
                or drag and drop
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Max file size: 50MB
              </p>
              <input
                id="file-upload-input"
                type="file"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <FileText className="h-8 w-8 text-blue-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-slate-500">
                  {formatFileSize(file.size)}
                </p>
              </div>
              {!uploading && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Progress Bar */}
          {step !== "idle" && step !== "done" && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  {step === "uploading"
                    ? "Uploading..."
                    : "Saving metadata..."}
                </span>
                <span>{step === "uploading" ? `${progress}%` : "..."}</span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{
                    width: `${step === "uploading" ? progress : 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg text-green-700 dark:text-green-400 text-sm">
              <CheckCircle2 className="h-5 w-5" />
              Document uploaded successfully!
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="doc-title">Title</Label>
            <Input
              id="doc-title"
              placeholder="e.g. Employee Handbook v2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={setCategory}
              disabled={uploading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c.replace(/([A-Z])/g, " $1").trim()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label htmlFor="doc-tags">Tags (comma-separated)</Label>
            <Input
              id="doc-tags"
              placeholder="e.g. hr, policy, 2026"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              disabled={uploading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={uploading || !file}>
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
