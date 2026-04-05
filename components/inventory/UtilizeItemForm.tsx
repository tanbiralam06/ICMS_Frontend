"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  uniqueId: z.string().min(1, "Item Reference is required"),
  unitsUsed: z.number().min(1, "Utilized units must be at least 1"),
  utilizerId: z.string().min(1, "Person is required"),
  description: z.string().min(2, "Description is required"),
  locationAtUsage: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface UtilizeItemFormProps {
  inventoryItems: any[];
  users: any[];
  onSuccess: () => void;
  selectedItem?: any;
}

export function UtilizeItemForm({
  inventoryItems,
  users,
  onSuccess,
  selectedItem,
}: UtilizeItemFormProps) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      uniqueId: selectedItem?.uniqueId || "",
      unitsUsed: 0,
      utilizerId: "",
      description: "",
      locationAtUsage: selectedItem?.location || "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      return api.post("/inventory/utilize", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Utilization logged successfully");
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to log utilization");
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  function onSubmit(values: FormValues) {
    setIsLoading(true);
    mutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="uniqueId"
            render={({ field }) => (
              <FormItem className="col-span-full">
                <FormLabel>Select Material to Utilize</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger disabled={!!selectedItem}>
                      <SelectValue placeholder="Search or select item..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-[300px] z-[9999]">
                    {inventoryItems.map((item) => (
                      <SelectItem key={item._id} value={item.uniqueId}>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] bg-muted px-1 rounded">{item.uniqueId}</span>
                          <span>{item.receiptId?.materialName}</span>
                          <span className="text-muted-foreground text-[10px]">({item.presentUnits} {item.receiptId?.unitType} available)</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unitsUsed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Units Used</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="utilizerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Utilized By</FormLabel>
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
            name="locationAtUsage"
            render={({ field }) => (
              <FormItem className="col-span-full">
                <FormLabel>Usage Site / Destination</FormLabel>
                <FormControl>
                  <Input placeholder="Where was this used?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="col-span-full">
                <FormLabel>Usage Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Purpose of utilization..." className="min-h-[100px] resize-none" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Usage
          </Button>
        </div>
      </form>
    </Form>
  );
}
