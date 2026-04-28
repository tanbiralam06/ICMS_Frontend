"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Wifi, Plus, Trash2, Clock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { CompanyService } from "@/lib/services/company.service";

interface NetworkIpWhitelistProps {
  allowedIps: string[];
  updatedAt?: string;
  onSave: (ips: string[]) => Promise<void>;
}

export default function NetworkIpWhitelist({
  allowedIps: initialIps,
  updatedAt,
  onSave,
}: NetworkIpWhitelistProps) {
  const [ips, setIps] = useState<string[]>(initialIps || []);
  const [isManaging, setIsManaging] = useState(false);
  const [newIp, setNewIp] = useState("");
  const [myIp, setMyIp] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingMyIp, setLoadingMyIp] = useState(false);

  useEffect(() => {
    setIps(initialIps || []);
  }, [initialIps]);

  const fetchMyIp = async () => {
    setLoadingMyIp(true);
    try {
      const ip = await CompanyService.getMyIp();
      setMyIp(ip);
    } catch {
      toast.error("Could not detect your current IP");
    } finally {
      setLoadingMyIp(false);
    }
  };

  const handleStartManaging = () => {
    setIsManaging(true);
    fetchMyIp();
  };

  const handleAdd = async (ipToAdd: string) => {
    const trimmed = ipToAdd.trim();
    if (!trimmed) return;
    if (ips.includes(trimmed)) {
      toast.error("This IP is already whitelisted");
      return;
    }

    setSaving(true);
    try {
      const updated = [...ips, trimmed];
      await onSave(updated);
      setIps(updated);
      setNewIp("");
      toast.success("IP added to whitelist");
    } catch {
      toast.error("Failed to add IP");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ip: string) => {
    setSaving(true);
    try {
      const updated = ips.filter((i) => i !== ip);
      await onSave(updated);
      setIps(updated);
      toast.success("IP removed from whitelist");
    } catch {
      toast.error("Failed to remove IP");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Wifi className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Network IP Whitelist</CardTitle>
            <CardDescription>
              Employees on these networks can punch in without GPS
            </CardDescription>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
          {updatedAt && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
              <Clock className="h-3.5 w-3.5" />
              <span>Updated: {formatDate(updatedAt)}</span>
            </div>
          )}
          {!isManaging ? (
            <Button
              onClick={handleStartManaging}
              size="sm"
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-1" />
              Manage IPs
            </Button>
          ) : (
            <Button
              onClick={() => setIsManaging(false)}
              size="sm"
              variant="ghost"
              className="w-full sm:w-auto"
            >
              Done
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current device IP hint */}
        {isManaging && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm">
            <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 sm:mt-0" />
            <span className="text-muted-foreground">
              Your current device IP:{" "}
              {loadingMyIp ? (
                <span className="italic">detecting…</span>
              ) : myIp ? (
                <span className="font-mono font-medium text-foreground">
                  {myIp}
                </span>
              ) : (
                <span className="italic">unavailable</span>
              )}
            </span>
            {myIp && !ips.includes(myIp) && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs shrink-0"
                onClick={() => handleAdd(myIp)}
                disabled={saving}
              >
                Add This IP
              </Button>
            )}
            {myIp && ips.includes(myIp) && (
              <Badge variant="secondary" className="text-xs shrink-0">
                Already whitelisted
              </Badge>
            )}
          </div>
        )}

        {/* IP list */}
        {ips.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Wifi className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No IP addresses whitelisted</p>
            <p className="text-sm mt-1">
              {isManaging
                ? "Add an IP address below to allow office-network punch-in"
                : "Click 'Manage IPs' to configure network-based attendance"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {ips.map((ip) => (
              <div
                key={ip}
                className="flex items-center justify-between px-3 py-2 border rounded-lg"
              >
                <span className="font-mono text-sm">{ip}</span>
                {isManaging && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        disabled={saving}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove IP?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Remove <span className="font-mono">{ip}</span> from
                          the whitelist? Devices on this network will need GPS
                          to punch in.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(ip)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add new IP input */}
        {isManaging && (
          <div className="flex gap-2 pt-2">
            <Input
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              placeholder="e.g. 203.0.113.10"
              className="font-mono"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd(newIp);
                }
              }}
            />
            <Button
              onClick={() => handleAdd(newIp)}
              disabled={saving || !newIp.trim()}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
