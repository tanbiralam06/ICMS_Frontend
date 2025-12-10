"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check, X, Plus } from "lucide-react";

import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const leaveSchema = z.object({
  type: z.enum(["Sick", "Casual", "Earned", "Unpaid"]),
  fromDate: z.string(),
  toDate: z.string(),
  reason: z.string().min(5, "Reason is required"),
});

export default function LeavesPage() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch My Leaves
  const { data: myLeaves, isLoading: isLoadingMyLeaves } = useQuery({
    queryKey: ["leaves", "me"],
    queryFn: async () => {
      const res = await api.get("/leaves/me");
      return res.data;
    },
  });

  // Fetch Leave Balance
  const { data: balance } = useQuery({
    queryKey: ["leaves", "balance"],
    queryFn: async () => {
      const res = await api.get("/leaves/balance");
      return res.data;
    },
  });

  // Fetch Pending Approvals (for Managers/Admin)
  const { data: approvals } = useQuery({
    queryKey: ["leaves", "approvals"],
    queryFn: async () => {
      try {
        const res = await api.get("/leaves/pending");
        return res.data;
      } catch (err) {
        return { data: [] }; // Return empty if not authorized
      }
    },
    retry: false,
  });

  const form = useForm<z.infer<typeof leaveSchema>>({
    resolver: zodResolver(leaveSchema),
    defaultValues: {
      type: "Sick",
      reason: "",
    },
  });

  const applyLeaveMutation = useMutation({
    mutationFn: async (values: z.infer<typeof leaveSchema>) => {
      return await api.post("/leaves", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      setIsOpen(false);
      form.reset();
      toast.success("Leave application submitted");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to apply");
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.patch(`/leaves/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      toast.success("Leave request approved");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.patch(`/leaves/${id}/reject`, {
        reason: "Rejected by Manager",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      toast.success("Leave request rejected");
    },
  });

  const onSubmit = (values: z.infer<typeof leaveSchema>) => {
    applyLeaveMutation.mutate(values);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Leaves</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Apply Leave
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Apply for Leave</DialogTitle>
              <DialogDescription>Submit a new leave request.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Leave Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Sick">Sick Leave</SelectItem>
                          <SelectItem value="Casual">Casual Leave</SelectItem>
                          <SelectItem value="Earned">Earned Leave</SelectItem>
                          <SelectItem value="Unpaid">Unpaid Leave</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fromDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="toDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>To Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Reason for leave..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={applyLeaveMutation.isPending}>
                    {applyLeaveMutation.isPending
                      ? "Submitting..."
                      : "Submit Request"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {balance?.data &&
          Object.entries(balance.data).map(([type, days]: [string, any]) => (
            <Card key={type}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {type} Leave
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{days} Days</div>
              </CardContent>
            </Card>
          ))}
      </div>

      <Tabs defaultValue="my-leaves" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-leaves">My Leaves</TabsTrigger>
          {approvals?.data?.length > 0 && (
            <TabsTrigger value="approvals">
              Approvals{" "}
              <Badge variant="destructive" className="ml-2">
                {approvals.data.length}
              </Badge>
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="my-leaves" className="space-y-4">
          {myLeaves?.data?.map((leave: any) => (
            <Card key={leave._id}>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold">{leave.type} Leave</h3>
                    <Badge
                      variant={
                        leave.status === "Approved"
                          ? "default"
                          : leave.status === "Rejected"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {leave.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(new Date(leave.fromDate), "MMM do")} -{" "}
                    {format(new Date(leave.toDate), "MMM do, yyyy")} (
                    {leave.days} days)
                  </p>
                  <p className="text-sm mt-2">{leave.reason}</p>
                </div>
                {leave.status === "Rejected" && (
                  <div className="text-sm text-red-500">
                    Reason: {leave.rejectionReason}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {myLeaves?.data?.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No leave history found.
            </div>
          )}
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          {approvals?.data?.map((leave: any) => (
            <Card key={leave._id}>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold">{leave.userId?.fullName}</h3>
                    <Badge variant="outline">{leave.type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(new Date(leave.fromDate), "MMM do")} -{" "}
                    {format(new Date(leave.toDate), "MMM do, yyyy")} (
                    {leave.days} days)
                  </p>
                  <p className="text-sm mt-2">{leave.reason}</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600 border-green-200 hover:bg-green-50"
                    onClick={() => approveMutation.mutate(leave._id)}
                  >
                    <Check className="h-4 w-4 mr-1" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => rejectMutation.mutate(leave._id)}
                  >
                    <X className="h-4 w-4 mr-1" /> Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
