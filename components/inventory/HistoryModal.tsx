import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}

export function HistoryModal({ isOpen, onClose, data }: HistoryModalProps) {
  if (!data) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Inventory History - {data.receipt?.uniqueId}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 bg-muted/30 p-4 rounded-lg gap-4 text-sm mt-4 border">
          <div className="col-span-2 border-b pb-2 mb-2">
            <h4 className="font-bold uppercase text-[10px] text-muted-foreground tracking-wider">Current Physical Status</h4>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Remaining Stock</p>
            <p className="font-bold text-lg text-primary">{data.stock?.presentUnits} {data.receipt?.unitType}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Current Location</p>
            <p className="font-semibold">{data.stock?.location || "N/A"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Person In-Charge</p>
            <p className="font-semibold">{data.stock?.personId?.fullName || "N/A"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Last Updated</p>
            <p className="font-semibold">{data.stock?.updatedAt && format(new Date(data.stock.updatedAt), "PPp")}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mt-6 px-1">
          <div className="col-span-2 border-b pb-1 mb-1">
            <h4 className="font-bold uppercase text-[10px] text-muted-foreground tracking-wider">Original Receipt Info</h4>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Material Name</p>
            <p className="font-semibold">{data.receipt?.materialName}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Receipt Date</p>
            <p className="font-semibold">{data.receipt?.date && format(new Date(data.receipt.date), "PPP")}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Origin Department</p>
            <p className="font-semibold">{data.receipt?.department}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">PO Tracking</p>
            <p className="font-semibold">{data.receipt?.poNumber || "N/A"}</p>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Utilization Logs</h3>
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full font-bold uppercase">
            Lifecycle History
          </span>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Date</TableHead>
              <TableHead>Units</TableHead>
              <TableHead>Utilizer</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Purpose</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.history?.map((log: any) => (
              <TableRow key={log._id}>
                <TableCell className="whitespace-nowrap">{format(new Date(log.usageDate), "PP")}</TableCell>
                <TableCell className="font-semibold text-orange-600">-{log.utilizedUnits}</TableCell>
                <TableCell className="whitespace-nowrap">{log.utilizerId?.fullName}</TableCell>
                <TableCell>{log.locationAtUsage}</TableCell>
                <TableCell className="max-w-[200px] truncate" title={log.description}>{log.description}</TableCell>
              </TableRow>
            ))}
            {data.history?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                  No utilization recorded yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}
