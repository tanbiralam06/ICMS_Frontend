"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarIcon, Loader2, PackageCheck, Users } from "lucide-react";
import { format } from "date-fns";

import api from "@/lib/api";
import { Button } from "@/components/ui/button";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { MultiFileUploader } from "../shared/MultiFileUploader";

const formSchema = z.object({
  date: z.date(),
  department: z.string().min(1, "Department is required"),
  contactPersonId: z.string().min(1, "Contact Person is required"),
  materialName: z.string().min(2, "Material name is required"),
  totalUnits: z.number().min(1, "Total units must be at least 1"),
  unitType: z.string().min(1, "Unit type is required"),
  invoiceAmount: z.number().optional(),
  location: z.string().min(2, "Location is required"),
  poDate: z.date().optional(),
  poNumber: z.string().optional(),
  miscellaneous: z.string().optional(),
  documents: z.array(z.string()),
});

type FormValues = {
  date: Date;
  department: string;
  contactPersonId: string;
  materialName: string;
  totalUnits: number;
  unitType: string;
  location: string;
  invoiceAmount?: number;
  poDate?: Date;
  poNumber?: string;
  miscellaneous?: string;
  documents: string[];
};

interface ReceiveItemFormProps {
  users: any[];
  onSuccess: () => void;
}

export function ReceiveItemForm({
  users,
  onSuccess,
}: ReceiveItemFormProps) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      department: "",
      contactPersonId: "",
      materialName: "",
      totalUnits: 0,
      unitType: "Units",
      location: "",
      invoiceAmount: 0,
      poDate: undefined,
      poNumber: "",
      miscellaneous: "",
      documents: [],
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      return api.post("/inventory/receive", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Item received successfully");
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to receive item");
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const onSubmit = (values: FormValues) => {
    setIsLoading(true);
    mutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="materialName"
            render={({ field }) => (
              <FormItem className="col-span-full">
                <FormLabel>Material Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter material name (e.g. Copper Cable)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="totalUnits"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Units</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unitType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit Type</FormLabel>
                <FormControl>
                  <Input placeholder="Units/Meters/etc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Storage Location</FormLabel>
                <FormControl>
                  <Input placeholder="Warehouse/Bin..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="mb-px">Date Received</FormLabel>
                <Popover modal={true}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="col-span-full border-b pb-1 mt-2">
            <h3 className="text-sm font-semibold text-muted-foreground">Administrative & PO Info</h3>
          </div>

          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <FormControl>
                  <Input placeholder="Department Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contactPersonId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Person</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="z-[9999]">
                    {users.map((user) => (
                      <SelectItem key={user._id} value={user._id}>{user.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="poNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PO Number</FormLabel>
                <FormControl>
                  <Input placeholder="ORD-XXXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="poDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="mb-px">PO Date</FormLabel>
                <Popover modal={true}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[9999]" align="end" side="top">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="invoiceAmount"
            render={({ field }) => (
              <FormItem className="col-span-full">
                <FormLabel>Invoice Amount (optional)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="miscellaneous"
            render={({ field }) => (
              <FormItem className="col-span-full">
                <FormLabel>Miscellaneous Notes</FormLabel>
                <FormControl>
                  <Textarea placeholder="Any extra information..." className="min-h-[100px] resize-none" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="documents"
            render={({ field }) => (
              <FormItem className="col-span-full">
                <FormLabel>Supporting Documents</FormLabel>
                <FormControl>
                  <MultiFileUploader
                    category="Inventory"
                    path={`inventory/receipts/${format(new Date(), "yyyy/MM")}`}
                    onUploadComplete={(ids) => field.onChange(ids)}
                    existingDocuments={[]}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => form.reset()}>Reset</Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Receipt
          </Button>
        </div>
      </form>
    </Form>
  );
}
