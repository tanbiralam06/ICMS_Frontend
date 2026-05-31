"use client";

import { useState, useCallback, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, X, FileText, Loader2, CheckCircle2, Link as LinkIcon, Users, AlertTriangle } from "lucide-react";
import { DocumentService } from "@/lib/services/document.service";
import { UserService, DirectoryUser } from "@/lib/services/user.service";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [isExternal, setIsExternal] = useState(false);
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Other");
  const [tagsInput, setTagsInput] = useState("");
  const [allowedViewers, setAllowedViewers] = useState<string[]>([]);
  const [directory, setDirectory] = useState<DirectoryUser[]>([]);
  
  // Duplicate check states (Option D)
  const [duplicateWarning, setDuplicateWarning] = useState<{ title: string; owner: string } | null>(null);
  const [bypassDuplicateCheck, setBypassDuplicateCheck] = useState(false);
  
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<
    "idle" | "uploading" | "confirming" | "done"
  >("idle");
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (open) {
      UserService.getDirectory()
        .then(setDirectory)
        .catch((err) => console.error("Failed to load directory", err));
    }
  }, [open]);

  const resetForm = () => {
    setFile(null);
    setTitle("");
    setCategory("Other");
    setTagsInput("");
    setUrl("");
    setIsExternal(false);
    setAllowedViewers([]);
    setDuplicateWarning(null);
    setBypassDuplicateCheck(false);
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
    if (isExternal) return;
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.size > MAX_FILE_SIZE) {
        toast.error("File size exceeds 50MB limit.");
        return;
      }
      setFile(droppedFile);
      if (!title) setTitle(droppedFile.name.replace(/\.[^.]+$/, ""));
    }
  }, [title, isExternal]);

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
    if (isExternal) {
      if (!title.trim() || !url.trim()) {
        toast.error("Please provide a title and URL.");
        return;
      }
    } else {
      if (!file || !title.trim()) {
        toast.error("Please select a file and provide a title.");
        return;
      }
    }

    // Option D: Duplicate URL checking intercept
    if (isExternal && !bypassDuplicateCheck) {
      setUploading(true);
      try {
        const checkResult = await DocumentService.checkUrl(url.trim());
        if (checkResult.exists && checkResult.document) {
          setDuplicateWarning({
            title: checkResult.document.title,
            owner: checkResult.document.uploadedBy
          });
          setBypassDuplicateCheck(true);
          setUploading(false);
          toast.warning("Duplicate URL detected. Review the warning below before adding anyway.");
          return;
        }
      } catch (err) {
        console.error("Duplicate check failed:", err);
      } finally {
        setUploading(false);
      }
    }

    setUploading(true);
    
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      if (isExternal) {
        setStep("confirming");
        await DocumentService.confirmUpload({
          title: title.trim(),
          isExternal: true,
          url: url.trim(),
          category,
          tags,
          allowedViewers,
        });
      } else {
        setStep("uploading");
        // Step 1: Get presigned URL
        const { uploadUrl, key } = await DocumentService.getUploadUrl(
          file!.name,
          file!.type || "application/octet-stream",
          category
        );

        // Step 2: Upload directly to R2
        await DocumentService.uploadToR2(uploadUrl, file!, (percent) => {
          setProgress(percent);
        });

        setStep("confirming");

        // Step 3: Confirm with backend
        await DocumentService.confirmUpload({
          title: title.trim(),
          originalName: file!.name,
          mimeType: file!.type || "application/octet-stream",
          size: file!.size,
          key,
          category,
          tags,
          allowedViewers,
        });
      }

      setStep("done");
      toast.success(isExternal ? "Link added successfully!" : "Document uploaded successfully!");

      setTimeout(() => {
        resetForm();
        onClose();
        onSuccess();
      }, 800);
    } catch (error: any) {
      const detailedError = error?.response?.data?.error;
      const genericMessage = error?.response?.data?.message || "Operation failed. Please try again.";
      toast.error(detailedError ? `${genericMessage}: ${detailedError}` : genericMessage);
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

  const toggleViewer = (userId: string) => {
    setAllowedViewers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Add Document
          </DialogTitle>
        </DialogHeader>

        <Tabs 
          defaultValue="file" 
          onValueChange={(val) => setIsExternal(val === "url")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="file" disabled={uploading}>Upload File</TabsTrigger>
            <TabsTrigger value="url" disabled={uploading}>External Link</TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4">
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
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="doc-url">Document URL</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="doc-url"
                  placeholder="https://docs.google.com/..."
                  className="pl-9"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (duplicateWarning) {
                      setDuplicateWarning(null);
                      setBypassDuplicateCheck(false);
                    }
                  }}
                  disabled={uploading}
                />
              </div>
              {duplicateWarning && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg border border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 text-xs mt-2 transition-all duration-200">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600 dark:text-amber-500 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-amber-900 dark:text-amber-300">Duplicate URL Detected</p>
                    <p>
                      This link has already been added as <span className="font-semibold underline">"{duplicateWarning.title}"</span> by <span className="font-semibold">{duplicateWarning.owner}</span>.
                    </p>
                    <p className="mt-1 text-slate-500 dark:text-slate-400">
                      If you want to add this link anyway with new options/permissions, click <strong>"Add Anyway"</strong>.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-4 py-2">
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
              Document saved successfully!
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

          <div className="grid grid-cols-2 gap-4">
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
                placeholder="e.g. hr, policy"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                disabled={uploading}
              />
            </div>
          </div>

          {/* Viewers */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Specific Viewers (Optional)
            </Label>
            <p className="text-xs text-muted-foreground">
              If no one is selected, the document will be visible to everyone. Admins can always view all documents.
            </p>
            <ScrollArea className="h-[120px] border rounded-md p-2">
              {directory.map(user => (
                <div key={user._id} className="flex items-center space-x-2 py-1">
                  <Checkbox 
                    id={`user-${user._id}`} 
                    checked={allowedViewers.includes(user._id)}
                    onCheckedChange={() => toggleViewer(user._id)}
                    disabled={uploading}
                  />
                  <label 
                    htmlFor={`user-${user._id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                  >
                    {user.fullName} <span className="text-xs text-muted-foreground ml-1">({user.email})</span>
                  </label>
                </div>
              ))}
              {directory.length === 0 && (
                <p className="text-sm text-center text-muted-foreground mt-4">Loading users...</p>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={uploading || (!isExternal && !file)}
            className={duplicateWarning ? "bg-amber-600 hover:bg-amber-700 text-white border-amber-700" : ""}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {isExternal ? (duplicateWarning ? "Add Anyway" : "Add Link") : "Upload File"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
