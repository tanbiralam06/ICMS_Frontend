"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { ReceiveItemForm } from "@/components/inventory/ReceiveItemForm";
import { UtilizeItemForm } from "@/components/inventory/UtilizeItemForm";
import { HistoryModal } from "@/components/inventory/HistoryModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UtilizationHistoryTable } from "@/components/inventory/UtilizationHistoryTable";
import { Download, History, PackageCheck, Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function InventoryPage() {
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [isUtilizeOpen, setIsUtilizeOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any>(null);

  // 1. Fetch Inventory List
  const { data: inventory, isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const res = await api.get("/inventory");
      return res.data;
    },
  });

  // 2. Fetch Global Utilization History
  const { data: globalHistory } = useQuery({
    queryKey: ["inventory", "global-history"],
    queryFn: async () => {
      const res = await api.get("/inventory/all-utilization");
      return res.data;
    },
  });

  // 3. Fetch Users for forms
  const { data: users } = useQuery({
    queryKey: ["users", "active"],
    queryFn: async () => {
      const res = await api.get("/users?status=active");
      return res.data;
    },
  });

  const [activeTab, setActiveTab] = useState("stock");

  const handleViewHistory = async (item: any) => {
    try {
      const res = await api.get(`/inventory/history/${item.uniqueId}`);
      setHistoryData(res.data);
      setIsHistoryOpen(true);
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  };

  const exportToCSV = () => {
    const logs = globalHistory || [];
    if (!logs.length) return toast.info("No data to export");
    
    const headers = ["Date", "Material Name", "Unique ID", "Units Used", "Utilized By", "Destination", "Purpose"];
    const rows = logs.map((log: any) => [
      format(new Date(log.usageDate), "yyyy-MM-dd"),
      log.receiptId?.materialName || "N/A",
      log.uniqueId,
      log.utilizedUnits,
      log.utilizerId?.fullName || "N/A",
      log.locationAtUsage || "N/A",
      log.description || "N/A"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row: string[]) => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `utilization_history_${format(new Date(), "yyyyMMdd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Exported successfully");
  };

  const activeUsers = users?.data?.users || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
          <p className="text-muted-foreground">Manage material receipts and track utilization lifecycle.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isReceiveOpen} onOpenChange={setIsReceiveOpen}>
            <DialogTrigger asChild>
              <Button variant="default">
                <Plus className="mr-2 h-4 w-4" /> Receive Items
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Receive Material Purchase</DialogTitle>
              </DialogHeader>
              <ReceiveItemForm
                users={activeUsers}
                onSuccess={() => setIsReceiveOpen(false)}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={isUtilizeOpen} onOpenChange={setIsUtilizeOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <PackageCheck className="mr-2 h-4 w-4" /> Log Usage
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Log Material Utilization</DialogTitle>
              </DialogHeader>
              <UtilizeItemForm
                inventoryItems={inventory || []}
                users={activeUsers}
                onSuccess={() => {
                   setIsUtilizeOpen(false);
                   setSelectedItem(null);
                }}
                selectedItem={selectedItem}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="stock">Current Stock</TabsTrigger>
            <TabsTrigger value="usage">Usage History</TabsTrigger>
          </TabsList>
          
          {activeTab === "usage" && (
             <Button variant="outline" size="sm" onClick={exportToCSV}>
               <Download className="mr-2 h-4 w-4" /> Export CSV
             </Button>
          )}
        </div>
        
        <TabsContent value="stock" className="mt-0">
          <InventoryTable
            items={inventory || []}
            onUtilize={(item) => {
              setSelectedItem(item);
              setIsUtilizeOpen(true);
            }}
            onViewHistory={handleViewHistory}
          />
        </TabsContent>

        <TabsContent value="usage" className="mt-0">
          <UtilizationHistoryTable logs={globalHistory || []} />
        </TabsContent>
      </Tabs>

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        data={historyData}
      />
    </div>
  );
}
