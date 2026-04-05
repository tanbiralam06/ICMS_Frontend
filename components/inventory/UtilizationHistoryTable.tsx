"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface UtilizationHistoryTableProps {
  logs: any[];
}

export function UtilizationHistoryTable({ logs }: UtilizationHistoryTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLogs = logs.filter((log) => {
    const query = searchQuery.toLowerCase();
    const uniqueId = (log.uniqueId || "").toLowerCase();
    const materialName = (log.receiptId?.materialName || "").toLowerCase();
    return uniqueId.includes(query) || materialName.includes(query);
  });

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search Unique ID or Material..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Unique ID</TableHead>
              <TableHead>Units Used</TableHead>
              <TableHead>Utilized By</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Purpose</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log._id}>
                <TableCell className="whitespace-nowrap">
                  {format(new Date(log.usageDate), "PP")}
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <p className="font-medium break-words">{log.receiptId?.materialName}</p>
                </TableCell>
                <TableCell className="font-mono text-[10px] font-bold">
                  {log.uniqueId}
                </TableCell>
                <TableCell className="font-semibold text-orange-600 whitespace-nowrap">
                  -{log.utilizedUnits}
                </TableCell>
                <TableCell className="max-w-[150px] truncate" title={log.utilizerId?.fullName}>
                  {log.utilizerId?.fullName}
                </TableCell>
                <TableCell className="max-w-[150px] truncate" title={log.locationAtUsage}>
                  {log.locationAtUsage}
                </TableCell>
                <TableCell className="max-w-[150px] truncate" title={log.description}>
                  {log.description}
                </TableCell>
              </TableRow>
            ))}
            {filteredLogs.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  {searchQuery ? `No logs found for "${searchQuery}"` : "No utilization logs found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
