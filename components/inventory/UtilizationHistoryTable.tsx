"use client";

import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, FileDown } from "lucide-react";
import { toast } from "sonner";

interface UtilizationHistoryTableProps {
  logs: any[];
}

export function UtilizationHistoryTable({ logs }: UtilizationHistoryTableProps) {
  return (
    <div className="space-y-4">
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
            {logs.map((log) => (
              <TableRow key={log._id}>
                <TableCell className="whitespace-nowrap">
                  {format(new Date(log.usageDate), "PP")}
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <p className="font-medium break-words">{log.receiptId?.materialName}</p>
                </TableCell>
                <TableCell className="font-mono text-[10px]">
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
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No utilization logs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
