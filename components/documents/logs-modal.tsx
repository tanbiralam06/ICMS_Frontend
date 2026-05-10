"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, Download, Activity } from "lucide-react";
import {
  DocumentService,
  DocumentLogEntry,
} from "@/lib/services/document.service";
import { format } from "date-fns";

interface LogsModalProps {
  open: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
}

export function DocumentLogsModal({
  open,
  onClose,
  documentId,
  documentTitle,
}: LogsModalProps) {
  const [logs, setLogs] = useState<DocumentLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && documentId) {
      setLoading(true);
      DocumentService.getLogs(documentId)
        .then((res) => {
          setLogs(res.logs || []);
        })
        .catch((err) => console.error("Failed to fetch logs", err))
        .finally(() => setLoading(false));
    }
  }, [open, documentId]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-600" />
            Activity Log
          </DialogTitle>
          <p className="text-sm text-muted-foreground truncate">
            {documentTitle}
          </p>
        </DialogHeader>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Loading logs...
                    </div>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No activity recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">
                          {log.userId?.fullName || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.userId?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          log.action === "DOWNLOAD" ? "default" : "secondary"
                        }
                        className="gap-1"
                      >
                        {log.action === "DOWNLOAD" ? (
                          <Download className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {log.ipAddress || "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(log.createdAt), "dd MMM yyyy, hh:mm a")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
