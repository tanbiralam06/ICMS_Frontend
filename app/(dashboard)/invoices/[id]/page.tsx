"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { InvoiceService } from "@/lib/services/invoice.service";
import { Loader2, Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { numberToWords } from "@/lib/utils";

export default function InvoiceViewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const data = await InvoiceService.getById(id as string);
        setInvoice(data);
      } catch (error) {
        console.error("Failed to fetch invoice", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-neutral-800" />
      </div>
    );
  if (!invoice)
    return (
      <div className="p-8 text-center text-red-500">Invoice not found</div>
    );

  const company = invoice.companyProfileSnapshot || {};

  const handlePrint = () => {
    window.print();
  };

  const getImageUrl = (path: string | null) => {
    if (!path) return undefined;
    if (path.startsWith("http")) return path;
    return `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}${path}`;
  };

  return (
    <div className="bg-neutral-100 min-h-screen p-8 print:p-0 print:bg-white flex flex-col items-center font-sans text-neutral-900">
      <style jsx global>{`
        @media print {
          @page {
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
      {/* Toolbar */}
      <div className="w-full max-w-[210mm] mb-6 flex justify-between items-center print:hidden">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button
          onClick={handlePrint}
          className="bg-neutral-900 text-white hover:bg-neutral-800"
        >
          <Printer className="mr-2 h-4 w-4" /> Print Invoice
        </Button>
      </div>

      {/* Invoice Container - A4 Size Fixed */}
      <div className="w-full max-w-[210mm] bg-white shadow-2xl print:shadow-none p-12 min-h-[297mm] print:min-h-0 relative">
        {/* 1. Header Section */}
        <div className="flex justify-between items-start border-b border-neutral-200 pb-8 mb-8">
          <div className="w-1/2">
            {company.logoUrl && (
              <img
                src={getImageUrl(company.logoUrl) || ""}
                alt="Company Logo"
                className="h-24 w-auto object-contain mb-4"
              />
            )}
            {/* Company Address Below Logo */}
            <div className="text-sm text-neutral-600 space-y-1">
              <h2 className="font-bold text-lg text-neutral-900">
                {company.companyName}
              </h2>
              <p className="whitespace-pre-wrap leading-relaxed">
                {company.address}
              </p>
              <p>
                <span className="font-medium text-neutral-800">GSTIN:</span>{" "}
                {company.gstin}
              </p>
              <p>
                <span className="font-medium text-neutral-800">CIN:</span>{" "}
                {company.companyId}
              </p>
            </div>
          </div>

          <div className="w-1/2 text-right">
            <h1 className="text-4xl font-light tracking-wide text-neutral-900 mb-2">
              TAX INVOICE
            </h1>
            <p className="text-neutral-500 text-sm mb-6">
              Original for Recipient
            </p>

            <div className="space-y-2 text-sm">
              <div className="flex justify-end gap-x-4">
                <span className="text-neutral-500 w-24">Invoice No:</span>
                <span className="font-bold text-neutral-900">
                  {invoice.invoiceNo}
                </span>
              </div>
              <div className="flex justify-end gap-x-4">
                <span className="text-neutral-500 w-24">Date:</span>
                <span className="font-medium text-neutral-900">
                  {format(new Date(invoice.date), "dd MMM yyyy")}
                </span>
              </div>
              <div className="flex justify-end gap-x-4">
                <span className="text-neutral-500 w-24">Due Date:</span>
                <span className="font-medium text-neutral-900">
                  {invoice.dueDate
                    ? format(new Date(invoice.dueDate), "dd MMM yyyy")
                    : "-"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Client Details Section */}
        <div className="flex justify-between items-start mb-12">
          <div className="w-1/2 pr-8">
            <h3 className="text-xs uppercase tracking-widest font-bold text-neutral-400 mb-2">
              Billed To
            </h3>
            <div className="text-sm text-neutral-800 space-y-1">
              <h4 className="font-bold text-lg">{invoice.customerName}</h4>
              <p className="whitespace-pre-wrap">{invoice.customerAddress}</p>
              {invoice.customerGstin && (
                <p className="mt-2">
                  <span className="font-medium text-neutral-600">GSTIN:</span>{" "}
                  {invoice.customerGstin}
                </p>
              )}
            </div>
          </div>
          <div className="w-1/2 pl-8 border-l border-neutral-200">
            <h3 className="text-xs uppercase tracking-widest font-bold text-neutral-400 mb-2">
              Shipped To
            </h3>
            <div className="text-sm text-neutral-800 space-y-1">
              {/* Assuming same as Addressed for now, can be different in model */}
              <h4 className="font-bold text-lg">{invoice.customerName}</h4>
              <p className="whitespace-pre-wrap">{invoice.customerAddress}</p>
              <p className="mt-2">
                <span className="font-medium text-neutral-600">
                  Place of Supply:
                </span>{" "}
                {invoice.placeOfSupply || "-"}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Items Table */}
        <div className="mb-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-neutral-900 text-neutral-900">
                <th className="py-3 text-left w-[5%]">#</th>
                <th className="py-3 text-left w-[45%]">Item Description</th>
                <th className="py-3 text-left w-[15%]">HSN/SAC</th>
                <th className="py-3 text-center w-[10%]">Qty</th>
                <th className="py-3 text-right w-[10%]">Rate</th>
                <th className="py-3 text-right w-[15%]">Amount</th>
              </tr>
            </thead>
            <tbody className="text-neutral-700">
              {invoice.items.map((item: any, index: number) => (
                <tr
                  key={index}
                  className="border-b border-neutral-100 last:border-0"
                >
                  <td className="py-4 font-medium text-neutral-400">
                    {index + 1}
                  </td>
                  <td className="py-4">
                    <p className="font-medium text-neutral-900">
                      {item.description}
                    </p>
                  </td>
                  <td className="py-4 text-neutral-500">
                    {item.hsnCode || "-"}
                  </td>
                  <td className="py-4 text-center">{item.quantity}</td>
                  <td className="py-4 text-right">
                    {item.rate.toLocaleString("en-IN")}
                  </td>
                  <td className="py-4 text-right font-medium text-neutral-900">
                    {item.amount.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4. Footer & Totals */}
        <div className="flex justify-between items-start pt-4 border-t-2 border-neutral-900">
          {/* Left: Amount in Words & Bank */}
          <div className="w-1/2 pr-8 space-y-8">
            <div>
              <h3 className="text-xs uppercase tracking-widest font-bold text-neutral-400 mb-1">
                Total in Words
              </h3>
              <p className="text-sm font-medium italic text-neutral-800 capitalize">
                {numberToWords(Math.round(invoice.totalAmount))} Rupees Only
              </p>
            </div>

            <div>
              <h3 className="text-xs uppercase tracking-widest font-bold text-neutral-400 mb-2">
                Bank Details
              </h3>
              <div className="text-sm space-y-1 text-neutral-700">
                <div className="flex">
                  <span className="w-24 text-neutral-500">Bank Name:</span>{" "}
                  <span className="font-medium">{company.bankName}</span>
                </div>
                <div className="flex">
                  <span className="w-24 text-neutral-500">Acc. Name:</span>{" "}
                  <span className="font-medium">
                    {company.accountHolderName}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-24 text-neutral-500">A/C No:</span>{" "}
                  <span className="font-mono font-medium">
                    {company.accountNumber}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-24 text-neutral-500">IFSC Code:</span>{" "}
                  <span className="font-mono font-medium">
                    {company.ifscCode}
                  </span>
                </div>
                {company.swiftCode && (
                  <div className="flex">
                    <span className="w-24 text-neutral-500">SWIFT:</span>{" "}
                    <span className="font-mono font-medium">
                      {company.swiftCode}
                    </span>
                  </div>
                )}
                <div className="flex">
                  <span className="w-24 text-neutral-500">Branch:</span>{" "}
                  <span className="font-medium">{company.branch}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Totals & Signature */}
          <div className="w-1/3">
            <div className="space-y-3 mb-10 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>Sub Total</span>
                <div>
                  ₹{" "}
                  {invoice.subTotal.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Tax Amount</span>
                <div>
                  ₹{" "}
                  {invoice.taxAmount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
              <div className="flex justify-between items-center text-lg font-bold text-neutral-900 pt-3 border-t border-neutral-200">
                <span>Total</span>
                <div>
                  ₹{" "}
                  {invoice.totalAmount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>

            <div className="text-right">
              {company.signatureUrl && (
                <img
                  src={getImageUrl(company.signatureUrl) || ""}
                  alt="Signature"
                  className="h-16 w-auto object-contain ml-auto mb-2"
                />
              )}
              <h4 className="font-bold text-sm text-neutral-900">
                {company.signatoryName}
              </h4>
              <p className="text-xs text-neutral-500 mt-1">
                Authorized Signatory
              </p>
            </div>
          </div>
        </div>
        <div className="text-xs text-neutral-400 pt-4">
          <p>Terms & Conditions: {company.termsUrl}</p>
        </div>
      </div>
    </div>
  );
}
