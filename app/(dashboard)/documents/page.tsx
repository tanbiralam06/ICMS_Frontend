"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Search,
  FileText,
  Download,
  Trash2,
  Activity,
  Loader2,
  Filter,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DocumentService,
  DocumentMeta,
} from "@/lib/services/document.service";
import { DocumentUploadModal } from "@/components/documents/upload-modal";
import { DocumentLogsModal } from "@/components/documents/logs-modal";
import { format } from "date-fns";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "Policy", label: "Policy" },
  { value: "Invoice", label: "Invoice" },
  { value: "EmployeeRecord", label: "Employee Record" },
  { value: "Contract", label: "Contract" },
  { value: "Report", label: "Report" },
  { value: "TaskAttachment", label: "Task Attachment" },
  { value: "Other", label: "Other" },
];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentMeta | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setIsAdmin((user.roles || []).includes("Admin"));
      } catch {}
    }
  }, []);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 25 };
      if (category !== "all") params.category = category;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const result = await DocumentService.getAll(params);
      setDocuments(result.documents || []);
      setTotalPages(result.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Failed to fetch documents", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [page, category, searchTerm]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchDocuments();
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDownload = async (doc: DocumentMeta) => {
    setDownloadingId(doc._id);
    try {
      const result = await DocumentService.getDownloadUrl(doc._id);
      // Open the presigned URL in a new tab to trigger download
      window.open(result.downloadUrl, "_blank");
    } catch (error) {
      toast.error("Failed to generate download link");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await DocumentService.delete(id);
      toast.success("Document deleted");
      fetchDocuments();
    } catch (error) {
      toast.error("Failed to delete document");
    }
  };

  const handleViewLogs = (doc: DocumentMeta) => {
    setSelectedDoc(doc);
    setLogsOpen(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getCategoryColor = (cat: string) => {
    const map: Record<string, string> = {
      Policy: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      Invoice: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      EmployeeRecord: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      Contract: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      Report: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
      TaskAttachment: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
      Other: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    };
    return map[cat] || map["Other"];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Documents</h2>
          <p className="text-muted-foreground">
            Upload, manage, and track company documents.
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, filename, or tags..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select
          value={category}
          onValueChange={(v) => {
            setCategory(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading...
                  </div>
                </TableCell>
              </TableRow>
            ) : documents.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center"
                >
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <FolderOpen className="h-10 w-10" />
                    <p>No documents found.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUploadOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Upload your first document
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc._id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate max-w-[200px]">
                          {doc.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {doc.originalName}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(doc.category)}`}
                    >
                      {doc.category.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {doc.uploadedBy?.fullName || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatFileSize(doc.size)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(doc.createdAt), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(doc)}
                        disabled={downloadingId === doc._id}
                      >
                        {downloadingId === doc._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>

                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewLogs(doc)}
                        >
                          <Activity className="h-4 w-4 text-purple-500" />
                        </Button>
                      )}

                      {isAdmin && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Document
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete &quot;{doc.title}&quot;?
                                This action will remove the file from storage
                                permanently.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(doc._id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Upload Modal */}
      <DocumentUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={fetchDocuments}
      />

      {/* Logs Modal (Admin) */}
      {selectedDoc && (
        <DocumentLogsModal
          open={logsOpen}
          onClose={() => {
            setLogsOpen(false);
            setSelectedDoc(null);
          }}
          documentId={selectedDoc._id}
          documentTitle={selectedDoc.title}
        />
      )}
    </div>
  );
}
