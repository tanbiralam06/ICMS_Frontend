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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, MoreHorizontal, Share2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface InventoryTableProps {
  items: any[];
  onUtilize: (item: any) => void;
  onViewHistory: (item: any) => void;
}

export function InventoryTable({
  items,
  onUtilize,
  onViewHistory,
}: InventoryTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Unique ID</TableHead>
            <TableHead>Material</TableHead>
            <TableHead>PO Tracking</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Person In-Charge</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item._id}>
              <TableCell className="font-mono text-[11px] font-bold">{item.uniqueId}</TableCell>
              <TableCell className="max-w-[200px]">
                <p className="font-semibold break-words">{item.receiptId?.materialName}</p>
                <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                  Initial: {item.receiptId?.totalUnits} {item.receiptId?.unitType}
                </p>
              </TableCell>
              <TableCell>
                <div className="text-[11px]">
                  <p className="font-medium text-blue-600">{item.receiptId?.poNumber || "No PO"}</p>
                  <p className="text-muted-foreground">
                    {item.receiptId?.poDate ? format(new Date(item.receiptId.poDate), "PP") : "N/A"}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={item.presentUnits > 0 ? "default" : "destructive"} className="whitespace-nowrap">
                  {item.presentUnits} {item.receiptId?.unitType}
                </Badge>
              </TableCell>
              <TableCell className="max-w-[150px] truncate" title={item.location}>
                {item.location}
              </TableCell>
              <TableCell className="max-w-[120px] truncate" title={item.personId?.fullName}>
                {item.personId?.fullName}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[160px] z-[9999]">
                    <DropdownMenuLabel>Item Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onUtilize(item)}
                      disabled={item.presentUnits === 0}
                      className="cursor-pointer"
                    >
                      <Share2 className="mr-2 h-4 w-4" /> Utilize
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onViewHistory(item)}
                      className="cursor-pointer text-blue-600 focus:text-blue-600"
                    >
                      <History className="mr-2 h-4 w-4" /> Details
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No items in inventory.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
