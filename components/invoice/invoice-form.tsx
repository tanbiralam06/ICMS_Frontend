"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, useWatch, Control } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { InvoiceService, InvoiceData } from "@/lib/services/invoice.service";
import { Separator } from "@/components/ui/separator";

// Helper to calculate total
const calculateRequestTotal = (items: any[], taxRate: number) => {
  const subTotal = items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.rate),
    0
  );
  const taxAmount = (subTotal * taxRate) / 100;
  const totalAmount = subTotal + taxAmount;
  return { subTotal, taxAmount, totalAmount };
};

export default function InvoiceForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InvoiceData>({
    defaultValues: {
      type: "TAX_INVOICE",
      items: [
        {
          description: "",
          quantity: 1,
          rate: 0,
          discountType: "FLAT",
          discountValue: 0,
          discountAmount: 0,
          amount: 0,
        },
      ],
      taxRate: 18, // Default GST
      subTotal: 0,
      taxAmount: 0,
      totalAmount: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // Watch items and tax rate for live calculations
  const items = useWatch({ control, name: "items" });
  const taxRate = useWatch({ control, name: "taxRate" });
  const discountType = useWatch({ control, name: "discountType" });
  const discountValue = useWatch({ control, name: "discountValue" });

  // Effect to update totals whenever items or tax changes
  useEffect(() => {
    let newSubTotal = 0;

    // Update line amounts and subtotal
    items.forEach((item, index) => {
      const qty = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      const baseAmount = qty * rate;

      // Calculate Item Discount
      let itemDiscountAmount = 0;
      const dValue = Number(item.discountValue) || 0;
      if (item.discountType === "PERCENTAGE") {
        itemDiscountAmount = (baseAmount * dValue) / 100;
      } else {
        itemDiscountAmount = dValue;
      }
      // Cap discount at base amount
      if (itemDiscountAmount > baseAmount) {
        itemDiscountAmount = baseAmount;
      }

      const netAmount = baseAmount - itemDiscountAmount;

      // Only update if value changed to avoid infinite loop
      if (
        item.amount !== netAmount ||
        item.discountAmount !== itemDiscountAmount
      ) {
        setValue(`items.${index}.amount`, netAmount);
        setValue(`items.${index}.discountAmount`, itemDiscountAmount);
      }
      newSubTotal += netAmount;
    });

    // Calculate Discount
    let newDiscountAmount = 0;
    const dValue = Number(discountValue) || 0;
    if (discountType === "PERCENTAGE") {
      newDiscountAmount = (newSubTotal * dValue) / 100;
    } else {
      newDiscountAmount = dValue;
    }

    // Ensure discount doesn't exceed subtotal
    if (newDiscountAmount > newSubTotal) {
      newDiscountAmount = newSubTotal;
    }

    const taxableValue = newSubTotal - newDiscountAmount;
    const newTaxAmount = (taxableValue * Number(taxRate)) / 100;
    const newTotalAmount = taxableValue + newTaxAmount;

    setValue("subTotal", newSubTotal);
    setValue("discountAmount", newDiscountAmount);
    setValue("taxAmount", newTaxAmount);
    setValue("totalAmount", newTotalAmount);
  }, [items, taxRate, discountType, discountValue, setValue]);

  const onSubmit = async (data: InvoiceData) => {
    setLoading(true);
    try {
      await InvoiceService.create(data);
      toast.success("Invoice created successfully");
      router.push("/invoices");
    } catch (error) {
      toast.error("Failed to create invoice");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Invoice Details */}
          <div>
            <h3 className="text-lg font-medium mb-4">Invoice Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="pb-2">Invoice Type</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...register("type")}
                >
                  <option value="TAX_INVOICE">Tax Invoice</option>
                  <option value="PROFORMA">Proforma Invoice</option>
                </select>
              </div>
              <div>
                <Label className="pb-2">Due Date</Label>
                <Input type="date" {...register("dueDate")} />
              </div>
              <div>
                <Label className="pb-2">Customer Name</Label>
                <Input
                  {...register("customerName", { required: true })}
                  placeholder="Client / Company Name"
                />
              </div>
              <div>
                <Label className="pb-2">GSTIN (Optional)</Label>
                <Input
                  {...register("customerGstin")}
                  placeholder="e.g. 29ABC..."
                />
              </div>
              <div className="md:col-span-2">
                <Label className="pb-2">Billing Address</Label>
                <Input
                  {...register("customerAddress", { required: true })}
                  placeholder="Full billing address"
                />
              </div>
              <div>
                <Label className="pb-2">Place of Supply</Label>
                <Input {...register("placeOfSupply")} placeholder="State" />
              </div>
            </div>
          </div>

          <Separator />

          {/* Items */}
          <div>
            <h3 className="text-lg font-medium mb-4">Items & Description</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-medium">
                  <tr>
                    <th className="p-3 w-[30%]">Description</th>
                    <th className="p-3 w-[15%]">HSN/SAC</th>
                    <th className="p-3 w-[10%]">Qty</th>
                    <th className="p-3 w-[15%]">Rate</th>
                    <th className="p-3 w-[20%]">Discount</th>
                    <th className="p-3 w-[15%] text-right">Amount</th>
                    <th className="p-3 w-[5%]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {fields.map((field, index) => (
                    <tr key={field.id}>
                      <td className="p-3">
                        <Input
                          {...register(`items.${index}.description` as const, {
                            required: true,
                          })}
                          placeholder="Item name"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          {...register(`items.${index}.hsnCode` as const)}
                          placeholder="1234"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          min="1"
                          {...register(`items.${index}.quantity` as const, {
                            required: true,
                            valueAsNumber: true,
                          })}
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          min="0"
                          {...register(`items.${index}.rate` as const, {
                            required: true,
                            valueAsNumber: true,
                          })}
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <select
                            className="w-12 h-9 rounded-md border border-input bg-background px-1 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            {...register(
                              `items.${index}.discountType` as const
                            )}
                          >
                            <option value="FLAT">₹</option>
                            <option value="PERCENTAGE">%</option>
                          </select>
                          <Input
                            type="number"
                            min="0"
                            className="w-20"
                            {...register(
                              `items.${index}.discountValue` as const,
                              { valueAsNumber: true }
                            )}
                          />
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        {/* Amount is read-only calculated */}
                        <div className="py-2 px-3 bg-slate-50 dark:bg-slate-950 border rounded text-right">
                          {watch(`items.${index}.amount`).toLocaleString(
                            "en-IN"
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                append({
                  description: "",
                  quantity: 1,
                  rate: 0,
                  discountType: "FLAT",
                  discountValue: 0,
                  discountAmount: 0,
                  amount: 0,
                })
              }
              className="mt-4"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>

          <Separator />

          {/* Summary */}
          <div className="flex justify-end">
            <div className="w-full md:w-1/2 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Sub Total</span>
                <span className="font-medium">
                  ₹
                  {watch("subTotal").toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Tax Rate (%)</span>
                  <Input
                    type="number"
                    className="w-16 h-8 text-right"
                    {...register("taxRate", { required: true })}
                  />
                </div>
                <span className="font-medium">
                  ₹
                  {watch("taxAmount").toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total</span>
                <span>
                  ₹
                  {watch("totalAmount").toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end pt-4">
            <Button type="submit" size="lg" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Generate Invoice
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
